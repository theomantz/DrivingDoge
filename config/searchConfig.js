module.exports = {
  params: {
    sort: "relevance",
    time: "hour",
    subreddit: {
      limit: 5,
      time: "all",
      sort: "relevance",
    },
    post: {
      limit: 20,
      time: "week",
      sort: "relevance",
    },
    comment: {
      limit: 50,
      sort: "confidence",
    },
  },
};
