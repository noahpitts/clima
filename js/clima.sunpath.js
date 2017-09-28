function drawSunpath(dObj, view) {
    view.append("p").text("SUNPATH!!!");

    var location = {
        lat: dObj.location.latitude,
        lon: dObj.location.longitude,
        tmz: dObj.location.timezone
    };

    // Margin around Sun Path Diagram
    var margin = 40;
    // Radius of Sun Path Diagram
    var radius = view.node().getBoundingClientRect().width / 2;

    var dropDownValue = "DryBulbTemp";
    var dayStep = 21;
    var hourStep = 5 / 3;

    var color1 = "#0000ff";
    var color2 = '#ff0000';



    // Scales the value to polar coordinate theta
    var angScale = d3.scaleLinear()
        .domain([0, 360])
        .range([0, 2 * Math.PI]);

    // Scales the value to polar coordinate r
    var radScale = d3.scaleLinear()
        .domain([90, 0])
        .range([0, radius]);

    // Draw Value Paths
    var pathLine = d3.radialLine()
        .radius(function (d) { return radScale(d.altitudeDeg); })
        .angle(function (d) { return angScale(d.azimuthDeg); });
    // .interpolate("linear");

    var vals = [];
    // Create Bins

    // Create winterBins
    var winterBins = [];

    for (var d = 0; d < 172; d += dayStep) {
        for (var h = 0; h < 22; h += hourStep) {
            var newBin = new bin(location, d, d + dayStep, h, h + hourStep);
            if (newBin.isVisible()) {
                newBin.generateSolarPath(5);

                // iterate over data values in range
                var val = 0;
                var count = 0;
                for (var d_v = Math.floor(d); d_v < Math.floor(d) + dayStep; d_v++) {
                    for (var h_v = Math.floor(h); h_v < Math.floor(h) + hourStep; h_v++) {
                        // sum data over range
                        var dayOfYear = d_v * 24 + h_v;
                        var tick = dObj.ticks[dayOfYear];
                        val += tick.valueOf(dropDownValue);
                        count++;
                    }
                }
                // average the data value
                val /= count;
                vals.push(val);
                newBin.solarPath.value = val;
                winterBins.push(newBin);
            }
        }
    }

    // Create SummerBins
    var summerBins = [];

    for (var d = 172; d < 351; d += dayStep) {
        for (var h = 0; h < 22; h += hourStep) {
            var newBin = new bin(location, d, d + dayStep, h, h + hourStep);
            if (newBin.isVisible()) {
                newBin.generateSolarPath(5);

                // iterate over data values in range
                var val = 0;
                var count = 0;
                for (var d_v = Math.floor(d); d_v < Math.floor(d) + dayStep; d_v++) {
                    for (var h_v = Math.floor(h); h_v < Math.floor(h) + hourStep; h_v++) {
                        // sum data over range
                        var dayOfYear = d_v * 24 + h_v;
                        var tick = dObj.ticks[dayOfYear];
                        val += tick.valueOf(dropDownValue);
                        count++;
                    }
                }
                // average the data value
                val /= count;
                vals.push(val);
                newBin.solarPath.value = val;
                summerBins.push(newBin);
            }
        }
    }

    var maxVal = d3.max(vals);
    var minVal = d3.min(vals);
    console.log(minVal, maxVal);

    // Scale color
    var cScale = d3.scaleLinear()
        .domain([minVal, maxVal])
        .interpolate(d3.interpolate)
        .range([d3.rgb(color1), d3.rgb(color2)]);

    // ****************************************************************
    // WINTER - SPRING
    // ****************************************************************

    // Art Board
    var board = dY.graph.addBoard("#sunpath-view", { inWidth: radius * 2, inHeight: radius * 2, margin: margin });

    // Board for SunPath
    var sunPathWinter = board.g.append("g")
        .attr("transform", "translate(" + radius + "," + radius + ")")
        .attr("class", "background");


    // .on("mouseenter", function (d) {
    //     d3.select(this).style("stroke-width", "1px");
    // })
    // .on("mouseoout", function (d) {
    //     d3.select(this).style("stroke-width", "0.1px");
    // })
    // ;
    //.on("mouseout", function (d) { d3.select(this).attr({ class: "bin" }); });

    // draw the circle
    var axisCirc = sunPathWinter.append("g").attr("class", "axis")
    axisCirc.append("circle")
        .attr("cx", 0)
        .attr("r", radius);
    var axisCen = sunPathWinter.append("g").attr("class", "axis")
    axisCirc.append("circle")
        .attr("cx", 0)
        .attr("r", radius * .01);
    // radial arc
    var startAngle = Math.PI / 4;
    var endAngle = 7 * Math.PI / 4;
    var resolution = (endAngle - startAngle) / (2 * Math.PI) * 360;
    // startAngle += Math.PI / 2;
    // endAngle += Math.PI / 2;
    var angle = d3.scaleLinear()
        .domain([0, resolution - 1])
        .range([startAngle, endAngle]);

    var line = d3.radialLine()
        // .interpolate("basis")
        // .tension(0)
        .radius(radius * 1.05)
        .angle(function (d, i) { return angle(i); });

    var arcPathSum = sunPathWinter.append("g").attr("class", "axis");
    arcPathSum.append("path")
        .datum(d3.range(resolution))
        .attr("d", line);

    // draw the text
    var angAxisGroups = sunPathWinter.append("g") // angAxisGroups is a reference to a collection of subgroups within this group. each subgroup has data bound to it related to one of 12 values: angles between 0 and 360
        .attr("class", "axis")
        .selectAll("g")
        .data(d3.range(0, 360, 15)) // bind 12 data objects (0-360 in steps of x)
        .enter().append("g")
        .attr("transform", function (d) { return "rotate(" + d + ")"; }); // rotate each subgroup about the origin by the proper angle
    var ctrOffset = radius / 5;
    angAxisGroups.append("line") // append a line to each
        .attr("x1", ctrOffset) // we only need to define x1 and x2, allowing y0 and y1 to default to 0
        .attr("x2", radius * 1.1);

    // draw the winterBins
    sunPathWinter.append("g").selectAll("path")
        .data(winterBins)
        .enter().append("path")
        .datum(function (d) { return d.solarPath; })
        .attr("d", pathLine)
        .attr("class", "bin")
        .attr("fill", function (d) { return cScale(d.value); });

    // // ****************************************************************
    // // SUMMER - FALL
    // // ****************************************************************
    // // Art Board
    // var board = dY.graph.addBoard("#dy-canvas-summer", { inWidth: radius * 2, inHeight: radius * 2, margin: margin });

    // // Board for SunPath
    // var sunPathSummer = board.g.append("g")
    //     .attr("transform", "translate(" + radius + "," + radius + ") ")
    //     .attr("class", "background");



    // // .on("mouseenter", function (d) {
    // //     d3.select(this).style("stroke-width", "1px");
    // // })
    // // .on("mouseoout", function (d) {
    // //     d3.select(this).style("stroke-width", "0.1px");
    // // })
    // // ;
    // //.on("mouseout", function (d) { d3.select(this).attr({ class: "bin" }); });

    // // draw the circle
    // var axisCircSum = sunPathSummer.append("g").attr("class", "axis")
    // axisCircSum.append("circle")
    //     .attr("cx", 0)
    //     .attr("r", radius);

    // var axisCenSum = sunPathSummer.append("g").attr("class", "axis")
    // axisCenSum.append("circle")
    //     .attr("cx", 0)
    //     .attr("r", radius * 0.01);



    // // radial arc
    // var startAngle = Math.PI / 4;
    // var endAngle = 7 * Math.PI / 4;
    // var resolution = (endAngle - startAngle) / (2 * Math.PI) * 360;
    // // startAngle += Math.PI / 2;
    // // endAngle += Math.PI / 2;
    // var angle = d3.scaleLinear()
    //     .domain([0, resolution - 1])
    //     .range([startAngle, endAngle]);

    // var line = d3.radialLine()
    //     .interpolate("basis")
    //     .tension(0)
    //     .radius(radius * 1.05)
    //     .angle(function (d, i) { return angle(i); });

    // var arcPathSum = sunPathSummer.append("g").attr("class", "axis");
    // arcPathSum.append("path")
    //     .datum(d3.range(resolution))
    //     .attr("d", line);

    // // draw the text
    // var angAxisGroups = sunPathSummer.append("g") // angAxisGroups is a reference to a collection of subgroups within this group. each subgroup has data bound to it related to one of 12 values: angles between 0 and 360
    //     .attr("class", "axis")
    //     .selectAll("g")
    //     .data(d3.range(0, 360, 15)) // bind 12 data objects (0-360 in steps of x)
    //     .enter().append("g")
    //     .attr("transform", function (d) { return "rotate(" + d + ")"; }); // rotate each subgroup about the origin by the proper angle
    // var ctrOffset = radius / 5;
    // angAxisGroups.append("line") // append a line to each
    //     .attr("x1", ctrOffset) // we only need to define x1 and x2, allowing y0 and y1 to default to 0
    //     .attr("x2", radius * 1.1);

    // // var textPadding = 10;
    // // angAxisGroups.append("text") // append some text to each
    // //     .attr("x", radius + textPadding * 2)
    // //     .attr("dy", textPadding / 2) // nudge text down a bit
    // //     .style("text-anchor", function (d) { return d > 180 ? "end" : null; })
    // //     .attr("transform", function (d) { return d > 180 ? "rotate(180 " + (radius + textPadding * 2) + ",0)" : null; })
    // //     .text(function (d) { return d > 270 ? null : d; });

    // // draw the summerBins
    // sunPathSummer.append("g").selectAll("path")
    //     .data(summerBins)
    //     .enter().append("path")
    //     .datum(function (d) { return d.solarPath; })
    //     .attr({
    //         d: pathLine,
    //         class: "bin",
    //         fill: function (d) { return cScale(d.value); }
    //     })

}

