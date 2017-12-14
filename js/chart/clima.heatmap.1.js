
// OLD STYLE - To BE DELETED


// global namespace
var clima = clima || {};
clima.chart = clima.chart || {};

// TODO: redesign API
// --------------------------------------
clima.chart.HeatMap = function (data) {
    // Pass in the climate
    this.climate = data;

    // Initial State
    this.dataField = "DryBulbTemp";
}
// --------------------------------------

function drawHeatmap(dObj, view) {

    var boardWidth = 1000;
    var boardHeight = 300;
    var boardMargin = 40;

    var drawWidth = boardWidth - 2 * boardMargin;
    var drawHeight = boardHeight - 2 * boardMargin;

    // var current_dObj = dObj;
    var dropDownValue = "DryBulbTemp";
    var color1 = "#ffff00";
    var color2 = '#0000ff';

    var board = view
        .append("svg")
        .attr("class", "board")
        .attr("width", boardWidth)
        .attr("height", boardHeight)
        .attr("viewBox", "0 0 " + boardWidth + " " + boardHeight)
        .attr("preserveAspectRatio", "xMidYMid meet");

    board.g = board.append("g")
        .attr("transform", "translate(" + boardMargin + "," + boardMargin + ")");

    // // Setup X
    // //
    // var xValue = function (d) { return d.dayOfYear(); }; // data -> value

    // var xScale = d3.scaleLinear() // value -> display
    //     .domain([0, 364])
    //     .range([0, drawWidth]);

    // var xMap = function (d) { return xScale(xValue(d)); }; // data -> display


    // var dayScale = d3.scaleTime()
    //     .domain([new Date(clima.utils.datetime.year, 0, 1), new Date(clima.utils.datetime.year, 11, 31)])
    //     .range([0, drawWidth]);

    // var xAxis = d3.axisBottom()
    //     .scale(dayScale)
    //     .ticks(d3.timeMonth) //should display 1 month intervals
    //     .tickSize(16, 0)
    //     .tickFormat(d3.timeFormat("%b")); //%b - abbreviated month name.*

    // // Setup Y
    // //
    // var yValue = function (d) { return d.hourOfDay(); }; // data -> value

    // var yScale = d3.scaleLinear()  // value -> display
    //     .domain([23, 0])
    //     .range([0, drawHeight]);

    // var yMap = function (d) { return yScale(yValue(d)); }; // data -> display

    // var yAxis = d3.axisLeft()
    //     .scale(yScale)
    //     .tickValues([0, 6, 12, 18, 23]); // we can explicitly set tick values this way




    // // Setup Color
    // //
    // var zonekey = dropDownValue;
    // var cValue = function (d) { return d.valueOf(zonekey) };
    // var cScale = d3.scaleLinear()
    //     .domain(dObj.metaOf(zonekey).domain)
    //     // .interpolate(d3.interpolate)
    //     .range([d3.rgb(color1), d3.rgb(color2)]);
    // var cMap = function (d) { return cScale(cValue(d)); }; // data -> display

    // // draw pixels
    // board.g.selectAll("rect")
    //     .data(dObj.ticks)
    //     .enter().append("rect")
    //     .attr("class", "heatmap_pixel")
    //     .attr("x", function (d) {
    //         // console.log(xMap(d));
    //         return xMap(d);
    //     })
    //     .attr("y", function (d) {
    //         // console.log(yMap(d));
    //         return yMap(d);
    //     })
    //     .attr("width", drawWidth / 365)
    //     .attr("height", drawHeight / 24)
    //     .attr("transform", "translate(" + drawWidth / 365 * -0.5 + "," + drawHeight / 24 * -0.5 + ")")
    //     .attr("fill", function (d) { return cMap(d); });

    // // draw x-axis
    // board.g.append("g")
    //     .attr("class", "x-axis")
    //     .attr("transform", "translate(0," + (drawHeight * 1.05) + ")");

    // d3.select(".x-axis").call(xAxis);

    // //draw y-axis
    // board.g.append("g")
    //     .attr("class", "y-axis")
    //     .attr("transform", "translate(-15,0)");

    // d3.select(".y-axis").call(yAxis);

    // d3.selectAll(".x-axis .tick text")
    //     // .attr("transform", "translate(" + (drawWidth / 12) + ", 5px)");
}
