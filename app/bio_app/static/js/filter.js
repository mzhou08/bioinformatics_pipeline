var filterGraph = null;

function resetNodesAndLinks() {
  graph.forEachNode(function(node) {
    graphics.getNodeUI(node.id).color = (node.data.type == "miRNA"? mmRNAColor : mRNAColor);
    node.data.disable = false;
    node.data.weighted = false;
    node.data.fcChecked = false;
    node.data.showLabel = null;
  });
  graph.forEachLink(function(link) {
    link.data.disable = false;
    var colors = pickColor(link);
    var lui = graphics.getLinkUI(link.id);
    lui.color1 = colors[0];
    lui.color2 = colors[1];
  });
}

function filterAll() {
  // ABHIJIT : Delete the contextmenu->show_menu before filter changes
  var doesItExist = document.getElementById("show_menu");
  if(doesItExist) doesItExist.remove();

  resetNodesAndLinks();
  linkFilterUsed = false;
  nodeLabels.innerHTML = "";
  labels = Object.create(null);

  //operates on nodes
  var type = document.getElementById("nodeFilter").value;
  filterNodesByType(type);

  //operates on nodes
  var fcRange = JSON.parse(document.getElementById("fcFilter").value);
  var fcRangeLow = fcRange[0];
  var fcRangeHigh = fcRange[1];
  filterNodesByFoldChange(fcRangeLow, fcRangeHigh);

  //operates on nodes
  var weightRange = JSON.parse(document.getElementById("weightFilter").value);
  var wrL = weightRange[0];
  var wrR = weightRange[1];
  filterWeightRange(wrL, wrR);

  //operates on links
  var numDB = document.getElementById("dbFilter").value;
  filterNodesByDataBase(numDB);

  //operates on links
  var corrRangeN = JSON.parse(document.getElementById("nCorrelationFilter").value);
  var corrRangeLowN = corrRangeN[0]; 
  var corrRangeHighN = corrRangeN[1]; 
  filterCorrelationRangeN(corrRangeLowN, corrRangeHighN);

  //operates on links
  var corrRangeT = JSON.parse(document.getElementById("tCorrelationFilter").value);
  var corrRangeLowT = corrRangeT[0]; 
  var corrRangeHighT = corrRangeT[1]; 
  filterCorrelationRangeT(corrRangeLowT, corrRangeHighT);

  if (filterGraph != null) {
    filterFromGraph(filterGraph);
    linkFilterUsed = true;
  }
  if(linkFilterUsed){
    hideLooseEnds();
  }
  var miRNALabels = document.getElementById("microRNALabels").checked == true;
  var mRNALabels = document.getElementById("mRNALabels").checked == true;
  if (miRNALabels || mRNALabels) addNodeLabels(miRNALabels, mRNALabels);
  
  renderer.rerender();
}

function filterClusters() {
  var qv = document.getElementById("clusterQV").value;
  var cs = document.getElementById("clusterSelect");
  var q_value = 2;
  var rnas = 21;

  var g = {};

  for(var i = 0; i < cs.length; i++) {
    if (cs[i].selected == true) {
      var c = parseInt(cs[i].value);
      if (clusterData[c][q_value] >= qv) continue;
      var rna = clusterData[c][rnas];
      for(var n = 0; n < rna.length; n++) {
	g[rna[n]] = 1;
      }
    }
  }
  console.log(g);
  resetNodesAndLinks();
  graph.forEachNode(function(node) {
    if (g[node.id] == undefined) {
      node.data.disable = true;
      graphics.getNodeUI(node.id).color = disableNodeColor;
      node.links.forEach(function(link) {
          link.data.disable = true;
          graphics.getLinkUI(link.id).color1 = disableLineColor;
          graphics.getLinkUI(link.id).color2 = disableLineColor;
      });
    }
  });
}

function filterFile(fe, ev) {
  var ffile = ev.target.files[0];
  if (ffile) {
    var r = new FileReader();
    r.onload = function(e) { 
      filterGraph = filterFromFile(e.target.result);
      filterFromGraph(filterGraph);
      hideLooseEnds();
      document.getElementById("filterFile").style.display = "none";
      document.getElementById("filterFileClear").style.display = "inline";
    };
    r.readAsText(ffile);
    fe.value = "";
  }
}

function filterFromFile(fileText) {
  var g = Object.create(null);

  d3.tsv.parse(fileText, function(entry) {
    if (g[entry.microRNA] == undefined) {
      links = g[entry.microRNA] = Object.create(null);
    } else {
      links = g[entry.microRNA];
    }
    links[entry.mRNA] = 1;
  });
  return g;
}

function filterFileClear() {
  filterGraph = null;
  document.getElementById("filterFile").style.display = "inline";
  document.getElementById("filterFileClear").style.display = "none";
  filterAll();
}

function filterFromGraph(g) {
  graph.forEachNode(function(node) {
    if (node.data.type == "mRNA") return;
    var links = g[node.id];
    if (links == undefined) {
      node.data.disable = true;
      graphics.getNodeUI(node.id).color = disableNodeColor;
      node.links.forEach(function(link) {
	link.data.disable = true;
        graphics.getLinkUI(link.id).color1 = disableLineColor;
        graphics.getLinkUI(link.id).color2 = disableLineColor;
      });
      return;
    }
    var disableNode = true;
    node.links.forEach(function(link) {
      if (links[link.fromId] == 1) {
	disableNode = false;
      } else {
	link.data.disable = true;
        graphics.getLinkUI(link.id).color1 = disableLineColor;
        graphics.getLinkUI(link.id).color2 = disableLineColor;
      }
    });
    if (disableNode) {
      node.data.disable = true;
      graphics.getNodeUI(node.id).color = disableNodeColor;
    }
  });
}

