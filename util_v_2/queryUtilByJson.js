/* 
Query generation file. Performs all get requests, HTML parsing, generation etc.
 */

// Dependencies
const axios = require("axios");
const cheerio = require("cheerio");
const { DateTime } = require("luxon");

// Mongoose Models
const Query = require("../models/Query");
const Post = require("../models/Post");
const Comment = require("../models/Comment");
const Subreddit = require("../models/Subreddit");

// TensorFlow Model
const processRedditPosts = require("../tensorflow/model");

// Validation / Utilties
const validateQueryInput = require("../validation/query");
const constructQueryForResponse = require("./constructResponse");

// Sample query request object to demonstrate structure
/* 
  queryRequestObject = {
    queryString: <asset string>,
    params: {
      subreddit: {
        sort: <relevance, hot, top, new>
        time: <hour, day, week, month, all>
        count: <number of subs to limit>
      },
      posts: {
        sort: <relevance, hot, top, new>
        time: <hour, day, week, month, all>
        count: <number of posts to limit>
      },
      comments: {
        sort: <relevance, hot, top, new>
        time: <hour, day, week, month, all>
        count: <number of comments to limit>
      },
    }
  }
 */

async function generateQuery(queryRequestObject) {
  const { queryString } = queryRequestObject;

  const { asset, isValid, errors } = validateQueryInput(queryString);

  if (!isValid) {
    return console.log(errors);
  }

  const { sort, time, subreddit, post, comment } = queryRequestObject;

  const options = {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:78.0) Gecko/20100101 Firefox/78.0",
    },
  };

  let searchHTML = await axios
    .get(
      `https://old.reddit.com/search/?q=${asset}&t=${time}&sort=${sort}&type=sr`,
      options
    )
    .catch((e) => console.log(e));

  let today = new DateTime(Date.now());
  let cutoffDate = today.minus({ [time]: 1 });

  let queryDocument = await Query.findOne({
    query: asset,
    createdAt: {
      $gte: cutoffDate.toISO(),
      $lt: today.toISO(),
    },
    "params.time": time,
    "params.sort": sort,
    "params.subreddit.count": subreddit.count,
    "params.post.count": post.count,
    "params.comment.count": comment.count,
  }).exec();

  if (!queryDocument) {
    queryDocument = new Query({
      query: asset,
      params: queryRequestObject,
    });

    queryDocument = await queryDocument.save();
  }
  if (searchHTML.status === 200) {
    let query = await constructSubreddits(queryDocument, searchHTML);
    return await constructQueryForResponse(query);
  } else {
    return null;
  }
}

async function fetch(url) {
  return await axios
    .get(url)
    .then((res) => res)
    .catch((e) => {
      console.log(e);
      return e;
    });
}

async function constructSubreddits(queryDocument, searchHTML) {
  const {
    params: {
      subreddit: { count },
    },
  } = queryDocument;

  const $ = cheerio.load(searchHTML.data);

  const subredditDivs = $("div.search-result-subreddit");
  let queryDoc;
  for (let i = 0; i < count && i < subredditDivs.length; i++) {
    const el = subredditDivs[i];

    const meta = $(".search-result-meta", el);
    const body = $(".search-result-body", el);

    const shortLink = $(".search-subreddit-link", meta).text();
    const subCountString = $(".search-subscribers", meta).text();
    const subCount = parseInt(
      subCountString.split("members")[0].replace(",", "")
    );

    let subredditDocument = await Subreddit.findOne({
      shortLink: shortLink,
    }).exec();

    if (!subredditDocument) {
      subredditDocument = new Subreddit({
        shortLink: shortLink,
        longLink: $(".search-subreddit-link", meta).attr("href"),
        description: $(body).text(),
      });

      subredditDocument = await subredditDocument.save();
    }

    subredditDocument.subCount = subCount || 0;
    subredditDocument.queries.push(queryDocument.id);

    let subReddit = await subredditDocument.save();

    queryDocument.subreddits.push(subReddit.id);
    queryDoc = await queryDocument.save();

    await constructPosts(subReddit, queryDoc);
  }

  return queryDoc;
}

async function constructPosts(subReddit, queryDocument) {
  const {
    query,
    params: {
      post: { sort, time, count },
    },
  } = queryDocument;
  let postIds = [];

  let URL = `${subReddit.longLink}search/?q=${query}&restrict_sr=on&sort=${sort}&t=${time}`;

  let subRedditHTML = await fetch(URL);

  if (subRedditHTML.status !== 200) return subRedditHTML;

  const $ = cheerio.load(subRedditHTML.data);
  const postResults = $(".contents .search-result");
  if (!postResults.length) return null;
  let promises = [];

  for (let i = 0; i < count && i < postResults.length; i++) {
    const el = postResults[i];

    const title = $(".search-title.may-blank", el).text();

    let post = await Post.findOne({ title: title }).exec();

    if (!post) {
      post = new Post({
        title: title,
        subredditRef: subReddit.id,
        subredditName: subReddit.shortLink,
        localId: $(el).attr("data-fullname"),
        url: $(".search-title.may-blank", el).attr("href"),
        author: $(".search-author .author.may-blank", el).text(),
      });
    }

    try {
      let postURL = `${$(".search-title.may-blank", el).attr("href")}.json`;
      let postJSON = await fetch(postURL);

      if (postJSON.status !== 200) return postJSON;

      post.upvotes = postJSON.data[0].data.children[0].data.ups;
      post.commentCount = postJSON.data[0].data.children[0].data.num_comments;

      if (post.commentCount) {
        let savedPost = await post.save();
        subReddit.posts.push(savedPost.id);
        postIds.push(savedPost.id);
        await subReddit.save();
        post = await constructTopLevelComments(
          postJSON.data[1].data,
          savedPost
        );
        if (post.comments.length) {
          await processRedditPosts(post);
        }
      }
    } catch (e) {
      console.log(e);
    }
  }

  queryDocument.posts.addToSet(...postIds);
  return await queryDocument.save();
}

async function constructTopLevelComments(data, post) {
  let topLevelComments = data.children;
  const commentIds = [];
  for (let i = 0; i < topLevelComments.length; i++) {
    let c = topLevelComments[i].data;
    if (c.body) {
      try {
        let saved = await Comment.findOneAndUpdate(
          {
            commentId: c.id,
          },
          {
            author: c.author,
            authorId: c.author_fullname,
            commentId: c.id,
            upvotes: c.ups,
            downvotes: c.downs,
            timestamp: c.created_utc,
            text: c.body,
            postId: post.id,
          },
          {
            upsert: true,
            new: true,
          }
        ).exec();

        commentIds.push(saved.id);
      } catch (e) {
        console.log(e);
      }
    }
    if (typeof c.replies === "object") {
      await constructTopLevelComments(c.replies.data, post);
    }
  }
  if (commentIds.length) {
    post.comments.addToSet(...commentIds);
  }
  return await post.save();
}

module.exports = generateQuery;
