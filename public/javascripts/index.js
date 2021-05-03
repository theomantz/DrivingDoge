import '../assets/reset.css'
import '../assets/index.css'
import Treemap from './treemap'
import fetchData from './fetch';

document.addEventListener("DOMContentLoaded", function () {
  const root = document.getElementById("root");


  let windowWidth = window.innerWidth;
  let windowHeight = window.innerHeight;

  init((windowWidth * 0.8), (windowHeight))

});

// function clearPage() {
//   d3.selectAll('.treemap').remove()
// }

async function init(width, height) {

  

  const starterData = await fetchData('btc')


  drawTreemaps(starterData, width, height)
  
}

function drawTreemaps(dataSet, chartAreaWidth, chartAreaHeight) {

  // clearPage()

  const margins = {
    top: 10, right: 10, bottom: 10, left: 10
  }

  const svg = d3.select('#svg-container')
    .append('svg')
    .attr('width', chartAreaWidth + margins.left + margins.right)
    .attr('height', chartAreaHeight + margins.top + margins.bottom)
    .append('g')
    .attr('transform',
    "translate(" + margins.left + "," + margins.top + ")");


  const treemap = new Treemap(dataSet, chartAreaWidth, chartAreaHeight, svg)

  treemap.render()
  
}