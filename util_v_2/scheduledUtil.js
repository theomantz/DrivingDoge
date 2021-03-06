/* 
Eventually this will be the file that runs the scheduled queries. Once hosting is sorted out.
Currently Heroku is prohibitive in terms of cost. Developer is looking at a self-hosted option.
 */

const express = require("express");
const app = express();
const path = require("path");

const mongoose = require("mongoose");
const db = require("../config/keys").mongoURI;

mongoose
  .connect(db, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  })
  .then(() =>
    console.log("Connected to MongoDB Successfully through Scheduled")
  )
  .catch((err) => console.log(err));

const generateQuery = require("./queryUtilByJson");
const { stockTickers, assetClasses } = require("../config/assets");

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
    count: 100,
  },
};

const cryptos = {
  ADA: "CARDANO",
  ALGO: "ALGORAND",
  BTC: "BITCOIN",
  BUSD: "BINANCE USD",
  DOGE: "DOGECOIN",
  DOT: "POLKADOT",
  ETH: "ETHEREUM",
  LTC: "LITECOIN",
  SOL: "SOLANA",
  XLM: "STELLAR",
  XMR: "MONERO",
  XRP: "XRP",
  XTZ: "TEZOS",
};

[assetClasses].forEach((assetObject) => {
  Object.values(assetObject).forEach(async (a) => {
    search = defaultSearch;
    search.queryString = a;
    await generateQuery(search);
  });
});
