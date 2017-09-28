var clima = {
    meta: { name: "climate engine client", version: 0.2, build: 14 },
    button: { heatmap: true, sunpath: false, boxplot: false, tufteplot: false }
};

// MAIN FUNCTION RUN WHEN DATA IS LOADED
function onDataLoaded(dObj) {
    var main = d3.select("#main")

    // remove all content from the page before rebuilding
    main.selectAll("div").remove();

    // Add the Main Title to the Page
    var main_title = main.append("div").attr("id", "main-title");

    // Add the title name
    main_title.append("h3")
        .text(clima.meta.name)
        .attr("class", "title");

    // Add the version
    main_title.append("h6")
        .text("alpha v" + clima.meta.version + " build " + clima.meta.build)
        .attr("class", "title");

    var epw_file_button = main_title.append("button")
        .attr("class", "control-button")
        .attr("id", "epw-file-button")
        .text("Load EPW File");

    // Add the Main Control to the Page
    var main_control = main.append("div").attr("id", "main-control");

    // Add the location name
    main_control.append("h1")
        .text(dObj.location.city + ", " + dObj.location.country) // EPW Metadata
        .attr("class", "climate-title");

    // Add the location lat/lon
    main_control.append("h5")
        .text("Latitude: " + dObj.location.latitude + " | Longitude: " + dObj.location.longitude)
        .attr("class", "latlon-title");

    // // Add the EPW file load button
    // var epw_file_input = main_control.append("input")
    //     .attr("id", "epw-file-input")
    //     .attr("name", "files")
    //     .attr("type", "file");

    // Add a listener for when the file changes
    // TODO: rewrite to remove dependance on jQuery
    // $(document).ready(function () { $("#epw-file-input").change(dY.parser.handleSingleEPWFileUpload); });
    // epw_file_input.onchange = dY.parser.handleSingleEPWFileUpload;

    // document.querySelector('#epw-file-button').addEventListener('click', function (e) {
    //     var fileInput = document.querySelector('#epw-file-input');
    //     fileInput.click();
    // }, false);

    // Add the Main View to the page
    var main_view = main.append("div").attr("id", "main-view");

    // Add div for graph selection buttons
    var graph_control_bar = main_control.append("div")
        .attr("id", "graph-control-bar");

    // Add Heatmap Button
    var heatmap_button = graph_control_bar.append("button")
        .attr("class", "control-button")
        .attr("id", "heatmap-button")
        .text("Heatmap");

    var heatmap_click = function () {
        if (clima.button.heatmap) {
            // Turn it off...
            heatmap_button.attr("class", "control-button");
            main_view.select("#heatmap-view").remove();
            clima.button.heatmap = false;
        } else {
            // Turn it on...
            heatmap_button.attr("class", "control-button active-button");
            var heatmap_view = main_view.append("div").attr("id", "heatmap-view");
            drawHeatmap(dObj, heatmap_view);
            clima.button.heatmap = true;
        }
    }
    $(document).ready(function () { $("#heatmap-button").click(heatmap_click); });

    // Add Sunpath Button
    var sunpath_button = graph_control_bar.append("button")
        .attr("class", "control-button")
        .attr("id", "sunpath-button")
        .text("Sunpath");

    var sunpath_click = function () {
        if (clima.button.sunpath) {
            // Turn it off...
            sunpath_button.attr("class", "control-button");
            main_view.select("#sunpath-view").remove();
            clima.button.sunpath = false;
        } else {
            // Turn it on...
            sunpath_button.attr("class", "control-button active-button");
            var sunpath_view = main_view.append("div").attr("id", "sunpath-view");
            drawSunpath(dObj, sunpath_view);
            clima.button.sunpath = true;
        }
    }
    $(document).ready(function () { $("#sunpath-button").click(sunpath_click); });

    // Add Box-Plot Button
    var boxplot_button = graph_control_bar.append("button")
        .attr("class", "control-button")
        .attr("id", "boxplot-button")
        .text("Box-plot");

    var boxplot_click = function () {
        if (clima.button.boxplot) {
            // Turn it off...
            boxplot_button.attr("class", "control-button");
            main_view.select("#boxplot-view").remove();
            clima.button.boxplot = false;
        } else {
            // Turn it on...
            boxplot_button.attr("class", "control-button active-button");
            var boxplot_view = main_view.append("div").attr("id", "boxplot-view");
            drawBoxplot(dObj, boxplot_view);
            clima.button.boxplot = true;
        }
    }
    $(document).ready(function () { $("#boxplot-button").click(boxplot_click); });

    // Add Tufte-Plot Button
    var tufteplot_button = graph_control_bar.append("button")
        .attr("class", "control-button")
        .attr("id", "tufteplot-button")
        .text("Tufte-Plot");

    var tufteplot_click = function () {
        if (clima.button.tufteplot) {
            // Turn it off...
            tufteplot_button.attr("class", "control-button");
            main_view.select("#tufteplot-view").remove();
            clima.button.tufteplot = false;
        } else {
            // Turn it on...
            tufteplot_button.attr("class", "control-button active-button");
            var tufteplot_view = main_view.append("div").attr("id", "tufteplot-view");
            drawTufteplot(dObj, tufteplot_view);
            clima.button.tufteplot = true;
        }
    }
    $(document).ready(function () { $("#tufteplot-button").click(tufteplot_click); });

    // Set the current button and draw view(s)
    if (clima.button.heatmap) {
        heatmap_button.attr("class", "control-button active-button");
        var heatmap_view = main_view.append("div").attr("id", "heatmap-view");
        drawHeatmap(dObj, heatmap_view);
    }
    if (clima.button.sunpath) {
        sunpath_button.attr("class", "control-button active-button");
        var sunpath_view = main_view.append("div").attr("id", "sunpath-view");
        drawSunpath(dObj, sunpath_view);
    }
    if (clima.button.boxplot) {
        boxplot_button.attr("class", "control-button active-button");
        var boxplot_view = main_view.append("div").attr("id", "boxplot-view");
        drawBoxplot(dObj, boxplot_view);
    }
    if (clima.button.tufteplot) {
        tufteplot_button.attr("class", "control-button active-button");
        var tufteplot_view = main_view.append("div").attr("id", "tufteplot-view");
        drawTufteplot(dObj, tufteplot_view);
    }

}
