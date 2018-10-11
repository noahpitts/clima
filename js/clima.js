
var clima = clima || {};
clima.chart = clima.chart || {};
clima.chart.heatmap = clima.chart.heatmap || {};
clima.charts = clima.charts || [];

clima.chart.heatmap.name = "Heatmap"


clima.chart.heatmap.create = function (data) {
    return new Heatmap(data);
}

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
        this.boardWidth = 1250;
        this.boardHeight = 320;

        // Margins for Main Graphics
        // Title, Legend and Scales fall in Margins
        this.boardTopMargin = 60;
        this.boardBottomMargin = 60;
        this.boardLeftMargin = 60;
        this.boardRightMargin = 110;

        // Main Graphic Dims
        this.graphicWidth = (this.boardWidth - this.boardLeftMargin - this.boardRightMargin);
        this.graphicHeight = (this.boardHeight - this.boardTopMargin - this.boardBottomMargin);

        // VARIABLES
        // ----------------------
        // Climate Data and Field
        this.data = data; // TODO???
        this.field = clima.utils.getField("DryBulbTemp");

        // Low and High colors for graphics
        this.colorHigh = "#ffff00"; // Deafult Yellow
        this.colorLow = '#0000ff'; // Default Blue

        this.title = this.name + " of " + this.field.name;
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

        // var units = this.field.units;

        // PopUp String
        // var col = this.field.key;
        // var cValue = function (d) { return d.valueOf(col) };
        var units = this.field.units;
        var popup = function(d) {
            let string = (cValue(d) + " " + units);
            return string;
        };

        
        // DRAW PIXELS
        this.board.pixels.selectAll("rect")
            .data(this.data.ticks)
            .enter().append("rect")
            .attr("class", "heatmap-pixel")
            .attr("x", function (d) { return xMap(d); })
            .attr("y", function (d) { return yMap(d); })
            .attr("width", this.graphicWidth / 364)
            .attr("height", this.graphicHeight / 23)
            .attr("transform", "translate(" + (this.graphicWidth / 365 * -0.5) + "," + (this.graphicHeight / 24 * -0.5) + ")")
            .attr("fill", function (d) { return cMap(d); })
            .append("svg:title")
            .text(function (d) { return popup(d); });
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

        // X-Axis Units
        this.board.xAxis.append("text")
            .attr("x", this.graphicWidth / 2)
            .attr("y", 40)
            .text("Month of the Year")
            .attr("text-anchor", "middle")
            .attr("font-family", "sans-serif")
            .attr("font-size", "14px")
            .attr("fill", "black");
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

        // Y-Axis Units
        this.board.yAxis.append("text")
            .attr("x", -30)
            .attr("y", this.graphicHeight / 2)
            .text("Hour of the Day")
            .attr("text-anchor", "middle")
            .attr("transform", "rotate(-90, -30, " + (this.graphicHeight / 2) + ")")
            .attr("font-family", "sans-serif")
            .attr("font-size", "14px")
            .attr("fill", "black");
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
            //legendData.push(fieldData.min + (i * Math.abs(fieldData.max - fieldData.min) / 24));
            legendData.push(i);
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
            .ticks(4, ".0f");
            //.tickValues([fieldData.min, fieldData.average, fieldData.max], );

        this.board.legend.axis = this.board.legend.append("g")
            .attr("transform", "translate(" + (legendXOffset + legendRectWidth + 6) + ",0)");

        this.board.legend.axis.call(yAxis);

        // Legend Units
        this.board.legend.append("text")
            .attr("x", 100)
            .attr("y", this.graphicHeight / 2)
            .text(this.field.name + " (" + this.field.units + ")")
            .attr("text-anchor", "middle")
            .attr("transform", "rotate(90, 100, " + (this.graphicHeight / 2) + ")")
            .attr("font-family", "sans-serif")
            .attr("font-size", "14px")
            .attr("fill", "black");
    }

    // Draws the chart title to the title group of the SVG
    drawTitle() {
        // TODO
        
        
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
        clima.editor.chart.title = clima.editor.chart.name + " of " + clima.editor.chart.field.name + " in " + clima.editor.chart.data.location.city;
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
            .text("Data Field");

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
                clima.editor.chart.resetTitle();
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

// ------------------
// TUFTEPLOT CHART TYPE
// ------------------

// Namespace
// ------------------
var clima = clima || {};
clima.chart = clima.chart || {};
clima.chart.tufteplot = clima.chart.tufteplot || {};
clima.charts = clima.charts || [];

// Chart MetaData
// ------------------
// Name of the chart type to be displayed in the controls **Required**
clima.chart.tufteplot.name = "Tufteplot"

// Util function to create a new Heatmap **Required**
clima.chart.tufteplot.create = function (data) {
    return new Tufteplot(data);
}

// Add this chart to the manifest
clima.charts.push(clima.chart.tufteplot);

// Tufteplot class
// ------------------
class Tufteplot {

    constructor(dObj) {
        // Chart Name
        this.name = "Tufteplot";

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
        this.dataSummary = [] // TODO
        this.dataMax = 0;
        this.dataMin = 0;
        this.field = clima.utils.getField("DryBulbTemp");

        this.color = '#1d5fab'; // Default Blue
        this.radius = this.graphicWidth / 365 / 4;

        this.title = this.name + " of " + this.field.name;
    }

    summarizeDaily() {
        this.dataSummary = [];

        var dataHourly = [];
        var dp;
        
        this.dataMin = this.data.ticks[0].valueOf(this.field.key);
        this.dataMax = this.dataMin;

        // create 2D Array for temp stats
        for (var d = 0; d < 365; d++) {
            var dataHourly = [];
            for (var h = 0; h < 24; h++) {
                dp = this.data.ticks[d * 24 + h];
                dataHourly.push(dp.valueOf(this.field.key));
                var dataCheck = dp.valueOf(this.field.key);
                if (dataCheck < this.dataMin) this.dataMin = dataCheck;
                if (dataCheck > this.dataMax) this.dataMax = dataCheck;
            }

            var dataStruct = {};

            dataStruct.min = d3.min(dataHourly);
            dataStruct.max = d3.max(dataHourly);
            dataStruct.mean = d3.mean(dataHourly);
            dataStruct.q1 = d3.quantile(dataHourly, 0.25);
            dataStruct.q3 = d3.quantile(dataHourly, 0.75);
            if (dataStruct.q1 > dataStruct.q3) {
                let temp = dataStruct.q1;
                dataStruct.q1 = dataStruct.q3;
                dataStruct.q3 = temp;
            }

            this.dataSummary.push(dataStruct);


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
            .attr("transform", "translate(" + this.boardLeftMargin + "," + this.boardTopMargin + ")");

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
        var col = this.field.key;
        // var yValueQ3 = function (d) { return d.q3; };
        var diff = 1.1*(this.dataMax - this.dataMin);
        var yScale = d3.scaleLinear()
            .domain([this.dataMax, this.dataMin])
            .range([0, this.graphicHeight]);

        // var gh = this.graphicHeight;
        var yMapQ3 = function (d) { return yScale(d.q3); };
        var yMapMax = function (d) { return yScale(d.max); };
        var yMapMin = function (d) { return yScale(d.min); };
        var yMapMean = function (d) { return yScale(d.mean); };

        // IQR HEIGHT
        var hMap = function (d) { return Math.abs(yScale(d.q3) - yScale(d.q1)); };

        var textprint = function(d, i) {
            console.log(
                "i: " + i + " q3: " + d.q3 + " --> " + yScale(d.q3) + " q1: " + d.q1 + " --> " + yScale(d.q1) + " span: " + hMap(d)
            );
        }
        // DRAW Q1 - Q3 RECTS
        this.board.plots.append("g")
            .selectAll("rect")
            .data(this.dataSummary)
            .enter().append("rect")
            .attr("class", "tufteplot-iqr")
            .attr("x", function (d, i) { return xMap(d, i); }) //*
            .attr("y", function (d) { return yMapQ3(d); })
            .attr("width", this.graphicWidth / 365) //*
            .attr("height", function (d, i) { return hMap(d); }) //*
            .attr("transform", "translate(" + (this.graphicWidth / 365 * -0.5) + "," + 0 /*(this.graphicHeight / 24 * -0.5)*/ + ")")
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
            .attr("transform", "translate(" + (this.graphicWidth / 365 * -0.5) + "," + 0 /*(this.graphicHeight / 24 * -0.5)*/ + ")")
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

        // X-Axis Units
        this.board.xAxis.append("text")
            .attr("x", this.graphicWidth / 2)
            .attr("y", 40)
            .text("Month of the Year")
            .attr("text-anchor", "middle")
            .attr("font-family", "sans-serif")
            .attr("font-size", "14px")
            .attr("fill", "black");
    }

    // Draws y-Axis to the yAxis group of the SVG
    drawYAxis() {
        var col = this.field.key;
        var diff = 1.1*(this.dataMax - this.dataMin);
        var yScale = d3.scaleLinear()
            .domain([this.dataMax, this.dataMin])
            .range([0, this.graphicHeight]);

        var yAxis = d3.axisLeft()
            .scale(yScale)
            .ticks(4);

        this.board.yAxis.call(yAxis);

        // Y-Axis Units
        this.board.yAxis.append("text")
            .attr("x", -30)
            .attr("y", this.graphicHeight / 2)
            .text(this.field.name + " (" + this.field.units + ")")
            .attr("text-anchor", "middle")
            .attr("transform", "rotate(-90, -30, " + (this.graphicHeight / 2) + ")")
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
        clima.editor.chart.title = clima.editor.chart.name + " of " + clima.editor.chart.field.name + " in " + clima.editor.chart.data.location.city;
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
            .text("Data Field");

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
                clima.editor.chart.resetTitle();
            });
        });
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

        this.drawFieldControl(controlBox);
        this.drawColorControl(controlBox);
        this.drawTitleControl(controlBox);
    }

    // End of the Tufteplot Class
}

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
        // Chart Name
        this.name = "Scatterplot";
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

        this.fieldX = clima.utils.getField("DryBulbTemp");
        this.fieldY = clima.utils.getField("RelHumid");

        this.color = '#1d5fab'; // Default Blue
        this.radius = this.graphicWidth / 500;

        this.title = this.name + " of " + this.fieldX.name + " by " + this.fieldY.name;
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

        // PopUp String
        var unitsX = this.fieldX.units;
        var unitsY = this.fieldY.units;
        var popup = function(d) {
            let string = (xValue(d) + " " + unitsX + " | " + yValue(d) + " " + unitsY);
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
            .append("svg:title")
            .text(function (d) { return popup(d); });
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
        var colY = this.fieldY.key;
        var yScale = d3.scaleLinear()
            .domain([this.data.metaOf(colY).max, this.data.metaOf(colY).min - 10])
            .range([0, this.graphicHeight]);

        var yAxis = d3.axisLeft()
            .scale(yScale)
            .ticks(8);

        this.board.yAxis.call(yAxis);

        // Y-Axis Units
        this.board.yAxis.append("text")
            .attr("x", -30)
            .attr("y", this.graphicHeight / 2)
            .text(this.fieldY.name + " (" + this.fieldY.units + ")")
            .attr("text-anchor", "middle")
            .attr("transform", "rotate(-90, -30, " + (this.graphicHeight / 2) + ")")
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
        clima.editor.chart.title = clima.editor.chart.name + " of " + clima.editor.chart.fieldX.name + " by " + clima.editor.chart.fieldY.name + " in " + clima.editor.chart.data.location.city;
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
            .text("Data Field: X-Axis");

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
                if (this.fieldX.key === field.key) {
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
                clima.editor.chart.fieldX = field;
        
                // Draw new chart
                clima.editor.chart.drawChart(clima.editor.editorViewport);
                clima.editor.chart.resetTitle();
            });
        });


        // Data 2
        dataField2ControlBox.append("div")
            .attr("class", "row")
            .append("h5")
            .attr("class", "container")
            .text("Data Field: Y-Axis");

        var fieldSelect2 = dataField2ControlBox.append("select")
            .attr("class", "container custom-select")
            .attr("id", "field-select2");

        // Add Field Options 1
        for (var i = 0; i < clima.utils.EPWDataFields.length; i++) {
            var field = clima.utils.EPWDataFields[i];
            var option = fieldSelect2.append("option")
                .attr("value", i)
                .text(field.name);
        
            // Select the correct initial viewport option
                if (this.fieldY.key === field.key) {
                    option.attr("selected", "selected");
                }
            }
        // Add Event Listener 1
        $(document).ready(function () {
            $("#field-select2").change(function (evt) {
                var st = evt.target.options[evt.target.options.selectedIndex];
                var sv = st.value;
        
                // Update field data
                var field = clima.utils.EPWDataFields[Number.parseInt(sv)];
                clima.editor.chart.fieldY = field;
        
                // Draw new chart
                clima.editor.chart.drawChart(clima.editor.editorViewport);
                clima.editor.chart.resetTitle();
            });
        });
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

        this.drawFieldControl(controlBox);
        this.drawColorControl(controlBox);
        this.drawTitleControl(controlBox);

    }


    // End of Scatterplot Class
}

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

