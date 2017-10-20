// Global Namespace
var clima = clima || {};

// Clima application meta data
clima.metaData = { name: "clima engine", version: 0.3, build: 28 };

// --------------------
// DATA STRUCTURE SETUP
// --------------------

// Initialize array to store climate data structures
clima.climates = clima.climates || [];
clima.currentClimate = clima.currentClimate || false;

// Clima Viewport array and ID counter
clima.viewports = clima.viewports || [];
clima.viewportIdCounter = clima.viewIdCounter || 0;

clima.mainContainer = d3.select("#main");

// Temp object to store climate data structure
// TODO: rewrite parser and data structure
clima.utils.loader.loadInitial(oaklandCa);


// --------------------------------------------------------------
// CONTROL SETUP
// --------------------------------------------------------------

// Assign the EPW File Button to call the EPW file Input
$(document).ready(function () {
    $("#clima-epw-file-input").change(clima.utils.loader.loadEPW);
});
$(document).ready(function () {
    $("#clima-epw-file-button").click(function () {
        $("#clima-epw-file-input").click();
    });
});

// Assign new viewport button
$(document).ready(function () {
    $("#add-viewport-button").click(function () {
        var newView = d3.select("#main")
            .append("div")
            .attr("class", "container")
            .attr("id", "heatmap-view" + idcounter++);

        drawHeatmap(clima.currentClimate, newView);
    });
});


$(document).ready(function () {
    $("#edit-display-button").click(function () {
        var editorView = d3.select("#editor-viewport")
            .append("div")
            .attr("class", "container")
            .attr("id", "heatmap-view" + idcounter++);

        drawHeatmap(clima.currentClimate, editorView, 700);
    });
});


// --------------------------------------------------------------
// APP FUNCTIONS
// --------------------------------------------------------------

clima.clearAllViewports = function () {
    clima.mainContainer.selectAll
}

clima.addViewport = function () {
    var viewportId = clima.viewportIdCounter++;

    var viewport = new Viewport(clima.mainContainer, viewportId)

}

clima.initialSetup = function () {
    d3.select("#main")
        .append("div")
        .attr("class", "container")
        .attr("id", "viewport_" + viewId)
}

// MAIN FUNCTION RUN WHEN DEFAULT DATA IS LOADED
function onDataLoaded(dObj) {
    // var main = d3.select("#main")

    // remove all content from the page before rebuilding
    // main.selectAll("div").remove();

    // Add the Main View to the page
    // var main_view = main.append("div")
    // .attr("id", "main-view");


    initialSetup();
    // var heatmap_view = main_view.append("div")
    // .attr("id", "heatmap-view");
    var heatmapView = d3.select("#heatmap-view");
    drawHeatmap(dObj, heatmapView);

}
