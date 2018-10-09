// ------------------
// PSYCHROMETRIC CHART TYPE
// ------------------

// Namespace
// ------------------
var clima = clima || {};
clima.chart = clima.chart || {};
clima.chart.psychrometric = clima.chart.psychrometric || {};
clima.charts = clima.charts || [];

// Chart MetaData
// ------------------
// Name of the chart type to be displayed in the controls **Required**
clima.chart.psychrometric.name = "Psychrometric"

// Util function to create a new Heatmap **Required**
clima.chart.psychrometric.create = function (data) {
    return new Psychrometric(data);
}

// Add this chart to the manifest
clima.charts.push(clima.chart.psychrometric);

// Psychrometric class
// ------------------
class Psychrometric {
    constructor(dObj) {
        // Board
        this.board = {};

        // Board Dims for Unscaled SVG
        this.boardWidth = 1250;
        this.boardHeight = 410;

        // Margins for Main Graphics
        // Title, Legend and Scales fall in Margins
        this.boardTopMargin = 60;
        this.boardBottomMargin = 60;
        this.boardLeftMargin = 60;
        this.boardRightMargin = 110;

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

        // Add Main Lines
        this.board.lines = this.board.svg.append("g")
            .attr("class", "psychrometric-lines")
            .attr("transform", "translate(" + this.boardLeftMargin + "," + this.boardTopMargin + ")");
        this.drawLines();

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

    satpress(db) {
        // From CBE comfort_tool
        var tKel = db + 273.15,
        C1 = -5674.5359,
        C2 = 6.3925247,
        C3 = -0.9677843 * Math.pow(10, -2),
        C4 = 0.62215701 * Math.pow(10, -6),
        C5 = 0.20747825 * Math.pow(10, -8),
        C6 = -0.9484024 * Math.pow(10, -12),
        C7 = 4.1635019,
        C8 = -5800.2206,
        C9 = 1.3914993,
        C10 = -0.048640239,
        C11 = 0.41764768 * Math.pow(10, -4),
        C12 = -0.14452093 * Math.pow(10, -7),
        C13 = 6.5459673,
        pascals;

    if (tKel < 273.15) {
        pascals = Math.exp(C1 / tKel + C2 + tKel * (C3 + tKel * (C4 + tKel * (C5 + C6 * tKel))) + C7 * Math.log(tKel));
    } else if (tKel >= 273.15) {
        pascals = Math.exp(C8 / tKel + C9 + tKel * (C10 + tKel * (C11 + tKel * C12)) + C13 * Math.log(tKel));
    }
    return pascals;
    }

    humRatio(db, rh) {
        // From CBE comfort_tool
        let pw = rh * this.satpress(db) / 100;
        return 0.62198 * pw / (101325 - pw);
    }

    drawLines() {
        let minDB = this.data.metaOf("DryBulbTemp").min;
        let maxDB = this.data.metaOf("DryBulbTemp").max;

        let db_scale = d3.scaleLinear()
            .range([0, this.graphicWidth])
            .domain([minDB, maxDB]);

        let hr_scale = d3.scaleLinear()
            .range([0, this.graphicHeight])
            .domain([0, 30]);


        let pline = d3.line()
          .x(function(d) {
          return db_scale(d.db)
        })
          .y(function(d) {
          return hr_scale(1000 * d.hr)
        })


        // dynamic way of drawing rh lines - from CBE comfort_tool
        for (var i=100; i>=10; i-=10){
            let RHline = []
            for (var t = minDB; t <= maxDB; t += 0.5){
                RHline.push({"db": t, "hr": this.humRatio(t, i)})
            }
            if (i==100){
                this.board.lines
                    .append("path")
                    .attr("d", pline(RHline))
                    .attr("class", "rh100")
                    .attr("stroke", "black");
            } else {
                this.board.lines
                    .append("path")
                    .attr("d", pline(RHline))
                    .attr("class", "rhline")
                    .attr("stroke", "gray");
            } 
        }


    }

    // Draws plots to the plot group of the SVG
    drawPoints() {
        let minDB = this.data.metaOf("DryBulbTemp").min;
        let maxDB = this.data.metaOf("DryBulbTemp").max;

        // X SCALE
        let dbValue = function (d) { return d.valueOf("DryBulbTemp"); };
        
        let dbScale = d3.scaleLinear()
            .range([0, this.graphicWidth])
            .domain([minDB, maxDB]);

        let xMap = function (d) { return dbScale(dbValue(d)); };

        // Y SCALE
        let hrValue = function (d) {
            var db = d.valueOf("DryBulbTemp");
            var rh = d.valueOf("RelHumid");
            return humRatio(db, rh);
        };

        let hrScale = d3.scaleLinear()
            .range([0, this.graphicHeight])
            .domain([0, 30]);

        let yMap = function (d) { return hrScale(hrValue(d)); };

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

    // CONTROLS
    //-------------------------------------------------

    // Draws the chart controls to the control box
    drawControls(controlBox) {
        controlBox.selectAll("div").remove();
    }

    // End of the Psychrometric Class
}
