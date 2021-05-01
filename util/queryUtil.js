const Post = require('../models/Post');
const Query = require('../models/Query');
const Subreddit = require('../models/Subreddit');

const SentimentBounds = {
  positive: 0.66,
  neutral: 0.33,
  negative: 0,
};

async function constructQueryForResponse(queryObject) {

  let scoreArray = await updateSubs(queryObject.subreddits)

  let totalScore = scoreArray.reduce((acc, cur) => acc + cur)

  let averageScore = parseFloat((totalScore / scoreArray.length).toFixed(4))

  let sentimentScore = (averageScore) => {
    if (averageScore > SentimentBounds.positive) {
      return "positive";
    } else if (averageScore > SentimentBounds.neutral) {
      return "neutral";
    } else {
      return "negative";
    }
  };

  queryObject.averageScore = averageScore
  queryObject.sentimentScore = sentimentScore

  
  let queryDoc = queryObject.save()

  return queryDoc.populate({
    path: 'subreddits',
    select: [
      'shortLink',
      'subCount',
      'description',
      'averageScore',
      'sentimentScore'
    ]
  }).populate({
    path: 'posts',
    select: [
      'title',
      'subredditName',
      'upvotes',
      'commentCount',
      'averageScore',
      'sentimentScore'
    ]
  }).populate({
    path: 'comments',
    select: [
      'text',
      'upvotes',
      'downvotes',
      'unvoted',
      'sentimentScore',
      'commentSentiment'
    ]
  }).populateExec()
  
}

async function updateSubs(subredditIds) {

  const promises = [];

  for(const id in subredditIds) {

    let score
    
    try {

      const subreddit = await Subreddit
      .findById(id)
      .populate("posts", "averageScore")
      
      subreddit.posts.forEach(post => {
        score += post.averageScore
      })
      
      let averageScore = parseFloat((score / subreddit.posts.length).toFixed(4))
      
      let sentimentScore = averageScore => {
        if(averageScore > SentimentBounds.positive) {
          return 'positive'
        } else if (averageScore > SentimentBounds.neutral) {
          return 'neutral'
        } else {
          return 'negative'
        }
      }
      
      subreddit.averageScore = averageScore
      subreddit.sentimentScore = sentimentScore
      
      let promise = subreddit.save()
      
      promises.push(promise)

    }  catch (err) {

      console.log(err)

    } 

  }

  return Promise.all(promises)
    .then(subArray => subArray.map(sub => sub.averageScore))
    .catch(err => console.log(err))


}

module.export = constructQueryForResponse