// global namespace
var clima = clima || {};

clima.data = clima.data || {};
clima.data.Tick = function (timespan, data) {
    this.ts = timespan;
    this.hourOfYear = timespan.hourOfYear();
    this.data = data;
}

clima.data.Tick.prototype.valueOf = function (zonekey) {
    if (zonekey.constructor === Array) return this.data[zonekey[0]][zonekey[1]];
    return this.data[Object.keys(this.data)[0]][zonekey];
};

clima.data.Tick.prototype.hourOfYear = function () { return this.ts.hourOfYear(); };
clima.data.Tick.prototype.dayOfYear = function () { return this.ts.dayOfYear(); };
clima.data.Tick.prototype.hourOfDay = function () { return this.ts.hourOfDay(); };
clima.data.Tick.prototype.monthOfYear = function () { return this.ts.monthOfYear(); };
clima.data.Tick.prototype.season = function () { return this.ts.season(); };
clima.data.Tick.prototype.isIn = function (ts) { return ts.contains(this.ts.mid); };




clima.data.STick = function (timespan, data) {
    this.ts = timespan;
    this.data = data;
}

clima.data.STick.prototype.metaOf = function (zonekey) {
    if (zonekey.constructor === Array) return this.data[zonekey[0]][zonekey[1]];
    return this.data[Object.keys(this.data)[0]][zonekey];
};

clima.data.STick.prototype.averageOf = function (zonekey) { return this.metaOf(zonekey).average };
clima.data.STick.prototype.domainOf = function (zonekey) { return this.metaOf(zonekey).domain };
clima.data.STick.prototype.maxOf = function (zonekey) { return this.metaOf(zonekey).max };
clima.data.STick.prototype.medianOf = function (zonekey) { return this.metaOf(zonekey).median };
clima.data.STick.prototype.minOf = function (zonekey) { return this.metaOf(zonekey).min };
clima.data.STick.prototype.q1Of = function (zonekey) { return this.metaOf(zonekey).q1 };
clima.data.STick.prototype.q2Of = function (zonekey) { return this.metaOf(zonekey).q2 };
clima.data.STick.prototype.q3Of = function (zonekey) { return this.metaOf(zonekey).q3 };

clima.data.STick.prototype.hourOfYear = function () { return this.ts.hourOfYear(); };
clima.data.STick.prototype.dayOfYear = function () { return this.ts.dayOfYear(); };
clima.data.STick.prototype.hourOfDay = function () { return this.ts.hourOfDay(); };
clima.data.STick.prototype.monthOfYear = function () { return this.ts.monthOfYear(); };
clima.data.STick.prototype.isIn = function (ts) { return ts.contains(this.ts.mid); };

