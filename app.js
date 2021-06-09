// Dependencies
require("newrelic");
const { DateTime, Duration } = require('luxon')

// Express API
const express = require("express");
const app = express();
const path = require("path");

// Mongoose Models for API
const Query = require("./models/Query");
const Subreddits = require("./models/Subreddit");
const Posts = require("./models/Post");

// Modules
const validateQuery = require("./validation/query");
const generateQuery = require('./util_v_2/queryUtilByJson')
const constructResponse = require("./util_v_2/constructResponse");

// Data API
const data = require("./routes/api/data");
app.use("/api/asset", data);

// Public / Static Assets
app.use(express.static("public"));
app.get("/", (req, res) => {
  console.log("request", req);
  res.sendFile(path.join(__dirname, "./public/index.html"));
});

// MongoDB Setup
const mongoose = require("mongoose");
const db = require("./config/keys").mongoURI;

mongoose
  .connect(db, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  })
  .then(() => console.log("Connected to MongoDB Successfully"))
  .catch((err) => console.log(err));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`listening on ${PORT}`);
});
