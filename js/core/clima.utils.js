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
        // clima.climates.sort(function (a, b) {
        //     if (a.location.city < b.location.city) return -1;
        //     if (a.location.city === b.location.city) return 0;
        //     if (a.location.city > b.location.city) return 1;
        // });
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

// EPW Data Fields -- TODO: add Full name
clima.utils.EPWDataFields = [
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
