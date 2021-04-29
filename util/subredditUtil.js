const axios = require('axios')
const cheerio = require('cheerio')
const Subreddit = require('../models/Subreddit')
const Query = require('../models/Query')

function constructSubredditsByQuery(queryDoc) {
  return getSubreddits(queryDoc)
}

async function getSubreddits(queryDoc) {
  const { query } = queryDoc.query
  const URL = `https://www.reddit.com/search?q=${query}&type=sr%2Cuser`;
  return await axios.get(URL)
    .then(async function(html) {
      console.log('received valid HTML')
      let queryObj = await parseSubreddits(html.data, queryDoc)
      console.log(`object returned from parser in getSub call${queryObj}`)
      return queryObj
    })
    .catch(error => {
      return console.log(error)
    })
};

function parseSubreddits(html, queryDoc) {
  const subRedditObjects = {};
  const subredditIds = [];
  const promises = [];
  const $ = cheerio.load(html);
  $("div.ListingLayout-outerContainer div > a").each((index, element) => {
    const title = $(element).attr('href')
    if (title.slice(0,3) === '/r/') {
      const subredditObject = new Subreddit({
        shortLink: title,
        longLink: `https://www.reddit.com${title}`,
        subCount: parseSubCount(
          $(element).find("div > div > div").last().text()
        ),
        description: $($(element).children("div").toArray()[1]).text(),
        queries: queryDoc.id,
      });
      
      // console.log(subredditObject)
  
      let promise = subredditObject.save()
        .then(sub => {
          console.log(`subreddit ${sub.shortLink} saved`)
          subredditIds.push(sub.id)
        }).catch(err => console.log(err))
        
        promises.push(promise)
    }
    
    
  })

  let queryObj = queryDoc.update({id: queryDoc.id}, {$push: {subreddits: subredditIds}})
        .then(doc => {
          console.log(typeof doc)
          console.log(doc.subreddits)
          console.log('returning queryDoc from subreddits')
          return doc
        })
        .catch(err => console.log(err))

        promises.push(queryObj)

  let fulfilled = Promise.allSettled(promises)
    .then(() => {
          return queryObj
        })
        .catch(err => console.log(err))
 
  console.log(`returning promise from subreddit parser ${fulfilled}`)
  return fulfilled
}

function parseSubCount(string) {
  const stringArray = string.split(' ');
  if( stringArray.length === 1 ) return null;
  const number = stringArray[0]
  const multipliers = { k: 1000, m: 1000000 }
  return parseFloat(number.slice(0, -1)) * multipliers[number.slice(-1)]
}

module.exports = constructSubredditsByQuery;