function bin(location, d0, d1, h0, h1) {
    this.loc = location;

    this.startDay = Math.min(d0, d1);
    this.endDay = Math.max(d0, d1);
    this.startHour = Math.min(h0, h1);
    this.endHour = Math.max(h0, h1);

    this.pts = [
        { day: d0, hour: solarTime(this.loc, d0, h0) },
        { day: d0, hour: solarTime(this.loc, d0, h1) },
        { day: d1, hour: solarTime(this.loc, d1, h1) },
        { day: d1, hour: solarTime(this.loc, d1, h0) }];

    // this.pts = [
    //     { day: d0, hour: h0 },
    //     { day: d0, hour: h1 },
    //     { day: d1, hour: h1 },
    //     { day: d1, hour: h0 }];

    this.path = [];
    this.solarPath = [];

    this.isVisible = function () {
        if (sunrise(this.loc.lat, this.startDay) > this.endHour && sunrise(this.loc.lat, this.endDay) > this.endHour) return false;
        if (sunset(this.loc.lat, this.startDay) < this.startHour && sunset(this.loc.lat, this.endDay) < this.startHour) return false;
        return true;
    }

    this.generateSolarPath = function (res) {
        // Interpolate points to form a path
        for (var i = 0; i < this.pts.length; i++) {
            var obj1 = this.pts[i];
            if (i === this.pts.length - 1) obj2 = this.pts[0];
            else obj2 = this.pts[i + 1];

            for (var t = 0; t < 1; t += 1 / res) {
                this.path.push(lerp(obj1, obj2, t));
            }
        }
        this.path.push(this.pts[0]);


        for (var i = 0; i < this.path.length; i++) {
            var sr = sunrise(this.loc.lat, this.path[i].day);
            var ss = sunset(this.loc.lat, this.path[i].day);
            // check path if it is on the boundry
            if (this.path[i].hour < sr) this.path[i].hour = sr;
            if (this.path[i].hour > ss) this.path[i].hour = ss;

            // generate solar geometry for time;
            this.solarPath.push(solarGeo(this.loc, this.path[i]))
        }
    }
}

