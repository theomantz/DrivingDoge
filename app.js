const express = require('express');
const app = express();
const path = require('path');

// Scrapers Route - maybe use?
const scrapers = require('./routes/api/scrapers');

// Scraper utilities
const getSubreddits = require('./web_scrapers/subredditScraper')

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

app.get("/query/:query", (req, res) => {
  console.log('request received')
  const { errors, isValid, asset } = validateQueryInput(req.params.query);
  console.log(`query params ${isValid}`)
  if(!isValid) {
    return res.status(400).json(errors)
  }
  console.log(asset)
  Query.findOne({query: asset})
    .then(queryObject => {
        if(!queryObject) {
          console.log(`generating new query`)
          newQuery = new Query({
            query: asset
          })
          newQuery.save()
          .then(query => {
            console.log('query saved')
            queryObject = query
          })
        }
        getSubreddits(asset)
          .then((subredditsObject) => {
            Object.keys(subredditsObject).forEach((subreddit) => {
              Subreddit.findOneAndUpdate(
                {
                  shortLink: subredditsObject[subreddit].shortLink,
                },
                {
                  longLink: subredditsObject[subreddit].link,
                  subCount: subredditsObject[subreddit].subCount,
                  $push: {
                    queries: queryObject.id,
                  },
                },
                {
                  upsert: true,
                }
              ).then((subredditModelObject) =>{
                subredditModelObject.save()
                  .then(object => queryObject.updateOne( 
                    {$push:{ subreddits: object.id }}
                ))
              });
            });
          })
          .catch((err) => console.log(err));
          queryObject.save()
            .then( queryObject => res.status(200).json(queryObject) )
    })
})

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(__dirname)
  console.log(`listening on ${PORT}`)
})