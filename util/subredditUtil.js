const axios = require('axios')
const cheerio = require('cheerio')
const Subreddit = require('../models/Subreddit')
const Query = require('../models/Query')

function constructSubredditsByQuery(queryDoc) {
  return getSubreddits(queryDoc)
}

async function getSubreddits(queryDoc) {
  const { query } = queryDoc
  const URL = `https://www.reddit.com/search?q=${query}&type=sr%2Cuser`;
  try {
    
    const html = await axios.get(URL)
    await parseSubreddits(html.data, queryDoc)
    const queryObj = await Query.findById(queryDoc.id)
    return queryObj
    
  } catch(err) {

    console.log(err)

  }
};



function parseSubreddits(html, queryObj) {

  const promises = [];
  
  
  
  const $ = cheerio.load(html);


  $("div.ListingLayout-outerContainer div > a")
    .each((index, element) => {
      const shortLink = $(element).attr('href')
      if (shortLink.slice(0,3) === '/r/') {

        const subCountString = $(element).find("div > div > div").last().text();
        const subCount = parseSubCount(subCountString)
        const descriptionNode = $(element).children('div').toArray()[1]
        try {
          const subredditDoc = Subreddit.findOneAndUpdate(
            {
              shortLink: shortLink
            },
            {
              shortLink: shortLink,
              longLink: `https://www.reddit.com${shortLink}`,
              subCount: subCount,
              description: $(descriptionNode).text(),
              queries: queryObj.id,
            },
            {
              new: true
            }
            ).exec();

            promises.push(subredditDoc)
          const queryDoc = Query.findOneAndUpdate(
              {
                id: queryObj.id
              },
              {
                $push: {subreddits: subredditDoc.id}
              },
              {
                new: true
              }
            ).then(doc => doc);

            promises.push(queryDoc)
            
          } catch (err) {
            
            console.log(err)
            
          }
          

          return promises
    }
  })

    return Promise.allSettled(promises)
      .then(doc => doc)
      .catch(err => console.log(err))
}

function parseSubCount(string) {
  
  const stringArray = string.split(' ');
  
  if( stringArray.length === 1 ) return null;
  
  const number = stringArray[0]
  const multipliers = { k: 1000, m: 1000000 }

  return parseFloat(number.slice(0, -1)) * multipliers[number.slice(-1)]
}

module.exports = constructSubredditsByQuery;