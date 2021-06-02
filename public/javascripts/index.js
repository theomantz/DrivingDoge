import '../assets/reset.css'
import '../assets/index.css'
import Treemap from './treemap'
import fetchData from './fetch';

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


async function newTree(value, width, height) {

  clearData()

  const newData = await fetchData(value)

  setTimeout(draw, 800)

  function draw() {
    drawTreemaps(newData, width, height)
  }

}

function clearData() {

  d3.select('#svg-title')
    .transition()
      .duration(750)
      .style('font-size', '0px')
      .remove();

  d3.selectAll('.assetOption').remove();
  d3.selectAll('.chart-metrics-table, .default-metrics, .chart')
    .transition()
      .duration(750)
      .style('font-size', '0px')
      .remove();
  d3.select('svg')
    .transition()
      .duration(750)
      .style('opacity', 0)
      .remove();
  
}


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

function drawTreemaps(dataSet, chartAreaWidth, chartAreaHeight) {

  // clearPage()

  const margins = {
    top: 10, right: 10, bottom: 10, left: 10
  }

  let titleText = dataSet.name.split('+')[2]
  let titleSubtext = dataSet.name.split('+')[0]

  d3.selectAll('#svg-title').remove()
  d3.selectAll('#svg-subtitle').remove()

  const svg = d3.select('#svg-container')
    .append('svg')
    .attr('width', (chartAreaWidth * 0.55) + margins.left + margins.right)
    .attr('height', chartAreaHeight + margins.top + margins.bottom)
    .attr('class', 'svg')
    .append('g')
    .style('opacity', 0)
    .attr('transform',
    "translate(" + (margins.left - margins.right) + "," + ( margins.top - margins.bottom) + ")")



  const treemap = new Treemap(dataSet, (chartAreaWidth * 0.55), chartAreaHeight, svg)

  treemap.render()

    d3.select("#svg-container")
      .insert("h1", '.svg')
      .attr("id", "svg-title")
      .style('opacity', 1)
      .text(`$${titleText.toUpperCase()}`);

    d3.select("#svg-title")
      .append("h3")
      .attr("id", "svg-subtitle")
      .style("opacity", 1)
      .text(`${titleSubtext}`);
    

  let assetOptions = dataSet.available


  d3.select('#asset-input')
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
    });

  
  d3.select("g").transition().duration(750).style("opacity", 1);
}