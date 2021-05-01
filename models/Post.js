const mongoose = require('mongoose')
const Schema = mongoose.Schema

const PostSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    subredditRef: {
      type: Schema.Types.ObjectId,
      ref: "Subreddit",
    },
    subredditName: {
      type: String,
      required: false
    },
    localId: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true
    },
    author: {
      type: String,
      required: false,
    },
    promoted: {
      type: Boolean,
      required: false
    },
    upvotes: {
      type: Number,
      required: true,
    },
    postTimeStamp: {
      type: String,
      required: false,
    },
    commentCount: {
      type: Number,
      required: true
    },
    comments: [{
      type: Schema.Types.ObjectId,
      ref: "Comment"
    }],
    averageScore: {
      type: Number,
      required: false
    },
    sentimentScore: {
      type: String,
      required: false
    },
    queries: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Query"
    }],
  },
  {
    timestamps: true,
  }
);

module.exports = Post = mongoose.model("Post", PostSchema)