// global namespace
var dY = dY || {};



// dY.datetime
//

dY.dt = {};
dY.dt.year = 1970; // the assumed year in all parsed dates. make sure it isn't a leap year.
dY.dt.minsPerYr = 525600; // the number of minutes in a year
dY.dt.millsPerMin = 60000; // millsPerMin
dY.dt.millsToMins = 0.00001666666; // coeff for converting milliseconds to minutes


dY.dt.dateStringToDate = function(str){
    // example: 01/21  07:00:00
    // the times listed in EP result file seem to represent the end of the hour. They start the day at 1am.
    // this means the last hour listed for a day is 24.
    // since javascript Date understands this as the following day, we set the returned Date object to the middle of the hour.
    // for this reason, our hours of the day will proceed from 0-23; while the EP result file proceeds from 1-24.
        
    splt = str.split("  ");
    date = splt[0].trim().split("/");
    month = parseInt(date[0])-1
    day = parseInt(date[1])
    hour = parseInt(splt[1].trim().split(":")[0])-1;
    
    dt = new Date(Date.UTC(dY.dt.year,month,day,hour,30));
    
    //console.log(str +"\t"+ month+"/"+day+" "+hour +"\t\t"+ dt.getUTCMonth() +" "+ dt.getUTCDate() +" " + dt.getUTCHours() + " -- " + dY.dt.dateToHourOfYear(dt));
    //console.log(dt.toUTCString() + "\t\t" + dY.dt.hourOfYearToDate( dY.dt.dateToHourOfYear(dt) ).toUTCString() );
    return dt;
}
dY.dt.dateToHourOfYear = function(dt){
    start = new Date(Date.UTC(dY.dt.year, 0, 1, 0, 30));
    diff = dt - start;
    hour = Math.floor(diff / (1000 * 60 * 60 ));
    return hour;
}
dY.dt.hourOfYearToDate = function(hr){
    return new Date( (hr+0.5) * (1000 * 60 * 60 )  ); // constructs a date in UTC by number of milliseconds 
}

dY.dt.niceFormat = function(dt){
    var mth = dY.dt.monthTable[ dt.getUTCMonth() ].shortname;
    var dat = dt.getUTCDate();
    var hours = dt.getUTCHours();
    var mins = dt.getUTCMinutes();
    
    var pad = function(n) { return (n < 10) ? ("0" + n) : n; }    
    
    return pad(dat) +" "+ mth + " " + pad(hours) + ":" +  pad(mins)
}

dY.dt.monthTable = [
    // domains are listed in minutes of the year
    {idx: 0, fullname: "January", shortname: "Jan" , domain: [Date.UTC(dY.dt.year,0,1,0,0,0,0)*dY.dt.millsToMins,  Date.UTC(dY.dt.year,1,1,0,0,0,0)*dY.dt.millsToMins] },
    {idx: 1, fullname: "February", shortname: "Feb" , domain: [Date.UTC(dY.dt.year,1,1,0,0,0,0)*dY.dt.millsToMins,  Date.UTC(dY.dt.year,2,1,0,0,0,0)*dY.dt.millsToMins] },
    {idx: 2, fullname: "March", shortname: "Mar" , domain: [Date.UTC(dY.dt.year,2,1,0,0,0,0)*dY.dt.millsToMins,  Date.UTC(dY.dt.year,3,1,0,0,0,0)*dY.dt.millsToMins] },
    {idx: 3, fullname: "April", shortname: "Apr" , domain: [Date.UTC(dY.dt.year,3,1,0,0,0,0)*dY.dt.millsToMins,  Date.UTC(dY.dt.year,4,1,0,0,0,0)*dY.dt.millsToMins] },
    {idx: 4, fullname: "May", shortname: "May" , domain: [Date.UTC(dY.dt.year,4,1,0,0,0,0)*dY.dt.millsToMins,  Date.UTC(dY.dt.year,5,1,0,0,0,0)*dY.dt.millsToMins] },
    {idx: 5, fullname: "June", shortname: "Jun" , domain: [Date.UTC(dY.dt.year,5,1,0,0,0,0)*dY.dt.millsToMins,  Date.UTC(dY.dt.year,6,1,0,0,0,0)*dY.dt.millsToMins] },
    {idx: 6, fullname: "July", shortname: "Jul" , domain: [Date.UTC(dY.dt.year,6,1,0,0,0,0)*dY.dt.millsToMins,  Date.UTC(dY.dt.year,7,1,0,0,0,0)*dY.dt.millsToMins] },
    {idx: 7, fullname: "August", shortname: "Aug" , domain: [Date.UTC(dY.dt.year,7,1,0,0,0,0)*dY.dt.millsToMins,  Date.UTC(dY.dt.year,8,1,0,0,0,0)*dY.dt.millsToMins] },
    {idx: 8, fullname: "September", shortname: "Sep" , domain: [Date.UTC(dY.dt.year,8,1,0,0,0,0)*dY.dt.millsToMins,  Date.UTC(dY.dt.year,9,1,0,0,0,0)*dY.dt.millsToMins] },
    {idx: 9, fullname: "October", shortname: "Oct" , domain: [Date.UTC(dY.dt.year,9,1,0,0,0,0)*dY.dt.millsToMins,  Date.UTC(dY.dt.year,10,1,0,0,0,0)*dY.dt.millsToMins] },
    {idx: 10, fullname: "November", shortname: "Nov" , domain: [Date.UTC(dY.dt.year,10,1,0,0,0,0)*dY.dt.millsToMins,  Date.UTC(dY.dt.year,11,1,0,0,0,0)*dY.dt.millsToMins] },
    {idx: 11, fullname: "December", shortname: "Dec" , domain: [Date.UTC(dY.dt.year,11,1,0,0,0,0)*dY.dt.millsToMins,  Date.UTC(dY.dt.year+1,0,1,0,0,0,0)*dY.dt.millsToMins] }
]

