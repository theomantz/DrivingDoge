const express = require("express")
const router = express.Router();
const getSubreddits = require("./web_scrapers/subredditScraper");
const Subreddit = require('../../models/Subreddit')
const Post = require('../../models/Post')
const Comment = require('../../models/Comment')


router.post("subreddits/:subreddit", (req, res) => {
  console.log(req.params);
  const subredditsObject = getSubreddits(req.params.subreddit);
  const subReddits = db.collection("subreddits");
  Object.keys(subredditsObject).forEach((subreddit) => {
    subReddits
      .doc(subreddit)
      .set(subReddits[subreddit], { merge: true })
      .then(() => res.status(200).json("success"))
      .catch((err) => res.status(400).json(err));
  });
});
