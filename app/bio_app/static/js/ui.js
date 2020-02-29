// Store miRNA and mRNA node ids (Abhijit):
var mirnaNodeId;
var mrnaNodeId;

// Used to track mouse position
var mouseX = 0, mouseY = 0;

//Abhijit: Globally store "selected dropdown value", inorder to use it for KEGG DB
var sampleCancerSelectedFile = "";

function updateMouse(e) {
  mouseX = e.clientX;
  mouseY = e.clientY;
}

var _ctrlMenu = {
  e     : null,  mctrl : null,
  show  : false, resizing: false, moved : false,
  width : 370,
  Xoffset : 0,

  init : function() {
    this.e = document.getElementById("controlMenu");
    this.mctrl = document.getElementById("mainCtrl");
  },
  
  toggle : function() {
    this.resizing = false;
    // Ignore this if we were resizing:
    if (this.moved) {
      this.moved = false;
      return;
    }
    this.show = ! this.show;
    if (this.show) this.e.style.left = "0px";
    else this.e.style.left = -this.width + "px";
    _tblView.setWidth(this.show? this.width+15 : 15);
  },

  open : function() {
    if (this.show == false) this.toggle();
  },
  
  mvstart : function(ev) {
    // No resizing if the controls are not being shown:
    if (this.show == false) return;
    this.resizing = true;
    // Subtract the width of the controls to get the X position over the viz control:
    this.Xoffset = ev.clientX - this.width;
  },

  mmove: function(ev) {
    this.width = ev.clientX - this.Xoffset;
    this.mctrl.style.width = this.width + "px";
    this.mctrl.style.maxWidth = this.width + "px";
    this.moved = true;
   _tblView.setWidth(this.show? this.width+15 : 15);
  },
  
  resize : function(w, h) {
    this.e.style.height = h + "px";
    this.mctrl.style.height = h + "px";
    this.mctrl.maxHeight = h + "px";
    if (this.show) this.e.style.left = "0px";
    else this.e.style.left = -this.width + "px";
   _tblView.setWidth(this.show? this.width-15 : 15);
  }
};

var _tblView = {
  e     : null,  vdata: null, putTable : null,
  show  : false, resizing: false, moved : false,
  width : 0, height  : 250,
  left  : 0, Yoffset : 0,
  footer: 20,

  init : function() {
    this.e = document.getElementById("tblView");
    this.e.style.bottom = -(this.height-this.footer) + "px";
    this.vdata = document.getElementById('tblViewData');
    this.vdata.style.height = this.height + "px";
    this.putTable = document.getElementById("putTable");
    this.ptinit();
  },

  ptinit : function() {
    this.putTable.innerHTML = "";
    this.putTable.style.display = "none";
  },

  setWidth : function(loffset) {
    console.log("innerWidth = " + window.innerWidth, " loffset = " + loffset);
    this.e.style.width = (this.width = window.innerWidth-loffset) + "px";
    this.e.style.maxWidth = this.width + "px";
    this.vdata.style.width = this.width + "px";
    this.vdata.style.maxWidth = this.width + "px";
    this.e.style.left = (this.left = loffset) + "px";
  },

  toggle : function() {
    this.resizing = false;
    // Ignore this if we were resizing:
    if (this.moved) {
      this.moved = false;
      return;
    }
    this.show = ! this.show;
    if (this.show) this.e.style.bottom = this.footer + "px";
    else this.e.style.bottom = -(this.height-this.footer) + "px";
  },

  open : function() {
    if (this.show == false) this.toggle();
  },

  mvstart : function(ev) {
    // No resizing if the controls are not being shown:
    if (this.show == false) return;
    this.resizing = true;
    // Subtract the height of the controls to get the Y position over the viz control:
    this.Yoffset = (window.innerHeight - this.footer - this.height) - ev.clientY;
    console.log(ev.clientY, window.innerHeight, this.footer, this.height, this.Yoffset);
  },

  mmove: function(ev) {
    this.height = (window.innerHeight-this.footer) - (ev.clientY+this.Yoffset);
    console.log("moving", this.height);
    this.vdata.style.height = this.height + "px";
    this.vdata.style.maxHeight = this.height + "px";
    this.moved = true;
  },
  
  ptopen : function(label) {
    this.putTable.style.display = "block";
    var createH3 = document.createElement("h3");
    createH3.id = "dbNameH3";
    createH3.innerHTML = label;
    var createTable = document.createElement("table");
    createTable.id = "storeTable";
    createTable.className = "table table-striped table-bordered";

    this.putTable.appendChild(createH3);
    this.putTable.appendChild(createTable);
    this.open();
  }
};

