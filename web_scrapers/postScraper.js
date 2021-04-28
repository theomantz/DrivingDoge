const axios = require("axios");
const { ObjectId } = require("bson");
const cheerio = require("cheerio");
const Post = require('../models/Post');
const Subreddit = require('../models/Subreddit');

const queryObject = {
  subreddits: [
    "608854c13220ea9cd552648c",
    "608854c13220ea9cd5526481",
    "608854c13220ea9cd55264b2",
    "608854c13220ea9cd5526499",
    "608854c13220ea9cd55264bf",
    "608854c13220ea9cd55264c6",
    "608854c13220ea9cd55264eb",
    "608854c13220ea9cd552650f",
    "608854c13220ea9cd5526509",
    "608854c13220ea9cd5526505",
    "608854c13220ea9cd55264e5",
    "608854c13220ea9cd552651f",
    "608854c13220ea9cd5526501",
    "608854c13220ea9cd552650a",
    "608854c13220ea9cd55264d9",
    "608854c13220ea9cd5526531",
    "608854c13220ea9cd5526536",
    "608854c13220ea9cd552651e",
    "608854c13220ea9cd552655a",
    "608854c13220ea9cd5526560",
    "608854c13220ea9cd5526547",
    "608854c13220ea9cd5526555",
    "608854c13220ea9cd5526554",
    "608854c13220ea9cd5526568",
    "608854c13220ea9cd552656a",
  ],
  posts: [],
  Comments: [],
  _id: "608880b7fae938a54c30cd4c",
  query: "crypto",
  __v: 0,
};


async function subredditIterator(queryObject) {
  const subredditIds = queryObject.subreddits
  subredditIds.forEach(id => {
    console.log(id)
    console.log(new ObjectId(id))
    Subreddit.findById(new ObjectId(id))
      .then(subredditObject => {
        const { longLink } = subredditObject
        console.log(subredditObject)
        getPosts(longLink, {query: queryObject.query, queryId: id })
      }).catch(err => console.log(err))
  })
}

async function getPosts(baseUrl, param) {
  const URL = `${baseUrl}search?q=${param.query}&restrict_sr=1`;
  return await axios.get(URL)
    .then(html => {
      return parsePosts(html.data, param);
    })
    .catch(err => console.log(err))
}

function parsePosts(html, param) {
  const postsObject = {};
  const $ = cheerio.load(html);
  $('div[data-click-id="body"]').each((index, post) => {
      let partialPath = $(post).find('a[data-click-id="body"]').attr('href')
      let rawTitle = partialPath.split('/').slice(-2, -1)
      const path = `https://www.reddit.com${partialPath}`;
      let splitPath = partialPath.split('/')
      const id = `${splitPath[2]}_${splitPath[4]}`
      let div = $(post).children('div').toArray()[1]
      let timestamp = $(div).find('a[data-click-id="timestamp"]').text()
      let commentCount = $(post).find('.icon-comment').siblings('span').text()
      let upvotes = $(post).find('button.voteButton').siblings('div').text();
      postsObject[id] = {
        title: rawTitle[0],
        subredditId: param.id,
        url: path,
        postTimeStamp: timestamp,
        upvotes: parseUpvotes(upvotes),
        commentCount: parseCommentNumber(commentCount)
      }
    }
  );
  return postsObject
}

function parseUpvotes(string) {
  let abbreviation = string.slice(-1)
  const abbreviations = { k:1000, m:1000000 }
  if(Object.keys(abbreviations).includes(abbreviation)) {
    return parseFloat(string.slice(0, -1)) * abbreviations[string.slice(-1)]
  } else {
    return parseFloat(string)
  }
}

function parseCommentNumber(string) {
  return parseInt(string.split(' ')[0])
}

let testObject = {
  subreddits: ["608854c13220ea9cd552648c"],
  id: "608880b7fae938a54c30cd4c",
  query: "crypto",
};

return subredditIterator(testObject);
