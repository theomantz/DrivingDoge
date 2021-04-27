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
    queries: {
      type: [mongoose.Schema.Types.ObjectId],
      required: true
    }
  },
  {
    timestamps: true
  }
)

module.exports = Subreddit = mongoose.model("Subreddit", SubredditSchema);