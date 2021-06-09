// Dependencies
const express = require("express");
const router = express.Router();

// Modules
const validateQuery = require("../../validation/query");
const generateQuery = require("../../util_v_2/queryUtilByJson");
const constructResponse = require("../../util_v_2/constructResponse");

// Cache responses from server to avoid restructuring data
const NodeCache = require("node-cache");
const resCache = new NodeCache();

router.get("/:query", async (req, res) => {
  debugger;

  try {
    const { errors, isValid, asset } = validateQuery(req.params.query);

    if (!isValid) {
      return res.status(400).json(errors);
    }

    if (resCache.has(asset)) {
      console.log("resCache used!");
      return res.status(200).json(resCache.get(asset));
    }

    let resData = await Query.findOne({ query: asset }).populate({
      path: "subreddits",
      select: "shortLink subCount description averageScore sentimentScore",
      populate: {
        path: "posts",
        select: "title upvotes commentCount averageScore sentimentScore",
      },
    });

    let response = constructResponse(resData);

    if (resCache.has("available")) {
    } else {
      available = await Query.distinct("query");
      resCache.set("available", available);
    }

    resCache.set(asset, response);

    return res.status(200).json(response);
  } catch (err) {
    console.log(err);

    return res.status(400).json(err);
  }
});

module.exports = router;
