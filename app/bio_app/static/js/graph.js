var linkFilterUsed = false;

var graph;
var nodesClicked = [], nodesColored = [], naFlag = false;

var toolTip, nodeClickedStats, linkClickedStats;
var nodeLabels, labels = Object.create(null);

var renderer;
var graphics;
var layout;

var mRNAColor = 0x009ee8, // hex rrggbb
    mRNASize = 12;
var mmRNAColor = 0xFF7700, // hex rrggbb
    mmRNASize = 15;

var selectedColor = 0x00FF00;

var lineAColor0 = 0xBAF32B;
var lineAColor1 = 0x82AA1E;
var lineAColor2 = 0x4A6111;
var lineAColor3 = 0x283900;

var lineBColor0 = 0xF22C71;
var lineBColor1 = 0xA91E4F;
var lineBColor2 = 0x60112D;
var lineBColor3 = 0x400010;

var disableNodeColor = 0xFFDDDD;
var disableLineColor = 0xFFDDDD;

var MRNASHAPE = 0.0;
var MMRNASHAPE = 1.0;

function clearGraph() {
  graph.forEachNode(function(node) {
    graph.removeNode(node.id);
  });
}

function onLoad() {
  console.log("onLoad called");
  //document.getElementById("sampleSelect").reset();
  document.getElementById("nodeid").value = "";
//   document.getElementById("fileinput").addEventListener("change", readSingleFile, false);
  document.getElementById("microRNALabels").checked = false;
  document.getElementById("mRNALabels").checked = false;

  //   var ff = document.getElementById("filterFile");
//   ff.value = "";
//   ff.style.display = "inline";
//   filterGraph = null;
//   document.getElementById("filterFileClear").style.display = "none";

  loadDBFiles();
    
  toolTip = document.getElementById("nodeHover");
  nodeLabels = document.getElementById("nodeLabels");
  //nodeClickedStats = document.getElementById('lastNodeClicked');
  linkClickedStats = document.getElementById("linkSelected");
  
  // getting the context menu on right click  Joey (Harini)
  microRNA_menu = document.getElementById("miRNA_menu");
  mRNA_menu = document.getElementById("mRNA_menu");

  _ctrlMenu.init();
  _tblView.init();
  _ctxtMenu.init();

//  _tblView.e = document.getElementById("tblView");

  graph = Viva.Graph.graph();

  graphics = Viva.Graph.View.webglGraphics();

  // first, tell webgl graphics we want to use custom shader
  graphics.setNodeProgram(buildCircleNodeShader());
  graphics.setLinkProgram(buildLineShader());
  // second, change the node ui model
  graphics.node(function(node) {
    var size = mmRNASize;
    size *= Math.sqrt(node.data.fc)/3 + 1;
    var color = mmRNAColor;
    var shape = MMRNASHAPE;
          
    if(node.data.type == "mRNA"){
      size = mRNASize;
      size *= Math.sqrt(node.data.fc)/3 + 1;
      color = mRNAColor;
      shape = MRNASHAPE;
    }
    var thisCircle = new WebglCircle(size, color, shape);
    return thisCircle;
  }).link(function(link) {
    var colors = pickColor(link);

    var lt1 = normalize(link.data.ncc);
    var lt2 = normalize(link.data.tcc);

    var thisLink = new WebglLine(colors[0], colors[1], lt1, lt2);
    return thisLink;
  });
  graphics.placeNode(function(ui, pos) {
    // This callback is called by the renderer before it updates
    // node coordinate. We can use it to update corresponding DOM
    // label position;
    if (ui.node.data.menu) {
      var domPos = { x: pos.x, y: pos.y };
      graphics.transformGraphToClientCoordinates(domPos);
      _ctxtMenu.move(domPos.x+5, domPos.y+70);
      return;
    }
    if (ui.node.data.showLabel == null) return;

    // we create a copy of layout position
    var domPos = {
      x: pos.x,
      y: pos.y
    };
    // And ask graphics to transform it to DOM coordinates:
    graphics.transformGraphToClientCoordinates(domPos);
    // then move corresponding dom label to its own position:
    var labelStyle = ui.node.data.showLabel.style;
    labelStyle.left = domPos.x + 'px';
    labelStyle.top = (domPos.y -70) + 'px';
  });

  layout = Viva.Graph.Layout.forceDirected(graph, {
    springCoeff : 0.00001,
    dragCoeff : 0.02,
    gravity : -2.2
  });

  renderer = Viva.Graph.View.renderer(graph, {
    graphics : graphics,
    layout : layout,
    container : document.getElementById('graphContainer')
  });

  //TODO set max boundry, freeze nodes certain radius from center
  //layout.pinNode(ui.id, !layout.isNodePinned(node.id));
  
  var events = Viva.Graph.webglInputEvents(graphics, graph);
  events.mouseEnter(function (node) {
    toolTip.innerHTML = node.id;
    toolTip.style.visibility = "visible";
    toolTip.style.left = (mouseX+20) + "px";
    toolTip.style.top = (mouseY-50) + "px";
  }).mouseLeave(function (node){
    toolTip.style.visibility = "hidden";
  }).click(function (node,e) {
    //ABHIJIT
    if(node.data.type == 'miRNA') mirnaNodeId = node.id;
    if(node.data.type == 'mRNA')  mrnaNodeId  = node.id;

    document.getElementById("putTable").style.display = "none";
    _ctxtMenu.close();

    if(e.button == 2) {
      _ctxtMenu.open(node.data.type, node, mouseX+5, mouseY+5);
      node.data.menu = true;
//       var doesItExist = document.getElementById(node.id);
//       if(doesItExist) doesItExist.remove();
      
//       tmpSpan.classList.add("contextMenu_showmenu");
//       node.data.showLabel = tmpSpan;
//       console.log(node);
//       contextmenu.appendChild(tmpSpan);      
    }
    
    linkClickedStats.style.visibility = "visible";
//     document.getElementById("linkSelected_hr").style.visibility = "visible"; /* show 'hr' tag after linkClickedStats*/
    
    var nc = nodesClicked.length;    

    if (nc == 0) {
      unhighlightSelected(nodesColored);
      nodesClicked.push(node.id);
      highlightSelected(nodesClicked);
      linkClickedStats.innerHTML = "<h5><u>Select Adjacent Nodes for link Data</u></h5>";
      linkClickedStats.innerHTML += "&nbsp;<strong>" + node.id + "</strong>"
      + "<br> &nbsp;&nbsp; Fold Change: " + node.data.fc + "<br>";
    }else if(nc == 1) {
      if (naFlag) {
	document.getElementById("nodesNA").remove();
	naFlag = false;
      }
      nodesClicked.push(node.id);
      highlightSelected(nodesClicked);
      linkClickedStats.innerHTML += "<br>&nbsp;<strong>" + node.id + "</strong>"
      + "<br> &nbsp;&nbsp; Fold Change: " + node.data.fc + "<br>";
      nc++;
    }
    if (nc == 2) {
      highlightSelected(nodesClicked);
      var linkData;
      if((linkData = checkAdjacent(nodesClicked)) != 0){
        linkClickedStats.innerHTML += "<br>&nbsp;<strong>Link Data:</strong>"
        + "<br>&nbsp;&nbsp; <strong>T_CC</strong> " + linkData.tcc
        + "<br>&nbsp;&nbsp; <strong>T_P</strong> " + linkData.tp 
        + "<br>&nbsp;&nbsp; <strong>T_FDR</strong> " + linkData.tfdr
        + "<br>&nbsp;&nbsp; <strong>N_CC</strong> " + linkData.ncc 
        + "<br>&nbsp;&nbsp; <strong>N_P</strong> " + linkData.np 
        + "<br>&nbsp;&nbsp; <strong>N_FDR</strong> " + linkData.nfdr 
        + "<br>&nbsp;&nbsp; <strong>Targetprofiler</strong> " + linkData.targprof 
        + "<br>&nbsp;&nbsp; <strong>Targetscan</strong> " + linkData.targscan 
        + "<br>&nbsp;&nbsp; <strong>MiRanda</strong> " + linkData.miranda;
	nodesColored = nodesClicked;
	nodesClicked = [];
      }else{
        linkClickedStats.innerHTML = "<div id='nodesNA'><strong>Selected Nodes Not Adjacent.</strong></div>";
        unhighlightSelected(nodesClicked);
	nodesColored = [];
	nodesClicked = [ node.id ];
	highlightSelected(nodesClicked);
	linkClickedStats.innerHTML += "<h5><u>Select Adjacent Nodes for link Data</u></h5>";
	linkClickedStats.innerHTML += "&nbsp;<strong>" + node.id + "</strong>"
	  + "<br> &nbsp;&nbsp; Fold Change: " + node.data.fc + "<br>";
	naFlag = true;
      }
    }
  });

  resize();
  renderer.run();
}

