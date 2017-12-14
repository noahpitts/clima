// Heatmap Class
class Heatmap {

    // Heatmap constructor
    // Takes in viewport div to draw graphic to
    constructor(dObj) {

        // Board
        this.board = {}; // Ref to Board objects

        // Board Dims for Unscaled SVG
        this.boardWidth = 1000;
        this.boardHeight = 300;

        // Margins for Main Graphics
        // Title, Legend and Scales fall in Margins
        this.boardTopMargin = 40;
        this.boardBottomMargin = 40;
        this.boardLeftMargin = 40;
        this.boardRightMargin = 40;

        // Main Graphic Dims
        this.graphicWidth = (this.boardWidth - this.boardLeftMargin - this.boardRightMargin);
        this.graphicHeight = (this.boardHeight - this.boardTopMargin - this.boardBottomMargin);

        // Climate Data and Field
        this.data = dObj; // TODO
        this.field = "DryBulbTemp"; // TODO - make a dictionary lookup

        // Low and High colors for graphics
        this.colorLow = "#ffff00"; // Deafult Yellow
        this.colorHigh = '#0000ff'; // Default Blue

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

        // Add Main Pixel Array Graphic
        this.board.pixels = this.board.svg.append("g")
            .attr("class", "heatmap-pixels")
            .attr("transform", "translate(" + this.boardLeftMargin + "," + this.boardTopMargin + ")");
        this.drawPixels();

        // Add X Axis
        this.board.xAxis = this.board.svg.append("g")
            .attr("class", "heatmap-xAxis")
            .attr("transform", "translate(" + this.boardLeftMargin + "," + (this.boardHeight - this.boardBottomMargin) + ")");
        this.drawXAxis();

        // Add Y Axis
        this.board.yAxis = this.board.svg.append("g")
            .attr("class", "heatmap-yAxis")
            .attr("transform", "translate(0," + this.boardTopMargin + ")");
        this.drawYAxis();

        // Add Legend
        this.board.legend = this.board.svg.append("g")
            .attr("class", "heatmap-legend")
            .attr("transform", "translate(" + (this.boardLeftMargin + this.graphicWidth) + "," + this.boardTopMargin + ")");
        this.drawLegend();

        // Add Title
        this.board.title = this.board.svg.append("g")
            .attr("class", "heatmap-title");
        this.drawTitle();

    }

    // Draws pixels to the pixels group of the SVG
    drawPixels() {
        // X SCALE
        var xValue = function (d) { return d.dayOfYear(); };
        var xScale = d3.scaleLinear()
            .domain([0, 364])
            .range([0, this.graphicWidth]);
        var xMap = function (d) { return xScale(xValue(d)); };

        // Y SCALE
        var yValue = function (d) { return d.hourOfDay(); };
        var yScale = d3.scaleLinear()
            .domain([23, 0])
            .range([0, this.graphicHeight]);
        var yMap = function (d) { return yScale(yValue(d)); };

        // COLOR SCALE
        var col = this.field;
        var cValue = function (d) { return d.valueOf(col) };
        var cScale = d3.scaleLinear()
            .domain(this.data.metaOf(col).domain)
            .range([d3.rgb(this.colorLow), d3.rgb(this.colorHigh)]);
        var cMap = function (d) { return cScale(cValue(d)); };

        // DRAW PIXELS
        this.board.pixels.selectAll("rect")
            .data(this.data.ticks)
            .enter().append("rect")
            .attr("class", "heatmap-pixel")
            .attr("x", function (d) { return xMap(d); })
            .attr("y", function (d) { return yMap(d); })
            .attr("width", this.graphicWidth / 365)
            .attr("height", this.graphicHeight / 24)
            .attr("transform", "translate(" + (this.graphicWidth / 365 * -0.5) + "," + (this.graphicHeight / 24 * -0.5) + ")")
            .attr("fill", function (d) { return cMap(d); });
    }

    // TODO
    // Draws x-Axis to the xAxis group of the SVG
    drawXAxis() {
        // var dayScale = d3.scaleTime()
        //     .domain([new Date(clima.utils.datetime.year, 0, 1), new Date(clima.utils.datetime.year, 11, 31)])
        //     .range([0, drawWidth]);

        // var xAxis = d3.axisBottom()
        //     .scale(dayScale)
        //     .ticks(d3.timeMonth) //should display 1 month intervals
        //     .tickSize(16, 0)
        //     .tickFormat(d3.timeFormat("%b")); //%b - abbreviated month name.*

        // // draw x-axis
        // board.g.append("g")
        //     .attr("class", "x-axis")
        //     .attr("transform", "translate(0," + (drawHeight * 1.05) + ")");

        // d3.select(".x-axis").call(xAxis);
    }

    // TODO
    // Draws y-Axis to the yAxis group of the SVG
    drawYAxis() {
        // var yValue = function (d) { return ; }; // data -> value

        

        // var yMap = function (d) {  }; // data -> display

        // var yAxis = d3.axisLeft()
        //     .scale(yScale)
        //     .tickValues([0, 6, 12, 18, 23]); // we can explicitly set tick values this way
        
        // //draw y-axis
        // board.g.append("g")
        //     .attr("class", "y-axis")
        //     .attr("transform", "translate(-15,0)");

        // d3.select(".y-axis").call(yAxis);
    }

    // TODO
    // Draws the legend to the legend group of the SVG
    drawLegend() {
        // TODO
    }

    // TODO
    // Draws the chart title to the title group of the SVG
    drawTitle() {
        // TODO
    }

    // TODO
    // Draws the Chart Editor Controls
    drawControls() {
        // TODO
    }

    // TODO
    updateColor() {
        // TODO
    }
}
