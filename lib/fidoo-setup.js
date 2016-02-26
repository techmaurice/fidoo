// fidoo-setup.js
// belongs to fidoo-core, not mandatory, only used to configure stuff
// so you don't have to meddle with the library
// NOTICE: you have to EXPLICITLY set `useSetup` to true
// otherwise it is not used

var FidooUserSetup = {
	// NOTICE:
	// set this to true to use these settings
	// if not set to false
	useSetup: false,
	
	// set this to true for informational and more descriptive error messages
	debug: false,
	
	// this is the average chunksize needed to identify 
	// most BOF/EOF signatures
	// some signatures have 64kb wildcards *{x,65535}
	// if you have problems with these particular ones
	// set chunkSize to at least 16kb + 64kb = 80kb
	chunkSize: (1024) * 16, // kb, default = 16
	
	// whether or not to exit in node.js
	// if a fatal error occurs with Fidoo
	// this might not be desirable in some applications
	exitOnFatalNodeJS: true, 

	// set exitMethodNodeJS to "function() { process.exit(1) }"
	// to exit with error
	// or call your own handler, "message" available
	// exitMethodNodeJS: function(message) { your.Handler(message) },
	exitMethodNodeJS: function(message) { process.exit(1) },

	// strict: VAR + EOF signatures are only searched if BOF is true
	// relaxed: VAR + EOF signatures are always searched
	// even though there is no BOF match
	matchingMethod: "strict",

	// if disablePriority is `true` 
	// formats with lower priority will also be shown in the results
	disablePriority: false,

	/* You want to change this *only* if locations or signatures are updated or if you change the paths */
	formatExtensionsJSON: "formatExtensions-v84-0.json",
	mimePuidMapFixesJSON: "mimePuidMapFixes-v84-0.json",
	pathBrowserJSON: "./json/",
	pathNodeJSON: "../json/",
	pronomSignaturesJSON: "pronomSignatures-v84-0.json",
	rawGitUrl: "https://cdn.rawgit.com/techmaurice/fidoo/master/json/",
};

// needed for node.js
if(typeof module !== "undefined") {
	module.exports = FidooUserSetup;
	}
