// global namespace
var dY = dY || {};


dY.Year = function(schema, ticks){
    this.schema  = schema;
    this.ticks = ticks;
}

dY.Year.prototype.metaOf = function(zonekey) {
    if (zonekey.constructor === Array)  return this.schema[zonekey[0]][zonekey[1]];
    return this.schema[Object.keys(this.schema)[0]][zonekey];    
};

dY.Year.prototype.valuesOf = function(zonekey) {
    return this.ticks.map(function(d) {return d.valueOf(zonekey);});
};

// this function currently only works with hourly ticks.
// TODO: modify to work with ticks of any timespan
// also, move to dY namespace as below
dY.Year.prototype.dailySummary = function(dayCount = 1) {
    var slcs = [];
    var t = 0;
    while (t < this.ticks.length){
        var timespan = dY.timeSpan.hoursOfYear(t,t+24*dayCount-1);
        var data = dY.util.summarizeTicks(this.schema, ticks.slice(t,t+24*dayCount)  );
        
        slcs.push( new dY.STick( timespan, data ) ) ;
        t += 24*dayCount;
    }
    return slcs;
};


dY.hourOfDaySummary = function(schema, ticks) {
    var sortedTicks = {};
    for (var t in ticks) {
        var  h = ticks[t].hourOfDay();
        if (!sortedTicks.hasOwnProperty(h) ) sortedTicks[h] = [];
        sortedTicks[h].push( ticks[t] ) ;
    }
    
    var ret = [];
    for (var h in sortedTicks){
        var timespan = dY.timeSpan.hourOfYear( parseInt(h) );
        var data = dY.util.summarizeTicks(schema, sortedTicks[h] );
        var stick = new dY.STick( timespan, data );
        
        ret.push(stick);
    }
    return ret;
};