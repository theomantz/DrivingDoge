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
  queryString: "DOGE",
  sort: "relevance",
  time: "week",
  subreddit: {
    sort: "relevance",
    time: "week",
    count: 10,
  },
  post: {
    sort: "relevance",
    time: "week",
    count: 100,
  },
  comment: {
    sort: "relevance",
    time: "week",
    count: 100
  },
};

const result = async () => {
  let query = await generateQuery(defaultSearch)
  console.log('done')
  console.log(query)
  process.exit()
}

result()