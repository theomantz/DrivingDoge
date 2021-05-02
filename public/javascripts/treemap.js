import d3 from 'd'


class Treemap {
  MARGIN = {
    top: 10, right: 10, bottom: 10, left: 10
  }
  // Treemap will be called from a higher function which will render Treemaps
  // for each collection of data available
  constructor(height, width, data, svg) {
    this.height = height - ( MARGIN.top + MARGIN.bottom )
    this.width = width - ( MARGIN.left + MARGIN.right )
    this.data = data
    this.svg = svg
  }

  render() {
    this.svg.append

  }

}

export default Treemap