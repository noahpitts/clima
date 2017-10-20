// Global Namespace
var clima = clima || {};

// Clima Viewport array and ID counter
clima.viewports = clima.viewports || [];
clima.viewportIdCounter = clima.viewIdCounter || 0;

// Misc CLima params
clima.currentClimate = clima.currentClimate || false;
clima.defaultClimate = clima.currentClimate;

// Viewport Class
class Viewport {

    // Viewport constructor
    constructor(parent, id, data, chart) {
        // Store link to Parent HTML element
        this.parent = parent;

        // Store Viewport ID
        this.id = id

        // Create this HTML element
        this.element = parent.append("div")
            .attr("class", "container")
            .attr("id", "viewport_" + viewId);

        // Store link to viewport climate data
        if (data) {
            this.data = data;
        } else {
            this.data = clima.defaultClimate;
        }

    }

    // Draws the viewport graphics TODO: DEV
    draw() {
        // Check that viewport data is still present otherwise
        if (!this.data) this.data = clima.defaultClimate;

    }

    // Removes the host element from the parent TODO: TEST
    remove() {
        this.parent.remove(this.element);
    }

    // Transfers variable state of vp1 to vp2; TODO: DEV
    static sync(vp1, vp2) {

    }

    // Draws all viewports passed into static function TODO: TEST
    static drawAll(viewports) {
        for (var vp in viewports) {
            if (vp instanceof Viewport) {
                vp.draw();
            }
        }
    }

    // End Viewport
}

