// global namespace
var clima = clima || {};

// TimeSpan Class
clima.TimeSpan = function (start, end) {
    // can be given Dates or minutes of year
    // given dates should be in UTC and in year 1970
    // given dates will be rounded either UP or DOWN to the nearest minute

    if (Object.prototype.toString.call(start) == "[object Date]") start = +start
    if (Object.prototype.toString.call(end) == "[object Date]") end = +end
    if (end <= start) throw "timeSpans cannot be constructed backwards";
    if (start < 0 || end < 0) throw "timeSpans cannot be negative";
    if ((start > clima.utils.datetime.minsPerYr) && (end > clima.utils.datetime.minsPerYr)) throw "timeSpans should be constructed from a generic UTC year (1970)";
    this.spansYears = false;
    if (end > clima.utils.datetime.minsPerYr) this.spansYears = true;

    //var coeff = 1000 * 60; // to round to nearest minute
    var a = Math.ceil(start);
    var b = Math.floor(end);
    this._ = clima.utils.datetime.niceFormat(new Date(a * 1000 * 60)) + " -> " + clima.utils.datetime.niceFormat(new Date(b * 1000 * 60))
    this.min = a;
    this.max = b;
    this.mid = (b - a) * 0.5 + a;

    //this.dateStart = function() { return new Date(a); };
    //this.dateMid = function() { return new Date((b-a)*0.5 + a); };
    //this.dateEnd = function() { return new Date(b); };
    //this.date = function() { return this.dateMid() }; // a stand in for relating this time span to a single date for plotting a tick
    //this.dateDomain = function() { return [new Date(a), new Date(b)]; };

    this.hourOfYearStart = function () { return Math.round(a / 60); };
    this.hourOfYearMid = function () { return this.mid / 60; }; // NOT ROUNDED
    this.hourOfYearEnd = function () { return Math.round(b / 60); };
    this.hourOfYear = function () { return Math.floor(this.hourOfYearMid()) }; // a stand in for relating this time span to a single hour of the year for plotting a tick
    this.hourOfYearDomain = function () { return [this.hourOfYearStart(), this.hourOfYearEnd() - 1]; }; // end index is inclusive for constructing d3 domains. spans of a single hour will report zero-length domains

    this.hoursOfYear = function () { return Array.from(new Array(this.durationHrs()), (x, i) => i + this.hourOfYearStart()); };

    this.dayOfYear = function () { return Math.floor(this.hourOfYear() / 24); }; // a stand in for relating this time span to a single day of the year for plotting a tick
    this.hourOfDay = function () { return this.hourOfYear() % 24; }  // a stand in for relating this time span to a single day of the year for plotting a tick
    this.monthOfYear = function () { return new Date(this.mid * 1000 * 60).getUTCMonth() } // a stand in for relating this time span to a single month of the year for plotting a tick

    this.season = function () {
        if (clima.TimeSpan.season(0).contains(this)) return 0;
        if (clima.TimeSpan.season(1).contains(this)) return 1;
        if (clima.TimeSpan.season(2).contains(this)) return 2;
        if (clima.TimeSpan.season(3).contains(this)) return 3;
    };

    this.duration = function () { return b - a; };
    this.durationHrs = function () { return Math.round((b - a) / 60); };

    this.isHour = function () { return this.durationHrs() == 1; };
}

clima.TimeSpan.prototype.contains = function (val) {
    if ((Object.prototype.toString.call(val) !== "[object Number]") && (val.hasOwnProperty("mid"))) val = val.mid;

    if ((val < 0) || (val > clima.utils.datetime.minsPerYr)) console.warn("You asked timeSpan.contains(" + val + "). timeSpans describe minutes of a generic UTC year (1970), so that  contained values must lie between 0 and " + clima.utils.datetime.minsPerYr);

    if (this.spansYears) {
        if (val >= this.min) return true;
        if (val < this.max - clima.utils.datetime.minsPerYr) return true;
        return false;
    } else {
        return (val >= this.min && val < this.max);
    }
}

clima.TimeSpan.prototype.report = function () {
    console.log(this._);
    //console.log("\t date\t\t"+this.dateStart().toUTCString() +" -> "+ this.dateEnd().toUTCString() );
    console.log("\t hoy domain \t\t" + this.hourOfYearDomain());
    console.log("\t mid hr \t\t" + this.hourOfYearMid());
    console.log("\t dur\t\t" + this.duration());
    console.log("\t durHrs\t\t" + this.durationHrs());
    console.log("\t hour of year\t\t" + this.hourOfYear());
    console.log("\t day of year\t\t" + this.dayOfYear());
    console.log("\t hour of day\t\t" + this.hourOfDay());
    console.log("\t month of year\t\t" + this.monthOfYear());

    //console.log("\t hoursOfYear\t\t"+this.hoursOfYear());

};

clima.TimeSpan.hourOfYear = function (hr) { return new clima.TimeSpan(hr * 60, (hr + 1) * 60) }
clima.TimeSpan.hoursOfYear = function (a, b) { return new clima.TimeSpan(a * 60, b * 60) }

clima.TimeSpan.dayOfYear = function (day) { return new clima.TimeSpan((day * 24) * 60, ((day + 1) * 24) * 60) }
clima.TimeSpan.daysOfYear = function (a, b) { return new clima.TimeSpan((a * 24) * 60, ((b + 1) * 24) * 60) }

clima.TimeSpan.monthOfYear = function (mth) { return new clima.TimeSpan(clima.utils.datetime.monthTable[mth].domain[0], clima.utils.datetime.monthTable[mth].domain[1]); };
clima.TimeSpan.monthsOfYear = function (a, b) { return new clima.TimeSpan(clima.utils.datetime.monthTable[a].domain[0], clima.utils.datetime.monthTable[b].domain[1]); };

clima.TimeSpan.fullYear = new clima.TimeSpan(0, 525600);
clima.TimeSpan.janurary = clima.TimeSpan.monthOfYear(0);
clima.TimeSpan.february = clima.TimeSpan.monthOfYear(1);
clima.TimeSpan.march = clima.TimeSpan.monthOfYear(2);
clima.TimeSpan.april = clima.TimeSpan.monthOfYear(3);
clima.TimeSpan.may = clima.TimeSpan.monthOfYear(4);
clima.TimeSpan.june = clima.TimeSpan.monthOfYear(5);
clima.TimeSpan.july = clima.TimeSpan.monthOfYear(6);
clima.TimeSpan.august = clima.TimeSpan.monthOfYear(7);
clima.TimeSpan.september = clima.TimeSpan.monthOfYear(8);
clima.TimeSpan.october = clima.TimeSpan.monthOfYear(9);
clima.TimeSpan.november = clima.TimeSpan.monthOfYear(10);
clima.TimeSpan.december = clima.TimeSpan.monthOfYear(11);

clima.TimeSpan.season = function (s) { return new clima.TimeSpan(clima.utils.datetime.seasonTable[s].domain[0], clima.utils.datetime.seasonTable[s].domain[1]); };
clima.TimeSpan.winter = clima.TimeSpan.season(0);
clima.TimeSpan.spring = clima.TimeSpan.season(1);
clima.TimeSpan.summer = clima.TimeSpan.season(2);
clima.TimeSpan.fall = clima.TimeSpan.season(3);
clima.TimeSpan.autumn = clima.TimeSpan.season(3);
