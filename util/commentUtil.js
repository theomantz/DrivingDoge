const axios = require('axios');
const cheerio = require('cheerio');
const Query = require('../models/Query');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const processRedditPosts = require('../tensorflow/model')

async function constructCommentsByPost(queryObject) {

  const postIds = queryObject.posts;

  const promises = [];
  
  for(const id of postIds) {

    try {

      const postObject = await Post.findById(id)

      const updatedQueries = await getComments(postObject, queryObject)

      promises.push(updatedQueries)

    } catch (err) {
      
      console.log(err)
      
    }

  }

  return Promise.all(promises)
    .then(queries => queries.pop())
    .catch(err => console.log(err))
}

async function getComments(postObject, queryObject) {

  const { url } = postObject

  if( !url ) {
    console.log(postObject.localId)
  } else {
    const oldRedditUrl = "https://old." + url.split("https://www.")[1];

    try {
      const html = await axios.get(oldRedditUrl);
      const commentsResult = await parseComment(
        html.data,
        postObject,
        queryObject
      );
      

      queryObject.comments.push({ $each: commentsResult });

      const queryDoc = queryObject.save();

      return queryDoc;
    } catch (err) {
      console.log(err);
    }
  }
}

function parseComment(html, postObject, queryObject) {

  const $ = cheerio.load(html)
  const postComment = $('div#siteTable').children('div.thing')
  const promises = [];

  postObject.subredditName = $(postComment).attr('data-subreddit')
  postObject.author = $(postComment).attr('data-author')
  postObject.postTimeStamp = parseTimestamp($(postComment).attr('data-timestamp'))
  postObject.promoted = ($(postComment).attr('data-promoted') === 'true')
  postObject.upvotes = parseInt($(postComment).attr('data-score'))
  postObject.commentCount = parseInt($(postComment).attr('data-comments-count'))


  
  $(html)
    .find("div.sitetable.nestedlisting > div.thing.comment")
    .each((index, topLevelComment) => {
      
      // Parent topLevelComment object construction

      const parent = $(topLevelComment)
        .find("p.parent")
        .siblings("div.entry.unvoted")
        .each((i, comment) => {
          let authorIdString = $(comment)
            .find("a.author.may-blank")
            .attr("class");

          if (!authorIdString) {
            authorIdString = "";
          }

          const authorId = authorIdString.substring(
            authorIdString.indexOf("id-")
          );

          const commentId = $(comment)
            .find('form.usertext > input[name="thing_id"]')
            .attr("value");
          const localId = authorId.concat(commentId);

          const cheerioTextNodes = $(comment)
            .find("div.usertext-body > div.md")
            .children("p")
            .text();

          const parentCommentObject = {
            postId: postObject.id,
            author: $(comment).find("a.author.may-blank").text(),

            authorId: authorId,
            commentId: commentId,
            upvotes: parseVotes($(comment).find("span.score.likes").text()),

            downvotes: parseVotes(
              $(comment).find("span.score.dislikes").text()
            ),

            unvoted: parseVotes($(comment).find("span.score.unvoted").text()),

            timestamp: $(comment).find("p.tagline > time").attr("datetime"),

            text: cheerioTextNodes,
            query: queryObject.id,
          };

          if (parentCommentObject.text 
            && parentCommentObject.upvotes ) {
            const promise = Comment.findOneAndUpdate(
              {
                authorId: authorId,
                commentId: commentId,
              },
                parentCommentObject,
              {
                new: true,
                upsert: true,
              }
            ).exec()
              .then((comment) => {
                return comment;
              })
              .catch((err) => console.log(err));

            promises.push(promise);
          }
        });
    });

  return Promise.allSettled(promises).then((commentDocArray) => {
    let commentIds = commentDocArray.map((com) => {
      if (com.value) {
        return com.value.id;
      }
    });

    postObject.comments.push({$each: commentIds})

    let returnComments = postObject.save().then((postDoc) => {
      processRedditPosts(postDoc)
      return commentIds
    })

    return returnComments

  });
}

function parseTimestamp(timestamp) {
  if( timestamp === '' ) return null
  const time = `${new Date(parseInt(timestamp))}`;
  return time
}

function parseVotes(string) {
  if( string === '' ) return 0
  const factors = { 'k':1000 , 'm':1000000 }
  const abbrv = string.slice(-1)
  if(abbrv === 'k' || abbrv === 'm') {
    return parseFloat(string.slice(0, -1)) * factors[abbrv]
  } else {
    return parseInt(string)
  }
}

function parseText(cheerioObject) {
  console.log(typeof cheerioObject)
  let userText = ''
  $(cheerioObject).each( function() {
    userText += $(this).text()
  })
  return userText
}

module.exports = constructCommentsByPost;