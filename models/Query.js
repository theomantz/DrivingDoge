const searchConfig = require('../config/searchConfig')
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const QuerySchema = new Schema(
  {
    query: {
      type: String,
      require: true,
    },
    rawRequest: {
      type: Object,
    },
    params: {
      type: Object,
      require: false,
      default: searchConfig
    },
    averageScore: {
      type: Number,
      required: false
    },
    sentimentScore: {
      type: String,
      required: false
    },
    totalSubs: {
      type: Number,
      required: false
    },
    subreddits: {
      type: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subreddit"
      }]
    },
    posts: {
      type: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post"
      }]
    },
    comments: {
      type: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment"
      }]
    },
  },
  {
    timestamps: true
  }
)

module.exports = Query = mongoose.model("Query", QuerySchema)