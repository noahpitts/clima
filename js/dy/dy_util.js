// global namespace
var dY = dY || {};




// dY.Util
//

dY.util = {};
dY.util.loadCSS = function (path){
    dY.report("dy: attempting to load CSS file "+path);
    
    var file = location.pathname.split( "/" ).pop();
    
    var link = document.createElement( "link" );
    link.href = path;
    link.type = "text/css";
    link.rel = "stylesheet";
    link.media = "screen,print";

    document.getElementsByTagName( "head" )[0].appendChild( link );
}

dY.util.pad = function(n) {
    return (n < 10) ? ("0" + n) : n;
}

dY.util.remap = function(src, tar, srcVal) {
    var t = (srcVal - src[0]) / (src[1] - src[0]);
    return (tar[1] - tar[0]) * t + tar[0];
}



// given an array of objects and a key that is expected to return an integer, bins the objects by those that share sequential values
// note that given array is expected to be sorted already
dY.util.splitAtDiscontinuousHours = function(arr, key){
    var bins = [];
    var bin = [arr[0]];
    var idx = arr[0][key];
    for (var n=1; n<arr.length; n++){
        if (arr[n][key] != idx+1){
            bin.domain = [bin[0][key], bin[bin.length-1][key] ];
            bins.push(bin);
            bin = [arr[n]];
        } else { 
            bin.push(arr[n]);
        }
        idx = arr[n][key];
    }
    bin.domain = [bin[0][key], bin[bin.length-1][key] ];
    bins.push(bin);
    return bins;
} 

dY.util.summarizeTicks = function(schema, ticks){
    var summarySchema = {}
    var alls = []; // summary data by zonekey for calculating ranges for schema
    for (var zon in schema) {
        summarySchema[zon] = {}
        for (var key in schema[zon]) {
            summarySchema[zon][key] = {}
            alls[[zon,key]] = [];
        }
    }
    for (var t in ticks) {
        for (var zon in schema) {
            for (var key in schema[zon]) {
                alls[[zon,key]].push(ticks[t].data[zon][key]);
            }
        }
    };
        
    for (var zon in schema) {
        for (var key in schema[zon]) {
            var allsorted = alls[[zon,key]].sort(function(a,b){return a-b});
            var len = allsorted.length;
            summarySchema[zon][key].min = allsorted[0];
            summarySchema[zon][key].q1 = allsorted[Math.floor(len*.25) - 1];
            summarySchema[zon][key].q2 = allsorted[Math.floor(len*.50) - 1];
            summarySchema[zon][key].q3 = allsorted[Math.floor(len*.75) - 1];
            summarySchema[zon][key].max = allsorted[len-1];
                        
            summarySchema[zon][key].domain = [summarySchema[zon][key].min, summarySchema[zon][key].max];
            summarySchema[zon][key].median = summarySchema[zon][key].q2;
            
            var sum = 0;
            for( var i = 0; i < allsorted.length; i++ ){  sum += allsorted[i]; }
            summarySchema[zon][key].average = sum/len;
        }
    }
    
    return summarySchema;
}


