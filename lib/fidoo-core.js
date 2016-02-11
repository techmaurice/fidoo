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
		errorMessages: [],
		extensionPuidMap: {},
		extensionPuidMapJSON: "extensionPuidMap-v84-0.json",
		fidooSignatureFixesJSON: "fidooSignatureFixes-v84-0.json",
// 		identifyZip: false,
		identifyResults: {},
		libVersion: "0.0.2",
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

		Fidoo.addIdentificationResult = function(result, filename) {
			Fidoo.identifyResults[filename] = {};
			Fidoo.identifyResults[filename].result = result;
			Fidoo.identifyResults[filename].error = "";    
		} // end function addIdentificationResult

		Fidoo.fileError = function(msg, filename) {
			Fidoo.logHandler("file error", "Failed to read file '" + filename + "': " + msg);
			Fidoo.identifyResults[filename] = {};
			Fidoo.identifyResults[filename].result = "error";
			Fidoo.identifyResults[filename].error = msg;
		} // end function fileError

		Fidoo.showResult = function (filename) {
			// if node, spit out result, append to result array
			// if browser, append to result array
			} // end showResult

		Fidoo.each = function() {
			// prototype for object iterator
			} // end each

		Fidoo.chunkString = function(str, len) {
			var _size = Math.ceil(str.length/len),
			_ret  = Array(_size),
			_offset;
			for (var _i=0; _i<_size; _i++) {
				_offset = _i * len;
				_ret[_i] = str.substring(_offset, _offset + len);
				}
			return _ret;
			} // end chunkString

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
			var status = false;
			for(var i = 0, file; file = files[i]; i++) {
				var search = escape(file.name);
				if(search === filename) {
					var fileReader = new FileReader();
					fileReader.onload = function(e) {
						try {
							var result = Fidoo.identifyFile(filename, e.target.result);
							Fidoo.addIdentificationResult(result, filename);
						}
						catch(msg) {
							Fidoo.fileError(msg, filename);
							}
					};
					fileReader.onerror = function(e) {
						Fidoo.fileError(e.target.error.name, filename);
					};
					fileReader.readAsBinaryString(file);
					return Fidoo.returnBrowserInfo(file);
					}
				}
			//unescape(decodeURIComponent(escape(that.textContent)));
			return status;

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

		Fidoo.identifyFile = function(filename, binaryString) {
			// filename, binaryString, matchingMethod, priorityOverride, identifyZip, insideZip
			// TODO: priorityOverride (for skip)
			// TODO: identifyZip -> zip lib
			// TODO: insideZip is true or false:
			// TODO: if zipfile is true we are peeking inside a zipfile
			// TODO: and need to skip recursing into yet another zipfile
// 			console.log(binaryString.substr(binaryString.length - Fidoo.chunkLength));
// 			return true;
			Fidoo.logHandler("info", "Identifying file '" + filename + "' (method = '" + Fidoo.matchingMethod + "', priorityOverride = '" + Fidoo.priorityOverride + "')");
			var regexesMap = Fidoo.regexesMap;
			var result = new Object;
			result.search = [];
			result.resultPuidMap = [];
			var chunks = Fidoo.chunkString(binaryString, Fidoo.chunkSize);
			var bofChunk = chunks[0];
			var eofChunk = binaryString.substr(binaryString.length - Fidoo.chunkLength);
			for(var puid in regexesMap) {
				for(var i = 0; i < regexesMap[puid].length; i++) {
					var bofResult = null, vaerResult = null, eofResult = null, matchtype = [], score = [];
					if(regexesMap[puid][i].bofregex != null) {
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
						matchtype.push("eof");
						var eofResult = regexesMap[puid][i].eofregex.exec(eofChunk);
						if(eofResult != null) {
							score.push("eof");
							}
						}
						if(Fidoo.matchingMethod == "strict" && !matchtype.equals(score)) {
							continue;
							}
						if(bofResult != null) {

							// check if format is compound OLE and patch it
							// (very ugly and disabled for now)
							if(puid == "_DISABLE_fmt/111") {
								var compoundOleType = analyseCompoundOleFile(binaryString);
								if(compoundOleType == "word") {
									// fmt/39,fmt/40
									result.search.push({
										puid: "fmt/39",
										signaturename: "Fidoo OLE2 Word patch (non PRONOM)",
										matchtypes: ["var"],
										score: ["var"]
										});
									result.search.push({
										puid: "fmt/40",
										signaturename: "Fidoo OLE2 Word patch (non PRONOM)",
										matchtypes: ["var"],
										score: ["var"]
										});
									}
								if(compoundOleType == "excel") {
									// fmt/59,fmt/61,fmt/62
									result.search.push({
										puid: "fmt/59",
										signaturename: "Fidoo OLE2 Excel patch (non PRONOM)",
										matchtypes: ["var"],
										score: ["var"]
										});
									result.search.push({
										puid: "fmt/61",
										signaturename: "Fidoo OLE2 Excel patch (non PRONOM)",
										matchtypes: ["var"],
										score: ["var"]
										});
									result.search.push({
										puid: "fmt/62",
										signaturename: "Fidoo OLE2 Excel patch (non PRONOM)",
										matchtypes: ["var"],
										score: ["var"]
										});
									}
								if(compoundOleType == "access") {
									// TODO fix header
									}
								} // end compound OLE
					
							result.search.push({
								puid: puid,
								signaturename: regexesMap[puid][i].name, 
								matchtypes: matchtype,
								score: score
								});
						}
					}
				}
			// result needs refactoring
		// 	for(var i = 0; i < result.search.length; i++) {
		// 		if(result.resultPuidMap.indexOf(result.search[i].puid) == -1) {
		// 			result.resultPuidMap.push(result.search[i].puid);
		// 			}
		// 		}

			// prioMap
			// skipMap (priorityOverride)
			//console.dir(result);
			return result;
		/* **************************************** */
			// ZIP stuff, commented out for now
		// 	if(result.search.length == 1 && result.search[0].puid == "x-fmt/263" && result.search[0].score.equals(["bof","eof"]) && matchingMethod == "strict" && identifyZip === true && insideZip == false) {
		// 		// it is a zipfile and the user wants us to peek inside
		// 		}
		/* **************************************** */
		} // end identifyFile

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
