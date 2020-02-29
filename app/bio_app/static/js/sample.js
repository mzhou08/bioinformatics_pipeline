
var fromServer = -1;
var loadName;
var clusterData = null;

function newGraphEntry(entry) {
  //TODO do some sort of format validation for the file from user

  var mRNAData = new MapDataEntry( "mRNA", entry.mRNA, entry.mRNA_FC);
  var miRNAData = new MapDataEntry( "miRNA", entry.microRNA, entry.miRNA_FC);

  var linkData = new LinkEntry(
    entry.T_CC,
    entry.T_P,
    entry.T_FDR,
    entry.N_CC,
    entry.N_P,
    entry.N_FDR,
    entry.Targetprofiler,
    entry.Targetscan,
    entry.MiRanda
  );
          
  graph.addNode(entry.mRNA, mRNAData);
  graph.addNode(entry.microRNA, miRNAData);
  graph.addLink(entry.mRNA, entry.microRNA, linkData);  
}

function loadFile(fileText) {
  var sampleSelect = document.getElementById("sampleSelect");
  var sample = sampleSelect.selectedIndex = 0;

  resetAll();
  clearGraph();

  d3.tsv.parse(fileText,newGraphEntry);

  return false;
}

function setClusterSelect(qv) {
  var data = clusterData;
  var q_value = 2;

  var csel = document.getElementById("clusterSelect");
  csel.innerHTML = "";
  var cluster = 1;
  for(var i=1; i < data.length; i++) {
    if (data[i][q_value] < qv) {
      var opt = new Option("community " + data[i][0] + " q-value= " +data[i][q_value].toFixed(7), i, true, true);
      csel.appendChild(opt);
      cluster++;
    }
  }
}

// community,p_GM,q_GM,p_MM,q_MM,p_density,q_density,p_average,q_average,p_sum,
//   q_sum,GM,MM,Density,Average,Sum,Tumor Sum,Normal Sum,mRNA/miRNA

