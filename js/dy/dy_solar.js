// global namespace
var dY = dY || {};




// dY.solarGeom
// spot checks for Oakland CA verify calculations within a degree with https://www.esrl.noaa.gov/gmd/grad/solcalc/

dY.solarGeom = {};


dY.solarGeom.dailyAtGivenHour = function(loc, hourOfDay){
    var days = [...Array(365).keys()];
    var data = days.map( function(d){ 
        result = dY.solarGeom.solarGeomAtHour(loc,d,hourOfDay); 
        result.dayOfYear = d;
        return result;        
    } );
    
    return {
        location: loc,
        hourOfDay: hourOfDay,
        data: data
    }
}

dY.solarGeom.hourlyAtGivenDay = function(loc, dayOfYear){
    var hrs = [...Array(24).keys()];
    var data = hrs.map( function(h){ return dY.solarGeom.solarGeomAtHour(loc,dayOfYear,h); } );
    
    var swtch = false;
    var sunrise, sunset;
    for (var d in data){
        var sunIsUp = data[d].altitudeDeg > 0.0;
        if (sunIsUp != swtch){
            if (sunIsUp) sunrise = dY.util.remap( [data[d-1].altitudeDeg, data[d].altitudeDeg],[d-1,d],0.0);
            else sunset = dY.util.remap( [data[d-1].altitudeDeg, data[d].altitudeDeg],[d-1,d],0.0);
            swtch = sunIsUp;
        }
    }
    
    return {
        location: loc,
        dayOfYear: dayOfYear,
        data: data,
        sunrise: sunrise,
        sunset: sunset
    }
}

dY.solarGeom.geomNearHourOfYear = function(loc, hourOfYear, resolution){
    if (typeof resolution === "undefined") resolution = 5;
    if (resolution%2==1) resolution += 1;
    
    var hrs = [];
    for (var t=0; t<=1.0; t+=1.0/resolution) hrs.push(hourOfYear-0.5 + t);
    var data = hrs.map( function(d){ 
        var result = dY.solarGeom.solarGeomAtHour(loc,d); 
        result.hourOfYear = d;
        return result;
    } );
    //var sunIsUp = data[Math.floor(data.length / 2)].altitudeDeg >= 0.0;
    var func = function(a,b){ if (b.altitudeDeg >=0.0) {return a + 1} else {return a} }
    var sunUpPercent = data.reduce(func, 0) / data.length;
    return {
        location: loc,
        hourOfYear: hourOfYear,
        data: data,
        sunUpPercent: sunUpPercent
    }
}


dY.solarGeom.vecAtHour = function(loc, argA, argB){
    var sGeom = dY.solarGeom.solarGeomAtHour(loc, argA, argB)
    var x = Math.cos(sGeom.altitudeRad)*Math.sin(sGeom.azimuthRad)
    var y = Math.cos(sGeom.altitudeRad)*Math.cos(sGeom.azimuthRad)
    var z = Math.sin(sGeom.altitudeRad)
    return [x, y, z]
}

dY.solarGeom.degAnglesAtHour = function(loc, argA, argB){
    var sGeom = dY.solarGeom.solarGeomAtHour(loc, argA, argB)
    return {
        altitude: sGeom.altitudeDeg,
        azimuth: sGeom.azimuthDeg
    }
}

dY.solarGeom.radAnglesAtHour = function(loc, argA, argB){
    var sGeom = dY.solarGeom.solarGeomAtHour(loc, argA, argB)
    return {
        altitude: sGeom.altitudeRad,
        azimuth: sGeom.azimuthRad
    }
}

