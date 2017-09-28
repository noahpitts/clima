/* Utility Functions for setting up the controls in the application */

// Namespace for clima available in global frame, name and version meta data
var clima = {
    meta: { name: "clima engine", version: 0.3, build: 28 },
};

// Application setup function. Runs once at the start of the application to assign event listeners to the application controls.
clima.appSetup = function () {
    // DATA STRUCTURE SETUP
    // --------------------------------------------------------------

    // Initialize array to store climate data structures
    clima.climates = [];

    // Load the default climate -- TODO: MAKE THIS A JSON
    // var defaultData =
    clima.climates.push()


    // CONTROL SETUP
    // --------------------------------------------------------------

    // Set the EPW parse function when a new EPW file is loaded
    // TODO - Parser: Edit this function when a new parser is written
    $(document).ready(function () { $("#clima-epw-file-input").change(dY.parser.handleSingleEPWFileUpload); });

    // Assign the EPW File Button to call the EPW file Input
    document.querySelector('#clima-epw-file-button').addEventListener('click', function (e) {
        var fileInput = document.querySelector('#clima-epw-file-input');
        fileInput.click();
    }, false);

}
