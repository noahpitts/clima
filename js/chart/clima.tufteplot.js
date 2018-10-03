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
        this.boardTopMargin = 40;
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

            // if (d3.min(dataHourly) > d3.max(dataHourly)) console.log("day: " + d + " min: " + d3.min(dataHourly) + "  max: " + d3.max(dataHourly));

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


        // COLOR SCALE
        //
        // var cValue = function (d) { return d.valueOf(col) };
        // var cScale = d3.scaleLinear()
        //     .domain(this.data.metaOf(col).domain)
        //     .range([d3.rgb(this.colorLow), d3.rgb(this.colorHigh)]);
        // var cMap = function (d) { return cScale(cValue(d)); };
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

        // Color 2 (Low Value)
        // color2ControlBox.append("div")
        //     .attr("class", "row")
        //     .append("h5")
        //     .attr("class", "container")
        //     .text("Low Value Color");

        // color2ControlBox.append("input")
        //     .attr("type", "color")
        //     .attr("value", this.colorLow)
        //     .attr("class", "container custom-select")
        //     .attr("id", "color-select2");

        // // Add Event Listener for color 1
        // $(document).ready(function () {
        //     $("#color-select2").change(function (evt) {
        //         var colorHighVal = $("#color-select2").val();
        //         clima.editor.chart.colorLow= colorHighVal;
        
        //         // Draw new chart
        //         clima.editor.chart.drawChart(clima.editor.editorViewport);
        //     });
        // });

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
