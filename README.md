# DrivingDoge

[![forthebadge](https://forthebadge.com/images/badges/made-with-javascript.svg)](https://forthebadge.com)

DrivingDoge (dd) is a sentiment analysis app which scrapes weekly Reddit threads relevant to a predetermined list of assets. It then parses the text from each post, and assigns a sentiment score.

DrivingDoge is written in JavaScript it uses a Node JJ/Express JS backend with a TensorFlow JS model to assign sentiment scores and Vanilla JS and D3 JS to visualize the data on the frontend.

The first notable feature of DrivingDoge is the web scraping mechanism. Utilizing Axios to perform HTTP requests, and Cheerio JS to parse the HTML, DrivingDoge searches reddit using a set of parameters and a query string.

An example set of search parameters with a query string is shown below:
```js
const defaultSearch = {
  queryString: "BTC",
  sort: "relevance",
  time: "week",
  subreddit: {
    sort: "relevance",
    time: "week",
    count: 10,
  },
  post: {
    sort: "relevance",
    time: "week",
    count: 100,
  },
  comment: {
    sort: "relevance",
    time: "week",
    count: 100
  },
};
```

This is then passed as a parameter to an arrow function called on an asset HashMap:
```js
[assetClasses].forEach((assetObject) => {
  Object.values(assetObject).forEach(async (a) => {
    search = defaultSearch;
    search.queryString = a;
    await generateQuery(search);
  })
});
```

Axios is used in DrivingDoge but a fetch function was written in order to encapsulate some of the async logic:
```js
async function fetch(url) {
  return await axios.get(url)
    .then(res => res)
    .catch( e => {
      console.log(e)
      return e
    })
}
```

The starter function, `generateQuery` first checks and sanitizes the query input. This was done in anticipation of a coming feature allowing users to generate realtime queries.
```js
async function generateQuery(queryRequestObject) {
 
 const { queryString }  = queryRequestObject
  
 const {asset, isValid, errors} = validateQueryInput(queryString)


 if(!isValid) {
   return console.log(errors)
 }
```
A query document is then searched for in MongoDB, using the parameters and cutoff dates specified previously.
```js
const {
  sort,
  time,
  subreddit,
  post,
  comment
 } = queryRequestObject

 const options = {
   headers: {
     "User-Agent":
       "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:78.0) Gecko/20100101 Firefox/78.0",
   },
 };

 let searchHTML = await axios.get(
   `https://old.reddit.com/search/?q=${asset}&t=${time}&sort=${sort}&type=sr`,
    options
 )
 .catch(e => console.log(e))

 let today = new DateTime(Date.now())
 let cutoffDate = today.minus({ [time]: 1 })

 let queryDocument = await Query.findOne({
   query: asset, 
   createdAt: { 
     $gte: cutoffDate.toISO(),
     $lt: today.toISO()
    }, 
    'params.time': time,
    'params.sort': sort,
    'params.subreddit.count': subreddit.count,
    'params.post.count': post.count,
    'params.comment.count': comment.count,
  }).exec()
  
  if(!queryDocument) {
    
    queryDocument = new Query({
      query: asset,
     params: queryRequestObject,
   })

   queryDocument = await queryDocument.save()
   
   
  }
  if(searchHTML.status === 200) {
    let query = await constructSubreddits(queryDocument, searchHTML)
    return await constructQueryForResponse(query)
  } else {
    return null
  }


}
```
DrivingDoge then parses our the relevant subreddits, the relevant posts from each subreddit, and then the indivdual comments in each post. The comments are created recursively using the post JSON object:
```js
async function constructTopLevelComments(data, post) {

  let topLevelComments = data.children
  const commentIds = []
  for(let i = 0; i < topLevelComments.length ; i++ ) {
    let c = topLevelComments[i].data
    if(c.body) {
      try {
        
        let saved = await Comment.findOneAndUpdate({
          commentId: c.id
        }, {
          author: c.author, authorId: c.author_fullname,
          commentId: c.id, upvotes: c.ups, downvotes: c.downs,
          timestamp: c.created_utc, text: c.body, postId: post.id
        }, {
          upsert: true,
          new: true
        }).exec()
        
        commentIds.push(saved.id)

      } catch (e) {
        console.log(e)
      }
    }
    if(typeof c.replies === 'object') {
      await constructTopLevelComments(c.replies.data, post)
    }
  }
  if(commentIds.length) {
    post.comments.addToSet(...commentIds)
  }
  return await post.save()
}
```
Once all of the comments for a particular post have been saved. The post document is passed to the TensorFlow model which assigns a sentiment score. The data is then put into a proper heirarchical format for D3 Visualization and saved back to the database. 

On the frontend, once the DOM is loaded, the window dimensions are taken and passed to the initialization function. An event listener is added to a html select input for when the asset is changed by the user.
```js
document.addEventListener("DOMContentLoaded", function () {
  
  const root = document.getElementById("root");
  const input = document.getElementById("asset-input");

  

  let windowWidth = window.innerWidth;
  let windowHeight = window.innerHeight * 0.75;

  init((windowWidth), (windowHeight))


  input.addEventListener('change', (e) => {
    newTree(e.currentTarget.value, windowWidth, windowHeight)
  })

});
```

The initialization function sets the inline style attributes of a div element which then allows for the treemap visualation to be deleted and re-rendered with new data without surrounding elements collapsing in. 

```js
async function init(width, height) {

    const margins = {
      top: 10,
      right: 10,
      bottom: 10,
      left: 10,
    };

  let rems
  if(height > 900) {
    rems = 16
  } else if (height > 400) {
    rems = 14
  } else {
    rems = 12
  }
    
  d3.select("#svg-container")
    .attr('style', `min-width:${width * 0.6}px;min-height:${height + 200}px`)

  d3.select("#chart-metrics")
    .style("min-height", `${13 * rems}px`)

  d3.select('#right-sidenav')
    .style('min-width', `${width * 0.2}px`)

  const starterData = await fetchData('doge')


  drawTreemaps(starterData, width, height)
  
}
```

Lastly, it renders a treemap visualization of the sentiment data:

```js
 render() {
    
    this.appendChartInfo()


    const root = d3.hierarchy(this.data)
    
    d3.treemap()
      .size([this.width, this.height])
      .paddingTop(30)
      .paddingRight(7)
      .paddingInner(3)
      .round(true)
      (root)
      .sort((a, b) => b.value - a.value)


    this.svg
      .selectAll("rect")
      .data(root.leaves())
      .enter()
      .append("rect")
      .attr("x", function (d) {
        return d.x0;
      })
      .attr("y", function (d) {
        return d.y0;
      })
      .attr("width", function (d) {
        return d.x1 - d.x0;
      })
      .attr("height", function (d) {
        return d.y1 - d.y0;
      })
      .style("stroke", "black")
      .style("fill", (t => d3.interpolateRdYlGn(t.data.averageScore)))
      .on("click", (d => {
        this.appendPostInfo(d);
      }))
      .on('mouseover', (d => {
        this.showTitle(d)
      }))
      .on('mouseout', (d => {
        this.hideTitle(d)
      }))

    this.svg
      .selectAll("text")
      .data(
        root.descendants().filter(function (d) {
          return d.depth == 1;
        })
      )
      .enter()
      .append("text")
      .attr("x", function (d) {
        return (d.x0);
      })
      .attr("y", function (d) {
        return d.y0 + 20;
      })
      .text(function (d) {
        return d.name;
      })
      .text((d) => d.data.name)
      .attr('class', d => `subreddit-text`)
      .attr("id", d => `${d.data.name}`)

  }

}
```
