// ------------------
// HEATMAP CHART TYPE
// ------------------

// Namespace
// ------------------
var clima = clima || {};
clima.chart = clima.chart || {};
clima.chart.heatmap = clima.chart.heatmap || {};
clima.charts = clima.charts || [];

// Chart MetaData
// ------------------
// Name of the chart type to be displayed in the controls **Required**
clima.chart.heatmap.name = "Heatmap"

// Util function to create a new Heatmap **Required**
clima.chart.heatmap.create = function (data) {
    return new Heatmap(data);
}

// TODO
// Fields available to be selected by the controls
// clima.chart.heatmap.fields = [];


// Add this chart to the manifest
clima.charts.push(clima.chart.heatmap);

// Heatmap Class
// ------------------
class Heatmap {

    // Heatmap constructor
    // Takes in viewport div to draw graphic to
    constructor(data) {
        // Chart Name
        this.name = "Heatmap";

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

        // VARIABLES
        // ----------------------
        // Climate Data and Field
        this.data = data; // TODO
        this.field = clima.utils.getField("DryBulbTemp");

        // Low and High colors for graphics
        this.colorHigh = "#ffff00"; // Deafult Yellow
        this.colorLow = '#0000ff'; // Default Blue

        this.defaultTitle = "Heatmap";
        this.title = this.defaultTitle;
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
            .attr("transform", "translate(" + this.boardLeftMargin + "," + (this.graphicHeight * 1.04 + this.boardTopMargin) + ")");
        this.drawXAxis();

        // Add Y Axis
        this.board.yAxis = this.board.svg.append("g")
            .attr("class", "heatmap-yAxis")
            .attr("transform", "translate(" + (this.boardLeftMargin - 8) + "," + this.boardTopMargin + ")");
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
        var col = this.field.key;
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

    // Draws the legend to the legend group of the SVG
    drawLegend() {
        // TODO
        var legendXOffset = this.boardRightMargin / 5;
        var legendRectWidth = this.boardRightMargin / 3;

        // Legend Data

        var fieldData = this.data.metaOf(this.field.key);

        var legendData = []
        for (var i = 0; i < 24; i++) {
            legendData.push(fieldData.min + (i * Math.abs(fieldData.max - fieldData.min) / 24));
        }

        // Y Scale
        var yScale = d3.scaleLinear()
            .domain([0, 23])
            .range([0, this.graphicHeight]);
        var yMap = function (d, i) { return yScale(i); };

        // Color Scale
        var cScale = d3.scaleLinear()
            .domain([23, 0])
            .range([d3.rgb(this.colorLow), d3.rgb(this.colorHigh)]);
        var cMap = function (d, i) { return cScale(d, i); };

        this.board.legend.rect = this.board.legend.append("g")
            .attr("transform", "translate(" + legendXOffset + "," + (this.graphicHeight / 24 * -0.5) + ")");


        // Draw Legend Rects
        this.board.legend.rect.selectAll("rect")
            .data(legendData)
            .enter().append("rect")
            .attr("x", 0)
            .attr("y", function (d, i) { return yMap(d, i); })
            .attr("width", legendRectWidth)
            .attr("height", this.graphicHeight / 24)
            .attr("fill", function (d) { return cMap(d); });

        var fScale = d3.scaleLinear()
            .domain([fieldData.max, fieldData.min])
            .range([0, this.graphicHeight]);

        // Legend Axis
        var yAxis = d3.axisRight()
            .scale(fScale)
            .ticks(6)
            .tickValues([fieldData.min, fieldData.average, fieldData.max]);

        this.board.legend.axis = this.board.legend.append("g")
            .attr("transform", "translate(" + (legendXOffset + legendRectWidth + 6) + ",0)");

        this.board.legend.axis.call(yAxis);
    }

    // Draws the chart title to the title group of the SVG
    drawTitle() {
        // TODO
        var textData = this.title;

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

    // EDITOR CONTROLS
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
        clima.editor.chart.title = clima.editor.chart.defaultTitle;
        $("#chartTitle").val(clima.editor.chart.title);
        clima.editor.chart.drawChart(clima.editor.editorViewport);
    }

    drawFieldControl(controlBox) {
        var fieldControlBox = controlBox.append("div")
            .attr("class", "row control-box");

        var dataField1ControlBox = fieldControlBox.append("div")
            .attr("class", "col-sm-6")
        
        var dataField2ControlBox = fieldControlBox.append("div")
            .attr("class", "col-sm-6")

        // Data 1
        dataField1ControlBox.append("div")
            .attr("class", "row")
            .append("h5")
            .attr("class", "container")
            .text("Data Field 1");

        var fieldSelect1 = dataField1ControlBox.append("select")
            .attr("class", "container custom-select")
            .attr("id", "field-select");

        // Add Field Options 1
        for (var i = 0; i < clima.utils.EPWDataFields.length; i++) {
            var field = clima.utils.EPWDataFields[i];
            var option = fieldSelect1.append("option")
                .attr("value", i)
                .text(field.name);
        
            // Select the correct initial viewport option
                if (this.field.key === field.key) {
                    option.attr("selected", "selected");
                }
            }
        // Add Event Listener 1
        $(document).ready(function () {
            $("#field-select").change(function (evt) {
                var st = evt.target.options[evt.target.options.selectedIndex];
                var sv = st.value;
        
                // Update field data
                var field = clima.utils.EPWDataFields[Number.parseInt(sv)];
                clima.editor.chart.field = field;
        
                // Draw new chart
                clima.editor.chart.drawChart(clima.editor.editorViewport);
            });
        });


        // Data 2
        // dataField2ControlBox.append("div")
        //     .attr("class", "row")
        //     .append("h5")
        //     .attr("class", "container")
        //     .text("Data Field 2");

        // var fieldSelect2 = dataField2ControlBox.append("select")
        //     .attr("class", "container custom-select")
        //     .attr("id", "field-select2");

        // Add data 2 Logic
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
            .text("High Value Color");

        color1ControlBox.append("input")
            .attr("type", "color")
            .attr("value", this.colorHigh)
            .attr("class", "container custom-select")
            .attr("id", "color-select1");

        // Add Event Listener for color 1
        $(document).ready(function () {
            $("#color-select1").change(function (evt) {
                var colorHighVal = $("#color-select1").val();
                clima.editor.chart.colorHigh = colorHighVal;
        
                // Draw new chart
                clima.editor.chart.drawChart(clima.editor.editorViewport);
            });
        });

        // Color 2 (Low Value)
        color2ControlBox.append("div")
            .attr("class", "row")
            .append("h5")
            .attr("class", "container")
            .text("Low Value Color");

        color2ControlBox.append("input")
            .attr("type", "color")
            .attr("value", this.colorLow)
            .attr("class", "container custom-select")
            .attr("id", "color-select2");

        // Add Event Listener for color 1
        $(document).ready(function () {
            $("#color-select2").change(function (evt) {
                var colorHighVal = $("#color-select2").val();
                clima.editor.chart.colorLow= colorHighVal;
        
                // Draw new chart
                clima.editor.chart.drawChart(clima.editor.editorViewport);
            });
        });

    }

    // Draws the chart controls to the control box
    drawControls(controlBox) {
        controlBox.selectAll("div").remove();

        this.drawFieldControl(controlBox);
        this.drawColorControl(controlBox);
        this.drawTitleControl(controlBox);
        

    }

    // TODO
    updateColor() {
        // TODO
    }

    // End of Heatmap Class
}
