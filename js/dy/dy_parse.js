// requires PapaParse: <script src="js/papaparse.min.js"></script>


// global namespace
var dY = dY || {};
dY.parser = {};

function onDataLoaded(data, fields) {
    dY.report("dhr: THIS IS A PLACEHOLDER FUNCTION - REPLACE WITH YOUR OWN");
}

dY.report = function (msg) {
    console.log(msg);
    /*
    if ($("#dy-console").length){
        var text = $("#dy-console").val() +"\n" + msg;
        $("#dy-console").text(text);
        $('#dy-console').scrollTop($('#dy-console')[0].scrollHeight);
    }*/
}

dY.parser.EPWKeyDefs = [
    { key: "EtRadHorz", col: 10 },
    { key: "EtRadNorm", col: 11 },
    { key: "GblHorzIrad", col: 13 },
    { key: "DirNormIrad", col: 14 },
    { key: "DifHorzIrad", col: 15 },
    { key: "GblHorzIllum", col: 16 },
    { key: "DirNormIllum", col: 17 },
    { key: "DifHorzIllum", col: 18 },
    { key: "ZenLum", col: 19 },
    { key: "TotSkyCvr", col: 22 },
    { key: "OpqSkyCvr", col: 23 },
    { key: "DryBulbTemp", col: 6 },
    { key: "DewPtTemp", col: 7 },
    { key: "RelHumid", col: 8 },
    { key: "Pressure", col: 9 },
    { key: "WindDir", col: 20 },
    { key: "WindSpd", col: 21 },
    { key: "HorzVis", col: 24 },
    { key: "CeilHght", col: 25 },
    { key: "PreciptWater", col: 28 },
    { key: "AeroDepth", col: 29 },
    { key: "SnowDepth", col: 30 },
    { key: "DaysSinceSnow", col: 31 }
];

dY.parser.zoneKeyToString = function (zoneString, keyString) { return zoneString.trim() + ":" + keyString.trim() }
dY.parser.stringToZoneKey = function (str) {
    str = str.trim();
    if (str.indexOf(":") == -1) {
        // fail silently if given date/time as field
        if (str == "Date/Time") return false;
        dY.report("dy: Improperly formatted string for zoneKey. No separator found for '" + str + "'");
        return false;
    }
    return [str.split(":")[0].trim(), str.substring(str.indexOf(":") + 1)]
}


dY.parser.handleParseErrors = function (results) {
    if (results.errors.length > 0) {
        dY.report("dy: Parser encountered " + results.errors.length + " error(s).")
        results.errors.forEach(function (error, n) {
            if (error.code == "TooFewFields" && error.row == results.data.length - 1) {
                dY.report("\tThe last row contained improperly formatted data. This happens all the time.");
                results.data.splice(results.data.length - 1, 1);
            } else {
                dY.report("\t" + n + "\t" + error.code + "; " + error.message + "; row: " + error.row);
            }
        });
    }
    return true;
}

// Handle Parsed Fields
//
schema = {};
if (results.meta.fields.length > 0) {
    dY.report("dy: Parser found " + results.meta.fields.length + " columns (not including Date/Time)")

    // find zone strings
    zoneStrings = new Set();
    results.meta.fields.forEach(function (field, n) {
        if (!dY.parser.stringToZoneKey(field)) return;
        zoneStrings.add(dY.parser.stringToZoneKey(field)[0]);
    });
    zoneStrings = Array.from(zoneStrings);

    // construct zoneKeys
    zoneStrings.forEach(function (zoneStr, n) {
        schema[zoneStr] = {};
        results.meta.fields.forEach(function (field, n) {
            key = dY.parser.stringToZoneKey(field);
            //if (key && key[0] == zoneStr) schema[zoneStr].push(key[1]);
            if (key && key[0] == zoneStr) schema[zoneStr][key[1]] = {};
        });
    });

    // report
    /*
    for (var zon in schema) {
        dY.report("\t"+zon);
        for (var key in schema[zon]) {
            dY.report("\t\t"+key);
        }
    }
    */
}

// Handle Hourly Data
//
dY.report("dy: Parser found " + results.data.length + " rows. Parser doesn't care about the number of rows nor their order.")

// create hourly ticks
ticks = [];
results.data.forEach(function (row, n) {
    hourOfYear = dY.dt.dateToHourOfYear(dY.dt.dateStringToDate(row["Date/Time"]));
    timespan = dY.timeSpan.hourOfYear(hourOfYear);
    data = {};
    for (var zon in schema) {
        data[zon] = {};
        for (var key in schema[zon]) {
            value = row[dY.parser.zoneKeyToString(zon, key)];
            data[zon][key] = value;
        }
    }
    ticks.push(new dY.Tick(timespan, data));

});


// fill out schema information
schema = dY.util.summarizeTicks(schema, ticks);

yr = new dY.Year(schema, ticks)
if (typeof (callback) === 'undefined') {
    return yr;
} else {
    callback(yr);
}
}


dY.parser.handleParseEPWResults = function (head, results, callback) {
    dY.report("dy: Parsing EPW Weather File");

    // Handle Parse Errors
    if (!dY.parser.handleParseErrors(results)) {
        dY.report("Parser failed. Quitting.");
        return false;
    }


    // Handle Parsed Fields
    //
    schema = { EPW: {} };
    dY.parser.EPWKeyDefs.forEach(function (keyDef) {
        schema["EPW"][keyDef.key] = {};
    });


    // Handle Hourly Data
    //
    dY.report("dy: Parser found " + results.data.length + " rows. We expect this to represent a full year of 8760 hours.")

    // create hourly ticks
    ticks = [];
    results.data.forEach(function (row, n) {
        datestring = dY.util.pad(row[1]) + "/" + dY.util.pad(row[2]) + "  " + dY.util.pad(row[3]) + ":00"
        hourOfYear = dY.dt.dateToHourOfYear(dY.dt.dateStringToDate(datestring));
        timespan = dY.timeSpan.hourOfYear(hourOfYear);
        data = {};
        data["EPW"] = {};
        dY.parser.EPWKeyDefs.forEach(function (keyDef) {
            value = row[keyDef.col];
            data["EPW"][keyDef.key] = value;
        });
        ticks.push(new dY.Tick(timespan, data));

    });

    // fill out schema information
    schema = dY.util.summarizeTicks(schema, ticks);

    // create new Year object
    yr = new dY.Year(schema, ticks)

    // enrich with header information
    yr = dY.parser.handleEPWHeader(yr, head);


    if (typeof (callback) === 'undefined') {
        return yr;
    } else {
        callback(yr);
    }
}

dY.parser.handleEPWHeader = function (yr, headString) {
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
            dY.dt.dateToHourOfYear(Date.parse(headTypExtrmPeriods[p + 2] + "/" + dY.dt.year + " 00:30:00 UTC")),
            dY.dt.dateToHourOfYear(Date.parse(headTypExtrmPeriods[p + 3] + "/" + dY.dt.year + " 23:30:00 UTC"))
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

dY.parser.handleSingleEPWFileUpload = function (evt) {
    var file = evt.target.files[0];
    var reader = new FileReader();
    reader.onload = function () {
        splt = this.result.split("\n");

        head = splt.slice(0, 8).join("\n");
        body = splt.slice(8, splt.length).join("\n");

        console.log("done reading");

        Papa.parse(body, {
            delimiter: ",",
            skipEmptyLines: true,
            header: false,
            dynamicTyping: true,
            complete: function (results) {
                dY.parser.handleParseEPWResults(head, results, onDataLoaded);
            }
        });
    }
    reader.readAsText(file);
}