dY.solarGeom.solarGeomAtHour = function(loc, argA, argB){
    /*
    calculates the following solar position angles for given coordinates, integer day of the year (0->365), local time. 
    Altitude
    Azimuth
    Declination
    Hour Angle
    all output in radians
    */
    var dayOfYear = argA;
    var hourOfDay = argB;
    if (typeof argB === "undefined") {
        if (typeof argA === "number") {
            var dayOfYear = Math.floor(argA /24);
            var hourOfDay = argA % 24;
        }
        if (typeof argA === "object") {
            var dayOfYear = argA.dayOfYear();
            var hourOfDay = argA.hourOfDay() + 0.5; // adds a half hour to get solar position at the middle of the tick's hour
        }
    }
    
    var lat =  loc.latitude;
    var lng =  loc.longitude;
    var tmz =  loc.timezone;
    
    var alpha = dY.solarGeom.calcAlpha(dayOfYear, hourOfDay);
    
    //calculate Declination Angle
    var decDeg = 0.396372-22.91327*Math.cos(alpha)+4.02543*Math.sin(alpha)-0.387205*Math.cos(2*alpha)+0.051967*Math.sin(2*alpha)-0.154527*Math.cos(3*alpha)+0.084798*Math.sin(3*alpha);
    var decRad = dY.solarGeom.degToRad(decDeg);
    
    // time correction for solar angle
    var tc = 0.004297+0.107029*Math.cos(alpha)-1.837877*Math.sin(alpha)-0.837378*Math.cos(2*alpha)-2.340475*Math.sin(2*alpha);
    
    // calculate Solar Hour Angle, angle between local longitude and solar noon
    var hAngDeg = (hourOfDay-12-tmz)*(360/24) + lng + tc;
    if (hAngDeg >= 180) hAngDeg = hAngDeg - 360;
    if (hAngDeg <= -180) hAngDeg = hAngDeg + 360;
    var hAngRad = dY.solarGeom.degToRad(hAngDeg) ;
    
    //calc Altitude Angle
    var latRad = dY.solarGeom.degToRad(lat);
    var cosZenith = Math.sin(latRad)*Math.sin(decRad)+Math.cos(latRad)*Math.cos(decRad)*Math.cos(hAngRad);
    if (cosZenith>1) cosZenith = 1;
    if (cosZenith<-1) cosZenith = -1;

    var zenRad = Math.acos(cosZenith)
    var altRad =  Math.asin(cosZenith)
    
    //calc Azimuth angle
    var cosAzi = (Math.sin(decRad)-Math.sin(latRad)*Math.cos(zenRad))/(Math.cos(latRad)*Math.sin(zenRad));
    var aziDeg = dY.solarGeom.radToDeg(Math.acos(cosAzi));
    if (hAngRad > 0) aziDeg = 360-aziDeg;
    var aziRad = dY.solarGeom.degToRad(aziDeg);
    
    return {
        altitudeRad: altRad,
        altitudeDeg: dY.solarGeom.radToDeg(altRad),
        azimuthRad: aziRad,
        azimuthDeg: aziDeg,
        declinationRad: decRad,
        declinationDeg: decDeg,
        hourAngleRad: hAngRad,
        hourAngleDeg: hAngDeg
    }
}

dY.solarGeom.calcAlpha = function(dayOfYear, hourOfDay){
    return dY.solarGeom.degToRad( (360/365.25)*(dayOfYear + hourOfDay/24)  );
}

dY.solarGeom.degToRad = function(degrees){ return degrees * (Math.PI / 180); }
dY.solarGeom.radToDeg = function(radians){ return radians * (180 / Math.PI); }


// lunarGeom based on https://github.com/mourner/suncalc
//

dY.lunarGeom = {};

dY.lunarGeom.hourlyAtGivenDay = function(loc, dayOfYear){
    var hrs = [...Array(24).keys()];
    var data = hrs.map( function(h){ return dY.lunarGeom.lunarGeomAtHour(loc,dayOfYear,h); } );
    
    return {
        location: loc,
        dayOfYear: dayOfYear,
        data: data
    }
}

// general calculations for position

dY.lunarGeom.e = dY.solarGeom.degToRad( 23.4397 ); // obliquity of the Earth

dY.lunarGeom.rightAscension = function(l, b) { return Math.atan2(Math.sin(l) * Math.cos(dY.lunarGeom.e) - Math.tan(b) * Math.sin(dY.lunarGeom.e), Math.cos(l)); }
dY.lunarGeom.declination = function(l, b)    { return Math.asin(Math.sin(b) * Math.cos(dY.lunarGeom.e) + Math.cos(b) * Math.sin(dY.lunarGeom.e) * Math.sin(l)); }

