// fidoo-core
// Browser and node.js compatible
// By Maurice de Rooij (TechMaurice), 2016
// https://github.com/techmaurice/fidoo/

(function(global){
	"use strict";	// this is a Javascript directive 
					// and has nothing to do with "strict" matching
	function defineFidoo(){
		var Fidoo = {
		chunkSize: (1024) * 16, // kb, default = 16
		debug: false,
		disablePriority: false,
		exitOnFatalNodeJS: true, // whether or not to exit in node.js
		extensionPuidMap: {},
		extensionPuidMapJSON: "extensionPuidMap-v84-0.json",
		fidooSignatureFixesJSON: "fidooSignatureFixes-v84-0.json",
		formatExtensionsJSON: "formatExtensions-v84-0.json",
		libVersion: "0.1.2",
		signatureMapJSON: {extensionPuidMap: "extensionPuidMapJSON", fidooSignatureFixes: "fidooSignatureFixesJSON", formatExtensions: "formatExtensionsJSON", mimePuidMap: "mimePuidMapJSON", pronomSignatures: "pronomSignaturesJSON"},
		matchingMethod: "strict",
		mimePuidMap: {},
		mimePuidMapJSON: "mimePuidMap-v84-0.json",
		pathBrowserJSON: "./json/",
		pathNodeJSON: "../json/",
		pronomSignatures: {},
		pronomSignaturesJSON: "pronomSignatures-v84-0.json",
		pronomSignatureVersion: 84,
		rawGitUrl: "https://cdn.rawgit.com/techmaurice/fidoo/master/json/",
		regexesMap: {},
		setupFile: "./fidoo-setup.js",
		};

/* error handling functions ******************************** */

		// not yet used because Chrome chokes
		// and node.js needs more flexibility
		// both need a fix:
		// https://github.com/techmaurice/fidoo/issues/11
		Fidoo.setConsoles = function(which) {
			if(which === "nodeJS") {
				Fidoo.consoleFatal = console.error;
				Fidoo.consoleDebug = console.error;			
				}
			if(which == "browser") {
				Fidoo.consoleFatal = console.error;
				Fidoo.consoleDebug = console.log;
				}
			} // end setConsoles

		Fidoo.logHandler = function(error_type, message) {
			var message = "Fidoo " + error_type + ": " + message;
			if(error_type === "fatal error") {
				console.error(message);
				if(typeof process !== "undefined" && Fidoo.exitOnFatalNodeJS) {
					process.exit(1); // 1 because it is a fatal error
					}
				}
			if(Fidoo.debug === true) {
				console.log(message);
				// no exit because it is informational
				}
			} // end logHandler

/* common functions ************************************************* */

		Fidoo.readSetup = function(which) {
			if(which == "nodeJS") {
				try {
					var FidooUserSetup = require(Fidoo.setupFile);
					if(FidooUserSetup.useSetup == true) {
						Fidoo.debug = FidooUserSetup.debug;
						Fidoo.logHandler("info", "Loading FidooUserSetup");
						for(var setting in FidooUserSetup) {
							Fidoo[setting] = FidooUserSetup[setting];
							}
						}
					}
				catch(error) {
					Fidoo.logHandler("info", "FidooUserSetup not found: " + String(error));
					}
				}			
			if(which == "browser") {
				if(window.FidooUserSetup && window.FidooUserSetup.useSetup == true) {
					Fidoo.debug = window.FidooUserSetup.debug;
					Fidoo.logHandler("info", "Loading FidooUserSetup");
					for(var setting in window.FidooUserSetup) {
						Fidoo[setting] = window.FidooUserSetup[setting];
						}
					}
				}
			} // end readSetup
					
		Fidoo.dumpObject = function(object) {
			if(Fidoo.debug === true) {
				if(typeof process !== "undefined") {
					var util = require("util");
					console.log(util.inspect(object, false, null));
					}
				else {
					console.dir(object);
					}
				}
			} // end dumpObject

/* browser functions ************************************************ */

		Fidoo.prepareForBrowser = function() {
			Fidoo.logHandler("info", "Checking if your browser supports Fidoo");
			if(window.File && window.FileReader && window.FileList && window.Blob && window.XMLHttpRequest) {
				Fidoo.logHandler("info", "Your browser supports Fidoo");
				return true;
				}
			else {
				Fidoo.logHandler("info", "Your browser does not support Fidoo, please try again with Firefox or Chrome");
				return false;
				}
			} // end checkBrowserSupport()

/* node.js functions ************************************************ */

		// looks like this is not needed
		Fidoo.prepareForNodeJS = function() {
			if(Fidoo.debug === true) {
				Fidoo.logHandler("info", "Preparing for node.js");
				}
			Fidoo.fs = require('fs');
			// then finally, tell we are done
			if(Fidoo.debug === true) {
				Fidoo.logHandler("info", "Done preparing for node.js");
				}
			} // prepareForNodeJS

/* identification functions ***************************************** */

		Fidoo.identifyFile = function(binaryString, filename, mimetype, matchingMethod, disablePriority) {
			if(arguments.length == 0) {
				return {"result": "", "warning": "", "error": "Fidoo.identifyFile expects at least one argument: binaryString (type: string)"};
				}
			// optimizers like Closure will complain about
			// this `binaryString == "object"` condition
			// but it needs this condition in case
			// an object is passed
			if(typeof binaryString == "object") {
				return {"result": "", "warning": "", "error": "Fidoo.identifyFile expects binaryString to be a string, not an object"};
				}
			if(typeof binaryString != "string") {
				return {"result": "", "warning": "", "error": "Fidoo.identifyFile expects binaryString to be a string"};
				}
			if(binaryString.trim() == "") {
				return {"result": "", "warning": "empty binaryString", "error": ""};
				}
			if(!matchingMethod || (matchingMethod !== "strict" && matchingMethod !== "relaxed")) {
				matchingMethod = Fidoo.matchingMethod;
				}
			if(!disablePriority || (disablePriority !== true && disablePriority !== false)) {
				disablePriority = Fidoo.disablePriority;
				}
			if(!filename) {
				filename = "";
				}
			if(!mimetype) {
				mimetype = "";
				}
			var regexesMap = Fidoo.regexesMap;
			var pronomSignatures = Fidoo.pronomSignatures;
			var result = new Object;
			result.matchingMethod = matchingMethod;
			result.disablePriority = disablePriority ? "true" : "false";
			result.signatureMatches = {};
			var deletePuids = []
			var chunks = Fidoo.chunkString(binaryString, Fidoo.chunkSize);
			var bofChunk = chunks[0];
			var eofChunk = binaryString.substr(binaryString.length - Fidoo.chunkSize);
			for(var puid in regexesMap) {
				for(var i = 0; i < regexesMap[puid].length; i++) {
					var bofResult = null, varResult = null, eofResult = null, matchtype = [], score = [];
					if(regexesMap[puid][i].bofregex != null) {
						// regexes need to be reset (regex.lastIndex = 0)
						// or else results will differ between operations
						// because the greedy operator
						// keeps an index in memory for the next operation
						// if you pass the same binary string again
						// with another configuration
						// the regex `exec` is cached
						// this seems to be a Javascript... "feature"
						regexesMap[puid][i].bofregex.lastIndex = 0;
						matchtype.push("bof");
						var bofResult = regexesMap[puid][i].bofregex.exec(bofChunk);
						if(bofResult != null) {
							score.push("bof");
							}
						// speed up if "strict"
						// so we do not have to walk through
						// the rest
						else if(matchingMethod == "strict") {
							continue;
							}
						}
					if(regexesMap[puid][i].varregex != null) {
						regexesMap[puid][i].varregex.lastIndex = 0;
						matchtype.push("var");
						for(var c = 0; c < chunks.length; c++) {
							var varResult = regexesMap[puid][i].varregex.exec(chunks[c]);
							if(varResult != null) {
								score.push("var");
								break;
								}
							}
						}
					if(regexesMap[puid][i].eofregex != null) {
						regexesMap[puid][i].eofregex.lastIndex = 0;
						matchtype.push("eof");
						var eofResult = regexesMap[puid][i].eofregex.exec(eofChunk);
						if(eofResult != null) {
							score.push("eof");
							}
						}
						if(matchingMethod == "strict" && !matchtype.equals(score)) {
							continue;
							}
						if(bofResult != null) {
							var name = pronomSignatures[puid].name ? pronomSignatures[puid].name : "";
							var version = pronomSignatures[puid].version ? pronomSignatures[puid].version : "";
							var pronomMimetype = pronomSignatures[puid].mime ? pronomSignatures[puid].mime : "";
							var contentType = pronomSignatures[puid].content_type ? pronomSignatures[puid].content_type : "";
							var appleUid = pronomSignatures[puid].apple_uid ? pronomSignatures[puid].apple_uid : "";
							var hasPriorityOver = pronomSignatures[puid].has_priority_over ? pronomSignatures[puid].has_priority_over : "";
							if(!result.signatureMatches[puid]) {
								result.signatureMatches[puid] = [];
								}
							result.signatureMatches[puid].push({
								pronomSignaturename: regexesMap[puid][i].name, 
								pronomFormatName: name,
								pronomFormatVersion: version,
								pronomMimetypes: pronomMimetype,
								pronomContentType: contentType,
								pronomAppleUid: appleUid,
								pronomHasPriorityOver: hasPriorityOver,
								matchtypes: matchtype,
								score: score,
								});
						} // x
					}
				} 

			var extension = Fidoo.returnFileExtension(filename)
			result.extension = extension;
			result.extensionPuids = [];
			if(Fidoo.extensionPuidMap[extension]) {
				result.extensionPuids = Fidoo.extensionPuidMap[extension];
				}
			result.mimetype = "";
			if(mimetype) {
				result.mimetype = mimetype;
				}
			result.mimetypePuids = [];
			if(Fidoo.mimePuidMap[mimetype]) {
				result.mimetypePuids = Fidoo.mimePuidMap[mimetype];
				}
			
			if(disablePriority == false) {
				for(var puidCheck in result.signatureMatches) {
					for(var entry in result.signatureMatches[puidCheck]) {
						for(var overridePuid in result.signatureMatches[puidCheck][entry].pronomHasPriorityOver) {
						if(result.signatureMatches[result.signatureMatches[puidCheck][entry].pronomHasPriorityOver[overridePuid]]) {
							deletePuids.push(result.signatureMatches[puidCheck][entry].pronomHasPriorityOver[overridePuid]);
								}
							}
						}
					}
				}
			
			for(var del in deletePuids) {
				if(typeof deletePuids[del] !== "function") {
					delete result.signatureMatches[deletePuids[del]];
					}
				}
			return {"result": result, "warning": "", "error": ""};
		
		} // end identifyFile

		Fidoo.chunkString = function(str, len) {
			var size = Math.ceil(str.length / len),
			ret  = Array(size),
			offset;
			for (var i=0; i < size; i++) {
				offset = i * len;
				ret[i] = str.substring(offset, offset + len);
				}
			return ret;
			} // end chunkString

		Fidoo.returnFileExtension = function(filename) {
			var extension = filename.split(".");
			if(extension.length === 1 || (extension[0] === "" && extension.length === 2)) {
				return "";
			}
			return extension.pop().toLowerCase();
		} // end returnFileExtension

		Fidoo.registerJSON = function(signatureFile, json) {
			Fidoo.logHandler("info", "Registering " + signatureFile);
			Fidoo[signatureFile] = json;
			Fidoo.checkJSON.push(signatureFile);
			if(Object.keys(Fidoo.signatureMapJSON).length === Fidoo.checkJSON.length) {
				Fidoo.initializeRegexes();
				}
			} // end registerJSON

		Fidoo.loadSignatureData = function(which) {
			Fidoo.checkJSON = [];
			if(which == "nodeJS") {
				for(var signatureFile in Fidoo.signatureMapJSON) {
					try {
						var tempJSON = require(Fidoo.pathNodeJSON + Fidoo[Fidoo.signatureMapJSON[signatureFile]]);
						Fidoo.registerJSON(signatureFile, tempJSON);
						}
					catch(error) {
						Fidoo.logHandler("fatal error", String(error));
						}
					}
				}

			if(which == "browser") {
				for(var signatureFile in Fidoo.signatureMapJSON) {
					try {
						var urlJSON = Fidoo.pathBrowserJSON + Fidoo[Fidoo.signatureMapJSON[signatureFile]];
						Fidoo.loadJSON(signatureFile, urlJSON);
						}
					catch(error) {
						Fidoo.logHandler("fatal error", String(error));						
						}
					}				
				}

			} // end loadSignatureData
		
		Fidoo.initializeRegexes = function() {
			Fidoo.logHandler("info", "Initialising regular expressions");
			var regexesMap = new Object;
			var formats = Fidoo.pronomSignatures;
			for(var puid in formats) {
				if(formats[puid].signatures) {
					regexesMap[puid] = [];
					var bofRegex = null, varRegex = null, eofRegex = null;
					for(var j = 0; j < formats[puid].signatures.length; j++) {
						if(formats[puid].signatures[j].bofregex) {
							var bofRegex = new RegExp(unescape(formats[puid].signatures[j].bofregex), "igm");
							}
						if(formats[puid].signatures[j].varregex) {
							var varRegex = new RegExp(unescape(formats[puid].signatures[j].varregex), "igm");
							}
						if(formats[puid].signatures[j].eofregex) {
							var eofRegex = new RegExp(unescape(formats[puid].signatures[j].eofregex), "igm");
							}
							regexesMap[puid].push({
							name: formats[puid].signatures[j].name, 
							bofregex: bofRegex,
							varregex: varRegex,
							eofregex: eofRegex
							});
						} // end for signatures length			
					} // end if signature in puid
				} // end for signatures in puid
			Fidoo.regexesMap = regexesMap;
		} // end initializeRegexes

/* browser http json function **************************************** */

		Fidoo.loadJSON = function(signatureFile, urlJSON) {
			var data = new XMLHttpRequest();
			data.overrideMimeType("application/json");
			data.open("GET", urlJSON, true);
			data.onreadystatechange = function () {
			if (data.readyState == 4 && data.status == "200") {
				Fidoo.registerJSON(signatureFile, JSON.parse(data.responseText));
				}
			if(data.readyState == 4 && data.status != "200") {
				Fidoo.logHandler("fatal error", "An error occured: " + urlJSON + ": " + data.status + " " + data.statusText);
				}
			};
			data.send(null);  
			} // end loadJSON

/* ################################################################### */
        return Fidoo;
    } // end global defineFidoo()

/* global function definition ************************************ */

    if(typeof Fidoo  === "undefined") {
    	if(typeof process !== "undefined") { // node.js
			module.Fidoo = defineFidoo();
			module.Fidoo.setConsoles("nodeJS");
			module.Fidoo.readSetup("nodeJS");
			module.Fidoo.prepareForNodeJS();
			module.Fidoo.loadSignatureData("nodeJS");
    		}
    	else { // browser
			global.Fidoo = defineFidoo();
			global.Fidoo.setConsoles("browser");
			global.Fidoo.readSetup("browser");
			if(global.Fidoo.prepareForBrowser()) {
				Fidoo.loadSignatureData("browser");
				}
			else {
				// if CrappyBrowser™, do something
				// maybe tell folks to use a real browser
				// for now, delete Fidoo for test purposes
				// so we can check in the console it is gone
				delete global.Fidoo;
				}
			}
		}
	else {
		console.log("Fidoo is already defined");
	    } // end define globally if it doesn't already exist

	// maybe these prototypes need another place
	Array.prototype.equals = function (array) {
		// if the other array is a falsy value, return
		if (!array)
			return false;

		// compare lengths - can save a lot of time 
		if (this.length != array.length)
			return false;

		for (var i = 0, l=this.length; i < l; i++) {
			// Check if we have nested arrays
			if (this[i] instanceof Array && array[i] instanceof Array) {
				// recurse into the nested arrays
				if (!this[i].equals(array[i]))
					return false;       
			}           
			else if (this[i] != array[i]) { 
				// Warning - two different object instances will never be equal: {x:20} != {x:20}
				return false;   
			}           
		}       
		return true;
	} // end Array.prototype.equals

})(this); // end global function definition

// node.js
if(typeof module !== "undefined") {
	module.exports = module.Fidoo;
	}
// browser
else {
// 	console.dir(Fidoo);
	}
