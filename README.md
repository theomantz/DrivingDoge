# DrivingDoge

[![forthebadge](https://forthebadge.com/images/badges/made-with-javascript.svg)](https://forthebadge.com)

DrivingDoge (dd) is a sentiment analysis app which scrapes weekly Reddit threads relevant to a predetermined list of assets. It then parses the text from each post, and assigns a sentiment score.

DrivingDoge is written in JavaScript it uses a Node JJ/Express JS backend with a TensorFlow JS model to assign sentiment scores and Vanilla JS and D3 JS to visualize the data on the frontend.

The first notable feature of DrivingDoge is the web scraping mechanism. Utilizing Axios to perform HTTP requests, and Cheerio JS to parse the HTML, DrivingDoge searches reddit using a set of parameters and a query string.

```js
const defaultSearch = {
  queryString: "BTC",
  sort: "relevance",
  time: "week",
  subreddit: {
    sort: "relevance",
    time: "week",
    count: 10,
  },
  post: {
    sort: "relevance",
    time: "week",
    count: 100,
  },
  comment: {
    sort: "relevance",
    time: "week",
    count: 100
  },
};
```
