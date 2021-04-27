const axios = require('axios')
const cheerio = require('cheerio')


async function getSubreddits(param) {
  const URL = `https://www.reddit.com/search?q=${param}&type=sr%2Cuser`;
  const html = await axios.get(URL)
  return parseSubreddits(html.data, param)
};

function parseSubreddits(html, param) {
  const subRedditObjects = {};
  const $ = cheerio.load(html);
  $("div.ListingLayout-outerContainer div > a").each((index, element) => {
    const title = $(element).attr('href')
    if (title.slice(0,3) === '/r/') {
      subRedditObjects[title.slice(3, -1)] ={
        link: `https://www.reddit.com${title}`,
        subCount: parseSubCount($(element).find('div > div > div').last().text()),
        description: $($(element).children('div').toArray()[1]).text(),
        queryParams: [param]
      }
    }
  });
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