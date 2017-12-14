// Tufteplot class

class Tufteplot {

    constructor(dObj) {
        // Board
        this.board = {};

        // Board Dims for Unscaled SVG
        this.boardWidth = 1200;
        this.boardHeight = 300;

        // Margins for Main Graphics
        // Title, Legend and Scales fall in Margins
        this.boardTopMargin = 40;
        this.boardBottomMargin = 50;
        this.boardLeftMargin = 40;
        this.boardRightMargin = 80;

        // Main Graphic Dims
        this.graphicWidth = (this.boardWidth - this.boardLeftMargin - this.boardRightMargin);
        this.graphicHeight = (this.boardHeight - this.boardTopMargin - this.boardBottomMargin);

        // Climate Data and Field
        this.data = dObj;
        this.dataSummary = [] // TODO
        this.field = "DryBulbTemp";

        this.color = '#1d5fab'; // Default Blue
        this.radius = this.graphicWidth / 365 / 4;
    }

    summarizeDaily() {
        this.dataSummary = [];

        var dataHourly = [];
        var dp;

        // create 2D Array for temp stats
        for (var d = 0; d < 365; d++) {
            var dataHourly = [];
            for (var h = 0; h < 24; h++) {
                dp = this.data.ticks[d * 24 + h];
                dataHourly.push(dp.valueOf(this.field));
            }

            this.dataSummary.push({
                min: d3.min(dataHourly),
                max: d3.max(dataHourly),
                mean: d3.mean(dataHourly),
                q1: d3.quantile(dataHourly, 0.25),
                q3: d3.quantile(dataHourly, 0.75),
                span: Math.abs(d3.quantile(dataHourly, 0.75) - d3.quantile(dataHourly, 0.25))
            });

            // dataDaily.push(dailySummary);
            // dataHourly = [];

            // return dataDaily;
        }
    }

    // Draws the D3 chart to the viewport
    drawChart(viewport) {
        this.summarizeDaily();

        // Remove exisiting graphics from viewport
        viewport.selectAll("svg").remove();

        // Add SVG Canvas
        this.board.svg = viewport
            .append("svg")
            .attr("class", "board")
            .attr("width", this.boardWidth)
            .attr("height", this.boardHeight)
            .attr("viewBox", "0 0 " + this.boardWidth + " " + this.boardHeight)
            .attr("preserveAspectRatio", "xMidYMid meet");

        // Add Main Plot
        this.board.plots = this.board.svg.append("g")
            .attr("class", "tufteplot-plots")
            .attr("transform", "translate(" + this.boardLeftMargin  + "," + this.boardTopMargin + ")");
            
        this.drawPlots();

        // Add X Axis
        this.board.xAxis = this.board.svg.append("g")
            .attr("class", "tufteplot-xAxis")
            .attr("transform", "translate(" + this.boardLeftMargin + "," + (this.graphicHeight * 1.04 + this.boardTopMargin) + ")");
        this.drawXAxis();

        // Add Y Axis
        this.board.yAxis = this.board.svg.append("g")
            .attr("class", "tufteplot-yAxis")
            .attr("transform", "translate(" + (this.boardLeftMargin - 8) + "," + this.boardTopMargin + ")");
        this.drawYAxis();

        // // Add Legend
        // this.board.legend = this.board.svg.append("g")
        //     .attr("class", "heatmap-legend")
        //     .attr("transform", "translate(" + (this.boardLeftMargin + this.graphicWidth) + "," + this.boardTopMargin + ")");
        // this.drawLegend();

        // Add Title
        this.board.title = this.board.svg.append("g")
            .attr("class", "tufteplot-title");
        this.drawTitle();
    }