function mmove(ev) {
  if (_ctrlMenu.resizing) _ctrlMenu.mmove(ev);
  if (_tblView.resizing) _tblView.mmove(ev);
}

/**
 * Called when the browser window is re-sized.
 */
function resize() {
  console.log("resize called");
  var height = window.innerHeight-20-70;
  var width = window.innerWidth;

  var gc = document.getElementById("graphContainer");
  gc.style.height = height + "px";
  gc.style.width = width + "px";
  if (renderer != null){
    renderer.reset();
  }
  _ctrlMenu.resize(width, height);
}


function center() {
  var x = document.getElementById("nodeid").value;
  if (graph.getNode(x) != undefined) {
    var pos = layout.getNodePosition(x);
    renderer.reset();
    renderer.moveTo(pos.x, pos.y);
    renderer.zoomIn();

    flashNode(x, 1.3, 0xFFFF00, 500);
  } else {
    alert("Node " + x + " not found.");
  
  }
  return false;
}

/**
 * Reload the previously loaded graph.  loadName is either the contents of a
 * locally loaded file or the filename of a server object.  fromServer will
 * be true if it is a server object and false if it was a locally loaded file.
 * If it's -1 no graph has been loaded yet.
 */
function reloadGraph() {
  if(fromServer == -1) return;

  if (fromServer) loadFromFile(loadName);
  else loadFile(loadName);
}

function setCancerType() {
  var sampleSelect = document.getElementById("sampleSelect");
  sampleCancerSelectedFile = sampleSelect.options[sampleSelect.selectedIndex].text;

  if (sampleCancerSelectedFile == "None") return; 

  var dataFile = "data/" + sampleCancerSelectedFile + ".all";
  loadFromFile(dataFile);

  sampleSelect.selectedIndex = 0;
}

function setClusterQV() {
  var qv = document.getElementById("clusterQV").value;
  setClusterSelect(qv);
  return true;
}

function resetAll() {
  nodesClicked = [];
  nodesColored = [];
  //nodeClickedStats.style.visibility = "hidden";
  linkClickedStats.style.visibility = "hidden";
  document.getElementById("linkSelected_hr").style.visibility = "hidden"; /* hide 'hr' tag after linkClickedStats*/
  
  linkClickedStats.innerHTML = "";

  /* Hiding the right click menu   */
  // document.getElementById("dbmenu").style.visibility = "hidden";

  document.getElementById("fcFilter").selectedIndex = 0;
  document.getElementById("dbFilter").selectedIndex = 0;
  document.getElementById("nodeFilter").selectedIndex = 0;
  document.getElementById("nCorrelationFilter").selectedIndex = 0;
  document.getElementById("tCorrelationFilter").selectedIndex = 0;
  document.getElementById("weightFilter").selectedIndex = 0;
  document.getElementById("nodeid").value = "";
  document.getElementById("microRNALabels").checked = false;
  document.getElementById("mRNALabels").checked = false;
//   var filterFile = document.getElementById("filterFile");
//   filterFile.value = "";
//   filterFile.style.display = "visible";
//   document.getElementById("filterFileClear").style.display = "none";
  filterGraph = null;

  nodeLabels.innerHTML = "";
  labels = Object.create(null);

  renderer.reset();
}

//disable right click
document.oncontextmenu = function() {
  console.log("Nodes in graph: " + graph.getNodesCount());
  return false;
};

var _ctxtMenu = {
  menu : null,
  node : null,
  miRNA : null, mRNA : null,
  putTable : null,

  init : function() {
    this.miRNA = document.getElementById("miRNA_menu");
    this.mRNA = document.getElementById("mRNA_menu");
  },

  open : function(which, node, x, y) {
    this.menu = (which == "miRNA"? this.miRNA : this.mRNA);
    this.node = node;
    this.menu.style.display = "inline";
    this.move(x, y);
  },

  close : function() {
    if (this.menu != null) {
      this.node.data.menu = false;
      this.menu.style.display = "none";
      this.menu = null;
    }
  },

  move : function(x, y) {
    this.menu.style.left = x + "px";
    this.menu.style.top = y + "px";
  },
  
  miRNA_info : function(type) {
    this.close();
    _tblView.ptinit();
  },
};


