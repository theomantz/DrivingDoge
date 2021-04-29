const axios = require("axios");
const cheerio = require("cheerio");
const Query = require('../models/Query')
const Post = require('../models/Post');
const Subreddit = require('../models/Subreddit');

// Sample queryObject

/* const testingQueryObject = {
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
}; */


function constructPostsBySubreddit(queryObject) {
  const subredditIds = queryObject.subreddits
  const promises = []
  for (const id of subredditIds) {
    let promise = Subreddit.findById(id, function(err, subredditObject) {

      if(err) {
        
        console.log(err)

      } else if(!subredditObject) {
        console.log(subredditObject)
      } else {

        const { longLink } = subredditObject
        // console.log(subredditObject)
        let promise = getPosts(longLink, {
          query: queryObject.query, 
          subredditObject: subredditObject,
          queryObject: queryObject
        })
      }
    }).exec()
    promises.push(promise)
  }
  // console.log('returning queryObject from posts')
  // const updatedQuery = Query.findById(queryObject.id).exec()
  return Promise.allSettled(promises)
    .then(() => console.log('all posts updated'))
    .catch(err => console.log(err))
}

async function getPosts(baseUrl, params) {
  const URL = `${baseUrl}search?q=${params.query}&restrict_sr=1`;
  return await axios.get(URL)
    .then(async function(html) {
      let result = await parsePosts(html.data, params);
      console.log(`posts returned from parsePosts`)
      return result
    })
    .catch(err => console.log(err))
}

function parsePosts(html, params) {
  const postsObject = {};
  const { queryObject, subredditObject } = params
  const promises = [];
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
      // let upvotes = $(post).find('button.voteButton').siblings('div').text();
      let upvotes = $(post).find("button[aria-label='upvote']").siblings('div').text();
      postsObject[id] = {
        title: rawTitle[0],
        localId: id,
        subredditId: params.subredditObject.id,
        url: path,
        postTimeStamp: timestamp,
        upvotes: parseUpvotes(upvotes),
        commentCount: parseCommentNumber(commentCount),
        queries: params.queryObject.id
      }
      let promise = Post.findOneAndUpdate({localId: id}, postsObject[id], {upsert: true}).exec()
        .then( postObject => {
          queryObject.update({$push: { posts: postObject.id }})
          subredditObject.update({$push: {posts: postObject.id }})
          console.log('postObject updated')
        }).catch(err => console.log(err))
        promises.push(promise)
    }
  );
  return Promise.allSettled(promises)
    .then(() => {
      console.log('posts saved')
    }).catch(err => console.log(err))
}

function parseUpvotes(string) {
  if (string === '') return 0
  let abbreviation = string.slice(-1)
  const abbreviations = { k:1000, m:1000000 }
  if(Object.keys(abbreviations).includes(abbreviation)) {
    return parseFloat(string.slice(0, -1)) * abbreviations[string.slice(-1)]
  } else {
    return parseFloat(string)
  }
}

function parseCommentNumber(string) {
  if( string === '' ) return 0
  return parseInt(string.split(' ')[0])
}

module.exports = constructPostsBySubreddit