    // Draws plots to the plot group of the SVG
    drawPlots() {
        // X SCALE
        var xValue = function (d, i) { return i; };
        var xScale = d3.scaleLinear()
            .domain([0, 364])
            .range([0, this.graphicWidth]);
        var xMap = function (d, i) { return xScale(xValue(d, i)); };

        // Y SCALE
        var col = this.field;
        // var yValueQ3 = function (d) { return d.q3; };
        
        var yScale = d3.scaleLinear()
            .domain([this.data.metaOf(col).max + 2, this.data.metaOf(col).min - 2])
            .range([0, this.graphicHeight]);

        // var gh = this.graphicHeight;
        var yMapQ3 = function (d) { return yScale(d.q3); };
        var yMapMax = function (d) { return yScale(d.max); };
        var yMapMin = function (d) { return yScale(d.min); };
        var yMapMean = function (d) { return yScale(d.mean); };

        // IQR HEIGHT
        var hMap = function(d) { return Math.abs(yScale(d.q3) - yScale(d.q1)); };


        // COLOR SCALE
        // 
        // var cValue = function (d) { return d.valueOf(col) };
        // var cScale = d3.scaleLinear()
        //     .domain(this.data.metaOf(col).domain)
        //     .range([d3.rgb(this.colorLow), d3.rgb(this.colorHigh)]);
        // var cMap = function (d) { return cScale(cValue(d)); };

        // DRAW Q1 - Q3 RECTS
        this.board.plots.append("g")
            .selectAll("rect")
            .data(this.dataSummary)
            .enter().append("rect")
            .attr("class", "tufteplot-iqr")
            .attr("x", function (d, i) { return xMap(d, i); }) //*
            .attr("y", function (d) { return yMapQ3(d); })
            .attr("width", this.graphicWidth / 365) //*
            .attr("height", function (d) { return hMap(d); }) //*
            // .attr("transform", "translate(" + (this.graphicWidth / 365 * -0.5) + "," + (this.graphicHeight / 24 * -0.5) + ")")
            .attr("fill", d3.rgb(this.color));
            // .attr("fill", function (d) { return cMap(d); });

        // DRAW MEAN RECTS
        this.board.plots.append("g")
            .selectAll("rect")
            .data(this.dataSummary)
            .enter().append("rect")
            .attr("class", "tufteplot-mean")
            .attr("x", function (d, i) { return xMap(d, i); }) //*
            .attr("y", function (d) { return yMapMean(d); })
            .attr("width", this.graphicWidth / 365) //*
            .attr("height", 0.5) //*
        // .attr("transform", "translate(" + (this.graphicWidth / 365 * -0.5) + "," + (this.graphicHeight / 24 * -0.5) + ")")
            .attr("fill", d3.rgb('#ffffff'));

        // DRAW MAX-MIN CIRC
        this.board.plots.append("g")
            .selectAll("circle")
            .data(this.dataSummary)
            .enter().append("circle")
            .attr("class", "tufteplot-max")
            .attr("cx", function (d, i) { return xMap(d, i); }) //*
            .attr("cy", function (d) { return yMapMax(d); })
            .attr("r", this.radius) //*
            // .attr("transform", "translate(" + (this.graphicWidth / 365 * -0.5) + "," + (this.graphicHeight / 24 * -0.5) + ")")
            .attr("fill", d3.rgb(this.color));

        this.board.plots.append("g")
            .selectAll("circle")
            .data(this.dataSummary)
            .enter().append("circle")
            .attr("class", "tufteplot-min")
            .attr("cx", function (d, i) { return xMap(d, i); }) //*
            .attr("cy", function (d) { return yMapMin(d); })
            .attr("r", this.radius) //*
            // .attr("transform", "translate(" + (this.graphicWidth / 365 * -0.5) + "," + (this.graphicHeight / 24 * -0.5) + ")")
            .attr("fill", d3.rgb(this.color));
    }

    // Draws x-Axis to the xAxis group of the SVG
    drawXAxis() {
        var dayScale = d3.scaleTime()
            .domain([new Date(clima.utils.datetime.year, 0, 1), new Date(clima.utils.datetime.year, 11, 31)])
            .range([0, this.graphicWidth]);

        var xAxis = d3.axisBottom()
            .scale(dayScale)
            .ticks(d3.timeMonth) //should display 1 month intervals
            .tickSize(16, 0)
            .tickFormat(d3.timeFormat("%b")); //%b - abbreviated month name.*

        this.board.xAxis.call(xAxis);

        // X-Axis Text
        this.board.xAxis.selectAll("text")
            .attr("transform", "translate(" + (this.graphicWidth / 24) + ", -10)");
    }

    // Draws y-Axis to the yAxis group of the SVG
    drawYAxis() {

        var yScale = d3.scaleLinear()
            .domain([23, 0])
            .range([0, this.graphicHeight]);

        var yAxis = d3.axisLeft()
            .scale(yScale)
            .tickValues([0, 6, 12, 18, 23]);

        this.board.yAxis.call(yAxis);
    }

    // Draws the chart title to the title group of the SVG
    drawTitle() {
        // TODO
        var textData = this.data.location.city + "  |  " + this.data.location.country + "  |  " + this.field;

        // remove any exiting text
        this.board.title.selectAll("text")
            .remove();

        // add new title
        this.board.title.append("text")
            .attr("x", this.boardWidth / 2)
            .attr("y", this.boardTopMargin / 2)
            .text(textData)
            .attr("text-anchor", "middle")
            .attr("font-family", "sans-serif")
            .attr("font-size", "20px")
            .attr("fill", "black");

    }


}
