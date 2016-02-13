// fidoo-core v0.0.1 (VeryBeta;)
// Browser and node.js compatible
// By Maurice de Rooij (TechMaurice), 2016
// https://github.com/techmaurice/fidoo/

(function(global){
	"use strict";
	function defineFidoo(){
		var Fidoo = {
		checkJSON: [],
// 		cacheJSON: 30, // days in HTML5 storage
		chunkSize: 4096, // raw bytes
		debug: true,
		extensionPuidMap: {},
		extensionPuidMapJSON: "extensionPuidMap-v84-0.json",
		fidooSignatureFixesJSON: "fidooSignatureFixes-v84-0.json",
// 		identifyZip: false,
		libVersion: "0.0.2",
		matchingMethod: "strict",
		mimePuidMap: {},
		mimePuidMapJSON: "mimePuidMap-v84-0.json",
		nodeJSONUri: "../json/",
		disablePriority: false,
		pronomSignatures: {},
		pronomSignaturesJSON: "pronomSignatures-v84-0.json",
		pronomSignatureVersion: 84,
		rawGitUrl: "https://cdn.rawgit.com/techmaurice/fidoo/master/json/",
		regexesMap: {},
		runningNodeJS: typeof process !== "undefined",
		signaturesLoaded: false,
		};

/* error handling functions ******************************** */

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

		Fidoo.logHandler = function(type, message) {
			var message = "Fidoo " + type + ": " + message;
			if(Fidoo.debug === true) {
				if(type === "fatal error") {
					console.log(message);
// 					Fidoo.consoleFatal(message); // Chrome chokes
					}
				else {
					console.log(message);
// 					Fidoo.consoleDebug(message); // Chrome chokes
					}
				}
			} // end logHandler

/* common functions ************************************************* */

		Fidoo.readSetup = function(which) {
			// needs loading from node
			if(which == "browser") {
				if(window.FidooUserSetup) {
					Fidoo.logHandler("info", "loading FidooUserSetup");
					}
				if(window.FidooCSS) {
				
					}
				if(window.FidooConfiguration) {
				
					}
				if(window.FidooDataUrls) {
				
					}
				}
			} // end readSetup
					
		Fidoo.dumpObject = function(object) {
			if(Fidoo.debug === true) {
				if(Fidoo.runningNodeJS) {
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
			if(window.File && window.FileReader && window.FileList && window.Blob && window.XMLHttpRequest) {
				Fidoo.logHandler("info", "Your browser fully supports Fidoo");
				return true;
				}
			else {
				Fidoo.logHandler("info", "Your browser does not support Fidoo, please try again with Firefox or Chrome");
				return false;
				}
			return false;
			} // end checkBrowserSupport()

/* node.js functions ************************************************ */

		Fidoo.prepareForNodeJS = function() {
			if(Fidoo.debug === true) {
				Fidoo.logHandler("info", "Fidoo: preparing for node.js");
				}
			// maybe more handling in case this fails?
			Fidoo.fs = require('fs');
			// then finally, tell we are done
			if(Fidoo.debug === true) {
				Fidoo.logHandler("info", "Fidoo: done preparing for node.js");
				}
			} // prepareForNodeJS

/* identification functions ***************************************** */

		Fidoo.identifyFile = function(binaryString, matchingMethod, disablePriority, filename, mimetype) {
			if(arguments.length == 0) {
				return {"result": "", "warning": "", "error": "Fidoo.identifyFile expects at least one argument: binaryString (type: string)"};
				}
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
			result.signatureMatches = {};
			var deletePuids = []
			var chunks = Fidoo.chunkString(binaryString, Fidoo.chunkSize);
			var bofChunk = chunks[0];
			var eofChunk = binaryString.substr(binaryString.length - Fidoo.chunkLength);
			for(var puid in regexesMap) {
				for(var i = 0; i < regexesMap[puid].length; i++) {
					var bofResult = null, vaerResult = null, eofResult = null, matchtype = [], score = [];
					if(regexesMap[puid][i].bofregex != null) {
						// regexes need to be reset (regex.lastIndex = 0)
						// or else results will differ between operations
						// because the greedy operator
						// keeps an index in memory for the next operation
						// if you pass the same binary string again
						// kinda ... strange
						// this is a Javascript... "feature"
						// </headdesk>
						regexesMap[puid][i].bofregex.lastIndex = 0;
						matchtype.push("bof");
						var bofResult = regexesMap[puid][i].bofregex.exec(bofChunk);
						if(bofResult != null) {
							score.push("bof");
							}
						else {
							continue;
							}
						}
					if(regexesMap[puid][i].varregex != null && bofResult != null) {
						regexesMap[puid][i].varregex.lastIndex = 0;
						matchtype.push("var");
						for(var c = 0; c < chunks.length; c++) {
							var vaerResult = regexesMap[puid][i].varregex.exec(chunks[c]);
							if(vaerResult != null) {
								score.push("var");
								break;
								}
							}
						}
					if(regexesMap[puid][i].eofregex != null && bofResult != null) {
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
							var _disablePriority = disablePriority ? "true" : "false";
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
								disablePriority: _disablePriority,
								matchingMethod: Fidoo.matchingMethod,
								matchtypes: matchtype,
								score: score,
								});
						}
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
							//console.log(puidCheck  + " has priority over " +  result.signatureMatches[puidCheck][entry].pronomHasPriorityOver[overridePuid]);
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

		Fidoo.loadSignatureData = function (which) {
			if(Fidoo.signaturesLoaded !== false) {
				return true;
				}
			var status = false;
			if(which == "nodeJS") {
				try { // TODO more catching
					Fidoo.registerJSON(require(Fidoo.nodeJSONUri + Fidoo.pronomSignaturesJSON), "pronomSignatures");
					Fidoo.registerJSON(require(Fidoo.nodeJSONUri + Fidoo.extensionPuidMapJSON), "extensionPuidMap");
					Fidoo.registerJSON(require(Fidoo.nodeJSONUri + Fidoo.mimePuidMapJSON), "mimePuidMap");
					}
				catch(error) {
					Fidoo.logHandler("fatal error: ", error);
					}
				}
			if(which == "browser") {
				try { // TODO more catching
					Fidoo.loadJSON(Fidoo.rawGitUrl + Fidoo.pronomSignaturesJSON, "pronomSignatures");
					Fidoo.loadJSON(Fidoo.rawGitUrl + Fidoo.extensionPuidMapJSON, "extensionPuidMap");
					Fidoo.loadJSON(Fidoo.rawGitUrl + Fidoo.mimePuidMapJSON, "mimePuidMap");
					}
				catch(error) {
					Fidoo.logHandler("fatal error: ", error);
					}				
				}
			return status;
			} // end loadSignatureData
		
		Fidoo.parseSignatureData = function() {
			var status = false;
			Fidoo.initializeRegexes();			
			
			return status;
			} // end ParseSignatureData

		Fidoo.initializeRegexes = function() {
			Fidoo.logHandler("info", "Initialising regular expressions");
			var regexesMap = new Object;
			var formats = Fidoo.pronomSignatures;
			for(var puid in formats) {
				if(formats[puid].signatures) {
					regexesMap[puid] = [];
					var bofRegex = null, vaerRegex = null, eofRegex = null;
					for(var j = 0; j < formats[puid].signatures.length; j++) {
						if(formats[puid].signatures[j].bofregex) {
							var bofRegex = new RegExp(unescape(formats[puid].signatures[j].bofregex), "igm");
							}
						if(formats[puid].signatures[j].varregex) {
							var vaerRegex = new RegExp(unescape(formats[puid].signatures[j].varregex), "igm");
							}
						if(formats[puid].signatures[j].eofregex) {
							var eofRegex = new RegExp(unescape(formats[puid].signatures[j].eofregex), "igm");
							}
							regexesMap[puid].push({
							name: formats[puid].signatures[j].name, 
							bofregex: bofRegex,
							varregex: vaerRegex,
							eofregex: eofRegex
							});
						} // end for signatures length			
					} // end if signature in puid
				} // end for signatures in puid
			Fidoo.regexesMap = regexesMap;
		} // end initializeRegexes

/* json functions ************************************************ */

		Fidoo.loadJSON = function(jsonUrl, which) {
			var data = new XMLHttpRequest();
			data.overrideMimeType("application/json");
			data.open("GET", jsonUrl, true);
			data.onreadystatechange = function () {
			if (data.readyState == 4 && data.status == "200") {
				Fidoo.registerJSON(JSON.parse(data.responseText), which);
				}
			if(data.readyState == 4 && data.status != "200") {
				Fidoo.logHandler("fatal error", "An error occured: " + jsonUrl + ": " + data.status + " " + data.statusText);
				}
			};
			data.send(null);  
			} // end loadJSON

		Fidoo.registerJSON = function(json, which) {
			Fidoo.checkJSON.push(which);
			Fidoo[which] = json; // TODO needs more checking
			if(Fidoo.checkJSON.indexOf("pronomSignatures") !== -1 && Fidoo.checkJSON.indexOf("extensionPuidMap") !== -1 && Fidoo.checkJSON.indexOf("mimePuidMap") !== -1) {
				Fidoo.signaturesLoaded = true;
				Fidoo.parseSignatureData();
				}
			} // end registerJSON

/* ################################################################### */
        return Fidoo;
    } // end global defineFidoo()

/* global function definition ************************************ */

    if(typeof Fidoo  === "undefined") {
    	if(typeof process !== "undefined") { // node.js
			module.Fidoo = defineFidoo();
			module.Fidoo.setConsoles("nodeJS");
			// module.Fidoo.readSetup("nodeJS");
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
				// so we can check it is gone
				delete global.Fidoo;
				}
			}
		}
	else {
		console.log("Fidoo is already defined");
	    } // end define globally if it doesn't already exist

	// maybe this needs another place
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
	}
	    
})(this); // end global function definition

// node.js
if(typeof module !== "undefined") {
	module.exports = module.Fidoo;
	}
// browser
else {
// 	console.dir(Fidoo);
	}