dY.dt.winterSolstice = Date.UTC(dY.dt.year,11,21,0,0,0,0)*dY.dt.millsToMins; // Dec 21st
dY.dt.springEquinox = Date.UTC(dY.dt.year,2,21,0,0,0,0)*dY.dt.millsToMins; // March 21st
dY.dt.summerSolstice = Date.UTC(dY.dt.year,5,21,0,0,0,0)*dY.dt.millsToMins; // Jun 21st
dY.dt.autumnalEquinox = Date.UTC(dY.dt.year,8,21,0,0,0,0)*dY.dt.millsToMins; // Sept 21st

dY.dt.seasonTable = [
    {idx: 0, fullname: "Winter", domain: [dY.dt.winterSolstice,dY.dt.springEquinox + dY.dt.minsPerYr] },
    {idx: 1, fullname: "Spring", domain: [dY.dt.springEquinox,dY.dt.summerSolstice] },
    {idx: 2, fullname: "Summer", domain: [dY.dt.summerSolstice,dY.dt.autumnalEquinox] },
    {idx: 3, fullname: "Autumn", domain: [dY.dt.autumnalEquinox,dY.dt.winterSolstice] },
]

// dY.timeSpan
//

dY.timeSpan = function(start, end){
    // can be given Dates or minutes of year 
    // given dates should be in UTC and in year 1970
    // given dates will be rounded either UP or DOWN to the nearest minute
    
    if (Object.prototype.toString.call(start) == "[object Date]") start = +start
    if (Object.prototype.toString.call(end) == "[object Date]") end = +end
    if (end <= start) throw "timeSpans cannot be constructed backwards";
    if (start < 0||end<0) throw "timeSpans cannot be negative";
    if ((start > dY.dt.minsPerYr)&&(end > dY.dt.minsPerYr)) throw "timeSpans should be constructed from a generic UTC year (1970)";
    this.spansYears = false;
    if (end > dY.dt.minsPerYr) this.spansYears = true;
    
    //var coeff = 1000 * 60; // to round to nearest minute
    var a = Math.ceil( start );
    var b = Math.floor( end );
    this._ = dY.dt.niceFormat( new Date(a*1000*60) ) + " -> " + dY.dt.niceFormat( new Date(b*1000*60) )
    this.min = a;
    this.max = b;
    this.mid = (b-a)*0.5 + a;
    
    //this.dateStart = function() { return new Date(a); };
    //this.dateMid = function() { return new Date((b-a)*0.5 + a); };
    //this.dateEnd = function() { return new Date(b); };
    //this.date = function() { return this.dateMid() }; // a stand in for relating this time span to a single date for plotting a tick
    //this.dateDomain = function() { return [new Date(a), new Date(b)]; };
    
    this.hourOfYearStart = function() { return Math.round(a / 60); };
    this.hourOfYearMid = function() { return this.mid / 60; }; // NOT ROUNDED
    this.hourOfYearEnd = function() { return Math.round(b / 60); }; 
    this.hourOfYear = function() { return Math.floor(this.hourOfYearMid()) }; // a stand in for relating this time span to a single hour of the year for plotting a tick
    this.hourOfYearDomain = function() { return [ this.hourOfYearStart(), this.hourOfYearEnd() - 1 ]; }; // end index is inclusive for constructing d3 domains. spans of a single hour will report zero-length domains
    
    this.hoursOfYear = function() { return Array.from(new Array(this.durationHrs()), (x,i) => i + this.hourOfYearStart()); };
    
    this.dayOfYear = function() { return Math.floor(this.hourOfYear() /24); }; // a stand in for relating this time span to a single day of the year for plotting a tick
    this.hourOfDay = function() { return this.hourOfYear() % 24;}  // a stand in for relating this time span to a single day of the year for plotting a tick
    this.monthOfYear = function() { return new Date(this.mid*1000*60).getUTCMonth() } // a stand in for relating this time span to a single month of the year for plotting a tick
    
    this.season = function() {
        if (dY.timeSpan.season(0).contains(this)) return 0;
        if (dY.timeSpan.season(1).contains(this)) return 1;
        if (dY.timeSpan.season(2).contains(this)) return 2;
        if (dY.timeSpan.season(3).contains(this)) return 3;
    };
    
    this.duration = function() { return b - a; };
    this.durationHrs = function() { return Math.round( (b - a) / 60); };
    
    this.isHour = function() { return this.durationHrs() == 1; };
}

