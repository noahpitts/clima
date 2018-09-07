// Global Namespace
var clima = clima || {};

// Clima Viewport array and ID counter
clima.viewport = clima.viewport || {};
clima.viewport.idCounter = clima.viewport.idCounter || 0;

// Misc CLima params
clima.currentClimate = clima.currentClimate || false;
clima.defaultClimate = clima.currentClimate;

clima.chart = clima.chart || {};

clima.viewports = clima.viewports || [];

clima.charts = clima.charts || [];
clima.defaultChart = clima.charts[0];

// ------------------------------------
// VIEWPORT
// ------------------------------------
class Viewport {

    // Viewport constructor
    constructor(parent) {
        // Store link to Parent HTML element
        this.parent = parent;

        // Store Viewport ID
        this.id = clima.viewport.idCounter++;

        // Create this HTML element
        this.element = parent.append("div")
            .attr("class", "container viewport")
            .attr("id", "viewport_" + this.id);
        // .on("click", Viewport.selectVP(this));

        // Add Viewport Control Bar
        this.controlBar = this.element.append("div")
            .attr("class", "container viewport-control-bar");

        // Store reference to viewport climate data and chart
        // this.chart = chart;
        // this.data = chart.data;
    }

    // Updates the Viewport Graphics
    update() {
        // Draw the chart to the viewport
        this.chart.drawChart(this.element);
    }

    // Draws the control bar in the viewport
    drawControlBar() {
        // Add Edit Chart Button to the Viewport Control Bar
        this.editViewportIcon = this.controlBar.append("span")
            .attr("class", "icon-span")
            .attr("data-toggle", "tooltip")
            .attr("data-placement", "top")
            .attr("title", "Edit Chart")
            .attr("id", "edit-icon")
            .append("i")
            .attr("class", "fas fa-edit icon")
            .attr("data-toggle", "modal")
            .attr("data-target", "#displayEditorModal")
            .on("click", this.edit);

        // Add Export SVG Button to the Viewport Control Bar
        this.exportViewportIcon = this.controlBar.append("span")
            .attr("class", "icon-span")
            .attr("data-toggle", "tooltip")
            .attr("data-placement", "top")
            .attr("title", "Download Chart")
            .attr("id", "download-icon")
            .append("i")
            .attr("class", "fas fa-download icon")
            .on("click", this.exportSVG);

        // Add Export PNG Button to the Viewport Control Bar
        // TODO

        // Add Remove Chart Button to the Viewport Control Bar
        this.removeViewportIcon = this.controlBar.append("span")
            .attr("class", "icon-span")
            .attr("data-toggle", "tooltip")
            .attr("data-placement", "top")
            .attr("title", "Delete Chart")
            .attr("id", "trash-icon")
            .append("i")
            .attr("class", "fas fa-trash icon")
            .on("click", this.remove);

        $(function () {
            $('[data-toggle="tooltip"]').tooltip({delay: { "show": 2000, "hide": 100 }})
        });
    }

    // Removes the control bar in the viewport
    removeControlBar() {
        $(function () {
            $('[data-toggle="tooltip"]').tooltip('hide');
        });
        this.controlBar.selectAll("span").remove();
    }

    // Edit the Viewport
    edit() {
        $('#edit-icon').tooltip('hide');
        clima.editor.open(clima.viewport.selection);
    }

    // Export Viewport as SVG
    exportSVG() {
        $('#download-icon').tooltip('hide');
        // Get The svg node()
        var node = clima.viewport.selection.element.select("svg").node();
        // Serialize the Node in to an xml string
        var svgxml = (new XMLSerializer()).serializeToString(node);

        // Create filename string
        var filename = "clima_viewport_" + clima.viewport.selection.id + ".svg"

        // if ($.browser.webkit) {
        //     svgxml = svgxml.replace(/ xlink:xlink/g, ' xmlns:xlink');
        //     svgxml = svgxml.replace(/ href/g, 'xlink:href');
        // }

        // Store string as a data Blob
        var data = new Blob([svgxml], { type: 'text/plain' });

        // Create a file url from the Blob
        var url = window.URL.createObjectURL(data);

        // Create an anchor element
        var a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.style.visibility = "hidden";

        // Add anchor to the page
        document.body.appendChild(a);
        // Click on the anchor
        a.click();

        // Clean Up
        setTimeout(function () {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 0);
    }

    // Export Viewport as PNG : TODO
    exportPNG() {
        alert("TODO: develop PNG downloader class");
    }

    // Export Viewport as CSV : TODO
    exportCSV() {
        alert("TODO: develop CSV downloader class");
    }

    // Remove the Viewport
    remove() {
        $('#trash-icon').tooltip('hide');
        // Remove DOM element
        clima.viewport.selection.element.remove();

        // Remove viewport object from global list
        for (var i = 0; i < clima.viewports.length; i++) {
            if (clima.viewports[i] === clima.viewport.selection) {
                clima.viewports.splice(i, 1);
            }
        }

    }

    // Select this Viewport
    select() {
        // If this viewport is already selected, then deselect it
        if (this === clima.viewport.selection) {
            this.deselect();
        }

        // Otherwise select this viewport
        else {
            // If another Viewport is selected, than deselect it first
            if (clima.viewport.selection) {
                clima.viewport.selection.deselect();
            }

            // Draw the control Bar
            this.drawControlBar();

            // Update CSS for this Viewport
            this.element.classed("viewport-select", true);

            // Set global viewport section pointer to this
            clima.viewport.selection = this;
        }
    }

    // Deselect this Viewport
    deselect() {
        this.removeControlBar();
        this.element.classed("viewport-select", false);
        clima.viewport.selection = false;
    }

    // Add a new viewport
    static add() {
        // Open Editor - false for existing viewport
        clima.editor.open(false);
    }

    // End Viewport Class
}

// ------------------------------------
// EDITOR
// ------------------------------------
class Editor {

