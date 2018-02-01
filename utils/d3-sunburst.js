
import utils from './tree.js'
import * as d3 from "d3";

// Dimensions of sunburst.
function createSunBurst( tree, colors, width, clickCallback ) {
  // var width = document.body.clientWidth;
  console.log("in create");
  let textWidthMultiplier = 10;
  if (width > 750) {
    width = 750;
  }
  if (width < 750) {
    textWidthMultiplier = 7;
  }
  var height = width;
  var radius = Math.min(width, height) / 2;

  // Breadcrumb dimensions: width, height, spacing, width of tip/tail.
  var b = {
    w: 75, h: 30, s: 3, t: 10,
    collapseWidth: 15,
    computeWidth(text, i, totalNumberOfBreadCrumbs) {
    return i<(totalNumberOfBreadCrumbs-1) ? this.collapseWidth : text.length * textWidthMultiplier;
    }
  };

  /* Positioned the explanation with css */
  
  // $("#explanation").css("top", `${(width/2)-(100/2)}px`);
  // $("#explanation").css("left", `${(width/2)-(140/2)}px`);

  // Total size of all segments; we set this later, after loading the data.
  var totalSize = 0;

  d3.select("svg").remove();
  var vis = d3.select("#chart").append("svg:svg")
      .attr("width", width)
      .attr("height", height)
      .append("svg:g")
      .attr("id", "container")
      .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

  var partition = d3.partition()
      .size([2 * Math.PI, radius * radius]);

  var arc = d3.arc()
      .startAngle( d => d.x0)
      .endAngle( d => d.x1 )
      .innerRadius( d => Math.sqrt(d.y0) )
      .outerRadius( d => Math.sqrt(d.y1) );

  // Main function to draw and set up the visualization, once we have the data.
  function createVisualization(json, width, colors) {

    // Basic setup of page elements.
    initializeBreadcrumbTrail(width);
    drawLegend(colors);
    d3.select("#togglelegend").on("click", toggleLegend);

    // Bounding circle underneath the sunburst, to make it easier to detect
    // when the mouse leaves the parent g.
    vis.append("svg:circle")
        .attr("r", radius)
        .style("opacity", 0);

    // Turn the data into a d3 hierarchy and calculate the sums.
    var root = d3.hierarchy(json)
        .sum( d => d.size ? d.size : 0 )
        .sort( (a, b) => b.value - a.value );

    // For efficiency, filter nodes to keep only those large enough to see.
    var nodes = partition(root).descendants()
        .filter( d => d.x1 - d.x0 > 0.005 ); // 0.005 radians = 0.29 degrees

    var path = vis.data([json]).selectAll("path")
        .data(nodes)
        .enter()
        .append("svg:path")
        .attr("display", d => d.depth ? null : "none")
        .attr("d", arc)
        .attr("fill-rule", "evenodd")
        .style("fill", d => d.data.color)
        .style("opacity", 1)
        .on("mouseover", mouseover);

    // Add the mouseleave handler to the bounding circle.
    d3.select("#container").on("mouseleave", mouseleave);

    // Get total size of the tree = value of root node from partition.
    totalSize = path.datum().value;
   };

  // Fade all but the current sequence, and show it in the breadcrumb trail.
  function mouseover(d) {

    clickCallback(d.data.cluster);

    // console.log(d);
    var percentage       = (100 * d.value / totalSize).toPrecision(3);
    // var percentage       = d.data.size.toPrecision(3);
    var percentageString = percentage + "%";
    if (percentage < 0.1) {
      percentageString = "< 0.1%";
    }

    d3.select("#percentage")
        .text(percentageString);

    d3.select("#explanation-text")
        .text(d.data.name);

    d3.select("#explanation")
        .style("visibility", "");

    var sequenceArray = d.ancestors().reverse();
    sequenceArray.shift(); // remove root node from the array
    updateBreadcrumbs(sequenceArray, percentageString);

    // Fade all the segments.
    d3.selectAll("path")
        .style("opacity", 0.3);

    // Then highlight only those that are an ancestor of the current segment.
    vis.selectAll("path")
        .filter( node => (sequenceArray.indexOf(node) >= 0) )
        .style("opacity", 1);
  }

  // Restore everything to full opacity when moving off the visualization.
  function mouseleave(d) {

    // Hide the breadcrumb trail
    d3.select("#trail")
        .style("visibility", "hidden");

    // Deactivate all segments during transition.
    d3.selectAll("path").on("mouseover", null);

    // Transition each segment to full opacity and then reactivate it.
    d3.selectAll("path")
        .transition()
        .duration(1000)
        .style("opacity", 1)
        .on("end", function() {
            d3.select(this).on("mouseover", mouseover);
          });

    d3.select("#explanation")
        .style("visibility", "hidden");
  }

  function initializeBreadcrumbTrail(width) {
    // Add the svg area.
    var trail = d3.select("#sequence").append("svg:svg")
        .attr("width", width)
        .attr("height", 50)
        .attr("id", "trail");
    // Add the label at the end, for the percentage.
    trail.append("svg:text")
      .attr("id", "endlabel")
      .style("fill", "#000");
  }

  // Generate a string that describes the points of a breadcrumb polygon.
  function breadcrumbPoints(d, i, numberOfNodes) {
    let width  = b.computeWidth(d.data.name, i, numberOfNodes);
    var points = [];
    points.push("0,0");  // left lower point
    points.push(width + ",0"); // right lower point
    points.push(width + b.t + "," + (b.h / 2));  // right arrow point
    points.push(width + "," + b.h); // right upper point
    points.push("0," + b.h);// left upper point
    if (i > 0) { // Leftmost breadcrumb; don't include 6th vertex.
      points.push(b.t + "," + (b.h / 2));// left arrow point
    }
    return points.join(" ");
  }

  // Update the breadcrumb trail to show the current sequence and percentage.
  function updateBreadcrumbs(nodeArray, percentageString) {
    // Data join; key function combines name and depth (= position in sequence).
    var collapse      = true;
    var numberOfNodes = nodeArray.length

    var trail = d3.select("#trail")
        .selectAll("g")
        .data([], d => d.data.name );

    // Remove exiting nodes.
    trail.exit().remove();

    // Add breadcrumb and label for entering nodes.
    var entering = trail.data(nodeArray, d => d.data.name )
        .enter()
        .append("svg:g");

    entering.append("svg:polygon")
        .attr("points", (d,i) => breadcrumbPoints(d, i, numberOfNodes) )
        .style("fill", d => d.data.color );

    let text = entering.append("svg:text")
        // .attr("x", (b.w + b.t) / 2)
        .attr("y", b.h / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", "middle")
        .text( (d,i) => ( (numberOfNodes-1) > i ) ? "" : d.data.name);

    text.each( (d,i) => {
      let width = (b.t + b.computeWidth(d.data.name, i, numberOfNodes) ) / 2;
      text.attr("x", width);
    });


    // Merge enter and update selections; set position for all nodes.
    var textWidths = {};
    entering.merge(trail).attr("transform", (d, i) => {
      let width     = b.s + b.computeWidth(d.data.name, i, numberOfNodes) ;
      textWidths[i] = width;
      let x         = 0;
      // console.log(i,textWidths);
      if (i>0) {
        for (var j = (i-1); j >= 0; j--) {
          if (textWidths[j]) {
            // console.log("ADDDING",i,x,textWidths[j]);
            x += textWidths[j];
          }
        }
      }
      // let x = (b.w + b.s + (d.data.name.length * 4));
      return "translate(" + x + ", 0)";
    });

    var totalWidth = 0 ;
    for (var w in textWidths) {
      totalWidth += textWidths[w] ;
    }
    totalWidth = totalWidth + 40;
    // Now move and update the percentage at the end.
    d3.select("#trail").select("#endlabel")
        .attr("x", totalWidth)
        .attr("y", b.h / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", "middle")
        .text(percentageString);

    // Make the breadcrumb trail visible, if it's hidden.
    d3.select("#trail")
        .style("visibility", "");

  }

  function drawLegend(colors) {

    // Dimensions of legend item: width, height, spacing, radius of rounded rect.
    var li = {
      w: 75, h: 30, s: 3, r: 3
    };

    var legend = d3.select("#legend").append("svg:svg")
        .attr("width", li.w)
        .attr("height", d3.keys(colors).length * (li.h + li.s));

    var g = legend.selectAll("g")
        .data(d3.entries(colors))
        .enter()
        .append("svg:g")
        .attr("transform", (d, i) => "translate(0," + i * (li.h + li.s) + ")" );

    g.append("svg:rect")
        .attr("rx", li.r)
        .attr("ry", li.r)
        .attr("width", li.w)
        .attr("height", li.h)
        .style("fill", d => d.value );

    g.append("svg:text")
        .attr("x", li.w / 2)
        .attr("y", li.h / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", "middle")
        .text(d => d.key );
  }

  function toggleLegend() {
    var legend = d3.select("#legend");
    if (legend.style("visibility") == "hidden") {
      legend.style("visibility", "");
    } else {
      legend.style("visibility", "hidden");
    }
  }

  // var csvlist = treeToCsv(tree);
  // console.log(csvlist);
  // var json = buildHierarchy(csvlist);
  var json = treeToNodes(tree);
  // console.log(json);
  createVisualization(json, width, colors);

}



// Take a 2-column CSV and transform it into a hierarchical structure suitable
// for a partition layout. The first column is a sequence of step names, from
// root to leaf, separated by hyphens. The second column is a count of how
// often that sequence occurred.
function buildHierarchy(csv) {
  var root = {"name": "root", "children": []};
  for (var i = 0; i < csv.length; i++) {
    var sequence = csv[i][0];
    var size = +csv[i][1];
    if (isNaN(size)) { // e.g. if this is a header row
      continue;
    }
    var parts = sequence.split("-");
    var currentNode = root;
    for (var j = 0; j < parts.length; j++) {
      var children = currentNode["children"];
      var nodeName = parts[j];
      var childNode;
      if (j + 1 < parts.length) {
        // Not yet at the end of the sequence; move down the tree.
        var foundChild = false;
        for (var k = 0; k < children.length; k++) {
         if (children[k]["name"] == nodeName) {
           childNode = children[k];
           foundChild = true;
           break;
         }
        }
        // If we don't already have a child node for this branch, create it.
        if (!foundChild) {
         childNode = {"name": nodeName, "children": []};
         children.push(childNode);
        }
        currentNode = childNode;
      } else {
        // Reached the end of the sequence; create a leaf node.
        childNode = {"name": nodeName, "size": size, "children": []};
        children.push(childNode);
      }
    }
  }
  return root;
};

function treeToCsv(tree, parentNode="") {
  if (!tree.type) {
    tree.nodeName = parentNode;
  } else{
    tree.nodeName = parentNode == "" ? `${tree.type}` :`${parentNode}-${tree.type.replace(/-/g,"")}`;
  }
  if (tree.children) {
    Object.keys(tree.children).forEach( k => treeToCsv(tree.children[k], tree.nodeName) );
  }
  var flatTree = utils.getFlatTree(tree);
  var list     = flatTree.filter( t => t.nodeName != "");
  list         = list.map( t => [t.nodeName, t.percentage]);
  return list;
}

function treeToNodes(tree, parentNode=null) {
  var parentNodeForChild = null;
  if (!parentNode) {
    parentNode = {"name": "root", "children": []};
    parentNodeForChild = parentNode;
  } else {
    var node = {"name": tree.displayName, color: tree.color, cluster: tree };
    if ( !(tree.children && utils.shouldShowChildren(tree)) ) {
      node.size = tree.percentage;
    }
    parentNode.children.push(node);
    parentNodeForChild = node;
  }
  if (tree.children && utils.shouldShowChildren(tree) ) {
    parentNodeForChild.children = [];
    Object.keys(tree.children).forEach( k => {
      treeToNodes(tree.children[k], parentNodeForChild);
    });
  }
  return parentNode;


}

export default {
  createSunBurst
};
