function drawHeatmap(dObj, view) {

    // var board_width = view.node().getBoundingClientRect().width - 100;
    var board_width = 1000;

    console.log(board_width);
    // TODO: Refactor This Code

    var current_dObj = dObj;
    var dropDownValue = "DryBulbTemp";
    var color1 = "#ffff00";
    var color2 = '#0000ff';

    // add a board (an SVG) to the canvas. Uses a DY Utility function to easily add an svg and calculate inner and outer dimensions. Returns an object of {g (an SVG), bDims (the board dimensions), dDims (the draw dimensions)} Each dimensions have width, height, xRange, and yRange members.
    board = dY.graph.addBoard("#heatmap-view", { inWidth: board_width, inHeight: board_width / 5, margin: 50 });



    // Add a Data selector


    // Setup X
    //
    var xValue = function (d) { return d.dayOfYear(); }; // data -> value

    var xScale = d3.scaleLinear() // value -> display
        .domain([0, 364])
        .range(board.dDims.xRange);

    var xMap = function (d) { return xScale(xValue(d)); }; // data -> display


    var dayScale = d3.scaleTime()
        .domain([new Date(dY.dt.year, 0, 1), new Date(dY.dt.year, 11, 31)])
        .range(board.dDims.xRange);

    var xAxis = d3.axisBottom()
        .scale(dayScale)
        .ticks(d3.timeMonth) //should display 1 month intervals
        .tickSize(16, 0)
        .tickFormat(d3.timeFormat("%b")); //%b - abbreviated month name.*

    // Setup Y
    //
    var yValue = function (d) { return d.hourOfDay(); }; // data -> value

    var yScale = d3.scaleLinear()  // value -> display
        .domain([23, 0])
        .range((board.dDims.yRange));

    var yMap = function (d) { return yScale(yValue(d)); }; // data -> display

    var yAxis = d3.axisLeft()
        .scale(yScale)
        .tickValues([0, 6, 12, 18, 23]); // we can explicitly set tick values this way




    // Setup Color
    //
    zonekey = dropDownValue;
    //zonekey = ["ZONE1","Zone People Number Of Occupants [](Hourly)"];
    //zonekey = ["ZONE1","Zone Mean Air Temperature [C](Hourly)"];
    var cValue = function (d) { return d.valueOf(zonekey) };
    var cScale = d3.scaleLinear()
        .domain(dObj.metaOf(zonekey).domain)
        // .interpolate(d3.interpolate)
        .range([d3.rgb(color1), d3.rgb(color2)]);
    var cMap = function (d) { return cScale(cValue(d)); }; // data -> display

    // draw pixels
    board.g.selectAll("rect")
        .data(dObj.ticks)
        .enter().append("rect")
        .attr("class", "heatmap_pixel")
        .attr("x", function (d) { return xMap(d); })
        .attr("y", function (d) { return yMap(d); })
        .attr("width", board.dDims.width / 365)
        .attr("height", board.dDims.height / 24)
        .attr("transform", "translate(" + board.dDims.width / 365 * -0.5 + "," + board.dDims.height / 24 * -0.5 + ")")
        .attr("fill", function (d) { return cMap(d); })
        // .attr("style", "stroke:white;stroke-width:0.01")
        ;

    // draw x-axis
    board.g.append("g")
        .attr("class", "x-axis")
        .attr("transform", "translate(0," + (board.dDims.height * 1.05) + ")");

    d3.select(".x-axis").call(xAxis);

    //draw y-axis
    board.g.append("g")
        .attr("class", "y-axis")
        .attr("transform", "translate(-15,0)");

    d3.select(".y-axis").call(yAxis);

    d3.selectAll(".x-axis .tick text")
        .attr("transform", "translate(" + (board.dDims.width / 24) + ", -5px)");

    board.g
        .attr("viewBox", "50 0 " + board_width + " " + board_width / 3)
        .attr("preserveAspectRatio", "xMidYMax meet");

}
