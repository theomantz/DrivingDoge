const tf = require('@tensorflow/tfjs')
const axios = require('axios')

const HOSTED_urls = {
  model:
    "https://storage.googleapis.com/tfjs-models/tfjs/sentiment_cnn_v1/model.json",
  metadata:
    "https://storage.googleapis.com/tfjs-models/tfjs/sentiment_cnn_v1/metadata.json",
};

const LOCAL_urls = {
  
}

const SentimentRange = {
  positive: 0.66,
  neutral: 0.33,
  negative: 0,
}

let model
let metadata

async function setupTfModels() {
  if(typeof model === 'undefined') {
    model = await loadModel(urls.model)
  }
  if(typeof metadata === 'undefined') {
    metadata = await loadMetaData(urls.metadata)
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