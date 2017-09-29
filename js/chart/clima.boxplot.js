// global namespace
var clima = clima || {};

function iqr(k) {
    return function (d, i) {
        var q1 = d.quartiles[0],
            q3 = d.quartiles[2],
            iqr = (q3 - q1) * k,
            i = -1,
            j = d.length;
        while (d[++i] < q1 - iqr);
        while (d[--j] > q3 + iqr);
        return [i, j];
    };
}

var labels = false; // show the text labels beside individual boxplots?

(function () {

    // Inspired by http://informationandvisualization.de/blog/box-plot
    d3.box = function () {
        var width = 1,
            height = 1,
            duration = 0,
            domain = null,
            value = Number,
            whiskers = boxWhiskers,
            quartiles = boxQuartiles,
            showLabels = true, // whether or not to show text labels
            numBars = 4,
            curBar = 1,
            tickFormat = null;

        // For each small multiple…
        function box(g) {
            g.each(function (data, i) {
                //d = d.map(value).sort(d3.ascending);
                //var boxIndex = data[0];
                //var boxIndex = 1;
                var d = data[1].sort(d3.ascending);

                // console.log(boxIndex);
                //console.log(d);

                var g = d3.select(this),
                    n = d.length,
                    min = d[0],
                    max = d[n - 1];

                // Compute quartiles. Must return exactly 3 elements.
                var quartileData = d.quartiles = quartiles(d);

                // Compute whiskers. Must return exactly 2 elements, or null.
                var whiskerIndices = whiskers && whiskers.call(this, d, i),
                    whiskerData = whiskerIndices && whiskerIndices.map(function (i) { return d[i]; });

                // Compute outliers. If no whiskers are specified, all data are "outliers".
                // We compute the outliers as indices, so that we can join across transitions!
                var outlierIndices = whiskerIndices
                    ? d3.range(0, whiskerIndices[0]).concat(d3.range(whiskerIndices[1] + 1, n))
                    : d3.range(n);

                // Compute the new x-scale.
                var x1 = d3.scaleLinear()
                    .domain(domain /* && domain.call(this, d, i)*/ || [min, max])
                    .range([height, 0]);

                // Retrieve the old x-scale, if this is an update.
                var x0 = d3.scaleLinear()
                    // .domain([0, Infinity])
                    .domain(domain)
                    .range([height, 0]);

                // Stash the new scale.
                this.__chart__ = x1;

                // Note: the box, median, and box tick elements are fixed in number,
                // so we only have to handle enter and update. In contrast, the outliers
                // and other elements are variable, so we need to exit them! Variable
                // elements also fade in and out.

                // Update center line: the vertical line spanning the whiskers.
                var center = g.selectAll("line.center")
                    .data(whiskerData ? [whiskerData] : []);

                //vertical line
                center.enter().insert("line", "rect")
                    .attr("class", "center")
                    .attr("x1", width / 2)
                    .attr("y1", function (d) { return x0(d[0]); })
                    .attr("x2", width / 2)
                    .attr("y2", function (d) { return x0(d[1]); })


                // Update innerquartile box.
                var box = g.selectAll("rect.box")
                    .data([quartileData]);

                box.enter().append("rect")
                    .attr("class", "box")
                    .attr("x", 0)
                    .attr("y", function (d) { return x0(d[2]); })
                    .attr("width", width)
                    .attr("height", function (d) { return x0(d[0]) - x0(d[2]); });


                // Update median line.
                var medianLine = g.selectAll("line.median")
                    .data([quartileData[1]]);

                medianLine.enter().append("line")
                    .attr("class", "median")
                    .attr("x1", 0)
                    .attr("y1", x0)
                    .attr("x2", width)
                    .attr("y2", x0);

                // Update whiskers.
                var whisker = g.selectAll("line.whisker")
                    .data(whiskerData || []);

                whisker.enter().insert("line", "circle, text")
                    .attr("class", "whisker")
                    .attr("x1", 0)
                    .attr("y1", x0)
                    .attr("x2", 0 + width)
                    .attr("y2", x0);

                // Update outliers.
                var outlier = g.selectAll("circle.outlier")
                    .data(outlierIndices, Number);

                outlier.enter().insert("circle", "text")
                    .attr("class", "outlier")
                    .attr("r", 0)
                    .attr("cx", width / 2)
                    .attr("cy", function (i) { return x0(d[i]); });

                // Compute the tick format.
                var format = tickFormat || x1.tickFormat(8);

                // Update box ticks.
                var boxTick = g.selectAll("text.box")
                    .data(quartileData);
                if (showLabels == true) {
                    boxTick.enter().append("text")
                        .attr("class", "box")
                        .attr("dy", ".3em")
                        .attr("dx", function (d, i) { return i & 1 ? 6 : -6 })
                        .attr("x", function (d, i) { return i & 1 ? + width : 0 })
                        .attr("y", x0)
                        .attr("text-anchor", function (d, i) { return i & 1 ? "start" : "end"; })
                        .text(format);
                }

                // Update whisker ticks. These are handled separately from the box
                // ticks because they may or may not exist, and we want don't want
                // to join box ticks pre-transition with whisker ticks post-.
                var whiskerTick = g.selectAll("text.whisker")
                    .data(whiskerData || []);
                if (showLabels == true) {
                    whiskerTick.enter().append("text")
                        .attr("class", "whisker")
                        .attr("dy", ".3em")
                        .attr("dx", 6)
                        .attr("x", width)
                        .attr("y", x0)
                        .text(format);
                }
            });
            // d3.timer.flush();
        }

        box.width = function (x) {
            if (!arguments.length) return width;
            width = x;
            return box;
        };

        box.height = function (x) {
            if (!arguments.length) return height;
            height = x;
            return box;
        };

        box.tickFormat = function (x) {
            if (!arguments.length) return tickFormat;
            tickFormat = x;
            return box;
        };

        box.duration = function (x) {
            if (!arguments.length) return duration;
            duration = x;
            return box;
        };

        box.domain = function (x) {
            if (!arguments.length) return domain;
            domain = x;
            return box;
        };

        box.value = function (x) {
            if (!arguments.length) return value;
            value = x;
            return box;
        };

        box.whiskers = function (x) {
            if (!arguments.length) return whiskers;
            whiskers = x;
            return box;
        };

        box.showLabels = function (x) {
            if (!arguments.length) return showLabels;
            showLabels = x;
            return box;
        };

        box.quartiles = function (x) {
            if (!arguments.length) return quartiles;
            quartiles = x;
            return box;
        };

        return box;
    };

    function boxWhiskers(d) {
        return [0, d.length - 1];
    }

    function boxQuartiles(d) {
        return [
            d3.quantile(d, .25),
            d3.quantile(d, .5),
            d3.quantile(d, .75)
        ];
    }

})();

