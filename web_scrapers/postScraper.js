const axios = require("axios");
const cheerio = require("cheerio");

async function getPosts(param) {
  const URL = `https://www.reddit.com/search?q=${param}`;
  const html = await axios.get(URL);
  parsePosts(html.data, param);
}

function parsePosts(html, param) {
  const postsObject = {};
  const $ = cheerio.load(html);
  $('div[data-click-id="body"]').each((index, post) => {
      let partialPath = $(post).find('a[data-click-id="body"]').attr('href')
      let rawTitle = partialPath.split('/').slice(-2, -1)
      const path = `https://www.reddit.com${partialPath}`;
      let splitPath = partialPath.split('/')
      const id = `${splitPath[2]}_${splitPath[4]}`
      let div = $(post).children('div').toArray[1]
      let userAuthorDiv = $(div[0]).children('div')
      postsObject[id] = {
        rawTitle: rawTitle,
        subreddit: splitPath[2],

      }
    }
  );
}

return getPosts('crypto');