dY.timeSpan.prototype.contains = function(val) {
    if( (Object.prototype.toString.call(val) !== "[object Number]")&& ( val.hasOwnProperty("mid") ) ) val = val.mid;
    
    if ((val<0)||(val > dY.dt.minsPerYr)) console.warn( "You asked timeSpan.contains("+val+"). timeSpans describe minutes of a generic UTC year (1970), so that  contained values must lie between 0 and " + dY.dt.minsPerYr );
    
    if (this.spansYears){
        if (val >= this.min) return true;
        if (val < this.max - dY.dt.minsPerYr) return true;
        return false;
    } else {    
        return (val >= this.min && val < this.max); 
    }
}

dY.timeSpan.prototype.report = function() { 
    console.log(this._);
    //console.log("\t date\t\t"+this.dateStart().toUTCString() +" -> "+ this.dateEnd().toUTCString() );
    console.log("\t hoy domain \t\t"+this.hourOfYearDomain());
    console.log("\t mid hr \t\t"+this.hourOfYearMid());
    console.log("\t dur\t\t"+this.duration());
    console.log("\t durHrs\t\t"+this.durationHrs());
    console.log("\t hour of year\t\t"+this.hourOfYear());
    console.log("\t day of year\t\t"+this.dayOfYear());
    console.log("\t hour of day\t\t"+this.hourOfDay());
    console.log("\t month of year\t\t"+this.monthOfYear());
    
    //console.log("\t hoursOfYear\t\t"+this.hoursOfYear());
    
 };

dY.timeSpan.hourOfYear = function(hr){ return new dY.timeSpan(hr*60 , (hr+1)*60) }
dY.timeSpan.hoursOfYear = function(a,b){ return new dY.timeSpan(a*60 , b*60)}

dY.timeSpan.dayOfYear = function(day){ return new dY.timeSpan( (day*24) * 60 , ((day+1)*24) * 60)}
dY.timeSpan.daysOfYear = function(a,b){ return new dY.timeSpan( (a*24) * 60 , ((b+1)*24) * 60)}
 
dY.timeSpan.monthOfYear = function(mth) { return new dY.timeSpan( dY.dt.monthTable[mth].domain[0], dY.dt.monthTable[mth].domain[1] ); };
dY.timeSpan.monthsOfYear = function(a,b) { return new dY.timeSpan( dY.dt.monthTable[a].domain[0], dY.dt.monthTable[b].domain[1] ); };

dY.timeSpan.fullYear = new dY.timeSpan( 0, 525600 );
dY.timeSpan.janurary = dY.timeSpan.monthOfYear(0);
dY.timeSpan.february = dY.timeSpan.monthOfYear(1);
dY.timeSpan.march = dY.timeSpan.monthOfYear(2);
dY.timeSpan.april = dY.timeSpan.monthOfYear(3);
dY.timeSpan.may = dY.timeSpan.monthOfYear(4);
dY.timeSpan.june = dY.timeSpan.monthOfYear(5);
dY.timeSpan.july = dY.timeSpan.monthOfYear(6);
dY.timeSpan.august = dY.timeSpan.monthOfYear(7);
dY.timeSpan.september = dY.timeSpan.monthOfYear(8);
dY.timeSpan.october = dY.timeSpan.monthOfYear(9);
dY.timeSpan.november = dY.timeSpan.monthOfYear(10);
dY.timeSpan.december = dY.timeSpan.monthOfYear(11);

dY.timeSpan.season = function(s) { return new dY.timeSpan( dY.dt.seasonTable[s].domain[0], dY.dt.seasonTable[s].domain[1] ); };
dY.timeSpan.winter = dY.timeSpan.season(0);
dY.timeSpan.spring = dY.timeSpan.season(1);
dY.timeSpan.summer = dY.timeSpan.season(2);
dY.timeSpan.fall = dY.timeSpan.season(3);
dY.timeSpan.autumn = dY.timeSpan.season(3);











