import Treemap from './treemap'

document.addEventListener("DOMContentLoaded", function () {
  const root = document.getElementById("root");


  let windowWidth = window.innerWidth;
  let windowHeight = window.innerHeight;
});

function clearPage() {
  d3.selectAll('.treemap').remove()
}

export function drawTreemaps(dataSet, windowWidth, windowHeight) {
  clearPage()
  
  for(const data of dataSet) {

    const svg = d3.select('#svg-container')
      .append('svg').attr('width', windowWidth).attr('height', windowHeight)

    const treemap = new Treemap(windowHeight, windowWidth)
  }
  
}