    constructor() {
        clima.chart.default = clima.chart.heatmap

        this.title = d3.select("#editor-title");
        this.editorViewport = d3.select("#editor-viewport");
        this.controlport = d3.select("#editor-controlport");
        this.data = clima.defaultClimate;
        this.chart = clima.defaultChart.create(this.data);
        this.viewport = false;
    }

    // Sets up editing session
    open(viewport) {
        // If Editing an exiting viewport
        if (!viewport) {
            // Use global default chart
            this.data = clima.currentClimate;
            this.chart = clima.defaultChart.create(this.data);
        }
        // Otherwise inherit from viewport
        else {
            this.data = viewport.data;
            this.chart = viewport.chart;
        }
        // Set viewport pointer to either passed in viewport or false flag
        this.viewport = viewport;
        // Draw the Editor Controls (Data Selection, Chart Selection)
        this.drawControls();
        // Draw the Chart
        this.chart.drawChart(this.editorViewport);
    }

    // Draws The Editor Controls
    drawControls() {
        // Remove all existing elements in the control port
        this.controlport.selectAll("div").remove();

        var controls = this.controlport.append("div")
            .attr("class", "container controls")
            .append("div")
            .attr("class", "row");

        // TEST: Make sure that we can clear the chart controls when a new chart is selected
        this.chartControls = this.controlport.append("div")
            .attr("class", "container");

        var dataSelectControlBox = controls.append("div")
            .attr("class", "col-sm-6")
        
        var chartSelectControlBox = controls.append("div")
            .attr("class", "col-sm-6")

        // ---------------
        // Data Selection
        // ---------------
        dataSelectControlBox.append("div")
        .attr("class", "row")
        .append("h5")
        .attr("class", "container")
        .text("Climate Data");

        var dataSelect = dataSelectControlBox.append("select")
            .attr("class", "container custom-select")
            .attr("id", "data-select");

        // Add Climate Options
        for (var i = 0; i < clima.climates.length; i++) {
            var climate = clima.climates[i];
            var option = dataSelect.append("option")
                .attr("value", i)
                .text(climate.location.city + " | " + climate.location.country);

            // Select the correct initial viewport option
            if (this.data === climate) {
                option.attr("selected", "selected");
            }
        }
        // Add Event Listener
        $(document).ready(function () {
            $("#data-select").change(function (evt) {
                var st = evt.target.options[evt.target.options.selectedIndex];
                var sv = st.value;

                // Update editor data
                clima.editor.data = clima.climates[Number.parseInt(sv)];
                clima.editor.chart.data = clima.editor.data;

                // Set global current climate
                climate.currentClimate = clima.editor.data;
                // Draw new chart
                clima.editor.update();
                clima.editor.chart.drawControls(clima.editor.chartControls);
            });
        });

        // ---------------
        // Chart Selection
        // ---------------
        chartSelectControlBox.append("div")
        .attr("class", "row")
        .append("h5")
        .attr("class", "container")
        .text("Chart Type");

        var chartSelect = chartSelectControlBox.append("select")
            .attr("class", " container custom-select")
            .attr("id", "chart-select");
        // Add Chart Options
        for (var i = 0; i < clima.charts.length; i++) {
            var chart = clima.charts[i];
            var option = chartSelect.append("option")
                .attr("value", i)
                .text(chart.name);

            // Select the correct initial viewport option
            if (this.chart.name === chart.name) {
                option.attr("selected", "selected");
            }
        }
        // Add Event Listener
        $(document).ready(function () {
            $("#chart-select").change(function (evt) {
                var st = evt.target.options[evt.target.options.selectedIndex];
                var sv = st.value;

                var newChart = clima.charts[Number.parseInt(sv)];
                clima.editor.chart = newChart.create(clima.editor.data);
                clima.editor.chart.drawChart(clima.editor.editorViewport);
                clima.editor.update();

                clima.editor.chart.drawControls(clima.editor.chartControls);
            });
        });

        // TODO: SET UP CHART DRAW CONTROLS


        this.chart.drawControls(clima.editor.chartControls);
    }

    // Updates the editor graphic
    update() {
        this.chart.drawChart(this.editorViewport);
    }

    // Apply the Editor changes to this viewport
    apply() {
        // If adding a new Viewport
        if (!clima.editor.viewport) {
            // Create new viewport object
            var newViewport = new Viewport(clima.main.element);
            newViewport.element
                .on("click", function () {
                    newViewport.select();
                });
            clima.viewports.push(newViewport);
            clima.editor.viewport = newViewport;
        }

        // Sync viewport climate and data members
        clima.editor.viewport.chart = clima.editor.chart;
        clima.editor.viewport.data = clima.editor.data;

        // Update the viewport graphic
        clima.editor.viewport.update();
    }

    // End Editor Class
}
