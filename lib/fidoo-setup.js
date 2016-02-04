// fidoo-setup v0.1
// belongs to fidoo-core, not mandatory, only used to configure stuff
// Browser and node.js compatible
// By Maurice de Rooij (TechMaurice), 2016
// https://github.com/techmaurice/fidoo/

var FidooUserSetup = { // all or each can be overridden
	maxFiles: 250, // at a time
	cacheJSON: 30, // days, in HTML5 storage
};

var FidooCSS = { // all or each can be overridden
	fileListBgColor: "white", // #ffffff
	fileListBgAltColor: "gray", // #f0f0f0
	dropFilesDragColor: "green", // #00ff00
};

/* WARNING: do not edit below unless you know what you are doing */

var FidooConfiguration = { // all or each can be overridden
	appVersion: "0.5", // informational
	chunkLength: 4096,	// number of bytes read per chunk
	pronomSignatureVersion: "84", // you probably don't want to change this
};

/* You want to change this *only* if locations or signatures are updated */
var FidooDataUrls =  {
	rawGitUrl: "https://cdn.rawgit.com/techmaurice/fidoo/master/json/",
	nodeJSON: "../json/",
	pronomSignaturesJSON: "pronomSignatures-v84-0.json",
	extensionPuidMapJSON: "extensionPuidMap-v84-0.json",
	mimePuidMapJSON: "mimePuidMap-v84-0.json",
};
