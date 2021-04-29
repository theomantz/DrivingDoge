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
  
  console.log('request received')
  
  const { errors, isValid, asset } = validateQueryInput(req.params.query);
  
  console.log(`query params ${isValid}`)

  if(!isValid) {
    return res.status(400).json(errors)
  }

  console.log(asset)

  let queryObject = await Query.findOne({query: asset}, async function(err, queryDoc) {
    if(err) {
      return console.log(err)
    } else if (!queryDoc) {
      return await new Query({query: asset}).save().exec()
    } else {
      return queryDoc
    }
  })

  console.log(queryObject.query)

  let queryObjectSubreddits = constructSubredditsByQuery(queryObject).then(obj => {
    Query.findById(queryObject.id).then(obj => {
      console.log(obj)
      constructPostsBySubreddit(obj).then(obj => {
        console.log(`returning object from construct posts ${obj}`)
      })
    }).catch(err => console.log(err))

  }).catch(err => console.log(err))
  
  /* .then(doc => {
    console.log('queryDoc received from subreddits')
    console.log(doc)
    return doc
  }).catch(err => console.log(err)) */


  // let queryObject = Query.findOne({query: asset})
  //   .then(queryObject => {
  //       if(!queryObject) {
  //         console.log(`generating new query`)
  //         newQuery = new Query({
  //           query: asset
  //         })
  //         newQuery.save()
  //         .then(query => {
  //           console.log('query saved')
  //           queryObject = query
  //         })
  //       }
  //       getSubreddits(asset)
  //         .then((subredditsObject) => {
  //           Object.keys(subredditsObject).forEach((subreddit) => {
  //             Subreddit.findOneAndUpdate(
  //               {
  //                 shortLink: subredditsObject[subreddit].shortLink,
  //               },
  //               {
  //                 longLink: subredditsObject[subreddit].link,
  //                 subCount: subredditsObject[subreddit].subCount,
  //                 $push: {
  //                   queries: queryObject.id,
  //                 },
  //               },
  //               {
  //                 upsert: true,
  //               }
  //             ).then((subredditModelObject) =>{
  //               console.log(subredditModelObject)
  //               subredditModelObject.save()
  //                 .then(object => queryObject.updateOne( 
  //                   {$push:{ subreddits: object.id }}
  //               ))
  //             });
  //           });
  //         })
  //         .catch((err) => console.log(err));
  //         queryObject.save()
  //           .then( queryObject => {
  //             constructPostsBySubreddit(queryObject)
  //               .then( queryObject => {
  //                 console.log('passing query to comments')
  //                 constructCommentsByPost(queryObject)
  //                   .then( queryObject => {
  //                     console.log('sending query response')
  //                     res.status(200).json(queryObject) 
  //                   })
  //                 }
  //               ) 
  //           })
  //   })
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