function addNodeLabels(miRNA, mRNA) {
  graph.forEachNode(function(node) {
    if ((node.data.type == "miRNA" && miRNA) || (node.data.type == "mRNA" && mRNA)) {
      if (node.data.disable == true) return;

      var label = document.createElement("span");
      label.classList.add("nodelabel");
      label.id = node.id;
      label.innerHTML = node.id;
      node.data.showLabel = label;
      nodeLabels.appendChild(label);
    }
  });
}

function filterWeightRange(low, high) {
  if(low == -1) return; 

  graph.forEachNode(function(node) {
    if(node.data.type == "miRNA") {
      if(isInRange(low, high, node.links.length)) {
        node.data.weighted = true;
        node.links.forEach(function(link) {
          var n = graph.getNode(link.fromId);
          n.data.weighted = true;
        });
      }
    }
  });
  graph.forEachNode(function(node) {
    if(!node.data.weighted) {
      node.data.disable = true;
      graphics.getNodeUI(node.id).color = disableNodeColor;
      node.links.forEach(function(link) {
        link.data.disable = true;
        graphics.getLinkUI(link.id).color1 = disableLineColor;
        graphics.getLinkUI(link.id).color2 = disableLineColor;
      });
    }
  });
}

function filterNodesByFoldChange(min, max) {
  if(min == "-1") return;
  console.log("Fold change: ", min, "to", max);
  graph.forEachNode(function(node) {
    var nui = graphics.getNodeUI(node.id);
    if(isInRange(min, max, node.data.fc)) {
      node.data.fcChecked = true;
    }
  });
  graph.forEachNode(function(node) {
    if(!node.data.fcChecked) {
      node.data.disable = true;
      graphics.getNodeUI(node.id).color = disableNodeColor;
      node.links.forEach(function(link) {
          link.data.disable = true;
          graphics.getLinkUI(link.id).color1 = disableLineColor;
          graphics.getLinkUI(link.id).color2 = disableLineColor;
      });
    }
  });
}

function hideLooseEnds() {
  graph.forEachNode(function(node) {
    var nui = graphics.getNodeUI(node.id);
    var nCount = 0;
    node.links.forEach(function(link) {
      if(link.data.disable == true) {
        return; 
      }
      var nData = graph.getNode(link.fromId).data;
      if(!nData.disable) {
        nCount++;
        return;
      }
    });
    if(nCount == 0) {
      node.data.disable = true;
      nui.color = disableNodeColor;
    }
  });
}

function filterCorrelationRangeT(min, max) {
  if(min == "None") {
    return;
  }
  linkFilterUsed = true;
  graph.forEachLink(function(link) {
    var data = link.data;
    var nui = graphics.getLinkUI(link.id);
    if(isInRange(min, max, data.tcc)) {

    } else {
      nui.color1 = disableLineColor;
      nui.color2 = disableLineColor;

      data.disable = true;
      var nf = graph.getNode(link.fromId);
      var nt = graph.getNode(link.toId);
    }
  });
}

function filterCorrelationRangeN(min, max) {
  if(min == "None") return;

  linkFilterUsed = true;
  graph.forEachLink(function(link) {
    var nui = graphics.getLinkUI(link.id);
    if(isInRange(min, max, link.data.ncc)) {

    } else {
      nui.color1 = disableLineColor;
      nui.color2 = disableLineColor;

      link.data.disable = true;
      var nf = graph.getNode(link.fromId);
      var nt = graph.getNode(link.toId);
    }
  });
}

function isInRange(min, max, data) {
  var absVal = Math.abs(data);
  if(absVal >= min && absVal <= max) return true; 

  return false;
}

function filterNodesByRange(min, max, name) {
  graph.forEachNode(function(node) {
    if(name in node.data) {
      console.log("its here"); 
    } 
  });  
}

function filterNodesByType(nodeType) {
  if(nodeType == "") return;

  graph.forEachNode(function(node) {
    var type = node.data.type;
    if(type != nodeType) {
      var nui = graphics.getNodeUI(node.id);
      nui.color = disableNodeColor;
    }
  });

  graph.forEachLink(function(link) {
    graphics.getLinkUI(link.id).color1 = disableLineColor;
    graphics.getLinkUI(link.id).color2 = disableLineColor;
  });
}

function filterNodesByDataBase(numDB) {
  if(numDB == "") return;

  linkFilterUsed = true;
  graph.forEachLink(function(link) {
    if(countDB(link) != numDB) {
      var lui = graphics.getLinkUI(link.id);
      lui.color1 = disableLineColor;
      lui.color2 = disableLineColor;
      link.data.disable = true;
    }
  });
}

//TODO make new field in LinkEntry that stores this number
function countDB(link) {
  var data = link.data;  
  
  var dbCount = 0;
  if(data.targprof.lastIndexOf("Yes") != -1) dbCount++; 
  if(data.targscan.lastIndexOf("Yes") != -1) dbCount++; 
  if(data.miranda.lastIndexOf("Yes") != -1) dbCount++; 
  return dbCount;
}
