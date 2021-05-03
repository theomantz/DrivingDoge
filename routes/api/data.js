const express = require("express")
const router = express.Router();
const Query = require("../../models/Query");
const validateQuery = require('../../validation/query')



router.get("/:query", async (req, res) => {

  try {
    const { errors, isValid, asset } = validateQuery(req.params.query);

    if (!isValid) {
      return res.status(400).json(errors);
    }

    let resData = await Query.findOne({ query: asset })
      .populate({
        path: "subreddits",
        select: "shortLink subCount description averageScore sentimentScore",
        populate: {
          path: "posts",
          select: "title upvotes commentCount averageScore sentimentScore",
        },
      });

    let queriesAll = await Query.find({}, (err, queries) => {
      return queries
    })

    let response = constructResponse(resData);

    queriesAll.forEach(q => {
      response.data.available.push(q.query)
    })

    return res.status(200).json(response);

  } catch (err) {

    console.log(err)

    return res.status(400).json(err)

  }
  
  
});

function constructResponse(resData) {

  let totalSubs = 0
  let value = 0



  const response = {
    name: resData.query,
    data: {
      sentimentScore: resData.sentimentScore,
      averageScore: resData.averageScore,
      timeFrame: resData.params.post.time,
      createdAt: resData.createdAt,
      updatedAt: resData.updatedAt,
      totalSubs: 0,
      available: [],
    },
    value: 0,
    children: []
  }

  resData.subreddits.forEach((sub, i) => {

    
    if(sub.subCount && sub.posts.length) {
      
      totalSubs += sub.subCount
      
      response.children.push({

        name: sub.shortLink,
        data: {
          averageScore: sub.averageScore,
          sentimentScore: sub.sentimentScore
        },
        value: 0,
        children: []

      })
      
      let index = response.children.length - 1

      let commentPostSum = 0
      
      sub.posts.forEach(post => {

        if(post.commentCount) {

          value += (post.commentCount + post.upvotes)

          response.children[index].children.push({
            name: post.title.replace(/\_/, ' '),
            data: {
              sub: sub.shortLink,
              upvotes: post.upvotes,
              commentCount: post.commentCount,
              averageScore: post.averageScore,
              sentimentScore: post.sentimentScore
            },
            value: (post.commentCount + post.upvotes)
          })
          
        }
        commentPostSum += post.commentCount + post.upvotes;
      })
      response.children[index].value = commentPostSum
    }
  })

  response.value = value
  console.log(totalSubs)
  response.data.totalSubs = totalSubs

  resData.totalSubs = totalSubs

  resData.save()

  return response

  
}


module.exports = router;
