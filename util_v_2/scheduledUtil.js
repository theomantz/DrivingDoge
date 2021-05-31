const express = require('express')
const app = express();
const path = require('path')

const mongoose = require("mongoose")
const db = require('../config/keys').mongoURI;


mongoose
  .connect(db, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
  })
  .then(() => console.log('Connected to MongoDB Successfully through Scheduled'))
  .catch(err => console.log(err))

const generateQuery = require('./queryUtilByJson')

const defaultSearch = {
  queryString: "BTC",
  sort: "relevance",
  time: "hour",
  subreddit: {
    sort: "relevance",
    time: "hour",
    count: 2,
  },
  post: {
    sort: "relevance",
    time: "hour",
    count: 2,
  },
  comment: {
    sort: "relevance",
    time: "hour",
    count: 2
  },
};

console.log(generateQuery(defaultSearch))