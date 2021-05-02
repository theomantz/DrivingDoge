const d3 = require('d3')
const axios = require('axios')


document.addEventListener("DOMContentLoaded", function () {
  const dataViz = document.getElementById("treemap-dataviz");


  
  console.log(init())
  
});

function init() {
  let width = document.width;
  let height = document.height;
  alert(`Width: ${width}, Height: ${height}`)
}