dY.lunarGeom.azimuth = function(H, phi, dec)  { return Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(phi) - Math.tan(dec) * Math.cos(phi)); }
dY.lunarGeom.altitude = function(H, phi, dec) { return Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H)); }

dY.lunarGeom.siderealTime = function(d, lw) { return dY.solarGeom.degToRad( (280.16 + 360.9856235 * d)) - lw; }

dY.lunarGeom.astroRefraction = function(h) {
    if (h < 0) // the following formula works for positive altitudes only.
        h = 0; // if h = -0.08901179 a div/0 would occur.

    // formula 16.4 of "Astronomical Algorithms" 2nd edition by Jean Meeus (Willmann-Bell, Richmond) 1998.
    // 1.02 / tan(h + 10.26 / (h + 5.10)) h in degrees, result in arc minutes -> converted to rad:
    return 0.0002967 / Math.tan(h + 0.00312536 / (h + 0.08901179));
}


// moon calculations, based on http://aa.quae.nl/en/reken/hemelpositie.html formulas

dY.lunarGeom.moonCoords = function(d){ // geocentric ecliptic coordinates of the moon

    var L = dY.solarGeom.degToRad( (218.316 + 13.176396 * d)), // ecliptic longitude
        M = dY.solarGeom.degToRad( (134.963 + 13.064993 * d)), // mean anomaly
        F = dY.solarGeom.degToRad( (93.272 + 13.229350 * d)),  // mean distance

        l  = L + dY.solarGeom.degToRad( 6.289 * Math.sin(M)), // longitude
        b  = dY.solarGeom.degToRad( 5.128 * Math.sin(F)),     // latitude
        dt = 385001 - 20905 * Math.cos(M);  // distance to the moon in km

    return {
        ra: dY.lunarGeom.rightAscension(l, b),
        dec: dY.lunarGeom.declination(l, b),
        dist: dt
    };
}

dY.lunarGeom.lunarGeomAtHour = function (loc, argA, argB) {
    var dayOfYear = argA;
    var hourOfDay = argB;
    if (typeof argB === "undefined") {
        if (typeof argA === "number") {
            var dayOfYear = Math.floor(argA /24);
            var hourOfDay = argA % 24;
        }
        if (typeof argA === "object") {
            var dayOfYear = argA.dayOfYear();
            var hourOfDay = argA.hourOfDay() + 0.5; // adds a half hour to get solar position at the middle of the tick's hour
        }
    }
    var date = dY.dt.hourOfYearToDate(dayOfYear * 24 + hourOfDay);
    
    var lat =  loc.latitude;
    var lng =  loc.longitude;

    // date/time constants and conversions

    var dayMs = 1000 * 60 * 60 * 24,
        J1970 = 2440588,
        J2000 = 2451545;

    function toJulian(date) { return date.valueOf() / dayMs - 0.5 + J1970; }
    function fromJulian(j)  { return new Date((j + 0.5 - J1970) * dayMs); }
    function toDays(date)   { return toJulian(date) - J2000; }

    var lw  = dY.solarGeom.degToRad(-lng),
        phi = dY.solarGeom.degToRad( lat ),
        d   = toDays(date),

        c = dY.lunarGeom.moonCoords(d),
        H = dY.lunarGeom.siderealTime(d, lw) - c.ra,
        h = dY.lunarGeom.altitude(H, phi, c.dec),
        // formula 14.1 of "Astronomical Algorithms" 2nd edition by Jean Meeus (Willmann-Bell, Richmond) 1998.
        pa = Math.atan2(Math.sin(H), Math.tan(phi) * Math.cos(c.dec) - Math.sin(c.dec) * Math.cos(H));

    var h = h + dY.lunarGeom.astroRefraction(h); // altitude correction for refraction
    
    var aziRad = dY.lunarGeom.azimuth(H, phi, c.dec);
    var altRad = h;
    
    return {
        azimuthRad: aziRad,
        altitudeRad: altRad,
        azimuthDeg: dY.solarGeom.radToDeg(aziRad),
        altitudeDeg: dY.solarGeom.radToDeg(altRad),        
        distance: c.dist,
        parallacticAngleRad: pa
    };
};