function normalize(num) {
  var res = Math.ceil(Math.abs(num) * 10);
  res *= 0.7
  if (res < 1) res = 1; 

  return res;
}

function pickColor(link) {
  var dbCount = countDB(link);
  switch(dbCount) {
    case 0:
      return [lineAColor0, lineBColor0];
    case 1:
      return [lineAColor1, lineBColor1];
    case 2:
      return [lineAColor2, lineBColor2];
    default:
      return [lineAColor3, lineBColor3];
  }
}

function highlightSelected(list) {
  for(var i = 0; i < nodesClicked.length; i++) {
    var nui = graphics.getNodeUI(list[i]);
    nui.color = selectedColor;
  }
}

function unhighlightSelected(list) {
  if (list == []) {
    return; 
  }
  for(var i = 0; i < list.length; i++) {
    var nui = graphics.getNodeUI(list[i]);
    var nd = graph.getNode(list[i]).data;
    console.log(nd);
    if (nd.disable) {
      nui.color = disableNodeColor;
    } else {
      if (nd.type == "mRNA") {
        nui.color = mRNAColor;
      } else {
        nui.color = mmRNAColor;
      }
    }
  }
}

function checkAdjacent(list) {
  if (list[0] == list[1]) {
    return 0;
  }
  var links = graph.getNode(list[0]).links;
  for(var i = 0; i < links.length; i++) {
    if(links[i].toId == list[1]) {
      return links[i].data;
    }
    if(links[i].fromId == list[1]) {
      return links[i].data;
    }
  }
  return 0;
}

