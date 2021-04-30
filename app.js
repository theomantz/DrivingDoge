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

app.get("/query/:query", async (req, res) => {
  
  
  
  const { errors, isValid, asset } = validateQueryInput(req.params.query);
  
  

  if(!isValid) {
    return res.status(400).json(errors)
  }

  

  let queryObject = await Query.findOne({query: asset}, async function(err, queryDoc) {
    if(err) {
      return console.log(err)
    } else if (!queryDoc) {
      return await new Query({query: asset}).save().exec()
    } else {
      return queryDoc
    }
  })

  // console.log(queryObject.query)

  constructSubredditsByQuery(queryObject).then(obj => {
      constructPostsBySubreddit(obj).then(obj => {
          constructCommentsByPost(obj).then(obj => {
            res.status(200).json('query complete')
          }).catch(err => console.log(err))
      }).catch(err => console.log(err))
  }).catch(err => console.log(err))
  
})

app.get('/query2/:subredditId', async (req, res) => {
  let testObject = {
    subreddits: ["608854c13220ea9cd552648c"],
    id: "608880b7fae938a54c30cd4c",
    query: "crypto",
  }
  const postsObject = constructPostsBySubreddit(testObject)

  console.log(postsObject)
    // .then(postsObject => console.log(postsObject))
})

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(__dirname)
  console.log(`listening on ${PORT}`)
})