const tf = require('@tensorflow/tfjs-node')
const axios = require('axios')
const { v4: uuidv4 } = require('uuid')

const SpellChecker = require('spellchecker')
const Comment = require('../models/Comment')
const Post = require('../models/Post')
const Query = require('../models/Query')
const Subreddit = require('../models/Subreddit')
const { comment } = require('../config/searchConfig')



const HostedUrls = {
  model:
    "https://storage.googleapis.com/tfjs-models/tfjs/sentiment_cnn_v1/model.json",
  metadata:
    "https://storage.googleapis.com/tfjs-models/tfjs/sentiment_cnn_v1/metadata.json",
};

// const LocalUrls = {
//   model: "./resources/model.json",
//   metadata: "./resources/metadata.json",
// }

const SentimentRange = {
  positive: 0.66,
  neutral: 0.33,
  negative: 0,
}

let model
let metadata
let postObject
let urls

const PadIndex = 0;
let OOVIndex = 2;

function initialize() {
  // if(typeof window === 'undefined') {
  //   urls = require('../config/urls');
  // } else if(window.location.hostname === 'localhost') {
  //   urls = require("../config/urls");
  // } else {
  //   urls = HostedUrls
  // }
}


async function setupTfModels() {
  if(typeof model === 'undefined') {
    model = await loadModel(HostedUrls.model)
  }
  if(typeof metadata === 'undefined') {
    metadata = await loadMetaData(HostedUrls.metadata)
  }
}

async function loadModel(url) {
  try {
    const model = await tf.loadLayersModel(url);
    return model;
  } catch(err) {
    console.log(err)
  }
}

async function loadMetaData(url) {
  try {
    const metadata = await axios.get(url).then(res => res.data)
    return metadata
  } catch (err) { 
    console.log(err)
  }
}

function padSequences(
  sequences,
  maxLen,
  padding = "pre",
  truncating = "pre",
  value = PadIndex
) {
  
  return sequences.map((seq) => {
    // Perform truncation.
    if (seq.length > maxLen) {
      if (truncating === "pre") {
        seq.splice(0, seq.length - maxLen);
      } else {
        seq.splice(maxLen, seq.length - maxLen);
      }
    }

    // Perform padding.
    if (seq.length < maxLen) {
      const pad = [];
      for (let i = 0; i < maxLen - seq.length; ++i) {
        pad.push(value);
      }
      if (padding === "pre") {
        seq = pad.concat(seq);
      } else {
        seq = seq.concat(pad);
      }
    }

    return seq;
  });
}

function assignSentimentScore(text) {
  const inputTextArray = sanitizeText(text)
  const indexSequence = [].concat(inputTextArray.map(word => {
    let normalWord = normalizeWord(word)
    let wordIndex = metadata.word_index[normalWord] + metadata.index_from
    if( wordIndex > metadata.vocabulary_size || isNaN(wordIndex)) {
      wordIndex = OOVIndex
    }
    return wordIndex
  }))

  const paddedIndexSequence = padSequences([indexSequence], metadata.max_len)
  const input = tf.tensor2d(paddedIndexSequence, [1, metadata.max_len])

  const predict = model.predict(input);

  const score = predict.dataSync()[0]
  predict.dispose()

  return score
}

function sanitizeText(text) {
  let textArray = text
    .trim()
    .toLowerCase()
    .replace(/(\.|\,|\!|\?|\#)/g, "")
    .replace(/(\$)/g, " dollars ")
    .split(" ")
  return textArray.map(word => word.trim())
}

function normalizeWord(word) {
  const mispelled = SpellChecker.isMisspelled(word)
  if( !mispelled ) return word
  const options = SpellChecker.getCorrectionsForMisspelling(word);
  return options.length === 0 ? word : options[0]
}

function processRedditPosts(postObject) {
  
  initialize()
  const promises = [];
  const comments = postObject.comments
  if(!comments) return console.log('no comments')
  postObject = postObject
  
  setupTfModels().then( async (model, postObject) => {

    let commentScoreSum = 0
    
    for(const id of comments) {

      try {

        const comment = await Comment.findById(id).exec()
        
        const commentText = comment.text.replace(/(\.|\,|\!)/g, "");
        
        const sentimentScore = assignSentimentScore(commentText);

        commentScoreSum += sentimentScore
        
        let commentSentiment = ''
        
        if( sentimentScore > SentimentRange.positive ) {
          commentSentiment = 'positive'
        } else if ( sentimentScore > SentimentRange.neutral ) {
          commentSentiment = 'neutral'
        } else {
          commentSentiment = 'negative'
        }

        comment.sentimentScore = sentimentScore
        comment.commentSentiment = commentSentiment

        let promise = comment.save()
        promises.push(promise)
        
      } catch (err) {

        console.log(err)
        
      }
    }

    return Promise.all(promises).then( async (commentArray) => {

      let SentimentBounds = {
        positive: 0.66,
        neutral: 0.33,
        negative: 0,
      };
      
      let id = commentArray.pop().postId
      let postObject = await Post.findById(id)
      
      const averageScore = parseFloat((commentScoreSum / comments.length).toFixed(10))

      postObject.averageScore = averageScore || 0

      if (averageScore > SentimentBounds.positive) {
        averageSentiment = "positive";
      } else if (averageScore > SentimentBounds.neutral) {
        averageSentiment = "neutral";
      } else {
        averageSentiment = "negative";
      }

      postObject.averageSentiment
      
      postObject.save().then(() => {

        return postObject
      })
    })
  })


  
}

module.exports = processRedditPosts