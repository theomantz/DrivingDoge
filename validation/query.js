const { booleanMaskAsync } = require('@tensorflow/tfjs-core');
const { default: validator } = require('validator');
const Validator = require('validator');
const validText = require('./valid-text');

const cryptoTickers = {
  'btc':'bitcoin', 'eth':'ethereum', 
  'bnb': 'binance coin', 'xrp':'ripple', 'usdt':'tether', 
  'ada':'cardano', 'doge':'dogecoin', 'dot':'polkadot', 
  'uni':'uniswap', 'ltc':'litecoin', 'link':'chainlink',
  'neo':'neo'
}

const stockTickers = {
  'appl':'apple', 'msft':'microsoft', 'amzn':'amazon', 'goog':'google', 'googl':'google', 'fb':'facebook'
}

const assetClasses = [
  'crypto', 'cryptocurrency', 'stocks', 'bonds', 'index fund', 'gold' 
]

// Validator will validate and normalize query

module.exports = function validateQuery(query) {
  let errors = {}
  let asset = ''

  query = query
    .trim()
    .toLowerCase()

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