lerp = function (obj1, obj2, t) {
    var d_t = (1 - t) * obj1.day + t * obj2.day;
    var h_t = (1 - t) * obj1.hour + t * obj2.hour;
    return { day: d_t, hour: h_t }
}

solarGeo = function (loc, time) {
    var lat = loc.lat;
    var lng = loc.lon;
    var tmz = loc.tmz;

    var alpha = dY.solarGeom.calcAlpha(time.day, time.hour);

    //calculate Declination Angle
    var decDeg = 0.396372 - 22.91327 * Math.cos(alpha) + 4.02543 * Math.sin(alpha) - 0.387205 * Math.cos(2 * alpha) + 0.051967 * Math.sin(2 * alpha) - 0.154527 * Math.cos(3 * alpha) + 0.084798 * Math.sin(3 * alpha);
    var decRad = dY.solarGeom.degToRad(decDeg);

    // time correction for solar angle
    var tc = 0.004297 + 0.107029 * Math.cos(alpha) - 1.837877 * Math.sin(alpha) - 0.837378 * Math.cos(2 * alpha) - 2.340475 * Math.sin(2 * alpha);

    // calculate Solar Hour Angle, angle between local longitude and solar noon
    var hAngDeg = (time.hour - 12 - tmz) * (360 / 24) + lng;// + tc;
    if (hAngDeg >= 180) hAngDeg = hAngDeg - 360;
    if (hAngDeg <= -180) hAngDeg = hAngDeg + 360;
    var hAngRad = dY.solarGeom.degToRad(hAngDeg);

    //calc Altitude Angle
    var latRad = dY.solarGeom.degToRad(lat);
    var cosZenith = Math.sin(latRad) * Math.sin(decRad) + Math.cos(latRad) * Math.cos(decRad) * Math.cos(hAngRad);
    if (cosZenith > 1) cosZenith = 1;
    if (cosZenith < -1) cosZenith = -1;

    var zenRad = Math.acos(cosZenith)
    var altRad = Math.asin(cosZenith)

    //calc Azimuth angle
    var cosAzi = (Math.sin(decRad) - Math.sin(latRad) * Math.cos(zenRad)) / (Math.cos(latRad) * Math.sin(zenRad));
    var aziDeg = dY.solarGeom.radToDeg(Math.acos(cosAzi));
    if (hAngRad > 0) aziDeg = 360 - aziDeg;
    var aziRad = dY.solarGeom.degToRad(aziDeg);

    return {
        altitude: altRad,
        altitudeDeg: dY.solarGeom.radToDeg(altRad),
        azimuth: aziRad,
        azimuthDeg: aziDeg,
        declinationRad: decRad,
        declinationDeg: decDeg,
        hourAngleRad: hAngRad,
        hourAngleDeg: hAngDeg
    }
}

