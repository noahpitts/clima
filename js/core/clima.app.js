// Global Namespace
var clima = clima || {};

// --------------------
// DATA STRUCTURE SETUP
// --------------------

// Clima application meta data - TODO: dev python script to build and minify
clima.metaData = { name: "clima engine", version: 0.3, build: 2 };

// Initialize array to store climate data structures
clima.climates = clima.climates || [];
clima.currentClimate = clima.currentClimate || false;
clima.defaultClimate = clima.currentClimate;

// Temp object to store climate data structure - TODO: rewrite parser and data structure
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


// --------------------------------------------------------------
// MAIN FUNCTIONS
// --------------------------------------------------------------


// MAIN FUNCTION RUN WHEN DEFAULT DATA IS LOADED
function onDataLoaded(dObj) {

    clima.main.element = d3.select("#main");
    clima.editor = new Editor();

}
