// Have a route here by which users can generate queries using a new query utility
const Query = require('../../models/Query')
const validateQuery = require('../../validation/query')

const generateQuery = require('../../util_v_2/queryUtilByJson')

// DateTime
const DateTime = require('luxon')

const express = require('express')
const router = require('router')

const realtimeParams = {
  sort: 'relevance',
  time: 'day',
  subreddit: {
    limit: 5,
    time: "all",
    sort: "relevance",
  },
  post: {
    limit: 20,
    time: "week",
    sort: "relevance",
  },
  comment: {
    limit: 50,
    sort: "relevance",
  },
}

router.post('/', async (req, res) => {

  const { errors, isValid, asset } = validateQuery(req.body.query)

  if (!isValid) {
    return res.status(400).json(errors);
  }

  
  const { sort, time } = realtimeParams
  const today = new DateTime(Date.now())
  const cutoffDate = today.minus({ [time]: 1 })

  const potentialData = await Query.findOne({ 
    query: asset,
    createdAt: {
      $gte: cutoffDate.toISO(),
      $lt: today.toISO()
    },
    'params.time': time,
    'params.sort': sort
  }).exec()

  if( potentialData ) {
    return res.status(400).json('Query already exists')
  }

  let queryReqObject = realtimeParams
  queryReqObject.queryString = asset
  
  let resData = await generateQuery(queryReqObject)

  if(resData) {
    return res.status(200).json(resData)
  }
  
})