/*
clima.data.STick.prototype.setTickDomain = function(domain) {
    this.startTick = domain[0];
    this.endTick = domain[1];
    this.midTick = Math.ceil( (domain[1] - domain[0])/2 + domain[0] );
    this.tickDomain = domain;
};
*/

// Global Namespace
var clima = clima || {};
clima.data = clima.data || {};

/* Adapted from Kyle Steinfeld's dY Library
   https://github.com/ksteinfe/dy_working */

// Constructor function for Climate Data Structure
clima.data.Year = function (schema, ticks) {
    this.schema = schema;
    this.ticks = ticks;
}

// Prototype functions for Climate Data Structure

// TODO: Docs
clima.data.Year.prototype.metaOf = function (zonekey) {
    if (zonekey.constructor === Array) return this.schema[zonekey[0]][zonekey[1]];
    return this.schema[Object.keys(this.schema)[0]][zonekey];
};

// TODO: Docs
clima.data.Year.prototype.valuesOf = function (zonekey) {
    return this.ticks.map(function (d) { return d.valueOf(zonekey); });
};

// TODO: Refactor and Docs
clima.data.Year.prototype.dailySummary = function (dayCount = 1) {
    var slcs = [];
    var t = 0;
    while (t < this.ticks.length) {
        var timespan = dY.timeSpan.hoursOfYear(t, t + 24 * dayCount - 1);
        var data = dY.util.summarizeTicks(this.schema, ticks.slice(t, t + 24 * dayCount));

        slcs.push(new dY.STick(timespan, data));
        t += 24 * dayCount;
    }
    return slcs;
};

// TODO: Refactor and Docs
clima.data.hourOfDaySummary = function (schema, ticks) {
    var sortedTicks = {};
    for (var t in ticks) {
        var h = ticks[t].hourOfDay();
        if (!sortedTicks.hasOwnProperty(h)) sortedTicks[h] = [];
        sortedTicks[h].push(ticks[t]);
    }

    var ret = [];
    for (var h in sortedTicks) {
        var timespan = dY.timeSpan.hourOfYear(parseInt(h));
        var data = dY.util.summarizeTicks(schema, sortedTicks[h]);
        var stick = new dY.STick(timespan, data);

        ret.push(stick);
    }
    return ret;
};

// Global Namespace
var clima = clima || {};
clima.utils = clima.utils || {};

clima.worldMap = {};
clima.worldMap.svg = {};

clima.utils.loader = clima.utils.loader || {};
clima.utils.parser = clima.utils.parser || {};
/*
------------------------------------------------
            Clima Utility Functions

    Adapted from Kyle Steinfeld's dY Library
    https://github.com/ksteinfe/dy_working
------------------------------------------------
*/

// EPW LOADER FUNCTIONS
// requires PapaParse: <script src="js/papaparse.min.js"></script>
//

// Initial Climate Loader
clima.utils.loader.loadInitial = function (dataString) {
    var arr;
    splt = dataString.split("\n");
    head = splt.slice(0, 8).join("\n");
    body = splt.slice(8, splt.length).join("\n");

    console.log("clima: Reading Initial Data");

    Papa.parse(body, {
        delimiter: ",",
        skipEmptyLines: true,
        header: false,
        dynamicTyping: true,
        complete: function (results) {
            clima.utils.parser.parseEPW(head, results, clima.utils.onDataLoaded);
        }
    });
}

// EPW File Loader
clima.utils.loader.loadEPW = function (evt) {
    var file = evt.target.files[0];
    var reader = new FileReader();
    reader.onload = function () {
        splt = this.result.split("\n");

        head = splt.slice(0, 8).join("\n");
        body = splt.slice(8, splt.length).join("\n");

        console.log("clima: Reading EPW File");

        Papa.parse(body, {
            delimiter: ",",
            skipEmptyLines: true,
            header: false,
            dynamicTyping: true,
            complete: function (results) {
                clima.utils.parser.parseEPW(head, results, clima.utils.onDataLoaded);
            }
        });
        clima.utils.mapClimateData();
    }
    reader.readAsText(file);

}

// EPW File parser -- TODO: refactor
clima.utils.parser.parseEPW = function (head, results, callback) {
    console.log("clima: Parsing EPW File");

    // Handle Parse Errors
    if (!clima.utils.parser.handleErrors(results)) {
        console.log("clima: Parser failed. Aborting");
        return false;
    }

    // Handle Parsed Fields
    schema = { EPW: {} };
    clima.utils.EPWDataFields.forEach(function (keyDef) {
        schema["EPW"][keyDef.key] = {};
    });

    // Handle Hourly Data
    console.log("clima: Parser found " + results.data.length + " rows")

    // Create hourly ticks
    ticks = [];
    results.data.forEach(function (row, n) {
        datestring = clima.utils.pad(row[1]) + "/" + clima.utils.pad(row[2]) + "  " + clima.utils.pad(row[3]) + ":00"

        // Convert the hours of the year
        hourOfYear = clima.utils.datetime.dateToHourOfYear(clima.utils.datetime.dateStringToDate(datestring));

        timespan = clima.TimeSpan.hourOfYear(hourOfYear);

        data = {};
        data["EPW"] = {};
        clima.utils.EPWDataFields.forEach(function (field) {
            value = row[field.col];
            data["EPW"][field.key] = value;
        });
        ticks.push(new clima.data.Tick(timespan, data));

    });

    // fill out schema information
    schema = clima.utils.parser.summarizeTicks(schema, ticks);

    // create new Year object
    yr = new clima.data.Year(schema, ticks)

    // enrich with header information
    yr = clima.utils.parser.parseEPWHeader(yr, head);

    if (typeof (callback) === 'undefined') {
        return yr;
    } else {
        callback(yr);
    }
}

clima.utils.onDataLoaded = function (dObj) {
    if (!clima.climates) clima.climates = [];

    var dataExists = false;
    for (var i = 0; i < clima.climates.length; i++) {
        var climate = clima.climates[i];
        if (climate.location.city === dObj.location.city) dataExists = true;
    }

    if (!dataExists) {
        clima.currentClimate = dObj;
        clima.climates.push(dObj);
    }
    else {
        //TODO: Throw ERROR MSG THAT DATA ALREADY EXISTS
    }
}