//ABHIJIT
function viewInfo_MIRNA(typeOfMIRNA){ 
  _ctxtMenu.close();
  _tblView.ptinit();

  if(mirnaNodeId == false) {
    Is_MIRNA_mRNA_ValidInfo("MIRNA", false);
    return;
  }

  var tmpArray = [], createUrl = "";
  switch(typeOfMIRNA) {
    case "HMDD_Genetics":
      var mirnaobj = miRNA_HMDD_Genetics_DATA.get(mirnaNodeId);
      var isValid = Is_MIRNA_mRNA_ValidInfo("MIRNA",mirnaobj);
      if(!isValid) break;
      _tblView.ptopen("HMDD Genetics Database");

      for(var k = 0 ; k < mirnaobj.length ; k++) {
        createUrl = "https://www.ncbi.nlm.nih.gov/pubmed/"+ mirnaobj[k].pmid;
        tmpArray[k] = [];
        tmpArray[k][0] = mirnaobj[k].microRNA;
        tmpArray[k][1] = mirnaobj[k].disease;
        tmpArray[k][2] = "<a href=\"" + createUrl + "\" target='_blank'>" + mirnaobj[k].pmid+ "</a>";
        tmpArray[k][3] = mirnaobj[k].description;
      }

      $(document).ready(function () {   
        $('#storeTable').DataTable({
          "pageLength": 3,
          "scrollX": true,
//        "scrollY": "200px",
	  "searching" : false,
          data:tmpArray,
          columns: [{ title: "miRNA" },{ title: "Disease Name" },{ title: "PMID" },{ title: "Description" }],
          dom: 'Bfrtip',
          buttons: ['copy',
             {extend:'csv', title:"HMDD_" + mirnaobj[0].microRNA},
             {extend:'excel', title:"HMDD_" + mirnaobj[0].microRNA},
             {extend:'pdfHtml5', title:"HMDD_" + mirnaobj[0].microRNA},
             {extend:'print', title:"HMDD_" + mirnaobj[0].microRNA}
	  ]
	});
      });
      break;
    case "HMDD_Epigenetics":
      var mirnaobj = miRNA_HMDD_Epigenetics_DATA.get(mirnaNodeId);
      var isValid = Is_MIRNA_mRNA_ValidInfo("MIRNA",mirnaobj);
      
      if (!isValid) break;
      _tblView.ptopen("HMDD Epigenetics Database");

      for(var k = 0 ; k < mirnaobj.length ; k++) {
        pmidurl = "https://www.ncbi.nlm.nih.gov/pubmed/"+ mirnaobj[k].pmid;
        tmpArray[k] = [];
        tmpArray[k][0] = mirnaobj[k].microRNA;
        tmpArray[k][1] = mirnaobj[k].disease;
        tmpArray[k][2] = "<a href=\"" + pmidurl + "\" target='_blank'>" + mirnaobj[k].pmid+ "</a>";
        tmpArray[k][3] = mirnaobj[k].description;
      }

      $(document).ready(function () {   
        $('#storeTable').DataTable({
          "pageLength": 3,
          "scrollX": true,
	  "searching" : false,
          data : tmpArray,
          columns : [{ title: "miRNA" },{ title: "Disease Name" },{ title: "PMID" },{ title: "Description" }],
          dom: 'Bfrtip',
	  buttons: ['copy',
            {extend:'csv', title:"HMDD_" + mirnaobj[0].microRNA},
            {extend:'excel', title:"HMDD_" + mirnaobj[0].microRNA},
            {extend:'pdfHtml5', title:"HMDD_" + mirnaobj[0].microRNA},
            {extend:'print', title:"HMDD_" + mirnaobj[0].microRNA}
	  ]
        });
      });
      break;
    case "HMDD_Target":
      var mirnaobj = miRNA_HMDD_Target_DATA.get(mirnaNodeId);
      var isValid = Is_MIRNA_mRNA_ValidInfo("MIRNA",mirnaobj);
      
      if (!isValid) break;
      _tblView.ptopen("HMDD Target Database");

      for(var k = 0 ; k < mirnaobj.length ; k++) {
//	pmidurl = "http://www.cuilab.cn/hmdd/" + mirnaobj[k].pmid;
        pmidurl = "https://www.ncbi.nlm.nih.gov/pubmed/"+ mirnaobj[k].pmid;
        tmpArray[k] = [];
        tmpArray[k][0] = mirnaobj[k].microRNA;
        tmpArray[k][1] = mirnaobj[k].mRNA;
        tmpArray[k][2] = mirnaobj[k].disease;
        tmpArray[k][3] = "<a href=\"" + pmidurl + "\" target='_blank'>" + mirnaobj[k].pmid+ "</a>";
        tmpArray[k][4] = mirnaobj[k].description;
      }

      $(document).ready(function () {   
        $('#storeTable').DataTable({
          "pageLength": 3,
          "scrollX": true,
          "searching" : false,
          data:tmpArray,
          columns: [{ title: "miRNA" },{ title: "mRNA"},{ title: "Disease Name" },{ title: "PMID" },{ title: "Description" }],
          dom: 'Bfrtip',
          buttons: ['copy',
            {extend:'csv', title:"HMDD_" + mirnaobj[0].microRNA},
            {extend:'excel', title:"HMDD_" + mirnaobj[0].microRNA},
            {extend:'pdfHtml5', title:"HMDD_" + mirnaobj[0].microRNA},
            {extend:'print', title:"HMDD_" + mirnaobj[0].microRNA}]		  
	});
      });
      break;
    case "Somamir":
      var mirnaobj = miRNA_SomamiR_DATA.get(mirnaNodeId);
      var isValid = Is_MIRNA_mRNA_ValidInfo("MIRNA",mirnaobj);
      if (!isValid) break;
      _tblView.ptopen("SomamiR Database");

      for(var k = 0 ; k < mirnaobj.length ; k++) {
        tmpArray[k] = [];
        tmpArray[k][0] = mirnaobj[k].microRNA;
        tmpArray[k][1] = mirnaobj[k].Strand;
        tmpArray[k][2] = mirnaobj[k].Mutation_ID;
        tmpArray[k][3] = mirnaobj[k].COSMIC_ID;
        tmpArray[k][4] = mirnaobj[k].Reference;
        tmpArray[k][5] = mirnaobj[k].Derived;
        tmpArray[k][6] = mirnaobj[k].SNP;
        tmpArray[k][7] = mirnaobj[k].Whole_Genome;
        tmpArray[k][8] = mirnaobj[k].Whole_Exome;
        tmpArray[k][9] = mirnaobj[k].Mutation_Distance;
        tmpArray[k][10] = mirnaobj[k].miR2GO_Execution_Sequence;
        tmpArray[k][11] = mirnaobj[k].Cancer_Type;
      }

      $(document).ready(function () {   
        $('#storeTable').DataTable({
          "pageLength": 3,
          "scrollX": true,
	  "searching" : false,
          data:tmpArray,
          columns: [{ title: "microRNA" },{ title: "Strand" },{ title: "Mutation_ID" },{ title: "COSMIC_ID" },{ title: "Reference" },
                    { title: "Derived" },{ title: "SNP" },{ title: "Whole_Genome" },{ title: "Whole_Exome" },{ title: "Mutation_Distance"},
                    { title: "Execution_Sequence" },{ title: "Cancer_Type" }],
          dom: 'Bfrtip',
          buttons: ['copy',
             {extend:'csv', title:"SomamiR_" + mirnaobj[0].microRNA},
             {extend:'excel', title:"SomamiR_" + mirnaobj[0].microRNA},
             {extend:'pdfHtml5', title:"SomamiR_" + mirnaobj[0].microRNA, orientation:'landscape',pageSize:'LEGAL'},
             {extend:'print', title:"SomamiR_" + mirnaobj[0].microRNA}]
	});
      });
      break;
    case "mirbase":
      var mirnaobj = miRNA_mirbase_DATA.get(mirnaNodeId);
      var isValid = Is_MIRNA_mRNA_ValidInfo("MIRNA",mirnaobj);

      if (!isValid) break;
      _tblView.ptopen("miRBase Database");
      for(var k = 0 ; k < mirnaobj.length ; k++) {
        tmpArray[k] = [];
        createUrl = "http://www.mirbase.org/cgi-bin/mirna_entry.pl?acc=" + mirnaobj[k].Accession;
        tmpArray[k][0] = mirnaobj[k].microRNA;
        tmpArray[k][1] = "<a href=\"" + createUrl + "\" target='_blank'>" + mirnaobj[k].Accession+ "</a>"; 
        tmpArray[k][2] = mirnaobj[k].Sequence;
        tmpArray[k][3] = mirnaobj[k].Mature1_ID;
        tmpArray[k][4] = mirnaobj[k].Mature1_Seq;
        tmpArray[k][5] = mirnaobj[k].Mature2_ID;
        tmpArray[k][6] = mirnaobj[k].Mature2_Seq;
      }

      $(document).ready(function () {   
        $('#storeTable').DataTable({
          "pageLength": 3,
          "scrollX": true,
          "searching" : false,
          data:tmpArray,
          columns: [{ title: "microRNA" },{ title: "Accession" },{ title: "Sequence" },{ title: "Mature1_ID" },{ title: "Mature1_Seq" },
                    { title: "Mature2_ID" },{ title: "Mature2_Seq" }],
          dom: 'Bfrtip',
          buttons: ['copy',
            {extend:'csv', title:"miRBase_" + mirnaobj[0].microRNA},
            {extend:'excel', title:"miRBase_" + mirnaobj[0].microRNA},
            {extend:'pdfHtml5', title:"miRBase_" + mirnaobj[0].microRNA, orientation:'landscape',pageSize:'LEGAL'},
            {extend:'print', title:"miRBase_" + mirnaobj[0].microRNA}]
	});
      });
      break;
    case "KEGG":
      var isValid = false;
      if(sampleCancerSelectedFile == "BLCA" || sampleCancerSelectedFile == "BRCA" || sampleCancerSelectedFile == "COAD" ||
	 sampleCancerSelectedFile == "ESCA" || sampleCancerSelectedFile == "LUAD" || sampleCancerSelectedFile == "LUSC" ||
	 sampleCancerSelectedFile == "PRAD") 		 
	  isValid = true;
      else
	Is_MIRNA_mRNA_ValidInfo("MIRNA", false);

      if (!isValid) break;
      _tblView.tpopen("KEGG Database");
      createUrl = "http://www.genome.jp/kegg-bin/show_pathway?hsa05206";

      tmpArray[0] = [];
      tmpArray[0][0] = "<a href=\"" + createUrl + "\" target='_blank'>"+mirnaNodeId+"</a>"; 

      $(document).ready(function () {   
        $('#storeTable').DataTable({
          "pageLength": 3,
          "scrollX": true,
          data:tmpArray,
          columns: [{ title: "KEGG microRNA pathway" }],
          dom: 'Bfrtip',
	  searching: false,
          buttons: ['copy',
            {extend:'csv', title:"KEGG_" + mirnaNodeId},
            {extend:'excel', title:"KEGG_" + mirnaNodeId},
            {extend:'pdfHtml5', title:"KEGG_" + mirnaNodeId, orientation:'landscape',pageSize:'LEGAL'},
            {extend:'print', title:"KEGG_" + mirnaNodeId}]
	});
      });
      break;
  }
}

