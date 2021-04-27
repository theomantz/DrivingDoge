const express = require('express');
const app = express();
const path = require('path')




app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, './src/index.html'))
})

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(__dirname)
  console.log(`listening on ${PORT}`)
})