const express = require('express');
const app = express();
const path = require('path');

// Scrapers Route - maybe use?
const scrapers = require('./routes/api/scrapers');

// Depreciated scraper in favor of 'constructXByY' architecture
// const getSubreddits = require('./web_scrapers/subredditScraper')

// Scraper utilities
const constructSubredditsByQuery = require('./util/subredditUtil')
const constructPostsBySubreddit = require('./util/postUtil')
const constructCommentsByPost = require('./util/commentUtil')


// Mongoose models
const Subreddit = require('./models/Subreddit');
const Query = require('./models/Query');

// Validators
const validateQueryInput = require('./validation/query');

app.use(express.static('src'))
app.use(scrapers)

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, './src/index.html'))
})

// Database Setup

const mongoose = require('mongoose');
const db = require('./config/keys').mongoURI;


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

app.get("/query/:query", async (req, res) => {
  
  
  
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

    let queryObjectSub = await constructSubredditsByQuery(queryObject)
    console.log(queryObjectSub)
    
    let queryObjectPost = await constructPostsBySubreddit(queryObjectSub)
    console.log(queryObjectPost)
    
    let queryObjectComment = await constructCommentsByPost(queryObjectPost)
    console.log(queryObjectComment)
    
    res.status(200).json(queryObjectComment);
    
  } catch (err) {

    console.log(err)

  }

})

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(__dirname)
  console.log(`listening on ${PORT}`)
})