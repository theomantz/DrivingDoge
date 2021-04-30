const tf = require('@tensorflow/tfjs')
const axios = require('axios')
const { v4: uuidv4 } = require('uuid')
const SpellChecker = require('spellchecker')
const Comment = require('../models/Comment')
const Post = require('../models/Post')
const Query = require('../models/Query')
const Subreddit = require('../models/Subreddit')



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
let urls

const PadIndex = 0;
let OOVIndex = uuidv4();

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

function padIndexSequence(sequence, maxLength) {
  // For brevity assume padding and truncation occur 'pre'
  return sequence.map(seq => {
    if(seq.length > maxLength) {
      seq.splice(0, seq.length - maxLength)
    }

    const padding = [];
    if(seq.length < maxLength) {
      for(let i = 0; i < maxLength - seq.length; i++ ) {
        padding.push(PadIndex)
      }
      // Assuming padding is pre
      seq = padding.concat(seq)
    }

    return seq
    
  })
}

function assignSentimentScore(text) {
  const inputTextArray = text
    .trim()
    .toLowerCase()
    .replace(/(\.|\,|\!)/g, "")
    .split(" ");
  const indexSequence = inputTextArray.map(word => {
    let normalWord = normalizeWords(word)
    let wordIndex = metadata.word_index[normalWord] + metadata.index_from
    if( wordIndex > metadata.vocabulary_size ) {
      wordIndex = OOVIndex
    }
    return wordIndex
  })

  const paddedIndexSequence = padIndexSequence(indexSequence, metadata.max_len)
  const input = tf.tensor2d(paddedIndexSequence, [1, metadata.max_len])

  const predict = model.predict(input);

  const score = predict.dataSync()[0]
  predict.dispose()

  return score
}

function normalizeWords(word) {
  const mispelled = SpellChecker.isMisspelled(word)
  if( !mispelled ) return word
  const options = SpellChecker.getCorrectionsForMisspelling(word);
  return options.length === 0 ? word : options[0]
}

async function processRedditPosts(postObject) {
  initialize()
  const promises = [];
  const comments = await postObject.comments
  if(!comments) return console.log('no comments')
  setupTfModels().then(async function(model, postObject) {
    let commentScoreSum = 0
    const comments = postObject.comments
    comments.each(async function(id) {
      const comment = await Comment.findById(id).exec()
      const commentText = comment.text.replace(/(?:https?|ftp):\/\/[\n\S]+/g, '');
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
      await comment.update({
        sentimentScore: sentimentScore, 
        commentSentiment: commentSentiment})
        .then(() => console.log('comment updated with sentiment score'))
        .catch(err => console.log(err))
    })
    const averageScore = toFixed(commentScoreSum / comments.length)
    let updatedPostObject = await postObject.update({averageScore: averageScore}).exec()
    return postObject
  })
}

module.exports = processRedditPosts