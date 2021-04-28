const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const QuerySchema = new Schema(
  {
    query: {
      type: String,
      require: true,
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
    }
  }
)

module.exports = Query = mongoose.model("Query", QuerySchema)