# DrivingDoge

DrivingDoge (dd) is a sentiment analysis app written in JavaScript. It searches weekly Reddit threads relevant to a list of watched assets and scrapes the comments of each relevant thread and passes the text through a TensorFlow Model which assigns a sentiment score. Sentiment scores are then averaged for each post, subreddit, and search and the results are visualized using D3 JS.

* Fully automated web scraping and parsing, requires no input from the user except for search terms and parameters
* D3 Treemap visualization provides a good representation of which channels are driving sentiment around certain assets
  * Each treemap group of rectangles is a subreddit
  * Each rectangle within a group is a post in that subreddit



