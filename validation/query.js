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

  query = validText(query) ? query : '';

  if(!query.length) {
    errors.query = 'Please enter a valid ticker'
  }

  // Cryptos
  const shortCrypto = Object.keys(cryptoTickers)
  const longCrypto = Object.values(cryptoTickers)

  // Stocks
  const shortStock = Object.keys(stockTickers)
  const longStock = Object.values(stockTickers)

  // Check crypto
  if(shortCrypto.includes(query) || shortStock.includes(query)) {
    asset = cryptoTickers[query] || stockTickers[query];
  } else if (longCrypto.includes(query) || longStock.includes(query) ){
    asset = query
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