function viewInfo_MRNA(typeOfmRNA){
  _ctxtMenu.close();
  _tblView.ptinit();
  
  if(mrnaNodeId == false) {
    Is_MIRNA_mRNA_ValidInfo("mRNA", false); 
  }
  var tmpArray = [];
  switch(typeOfmRNA) {
    case "DAVID":
      var mrnaobj = mRNA_DAVID_DATA.get(mrnaNodeId);
      var isValid = Is_MIRNA_mRNA_ValidInfo("mRNA",mrnaobj);

      if (!isValid) break;
      _tblView.ptopen("DAVID Database");
      for(var k = 0 ; k < mrnaobj.length ; k++) {
        tmpArray[k] = [];
        tmpArray[k][0] = mrnaobj[k].genename;
        tmpArray[k][1] = mrnaobj[k].mRNA;
        tmpArray[k][2] = mrnaobj[k].chromosome;
        tmpArray[k][3] = mrnaobj[k].generifsummary;
        tmpArray[k][4] = mrnaobj[k].cogontology;
        tmpArray[k][5] = mrnaobj[k].OMIMDisease;
        tmpArray[k][6] = mrnaobj[k].bbid;
        tmpArray[k][7] = mrnaobj[k].bind;
        tmpArray[k][8] = mrnaobj[k].prosite;
        tmpArray[k][9] = mrnaobj[k].pantherpathway;
        tmpArray[k][10] = mrnaobj[k].rectomepathway;
      }
      $(document).ready(function () {   
        $('#storeTable').DataTable({
          "pageLength": 3,
          data:tmpArray,
          "scrollX": true,
          columns: [{ title: "Genename" },{ title: "mRNA" },{ title: "Chromosome" },{ title: "Generif Summary" },
                    { title: "cogontology" },{ title: "Omim Disease" },{ title: "BBID" },{ title: "BIND" },
                    { title: "Prosite" },{ title: "Panther Pathway" },{ title: "Rectome Pathway" }],
          dom: 'Bfrtip',
          buttons: ['copy',
            {extend:'csv', title:"DAVID_" + mrnaobj[0].mRNA},
            {extend:'excel', title:"DAVID_" + mrnaobj[0].mRNA},
            {extend:'pdfHtml5', title:"DAVID_" + mrnaobj[0].mRNA, orientation:'landscape',pageSize:'LEGAL'},
            {extend:'print', title:"DAVID_" + mrnaobj[0].mRNA}]
	});
      });
      break;
    case "COSMIC_CancerGeneCensus":
      var mrnaobj = mRNA_COSMIC_CancerGeneCensus_DATA.get(mrnaNodeId);
      var isValid = Is_MIRNA_mRNA_ValidInfo("mRNA",mrnaobj);
      if (!isValid) break;

      _tblView.ptopen('<span><img src="img/logo_cosmic.png" style="padding:2%;width:65%;"></img></span><br>COSMIC - "Cancer Gene Census" Database');
      for(var k = 0 ; k < mrnaobj.length ; k++) {
        tmpArray[k] = [];
        tmpArray[k][0] = mrnaobj[k].mRNA;
        tmpArray[k][1] = mrnaobj[k].name;
        tmpArray[k][2] = mrnaobj[k].genomeLocation;
        tmpArray[k][3] = mrnaobj[k].ChrBand;
        tmpArray[k][4] = mrnaobj[k].somatic;
        tmpArray[k][5] = mrnaobj[k].tumourTypesSomatic;
        tmpArray[k][6] = mrnaobj[k].tumourTypesGermline;
        tmpArray[k][7] = mrnaobj[k].tissueType;
        tmpArray[k][8] = mrnaobj[k].mutationTypes;
        tmpArray[k][9] = mrnaobj[k].translocationPartner;
        tmpArray[k][10] = mrnaobj[k].synonyms;
      }
      $(document).ready(function () {   
        $('#storeTable').DataTable({
          "pageLength": 3,
          data:tmpArray,
          "scrollX": true,
          columns: [{ title: "Genen Symbol" },{ title: "Name" },{ title: "Genome Location" },{ title: "Chr Band" },
                    { title: "Somatic" },{ title: "Tumour Types(Somatic)" },{ title: "Tumour Types(Germline)" },{ title: "Tissue Type" },
                    { title: "Mutation Types" },{ title: "Translocation Partner" },{ title: "Synonyms" }],
          dom: 'Bfrtip',
          buttons: ['copy',
            {extend:'csv', title:"COSMIC_CancerGeneCensus_" + mrnaobj[0].mRNA},
            {extend:'excel', title:"COSMIC_CancerGeneCensus_" + mrnaobj[0].mRNA},
            {extend:'pdfHtml5', title:"COSMIC_CancerGeneCensus_" + mrnaobj[0].mRNA, orientation:'landscape',pageSize:'LEGAL'},
            {extend:'print', title:"COSMIC_CancerGeneCensus_" + mrnaobj[0].mRNA}]
	});
      });
      $('#storeTable').DataTable().buttons().disable();
      break;
    case "COSMIC_ResistanceMutation":
      var mrnaobj = mRNA_COSMIC_ResistanceMutation_DATA.get(mrnaNodeId);
      var isValid = Is_MIRNA_mRNA_ValidInfo("mRNA",mrnaobj);
      if (!isValid) break;

      _tblView.ptopen('<span><img src="img/logo_cosmic.png" style="padding:2%;width:65%;"></img></span><br>COSMIC - "Resistance Mutation" Database');
      for(var k = 0 ; k < mrnaobj.length ; k++) {
        tmpArray[k] = [];
        tmpArray[k][0] = mrnaobj[k].mRNA;
        tmpArray[k][1] = mrnaobj[k].transcript;
        tmpArray[k][2] = mrnaobj[k].drugName;
        tmpArray[k][3] = mrnaobj[k].ID_Mutation;
        tmpArray[k][4] = mrnaobj[k].AA_Mutation;
        tmpArray[k][5] = mrnaobj[k].primaryTissue;
        tmpArray[k][6] = mrnaobj[k].Pubmed_ID;
        tmpArray[k][7] = mrnaobj[k].somaticStatus;
        tmpArray[k][8] = mrnaobj[k].genomeCoordinates;
      }
      $(document).ready(function () {   
        $('#storeTable').DataTable({
          "pageLength": 3,
          data:tmpArray,
          "scrollX": true,
          columns: [{ title: "Genen Name" },{ title: "Transcript" },{ title: "Drug Name" },{ title: "ID Mutation" },
                    { title: "AA Mutation" },{ title: "Primary Tissue" },{ title: "Pubmed ID" },{ title: "Somatic Status" },
                    { title: "Genome Coordinates" }],
          dom: 'Bfrtip',
          buttons: ['copy',
            {extend:'csv', title:"COSMIC_ResistanceMutation_" + mrnaobj[0].mRNA},
            {extend:'excel', title:"COSMIC_ResistanceMutation_" + mrnaobj[0].mRNA},
            {extend:'pdfHtml5', title:"COSMIC_ResistanceMutation_" + mrnaobj[0].mRNA, orientation:'landscape',pageSize:'LEGAL'},
            {extend:'print', title:"COSMIC_ResistanceMutation_" + mrnaobj[0].mRNA}]
	});
      });
      $('#storeTable').DataTable().buttons().disable();
      break;
    case "COSMIC_TargetedScreensMutantExport":
      var mrnaobj = mRNA_COSMIC_TargetedScreensMutantExport_DATA.get(mrnaNodeId);
      var isValid = Is_MIRNA_mRNA_ValidInfo("mRNA",mrnaobj);
      if (!isValid) break;

      _tblView.ptopen('<span><img src="img/logo_cosmic.png" style="padding:2%;width:65%;"></img></span><br>COSMIC - "Targeted Screens Mutant Export" Database');
      for(var k = 0 ; k < mrnaobj.length ; k++) {
        tmpArray[k] = [];
        tmpArray[k][0] = mrnaobj[k].mRNA;
        tmpArray[k][1] = mrnaobj[k].accessionNumber;
        tmpArray[k][2] = mrnaobj[k].geneCDS_Length;
        tmpArray[k][3] = mrnaobj[k].primarySite;
        tmpArray[k][4] = mrnaobj[k].mutationID;
        tmpArray[k][5] = mrnaobj[k].mutationCDS;
        tmpArray[k][6] = mrnaobj[k].mutationAA;
        tmpArray[k][7] = mrnaobj[k].mutationDescription;
        tmpArray[k][8] = mrnaobj[k].mutationZygosity;
        tmpArray[k][9] = mrnaobj[k].mutationGenomePosition;
        tmpArray[k][10] = mrnaobj[k].mutationStrand;
        tmpArray[k][11] = mrnaobj[k].SNP;
        tmpArray[k][12] = mrnaobj[k].FATHMM_Prediction;
        tmpArray[k][13] = mrnaobj[k].FATHMM_Score;
        tmpArray[k][14] = mrnaobj[k].Pubmed_PMID;
      }
      $(document).ready(function () {   
        $('#storeTable').DataTable({
           "pageLength": 3,
           data:tmpArray,
           "scrollX": true,
           columns: [{ title: "Genen Name" },{ title: "Accession Number" },{ title: "Gene CDS length" },{ title: "Primary Site" },
                     { title: "Mutation ID" },{ title: "Mutation CDS" },{ title: "Mutation AA" },{ title: "Mutation Description" },
                     { title: "Mutation Zygosity" },{ title: "Mutation Genome Position" },{ title: "Mutation Strand" },
                     { title: "SNP" },{ title: "FATHMM Prediction" },{ title: "FATHMM Score" },{ title: "Pubmed_PMID" }],
           dom: 'Bfrtip',
           buttons: ['copy',
             {extend:'csv', title:"COSMIC_TargetedScreensMutantExport_" + mrnaobj[0].mRNA},
             {extend:'excel', title:"COSMIC_TargetedScreensMutantExport_" + mrnaobj[0].mRNA},
             {extend:'pdfHtml5', title:"COSMIC_TargetedScreensMutantExport_" + mrnaobj[0].mRNA, orientation:'landscape',pageSize:'LEGAL'},
             {extend:'print', title:"COSMIC_TargetedScreensMutantExport_" + mrnaobj[0].mRNA}]
	});
      });
      $('#storeTable').DataTable().buttons().disable();
      break;
    case "KEGG":
      var isValid = false;
      var keggCancerType = "None";
      
      switch (sampleCancerSelectedFile) {
	case "BLCA": keggCancerType = "hsa05219"; break;
	case "BRCA": keggCancerType = "hsa05224"; break;
	case "COAD": keggCancerType = "hsa05210"; break;
	case "ESCA": break;
	case "HNSC": break;
	case "KICH": keggCancerType = "hsa05211"; break;
	case "KIRC": keggCancerType = "hsa05211"; break;
	case "KIRP": keggCancerType = "hsa05211"; break;
	case "LIHC": break;
	case "LUAD": keggCancerType = "hsa05223"; break;		
	case "LUSC": keggCancerType = "hsa05222"; break;
	case "PRAD": keggCancerType = "hsa05215"; break;
	case "STAD": break;
	case "THCA": keggCancerType = "hsa05216"; break;
	case "UCEC": break;		
      }
      
      if(keggCancerType != "None") isValid = true;
      else {
	Is_MIRNA_mRNA_ValidInfo("mRNA", false);
	break;
      }
      if (!isValid) break;
      _tblView.ptopen("KEGG Database");
      createUrl = "http://www.genome.jp/kegg-bin/show_pathway?" + keggCancerType;

      tmpArray[0] = [];
      tmpArray[0][0] = "<a href=\"" + createUrl + "\" target='_blank'>"+mrnaNodeId+"</a>"; 

      $(document).ready(function () {   
        $('#storeTable').DataTable({
          "pageLength": 3,
          "scrollX": true,
          data:tmpArray,
          columns: [{ title: "KEGG mRNA pathway" }],
          dom: 'Bfrtip',
          searching: false,
          buttons: ['copy',
            {extend:'csv', title:"KEGG_" + mrnaNodeId},
            {extend:'excel', title:"KEGG_" + mrnaNodeId},
            {extend:'pdfHtml5', title:"KEGG_" + mrnaNodeId, orientation:'landscape',pageSize:'LEGAL'},
            {extend:'print', title:"KEGG_" + mrnaNodeId}]
	});
      });
      break;
  }
}

function Is_MIRNA_mRNA_ValidInfo(kindOfRna, tmpObj) {
  if(!tmpObj) {
    var putTableStore = document.getElementById("putTable");
    putTableStore.style.display = "block";  
    putTableStore.innerHTML = "<p>The " + (kindOfRna == "MIRNA"? "microRNA" : "mRNA") +
      " you are looking for, is not present in the Database </p>";
    return false;
  }
  return true; 
}


function toggleElement(eid, buttonid) {
  var e = document.getElementById(eid);
  var b = document.getElementById(buttonid);
  if (e.style.display == "table") {
    e.style.display = "none";
    b.style.display = "table";
  } else {
    e.style.display = "table";
    b.style.display = "none";
  }
}

// function to toggle HMDD MiRNA-Associated Diseases Table (Harini)
function togglehmdd() {
  toggleElement("mirnafilter", "hmddbutton");
}

// function to toggle HMDD Disease-Associated MiRNAS Table (Harini)
function togglehmdd2() {
  toggleElement("diseasefilter", "hmddbutton2");
}

/* End of functions to toggle the filter and mirna-disease buttons (Harini)*/

function togglelegend() {
  toggleElement("legend", "lbutton");
}

function togglefilter() {
  toggleElement("filter", "fbutton");
}