// returns Hour of sunrise for a given day of the year
sunrise = function (lat, day) {
    var hour = 0;
    var latRad = lat * (Math.PI / 180);
    var decRad = solarDeclination(day, hour);
    var w_o = Math.acos(-Math.tan(latRad) * Math.tan(decRad));

    return 12 - w_o * 12 / Math.PI;
}

// returns Hour of sunrise for a given day of the year
sunset = function (lat, day) {
    var hour = 0;
    var latRad = lat * (Math.PI / 180);
    var decRad = solarDeclination(day, hour);
    var sunriseHourAngle = -Math.tan(latRad) * Math.tan(decRad);
    var w_o = Math.acos(-Math.tan(latRad) * Math.tan(decRad));

    return 12 + w_o * 12 / Math.PI;
}

solarTime = function (loc, day, hour) {
    // var b = (day - 81) * 360 / 365.25;
    var b = (day - 81) * 2 * Math.PI / 365.25; // check on degrees:
    var e = 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.58 * Math.sin(b)
    var tc = (4 * (15 * loc.tmz - loc.lon) + e) / 60;
    return hour + tc;
}

// ************************
// CALCULATING SOLAR ANGLES
// ************************
// returns solar alpha in radians
solarAlpha = function (day, hour) {
    return (2 * Math.PI / 365.25) * (day + hour / 24);
}

// returns solar declination in radians
solarDeclination = function (day, hour) {
    var alpha = solarAlpha(day, hour);
    var decDeg = 0.396372 - 22.91327 * Math.cos(alpha) + 4.02543 * Math.sin(alpha) - 0.387205 * Math.cos(2 * alpha) + 0.051967 * Math.sin(2 * alpha) - 0.154527 * Math.cos(3 * alpha) + 0.084798 * Math.sin(3 * alpha);

    return decDeg * (Math.PI / 180);
}

// returns solar hour angle in radians
solarHourAngle = function (lon, tmz, day, hour) {
    var alpha = solarAlpha(day, hour);
    var tc = 0.004297 + 0.107029 * Math.cos(alpha) - 1.837877 * Math.sin(alpha) - 0.837378 * Math.cos(2 * alpha) - 2.340475 * Math.sin(2 * alpha);

    var hAngDeg = (hour - 12 - tmz) * (360 / 24) + lon + tc;
    if (hAngDeg >= 180) hAngDeg = hAngDeg - 360;
    if (hAngDeg <= -180) hAngDeg = hAngDeg + 360;

    return hAngDeg * (Math.PI / 180);
}

solarAzimuth = function (lat, lon, tmz, day, hour) {
    var decRad = solarDeclination(day, hour);
    var latRad = lat * (Math.PI / 180);
    var hAngRad = solarHourAngle(lon, tmz, day, hour);

    var cosZenith = Math.sin(latRad) * Math.sin(decRad) + Math.cos(latRad) * Math.cos(decRad) * Math.cos(hAngRad);
    if (cosZenith > 1) cosZenith = 1;
    if (cosZenith < -1) cosZenith = -1;
    var zenRad = Math.acos(cosZenith)

    var cosAzi = (Math.sin(decRad) - Math.sin(latRad) * Math.cos(zenRad)) / (Math.cos(latRad) * Math.sin(zenRad));
    var aziRad = Math.acos(cosAzi);
    if (hAngRad > 0) aziRad = 2 * Math.PI - aziRad;

    return aziRad;
}

solarAltitude = function (lat, lon, tmz, day, hour) {
    var latRad = lat * (Math.PI / 180);
    var decRad = solarDeclination(day, hour);
    var hAngRad = solarHourAngle(lon, tmz, day, hour);

    var cosZenith = Math.sin(latRad) * Math.sin(decRad) + Math.cos(latRad) * Math.cos(decRad) * Math.cos(hAngRad);
    if (cosZenith > 1) cosZenith = 1;
    if (cosZenith < -1) cosZenith = -1;

    return Math.asin(cosZenith);
}
