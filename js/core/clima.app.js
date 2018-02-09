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
clima.testChart = 0;
clima.testViewport = 0;



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

// set current viewport selection
// clima.selectViewport = function (vp) {
//     // If viewport is already selected, then deselect it
//     if (clima.viewport.selection && vp === clima.viewport.selection) {
//         clima.viewport.selection.removeControlButtons();
//         clima.viewport.selection = false;
//         d3.selectAll(".viewport").classed("viewport-select", false);
//     }
//     // Otherwise select it
//     else if (vp) {
//         if (clima.viewport.selection) {
//             clima.viewport.selection.removeControlButtons();
//         }

//         clima.viewport.selection = vp;
//         clima.viewport.selection.drawControlButtons();
//         // TODO: Add CSS changes here
//         d3.selectAll(".viewport").classed("viewport-select", false);
//         if (vp) {
//             clima.viewport.selection.element.classed("viewport-select", true);
//         }
//     }
// }

// Opens Viewports editor for adding new Viewport
// clima.addViewport = function () {
//     clima.selectViewport(false);
//     clima.editor.viewport.drawEditorControls();
// }

// Opens Viewports editor for editing exisiting Viewport
// clima.editViewport = function () {
//     Viewport.sync(clima.viewport.selection, clima.editor.viewport);
//     clima.editor.viewport.drawEditorControls();
// }

// Syncs Editor viewport with main Viewport
clima.applyViewport = function () {
    // If adding a new Viewport
    if (!clima.viewport.selection) {
        // Create new viewport object
        var vp = new Viewport(clima.main.element, false);
        vp.element.on("click", function () {
            clima.selectViewport(vp);
        });

        // Push to Viewport stack
        clima.main.viewports.push(vp);

        // Set new viewport as current selection
        clima.selectViewport(vp);
    }

    //Sync Editor Viewport to Selected viewport
    Viewport.sync(clima.editor.viewport, clima.viewport.selection);
    clima.viewport.selection.drawChart();
}


// MAIN FUNCTION RUN WHEN DEFAULT DATA IS LOADED
function onDataLoaded(dObj) {

    // clima.main.element = d3.select("#main");

    // clima.editor.titleElement = d3.select("#editor-title");
    // clima.editor.viewport = d3.select("#editor-viewport");
    // clima.editor.controlportElement = d3.select("#editor-controlport");


    // // ???
    // clima.editor.viewport = new Viewport(clima.editor.viewportElement, clima.currentClimate)
    // clima.editor.viewport.element.classed("viewport", false);

}
