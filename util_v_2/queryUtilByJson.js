const axios = require('axios')
const cheerio = require('cheerio')
const Query = require('../models/Query')
const Post = require('../models/Post')
const Comment = require('../models/Comment')
// const processRedditPosts = require('../tensorflow/model')
const validateQueryInput = require('../validation/query')
const Subreddit = require('../models/Subreddit')
const constructPostsBySubreddit = require('../util/postUtil')

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
 
 const { queryString }  = queryRequestObject
  
 const {asset, isValid, errors} = validateQueryInput(queryString)


 if(!isValid) {
   return console.log(errors)
 }

 const {
   params: {
     sort,
     time
   }
 } = queryRequestObject

 const options = {
   headers: {
     "User-Agent":
       "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:78.0) Gecko/20100101 Firefox/78.0",
   },
 };

 let searchHTML = await axios.get(
   `https://old.reddit.com/search/?q=${asset}&t=${time}&sort=${sort}&type=sr`,
    options
 );

 let queryDocument = new Query({
   query: asset,
   rawRequest: queryRequestObject,
 })

 queryDocument = await queryDocument.save()

 await constructSubreddits(queryDocument, searchHTML)
  
}

async function constructSubreddits(queryDocument, searchHTML) {

  const { rawRequest: {
    params: { 
      subreddit: {
        count
      }
     }
  } } = queryDocument

  const $ = cheerio.load(searchHTML.data)

  const subredditDivs = $('div.search-result-subreddit')
  
  for(let i = 0 ; i < count && i < subredditDivs.length ; i++ ) {

    const el = subredditDivs[i]

    const meta = $('.search-result-meta', el)
    const body = $('.search-result-body', el)

    console.log('line 98', el)

    const shortLink = $(".search-subreddit-link", meta).text();
    const subCountString = $(".search-subscribers", meta).text()
    const subCount = parseInt(subCountString.split('members')[0].replace(',', ''))
    
    let subredditDocument = await Subreddit.findOne({ shortLink: shortLink }).exec()

    if(!subredditDocument) {

      subredditDocument = new Subreddit({ 
        shortLink: shortLink,
        longLink: $('.search-subreddit-link', meta).attr('href'),
        description: $(body).text()
      })

    }

    subRedditDocument.subCount = subCount
    subRedditDocument.queries.push(queryDocument.id)
    
    let subReddit = await subredditDocument.save()

    let queryDoc = await queryDocument.subreddits.push(subReddit.id).save()

    

    await constructPosts(subReddit, queryDoc)
    
  }
  
}

async function constructPosts(subReddit, queryDocument) {

  const {
    queryString,
    params: {
      post: {
        sort,
        time,
        count
      }
    }
  } = queryDocument
  
  let URL = `${subReddit.longLink}/search/?q=${queryString}&restrict_sr=on&sort=${sort}&t=${time}`

  
  let subRedditHTML = await axios.get(URL)

  const $ = cheerio.load(subRedditHTML.data)

  const postResults = $('.contents .search-result')

  for(let i = 0; i < count && i < postResults.length ; i++ ) {

    const el = postResults[i]
    
    const title = $('.search-title.may-blank', el).text()

    let post = await Post.findOne({ title: title }).exec()

    let url
    if(!post) {
      url = 
      post = new Post({
        title: title,
        subredditRef: subReddit.id,
        subredditName: subReddit.shortLink,
        localId: $(el).attr('data-fullname'),
        url: $('.search-title.may-blank', el).attr('href'),
        author: $('.search-author .author.may-blank', el).text(),
      })
    }

    let URL = `${$('.search-title.may-blank').attr('href')}.json`
    let postJSON = await axios.get(URL)

  }



  
}



module.exports = generateQuery;