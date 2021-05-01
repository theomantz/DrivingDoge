const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SubredditSchema = new Schema(
  {
    shortLink: {
      type: String,
      require: true
    },
    longLink: {
      type: String,
      required: true
    },
    subCount: {
      type: Number,
      required: false
    },
    description: {
      type: String,
      required: false
    },
    averageScore: {
      type: Number,
      required: false
    },
    sentimentScore: {
      type: String,
      required: false
    },
    posts: [{
      type: Schema.Types.ObjectId,
      ref: "Post"
    }],
    comments: [{
      type: Schema.Types.ObjectId,
      ref: 'Comment'
    }],
    queries: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Query"
    }]
  },
  {
    timestamps: true
  }
)

module.exports = Subreddit = mongoose.model("Subreddit", SubredditSchema);