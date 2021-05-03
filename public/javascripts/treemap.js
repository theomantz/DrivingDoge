import '../assets/treemap.css'
import { MARGIN } from '../config/pageConfig'


class Treemap {

  // Treemap will be called from a higher function which will render Treemaps
  // for each collection of data available
  constructor(data, width, height, svg) {
    this.height = height - ( MARGIN.top + MARGIN.bottom )
    this.width = width - ( MARGIN.left + MARGIN.right )
    this.data = data
    this.svg = svg
  }

  appendPostInfo(d) {

  }

  appendChartInfo() {

    const title = this.data.name.split('+')[0]
    const { data } = this.data

    const bullets = [
      "Each square is a post", 
      "Posts are grouped by Subreddit",
      "Subreddits are labeled",
      "Size is engagement",
      "Color is sentiment"
    ]

    const chartData = [
      `Average Sentiment: ${data.averageScore}`,
      `Sentiment Score: ${data.sentimentScore}`,
      `Time Frame: ${data.timeFrame}`,
      `Total Subscribers: ${data.totalSubs}`
    ]
    
    d3.select("#about-chart")
      .append("p")
      .text(
        `The chart shown to the right is a treemap representation of Reddit engagement and sentiment surrounding ${title}.`
      )
      .attr('class', 'chart');


    d3.select('#about-chart')
        .append('ul')
        .selectAll("bullets")
        .data(bullets)
        .enter()
        .append('li')
        .attr('class', 'chart chart-bullet')
        .text((d) => {
          return d
        })

    d3.select('#chart-metrics')
        .append('ul')
        .selectAll('chartData')
        .data(chartData)
        .enter()
        .append('li')
        .attr('class', 'chart chart-metrics')
        .text((d) => {
          return d
        })
        
  }


  render() {

    this.appendChartInfo()
    
    const tooltip = d3
      .select("#svg-container")
      .append("div")
      .style("position", "absolute")
      .style("z-index", "10")
      .style("visibility", "hidden")
      .style("background", "white")


    const root = d3.hierarchy(this.data)

    
    d3.treemap()
      .size([this.width, this.height])
      .paddingTop(30)
      .paddingRight(7)
      .paddingInner(3)
      (root)


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
      .style("fill", (t => d3.interpolateRdYlGn(t.data.data.averageScore)))
      .on("mouseover", function(d){
        tooltip.text(`Post Title: ${d.data.name}`);
        let styles = {'left':`${d.x0}px` , 'visibility':'visible', 'top':`${d.y1}px`}
        return Object.entries(styles).forEach(([prop, val]) => tooltip.style(prop, val))
        
      })
      .on("mouseout", function(){return tooltip.style("visibility", "hidden");});

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
        return d.x0 + (d.x0 + d.x1)/2;
      }) // +10 to adjust position (more right)
      .attr("y", function (d) {
        return d.y0 + 20;
      }) // +20 to adjust position (lower)
      .text(function (d) {
        return d.name;
      })
      .text((d) => d.data.name)
      .attr("font-size", "24px")
      .attr("fill", "black");


  }

}

export default Treemap