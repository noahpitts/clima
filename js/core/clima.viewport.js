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

// Viewport Class
class Viewport {

    // Viewport constructor
    constructor(parent, data) {
        // Store link to Parent HTML element
        this.parent = parent;

        // Store Viewport ID
        this.id = clima.viewport.idCounter++;

        // Create this HTML element
        this.element = parent.append("div")
            .attr("class", "container viewport")
            .attr("id", "viewport_" + this.id)
            .on("click", this.select);

        // Add Viewport Control Bar
        this.controlBar = this.element.append("div")
            .attr("class", "container viewport-control-bar");

        // Store link to viewport climate data
        if (data) {
            this.data = data;
        } else {
            this.data = clima.currentClimate;
        }

        this.chart = clima.defaultChart.create(this.data);
    }

    // Draws the Viewport Graphics
    drawChart() {
        // Remove all existing elements in the viewport
        this.element.selectAll("svg").remove();

        // Draw the chart to the viewport
        this.chart.drawChart(this.element);
    }

    drawControlBar() {
        // Add Edit Chart Button to the Viewport Control Bar
        this.editViewportButton = this.controlBar.append("button")
            .attr("type", "button")
            .attr("id", "edit-viewport_" + this.id)
            .attr("class", "btn btn-outline-primary btn-sm viewport-control-button")
            .attr("data-toggle", "modal")
            .attr("data-target", "#displayEditorModal")
            .text("Edit Chart")
            .on("click", this.edit);

        // Add Export Chart Button to the Viewport Control Bar
        this.exportViewportButton = this.controlBar.append("button")
            .attr("id", "export-viewport_" + this.id)
            .attr("type", "button")
            .attr("class", "btn btn-outline-primary btn-sm viewport-control-button")
            .text("Export Chart")
            .on("click", this.export);

        // Add Remove Chart Button to the Viewport Control Bar
        this.removeViewportButton = this.controlBar.append("button")
            .attr("id", "remove-viewport_" + this.id)
            .attr("type", "button")
            .attr("class", "btn btn-outline-primary btn-sm viewport-control-button")
            .text("Delete Chart")
            .on("click", this.remove);
    }

    removeControlButtons() {
        this.controlBar.selectAll("button").remove();
    }

    // Edit the Viewport : TODO
    edit() {
        clima.editor.open(this);
    }

    // Export the Viewport : TODO
    export() {
        // TODO
        alert("TODO: Export Viewport")
    }

    // Remove the Viewport : TODO
    remove() {
        // TODO
        this.parent.select("#vp_" + this.id).remove();
        alert("TODO: Remove Viewport");
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
        this.removeControlButtons();
        this.element.classed("viewport-select", false);
        clima.viewport.selection = false;
    }

    // TESTING BELOW HERE
    // ---------------------------------------------


    static add() {
        // // Remove any viewport selections
        // clima.selectViewport(false);

        // // Create a new Viewport
        // newViewport = new Viewport(parent, clima.currentClimate);
        // // Add to global viewport list
        // clima.viewports.push(newViewport);

        // // Open Editor
        // clima.editor.open(newViewport);
        clima.editor.open(false);

    }

    // End Viewport Class
}

// ------------------------------------
// EDITOR
// ------------------------------------


// Viewport Editor class
class Editor {

    constructor() {
        clima.chart.default = clima.chart.heatmap

        this.title = d3.select("#editor-title");
        this.editorViewport = d3.select("#editor-viewport");
        this.controlport = d3.select("#editor-controlport");
        this.chart = clima.chart.default.create;
        this.viewport = false;
    }

    // Sets up editing session : TEST
    open(viewport) {
        // If Editing an exiting viewport
        if (viewport) {
            // Use global default chart
            this.chart = clima.chart.default.create
        }
        // Otherwise inherit from viewport
        else {
            this.chart = viewport.chart;
        }
        // Set viewport pointer to either passed in viewport or false flag
        this.viewport = viewport;
        // Draw the Editor Controls (Climate Select, Chart Select)
        this.drawControls();
        // Draw the Chart
        this.chart.drawChart(this.editorViewport);
    }

    // Draws The Editor Controls : TODO
    drawControls() {
        // Remove all existing elements in the control port
        this.controlport.selectAll("div").remove();

        var controls = this.controlport.append("div")
            .attr("class", "container controls")
            .append("div")
            .attr("class", "row");

        // ---------------
        // Data Selection
        // ---------------
        var dataSelect = controls.append("div")
            .attr("class", "col-sm-7")
            .append("select")
            .attr("class", " container custom-select")
            .attr("id", "data-select");

        // Add Climate Options
        for (var i = 0; i < clima.climates.length; i++) {
            var climate = clima.climates[i];
            var option = dataSelect.append("option")
                .attr("value", i)
                .text(climate.location.city + " | " + climate.location.country);

            // Select the correct initial viewport option
            if (this.chart.data === climate) {
                option.attr("selected", "selected");
            }
        }
        // Add Event Listener
        $(document).ready(function () {
            $("#data-select").change(function (evt) {
                var st = evt.target.options[evt.target.options.selectedIndex];
                var sv = st.value;

                // Update viewport data
                this.chart.data = clima.climates[Number.parseInt(sv)];
                // Draw new chart
                this.update();
            });
        });

        // ---------------
        // Chart Selection
        // ---------------
        var chartSelect = controls.append("div")
            .attr("class", "col-sm-5")
            .append("select")
            .attr("class", " container custom-select")
            .attr("id", "chart-select");
        // Add Chart Options
        for (var i = 0; i < clima.charts.length; i++) {
            var chart = clima.charts[i];
            var option = chartSelect.append("option")
                .attr("value", i)
                .text(chart.name);

            // Select the correct initial viewport option
            if (clima.editor.viewport.chart.name === chart.name) {
                option.attr("selected", "selected");
            }
        }
        // Add Event Listener
        $(document).ready(function () {
            $("#chart-select").change(function (evt) {
                var st = evt.target.options[evt.target.options.selectedIndex];
                var sv = st.value;

                var newChart = clima.charts[Number.parseInt(sv)];
                clima.editor.viewport.chart = newChart.create(clima.editor.viewport.data);
                clima.editor.viewport.drawChart();
            });
        });

        // Call Chart Class Controls
        this.drawChart();
    }

    // Updates the editor graphic : TEST
    updateChart() {
        this.chart.drawChart(this.editorViewport);
    }

    // Apply the Editor changes to this viewport : TODO
    apply() {
        // If adding a new Viewport
        if (!this.viewport) {
            // Create new viewport object
            this.viewport = new Viewport(clima.main.element, this.chart.data);
            clima.viewports.push(this.viewport);

        }






        this.viewport.chart = this.chart;
    }
    // End Editor Class
}





// Clima.Editor Global : TODO - ADD TO MAIN APP SETUP
$(document).ready(function () {
    clima.editor = new Editor();
});

