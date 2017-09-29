// requires PapaParse: <script src="js/papaparse.min.js"></script>
// global namespace
var dY = dY || {};
dY.parser = {};

function onDataLoaded(data,fields) {
    dY.report("dhr: THIS IS A PLACEHOLDER FUNCTION - REPLACE WITH YOUR OWN");
}

dY.report = function (msg){
    console.log(msg);
    /*
    if ($("#dy-console").length){
        var text = $("#dy-console").val() +"\n" + msg;
        $("#dy-console").text(text);
        $('#dy-console').scrollTop($('#dy-console')[0].scrollHeight);
    }*/
}

dY.parser.EPWKeyDefs = [
		{key:"EtRadHorz", col:10 },
		{key:"EtRadNorm", col:11 },
		{key:"GblHorzIrad", col:13 },
		{key:"DirNormIrad", col:14},
		{key:"DifHorzIrad", col:15 },
		{key:"GblHorzIllum", col:16 },
		{key:"DirNormIllum", col:17 },
		{key:"DifHorzIllum", col:18},
		{key:"ZenLum", col:19 },
		{key:"TotSkyCvr", col:22 },
		{key:"OpqSkyCvr", col:23 },
		{key:"DryBulbTemp", col:6 },
		{key:"DewPtTemp", col:7 },
		{key:"RelHumid", col:8 },
		{key:"Pressure", col:9 },
		{key:"WindDir", col:20 },
		{key:"WindSpd", col:21 },
		{key:"HorzVis", col:24},
		{key:"CeilHght", col:25},
		{key:"PreciptWater", col:28 },
		{key:"AeroDepth", col:29 },
		{key:"SnowDepth", col:30},
		{key:"DaysSinceSnow", col:31}  
];

dY.parser.zoneKeyToString = function (zoneString,keyString){ return zoneString.trim() + ":" + keyString.trim() }
dY.parser.stringToZoneKey = function (str){
    str = str.trim();
    if (str.indexOf(":") == -1){
        // fail silently if given date/time as field
        if (str == "Date/Time") return false;
        dY.report("dy: Improperly formatted string for zoneKey. No separator found for '"+str+"'");
        return false;
    }
    return [ str.split(":")[0].trim(), str.substring(str.indexOf(":")+1) ]
}


dY.parser.handleParseErrors = function(results){
    if (results.errors.length > 0){
        dY.report("dy: Parser encountered "+results.errors.length+" error(s).")
        results.errors.forEach(function(error,n) {
            if (error.code == "TooFewFields" && error.row == results.data.length-1) {
                dY.report("\tThe last row contained improperly formatted data. This happens all the time.");
                results.data.splice(results.data.length-1,1);
            } else {
                dY.report("\t"+n+"\t"+error.code+"; "+error.message+"; row: "+error.row);
            }        
        });
    }
    return true;
}