function LinkEntry(tcc, tp, tfdr, ncc, np, nfdr, targprof, targscan, miranda) {
  this.tcc = tcc;
  this.tp = tp;
  this.tfdr = tfdr;
  this.ncc = ncc;
  this.np = np;
  this.nfdr = nfdr;
  this.targprof = targprof;
  this.targscan = targscan;
  this.miranda = miranda;
  this.disable = false;
  this.db = 0;
}

function MapDataEntry(type, id, fc) {
  this.type = type;
  this.id = id;
  this.disable = false;
  this.weighted = false;
  this.fcChecked = false;
  this.showLabel = null;
  this.menu = false;
  this.fc = fc;
}

function flashNode(nodeID, sizeRat, fColor, ms) {
  var nui = graphics.getNodeUI(nodeID);
  var size = nui.size;
  var color = nui.color;

  nui.size = sizeRat * size;
  nui.color = fColor;

  setTimeout(function() {
    nui.size = size;
    nui.color = color;
  }, ms);
}

function colorLinksFromNode(nodeID, color) {
  var links = graph.getNode(nodeID).links;
  links.forEach(function(link) {
    link.data.disable = true;
    graphics.getLinkUI(link.id).color1 = color;
    graphics.getLinkUI(link.id).color2 = color;
  });
}

/*Function to flash and highlight all the mirnas in the HMDD DATA FILE by searching the file with mirna name as a key (Harini)

function findMiRNAS(graph){
  //check if the graph is loaded
  var countofmirs = 0;  
  var i,j;

  if (typeof graph == "undefined") {
	alert("Graph is Empty. Please Select a Gene Sample from the list given");
  } else {
    i = graph.getNodesCount();
    graph.forEachNode(function(node) {
    var nodename = node.id;
    console.log(i,"the count of nodes in the graph");
    for(j = 0 ; j < miRNAData.length ; j++){
      if(miRNAData[j].microRNA == nodename) {
	countofmirs++;
	console.log("its here",countofmirs);
	flashNode(miRNAData[j].microRNA, 1.3, 0xFFFF00, 500);
	nodesClicked.push(miRNAData[j].microRNA);
	highlightSelected(nodesClicked);
      }
    }
   });
  }
}
*/


// model object for node ui in webgl
function WebglCircle(size, color, shape) {
  this.size = size;
  this.color = color;
  this.shape = shape;
}

// model object for link ui in webgl
function WebglLine(color1, color2, thickness1, thickness2) {
  this.color1 = color1;
  this.color2 = color2;
  this.thickness1 = thickness1;
  this.thickness2 = thickness2;
}

