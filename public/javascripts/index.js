import '../assets/reset.css'
import '../assets/index.css'
import Treemap from './treemap'
import fetchData from './fetch';

document.addEventListener("DOMContentLoaded", function () {
  const root = document.getElementById("root");


  let windowWidth = window.innerWidth;
  let windowHeight = window.innerHeight;

  init((windowWidth * 0.6), (windowHeight))

});

// function clearPage() {
//   d3.selectAll('.treemap').remove()
// }

async function init(width, height) {

  

  const starterData = await fetchData('btc')


  drawTreemaps(starterData, width, height)

  const select = d3.select('#search-div')
    .append('select')

    select.selectAll('option')
      .data()
  
}

function drawTreemaps(dataSet, chartAreaWidth, chartAreaHeight) {

  // clearPage()

  const margins = {
    top: 10, right: 10, bottom: 10, left: 10
  }

  const title = d3.select('#svg-title')
    .append('h1')
    .attr('class', 'title title')
    .text(`${dataSet.name.slice(0, 1).toUpperCase() + dataSet.name.slice(1)}:`)

  const subCount = d3.select('#svg-title')
    .append('h3')
    .attr('class', 'title subcount')
    .text(dataSet.totalSubs)

  const subTitle = d3.select('#svg-title')
    .append('span')
    .attr('class', 'title subtitle')
    .text('people participating in the conversation this week')

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