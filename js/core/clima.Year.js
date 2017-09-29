// Global Namespace
var clima = clima || {};

// Initialize array to store climate data structures
clima.climates = clima.climates || [];

// ----------------------------------------



/* Adapted from Kyle Steinfeld's dY Library
   https://github.com/ksteinfe/dy_working */

// Constructor function for Climate Data Structure
clima.data.Year = function (schema, ticks) {
    this.schema = schema;
    this.ticks = ticks;
}

// Prototype functions for Climate Data Structure

// TODO: Docs
clima.data.Year.prototype.metaOf = function (zonekey) {
    if (zonekey.constructor === Array) return this.schema[zonekey[0]][zonekey[1]];
    return this.schema[Object.keys(this.schema)[0]][zonekey];
};

// TODO: Docs
clima.data.Year.prototype.valuesOf = function (zonekey) {
    return this.ticks.map(function (d) { return d.valueOf(zonekey); });
};

// TODO: Refactor and Docs
clima.data.Year.prototype.dailySummary = function (dayCount = 1) {
    var slcs = [];
    var t = 0;
    while (t < this.ticks.length) {
        var timespan = dY.timeSpan.hoursOfYear(t, t + 24 * dayCount - 1);
        var data = dY.util.summarizeTicks(this.schema, ticks.slice(t, t + 24 * dayCount));

        slcs.push(new dY.STick(timespan, data));
        t += 24 * dayCount;
    }
    return slcs;
};

// TODO: Refactor and Docs
dY.hourOfDaySummary = function (schema, ticks) {
    var sortedTicks = {};
    for (var t in ticks) {
        var h = ticks[t].hourOfDay();
        if (!sortedTicks.hasOwnProperty(h)) sortedTicks[h] = [];
        sortedTicks[h].push(ticks[t]);
    }

    var ret = [];
    for (var h in sortedTicks) {
        var timespan = dY.timeSpan.hourOfYear(parseInt(h));
        var data = dY.util.summarizeTicks(schema, sortedTicks[h]);
        var stick = new dY.STick(timespan, data);

        ret.push(stick);
    }
    return ret;
};

