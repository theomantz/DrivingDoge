const axios = require('axios')
const cheerio = require('cheerio')
const Subreddit = require('../models/Subreddit')
const searchConfig = require('../config/searchConfig')
const Query = require('../models/Query')




function constructSubredditsByQuery(queryDoc) {
  return getSubreddits(queryDoc)
}

async function getSubreddits(queryDoc) {

  const { query, params } = queryDoc
  const { time, sort } = params.subreddit

  const URL = `https://www.reddit.com/search?q=${query}&type=sr&sort=${sort}&t=${time}`;

  const options = {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:78.0) Gecko/20100101 Firefox/78.0",
    },
  };
  
  try {
    
    const html = await axios.get(URL, options)
    let test = await parseSubreddits(html.data, queryDoc)
    return test
    
  } catch(err) {

    console.log(err)

  }
};



function parseSubreddits(html, queryObj) {

  const promises = [];
   
  const { limit } = queryObj.params.subreddit
  
  const $ = cheerio.load(html);


  $("div.ListingLayout-outerContainer div > a")
  
    .each((i, element) => {

      const shortLink = $(element).attr('href')
      
      if (shortLink.slice(0,3) === '/r/' &&
        promises.length < limit ) {

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
              upsert: true,
              new: true,
            }
            ).exec();

            promises.push(subredditDoc)
            
          } catch (err) {
            
            console.log(err)
            
          }
          

          return promises
    }
  })

    return Promise.all(promises)
      .then(subs => {

        let subsId = subs.map(sub => sub.id)

        queryObj.subreddits.push({$each: subsId})
        
        return queryObj.save()

      })
      .catch(err => console.log(err))
}

function parseSubCount(string) {
  
  const stringArray = string.split(' ');
  
  if( stringArray.length === 0 ) return null;
  
  const number = stringArray[0]
  const multipliers = { k: 1000, m: 1000000 }

  let subCount = parseFloat(number.slice(0, -1)) * (multipliers[number.slice(-1)] || 1)
  if(typeof subCount === 'number' && subCount !== NaN ) {
    return subCount
  } else {
    return null
  }
}

module.exports = constructSubredditsByQuery;