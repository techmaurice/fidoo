// fidoo-core v0.1-VeryBeta
// Browser and node.js compatible
// By Maurice de Rooij (TechMaurice), 2016
// https://github.com/techmaurice/fidoo/

(function(global){
	"use strict";
	function defineFidoo(){
		var Fidoo = {
		debug: false,
		libVersion: "0.0.1",
		supported: false,
		matchingMethod: "strict",
		priorityOverride: false,
		identifyZip: false,
		chunkSize: 4096, // raw bytes
		pronomSignatureVersion: 84,
		maxFiles: 250,
		rawGitUrl: "https://cdn.rawgit.com/techmaurice/fidoo/master/json/",
		nodeJSON: "../json/",
		pronomSignaturesJSON: "pronomSignatures-v84-0.json",
		extensionPuidMapJSON: "extensionPuidMap-v84-0.json",
		mimePuidMapJSON: "mimePuidMap-v84-0.json",
		fidooSignatureFixesJSON: "fidooSignatureFixes-v84-0.json",
		cacheJSON: 30, // days in HTML5 storage
		signaturesLoaded: false,
		regexesMapLoaded: false,
		useBrowserInfo: true,
		errorMessages: [],
		toStdOut: false,
		nodeInputFile: "",
		nodeOutputFile: "",
		runningNodeJS: typeof process !== "undefined",
		};

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
		
		Fidoo.loadSignatureData = function () {
			var status = false;
			if(Fidoo.runningNodeJS) {
				try { // TODO more catching
					Fidoo.pronomSignatures = require(Fidoo.nodeJSON + Fidoo.pronomSignaturesJSON);
					Fidoo.extensionPuidMap = require(Fidoo.nodeJSON + Fidoo.extensionPuidMapJSON);
					Fidoo.mimePuidMap = require(Fidoo.nodeJSON + Fidoo.mimePuidMapJSON);
					}
				catch(error) {
					Fidoo.logHandler("fatal error: ", error);
					}
				}
			return status;
			var status = Fidoo.parseSignatureData();

			if(status === true) {
				Fidoo.signaturesLoaded = true;
				return true;
				}
			else {
				Fidoo.logHandler("fatal error", "could not load signature data");
				return false;
				}
			return false;
			} // end processFileObject
		
		Fidoo.parseSignatureData = function() {
			var status = false;
			
			return status;
			} // end ParseSignatureData
			
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

		Fidoo.setConsoles = function() {
			if(Fidoo.runningNodeJS) {
				Fidoo.consoleFatal = console.error;
				Fidoo.consoleDebug = console.error;			
				}
			else {
				Fidoo.consoleFatal = console.error;
				Fidoo.consoleDebug = console.debug;
				} // end runningNodeJS
			}

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

/* browser functions ************************************************ */

		Fidoo.checkBrowserSupport = function() {
			if(window.File && window.FileReader && window.FileList && window.Blob && window.Worker && window.XMLHttpRequest) {
				Fidoo.browserSupported = true;
				Fidoo.logHandler("info", "Your browser fully supports Fidoo");
				}
			else {
				Fidoo.browserSupported = false;
				Fidoo.logHandler("info", "Your browser does not support Fidoo, please try again with Firefox or Chrome");
				}
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
			if(Fidoo.signaturesLoaded === false) {
				status = Fidoo.loadSignatureData();
				}
			return status;
			var reader = new FileReader();
			reader.addEventListener("loadend", function() {
// 				console.log(reader.result);
			});
			reader.readAsBinaryString(fileObject);

			} // end processFileObject

		Fidoo.returnBrowserInfo = function(fileObject) {
			return {
				"lastModified": fileObject.lastModified,
				"lastModifiedDate": fileObject.lastModifiedDate,
				"name": fileObject.name,
				"size": fileObject.size,
				"mimetype": fileObject.type
				};
			}

/* node.js functions ************************************************ */

		Fidoo.prepareForNodeJS = function() {
			if(Fidoo.debug === true) {
				console.log("Fidoo: preparing for node.js");
				}
			Fidoo.fs = require('fs');
			// then finally, tell we are done
			if(Fidoo.debug === true) {
				console.log("Fidoo: done preparing for node.js");
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

/* ################################################################### */
        return Fidoo;
    } // end global defineFidoo()

/* global function definition ************************************ */

    if(typeof Fidoo  === "undefined"){
    	if(typeof process !== "undefined") { // node.js
			module.Fidoo = defineFidoo();
			module.Fidoo.setConsoles();
			// module.Fidoo.readSetup("nodeJS");
			module.Fidoo.prepareForNodeJS();
    		}
    	else { // browser
			global.Fidoo = defineFidoo();
			Fidoo.setConsoles();
			global.Fidoo.readSetup("browser");
			global.Fidoo.checkBrowserSupport();
			}
		}
	else{
		console.log("Fidoo is already defined");
	    } // end define globally if it doesn't already exist
	    
})(this); // end global function

// node.js
if(typeof module !== "undefined") {
	module.exports = module.Fidoo;
	}
// browser
else {
// 	console.dir(Fidoo);
	}
