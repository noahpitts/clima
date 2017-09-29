// global namespace
var dY = dY || {};
dY.graph = {};



dY.graph.addBoard = function(selector, boardDims){
    dY.report("dy: adding an SVG to the document inside "+selector);
    
    if (!boardDims.hasOwnProperty("margin")) boardDims.margin = 10; // default margin
    if (typeof(boardDims.margin)=="number") boardDims.margin = {top: boardDims.margin, right: boardDims.margin, bottom: boardDims.margin, left: boardDims.margin};
    
    
    if (!boardDims.hasOwnProperty("width") || !boardDims.hasOwnProperty("height")){
        if (!boardDims.hasOwnProperty("inWidth") || !boardDims.hasOwnProperty("inHeight")){
            console.log("dY.graph.addBoard requires a defined width and height or a defined inWidth and inHeight");
            return false;
        }
        boardDims.width = boardDims.inWidth + boardDims.margin.left + boardDims.margin.right
        boardDims.height = boardDims.inHeight + boardDims.margin.top + boardDims.margin.bottom
    } else {
        boardDims.inWidth = boardDims.width - boardDims.margin.left - boardDims.margin.right
        boardDims.inHeight = boardDims.height - boardDims.margin.top - boardDims.margin.bottom
    }
    boardDims.range = [boardDims.width,boardDims.height]
    
    drawDims = {
        width: boardDims.inWidth,
        height: boardDims.inHeight,
        xRange: [0,boardDims.inWidth],
        yRange: [0,boardDims.inHeight],
        range: [boardDims.inWidth,boardDims.inHeight]
    }
    
    
    // add the graph canvas to the body of the webpage
    svg = d3.select(selector).append("svg")
            .attr("class", "board")
            .attr("width", boardDims.width)
            .attr("height", boardDims.height)
        .append("g")
        .attr("transform", "translate(" + boardDims.margin.left + "," + boardDims.margin.top + ")");

    
    return {
        g: svg,
        bDims: boardDims,
        dDims: drawDims
    }
}
