const validText = require("./valid-text");
const assets = require("../config/assets");
const Filter = require("bad-words");

// Validator will validate and normalize query

function validateQuery(query) {
  const { cryptoTickers, stockTickers, assetClasses } = assets;

  let errors = {};
  let asset = "";

  query = query.trim().toUpperCase();

  query = validText(query) ? query : "";

  if (!query.length) {
    errors.query = "Please enter a valid ticker";

    return {
      errors,
      isValid: Boolean(query.length),
    };
  }

  // Cryptos
  const shortCrypto = Object.keys(cryptoTickers);
  const longCrypto = Object.values(cryptoTickers);

  // Stocks
  const shortStock = Object.keys(stockTickers);
  const longStock = Object.values(stockTickers);

  // Assets
  const shortAssetClass = Object.keys(assetClasses);
  const longAssetClass = Object.values(assetClasses);

  // Check tickers
  if (cryptoTickers[query] || stockTickers[query]) {
    asset = `${cryptoTickers[query] || stockTickers[query]}+OR+${query}`;
  } else if (longCrypto.includes(query) || longStock.includes(query)) {
    longAsset =
      shortCrypto.find((key) => cryptoTickers[key] === query) ||
      shortStock.find((key) => stockTickers[key] === query);

    asset = `${query}+OR+${longAsset}`;
  } else if (assetClasses[query] || longAssetClass.includes(query)) {
    let first = assetClasses[query]
      ? query
      : shortAssetClass.find((s) => assetClasses[s] === query);
    let second = assetClasses[query]
      ? shortAssetClass.find((s) => assetClasses[s] === query)
      : query;
    asset = `${first}+OR+${second}`;
  } else {
    let filter = new Filter();
    if (filter.isProfane(query)) {
      errors.asset = "Please be nice";
    } else {
      asset = query;
    }
  }

  return {
    errors,
    isValid: Boolean(asset.length),
    asset,
  };
}

module.exports = validateQuery;
