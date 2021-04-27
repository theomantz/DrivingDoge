const express = require('express');
const app = express();
const path = require('path')
const getSubreddits = require('./web_scrapers/subredditScraper');
const admin = require('firebase-admin');
const serviceAccount = require('./config/firebase_credentials.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://drivingdoge-default-rtdb.firebaseio.com",
});


app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, './src/index.html'))
})

// const db = admin.firestore();
app.post('subreddits/:subreddit', (req, res) => {
  console.log(req.params)
  const subredditsObject = getSubreddits(req.params.subreddit)
  const subReddits = db.collection('subreddits')
  Object.keys(subredditsObject).forEach(subreddit => {
    subReddits.doc(subreddit).set(subReddits[subreddit], { merge: true })
      .then( () => res.status(200).json('success'))
      .catch( err => res.status(400).json(err))
  })
})


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(__dirname)
  console.log(`listening on ${PORT}`)
})