const axios = require('axios');
const cheerio = require('cheerio');
const Query = require('../models/Query');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const processRedditPosts = require('../tensorflow/model')

function constructCommentsByPost(queryObject) {
  const postIds = queryObject.posts;
  const promises = [];
  for(const id of postIds) {
    let promise = Post.findById(id, async function(err, postObject) {
      // get comments
      if(postObject) {
        return await getComments(postObject, queryObject)
      } else if (err) {
        return console.log(err)
      }
    })
    promises.push(promise)
  }
  return Promise.allSettled(promises)
    .then(() => {
      return console.log('Comments updated')
    })
    .catch(err => {
      return console.log(err)
    })
}

async function getComments(postObject, queryObject) {
  const { url } = postObject
  const oldRedditUrl = "https://old." + url.split("https://www.")[1];
  // texting url:
  // const oldRedditUrl = "https://old.reddit.com/r/litecoin/comments/muhe5j/crypto_is_officially_halal_i_went_to_my_favorite/"
  return await axios.get(oldRedditUrl)
    .then( async function(html) {
      return await parseComment(html.data, postObject, queryObject)
    }).catch(err => console.log(err))
}

function parseComment(html, postObject = null, queryObject = null) {
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
  const promises = []
  $(html).find("div.sitetable.nestedlisting > div.thing.comment")
    .each((index, topLevelComment) => {


      
      // Parent topLevelComment object construction
      const parent = $(topLevelComment)
      .find('p.parent')
      .siblings('div.entry.unvoted').each( async function(i, comment) {
              let authorIdString = $(comment).find('a.author.may-blank').attr('class')
              if(!authorIdString) {
                // console.log(authorIdString)
                authorIdString = ''
              }
              const authorId = authorIdString.substring(
                authorIdString.indexOf("id-")
              );
              const commentId = $(comment).find('form.usertext > input[name="thing_id"]').attr('value')
              const localId = authorId.concat(commentId)
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
                unvoted: parseVotes(
                  $(comment).find("span.score.unvoted").text()
                ),
                timestamp: $(comment)
                  .find("p.tagline > time")
                  .attr("datetime"),
                text: cheerioTextNodes,
                query: queryObject.id
              };
              // console.log(parentCommentObject)
              if(parentCommentObject.text) {
                // console.log(parentCommentDoc)
                const promise = Comment.findOneAndUpdate({})
                //  const promise = Comment.findOneAndUpdate({
                //    authorId: authorId, 
                //    commentId: commentId
                //   }, parentCommentObject, 
                //    {upsert: true,
                //     new: true}
                //    )
                //    .then(async function (parentCommentDoc) {
                //      console.log(`comment added to post and query`);
                //      return await Post.findOneAndUpdate(
                //        { id: parentCommentDoc.postId },
                //        { $push: { comments: parentCommentDoc.id } },
                //        { new: true }
                //      ).then(async function (updatedPost) {
                //          return await Query.findOneAndUpdate(
                //            { id: queryObject.id },
                //            { $push: { comments: parentCommentDoc.id } }
                //          ).then(() => console.log(`all updated`))
                //           .catch((err) => console.log(err));
                //        }).catch((err) => console.log(err));
                //    }).catch((err) => console.log(err));
                //  promises.push(promise);
              }
      })
    });
    return Promise.allSettled(promises)
    .then(async function() {
        return await Post.findOneAndUpdate(
          {id: postObject.id}, 
          updatedPost, 
          {new: true}
          ).then( async (updatedPostObject) => {
            const postObjects = await processRedditPosts(postObject)
            console.log(postObjects)
          }).catch(err => console.log(err))
      }).catch(err => console.log(err))
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