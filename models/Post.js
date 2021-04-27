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