// program, used by webgl renderer:
function buildCircleNodeShader() {
  // For each primitive we need 5 attributes: x, y, color, size and shape.
  var ATTRIBUTES_PER_PRIMITIVE = 5,
      nodesFS = [
        'precision mediump float;', 
        'varying vec4 color;', 
        'varying float shp;',
        'void main(void) {', 
        '   if ((gl_PointCoord.x - 0.5) * (gl_PointCoord.x - 0.5) + (gl_PointCoord.y - 0.5) * (gl_PointCoord.y - 0.5) < 0.25) {', 
        '     gl_FragColor = color;', 
        '   } else {', 
        '     if(shp > 0.0){',
        '       gl_FragColor = vec4(0.0,0.0,0.0,0.0);', 
        '     }else{',
        '       gl_FragColor = color;', 
        '     }',
        '   }', 
        '}'].join('\n'),
      nodesVS = [
        'attribute vec2 a_vertexPos;',
      // Pack color and size into vector. First element is color, second - size.
      // Since it's floating point we can only use 24 bit to pack colors...
      // thus alpha channel is dropped, and is always assumed to be 1.
        'attribute vec3 a_customAttributes;', 
        'uniform vec2 u_screenSize;', 
        'uniform mat4 u_transform;', 
        'varying vec4 color;', 
        'varying float shp;',
        'void main(void) {', 
        '   gl_Position = u_transform * vec4(a_vertexPos/u_screenSize, 0, 1);', 
        '   gl_PointSize = a_customAttributes[1] * u_transform[0][0];', 
        '   float c = a_customAttributes[0];', 
        '   color = vec4(0.0, 0.0, 0.0, 255.0);',
        '   shp = a_customAttributes[2];',
        '   color.b = mod(c, 256.0); c = floor(c/256.0);', 
        '   color.g = mod(c, 256.0); c = floor(c/256.0);', 
        '   color.r = mod(c, 256.0); c = floor(c/256.0); color /= 255.0;', 
        '}'].join('\n');

  var program,
      gl,
      buffer,
      locations,
      utils,
      nodes = new Float32Array(64),
      nodesCount = 0,
      canvasWidth,
      canvasHeight,
      transform,
      isCanvasDirty;

  return {
    /**
     * Called by webgl renderer to load the shader into gl context.
     */
    load : function(glContext) {
      gl = glContext;
      webglUtils = Viva.Graph.webgl(glContext);

      program = webglUtils.createProgram(nodesVS, nodesFS);
      gl.useProgram(program);
      locations = webglUtils.getLocations(program, ['a_vertexPos', 'a_customAttributes', 'u_screenSize', 'u_transform']);
      gl.enableVertexAttribArray(locations.vertexPos);
      gl.enableVertexAttribArray(locations.customAttributes);
      buffer = gl.createBuffer();
    },

    /**
     * Called by webgl renderer to update node position in the buffer array
     *
     * @param nodeUI - data model for the rendered node (WebGLCircle in this case)
     * @param pos - {x, y} coordinates of the node.
     */
    position : function(nodeUI, pos) {
      var idx = nodeUI.id;
      //nodeUI.size++;
      nodes[idx * ATTRIBUTES_PER_PRIMITIVE] = pos.x;
      nodes[idx * ATTRIBUTES_PER_PRIMITIVE + 1] = -pos.y;
      nodes[idx * ATTRIBUTES_PER_PRIMITIVE + 2] = nodeUI.color;
      nodes[idx * ATTRIBUTES_PER_PRIMITIVE + 3] = nodeUI.size;
      nodes[idx * ATTRIBUTES_PER_PRIMITIVE + 4] = nodeUI.shape;
    },

    /**
     * Request from webgl renderer to actually draw our stuff into the
     * gl context. This is the core of our shader.
     */
    render : function() {
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, nodes, gl.DYNAMIC_DRAW);

      if (isCanvasDirty) {
        isCanvasDirty = false;
        gl.uniformMatrix4fv(locations.transform, false, transform);
        gl.uniform2f(locations.screenSize, canvasWidth, canvasHeight);
      }

      gl.vertexAttribPointer(locations.vertexPos, 2, gl.FLOAT, false, ATTRIBUTES_PER_PRIMITIVE * Float32Array.BYTES_PER_ELEMENT, 0);
      gl.vertexAttribPointer(locations.customAttributes, 3, gl.FLOAT, false, ATTRIBUTES_PER_PRIMITIVE * Float32Array.BYTES_PER_ELEMENT, 2 * Float32Array.BYTES_PER_ELEMENT);
      gl.drawArrays(gl.POINTS, 0, nodesCount);
    },

    /**
     * Called by webgl renderer when user scales/pans the canvas with nodes.
     */
    updateTransform : function(newTransform) {
      transform = newTransform;
      isCanvasDirty = true;
    },

    /**
     * Called by webgl renderer when user resizes the canvas with nodes.
     */
    updateSize : function(newCanvasWidth, newCanvasHeight) {
      canvasWidth = newCanvasWidth;
      canvasHeight = newCanvasHeight;
      isCanvasDirty = true;
    },

    /**
     * Called by webgl renderer to notify us that the new node was created in the graph
     */
    createNode : function(node) {
      nodes = webglUtils.extendArray(nodes, nodesCount, ATTRIBUTES_PER_PRIMITIVE);
      nodesCount += 1;
    },

    /**
     * Called by webgl renderer to notify us that the node was removed from the graph
     */
    removeNode : function(node) {
      if (nodesCount > 0) {
        nodesCount -= 1;
      }

      if (node.id < nodesCount && nodesCount > 0) {
        // we do not really delete anything from the buffer.
        // Instead we swap deleted node with the "last" node in the
        // buffer and decrease marker of the "last" node. Gives nice O(1)
        // performance, but make code slightly harder than it could be:
        webglUtils.copyArrayPart(nodes, node.id * ATTRIBUTES_PER_PRIMITIVE, nodesCount * ATTRIBUTES_PER_PRIMITIVE, ATTRIBUTES_PER_PRIMITIVE);
      }
    },

    /**
     * This method is called by webgl renderer when it changes parts of its
     * buffers. We don't use it here, but it's needed by API (see the comment
     * in the removeNode() method)
     */
    replaceProperties : function(replacedNode, newNode) {
    },
  };
}


