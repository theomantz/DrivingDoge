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

  const sentimentScore = (averageScore) => {
    if (averageScore > SentimentBounds.positive) {
      return "positive";
    } else if (averageScore > SentimentBounds.neutral) {
      return "neutral";
    } else {
      return "negative";
    }
  };

  queryObject.averageScore = averageScore
  queryObject.sentimentScore = sentimentScore(averageScore)

  
  let queryDoc = await queryObject.save()

  let queryDocPopulate = await Query.findById(queryDoc.id)
    .populate({
      path: "subreddits",
      select: "shortLink subCount description averageScore sentimentScore",
      populate: {
        path: "posts",
        select:
          "title subredditName upvotes commentCount averageScore sentimentScore",
      },
    })

    const resQuery = {
      title: queryDocPopulate.query,
      sentimentScore: queryDocPopulate.sentimentScore,
      averageScore: queryDocPopulate.averageScore,
      timeFrame: queryDocPopulate.params.post.time,
      subreddits: queryDocPopulate.subreddits,
    }

  return resQuery
  
}

async function updateSubs(subredditIds) {

  const promises = [];

  for(const id of subredditIds) {

    
    
    try {

      let score = 0

      const subreddit = await Subreddit
      .findById(id)
      .populate("posts", "averageScore")
      
      subreddit.posts.forEach((post) => {
        score += post.averageScore || 0
      })
      
      let averageScore = parseFloat((score / subreddit.posts.length).toFixed(4)) || 0
      
      let sentimentScore
      
      if(averageScore > SentimentBounds.positive) {
        sentimentScore = 'positive'
      } else if (averageScore > SentimentBounds.neutral) {
        sentimentScore = 'neutral'
      } else {
        sentimentScore = 'negative'
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

module.exports = constructQueryForResponse