// EPW File Header Parser
clima.utils.parser.parseEPWHeader = function (yr, headString) {
    // handle head information
    var head = headString.split("\n");
    var headLoc = head[0].split(",");
    var headDsgnCond = head[1].split(",");
    var headTypExtrmPeriods = head[2].split(",");
    var headGroundTemp = head[3].split(",");
    var headHolidayDaylightSvg = head[4].split(",");
    var headComments1 = head[5].split(",");
    var headComments2 = head[6].split(",");

    yr.epwhead = {};

    yr.location = {
        city: headLoc[1],
        state: headLoc[2],
        country: headLoc[3],
        source: headLoc[4],
        wmo: parseInt(headLoc[5]),
        latitude: parseFloat(headLoc[6]),
        longitude: parseFloat(headLoc[7]),
        timezone: parseFloat(headLoc[8]),
        elevation: parseFloat(headLoc[9])
    }

    yr.epwhead.designConditions = {
        source: headDsgnCond[2],
        note: "dY.parser doesn't currently handle most design condition data. Consider contributing to dY on GitHub!"
    }
    yr.epwhead.holidaysDaylightSavings = {
        leapYearObserved: headHolidayDaylightSvg[1] == "Yes",
        note: "dY.parser doesn't currently handle most Holiday/Daylight Savings data. Consider contributing to dY on GitHub!"
    }

    yr.epwhead.comments = {
        comments1: headComments1,
        comments2: headComments2,
        note: "dY.parser doesn't currently handle most comment data. Consider contributing to dY on GitHub!"
    }

    yr.epwhead.periods = {};
    var pcnt = parseInt(headTypExtrmPeriods[1]);
    for (var p = 2; p < pcnt * 4 + 2; p += 4) {
        var type = headTypExtrmPeriods[p + 1].toLowerCase();
        if (!yr.epwhead.periods.hasOwnProperty(type)) yr.epwhead.periods[type] = []
        var hrDomain = [
            clima.utils.datetime.dateToHourOfYear(Date.parse(headTypExtrmPeriods[p + 2] + "/" + clima.utils.datetime.year + " 00:30:00 UTC")),
            clima.utils.datetime.dateToHourOfYear(Date.parse(headTypExtrmPeriods[p + 3] + "/" + clima.utils.datetime.year + " 23:30:00 UTC"))
        ]
        yr.epwhead.periods[type].push({
            name: headTypExtrmPeriods[p],
            domainStr: [headTypExtrmPeriods[p + 2], headTypExtrmPeriods[p + 3]],
            domain: hrDomain
        });
    }

    yr.epwhead.ground = [];
    var gcnt = parseInt(headGroundTemp[1]);
    for (var g = 2; g < gcnt * 16 + 2; g += 16) {
        var gobj = {};
        gobj.depth = parseFloat(headGroundTemp[g]);
        gobj.conductivity = parseFloat(headGroundTemp[g + 1]);
        gobj.density = parseFloat(headGroundTemp[g + 2]);
        gobj.specificHeat = parseFloat(headGroundTemp[g + 3]);
        gobj.monthlyTemperature = [];
        for (var m = 0; m < 12; m++) {
            gobj.monthlyTemperature.push(parseFloat(headGroundTemp[g + m + 4]));
        }

        yr.epwhead.ground.push(gobj);
    }

    return yr;
}

// Parser Error Handling
clima.utils.parser.handleErrors = function (results) {
    if (results.errors.length > 0) {
        console.log("clima: Parser encountered " + results.errors.length + " error(s)")
        results.errors.forEach(function (error, n) {
            if (error.code == "TooFewFields" && error.row == results.data.length - 1) {
                console.log("\tThe last row contained improperly formatted data");
                results.data.splice(results.data.length - 1, 1);
            } else {
                dY.report("\t" + n + "\t" + error.code + "; " + error.message + "; row: " + error.row);
            }
        });
    }
    return true;
}

// EPW Data Summary
clima.utils.parser.summarizeTicks = function (schema, ticks) {
    var summarySchema = {}
    var alls = []; // summary data by zonekey for calculating ranges for schema
    for (var zon in schema) {
        summarySchema[zon] = {}
        for (var key in schema[zon]) {
            summarySchema[zon][key] = {}
            alls[[zon, key]] = [];
        }
    }
    for (var t in ticks) {
        for (var zon in schema) {
            for (var key in schema[zon]) {
                alls[[zon, key]].push(ticks[t].data[zon][key]);
            }
        }
    };

    for (var zon in schema) {
        for (var key in schema[zon]) {
            var allsorted = alls[[zon, key]].sort(function (a, b) { return a - b });
            var len = allsorted.length;
            summarySchema[zon][key].min = allsorted[0];
            summarySchema[zon][key].q1 = allsorted[Math.floor(len * .25) - 1];
            summarySchema[zon][key].q2 = allsorted[Math.floor(len * .50) - 1];
            summarySchema[zon][key].q3 = allsorted[Math.floor(len * .75) - 1];
            summarySchema[zon][key].max = allsorted[len - 1];

            summarySchema[zon][key].domain = [summarySchema[zon][key].min, summarySchema[zon][key].max];
            summarySchema[zon][key].median = summarySchema[zon][key].q2;

            var sum = 0;
            for (var i = 0; i < allsorted.length; i++) { sum += allsorted[i]; }
            summarySchema[zon][key].average = sum / len;
        }
    }

    return summarySchema;
}

// Pad the data values
clima.utils.pad = function (n) {
    return (n < 10) ? ("0" + n) : n;
}
clima.utils.getField = function (key) {
    for (var i = 0; i < clima.utils.EPWDataFields.length; i++) {
        var field = clima.utils.EPWDataFields[i]
        if (field.key === key) {
            return field
        }
    }
}

