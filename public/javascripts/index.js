import '../assets/reset.css'
import '../assets/index.css'
import Treemap from './treemap'
import fetchData from './fetch';

document.addEventListener("DOMContentLoaded", function () {
  
  const root = document.getElementById("root");
  const input = document.getElementById("asset-input");

  

  let windowWidth = window.innerWidth;
  let windowHeight = window.innerHeight * 0.75;

  console.log(windowHeight)

  init((windowWidth), (windowHeight))


  input.addEventListener('change', (e) => {
    newTree(e.currentTarget.value, windowWidth, windowHeight)
  })

});


async function newTree(value, width, height) {

  clearData()

  const newData = await fetchData(value)

  console.log(height)

  drawTreemaps(newData, width, height)

}

function clearData() {

  d3.selectAll('#svg-title .title').remove();
  d3.selectAll('.assetOption').remove();
  d3.selectAll('.chart').remove();
  d3.select('svg').remove();
  
}


async function init(width, height) {

  

  const starterData = await fetchData('doge')


  drawTreemaps(starterData, width, height)
  
}

function drawTreemaps(dataSet, chartAreaWidth, chartAreaHeight) {

  // clearPage()

  const margins = {
    top: 10, right: 10, bottom: 10, left: 10
  }

  let titleText = dataSet.name.split('+')[2]

  d3.selectAll('#svg-title').remove()

  const title = d3.select('#svg-container')
    .append('h1')
    .attr('id', 'svg-title')
    .text(`$${titleText.toUpperCase()}`)

  const svg = d3.select('#svg-container')
    .append('svg')
    .attr('width', (chartAreaWidth * 0.55) + margins.left + margins.right)
    .attr('height', chartAreaHeight + margins.top + margins.bottom)
    .attr('class', 'svg')
    .append('g')
    .attr('transform',
    "translate(" + (margins.left - margins.right) + "," + ( margins.top - margins.bottom) + ")");


  const treemap = new Treemap(dataSet, (chartAreaWidth * 0.55), chartAreaHeight, svg)

  treemap.render()

  const leftSideNav = d3.select('#left-sidenav')
    

  let assetOptions = dataSet.available


  const leftSelectInput = d3.select('#asset-input')
    .selectAll('assetOptions')
    .data(assetOptions)
    .enter()
    .append('option')
    .attr('class', 'assetOption')
    .text((d) => {
      return d.split('+')[0]
    })
    .attr('value', d => {
      return d.split('+')[2]
    })
    .property('selected', (d) => {
      return d === dataSet.name
    })
  
}