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



  render() {
    

    const root = d3.hierarchy(this.data)


    
    d3.treemap()
      .size([this.width, this.height])
      .padding(2)
      (root)


      debugger

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
        .style("fill", "slateblue");

    this.svg
      .selectAll("text")
      .data(root.leaves())
      .enter()
      .append("text")
      .attr("x", function (d) {
        return d.x0 + 5;
      }) // +10 to adjust position (more right)
      .attr("y", function (d) {
        return d.y0 + 20;
      }) // +20 to adjust position (lower)
      .text(function (d) {
        return d.name;
      })
      .attr("font-size", "6px")
      .attr("fill", "white");
  }

}

export default Treemap