// EPW Field Metadata
clima.utils.EPWDataFields = [
    // Field: Extraterrestrial Horizontal Radiation
    // This is the Extraterrestrial Horizontal Radiation in Wh/m2. It should have a minimum value of 0; missing value for this field is 9999.
    { key: "EtRadHorz", units: "Wh/m\u00B2", col: 10, name: "Extraterrestrial Horizontal Radiation", description: "TODO: Add Description" },

    // Field: Extraterrestrial Direct Normal Radiation
    // This is the Extraterrestrial Direct Normal Radiation in Wh/m2. (Amount of solar radiation in Wh/m2 received on a surface normal to the rays of the sun at the top of the atmosphere during the number of minutes preceding the time indicated). It should have a minimum value of 0; missing value for this field is 9999.
    { key: "EtRadNorm", units: "Wh/m\u00B2", col: 11, name: "Extraterrestrial Direct Normal Radiation", description: "TODO: Add Description" },

    // Field: Global Horizontal Radiation
    // This is the Global Horizontal Radiation in Wh/m2. (Total amount of direct and diffuse solar radiation in Wh/m2 received on a horizontal surface during the number of minutes preceding the time indicated.) It should have a minimum value of 0; missing value for this field is 9999.
    { key: "GblHorzIrad", units: "Wh/m\u00B2", col: 13, name: "Global Horizontal Radiation", description: "TODO: Add Description" },

    // Field: Direct Normal Radiation
    // This is the Direct Normal Radiation in Wh/m2. (Amount of solar radiation in Wh/m2 received directly from the solar disk on a surface perpendicular to the sun’s rays, during the number of minutes preceding the time indicated.) If the field is “missing ( 9999)” or invalid (<0), it is set to 0. Counts of such missing values are totaled and presented at the end of the runperiod.
    { key: "DirNormIrad", units: "Wh/m\u00B2", col: 14, name: "Direct Normal Radiation", description: "TODO: Add Description" },

    // Field: Diffuse Horizontal Radiation
    // This is the Diffuse Horizontal Radiation in Wh/m2. (Amount of solar radiation in Wh/m2 received from the sky (excluding the solar disk) on a horizontal surface during the number of minutes preceding the time indicated.) If the field is “missing ( 9999)” or invalid (<0), it is set to 0. Counts of such missing values are totaled and presented at the end of the runperiod.
    { key: "DifHorzIrad", units: "Wh/m\u00B2", col: 15, name: "Diffuse Horizontal Radiation", description: "TODO: Add Description" },

    // Field: Global Horizontal Illuminance
    //This is the Global Horizontal Illuminance in lux. (Average total amount of direct and diffuse illuminance in hundreds of lux received on a horizontal surface during the number of minutes preceding the time indicated.) It should have a minimum value of 0; missing value for this field is 999999 and will be considered missing of >= 999900.
    { key: "GblHorzIllum", units: "lux", col: 16, name: "Global Horizontal Illuminance", description: "TODO: Add Description" },

    // Field: Direct Normal Illuminance
    // This is the Direct Normal Illuminance in lux. (Average amount of illuminance in hundreds of lux received directly from the solar disk on a surface perpendicular to the sun’s rays, during the number of minutes preceding the time indicated.) It should have a minimum value of 0; missing value for this field is 999999 and will be considered missing of >= 999900.
    { key: "DirNormIllum", units: "lux", col: 17, name: "Direct Normal Illuminance", description: "TODO: Add Description" },

    // Field: Diffuse Horizontal Illuminance
    // This is the Diffuse Horizontal Illuminance in lux. (Average amount of illuminance in hundreds of lux received from the sky (excluding the solar disk) on a horizontal surface during the number of minutes preceding the time indicated.) It should have a minimum value of 0; missing value for this field is 999999 and will be considered missing of >= 999900.
    { key: "DifHorzIllum", units: "lux", col: 18, name: "Diffuse Horizontal Illuminance", description: "TODO: Add Description" },

    // Field: Zenith Luminance
    // This is the Zenith Illuminance in Cd/m2. (Average amount of luminance at the sky’s zenith in tens of Cd/m2 during the number of minutes preceding the time indicated.) It should have a minimum value of 0; missing value for this field is 9999.
    { key: "ZenLum", units: "Cd/m\u00B2", col: 19, name: "Zenith Luminance", description: "TODO: Add Description" },

    // Field: Total Sky Cover
    // This is the value for total sky cover (tenths of coverage). (i.e. 1 is 1/10 covered. 10 is total coverage). (Amount of sky dome in tenths covered by clouds or obscuring phenomena at the hour indicated at the time indicated.) Minimum value is 0; maximum value is 10; missing value is 99.
    { key: "TotSkyCvr", units: "tenths of coverage", col: 22, name: "Total Sky Cover", description: "TODO: Add Description" },

    // Field: Opaque Sky Cover
    // This is the value for opaque sky cover (tenths of coverage). (i.e. 1 is 1/10 covered. 10 is total coverage). (Amount of sky dome in tenths covered by clouds or obscuring phenomena that prevent observing the sky or higher cloud layers at the time indicated.) Minimum value is 0; maximum value is 10; missing value is 99.
    { key: "OpqSkyCvr", units: "tenths of coverage", col: 23, name: "Opaque Sky Cover", description: "TODO: Add Description" },

    // Field: Dry Bulb Temperature
    // This is the dry bulb temperature in C at the time indicated. Note that this is a full numeric field (i.e. 23.6) and not an integer representation with tenths. Valid values range from -70 C to 70 C. Missing value for this field is 99.9.
    { key: "DryBulbTemp", units: "\u00B0C", col: 6, name: "Dry Bulb Temperature", description: "TODO: Add Description" },

    // Field: Dew Point Temperature
    // This is the dew point temperature in C at the time indicated. Note that this is a full numeric field (i.e. 23.6) and not an integer representation with tenths. Valid values range from -70 C to 70 C. Missing value for this field is 99.9.
    { key: "DewPtTemp", units: "\u00B0C", col: 7, name: "Dew Point Temperature", description: "TODO: Add Description" },

    // Field: Relative Humidity
    // This is the Relative Humidity in percent at the time indicated. Valid values range from 0% to 110%. Missing value for this field is 999.
    { key: "RelHumid", units: "%", col: 8, name: "Relative Humidity", description: "TODO: Add Description" },

    // Field: Atmospheric Station Pressure
    // This is the station pressure in Pa at the time indicated. Valid values range from 31,000 to 120,000. (These values were chosen from the “standard barometric pressure” for all elevations of the World). Missing value for this field is 999999.
    { key: "Pressure", units: "Pa", col: 9, name: "Atmospheric Station Pressure", description: "TODO: Add Description" },

    // Field: Wind Direction
    // This is the Wind Direction in degrees where the convention is that North=0.0, East=90.0, South=180.0, West=270.0. (Wind direction in degrees at the time indicated. If calm, direction equals zero.) Values can range from 0 to 360. Missing value is 999.
    { key: "WindDir", units: "\u00B0CW of North", col: 20, name: "Wind Direction", description: "TODO: Add Description" },

    // Field: Wind Speed
    // This is the wind speed in m/sec. (Wind speed at time indicated.) Values can range from 0 to 40. Missing value is 999.
    { key: "WindSpd", units: "m/s", col: 21, name: "Wind Speed", description: "TODO: Add Description" },

    // Field: Visibility
    // This is the value for visibility in km. (Horizontal visibility at the time indicated.) Missing value is 9999.
    { key: "HorzVis", units: "km", col: 24, name: "Horizontal Visibility", description: "TODO: Add Description" },

    // Field: Ceiling Height
    // This is the value for ceiling height in m. (77777 is unlimited ceiling height. 88888 is cirroform ceiling.) Missing value is 99999.
    { key: "CeilHght", units: "m", col: 25, name: "Ceiling Height", description: "TODO: Add Description" },

    // Field: Precipitable Water
    // This is the value for Precipitable Water in mm. (This is not “rain” - rain is inferred from the PresWeathObs field but a better result is from the Liquid Precipitation Depth field)). Missing value is 999.
    { key: "PreciptWater", units: "mm", col: 28, name: "Precipitable Water", description: "TODO: Add Description" },

    // Field: Aerosol Optical Depth
    // This is the value for Aerosol Optical Depth in thousandths. Missing value is .999.
    { key: "AeroDepth", units: "1/1000", col: 29, name: "Aerosol Optical Depth", description: "TODO: Add Description" },

    // Field: Snow Depth
    // This is the value for Snow Depth in cm. This field is used to tell when snow is on the ground and, thus, the ground reflectance may change. Missing value is 999.
    { key: "SnowDepth", units: "cm", col: 30, name: "Snow Depth", description: "TODO: Add Description" },

    // Field: Days Since Last Snowfall
    // This is the value for Days Since Last Snowfall. Missing value is 99.
    { key: "DaysSinceSnow", units: "days", col: 31, name: "Days Since Last Snowfall", description: "TODO: Add Description" }
];

// DATE AND TIME FUNCTIONS -- TODO: Clean up this code
//

clima.utils.datetime = {};
clima.utils.datetime.year = 1970; // the assumed year in all parsed dates. make sure it isn't a leap year.
clima.utils.datetime.minsPerYr = 525600; // the number of minutes in a year
clima.utils.datetime.millsPerMin = 60000; // millsPerMin
clima.utils.datetime.millsToMins = 0.00001666666; // coeff for converting milliseconds to minutes

// Converts Date Object to Hour of the Year [0 - 8759]
clima.utils.datetime.dateToHourOfYear = function (dt) {
    start = new Date(Date.UTC(clima.utils.datetime.year, 0, 1, 0, 30));
    diff = dt - start;
    hour = Math.floor(diff / (1000 * 60 * 60));
    return hour;
}

// Convert Hour of the Year to Date
clima.utils.datetime.hourOfYearToDate = function (hr) {
    // constructs a date in UTC by number of milliseconds
    return new Date((hr + 0.5) * (1000 * 60 * 60));
}

// Converts a date string to a Date Object
clima.utils.datetime.dateStringToDate = function (str) {
    splt = str.split("  ");
    date = splt[0].trim().split("/");
    month = parseInt(date[0]) - 1
    day = parseInt(date[1])
    hour = parseInt(splt[1].trim().split(":")[0]) - 1;

    dt = new Date(Date.UTC(clima.utils.datetime.year, month, day, hour, 30));

    return dt;
}

clima.utils.datetime.niceFormat = function (dt) {
    var mth = clima.utils.datetime.monthTable[dt.getUTCMonth()].shortname;
    var dat = dt.getUTCDate();
    var hours = dt.getUTCHours();
    var mins = dt.getUTCMinutes();

    var pad = function (n) { return (n < 10) ? ("0" + n) : n; }

    return pad(dat) + " " + mth + " " + pad(hours) + ":" + pad(mins)
}