function loadClusterViewFile(fileText) {
  var q_value = 2;
  var rnas = 21;

  var data = CSVToArray(fileText);
  if (data == null) return console.log("No data in the cluster CSV file.");
  clusterData = data;
  document.getElementById("clusterQV").value = 1.0;
  for(var i=1; i < data.length; i++) {
    data[i][q_value] = parseFloat(data[i][q_value]);
    if (data[i][rnas] != undefined) {
      data[i][rnas] = JSON.parse(data[i][rnas].replace(/'/g,'"'));/*.split(" ");*/
    }
  }
  setClusterSelect(1.0);

//   var csel = document.getElementById("clusterSelect");
//   var cluster = 1;
//   for(var i=1; i < data.length; i++) {
//     data[i][q_value] = parseFloat(data[i][q_value]);
//     if (data[i][rnas] != undefined) {
//       data[i][rnas] = data[i][rnas].split(" ");
//     }
//     if (data[i][q_value] < 1.0) {
//       var opt = new Option("cluster " + cluster + " q-value= " +data[i][q_value].toFixed(7), i, true, true);
//       csel.appendChild(opt);
//       cluster++;
//     }
//   }
  filterClusters();
  return false;
}

function useClusterSample(sampleSelect) {
  sampleSelectedFile = sampleSelect.options[sampleSelect.selectedIndex].text;

  if (sampleSelectedFile == "None") return;

  var req = new XMLHttpRequest();
  req.open('GET',"netx/samples/" + sampleSelectedFile , true);
  req.onreadystatechange = function(evt) {
    if (req.readyState == 4 && req.status == 200)
      loadClusterViewFile(req.responseText);
  }
  req.send();
  sampleSelect.selectedIndex = 0;
}

function readSingleFile(evt, callback) {
  var f = evt.target.files[0];

  if (f) {
    var r = new FileReader();
    r.onload = function(e) {
      var contents = e.target.result;

      fromServer = false;
      loadName = contents;

      callback(contents);	
    };
    r.readAsText(f);
  } else { 
    alert("Failed to load file.");
  }
}

function loadFromFile(fileName)
{
  resetAll();
  clearGraph();

  document.getElementById('fileinput').value = "";
  loadName = fileName;
    
  d3.tsv(fileName, function(d) {
    d.forEach(newGraphEntry);
  });
  fromServer = true;

  return false;
}

function removesid(sid)
{
  var subs = JSON.parse(localStorage.getItem("submissions"));
  for(var i=0; i < subs.length; i++) {
    if (subs[i].sid == sid) {
      subs.splice(i,1);
      break;
    }
  }
  if (subs.length == 0) subs = null;
  localStorage.setItem("submissions", JSON.stringify(subs));
  showSubmissions();
}

function addSubmission(sub)
{
  var subs = JSON.parse(localStorage.getItem("submissions"));
  if (subs == null) subs = [];
  subs.push(sub);
  localStorage.setItem("submissions", JSON.stringify(subs));
}

function tag(type, attr, children, text) {
  var t = document.createElement(type);
  if (attr) {
    for (var a in attr) {
      t.setAttribute(a,attr[a]);
    }
  }
  if (children) {
    for(var i=0; i<children.length; i++) t.appendChild(children[i]);
  }
  if (text != null) {
    t.innerHTML = text;
  }
  return t;
}

function getStatus(sid, td, tr) {
  var req = new XMLHttpRequest();
  req.open('GET', 'netx/status.php?sid='+sid, true);
  req.onreadystatechange = function(evt) {
    if (req.readyState == 4) {
      if (req.status == 200) {
	var sub = JSON.parse(req.responseText);
	if ("status" in sub) {
	  td.innerHTML = sub.status;
	  if ("class" in sub) td.classList = sub.class;
	} else td.innerHTML = "Status update error";
	if ("download" in sub) {
	  console.log("sub.download = ", sub.download);
	  tr.setAttribute("onclick", "window.open('" + sub.download + "','_blank');");
	  tr.style.cursor = "pointer";
	}
	if ("remove" in sub) {
	  var subs = JSON.parse(localStorage.getItem("submissions"));
	  subs.forEach(function(s) {
	    if (s.sid == sid) {
	      s.remove = true;
	      td.innerHTML += "<button onclick='removesid(\""+s.sid+"\");'> Remove </button>";
	    }
	  });
	}
      } else td.innerHTML = "Status update failed";
    }
  }
  req.send();
}
function showjob(sid)
{
  window.open("clusterview.php?sid="+sid, "_blank");
}

function showSubmissions()
{
  var subs = JSON.parse(localStorage.getItem("submissions"));
  if (subs == null) {
    window.alert("No submissions with this browser have been recorded");
    return;
  }
  var sm = document.getElementById('submissions');
  if (sm != null) sm.style.display = "block";
  var st = document.getElementById('subtbl');
  st.innerHTML = "";
  subs.forEach(function(s) {
    var stat = tag("td", null, null, "...");
//     if (s.download) attr = { onclick: "window.open('"+s.download+"','_blank');" };
    var e = tag("tr", null, [
      tag("td", null, null, s.sid),
      tag("td", null, null, s.name),
      tag("td", null, null, s.runs),
      tag("td", null, null, s.date),
      stat
    ],null);
    getStatus(s.sid, stat, e);
    st.appendChild(e);
  });
}

function hideSubmissions()
{
  var sm = document.getElementById('submissions');
  sm.style.display = "none";
}

/**
 * ref: http://stackoverflow.com/a/1293163/2343
 * This will parse a delimited string into an array of arrays. The default
 * delimiter is the comma, but this can be overriden in the second argument.
 */
function CSVToArray( strData, strDelimiter ){
  // Check to see if the delimiter is defined. If not, then default to comma.
  strDelimiter = (strDelimiter || ",");

  // Create a regular expression to parse the CSV values.
  var objPattern = new RegExp((
    // Delimiters.
    "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +
    // Quoted fields.
    "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +
    // Standard fields.
    "([^\"\\" + strDelimiter + "\\r\\n]*))"
  ), "gi");

  // Create an array to hold our data. Give the array a default empty first row.
  var arrData = [[]];

  // Create an array to hold our individual pattern matching groups.
  var arrMatches = null;
  var gotData = false;

  // Keep looping over the regular expression matches until we can no longer find a match.
  while (arrMatches = objPattern.exec( strData )){
    // Get the delimiter that was found.
    var strMatchedDelimiter = arrMatches[ 1 ];

    // Check to see if the given delimiter has a length (is not the start of
    // string) and if it matches field delimiter. If id does not, then we know
    // that this delimiter is a row delimiter.
    if (strMatchedDelimiter.length && strMatchedDelimiter !== strDelimiter) {
      // Since we have reached a new row of data, add an empty row to our data array.
      arrData.push( [] );
    }

    var strMatchedValue;

    // Now that we have our delimiter out of the way, let's check to see which
    // kind of value we captured (quoted or unquoted).
    if (arrMatches[2]) {
      // We found a quoted value. When we capture this value, unescape any double quotes.
      strMatchedValue = arrMatches[2].replace(new RegExp( "\"\"", "g" ), "\"");
    } else {
      // We found a non-quoted value.
      strMatchedValue = arrMatches[3];
    }

    // Now that we have our value string, let's add it to the data array.
    arrData[ arrData.length - 1 ].push( strMatchedValue );
    gotData = true;
  }
  // Didn't put anything into the array, so return null instead:
  if (gotData == false) return null;

  // Return the parsed data.
  return( arrData );
}

function clusterupload() {
  var form = new FormData();
  var file = document.getElementById("ccfile").files[0];
  var sample = document.getElementById("ccsample").value;
  var email = document.getElementById("ccemail").value;
  var runs = document.getElementById("ccruns").value;

  if (file) form.append('input',file, file.name);
  if (sample) form.append('sample', sample);
  form.append('email',email);
  form.append('runs' ,runs);

  var req = new XMLHttpRequest();
  req.open('POST', 'netx/netxupload.php', true);
  req.onreadystatechange = function(evt) {
    if (req.readyState == 4) {
      if (req.status == 200) {
	var sub = JSON.parse(req.responseText);
	if ("sid" in sub) addSubmission(sub);
        window.alert(sub.alert);
      } else window.alert(req.responseText);
    }
  }
  req.send(form);
  document.getElementById("ccfile").value = "";
  //document.getElementById("ccemail").value = "";
  document.getElementById("ccruns").value = 1;
}
