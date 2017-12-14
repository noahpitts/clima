// Global Namespace
var clima = clima || {};

// Clima Viewport array and ID counter
clima.viewport = clima.viewport || {};
clima.viewport.idCounter = clima.viewport.idCounter || 0;

// Misc CLima params
clima.currentClimate = clima.currentClimate || false;
clima.defaultClimate = clima.currentClimate;

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
            .attr("id", "vp_" + this.id);

        // Store link to viewport climate data
        if (data) {
            this.data = data;
        } else {
            this.data = clima.currentClimate;
        }

        // CONSIDER ADDING SVG INNER HTML DIRECTLY HERE TO OPTIMIZE
    }

    // Draws the Viewport Graphics
    drawChart() {
        // Remove all existing elements in the viewport
        this.element.selectAll("svg").remove();

        // Check that viewport data is still present otherwise
        if (!this.data) this.data = clima.currentClimate;

        var w = this.element.node().getBoundingClientRect().width
        // console.log("this is the width: " + w);
        // drawHeatmap(this.data, this.element);
    }

    // Draws The Editor Controls
    drawEditorControls() {
        // Remove all existing elements in the control port
        clima.editor.controlportElement.selectAll("div").remove();

        var controls = clima.editor.controlportElement.append("div")
            .attr("class", "container controls")
            .append("div")
            .attr("class", "row");

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
            dataSelect.append("option")
                .attr("value", i)
                .text(climate.location.city + " | " + climate.location.country);
        }

        // Add Event Listener
        $(document).ready(function () {
            $("#data-select").change(function (evt) {
                var st = evt.target.options[evt.target.options.selectedIndex];
                var sv = st.value;
                clima.editor.viewport.data = clima.climates[Number.parseInt(sv)];
                clima.editor.viewport.drawChart();
                //dropDownValue = selectedValue;
                //onDataLoaded(current_dObj);
            });
        });

        // Chart Selection
        var chartSelect = controls.append("div")
            .attr("class", "col-sm-5")
            .append("select")
            .attr("class", " container custom-select")
            .attr("id", "chart-select");

        // Call Chart Class Controls
        this.drawChart();
    }

    // Clears all drawn elements from this viewport
    clear() {
        this.element.removeAll();
    }

    // Removes this element from the parent TODO: TEST
    remove() {
        this.parent.remove(this.element);
    }

    // Transfers variable state of vpFrom to vpTo; TODO: DEV
    static sync(vpFrom, vpTo) {
        vpTo.id = vpFrom.id;
        vpTo.data = vpFrom.data;
    }

    // Draws all viewports passed into static function TODO: TEST
    static drawAll(viewports) {
        for (var vp in viewports) {
            if (vp instanceof Viewport) {
                vp.draw();
            }
        }
    }

    // End Viewport Class
}