clima.utils.datetime.monthTable = [
    // domains are listed in minutes of the year
    { idx: 0, fullname: "January", shortname: "Jan", domain: [Date.UTC(clima.utils.datetime.year, 0, 1, 0, 0, 0, 0) * clima.utils.datetime.millsToMins, Date.UTC(clima.utils.datetime.year, 1, 1, 0, 0, 0, 0) * clima.utils.datetime.millsToMins] },
    { idx: 1, fullname: "February", shortname: "Feb", domain: [Date.UTC(clima.utils.datetime.year, 1, 1, 0, 0, 0, 0) * clima.utils.datetime.millsToMins, Date.UTC(clima.utils.datetime.year, 2, 1, 0, 0, 0, 0) * clima.utils.datetime.millsToMins] },
    { idx: 2, fullname: "March", shortname: "Mar", domain: [Date.UTC(clima.utils.datetime.year, 2, 1, 0, 0, 0, 0) * clima.utils.datetime.millsToMins, Date.UTC(clima.utils.datetime.year, 3, 1, 0, 0, 0, 0) * clima.utils.datetime.millsToMins] },
    { idx: 3, fullname: "April", shortname: "Apr", domain: [Date.UTC(clima.utils.datetime.year, 3, 1, 0, 0, 0, 0) * clima.utils.datetime.millsToMins, Date.UTC(clima.utils.datetime.year, 4, 1, 0, 0, 0, 0) * clima.utils.datetime.millsToMins] },
    { idx: 4, fullname: "May", shortname: "May", domain: [Date.UTC(clima.utils.datetime.year, 4, 1, 0, 0, 0, 0) * clima.utils.datetime.millsToMins, Date.UTC(clima.utils.datetime.year, 5, 1, 0, 0, 0, 0) * clima.utils.datetime.millsToMins] },
    { idx: 5, fullname: "June", shortname: "Jun", domain: [Date.UTC(clima.utils.datetime.year, 5, 1, 0, 0, 0, 0) * clima.utils.datetime.millsToMins, Date.UTC(clima.utils.datetime.year, 6, 1, 0, 0, 0, 0) * clima.utils.datetime.millsToMins] },
    { idx: 6, fullname: "July", shortname: "Jul", domain: [Date.UTC(clima.utils.datetime.year, 6, 1, 0, 0, 0, 0) * clima.utils.datetime.millsToMins, Date.UTC(clima.utils.datetime.year, 7, 1, 0, 0, 0, 0) * clima.utils.datetime.millsToMins] },
    { idx: 7, fullname: "August", shortname: "Aug", domain: [Date.UTC(clima.utils.datetime.year, 7, 1, 0, 0, 0, 0) * clima.utils.datetime.millsToMins, Date.UTC(clima.utils.datetime.year, 8, 1, 0, 0, 0, 0) * clima.utils.datetime.millsToMins] },
    { idx: 8, fullname: "September", shortname: "Sep", domain: [Date.UTC(clima.utils.datetime.year, 8, 1, 0, 0, 0, 0) * clima.utils.datetime.millsToMins, Date.UTC(clima.utils.datetime.year, 9, 1, 0, 0, 0, 0) * clima.utils.datetime.millsToMins] },
    { idx: 9, fullname: "October", shortname: "Oct", domain: [Date.UTC(clima.utils.datetime.year, 9, 1, 0, 0, 0, 0) * clima.utils.datetime.millsToMins, Date.UTC(clima.utils.datetime.year, 10, 1, 0, 0, 0, 0) * clima.utils.datetime.millsToMins] },
    { idx: 10, fullname: "November", shortname: "Nov", domain: [Date.UTC(clima.utils.datetime.year, 10, 1, 0, 0, 0, 0) * clima.utils.datetime.millsToMins, Date.UTC(clima.utils.datetime.year, 11, 1, 0, 0, 0, 0) * clima.utils.datetime.millsToMins] },
    { idx: 11, fullname: "December", shortname: "Dec", domain: [Date.UTC(clima.utils.datetime.year, 11, 1, 0, 0, 0, 0) * clima.utils.datetime.millsToMins, Date.UTC(clima.utils.datetime.year + 1, 0, 1, 0, 0, 0, 0) * clima.utils.datetime.millsToMins] }
]

clima.utils.datetime.winterSolstice = Date.UTC(clima.utils.datetime.year, 11, 21, 0, 0, 0, 0) * clima.utils.datetime.millsToMins; // Dec 21st
clima.utils.datetime.springEquinox = Date.UTC(clima.utils.datetime.year, 2, 21, 0, 0, 0, 0) * clima.utils.datetime.millsToMins; // March 21st
clima.utils.datetime.summerSolstice = Date.UTC(clima.utils.datetime.year, 5, 21, 0, 0, 0, 0) * clima.utils.datetime.millsToMins; // Jun 21st
clima.utils.datetime.autumnalEquinox = Date.UTC(clima.utils.datetime.year, 8, 21, 0, 0, 0, 0) * clima.utils.datetime.millsToMins; // Sept 21st

clima.utils.datetime.seasonTable = [
    { idx: 0, fullname: "Winter", domain: [clima.utils.datetime.winterSolstice, clima.utils.datetime.springEquinox + clima.utils.datetime.minsPerYr] },
    { idx: 1, fullname: "Spring", domain: [clima.utils.datetime.springEquinox, clima.utils.datetime.summerSolstice] },
    { idx: 2, fullname: "Summer", domain: [clima.utils.datetime.summerSolstice, clima.utils.datetime.autumnalEquinox] },
    { idx: 3, fullname: "Autumn", domain: [clima.utils.datetime.autumnalEquinox, clima.utils.datetime.winterSolstice] },
]

// Maps the climate data points and generates a formated list for managing climate data
clima.utils.mapClimateData = function (svg) {

    var climateList = d3.select("#climate-list");

    climateList.selectAll("li")
        .data(clima.climates)
        .enter().append("li")
        .attr("class", "list-group-item")
        .text(function (d) {
            return d.location.city + " | "
                + d.location.country + " | "
                + d.location.latitude + " | "
                + d.location.longitude
        });

    // Add climates to the map
    clima.worldMap.svg.selectAll("circle")
        .data(clima.climates)
        .enter().append("circle")
        .attr("class", "geo-data")
        .attr("r", "3")
        .attr("transform", function (d) {
            return "translate(" + clima.worldMap.projection([
                d.location.longitude,
                d.location.latitude
            ]) + ")";
        });
}

// global namespace
var clima = clima || {};

// TimeSpan Class
clima.TimeSpan = function (start, end) {
    // can be given Dates or minutes of year
    // given dates should be in UTC and in year 1970
    // given dates will be rounded either UP or DOWN to the nearest minute

    if (Object.prototype.toString.call(start) == "[object Date]") start = +start
    if (Object.prototype.toString.call(end) == "[object Date]") end = +end
    if (end <= start) throw "timeSpans cannot be constructed backwards";
    if (start < 0 || end < 0) throw "timeSpans cannot be negative";
    if ((start > clima.utils.datetime.minsPerYr) && (end > clima.utils.datetime.minsPerYr)) throw "timeSpans should be constructed from a generic UTC year (1970)";
    this.spansYears = false;
    if (end > clima.utils.datetime.minsPerYr) this.spansYears = true;

    //var coeff = 1000 * 60; // to round to nearest minute
    var a = Math.ceil(start);
    var b = Math.floor(end);
    this._ = clima.utils.datetime.niceFormat(new Date(a * 1000 * 60)) + " -> " + clima.utils.datetime.niceFormat(new Date(b * 1000 * 60))
    this.min = a;
    this.max = b;
    this.mid = (b - a) * 0.5 + a;
    this.hourOfYearStart = function () { return Math.round(a / 60); };
    this.hourOfYearMid = function () { return this.mid / 60; }; // NOT ROUNDED
    this.hourOfYearEnd = function () { return Math.round(b / 60); };
    this.hourOfYear = function () { return Math.floor(this.hourOfYearMid()) }; // a stand in for relating this time span to a single hour of the year for plotting a tick
    this.hourOfYearDomain = function () { return [this.hourOfYearStart(), this.hourOfYearEnd() - 1]; }; // end index is inclusive for constructing d3 domains. spans of a single hour will report zero-length domains

    this.hoursOfYear = function () { return Array.from(new Array(this.durationHrs()), (x, i) => i + this.hourOfYearStart()); };

    this.dayOfYear = function () { return Math.floor(this.hourOfYear() / 24); }; // a stand in for relating this time span to a single day of the year for plotting a tick
    this.hourOfDay = function () { return this.hourOfYear() % 24; }  // a stand in for relating this time span to a single day of the year for plotting a tick
    this.monthOfYear = function () { return new Date(this.mid * 1000 * 60).getUTCMonth() } // a stand in for relating this time span to a single month of the year for plotting a tick

    this.season = function () {
        if (clima.TimeSpan.season(0).contains(this)) return 0;
        if (clima.TimeSpan.season(1).contains(this)) return 1;
        if (clima.TimeSpan.season(2).contains(this)) return 2;
        if (clima.TimeSpan.season(3).contains(this)) return 3;
    };

    this.duration = function () { return b - a; };
    this.durationHrs = function () { return Math.round((b - a) / 60); };

    this.isHour = function () { return this.durationHrs() == 1; };
}

