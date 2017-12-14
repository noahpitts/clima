// Psychrometric class

class Psychrometric {
    constructor(dObj) {
        // Board
        this.board = {};

        // Board Dims for Unscaled SVG
        this.boardWidth = 1200;
        this.boardHeight = 600;

        // Margins for Main Graphics
        // Title, Legend and Scales fall in Margins
        this.boardTopMargin = 60;
        this.boardBottomMargin = 50;
        this.boardLeftMargin = 40;
        this.boardRightMargin = 80;

        // Main Graphic Dims
        this.graphicWidth = (this.boardWidth - this.boardLeftMargin - this.boardRightMargin);
        this.graphicHeight = (this.boardHeight - this.boardTopMargin - this.boardBottomMargin);

        // Climate Data and Field
        this.data = dObj;
        // this.dataSummary = [] // TODO
        this.fieldX = "DryBulbTemp";
        this.fieldY = "RelHumid";

        this.color = '#1d5fab'; // Default Blue
        this.radius = this.graphicWidth / 500;
    }

    // Draws the D3 chart to the viewport
    drawChart(viewport) {
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
        this.board.points = this.board.svg.append("g")
            .attr("class", "psychrometric-points")
            .attr("transform", "translate(" + this.boardLeftMargin + "," + this.boardTopMargin + ")");
        this.drawPoints();

        // Add X Axis
        this.board.xAxis = this.board.svg.append("g")
            .attr("class", "psychrometric-xAxis")
            .attr("transform", "translate(" + this.boardLeftMargin + "," + (this.graphicHeight * 1.04 + this.boardTopMargin) + ")");
        this.drawXAxis();

        // Add Y Axis
        this.board.yAxis = this.board.svg.append("g")
            .attr("class", "psychrometric-yAxis")
            .attr("transform", "translate(" + (this.boardLeftMargin - 8) + "," + this.boardTopMargin + ")");
        this.drawYAxis();

        // // Add Legend
        // this.board.legend = this.board.svg.append("g")
        //     .attr("class", "heatmap-legend")
        //     .attr("transform", "translate(" + (this.boardLeftMargin + this.graphicWidth) + "," + this.boardTopMargin + ")");
        // this.drawLegend();

        // Add Title
        this.board.title = this.board.svg.append("g")
            .attr("class", "psychrometric-title");
        this.drawTitle();
    }

    // Draws plots to the plot group of the SVG
    drawPoints() {
        // X SCALE
        var colX = this.fieldX;
        var xValue = function (d) { return d.valueOf(colX); };
        var xScale = d3.scaleLinear()
            .domain(this.data.metaOf(colX).domain)
            .range([0, this.graphicWidth]);
        var xMap = function (d) { return xScale(xValue(d)); };

        // Y SCALE

        // TODO: absolute humidity as a function of DryBulb Temp and Dewpoint
        var absHum = function (T, D) {
            // ref: https://www.nasa.gov/centers/dryden/pdf/87878main_H-937.pdf

            var a = -4.9283;
            var b = -2937.4;
            var c = 23.5518;
            var d = 273;
            var k = 0.21668;

            var H = k * Math.pow((T + d), -1) * Math.pow(10, (c + b) / (D + d)) * Math.pow((D + d), a);
            return H;
        }
        var yValue = function (d) {
            var Tdb = d.valueOf("DryBulbTemp");
            var Dp = d.valueOf("DewPtTemp");
            return absHum(Tdb, Dp);
        };
        var maxTdb = this.data.metaOf("DryBulbTemp").max;
        var maxDp = this.data.metaOf("DewPtTemp").max;
        var yScale = d3.scaleLinear()
            .domain([absHum(maxTdb, maxDp) * 1.2, 0])
            .range([0, this.graphicHeight]);
        var yMap = function (d) { return yScale(yValue(d)); };

        // DRAW POINTS
        this.board.points
            .selectAll("circle")
            .data(this.data.ticks)
            .enter().append("circle")
            .attr("class", "scatterplot-points")
            .attr("cx", function (d) { return xMap(d); })
            .attr("cy", function (d) { return yMap(d); })
            .attr("r", this.radius)
            .attr("fill", d3.rgb(this.color));
    }

    // Draws x-Axis to the xAxis group of the SVG
    drawXAxis() {
        var colX = this.fieldX;
        var xScale = d3.scaleLinear()
            .domain(this.data.metaOf(colX).domain)
            .range([0, this.graphicWidth]);

        var xAxis = d3.axisBottom()
            .scale(xScale)
            .ticks(10);

        this.board.xAxis.call(xAxis);
    }

    // Draws y-Axis to the yAxis group of the SVG
    drawYAxis() {
        var absHum = function (T, D) {
            // ref: https://www.nasa.gov/centers/dryden/pdf/87878main_H-937.pdf

            var a = -4.9283;
            var b = -2937.4;
            var c = 23.5518;
            var d = 273;
            var k = 0.21668;

            var H = k * Math.pow((T + d), -1) * Math.pow(10, (c + b) / (D + d)) * Math.pow((D + d), a);
            return H;
        }
        var maxTdb = this.data.metaOf("DryBulbTemp").max;
        var maxDp = this.data.metaOf("DewPtTemp").max;
        var yScale = d3.scaleLinear()
            .domain([absHum(maxTdb, maxDp) * 1.2, 0])
            .range([0, this.graphicHeight]);

        var yAxis = d3.axisLeft()
            .scale(yScale)
            .ticks(8);

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