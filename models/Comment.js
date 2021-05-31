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
      required: false
    },
    authorId: {
      type: String,
      required: false
    },
    commentId: {
      type: String,
      required: false
    },
    upvotes: {
      type: Number,
      required: true
    },
    downvotes: {
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
    },
    JSONComment: {
      type: Object,
      required: false
    }
  },
  {
    timestamps: true
  }
)

module.exports = Comment = mongoose.model("Comment", CommentSchema)