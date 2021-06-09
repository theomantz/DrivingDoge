// Dependencies
const express = require("express")
const router = express.Router();

router.get("/:query", async (req, res) => {
  
  debugger
  
  try {
    const { errors, isValid, asset } = validateQuery(req.params.query);

    if (!isValid) {
      return res.status(400).json(errors);
    }

    let resData = await Query.findOne({ query: asset })
      .populate({
        path: "subreddits",
        select: "shortLink subCount description averageScore sentimentScore",
        populate: {
          path: "posts",
          select: "title upvotes commentCount averageScore sentimentScore",
        },
      });

    let response = constructResponse(resData);

    response.available = await Query.distinct('query')

    console.log(response)

    return res.status(200).json(response);

  } catch (err) {

    console.log(err)

    return res.status(400).json(err)

  }
  
  
});


module.exports = router;
