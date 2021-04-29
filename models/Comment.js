const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CommentSchema = new Schema(
  {
    postId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Post" 
    },
    author: {
      type: String,
      required: true
    },
    upvotes: {
      type: Number,
      required: true
    },
    downvotes: {
      type: Number,
      required: true
    },
    unvoted: {
      type: Number,
      required: true
    },
    timestamp: {
      type: String,
      required: false
    },
    text: {
      type: String,
      required: true
    },
    sentimentScore: {
      type: Number,
      required: false
    },
    commentSentiment: {
      type: String,
      required: false
    },
    queryParams: {
      type: [String],
      required: true
    }
  },
  {
    timestamps: true
  }
)

module.exports = Comment = mongoose.model("Comment", CommentSchema)