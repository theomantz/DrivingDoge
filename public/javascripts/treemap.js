import "../assets/treemap.css";
import { MARGIN } from "../config/pageConfig";

class Treemap {
  // Treemap will be called from a higher function which will render Treemaps
  // for each collection of data available
  constructor(data, width, height, svg) {
    this.height = height - (MARGIN.top + MARGIN.bottom);
    this.width = width - (MARGIN.left + MARGIN.right);
    this.data = data;
    this.svg = svg;
    this.rems = 16
  }

  setRems() {
    let rems;
    const width = window.innerWidth
    if(width > 900) {
      rems = 16 
    } else if (width > 400) {
      rems = 14
    } else {
      rems = 12
    }
    this.rems = rems
  }

  showData(d) {
    this.clearPrevData();

    
    const timeout = () => {
      this.appendPostInfo(d);
    }

    setTimeout(timeout, 500);
  }

  clearPrevData() {
    let selector;
    if (document.getElementsByClassName("default-metrics").length) {
      selector = ".default-metrics";
    } else {
      selector = ".detailed-metrics-table";
    }

    d3.selectAll(selector)
      .transition()
      .duration(500)
      .style("font-size", "0px")
      .remove();
  }

  appendPostInfo(d) {
    const { name, sub, upvotes, commentCount, averageScore } = d.data;

    const attr = [
      { title: `Title:`, value: `${name.slice(0, 10)}...` },
      { title: `Subreddit:`, value: `${sub}` },
      { title: `Upvotes:`, value: `${upvotes}` },
      { title: `Number of Comments:`, value: `${commentCount}` },
      {
        title: `Average Sentiment:`,
        value: `${averageScore ? averageScore.toFixed(4) : "undefined"}`,
      },
    ];

    d3.select("#detailed-metrics")
      .append("table")
      .attr("class", "detailed-metrics-table")
      .style("font-size", 0)
      .append("tbody")
      .selectAll("detailedMetrics")
      .data(attr)
      .enter()
      .append("tr")
      .attr("class", "chart chart-metrics detailed")
      .selectAll("tr")
      .data((d) => Object.values(d))
      .enter()
      .append("td")
      .attr("class", "chart metric-cell")
      .text((d) => {
        return d;
      });

    d3.select(".detailed-metrics-table")
      .transition()
      .duration(500)
      .style("font-size", `${this.rems}px`);
  }

  appendChartInfo() {
    const title = this.data.name.split("+")[0];

    const { data } = this;

    const bullets = [
      "Each square is a post",
      "Posts are grouped by Subreddit",
      "Subreddits are labeled",
      "Size is engagement",
      "Color is sentiment",
    ];

    const date = new Date(data.createdAt).toDateString();

    const chartData = [
      { Title: "Total Engagement:", value: `${data.value}` },
      { Title: "Total Subscribers:", value: `${data.totalSubs}` },
      { Title: "Average Sentiment:", value: `${data.averageScore}` },
      { Title: "Sentiment Score:", value: `${data.sentimentScore}` },
      { Title: "Created:", value: `${date}` },
      { Title: "Time Frame:", value: `${data.timeFrame}` },
    ];

    const defaultData = [
      "Select a chart area to view more detailed information",
    ];

    let chartDirectionText =
      window.innerWidth < 1300 ? "below" : "to the right";

    d3.select("#about-chart")
      .style("min-height", `${this.height * 0.4}px`)
      .append("p")
      .text(
        `The chart shown ${chartDirectionText} is a treemap representation of Reddit engagement and sentiment surrounding ${title}.`
      )
      .attr("class", "chart-static");

    d3.select("#about-chart")
      .append("ul")
      .attr("class", "chart-static")
      .selectAll("bullets")
      .data(bullets)
      .enter()
      .append("li")
      .attr("class", "chart-static chart-bullet")
      .text((d) => {
        return d;
      });

    d3.select("#chart-metrics")
      .append("table")
      .attr("class", "chart-metrics-table")
      .append("tbody")
      .selectAll("chartData")
      .data(chartData)
      .enter()
      .append("tr")
      .attr("class", "chart chart-metrics")
      .selectAll("tr")
      .data((d) => Object.values(d))
      .enter()
      .append("td")
      .attr("class", "metric-cell")
      .text((d) => {
        return d;
      });

    d3.select("#detailed-metrics")
      .append("ul")
      .attr("class", "default-metrics")
      .selectAll("defaultDetails")
      .data(defaultData)
      .enter()
      .append("li")
      .attr("class", "chart default")
      .text((d) => {
        return d;
      });
  }

  showTitle(d) {
    const { data } = d;

    const title = document.getElementById(`${data.sub}`);

    title.classList.add("visible");
  }

  hideTitle(d) {
    const { data } = d;

    const title = document.getElementById(`${data.sub}`);

    title.classList.remove("visible");
  }

  render() {
    this.appendChartInfo();

    const root = d3.hierarchy(this.data);

    d3.treemap()
      .size([this.width, this.height])
      .paddingTop(30)
      .paddingRight(7)
      .paddingInner(3)
      .round(true)(root)
      .sort((a, b) => b.value - a.value);

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
      .style("fill", (t) => d3.interpolateRdYlGn(t.data.averageScore))
      .on("click", (d) => {
        this.showData(d);
      })
      .on("mouseover", (d) => {
        this.showTitle(d);
      })
      .on("mouseout", (d) => {
        this.hideTitle(d);
      });

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
        return d.x0;
      })
      .attr("y", function (d) {
        return d.y0 + 20;
      })
      .text(function (d) {
        return d.name;
      })
      .text((d) => d.data.name)
      .attr("class", (d) => `subreddit-text`)
      .attr("id", (d) => `${d.data.name}`);
  }
}

export default Treemap;
