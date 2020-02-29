
var _DBdir = "data";

// to load additional data from HMDD Genetics (Harini)
var HMDD_GeneticsFile	= _DBdir+"/HMDD_GENETICS.all";
var miRNA_HMDD_Genetics_DATA;
// to load additional data from HMDD Epigenetics (Joey)
var HMDD_EpigeneticsFile= _DBdir+"/HMDD_Epigenetics.all";
var miRNA_HMDD_Epigenetics_DATA;
// to load additional data from HMDD Target (Joey)
var HMDD_TargetFile	= _DBdir+"/HMDD_Target.all";
var miRNA_HMDD_Target_DATA;
// to load additional data from DAVID Database (Harini)
var DavidFile		= _DBdir+"/DAVID_DB.all";
var mRNA_DAVID_DATA;
// to load additional data from SomamiR Database (Abhijit)
var SomamiRFile		= _DBdir+"/SomamiR.all";
var miRNA_SomamiR_DATA;
// to load additional data from miRbase Database (Abhijit)
var mirbaseFile		= _DBdir+"/mirbase.all";
var miRNA_mirbase_DATA;

// start of cosmic integration (cosmic database) [Joey]
var COSMIC_CancerGeneCensusFile			= _DBdir+"/COSMIC_CancerGeneCensus.all";
var mRNA_COSMIC_CancerGeneCensus_DATA;
var COSMIC_ResistanceMutationFile		= _DBdir+"/COSMIC_ResistanceMutations.all";
var mRNA_COSMIC_ResistanceMutation_DATA;
var COSMIC_TargetedScreensMutantExportFile	= _DBdir+"/COSMIC_TargetedScreensMutantExport.all";
var mRNA_COSMIC_TargetedScreensMutantExport_DATA;

/**
 * ABHIJIT: Key optimizer will search for sub keys in the ma
 */
function keyOptimizer(newEntry) {
  var tmpEntry = "", rep = '-', stopper = 0;
  
  if (newEntry.match(/-/g).length > 2) {
    for(var i=0;i < newEntry.length;i++) {
      if (newEntry[i] == rep) stopper++;
      if (stopper <= 2) tmpEntry += newEntry[i] ; 
    }
  } else return newEntry;

  return tmpEntry;
}

/**
 * ABHIJIT : Store each entry in an array, so that the objects with similar key
 * value can be pushed in the key specific array
 */
/**
 * Loads a database file.  Entries are organized by 'keyname', if optimize is
 * true, then keyOptimizer is used on the entry's key.
 *
 * Returns the loaded database.
 */
function loadDB(file, keyname, optimize) {
  var db = d3.map();

  d3.tsv(file,function(data) {
    if (data == null) console.log("data null for " + file);
    data.forEach(function(entry) {
      var key = (optimize? keyOptimizer(entry[keyname]): entry[keyname]);
      if(db.get(key) === undefined)
         db.set(key, [entry]);      
      else
        db.get(key).push(entry);
    });
  });
  return db;
}

/**
 * Load Database Files pertaining to gene and microRNA
 */
function loadDBFiles() {
  miRNA_HMDD_Genetics_DATA	= loadDB(HMDD_GeneticsFile, "microRNA", false);
  miRNA_HMDD_Epigenetics_DATA	= loadDB(HMDD_EpigeneticsFile, "microRNA", false);
  miRNA_HMDD_Target_DATA	= loadDB(HMDD_TargetFile, "microRNA", false);
  mRNA_DAVID_DATA		= loadDB(DavidFile, "mRNA", false);
  miRNA_SomamiR_DATA		= loadDB(SomamiRFile, "microRNA", true);
  miRNA_mirbase_DATA		= loadDB(mirbaseFile, "microRNA", true);
  mRNA_COSMIC_CancerGeneCensus_DATA 		= loadDB(COSMIC_CancerGeneCensusFile, "mRNA", false);
  mRNA_COSMIC_ResistanceMutation_DATA		= loadDB(COSMIC_ResistanceMutationFile, "mRNA", false);
  mRNA_COSMIC_TargetedScreensMutantExport_DATA	= loadDB(COSMIC_TargetedScreensMutantExportFile, "mRNA", false);
}
