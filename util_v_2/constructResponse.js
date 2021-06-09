/* 
Response is structured in heirarchical format for D3 JS on the frontend.
 */

function constructResponse(resData) {
  let totalSubs = 0;
  let value = 0;

  const response = {
    name: resData.query,
    sentimentScore: resData.sentimentScore,
    averageScore: resData.averageScore,
    timeFrame: resData.params.post.time,
    createdAt: resData.createdAt,
    updatedAt: resData.updatedAt,
    totalSubs: 0,
    available: [],
    value: 0,
    children: [],
  };

  resData.subreddits.forEach((sub, i) => {
    if (sub.subCount && sub.posts.length) {
      totalSubs += sub.subCount;

      response.children.push({
        name: sub.shortLink,
        averageScore: sub.averageScore,
        sentimentScore: sub.sentimentScore,
        value: 0,
        children: [],
      });

      let index = response.children.length - 1;

      let commentPostSum = 0;

      sub.posts.forEach((post) => {
        if (post.commentCount) {
          value += post.commentCount + post.upvotes;
          let title = post.title;
          response.children[index].children.push({
            name: title.replace(/\_/g, " "),
            sub: sub.shortLink,
            upvotes: post.upvotes,
            commentCount: post.commentCount,
            averageScore: post.averageScore,
            sentimentScore: post.sentimentScore || 0,
            value: post.commentCount + post.upvotes,
          });
        }
        commentPostSum += post.commentCount + post.upvotes;
      });
      response.children[index].value = commentPostSum;
    }
  });

  response.value = value;

  response.totalSubs = totalSubs;

  resData.totalSubs = totalSubs;

  resData.save();

  return response;
}

module.exports = constructResponse;
