const axios = require('axios');
const cheerio = require('cheerio');
const Query = require('../models/Query');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const processRedditPosts = require('../tensorflow/model')

function constructCommentsByPost(queryObject) {
  const postIds = queryObject.posts;
  for(const id of postIds) {
    Post.findById(id, (err, postObject) => {
      // get comments
      if(postObject) {
        getComments(postObject, queryObject)
      } else if (err) {
        console.log(err)
      }
    })
  }
}

async function getComments(postObject, queryObject) {
  // const { url } = postObject
  // const oldRedditUrl = "https://old." + url.split("https://www.")[1];
  // texting url:
  const oldRedditUrl = "https://old.reddit.com/r/litecoin/comments/muhe5j/crypto_is_officially_halal_i_went_to_my_favorite/"
  return await axios.get(oldRedditUrl)
    .then(html => {
      return parseComment(html.data, postObject, queryObject)
    }).catch(err => console.log(err))
}

function parseComment(html, postObject = null, queryObject = null) {
  const parentCommentObject = {}
  const $ = cheerio.load(html)
  const postComment = $('div#siteTable').children('div.thing')

  // console.log(postComment)

  const updatedPost = {
    subredditName: $(postComment).attr('data-subreddit'),
    author: $(postComment).attr('data-author'),
    postTimeStamp: parseTimestamp($(postComment).attr('data-timestamp')),
    promoted: ($(postComment).attr('data-promoted') === 'true'),
    upvotes: parseInt($(postComment).attr('data-score')),
    commentCount: parseInt($(postComment).attr('data-comments-count')),
  }

  
    
  
  
  $(html).find("div.sitetable.nestedlisting > div.thing.comment")
    .each((index, topLevelComment) => {


      
      // Parent topLevelComment object construction
      const parent = $(topLevelComment)
      .find('p.parent')
      .siblings('div.entry.unvoted').each( (i, comment) => {
              const cheerioTextNodes = $(comment)
                .find("div.usertext-body > div.md")
                .children("p")
                .text();
              const parentCommentObject = {
                postId: updatedPost.id,
                author: $(comment).find("a.author.may-blank").text(),
                upvotes: parseVotes($(comment).find("span.score.likes").text()),
                downvotes: parseVotes(
                  $(comment).find("span.score.dislikes").text()
                ),
                unvoted: parseVotes(
                  $(comment).find("span.score.unvoted").text()
                ),
                timestamp: $(comment)
                  .find("p.tagline > time")
                  .attr("datetime"),
                text: cheerioTextNodes,
                query: queryObject.id
              };
              console.log(parentCommentObject)
              const parentCommentDoc = new Comment(parentCommentObject)
              parentCommentDoc.save()
                .then(parentCommentDoc => {
                  commentIds.push(parentCommentDoc.id)
                }).catch(err => console.log(err))
      })
    });
    updatedPost.comments = commentIds
    let postObject = await postObject.update(updatedPost).exec()
    return await processRedditPosts(postObject)
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

return getComments(null, null)