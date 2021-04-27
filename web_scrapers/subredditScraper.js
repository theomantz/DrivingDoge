const axios = require('axios')
const cheerio = require('cheerio')


async function getSubreddits(param) {
  const URL = `https://www.reddit.com/search?q=${param}&type=sr%2Cuser`;
  return await axios.get(URL)
    .then(html => {
      console.log('received valid HTML')
      return parseSubreddits(html.data, param)
    })
    .catch(error => {
      return console.log(error.response)
    })
};

function parseSubreddits(html, param) {
  const subRedditObjects = {};
  const $ = cheerio.load(html);
  $("div.ListingLayout-outerContainer div > a").each((index, element) => {
    const title = $(element).attr('href')
    if (title.slice(0,3) === '/r/') {
      subRedditObjects[title.slice(3, -1)] ={
        shortLink: title,
        link: `https://www.reddit.com${title}`,
        subCount: parseSubCount($(element).find('div > div > div').last().text()),
        description: $($(element).children('div').toArray()[1]).text(),
        queryParams: [param]
      }
    }
  });
  console.log('returning objects')
  return subRedditObjects
}

function parseSubCount(string) {
  const stringArray = string.split(' ');
  if( stringArray.length === 1 ) return null;
  const number = stringArray[0]
  const multipliers = { k: 1000, m: 1000000 }
  return parseFloat(number.slice(0, -1)) * multipliers[number.slice(-1)]
}

module.exports = getSubreddits;