function drawBoxplot(dObj, view) {
    view.append("p").text("BOXPLOT!!!");


    var margin = { top: 30, right: 50, bottom: 70, left: 50 };
    // var width = radius * 3.5 - margin.left - margin.right;
    var width = view.node().getBoundingClientRect().width;
    var height = width / 2;

    // var height = 600 - margin.top - margin.bottom;

    var min = Infinity,
        max = -Infinity;

    var data = [];

    for (var i = 0; i < 13; i++) {
        data[i] = [];
    }

    // This is hard coded for Dry Bulb Temperature

    data[12][0] = "Annual";
    data[12][1] = [];

    // JANUARY DATA NODE
    data[0][0] = "Jan";
    data[0][1] = [];
    for (var i = 0; i < 744; i++) {
        dataPoint = dObj.ticks[i].data.EPW.DryBulbTemp;
        data[0][1].push(dataPoint);
        data[12][1].push(dataPoint);

        max = Math.max(max, dataPoint);
        min = Math.min(min, dataPoint);
        //console.log(dataPoint);
    }

    // FEBRUARY DATA NODE
    data[1][0] = "Feb";
    data[1][1] = [];
    for (var i = 744; i < 1416; i++) {
        dataPoint = dObj.ticks[i].data.EPW.DryBulbTemp;
        data[1][1].push(dataPoint);
        data[12][1].push(dataPoint);

        max = Math.max(max, dataPoint);
        min = Math.min(min, dataPoint);
        //console.log(dataPoint);
    }

    // MARCH DATA NODE
    data[2][0] = "Mar";
    data[2][1] = [];
    for (var i = 1416; i < 2160; i++) {
        dataPoint = dObj.ticks[i].data.EPW.DryBulbTemp;
        data[2][1].push(dataPoint);
        data[12][1].push(dataPoint);

        max = Math.max(max, dataPoint);
        min = Math.min(min, dataPoint);
        //console.log(dataPoint);
    }

    // APRIL DATA NODE
    data[3][0] = "Apr";
    data[3][1] = [];
    for (var i = 2160; i < 2880; i++) {
        dataPoint = dObj.ticks[i].data.EPW.DryBulbTemp;
        data[3][1].push(dataPoint);
        data[12][1].push(dataPoint);

        max = Math.max(max, dataPoint);
        min = Math.min(min, dataPoint);
        //console.log(dataPoint);
    }

    // MAY DATA NODE
    data[4][0] = "May";
    data[4][1] = [];
    for (var i = 2880; i < 3624; i++) {
        dataPoint = dObj.ticks[i].data.EPW.DryBulbTemp;
        data[4][1].push(dataPoint);
        data[12][1].push(dataPoint);

        max = Math.max(max, dataPoint);
        min = Math.min(min, dataPoint);
        //console.log(dataPoint);
    }

    // JUNE DATA NODE
    data[5][0] = "Jun";
    data[5][1] = [];
    for (var i = 3624; i < 4344; i++) {
        dataPoint = dObj.ticks[i].data.EPW.DryBulbTemp;
        data[5][1].push(dataPoint);
        data[12][1].push(dataPoint);

        max = Math.max(max, dataPoint);
        min = Math.min(min, dataPoint);
        //console.log(dataPoint);
    }

    // JULY DATA NODE
    data[6][0] = "Jul";
    data[6][1] = [];
    for (var i = 4344; i < 5088; i++) {
        dataPoint = dObj.ticks[i].data.EPW.DryBulbTemp;
        data[6][1].push(dataPoint);
        data[12][1].push(dataPoint);

        max = Math.max(max, dataPoint);
        min = Math.min(min, dataPoint);
        //console.log(dataPoint);
    }

    // AUGUST DATA NODE
    data[7][0] = "Aug";
    data[7][1] = [];
    for (var i = 5088; i < 5832; i++) {
        dataPoint = dObj.ticks[i].data.EPW.DryBulbTemp;
        data[7][1].push(dataPoint);
        data[12][1].push(dataPoint);

        max = Math.max(max, dataPoint);
        min = Math.min(min, dataPoint);
        //console.log(dataPoint);
    }

    // SEPTEMBER DATA NODE
    data[8][0] = "Sep";
    data[8][1] = [];
    for (var i = 5832; i < 6552; i++) {
        dataPoint = dObj.ticks[i].data.EPW.DryBulbTemp;
        data[8][1].push(dataPoint);
        data[12][1].push(dataPoint);

        max = Math.max(max, dataPoint);
        min = Math.min(min, dataPoint);
        //console.log(dataPoint);
    }

    // OCTOBER DATA NODE
    data[9][0] = "Oct";
    data[9][1] = [];
    for (var i = 6552; i < 7296; i++) {
        dataPoint = dObj.ticks[i].data.EPW.DryBulbTemp;
        data[9][1].push(dataPoint);
        data[12][1].push(dataPoint);

        max = Math.max(max, dataPoint);
        min = Math.min(min, dataPoint);
        //console.log(dataPoint);
    }

    // NOVEMBER DATA NODE
    data[10][0] = "Nov";
    data[10][1] = [];
    for (var i = 7296; i < 8016; i++) {
        dataPoint = dObj.ticks[i].data.EPW.DryBulbTemp;
        data[10][1].push(dataPoint);
        data[12][1].push(dataPoint);

        max = Math.max(max, dataPoint);
        min = Math.min(min, dataPoint);
        //console.log(dataPoint);
    }

    // DECEMBER DATA NODE
    data[11][0] = "Dec";
    data[11][1] = [];
    for (var i = 8016; i < 8760; i++) {
        dataPoint = dObj.ticks[i].data.EPW.DryBulbTemp;
        data[11][1].push(dataPoint);
        data[12][1].push(dataPoint);

        max = Math.max(max, dataPoint);
        min = Math.min(min, dataPoint);
        //console.log(dataPoint);
    }

    // Create a boxplot chart
    var chart = d3.box()
        .whiskers(iqr(1.5))
        .height(height)
        .domain([min, max])
        .showLabels(labels);

    // var board = d3.select(".boxBody").append("board")
    //     .attr("width", width + margin.left + margin.right)
    //     .attr("height", height + margin.top + margin.bottom)
    //     .attr("class", "box")
    //     .append("g")
    //     .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    board = dY.graph.addBoard("#boxplot-view", { inWidth: width, inHeight: height, margin: 50 });

    // the x-axis
    var x = d3.scaleBand()
        .domain(data.map(function (d) { console.log(d); return d[0] }))
        .paddingInner(0.3)
        .paddingOuter(0.7)
        .rangeRound([0, width]);

    var xAxis = d3.axisBottom()
        .scale(x);

    // the y-axis
    var y = d3.scaleLinear()
        .domain([min, max])
        .range([height + margin.top, 0 + margin.top]);

    var yAxis = d3.axisLeft()
        .scale(y);

    // draw the boxplots
    board.g.selectAll(".box")
        .data(data)
        .enter().append("g")
        .attr("transform", function (d) { return "translate(" + x(d[0]) + "," + margin.top + ")"; })
        .call(chart.width(x.bandwidth()));

    // add a title
    board.g.append("text")
        .attr("x", (width / 2))
        .attr("y", 0 + (margin.top / 2))
        .attr("text-anchor", "middle")
        .style("font-size", "18px")
        //.style("text-decoration", "underline")
        .text("BOXPLOT v1 - Dry Bulb Temp hardcoded - TODO: port to d3v4");

    // draw y axis
    board.g.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .append("text") // and text1
        .attr("transform", "rotate(-90)")
        .attr("y", 10)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .style("font-size", "10px")
        .text("EPW DATA FIELD");

    // draw x axis
    board.g.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + (height + margin.top) + ")")
        .call(xAxis)
        .append("text")             // text label for the x axis
        .attr("x", (width / 2))
        .attr("y", 10)
        .attr("dy", ".71em")
        .style("text-anchor", "middle")
        .style("font-size", "16px")
        .text("Month");


}


