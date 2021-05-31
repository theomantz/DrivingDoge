const axios = require('axios')
const cheerio = require('cheerio')
const Query = require('../models/Query')
const Post = require('../models/Post')
const Comment = require('../models/Comment')
const processRedditPosts = require('../tensorflow/model')
const validateQueryInput = require('../validation/query')
const Subreddit = require('../models/Subreddit')
const { DateTime } = require('luxon')

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
  sort,
  time,
  subreddit,
  post,
  comment
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

 let today = new DateTime(Date.now())
 let cutoffDate = today.minus({ [time]: 1 })

 let queryDocument = await Query.findOne({
   query: asset, 
   createdAt: { 
     $gte: cutoffDate.toISO(),
     $lt: today.toISO()
    }, 
    'params.time': time,
    'params.sort': sort,
    'params.subreddit.count': subreddit.count,
    'params.post.count': post.count,
    'params.comment.count': comment.count,
  }).exec()

  console.log(queryDocument)
  
  if(!queryDocument) {
    
    queryDocument = new Query({
      query: asset,
     params: queryRequestObject,
   })

   queryDocument = await queryDocument.save()
   
   
  }
  
  return await constructSubreddits(queryDocument, searchHTML)

  
}

async function constructSubreddits(queryDocument, searchHTML) {

  const { 
    params: { 
      subreddit: {
        count
      }
    } 
  } = queryDocument

  const $ = cheerio.load(searchHTML.data)

  const subredditDivs = $('div.search-result-subreddit')
  
  for(let i = 0 ; i < count && i < subredditDivs.length ; i++ ) {

    const el = subredditDivs[i]

    const meta = $('.search-result-meta', el)
    const body = $('.search-result-body', el)

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

      subredditDocument = await subredditDocument.save()

    }

    subredditDocument.subCount = subCount
    subredditDocument.queries.push(queryDocument.id)
    
    let subReddit = await subredditDocument.save()

    queryDocument.subreddits.push(subReddit.id)
    let queryDoc = await queryDocument.save()

    

    await constructPosts(subReddit, queryDoc)
    
  }
  
}

async function constructPosts(subReddit, queryDocument) {

  const {
    query,
      params: {
        post: {
          sort,
          time,
          count
        }
      }
  } = queryDocument
  
  let URL = `${subReddit.longLink}search/?q=${query}&restrict_sr=on&sort=${sort}&t=${time}`
  let subRedditHTML = await axios.get(URL)

  const $ = cheerio.load(subRedditHTML.data)
  const postResults = $('.contents .search-result')

  for(let i = 0; i < count && i < postResults.length ; i++ ) {

    const el = postResults[i]
    
    const title = $('.search-title.may-blank', el).text()

    let post = await Post.findOne({ title: title }).exec()

    if(!post) {
      post = new Post({
        title: title,
        subredditRef: subReddit.id,
        subredditName: subReddit.shortLink,
        localId: $(el).attr('data-fullname'),
        url: $('.search-title.may-blank', el).attr('href'),
        author: $('.search-author .author.may-blank', el).text(),
      })
    }

    let postURL = `${$('.search-title.may-blank', el).attr('href')}.json`
    let postJSON = await axios.get(postURL)

    post.JSONpost = postJSON
    post.upvotes = postJSON.data[0].data.children[0].data.ups;
    post.commentCount = postJSON.data[0].data.children[0].data.num_comments;

    try {

      if( post.commentCount ) {
        let savedPost = await post.save()
        await subreddit.posts.push(savedPost.id)
        await constructTopLevelComments(postJSON[1], savedPost)
      }

    } catch (e) {
      console.log(e)
    }

    await processRedditPosts(post)
    
  }
}

async function constructTopLevelComments(data, post) {
  let topLevelComments = data.children
  topLevelComments.forEach(comment => {
    let c = comment.data
    try {

      let saved = await Comment.findOneAndUpdate({
        commentId: c.id
      }, {
        author: c.author, authorId: c.author_fullname,
        commentId: c.id, upvotes: c.ups, downvotes: c.downs,
        timestamp: c.created_utc, text: c.body, JSONComment: c
      }, {
        upsert: true,
        new: true
      }).exec()

      post.comments.push(saved.id)

    } catch (e) {
      console.log(e)
    }
    if(typeof c.replies === Object) {
      constructTopLevelComments(c.replies.data)
    } else {
      return null
    }
  })
}




module.exports = generateQuery;