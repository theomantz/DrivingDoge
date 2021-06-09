require("newrelic");
const express = require("express");
const app = express();
const path = require("path");

// Mongoose Models for API
const Query = require("../../models/Query");
const Subreddits = require("../../models/Subreddit");
const Posts = require("../../models/Post");
const validateQuery = require("../../validation/query");

// Query API
const query = require("./routes/api/data");
app.use("/api/asset", query);

// Public / Static Assets
app.use(express.static("public"));
app.get("/", (req, res) => {
  console.log("request", req);
  res.sendFile(path.join(__dirname, "./public/index.html"));
});

// Database Setup
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
