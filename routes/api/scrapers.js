const express = require("express")
const router = express.Router();
const getSubreddits = require("../../util/subredditUtil");



router.post("/:subreddit", (req, res) => {
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

module.exports = router;