clima.TimeSpan.prototype.contains = function (val) {
    if ((Object.prototype.toString.call(val) !== "[object Number]") && (val.hasOwnProperty("mid"))) val = val.mid;

    if ((val < 0) || (val > clima.utils.datetime.minsPerYr)) console.warn("You asked timeSpan.contains(" + val + "). timeSpans describe minutes of a generic UTC year (1970), so that  contained values must lie between 0 and " + clima.utils.datetime.minsPerYr);

    if (this.spansYears) {
        if (val >= this.min) return true;
        if (val < this.max - clima.utils.datetime.minsPerYr) return true;
        return false;
    } else {
        return (val >= this.min && val < this.max);
    }
}

clima.TimeSpan.prototype.report = function () {
    console.log(this._);
    //console.log("\t date\t\t"+this.dateStart().toUTCString() +" -> "+ this.dateEnd().toUTCString() );
    console.log("\t hoy domain \t\t" + this.hourOfYearDomain());
    console.log("\t mid hr \t\t" + this.hourOfYearMid());
    console.log("\t dur\t\t" + this.duration());
    console.log("\t durHrs\t\t" + this.durationHrs());
    console.log("\t hour of year\t\t" + this.hourOfYear());
    console.log("\t day of year\t\t" + this.dayOfYear());
    console.log("\t hour of day\t\t" + this.hourOfDay());
    console.log("\t month of year\t\t" + this.monthOfYear());

    //console.log("\t hoursOfYear\t\t"+this.hoursOfYear());

};

clima.TimeSpan.hourOfYear = function (hr) { return new clima.TimeSpan(hr * 60, (hr + 1) * 60) }
clima.TimeSpan.hoursOfYear = function (a, b) { return new clima.TimeSpan(a * 60, b * 60) }

clima.TimeSpan.dayOfYear = function (day) { return new clima.TimeSpan((day * 24) * 60, ((day + 1) * 24) * 60) }
clima.TimeSpan.daysOfYear = function (a, b) { return new clima.TimeSpan((a * 24) * 60, ((b + 1) * 24) * 60) }

clima.TimeSpan.monthOfYear = function (mth) { return new clima.TimeSpan(clima.utils.datetime.monthTable[mth].domain[0], clima.utils.datetime.monthTable[mth].domain[1]); };
clima.TimeSpan.monthsOfYear = function (a, b) { return new clima.TimeSpan(clima.utils.datetime.monthTable[a].domain[0], clima.utils.datetime.monthTable[b].domain[1]); };

clima.TimeSpan.fullYear = new clima.TimeSpan(0, 525600);
clima.TimeSpan.janurary = clima.TimeSpan.monthOfYear(0);
clima.TimeSpan.february = clima.TimeSpan.monthOfYear(1);
clima.TimeSpan.march = clima.TimeSpan.monthOfYear(2);
clima.TimeSpan.april = clima.TimeSpan.monthOfYear(3);
clima.TimeSpan.may = clima.TimeSpan.monthOfYear(4);
clima.TimeSpan.june = clima.TimeSpan.monthOfYear(5);
clima.TimeSpan.july = clima.TimeSpan.monthOfYear(6);
clima.TimeSpan.august = clima.TimeSpan.monthOfYear(7);
clima.TimeSpan.september = clima.TimeSpan.monthOfYear(8);
clima.TimeSpan.october = clima.TimeSpan.monthOfYear(9);
clima.TimeSpan.november = clima.TimeSpan.monthOfYear(10);
clima.TimeSpan.december = clima.TimeSpan.monthOfYear(11);

clima.TimeSpan.season = function (s) { return new clima.TimeSpan(clima.utils.datetime.seasonTable[s].domain[0], clima.utils.datetime.seasonTable[s].domain[1]); };
clima.TimeSpan.winter = clima.TimeSpan.season(0);
clima.TimeSpan.spring = clima.TimeSpan.season(1);
clima.TimeSpan.summer = clima.TimeSpan.season(2);
clima.TimeSpan.fall = clima.TimeSpan.season(3);
clima.TimeSpan.autumn = clima.TimeSpan.season(3);

// Global Namespace
var clima = clima || {};

// Clima Viewport array and ID counter
clima.viewport = clima.viewport || {};
clima.viewport.idCounter = clima.viewport.idCounter || 0;

// Misc CLima params
clima.currentClimate = clima.currentClimate || false;
clima.defaultClimate = clima.currentClimate;

clima.chart = clima.chart || {};

clima.viewports = clima.viewports || [];

clima.charts = clima.charts || [];
clima.defaultChart = clima.charts[0];

// ------------------------------------
// VIEWPORT
// ------------------------------------
class Viewport {

    // Viewport constructor
    constructor(parent) {
        // Store link to Parent HTML element
        this.parent = parent;

        // Store Viewport ID
        this.id = clima.viewport.idCounter++;

        // Create this HTML element
        this.element = parent.append("div")
            .attr("class", "container viewport")
            .attr("id", "viewport_" + this.id);
        // .on("click", Viewport.selectVP(this));

        // Add Viewport Control Bar
        this.controlBar = this.element.append("div")
            .attr("class", "container viewport-control-bar");

        // Store reference to viewport climate data and chart
        // this.chart = chart;
        // this.data = chart.data;
    }

    // Updates the Viewport Graphics
    update() {
        // Draw the chart to the viewport
        this.chart.drawChart(this.element);
    }

    // Draws the control bar in the viewport
    drawControlBar() {
        // Add Edit Chart Button to the Viewport Control Bar
        this.editViewportIcon = this.controlBar.append("span")
            .attr("class", "icon-span")
            .attr("data-toggle", "tooltip")
            .attr("data-placement", "top")
            .attr("title", "Edit Chart")
            .attr("id", "edit-icon")
            .append("i")
            .attr("class", "fas fa-edit icon")
            .attr("data-toggle", "modal")
            .attr("data-target", "#displayEditorModal")
            .on("click", this.edit);

        // Add Export SVG Button to the Viewport Control Bar
        this.exportViewportIcon = this.controlBar.append("span")
            .attr("class", "icon-span")
            .attr("data-toggle", "tooltip")
            .attr("data-placement", "top")
            .attr("title", "Download Chart")
            .attr("id", "download-icon")
            .append("i")
            .attr("class", "fas fa-download icon")
            .on("click", this.exportSVG);

        // Add Export PNG Button to the Viewport Control Bar
        // TODO

        // Add Remove Chart Button to the Viewport Control Bar
        this.removeViewportIcon = this.controlBar.append("span")
            .attr("class", "icon-span")
            .attr("data-toggle", "tooltip")
            .attr("data-placement", "top")
            .attr("title", "Delete Chart")
            .attr("id", "trash-icon")
            .append("i")
            .attr("class", "fas fa-trash icon")
            .on("click", this.remove);

        $(function () {
            $('[data-toggle="tooltip"]').tooltip({delay: { "show": 2000, "hide": 100 }})
        });
    }

    // Removes the control bar in the viewport
    removeControlBar() {
        $(function () {
            $('[data-toggle="tooltip"]').tooltip('hide');
        });
        this.controlBar.selectAll("span").remove();
    }

