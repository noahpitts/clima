// Global Namespace
var clima = clima || {};

// --------------------
// DATA STRUCTURE SETUP
// --------------------

// Clima application meta data
clima.metaData = { name: "clima engine", version: 0.3, build: 28 };

// Initialize array to store climate data structures
clima.climates = clima.climates || [];
clima.currentClimate = clima.currentClimate || false;
clima.defaultClimate = clima.currentClimate;

// Temp object to store climate data structure
// TODO: rewrite parser and data structure
clima.utils.loader.loadInitial(oaklandCa);

// Clima.Main
clima.main = clima.main || {};
clima.main.viewports = clima.viewports || [];


// Clima.Viewport
clima.viewport = clima.viewport || {};
clima.viewport.idCounter = clima.viewIdCounter || 0;
clima.viewport.selection = false;

// Clima.Editor
clima.editor = clima.editor || {};
// clima.editor.titleElement = d3.select("#editor-title");
// clima.editor.viewportElement = d3.select("#editor-viewport");
// clima.editor.controlportElement = d3.select("#editor-controlport");


// clima.editor.viewport = new Viewport(clima.editor.viewportElement, clima.currentClimate)




// --------------------------------------------------------------
// CONTROL SETUP
// --------------------------------------------------------------


// $(document).ready(function () {
//     $("#edit-display-button").click(function () {
//         var editorView = d3.select("#editor-viewport")
//             .append("div")
//             .attr("class", "container")
//             .attr("id", "heatmap-view" + idcounter++);

//         drawHeatmap(clima.currentClimate, editorView, 700);
//     });
// });


// --------------------------------------------------------------
// MAIN FUNCTIONS
// --------------------------------------------------------------

// TODO: Clear all ViewPorts from the main Container
clima.clearAllViewports = function () {
}

// set current viewport selection
clima.selectViewport = function (vp) {
    clima.viewport.selection = vp;
    // TODO: Add CSS changes here
}

// Opens Viewports editor for adding new Viewport
clima.addViewport = function () {
    clima.selectViewport(false);
    clima.editor.viewport.drawEditorControls();

}

// Syncs Editor viewport with main Viewport
clima.applyViewport = function () {
    // If adding a new Viewport
    if (!clima.viewport.selection) {
        // Create new viewport object
        var vp = new Viewport(clima.main.element, false);
        // Push to Viewport stack
        clima.main.viewports.push(vp);
        // Set new viewport as current selection
        clima.selectViewport(vp);
    }

    //SYnc Editor Viewport to Selected viewport
    Viewport.sync(clima.editor.viewport, clima.viewport.selection);

    clima.viewport.selection.drawChart();
}


// MAIN FUNCTION RUN WHEN DEFAULT DATA IS LOADED
function onDataLoaded(dObj) {
    // var main = d3.select("#main")

    // remove all content from the page before rebuilding
    // main.selectAll("div").remove();

    // Add the Main View to the page
    // var main_view = main.append("div")
    // .attr("id", "main-view");
    clima.main.element = d3.select("#main");
    clima.editor.titleElement = d3.select("#editor-title");
    clima.editor.viewportElement = d3.select("#editor-viewport");
    clima.editor.controlportElement = d3.select("#editor-controlport");
    clima.editor.viewport = new Viewport(clima.editor.viewportElement, clima.currentClimate)

    console.log("here");
    //initialSetup();
    // var heatmap_view = main_view.append("div")
    // .attr("id", "heatmap-view");
    //var heatmapView = d3.select("#heatmap-view");
    //drawHeatmap(dObj, heatmapView);

}
