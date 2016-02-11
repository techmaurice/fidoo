// fidoo-core v0.0.1 (VeryBeta;)
// Browser and node.js compatible
// By Maurice de Rooij (TechMaurice), 2016
// https://github.com/techmaurice/fidoo/

(function(global){
	"use strict";
	function defineFidoo(){
		var Fidoo = {
		browserCheckJSON: [],
// 		cacheJSON: 30, // days in HTML5 storage
		chunkSize: 4096, // raw bytes
		debug: false,
		errorMessages: [],
		extensionPuidMap: {},
		extensionPuidMapJSON: "extensionPuidMap-v84-0.json",
		fidooSignatureFixesJSON: "fidooSignatureFixes-v84-0.json",
// 		identifyZip: false,
		libVersion: "0.0.1",
		matchingMethod: "strict",
		maxFiles: 250,
		mimePuidMap: {},
		mimePuidMapJSON: "mimePuidMap-v84-0.json",
		nodeInputFile: "",
		nodeJSONUri: "../json/",
		nodeOutputFile: "",
		priorityOverride: false,
		pronomSignatures: {},
		pronomSignaturesJSON: "pronomSignatures-v84-0.json",
		pronomSignatureVersion: 84,
		rawGitUrl: "https://cdn.rawgit.com/techmaurice/fidoo/master/json/",
		regexesMap: {},
		runningNodeJS: typeof process !== "undefined",
		signaturesLoaded: false,
// 		toStdOut: false,
		useBrowserInfo: true,
		};

/* error handling functions ******************************** */

		Fidoo.setConsoles = function(which) {
			if(which === "nodeJS") {
				Fidoo.consoleFatal = console.error;
				Fidoo.consoleDebug = console.error;			
				}
			if(which == "browser") {
				Fidoo.consoleFatal = console.error;
				Fidoo.consoleDebug = console.debug;
				}
			} // end setConsoles

		Fidoo.logHandler = function(type, message) {
			var message = "Fidoo " + type + ": " + message;
			Fidoo.errorMessages.push(message);
			if(Fidoo.debug === true) {
				if(type === "fatal error") {
					Fidoo.consoleFatal(message);
					}
				else {
					Fidoo.consoleDebug(message);
					}
				}
			} // end logHandler

/* common functions ************************************************* */

		Fidoo.showResult = function (filename) {
			// if node, spit out result, append to result array
			// if browser, append to result array
			} // end showResult

		Fidoo.each = function() {
			// prototype for object iterator
			} // end each

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
			if(window.File && window.FileReader && window.FileList && window.Blob && window.Worker && window.XMLHttpRequest) {
				Fidoo.logHandler("info", "Your browser fully supports Fidoo");
				return true;
				}
			else {
				Fidoo.logHandler("info", "Your browser does not support Fidoo, please try again with Firefox or Chrome");
				return false;
				}
			return false;
			} // end checkBrowserSupport()
		
		Fidoo.processFileObjectBrowser = function(fileObject, filename) {
			for(var i = 0, file; file = files[i]; i++) {
				var search = escape(file.name);
				if(search === filename) {
					return Fidoo.returnBrowserInfo(file);
					}
				}
			return false;
			//unescape(decodeURIComponent(escape(that.textContent)));
			return false;
			var status = false;
			return status;
			var reader = new FileReader();
			reader.addEventListener("loadend", function() {
			// console.log(reader.result); // kills browser
			});
			reader.readAsBinaryString(fileObject);

			} // end processFileObjectBrowser

		Fidoo.returnBrowserInfo = function(fileObject) {
			return {
				"lastModified": fileObject.lastModified,
				"lastModifiedDate": fileObject.lastModifiedDate,
				"name": fileObject.name,
				"size": fileObject.size,
				"mimetype": fileObject.type
				};
			} // end returnBrowserInfo

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

		Fidoo.setNodeInputFile = function(filename) {
			Fidoo.testFileAccessNode(filename);
			Fidoo.nodeInputFile = filename;
			} // end setInputFileNode
			
		Fidoo.setNodeOutputFile = function(filename) {
			Fidoo.testFileAccessNode(filename);
			Fidoo.nodeOutputFile = filename;
			} // end setOutputFileNode

		Fidoo.testFileAccessNode = function(filename) {
			Fidoo.fs.stat(filename, function(err, stat) {
				if(err == null) {
					return true;
					}
				else if(err.code == "ENOENT") {
					Fidoo.logHandler("fatal error", "File " + filename + " ENOENT error: " + err.code);
					return false;
					}
				else {
					Fidoo.logHandler("fatal error", "File " + filename + " reported " + err.code);
					return false;
					}
				});
			return false;
			} // end testFileAccessNode

/* identification functions ***************************************** */

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
			Fidoo.browserCheckJSON.push(which);
			Fidoo[which] = json; // TODO needs more checking
			if(Fidoo.browserCheckJSON.indexOf("pronomSignatures") !== -1 && Fidoo.browserCheckJSON.indexOf("extensionPuidMap") !== -1 && Fidoo.browserCheckJSON.indexOf("mimePuidMap") !== -1) {
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
	    
})(this); // end global function definition

// node.js
if(typeof module !== "undefined") {
	module.exports = module.Fidoo;
	}
// browser
else {
// 	console.dir(Fidoo);
	}
