const mongoose = require('mongoose')
const Schema = mongoose.Schema

const PostSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    subredditId: {
      type: Schema.Types.ObjectId,
      ref: "Subreddit",
    },
    url: {
      type: String,
      required: true
    },
    author: {
      type: String,
      required: true,
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
    comments: {
      type: Schema.Types.ObjectId,
      ref: "Comment"
    },
    queryParams: {
      type: [String],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = Post = mongoose.model("Post", PostSchema)