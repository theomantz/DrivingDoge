const axios = require("axios");
const cheerio = require("cheerio");
const Query = require('../models/Query')
const Post = require('../models/Post');
const Subreddit = require('../models/Subreddit');


async function constructPostsBySubreddit(queryObject) {

  const subredditIds = queryObject.subreddits
  
  const promises = []

  for (const id of subredditIds) {

    try {
      
      const subredditObject = await Subreddit.findById(id)
      
      const { longLink } = subredditObject
      
      const buildPosts = await getPosts(longLink, {
          query: queryObject.query, 
          subredditObject: subredditObject,
          queryObject: queryObject
        })

      promises.push(buildPosts)

    } catch (err) {
      
      console.log(err)
      
    }


  }

  return Promise.allSettled(promises)
    .then(() => {
      return console.log('all posts updated')
    })
    .catch(err => {
      return console.log(err)
    })
}

async function getPosts(baseUrl, params) {
  const URL = `${baseUrl}search?q=${params.query}&restrict_sr=1`;

  try {

    const html = await axios.get(URL)
    const result = await parsePosts(html.data, params)
    return result
    
  } catch (err) {
    
    console.log(err)

  }
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
      let promise = Post.findOneAndUpdate({localId: id}, postsObject[id], {upsert: true})
        .then(async function(postObject) {
          return await Query
            .findOneAndUpdate(
              {id: queryObject.id}, 
              {$push: { posts: postObject.id }}, 
              {new: true}
            )
            .then(async function(query) {
              return await Subreddit
                .findOneAndUpdate(
                  {id: subredditObject.id},
                  { $push: { posts: postObject.id } },
                  { new: true }
                )
                .then((obj) => {
                  console.log(`updated query ${query}`);
                  console.log(`updated subobj ${obj}`);
                  console.log("postObject updated");
                })
                .catch((err) => console.log(err));
            }).catch(err => console.log(err))
          
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