function buildLineShader() {
  // primitive is Line with two points. Each has x,y and color = 3 * 2 attributes.
  var ATTRIBUTES_PER_PRIMITIVE = 3*3*4, 
      linksFS = [
        'precision mediump float;',
        'varying vec4 color;',
        'void main(void) {',
        '   gl_FragColor = color;',
        '}'].join('\n'),
        
        linksVS = [
        'attribute vec2 a_vertexPos;',
        'attribute float a_color;', 
        
        'uniform vec2 u_screenSize;',
        'uniform mat4 u_transform;',
        
        'varying vec4 color;',
        
        'void main(void) {',
        '   gl_Position = u_transform * vec4(a_vertexPos/u_screenSize, 0.0, 1.0);',
        '   color = vec4(0.0, 0.0, 0.0, 255.0);',
        '   float c = a_color;',
        '   color.b = mod(c, 256.0); c = floor(c/256.0);',
        '   color.g = mod(c, 256.0); c = floor(c/256.0);',
        '   color.r = mod(c, 256.0); c = floor(c/256.0); color /= 255.0;',
        '}'].join('\n');

  var program,
      gl,
      buffer,
      utils,
      locations,
      linksCount = 0,
      frontLinkId, // used to track z-index of links.
      links = new Float32Array(64),
      width, height, transform, sizeDirty;

  return {
    load : function(glContext) {
      gl = glContext;
      utils = Viva.Graph.webgl(glContext);

      program = utils.createProgram(linksVS, linksFS);
      gl.useProgram(program);
      locations = utils.getLocations(program, ['a_vertexPos', 'a_color', 'u_screenSize', 'u_transform']);

      gl.enableVertexAttribArray(locations.vertexPos);
      gl.enableVertexAttribArray(locations.color);

      buffer = gl.createBuffer();
    },

    position: function(linkUi, fromPos, toPos) {
      var linkIdx = linkUi.id,
          offset = linkIdx * ATTRIBUTES_PER_PRIMITIVE;
      var atan2 = function(y,x) {
        if (x > 0) return Math.atan(y/x);
        if (x < 0) {
          if (y >= 0) return Math.atan(y/x)+Math.PI;
          return Math.atan(y/x)-Math.PI;
        } else {
          if (y > 0) return Math.PI/2;
          return -Math.PI/2;
        }
      }

      var r = atan2(fromPos.y-toPos.y, fromPos.x-toPos.x);
      var tx = Math.cos(r+(Math.PI/2));
      var ty = Math.sin(r+(Math.PI/2));

      var ax = tx * 2;
      var ay = ty * 2;
      var bx = tx * (linkUi.thickness1 + 2);
      var by = ty * (linkUi.thickness1 + 2);
      var cx = tx * (linkUi.thickness2 + 2);
      var cy = ty * (linkUi.thickness2 + 2);

      links[offset + 0] = fromPos.x+ax;
      links[offset + 1] = fromPos.y+ay;
      links[offset + 2] = linkUi.color1;

      links[offset + 3] = toPos.x+ax;
      links[offset + 4] = toPos.y+ay;
      links[offset + 5] = linkUi.color1;

      links[offset + 6] = fromPos.x+bx;
      links[offset + 7] = fromPos.y+by;
      links[offset + 8] = linkUi.color1;

      links[offset +  9] = fromPos.x+bx;
      links[offset + 10] = fromPos.y+by;
      links[offset + 11] = linkUi.color1;

      links[offset + 12] = toPos.x+ax;
      links[offset + 13] = toPos.y+ay;
      links[offset + 14] = linkUi.color1;

      links[offset + 15] = toPos.x+bx;
      links[offset + 16] = toPos.y+by;
      links[offset + 17] = linkUi.color1;

      links[offset + 18] = fromPos.x-ax;
      links[offset + 19] = fromPos.y-ay;
      links[offset + 20] = linkUi.color2;

      links[offset + 21] = toPos.x-ax;
      links[offset + 22] = toPos.y-ay;
      links[offset + 23] = linkUi.color2;

      links[offset + 24] = fromPos.x-cx;
      links[offset + 25] = fromPos.y-cy;
      links[offset + 26] = linkUi.color2;

      links[offset + 27] = fromPos.x-cx;
      links[offset + 28] = fromPos.y-cy;
      links[offset + 29] = linkUi.color2;

      links[offset + 30] = toPos.x-ax;
      links[offset + 31] = toPos.y-ay;
      links[offset + 32] = linkUi.color2;

      links[offset + 33] = toPos.x-cx;
      links[offset + 34] = toPos.y-cy;
      links[offset + 35] = linkUi.color2;
    },

    createLink : function(ui) {
      links = utils.extendArray(links, linksCount, ATTRIBUTES_PER_PRIMITIVE);
      linksCount += 1;
      frontLinkId = ui.id;
    },

    removeLink : function(ui) {
      if (linksCount > 0) { linksCount -= 1;}
      // swap removed link with the last link. This will give us O(1) performance for links removal:
      if (ui.id < linksCount && linksCount > 0) {
        utils.copyArrayPart(links, ui.id * ATTRIBUTES_PER_PRIMITIVE, linksCount*ATTRIBUTES_PER_PRIMITIVE, ATTRIBUTES_PER_PRIMITIVE); 
      }
    },

    updateTransform : function(newTransform) {
      sizeDirty = true;
      transform = newTransform;
    },

    updateSize : function(w, h) {
      width = w;
      height = h;
      sizeDirty = true;
    },

    render : function() {
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, links, gl.DYNAMIC_DRAW);

      if (sizeDirty) {
        sizeDirty = false;
        gl.uniformMatrix4fv(locations.transform, false, transform);
        gl.uniform2f(locations.screenSize, width, height);
      }

      gl.vertexAttribPointer(locations.vertexPos, 2, gl.FLOAT, false, 3 * Float32Array.BYTES_PER_ELEMENT, 0);
      gl.vertexAttribPointer(locations.color, 1, gl.FLOAT, false, 3 * 4, 2 * 4);

      gl.drawArrays(gl.TRIANGLES, 0, linksCount * 4*3);
               
      frontLinkId = linksCount - 1;
    },

    bringToFront : function(link) {
      if (frontLinkId > link.id) {
        utils.swapArrayPart(links, link.id * ATTRIBUTES_PER_PRIMITIVE, frontLinkId * ATTRIBUTES_PER_PRIMITIVE, ATTRIBUTES_PER_PRIMITIVE);
      }
      if (frontLinkId > 0) frontLinkId -= 1;
    },

    getFrontLinkId : function() {
      return frontLinkId;
    }
  };
};



// Unused?
// function clipLinks() {
//   graph.forEachLink(function(link) {
//     if(link.data.disable) {
//       graph.removeLink(link);
//     }
//   });
// }

function clipNodes() {
  graph.forEachNode(function(node) {
    if(node.data.disable) {
      graph.removeNode(node.id);
    }
  });

  var i = graph.getNodesCount();
  if (i == 0) {
    alert("Graph is Empty. Please load another.");
  }
}

