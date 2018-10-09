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
        this.name = "Psychrometric Chart";

        // Board
        this.board = {};

        // Board Dims for Unscaled SVG
        this.boardWidth = 1250;
        this.boardHeight = 810;

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

        this.fieldX = clima.utils.getField("DryBulbTemp");
        this.fieldY = clima.utils.getField("RelHumid");

        this.color = '#1d5fab'; // Default Blue
        this.radius = this.graphicWidth / 350;

        this.title = this.name;

        this.minDB;
        this.maxDB;
    }

    // Draws the D3 chart to the viewport
    drawChart(viewport) {
        this.minDB = this.data.metaOf("DryBulbTemp").min - 2.5;
        this.maxDB = this.data.metaOf("DryBulbTemp").max + 2.5;

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

        // Clipping Plane
        this.board.clipPath = this.board.svg
            .append("clipPath")
            .attr("id", "clip")
            .append("rect")
            .attr("x", "0")
            .attr("y", "0")
            .attr("width", this.graphicWidth)
            .attr("height", this.graphicHeight)
            .attr("transform", "translate(" + this.boardLeftMargin + "," + this.boardTopMargin + ")")

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
            .attr("transform", "translate(" + this.boardLeftMargin + "," + (this.graphicHeight + this.boardTopMargin) + ")");
        this.drawXAxis();

        // Add Y Axis
        this.board.yAxis = this.board.svg.append("g")
            .attr("class", "psychrometric-yAxis")
            .attr("transform", "translate(" + (this.boardLeftMargin + this.graphicWidth) + "," + this.boardTopMargin + ")");
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

    static satpress(db) {
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

    static humRatio(db, rh) {
        // From CBE comfort_tool
        let pw = rh * Psychrometric.satpress(db) / 100;
        return 0.62198 * pw / (101325 - pw);
    }

    drawLines() {

        let db_scale = d3.scaleLinear()
            .range([0, this.graphicWidth])
            .domain([this.minDB, this.maxDB]);

        let hr_scale = d3.scaleLinear()
            .range([0, this.graphicHeight])
            .domain([30, 0]);


        let pline = d3.line()
          .x(function(d) {
          return db_scale(d.db)
        })
          .y(function(d) {
          return hr_scale(1000 * d.hr)
        })


        // dynamic way of drawing rh lines - from CBE comfort_tool
        for (var i=100; i>=10; i-=10){
            let RHline = [];
            for (var t = this.minDB; t <= this.maxDB; t += 0.5){
                let hr = Psychrometric.humRatio(t, i);
                // if (hr_scale(1000 * hr) > 30) {
                    RHline.push({"db": t, "hr": hr});
                // }
                
            }
            if (i==100){
                this.board.lines
                    .append("path")
                    .attr("d", pline(RHline))
                    .attr("class", "rh100")
                    .attr("stroke", "black")
                    .attr("clip-path", "url(#clip)")
                    .attr("fill", "none");
            } else {
                this.board.lines
                    .append("path")
                    .attr("d", pline(RHline))
                    .attr("class", "rhline")
                    .attr("stroke", "gray")
                    .attr("clip-path", "url(#clip)")
                    .attr("fill", "none");
            } 
        }
    }

    // Draws plots to the plot group of the SVG
    drawPoints() {

        // X SCALE
        let dbValue = function (d) { return d.valueOf("DryBulbTemp"); };
        
        let dbScale = d3.scaleLinear()
            .range([0, this.graphicWidth])
            .domain([this.minDB, this.maxDB]);

        let xMap = function (d) { return dbScale(dbValue(d)); };

        // Y SCALE
        let hrValue = function (d) {
            var db = d.valueOf("DryBulbTemp");
            var rh = d.valueOf("RelHumid");
            return Psychrometric.humRatio(db, rh);
        };

        let hrScale = d3.scaleLinear()
            .range([0, this.graphicHeight])
            .domain([30, 0]);

        let yMap = function (d) { return hrScale(1000 * hrValue(d)); };

        // PopUp String
        var unitsX = this.fieldX.units;
        var unitsY = this.fieldY.units;
        var f = d3.format(".2f");
        var popup = function(d) {
            let string = (dbValue(d) + " " + unitsX + "\n" + f(hrValue(d) * 1000) + " g\u02b7/kg\u1d48\u1d43");
            return string;
        };

        // DRAW POINTS
        this.board.points
            .selectAll("circle")
            .data(this.data.ticks)
            .enter().append("circle")
            .attr("class", "scatterplot-points")
            .attr("cx", function (d) { return xMap(d); })
            .attr("cy", function (d) { return yMap(d); })
            .attr("r", this.radius)
            .attr("fill", d3.rgb(this.color))
            .attr("fill-opacity", "0.8")
            .append("svg:title")
            .text(function (d) { return popup(d); });
    }

    // Draws x-Axis to the xAxis group of the SVG
    drawXAxis() {
        var xScale = d3.scaleLinear()
            .domain([this.minDB, this.maxDB])
            .range([0, this.graphicWidth]);

        var xAxis = d3.axisBottom()
            .scale(xScale)
            .ticks(10);

        this.board.xAxis.call(xAxis);

        // X-Axis Units
        this.board.xAxis.append("text")
            .attr("x", this.graphicWidth / 2)
            .attr("y", 40)
            .text(this.fieldX.name + " (" + this.fieldX.units + ")")
            .attr("text-anchor", "middle")
            .attr("font-family", "sans-serif")
            .attr("font-size", "14px")
            .attr("fill", "black");
    }

    // Draws y-Axis to the yAxis group of the SVG
    drawYAxis() {
        let hrScale = d3.scaleLinear()
            .range([0, this.graphicHeight])
            .domain([30, 0]);

        var yAxis = d3.axisRight()
            .scale(hrScale)
            .ticks(8);

        this.board.yAxis.call(yAxis);

        // Y-Axis Units
        this.board.yAxis.append("text")
            .attr("x", 30)
            .attr("y", this.graphicHeight / 2)
            .text("Humidity Ratio (g\u02b7/kg\u1d48\u1d43)") // TODO: Fix the subscript of the units
            .attr("text-anchor", "middle")
            .attr("transform", "rotate(90, 30, " + (this.graphicHeight / 2) + ")")
            .attr("font-family", "sans-serif")
            .attr("font-size", "14px")
            .attr("fill", "black");
    }

    // Draws the chart title to the title group of the SVG
    drawTitle() {
        // remove any exiting text
        this.board.title.selectAll("text")
            .remove();

        // add new title
        this.board.title.append("text")
            .attr("x", this.boardWidth / 2)
            .attr("y", this.boardTopMargin / 2)
            .text(this.title)
            .attr("text-anchor", "middle")
            .attr("font-family", "sans-serif")
            .attr("font-size", "24px")
            .attr("fill", "black");
    }

    // CONTROLS
    //-------------------------------------------------

    drawTitleControl(controlBox) {
        var titleControlBox = controlBox.append("div")
            .attr("class", "row container control-box");
    
        // Title Heading
        titleControlBox.append("div")
            .attr("class", "row")
            .append("h5")
            .attr("class", "container")
            .text("Chart Title");

        // Title Field
        var inputGroup = titleControlBox.append("div").attr("class", "input-group mb-3")
        
        inputGroup.append("input")
            .attr("type", "text")
            .attr("class", "form-control")
            .attr("id", "chartTitle")
            .attr("placeholder", this.title)
            // .attr("aria-label", this.title)
            // .attr("aria-describedby", "button-addon2");

        var inputGroupAppend = inputGroup.append("div")
            .attr("class", "input-group-append");

        inputGroupAppend.append("button")
            .attr("class", "btn btn-outline-secondary")
            .attr("type", "button")
            .attr("id", "button-applyTitle")
            .text("Apply");
    
        inputGroupAppend.append("button")
            .attr("class", "btn btn-outline-secondary")
            .attr("type", "button")
            .attr("id", "button-resetTitle")
            .text("Reset");

        $(document).ready(function () {
            $("#button-applyTitle").click(clima.editor.chart.applyTitle);
            $("#button-resetTitle").click(clima.editor.chart.resetTitle);
        });
    }

    applyTitle () {
        clima.editor.chart.title = $("#chartTitle").val();
        clima.editor.chart.drawChart(clima.editor.editorViewport);
    }

    resetTitle () {
        clima.editor.chart.title = clima.editor.chart.name + " in " + clima.editor.chart.data.location.city;
        $("#chartTitle").val(clima.editor.chart.title);
        clima.editor.chart.drawChart(clima.editor.editorViewport);
    }

    drawColorControl(controlBox) {
        var colorControlBox = controlBox.append("div")
        .attr("class", "row control-box");

        var color1ControlBox = colorControlBox.append("div")
        .attr("class", "col-sm-6")
    
        var color2ControlBox = colorControlBox.append("div")
        .attr("class", "col-sm-6")

        // Color 1 (High Value)
        color1ControlBox.append("div")
            .attr("class", "row")
            .append("h5")
            .attr("class", "container")
            .text("Color");

        color1ControlBox.append("input")
            .attr("type", "color")
            .attr("value", this.color)
            .attr("class", "container custom-select")
            .attr("id", "color-select1");

        // Add Event Listener for color 1
        $(document).ready(function () {
            $("#color-select1").change(function (evt) {
                var colorHighVal = $("#color-select1").val();
                clima.editor.chart.color = colorHighVal;
        
                // Draw new chart
                clima.editor.chart.drawChart(clima.editor.editorViewport);
            });
        });

    }

    // Draws the chart controls to the control box
    drawControls(controlBox) {
        controlBox.selectAll("div").remove();

        this.drawColorControl(controlBox);
        this.drawTitleControl(controlBox);
    }

    // End of the Psychrometric Class
}
