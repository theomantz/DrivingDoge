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

    let response = constructResponse(resData);

    return res.status(200).json(response);

  } catch (err) {

    console.log(err)

    return res.status(400).json(err)

  }
  
  
});

function constructResponse(resData) {

  let totalSubs = 0

  const response = {
    name: resData.query.split('+')[0],
    data: {
      sentimentScore: resData.sentimentScore,
      averageScore: resData.averageScore,
      timeFrame: resData.params.post.time,
      createdAt: resData.createdAt,
      updatedAt: resData.updatedAt
    },
    value: 0,
    children: []
  }

  resData.subreddits.forEach((sub, i) => {
    totalSubs += sub.subCount
    if(sub.subCount && sub.posts.length) {

      response.children.push({
        name: sub.shortLink,
        data: {
          averageScore: sub.averageScore,
          sentimentScore: sub.sentimentScore
        },
        value: sub.subCount,
        children: []
      })
      
      let index = response.children.length - 1
      
      sub.posts.forEach(post => {

        if(post.commentCount) {
          response.children[index].children.push({
            name: post.title.replace(/\_/, ' '),
            data: {
              upvotes: post.upvotes,
              commentCount: post.commentCount,
              averageScore: post.averageScore,
              sentimentScore: post.sentimentScore
            },
            value: (post.commentCount * post.upvotes)
          })
        }
        
      })
        
    }
  })

  response.value = totalSubs

  resData.totalSubs = totalSubs

  resData.save()

  return response

  
}


module.exports = router;
