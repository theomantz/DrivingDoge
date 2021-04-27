const express = require('express');
const app = express();
const path = require('path');
const scrapers = require('./routes/api/scrapers');
const getSubreddits = require('./web_scrapers/subredditScraper')
const Subreddit = require('./models/Subreddit');

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

app.get("/scrapers/:subreddit", (req, res) => {
  let subredditsObject
  getSubreddits(req.params.subreddit)
    .then(subredditsObject => {
        Object.keys(subredditsObject).forEach((subreddit) => {
          Subreddit.findOneAndUpdate(
            {
              shortLink: subredditsObject[subreddit].shortLink,
            },
            {
              subCount: subredditsObject[subreddit].subCount,
              $push: { queryParams: subredditsObject[subreddit].queryParams },
            },
            {
              upsert: true,
            }
          )
        });
    }).then(res.json(subredditsObject).status(200)).catch(err => console.log(err))
})

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(__dirname)
  console.log(`listening on ${PORT}`)
})