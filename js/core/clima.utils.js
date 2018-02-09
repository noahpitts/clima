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

// EPW Data Fields -- TODO: add Full name
// https://bigladdersoftware.com/epx/docs/8-3/auxiliary-programs/energyplus-weather-file-epw-data-dictionary.html#field-data-source-and-uncertainty-flags



// Return the units of a given field - TODO: OPTIMIZE
clima.utils.getFieldUnits = function (key) {
    for (var i = 0; i < clima.utils.EPWDataFields.length; i++) {
        var field = clima.utils.EPWDataFields[i]
        if (field.key === key) {
            return field.units
        }
    }
}

// Return the full name of a given field - TODO: OPTIMIZE
clima.utils.getFieldName = function (key) {
    for (var i = 0; i < clima.utils.EPWDataFields.length; i++) {
        var field = clima.utils.EPWDataFields[i]
        if (field.key === key) {
            return field.name
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
    { key: "TotSkyCvr", units: "TODO: ???", col: 22, name: "Total Sky Cover", description: "TODO: Add Description" },

    // Field: Opaque Sky Cover
    // This is the value for opaque sky cover (tenths of coverage). (i.e. 1 is 1/10 covered. 10 is total coverage). (Amount of sky dome in tenths covered by clouds or obscuring phenomena that prevent observing the sky or higher cloud layers at the time indicated.) Minimum value is 0; maximum value is 10; missing value is 99.
    { key: "OpqSkyCvr", units: "TODO: ???", col: 23, name: "Opaque Sky Cover", description: "TODO: Add Description" },

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
