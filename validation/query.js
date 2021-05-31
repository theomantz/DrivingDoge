const validText = require('./valid-text');
const assets = require('../config/assets')

// Validator will validate and normalize query

function validateQuery(query) {

  const {
    cryptoTickers,
    stockTickers,
    assetClasses
  } = assets

  let errors = {}
  let asset = ''

  query = query
    .trim()
    .toUpperCase()

  query = validText(query) ? query : '';

  if(!query.length) { 

    errors.query = 'Please enter a valid ticker'
    
    return {
      errors,
      isValid: Boolean(query.length)
    }
  }

  // Cryptos
  const shortCrypto = Object.keys(cryptoTickers)
  const longCrypto = Object.values(cryptoTickers)

  // Stocks
  const shortStock = Object.keys(stockTickers)
  const longStock = Object.values(stockTickers)

  // Check tickers
  if(cryptoTickers[query] || stockTickers[query]) {

    asset = `${cryptoTickers[query] || stockTickers[query]}+OR+${query}`;

  } else if (longCrypto.includes(query) || longStock.includes(query) ){

    longAsset = shortCrypto.find(key => cryptoTickers[key] === query) ||
      shortStock.find(key => stockTickers[key] === query)

    asset = `${query}+OR+${longAsset}`

  } else if ( assetClasses.includes(query) ) {
    asset = query
  } else {
    errors.asset = 'Unrecognized asset ticker or class, please choose a ticker from the list'
  }
  
  return {
    errors,
    isValid: Boolean(asset.length),
    asset
  }

}

module.exports = validateQuery;