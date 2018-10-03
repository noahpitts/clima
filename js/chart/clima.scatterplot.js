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


    // End of Scatterplot Class
}
