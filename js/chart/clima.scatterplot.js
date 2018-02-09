// ------------------
// SCATTERPLOT CHART TYPE
// ------------------

// Namespace
// ------------------
var clima = clima || {};
clima.chart = clima.chart || {};
clima.chart.scatterplot = clima.chart.scatterplot || {};
clima.charts = clima.charts || [];

// Chart MetaData
// ------------------
// Name of the chart type to be displayed in the controls **Required**
clima.chart.scatterplot.name = "Scatterplot"

// Util function to create a new Heatmap **Required**
clima.chart.scatterplot.create = function (data) {
    return new Scatterplot(data);
}

// Add this chart to the manifest
clima.charts.push(clima.chart.scatterplot);

// Scatterplot class
// ------------------
class Scatterplot {
    constructor(dObj) {
        // Board
        this.board = {};

        // Board Dims for Unscaled SVG
        this.boardWidth = 1200;
        this.boardHeight = 400;

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

        this.fieldX = clima.utils.getField("DryBulbTemp");
        this.fieldY = clima.utils.getField("RelHumid");

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
            .attr("class", "scatterplot-points")
            .attr("transform", "translate(" + this.boardLeftMargin + "," + this.boardTopMargin + ")");
        this.drawPoints();

        // Add X Axis
        this.board.xAxis = this.board.svg.append("g")
            .attr("class", "scatterplot-xAxis")
            .attr("transform", "translate(" + this.boardLeftMargin + "," + (this.graphicHeight * 1.04 + this.boardTopMargin) + ")");
        this.drawXAxis();

        // Add Y Axis
        this.board.yAxis = this.board.svg.append("g")
            .attr("class", "scatterplot-yAxis")
            .attr("transform", "translate(" + (this.boardLeftMargin - 8) + "," + this.boardTopMargin + ")");
        this.drawYAxis();

        // // Add Legend
        // this.board.legend = this.board.svg.append("g")
        //     .attr("class", "heatmap-legend")
        //     .attr("transform", "translate(" + (this.boardLeftMargin + this.graphicWidth) + "," + this.boardTopMargin + ")");
        // this.drawLegend();

        // Add Title
        this.board.title = this.board.svg.append("g")
            .attr("class", "scatterplot-title");
        this.drawTitle();
    }

    // Draws plots to the plot group of the SVG
    drawPoints() {
        // X SCALE
        var colX = this.fieldX.key;
        var xValue = function (d) { return d.valueOf(colX); };
        var xScale = d3.scaleLinear()
            .domain(this.data.metaOf(colX).domain)
            .range([0, this.graphicWidth]);
        var xMap = function (d) { return xScale(xValue(d)); };

        // Y SCALE
        var colY = this.fieldY.key;
        var yValue = function (d) { return d.valueOf(colY); };
        var yScale = d3.scaleLinear()
            .domain([this.data.metaOf(colY).max, this.data.metaOf(colY).min])
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
        var colX = this.fieldX.key;
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
        var colY = this.fieldY.key;
        var yScale = d3.scaleLinear()
            .domain([this.data.metaOf(colY).max, this.data.metaOf(colY).min - 10])
            .range([0, this.graphicHeight]);

        var yAxis = d3.axisLeft()
            .scale(yScale)
            .ticks(8);

        this.board.yAxis.call(yAxis);
    }

    // Draws the chart title to the title group of the SVG
    drawTitle() {
        // TODO
        var textData = this.data.location.city + "  |  " + this.data.location.country + "  |  " + this.fieldX.name + " x " + this.fieldY.name;

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

        // ---------------
        // Field Selection
        // ---------------
        var fieldSelectRow = controlBox.append("div")
            .attr("class", "row");

        var fieldSelectX = fieldSelectRow.append("div")
            .attr("class", "col-sm-5")
            .append("select")
            .attr("class", " container custom-select")
            .attr("id", "fieldX-select");

        var fieldSelectY = fieldSelectRow.append("div")
            .attr("class", "col-sm-5")
            .append("select")
            .attr("class", " container custom-select")
            .attr("id", "fieldY-select");

        // Add Field Options
        for (var i = 0; i < clima.utils.EPWDataFields.length; i++) {
            var fieldX = clima.utils.EPWDataFields[i];
            var optionX = fieldSelectX.append("option")
                .attr("value", i)
                .text(fieldX.name);

            // Select the correct initial viewport option
            if (this.fieldX.key === fieldX.key) {
                optionX.attr("selected", "selected");
            }

            var fieldY = clima.utils.EPWDataFields[i];
            var optionY = fieldSelectY.append("option")
                .attr("value", i)
                .text(fieldY.name);

            // Select the correct initial viewport option
            if (this.fieldY.key === fieldY.key) {
                optionY.attr("selected", "selected");
            }
        }
        // Add Event Listener
        $(document).ready(function () {
            $("#fieldX-select").change(function (evt) {
                var st = evt.target.options[evt.target.options.selectedIndex];
                var sv = st.value;

                // Update field data
                var fieldX = clima.utils.EPWDataFields[Number.parseInt(sv)];
                clima.editor.chart.fieldX = fieldX;

                // Draw new chart
                clima.editor.chart.drawChart(clima.editor.editorViewport);
            });
            $("#fieldY-select").change(function (evt) {
                var st = evt.target.options[evt.target.options.selectedIndex];
                var sv = st.value;

                // Update field data
                var fieldY = clima.utils.EPWDataFields[Number.parseInt(sv)];
                clima.editor.chart.fieldY = fieldY;

                // Draw new chart
                clima.editor.chart.drawChart(clima.editor.editorViewport);
            });
        });


        // End of draw controls

    }

    // End of Scatterplot Class
}
