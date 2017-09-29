// global namespace
var clima = clima || {};

clima.data = clima.data || {};
clima.data.Tick = function (timespan, data) {
    this.ts = timespan;
    this.hourOfYear = timespan.hourOfYear();
    this.data = data;
}

clima.data.Tick.prototype.valueOf = function (zonekey) {
    if (zonekey.constructor === Array) return this.data[zonekey[0]][zonekey[1]];
    return this.data[Object.keys(this.data)[0]][zonekey];
};

clima.data.Tick.prototype.hourOfYear = function () { return this.ts.hourOfYear(); };
clima.data.Tick.prototype.dayOfYear = function () { return this.ts.dayOfYear(); };
clima.data.Tick.prototype.hourOfDay = function () { return this.ts.hourOfDay(); };
clima.data.Tick.prototype.monthOfYear = function () { return this.ts.monthOfYear(); };
clima.data.Tick.prototype.season = function () { return this.ts.season(); };
clima.data.Tick.prototype.isIn = function (ts) { return ts.contains(this.ts.mid); };




clima.data.STick = function (timespan, data) {
    this.ts = timespan;
    this.data = data;
}

clima.data.STick.prototype.metaOf = function (zonekey) {
    if (zonekey.constructor === Array) return this.data[zonekey[0]][zonekey[1]];
    return this.data[Object.keys(this.data)[0]][zonekey];
};

clima.data.STick.prototype.averageOf = function (zonekey) { return this.metaOf(zonekey).average };
clima.data.STick.prototype.domainOf = function (zonekey) { return this.metaOf(zonekey).domain };
clima.data.STick.prototype.maxOf = function (zonekey) { return this.metaOf(zonekey).max };
clima.data.STick.prototype.medianOf = function (zonekey) { return this.metaOf(zonekey).median };
clima.data.STick.prototype.minOf = function (zonekey) { return this.metaOf(zonekey).min };
clima.data.STick.prototype.q1Of = function (zonekey) { return this.metaOf(zonekey).q1 };
clima.data.STick.prototype.q2Of = function (zonekey) { return this.metaOf(zonekey).q2 };
clima.data.STick.prototype.q3Of = function (zonekey) { return this.metaOf(zonekey).q3 };

clima.data.STick.prototype.hourOfYear = function () { return this.ts.hourOfYear(); };
clima.data.STick.prototype.dayOfYear = function () { return this.ts.dayOfYear(); };
clima.data.STick.prototype.hourOfDay = function () { return this.ts.hourOfDay(); };
clima.data.STick.prototype.monthOfYear = function () { return this.ts.monthOfYear(); };
clima.data.STick.prototype.isIn = function (ts) { return ts.contains(this.ts.mid); };

/*
clima.data.STick.prototype.setTickDomain = function(domain) {
    this.startTick = domain[0];
    this.endTick = domain[1];
    this.midTick = Math.ceil( (domain[1] - domain[0])/2 + domain[0] );
    this.tickDomain = domain;
};
*/
