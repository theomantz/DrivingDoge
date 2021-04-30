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
  try {
    
    const html = await axios.get(URL)
    const queryObj = await parseSubreddits(html.data, queryDoc)
    return queryObj
    
  } catch(err) {

    console.log(err)

  }
    // .then(async function(html) {
    //   console.log('received valid HTML')
    //   console.log(`object returned from parser in getSub call${queryObj}`)
    //   return queryObj
    // })
    // .catch(error => {
    //   return console.log(error)
    // })
};



async function parseSubreddits(html, queryObj) {

  // const subRedditObjects = {};
  const subredditIds = [];
  const promises = [];
  
  
  
  const $ = cheerio.load(html);

  let length = 0

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

            queryDoc = Query.findOneAndUpdate(
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
            
          } catch (err) {

            console.log(err)

          }
          length += 1
          console.log(length)
          return promises.push(queryDoc)
    }
  })

  // let queryObj = queryDoc.update({id: queryDoc.id}, {$push: {subreddits: subredditIds}})
  //       .then(doc => {
  //         console.log(typeof doc)
  //         console.log(doc.subreddits)
  //         console.log('returning queryDoc from subreddits')
  //         return doc
  //       })
  //       .catch(err => console.log(err))

  //       promises.push(queryObj)

  // let fulfilled = Promise.allSettled(promises)
  //   .then(() => {
  //         return queryObj
  //       })
  //       .catch(err => console.log(err))
 
  // console.log(`returning promise from subreddit parser ${fulfilled}`)

  // return await Promise.allSettled(promises).then()
  if(promises.length > 1) {
    return Promise.allSettled(promises)
      .then(doc => doc)
      .catch(err => console.log(err))
  }
}

function parseSubCount(string) {
  const stringArray = string.split(' ');
  if( stringArray.length === 1 ) return null;
  const number = stringArray[0]
  const multipliers = { k: 1000, m: 1000000 }
  return parseFloat(number.slice(0, -1)) * multipliers[number.slice(-1)]
}

module.exports = constructSubredditsByQuery;