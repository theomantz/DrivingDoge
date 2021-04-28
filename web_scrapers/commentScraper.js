const axios = require('axios');
const cheerio = require('cheerio');
const Query = require('../models/Query');
const Post = require('../models/Post');
const Comment = require('../models/Comment');

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
  const commentObject = {}
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

  console.log(updatedPost)

  $(html).find("div.thing.comment").each((index, comment) => {
      console.log(comment);
      // Parent comment object construction
      const parent = $(comment).find('p.parent').siblings('div.entry.unvoted')
      const cheerioTextNodes = $(parent)
        .find('div.usertext-body > div.md')
        .children('p')
      const parentCommentObject = {
        postId: updatedPost.id,
        author: $(parent).find('a.author.may-blank').text(),
        upvotes: parseVotes($(parent).find('span.score.likes')).text(),
        downvotes: parseVotes($(parent).find('span.score.dislikes')).text(),
        unvoted: parseVotes($(parent).find('span.score.unvoted')).text(),
        commentTimeStamp: $(parent).find('p.tagline > time').attr('datetime'),
        commentText: parseText(cheerioTextNodes)
      }

      const parentCommentDoc = new Comment(parentCommentObject)
      parentCommentDoc.save()
        .then(parentCommentDoc => {

          console.log(parentCommentDoc)
          
          
        })

    });
  
  // postObject.update(updatedPost).exec()
  //   .then(postObject => {

  //   })
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
  let userText = ''
  $(cheerioObject).each( pElement => {
    
  })
}

return getComments(null, null)