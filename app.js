const express = require('express');
const app = express();
const path = require('path');


// Depreciated scraper in favor of 'constructXByY' architecture
// const getSubreddits = require('./web_scrapers/subredditScraper')

// Scraper utilities
const constructSubredditsByQuery = require('./util/subredditUtil')
const constructPostsBySubreddit = require('./util/postUtil')
const constructCommentsByPost = require('./util/commentUtil')

// Response utility
const constructQueryForResponse = require('./util/queryUtil')

// Query API
const query = require('./routes/api/data')

app.use('/api/asset', query)

// Mongoose models
const Query = require('./models/Query');

// Validators
const validateQueryInput = require('./validation/query');

app.use(express.static('public'))

app.get('/', (req, res) => {
  console.log('request', req)
  res.sendFile(path.join(__dirname, './public/index.html'))
})

// Database Setup

const mongoose = require('mongoose');
const db = require('./config/keys');


mongoose
  .connect(db, { 
    useNewUrlParser: true, 
    useUnifiedTopology: true, 
    useFindAndModify: false 
  })
  .then(() => console.log("Connected to MongoDB Successfully"))
  .catch((err) => console.log(err));

// Singular Route: builds query object, passes queryObject to each util
// Returns completed queryDoc


/* app.post("/query/:query", async (req, res) => {
  
  
  
  const { errors, isValid, asset } = validateQueryInput(req.params.query);
  
  

  if(!isValid) {
    return res.status(400).json(errors)
  }

  
  let queryObject = await Query.findOneAndUpdate({
    query: asset
  }, {
    query: asset
  }, {
    upsert: true, new: true
  })

  try {

    const queryObjectSub = await constructSubredditsByQuery(queryObject)
  
    const queryObjectPost = await constructPostsBySubreddit(queryObjectSub)
    
    const queryObjectComment = await constructCommentsByPost(queryObjectPost)

    const queryObjectResponse = await constructQueryForResponse(queryObjectComment)
    
    
    res.status(200).json(queryObjectResponse);
    
  } catch (err) {

    console.log(err)
    res.status(400).json(err)

  }

}) */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {

  console.log(`listening on ${PORT}`)
})