dY.parser.handleParseEPlusResults = function (results, callback) {
    dY.report("dy: Parsing EPlus Results File");
    
    // Handle Parse Errors
    if (!dY.parser.handleParseErrors(results)){
        dY.report("Parser failed. Quitting.");
        return false;
    }
    
    
    // Handle Parsed Fields
    //
    schema = {};
    if (results.meta.fields.length > 0){
        dY.report("dy: Parser found "+results.meta.fields.length+" columns (not including Date/Time)")
        
        // find zone strings
        zoneStrings = new Set();
        results.meta.fields.forEach(function(field,n) {
            if (!dY.parser.stringToZoneKey(field)) return;
            zoneStrings.add(dY.parser.stringToZoneKey(field)[0]);
        });
        zoneStrings = Array.from(zoneStrings);
        
        // construct zoneKeys
        zoneStrings.forEach(function(zoneStr,n) {
            schema[zoneStr] = {};
            results.meta.fields.forEach(function(field,n) {
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
    dY.report("dy: Parser found "+results.data.length+" rows. Parser doesn't care about the number of rows nor their order.")
    
    // create hourly ticks
    ticks = [];
    results.data.forEach(function(row,n) {
        hourOfYear = dY.dt.dateToHourOfYear( dY.dt.dateStringToDate(row["Date/Time"]) );
        timespan = dY.timeSpan.hourOfYear(hourOfYear);
        data = {};
        for (var zon in schema) {
            data[zon] = {};
            for (var key in schema[zon]) {
                value = row[dY.parser.zoneKeyToString(zon,key)];
                data[zon][key] = value;
            }
        }
        ticks.push( new dY.Tick(timespan, data)  );
        
    });
    
    
    // fill out schema information
    schema = dY.util.summarizeTicks(schema, ticks);    
    
    yr = new dY.Year(schema,ticks)
    if (typeof(callback)==='undefined') {
        return yr;
    } else {
        callback(yr);
    }    
}


dY.parser.handleParseEPWResults = function (head, results, callback) {
    dY.report("dy: Parsing EPW Weather File");
    
    // Handle Parse Errors
    if (!dY.parser.handleParseErrors(results)){
        dY.report("Parser failed. Quitting.");
        return false;
    }
    
    
    // Handle Parsed Fields
    //
    schema = {EPW:{}};
    dY.parser.EPWKeyDefs.forEach(function(keyDef) {
        schema["EPW"][keyDef.key] = {};
    });
    
    
    // Handle Hourly Data
    //
    dY.report("dy: Parser found "+results.data.length+" rows. We expect this to represent a full year of 8760 hours.")
    
    // create hourly ticks
    ticks = [];
    results.data.forEach(function(row,n) {
        datestring = dY.util.pad(row[1]) +"/"+ dY.util.pad(row[2]) + "  " + dY.util.pad(row[3])+ ":00"
        hourOfYear = dY.dt.dateToHourOfYear( dY.dt.dateStringToDate(datestring) );
        timespan = dY.timeSpan.hourOfYear(hourOfYear);
        data = {};
        data["EPW"] = {};
        dY.parser.EPWKeyDefs.forEach(function(keyDef) {
            value = row[keyDef.col];
            data["EPW"][keyDef.key] = value;
        });
        ticks.push( new dY.Tick(timespan, data)  );
        
    });
    
    // fill out schema information
    schema = dY.util.summarizeTicks(schema, ticks);    
    
    // create new Year object
    yr = new dY.Year(schema,ticks)
    
    // enrich with header information
    yr = dY.parser.handleEPWHeader(yr, head);

    
    if (typeof(callback)==='undefined') {
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
        leapYearObserved: headHolidayDaylightSvg[1]=="Yes",
        note: "dY.parser doesn't currently handle most Holiday/Daylight Savings data. Consider contributing to dY on GitHub!"
    }    

    yr.epwhead.comments = {
        comments1: headComments1,
        comments2: headComments2,
        note: "dY.parser doesn't currently handle most comment data. Consider contributing to dY on GitHub!"
    }        
    
    yr.epwhead.periods = {};
    var pcnt = parseInt(headTypExtrmPeriods[1]);
    for(var p=2; p<pcnt*4+2; p+=4){
        var type = headTypExtrmPeriods[p+1].toLowerCase();
        if (!yr.epwhead.periods.hasOwnProperty(type) ) yr.epwhead.periods[type] = []
        var hrDomain = [
            dY.dt.dateToHourOfYear( Date.parse( headTypExtrmPeriods[p+2] + "/" + dY.dt.year + " 00:30:00 UTC" ) ),
            dY.dt.dateToHourOfYear( Date.parse( headTypExtrmPeriods[p+3] + "/" + dY.dt.year + " 23:30:00 UTC" ) )
        ]
        yr.epwhead.periods[type].push({
            name: headTypExtrmPeriods[p],
            domainStr: [headTypExtrmPeriods[p+2],headTypExtrmPeriods[p+3]],
            domain: hrDomain
        });
    }
    
    yr.epwhead.ground = [];
    var gcnt = parseInt(headGroundTemp[1]);
    for(var g=2; g<gcnt*16+2; g+=16){
        var gobj = {};
        gobj.depth = parseFloat(headGroundTemp[g]);
        gobj.conductivity = parseFloat(headGroundTemp[g+1]);
        gobj.density = parseFloat(headGroundTemp[g+2]);
        gobj.specificHeat = parseFloat(headGroundTemp[g+3]);
        gobj.monthlyTemperature = [];
        for(var m=0; m<12; m++){
            gobj.monthlyTemperature.push(parseFloat(headGroundTemp[g+m+4]));
        }
        
        yr.epwhead.ground.push(gobj);
    }
    
    return yr;
}

dY.parser.handleSingleEPlusFileUpload = function (evt) {
    var file = evt.target.files[0];

    Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        complete: function(results) {
            dY.parser.handleParseEPlusResults(results,onDataLoaded);
        }
    });
}

dY.parser.handleSingleEPWFileUpload = function (evt) {
    var file = evt.target.files[0];
    var reader = new FileReader();
    reader.onload = function() {
        splt = this.result.split("\n");
        
        head = splt.slice(0,8).join("\n");
        body = splt.slice(8,splt.length).join("\n");
        
        console.log("done reading");
        
        Papa.parse(body, {
            delimiter: ",",
            skipEmptyLines: true,
            header: false,
            dynamicTyping: true,
            complete: function(results) {
                dY.parser.handleParseEPWResults(head, results,onDataLoaded);
            }
        });
    }
    reader.readAsText(file);
}



// global variable
var readFileData = new Object;
    
dY.parser.handleMultDBuilderFileUpload = function (evt) {
    //console.log("Design Builder Parser by Elaina Present");
    
    doubleDigit = function(numstring){
        //console.log(numstring);
        //console.log(numstring.length);
        simplestring = numstring.replace(/"/g,'').trim() 
        if (simplestring.length>=2){
            return simplestring;
        } else{
            //console.log('adding0');
            return "0"+simplestring;
        }
    }

    multiRead = function(files){
        
        var j = 0, k = files.length;
         for (var i = 0; i < k; i++) {
             var reader = new FileReader();
             //console.log("2");
             reader.name = files[i].name;
             reader.onloadend = function (evt) {
                 //console.log(evt);
                 if (evt.target.readyState == FileReader.DONE) {
                     readFileData[this.name] = evt.target.result;
                     j++;
                     if (j == k){
                         //alert('All files read');
                         doIt(readFileData);
                     }
                 }
             };
             reader.readAsText(files[i]);
             //console.log("10");
         }
        
    }
    
    
    var doIt = function(filedata){
            
        //console.log(filedata);
        var headCount = 2; // the number of header rows that we expect
        var combinedContentRows = new Array(8760);//currently only works with 8760 data -- but upside is it gets rid of any extra rows
        var combinedHeaderRows = "Date/Time";
        //console.log(combinedContentRows.length);
        
        var init = true;
        
        for (var filename in filedata){
            //console.log( filename );
            var fileContent = filedata[filename] ;
            var splitContent = fileContent.split("\n");
            //console.log("rowcount: " + splitContent.length);//content.length should be the number of rows (i.e. 8762). It is currently 8764.
            
            headRows = splitContent.slice(0,2);
            contentRows = splitContent.slice(2);
            
            
            // Step 1: adding to combinedHeaderRows
            //
            var firstSplitHeadRow = headRows[0].split(",");
            var secondSplitHeadRow = headRows[1].split(",");
            if (firstSplitHeadRow[firstSplitHeadRow.length-1].trim() == "") firstSplitHeadRow.pop();
            if (secondSplitHeadRow[secondSplitHeadRow.length-1].trim() == "") secondSplitHeadRow.pop();
                    
            //console.log(firstSplitHeadRow);
            //console.log(secondSplitHeadRow);
            var fname = filename.slice(0,-4);
            for (var col=1; col<firstSplitHeadRow.length; col++){
                var str = fname+":"+ firstSplitHeadRow[col]+"[" + secondSplitHeadRow[col].replace(/[^\w\s]/gi, '') + "]"; //creates EPlus style header from DB headers. NOTE: cutting to -1 takes the last character off! I fixed it to just not take a 2nd param.
                var res = str.replace(/"/g,'')
                combinedHeaderRows = combinedHeaderRows + "," + res;
            }
            
            
            //Step 2: dealing with date
            //EPlus dates look like this: " 01/01  08:00:00"
            //DB dates look like this: "1/1/2002  1:00:00 AM"
            //loop
            if (init){
                var prevDay = -1; // DB labels the last hour of each day with the next day's date. Remember to replace if needed.
                var prevMth = -1; 
                for (var row = 0; row<(contentRows.length-1); row++){
                    var firstSpace = contentRows[row].indexOf(" ");
                    var lastSpace = contentRows[row].lastIndexOf(" ");
                    
                    var month = doubleDigit(contentRows[row].slice(0,contentRows[row].indexOf("/")));
                    var day = doubleDigit(contentRows[row].slice(contentRows[row].indexOf("/")+1, contentRows[row].lastIndexOf("/")));
                    
                    if (contentRows[row].indexOf(" ")== -1){
                        var loc = contentRows[row].length;
                    } else{
                        var loc = firstSpace;
                    }
                    //LOL all that and I didn't actually need the year
        //			var year = contentRows[row].slice(loc-2, loc);
                    if (firstSpace== -1){
                        var hour = 24;
                        if (month != prevMth) month = prevMth;
                        day = prevDay;
                    } else {
                        var hour = parseInt( contentRows[row].slice( firstSpace, contentRows[row].indexOf(":") ).trim() ) ;
                        if( (contentRows[row].slice(lastSpace+1, lastSpace+3) =="PM") && (hour != 12)  ){
                            hour = hour + 12;
                        }
                    }
                    hour = doubleDigit(hour.toString());
                    combinedContentRows[row]=  month + '/' + day +  '  ' + hour + ":00:00"
                    prevDay = day;
                    prevMth = month;
                    //console.log(day);                    
                }
                init = false;
            }
            
            // Step 3: adding to combinedContentRows
            //instructions: content string needs an array of strings, one for each row. Initialize a string for each row (or, for every row in file, initialize a string), ...after split, check how many items, if 0 or 1, omit row
            //console.log(contentRows.length)//this is # rows. It is 8762 (should be 2 shorter)
            for(var row = 0; row<(contentRows.length-1); row++){//iterate over rows
                var str = contentRows[row].slice(contentRows[row].indexOf(",")+1).trim() 
                var res = str.replace(/"/g,'')//they were all in quotes for some reason. now they're not. Did we want them to be?
                combinedContentRows[row] = combinedContentRows[row]+ "," +res;//works! has a trailing comma I don't like though
            }
            //console.log(combinedContentRows[0].length);
            
            //trying to get rid of that stupid last comma. Not yet successful.
            for (var row = 0; row <combinedContentRows.length-1; row++){
                if(combinedContentRows[row][combinedContentRows[row].length-1]==",") combinedContentRows[row] = combinedContentRows[row].slice(0,-1);
            }
        }
        
        
        

        //console.log(combinedContentRows[5]);
        
        combinedContentRows.unshift(combinedHeaderRows);
        var fakeEPString = combinedContentRows.join("\n");
        //console.log(fakeEPString.slice(0,800));
        var data = Papa.parse(fakeEPString, {
            header: true,
            delimiter: ",",
            newline: "\n",
            dynamicTyping: true,
            complete: function(results) {
                dY.parser.handleParseEPlusResults(results,onDataLoaded);
            }        
        });    
        //console.log(data);
    }
    
    
    multiRead(evt.target.files);
}	