    // Edit the Viewport
    edit() {
        $('#edit-icon').tooltip('hide');
        clima.editor.open(clima.viewport.selection);
    }

    // Export Viewport as SVG
    exportSVG() {
        $('#download-icon').tooltip('hide');
        // Get The svg node()
        var node = clima.viewport.selection.element.select("svg").node();
        // Serialize the Node in to an xml string
        var svgxml = (new XMLSerializer()).serializeToString(node);

        // Create filename string
        var filename = "clima_viewport_" + clima.viewport.selection.id + ".svg"

        // if ($.browser.webkit) {
        //     svgxml = svgxml.replace(/ xlink:xlink/g, ' xmlns:xlink');
        //     svgxml = svgxml.replace(/ href/g, 'xlink:href');
        // }

        // Store string as a data Blob
        var data = new Blob([svgxml], { type: 'text/plain' });

        // Create a file url from the Blob
        var url = window.URL.createObjectURL(data);

        // Create an anchor element
        var a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.style.visibility = "hidden";

        // Add anchor to the page
        document.body.appendChild(a);
        // Click on the anchor
        a.click();

        // Clean Up
        setTimeout(function () {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 0);
    }

    // Export Viewport as PNG : TODO
    exportPNG() {
        alert("TODO: develop PNG downloader class");
    }

    // Export Viewport as CSV : TODO
    exportCSV() {
        alert("TODO: develop CSV downloader class");
    }

    // Remove the Viewport
    remove() {
        $('#trash-icon').tooltip('hide');
        // Remove DOM element
        clima.viewport.selection.element.remove();

        // Remove viewport object from global list
        for (var i = 0; i < clima.viewports.length; i++) {
            if (clima.viewports[i] === clima.viewport.selection) {
                clima.viewports.splice(i, 1);
            }
        }

    }

    // Select this Viewport
    select() {
        // If this viewport is already selected, then deselect it
        if (this === clima.viewport.selection) {
            this.deselect();
        }

        // Otherwise select this viewport
        else {
            // If another Viewport is selected, than deselect it first
            if (clima.viewport.selection) {
                clima.viewport.selection.deselect();
            }

            // Draw the control Bar
            this.drawControlBar();

            // Update CSS for this Viewport
            this.element.classed("viewport-select", true);

            // Set global viewport section pointer to this
            clima.viewport.selection = this;
        }
    }

    // Deselect this Viewport
    deselect() {
        this.removeControlBar();
        this.element.classed("viewport-select", false);
        clima.viewport.selection = false;
    }

    // Add a new viewport
    static add() {
        // Open Editor - false for existing viewport
        clima.editor.open(false);
    }

    // End Viewport Class
}

// ------------------------------------
// EDITOR
// ------------------------------------
class Editor {

    constructor() {
        clima.chart.default = clima.chart.heatmap

        this.title = d3.select("#editor-title");
        this.editorViewport = d3.select("#editor-viewport");
        this.controlport = d3.select("#editor-controlport");
        this.data = clima.defaultClimate;
        this.chart = clima.defaultChart.create(this.data);
        this.viewport = false;
    }

    // Sets up editing session
    open(viewport) {
        // If Editing an exiting viewport
        if (!viewport) {
            // Use global default chart
            this.data = clima.currentClimate;
            this.chart = clima.defaultChart.create(this.data);
        }
        // Otherwise inherit from viewport
        else {
            this.data = viewport.data;
            this.chart = viewport.chart;
        }
        // Set viewport pointer to either passed in viewport or false flag
        this.viewport = viewport;
        // Draw the Editor Controls (Data Selection, Chart Selection)
        this.drawControls();
        // Draw the Chart
        this.chart.drawChart(this.editorViewport);
    }

    // Draws The Editor Controls
    drawControls() {
        // Remove all existing elements in the control port
        this.controlport.selectAll("div").remove();

        var controls = this.controlport.append("div")
            .attr("class", "container controls")
            .append("div")
            .attr("class", "row");

        // TEST: Make sure that we can clear the chart controls when a new chart is selected
        this.chartControls = this.controlport.append("div")
            .attr("class", "container");

        var dataSelectControlBox = controls.append("div")
            .attr("class", "col-sm-6")
        
        var chartSelectControlBox = controls.append("div")
            .attr("class", "col-sm-6")

        // ---------------
        // Data Selection
        // ---------------
        dataSelectControlBox.append("div")
        .attr("class", "row")
        .append("h5")
        .attr("class", "container")
        .text("Climate Data");

        var dataSelect = dataSelectControlBox.append("select")
            .attr("class", "container custom-select")
            .attr("id", "data-select");

        // Add Climate Options
        for (var i = 0; i < clima.climates.length; i++) {
            var climate = clima.climates[i];
            var option = dataSelect.append("option")
                .attr("value", i)
                .text(climate.location.city + " | " + climate.location.country);

            // Select the correct initial viewport option
            if (this.data === climate) {
                option.attr("selected", "selected");
            }
        }
        // Add Event Listener
        $(document).ready(function () {
            $("#data-select").change(function (evt) {
                var st = evt.target.options[evt.target.options.selectedIndex];
                var sv = st.value;

                // Update editor data
                clima.editor.data = clima.climates[Number.parseInt(sv)];
                clima.editor.chart.data = clima.editor.data;

                // Set global current climate
                climate.currentClimate = clima.editor.data;
                // Draw new chart
                clima.editor.update();
                clima.editor.chart.drawControls(clima.editor.chartControls);
                clima.editor.chart.resetTitle();
            });
        });
        chartSelectControlBox.append("div")
        .attr("class", "row")
        .append("h5")
        .attr("class", "container")
        .text("Chart Type");

        var chartSelect = chartSelectControlBox.append("select")
            .attr("class", " container custom-select")
            .attr("id", "chart-select");
        for (var i = 0; i < clima.charts.length; i++) {
            var chart = clima.charts[i];
            var option = chartSelect.append("option")
                .attr("value", i)
                .text(chart.name);
            if (this.chart.name === chart.name) {
                option.attr("selected", "selected");
            }
        }
        $(document).ready(function () {
            $("#chart-select").change(function (evt) {
                var st = evt.target.options[evt.target.options.selectedIndex];
                var sv = st.value;

                var newChart = clima.charts[Number.parseInt(sv)];
                clima.editor.chart = newChart.create(clima.editor.data);
                clima.editor.chart.drawChart(clima.editor.editorViewport);
                clima.editor.update();

                clima.editor.chart.drawControls(clima.editor.chartControls);
                clima.editor.chart.resetTitle();
            });
        });
        this.chart.drawControls(clima.editor.chartControls);
    }
    update() {
        this.chart.drawChart(this.editorViewport);
    }
    apply() {
        if (!clima.editor.viewport) {
            var newViewport = new Viewport(clima.main.element);
            newViewport.element
                .on("click", function () {
                    newViewport.select();
                });
            clima.viewports.push(newViewport);
            clima.editor.viewport = newViewport;
        }
        clima.editor.viewport.chart = clima.editor.chart;
        clima.editor.viewport.data = clima.editor.data;
        clima.editor.viewport.update();
    }
}
var clima = clima || {};
clima.metaData = { name: "clima engine", version: 0.3, build: 2 };
clima.climates = clima.climates || [];
clima.currentClimate = clima.currentClimate || false;
clima.defaultClimate = clima.currentClimate;
clima.utils.loader.loadInitial(oaklandCa);
clima.main = clima.main || {};
clima.main.viewports = clima.viewports || [];
clima.viewport = clima.viewport || {};
clima.viewport.idCounter = clima.viewIdCounter || 0;
clima.viewport.selection = false;
clima.editor = clima.editor || {};
function onDataLoaded(dObj) {

    clima.main.element = d3.select("#main");
    clima.editor = new Editor();

}
