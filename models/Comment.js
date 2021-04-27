const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CommentSchema = new Schema(
  {
    postId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Post" 
    },
    test: {
      type: String,
      required: true
    },
    author: {
      type: String,
      required: true
    },
    upvotes: {
      type: Number,
      required: true
    },
    commentTimeStamp: {
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