// fidoo-core.js
// Browser and node.js compatible
// Originally by Maurice de Rooij (TechMaurice), 2016
// Modernized 2026
// https://github.com/techmaurice/fidoo/

(function (global) {
	"use strict"; // this is a Javascript directive
	// and has nothing to do with "strict" matching

	function arraysEqual(a, b) {
		if (!Array.isArray(a) || !Array.isArray(b)) return false;
		if (a.length !== b.length) return false;
		for (let i = 0; i < a.length; i++) {
			if (Array.isArray(a[i]) && Array.isArray(b[i])) {
				if (!arraysEqual(a[i], b[i])) return false;
			} else if (a[i] !== b[i]) {
				return false;
			}
		}
		return true;
	} // end arraysEqual

	function defineFidoo() {
		const Fidoo = {
			// to change settings, use fidoo-setup.js
			chunkSize: 1024 * 16,
			debug: false,
			disablePriority: false,
			exitOnFatalNodeJS: true,
			exitMethodNodeJS: (message) => process.exit(1),
			extensionPuidMap: {},
			formatExtensionsJSON: "formatExtensions-v116-0.json",
			libVersion: "0.1.4",
			matchingMethod: "strict",
			mimePuidMap: {},
			mimePuidMapFixesJSON: "mimePuidMapFixes-v116-0.json",
			pathBrowserJSON: "./json/",
			pathNodeJSON: "../json/",
			pronomSignatures: {},
			pronomSignaturesJSON: "pronomSignatures-v116-0.json",
			rawGitUrl: "https://cdn.jsdelivr.net/gh/techmaurice/fidoo@master/json/",
			regexesMap: {},
			setupFile: "./fidoo-setup.js",
		};

		/* error handling functions ******************************** */

		Fidoo.setConsoles = function (which) {
			if (which === "nodeJS") {
				Fidoo.consoleDebug = console.log;
				Fidoo.consoleFatal = console.error;
			}
			if (which === "browser") {
				Fidoo.consoleDebug = console.log.bind(console);
				Fidoo.consoleFatal = console.error.bind(console);
			}
		}; // end setConsoles

		Fidoo.logHandler = function (errorType, message) {
			const fullMessage = `Fidoo ${errorType}: ${message}`;
			if (errorType === "fatal error") {
				Fidoo.consoleFatal(fullMessage);
				if (typeof process !== "undefined" && Fidoo.exitOnFatalNodeJS) {
					Fidoo.exitMethodNodeJS(fullMessage);
				}
			} else if (Fidoo.debug === true) {
				Fidoo.consoleDebug(fullMessage);
				// no exit because it is informational
			}
		}; // end logHandler

		/* common functions ************************************************* */

		Fidoo.readSetup = function (which) {
			if (which === "nodeJS") {
				try {
					const FidooUserSetup = require(Fidoo.setupFile);
					if (FidooUserSetup.useSetup === true) {
						Fidoo.debug = FidooUserSetup.debug;
						Fidoo.logHandler("info", "Loading FidooUserSetup");
						for (const setting in FidooUserSetup) {
							Fidoo[setting] = FidooUserSetup[setting];
						}
					}
				} catch (error) {
					Fidoo.logHandler("info", `FidooUserSetup not found: ${error}`);
				}
			}
			if (which === "browser") {
				if (window.FidooUserSetup && window.FidooUserSetup.useSetup === true) {
					Fidoo.debug = window.FidooUserSetup.debug;
					Fidoo.logHandler("info", "Loading FidooUserSetup");
					for (const setting in window.FidooUserSetup) {
						Fidoo[setting] = window.FidooUserSetup[setting];
					}
				}
			}
		}; // end readSetup

		/* browser functions ************************************************ */

		Fidoo.prepareForBrowser = function () {
			Fidoo.logHandler("info", "Checking if your browser supports Fidoo");
			if (window.File && window.FileReader && window.FileList && window.Blob && window.XMLHttpRequest) {
				Fidoo.logHandler("info", "Your browser supports Fidoo");
				return true;
			}
			Fidoo.logHandler("info", "Your browser does not support Fidoo, please try again with Firefox or Chrome");
			return false;
		}; // end prepareForBrowser

		/* node.js functions ************************************************ */

		Fidoo.prepareForNodeJS = function () {
			if (Fidoo.debug === true) {
				Fidoo.logHandler("info", "Preparing for node.js");
				Fidoo.logHandler("info", "Done preparing for node.js");
			}
		}; // prepareForNodeJS

		/* identification functions ***************************************** */

		Fidoo.identifyFile = function (binaryString, filename, mimetype, matchingMethod, disablePriority) {
			if (binaryString === undefined) {
				return { result: "", warning: "", error: "Fidoo.identifyFile expects at least one argument: binaryString (type: string)" };
			}
			// optimizers like Closure will complain about
			// this `binaryString == "object"` condition
			// but it needs this condition in case
			// an object is passed
			if (typeof binaryString === "object") {
				return { result: "", warning: "", error: "Fidoo.identifyFile expects binaryString to be a string, not an object" };
			}
			if (typeof binaryString !== "string") {
				return { result: "", warning: "", error: "Fidoo.identifyFile expects binaryString to be a string" };
			}
			if (binaryString.trim() === "") {
				return { result: "", warning: "empty binaryString", error: "" };
			}
			if (matchingMethod !== "strict" && matchingMethod !== "relaxed") {
				matchingMethod = Fidoo.matchingMethod;
			}
			if (disablePriority !== true && disablePriority !== false) {
				disablePriority = Fidoo.disablePriority;
			}
			filename = filename || "";
			mimetype = mimetype || "";

			const regexesMap = Fidoo.regexesMap;
			const pronomSignatures = Fidoo.pronomSignatures;
			const result = {
				matchingMethod,
				disablePriority: disablePriority ? "true" : "false",
				signatureMatches: {},
			};
			const deletePuids = [];
			const chunks = Fidoo.chunkString(binaryString, Fidoo.chunkSize);
			const bofChunk = chunks[0];
			const eofChunk = binaryString.substr(binaryString.length - Fidoo.chunkSize);

			for (const puid in regexesMap) {
				for (let i = 0; i < regexesMap[puid].length; i++) {
					const signature = regexesMap[puid][i];
					let bofResult = null;
					let eofResult = null;
					const matchtypes = [];
					const score = [];

					if (signature.bofregex != null) {
						matchtypes.push("bof");
						bofResult = signature.bofregex.exec(bofChunk);
						if (bofResult != null) {
							score.push("bof");
						} else if (matchingMethod === "strict") {
							// speed up if "strict" so we do not have to walk through the rest
							continue;
						}
					}
					if (signature.varregex != null) {
						matchtypes.push("var");
						for (let c = 0; c < chunks.length; c++) {
							const varResult = signature.varregex.exec(chunks[c]);
							if (varResult != null) {
								score.push("var");
								break;
							}
						}
					}
					if (signature.eofregex != null) {
						matchtypes.push("eof");
						eofResult = signature.eofregex.exec(eofChunk);
						if (eofResult != null) {
							score.push("eof");
						}
					}
					if (matchingMethod === "strict" && !arraysEqual(matchtypes, score)) {
						continue;
					}
					if (bofResult != null) {
						const format = pronomSignatures[puid] || {};
						if (!result.signatureMatches[puid]) {
							result.signatureMatches[puid] = [];
						}
						result.signatureMatches[puid].push({
							pronomSignaturename: signature.name,
							pronomFormatName: format.name || "",
							pronomFormatVersion: format.version || "",
							pronomMimetypes: format.mime || "",
							pronomContentType: format.content_type || "",
							pronomAppleUid: format.apple_uid || "",
							pronomHasPriorityOver: format.has_priority_over || "",
							pronomSupertypeOf: format.is_supertype_of || "",
							pronomSubtypeOf: format.is_subtype_of || "",
							matchtypes,
							score,
						});
					}
				}
			}

			const extension = Fidoo.returnFileExtension(filename);
			result.extension = extension;
			result.extensionPuids = Fidoo.extensionPuidMap[extension] || [];
			result.mimetype = mimetype || "";
			result.mimetypePuids = Fidoo.mimePuidMap[mimetype] || [];

			if (disablePriority === false) {
				for (const puidCheck in result.signatureMatches) {
					for (const entry of result.signatureMatches[puidCheck]) {
						for (const overridePuid of entry.pronomHasPriorityOver || []) {
							if (result.signatureMatches[overridePuid]) {
								deletePuids.push(overridePuid);
							}
						}
					}
				}
			}

			for (const puid of deletePuids) {
				delete result.signatureMatches[puid];
			}
			return { result, warning: "", error: "" };
		}; // end identifyFile

		Fidoo.chunkString = function (str, len) {
			const size = Math.ceil(str.length / len);
			const chunks = new Array(size);
			for (let i = 0; i < size; i++) {
				const offset = i * len;
				chunks[i] = str.substring(offset, offset + len);
			}
			return chunks;
		}; // end chunkString

		Fidoo.returnFileExtension = function (filename) {
			const parts = filename.split(".");
			if (parts.length === 1 || (parts[0] === "" && parts.length === 2)) {
				return "";
			}
			return parts.pop().toLowerCase();
		}; // end returnFileExtension

		// signatureMapJSON maps JSON files to signature objects
		Fidoo.signatureMapJSON = {
			mimePuidMapFixesJSON: "mimePuidMap",
			pronomSignaturesJSON: "pronomSignatures",
			formatExtensionsJSON: "pronomSignatures",
		};

		Fidoo.registerJSON = function (signatures, json) {
			Fidoo.pronomSignatureVersion = json.version;
			// to load fixes and format extensions,
			// append signature data instead of assigning
			for (const key in json.formats) {
				Fidoo[signatures][key] = json.formats[key];
			}
			Fidoo.checkJSON.push(signatures);
			if (Object.keys(Fidoo.signatureMapJSON).length === Fidoo.checkJSON.length) {
				delete Fidoo.checkJSON;
				Fidoo.initializeRegexes();
				// to load mime to puid and extension to puid,
				// append signature data instead of assigning
				let temp = Fidoo.mimeExtensionMapping(Fidoo.pronomSignatures, "mime");
				for (const key in temp) {
					Fidoo.mimePuidMap[key] = temp[key];
				}
				temp = Fidoo.mimeExtensionMapping(Fidoo.pronomSignatures, "extension");
				for (const key in temp) {
					Fidoo.extensionPuidMap[key] = temp[key];
				}
			}
		}; // end registerJSON

		Fidoo.loadSignatureData = function (which) {
			Fidoo.checkJSON = [];
			if (which === "nodeJS") {
				for (const signatureFile in Fidoo.signatureMapJSON) {
					try {
						const tempJSON = require(Fidoo.pathNodeJSON + Fidoo[signatureFile]);
						Fidoo.registerJSON(Fidoo.signatureMapJSON[signatureFile], tempJSON);
					} catch (error) {
						Fidoo.logHandler("fatal error", String(error));
					}
				}
			}

			if (which === "browser") {
				for (const signatureFile in Fidoo.signatureMapJSON) {
					const urlJSON = Fidoo.pathBrowserJSON + Fidoo[signatureFile];
					Fidoo.loadJSON(Fidoo.signatureMapJSON[signatureFile], urlJSON);
				}
			}
		}; // end loadSignatureData

		Fidoo.initializeRegexes = function () {
			Fidoo.logHandler("info", "Initialising regular expressions");
			const regexesMap = {};
			const formats = Fidoo.pronomSignatures;
			// compile a single regex, tolerating malformed signature data: a
			// handful of upstream PRONOM/FIDO signatures are malformed (e.g. an
			// invalid {min,max} quantifier), and one bad pattern should not
			// prevent the rest of the (2000+) signatures from loading
			const compile = (puid, position, source) => {
				if (!source) return null;
				try {
					// case-insensitive ("i"), and "." also matches line breaks ("s")
					// so a signature can span an embedded newline byte; no "g" flag,
					// since each regex is only ever exec()'d once per chunk, so there
					// is no lastIndex state to reset between calls
					return new RegExp(source, "is");
				} catch (error) {
					Fidoo.logHandler("info", `Skipping invalid ${position} signature for ${puid}: ${error}`);
					return null;
				}
			};
			for (const puid in formats) {
				if (!formats[puid].signatures) continue;
				regexesMap[puid] = [];
				for (const signature of formats[puid].signatures) {
					regexesMap[puid].push({
						name: signature.name,
						bofregex: compile(puid, "BOF", signature.bofregex),
						varregex: compile(puid, "VAR", signature.varregex),
						eofregex: compile(puid, "EOF", signature.eofregex),
					});
				}
			}
			Fidoo.regexesMap = regexesMap;
		}; // end initializeRegexes

		Fidoo.mimeExtensionMapping = function (formats, which) {
			if (which !== "mime" && which !== "extension") {
				return {};
			}
			const resultMap = {};
			for (const format in formats) {
				if (!Object.hasOwn(formats, format)) continue;
				const values = formats[format][which];
				const list = Array.isArray(values) ? values : [values];
				for (const value of list) {
					if (!value) continue;
					if (!resultMap[value]) {
						resultMap[value] = [];
					}
					resultMap[value].push(format);
				}
			}
			return resultMap;
		}; // end mimeExtensionMapping

		/* browser http json function **************************************** */

		Fidoo.loadJSON = function (signatureFile, urlJSON) {
			fetch(urlJSON)
				.then((response) => {
					if (!response.ok) {
						throw new Error(`${response.status} ${response.statusText}`);
					}
					return response.json();
				})
				.then((json) => Fidoo.registerJSON(signatureFile, json))
				.catch((error) => {
					Fidoo.logHandler("fatal error", `An error occured: ${urlJSON}: ${error}`);
				});
		}; // end loadJSON

		/* ################################################################### */
		return Fidoo;
	} // end global defineFidoo()

	/* global function definition ************************************ */

	if (typeof Fidoo === "undefined") {
		if (typeof process !== "undefined") {
			// node.js
			const FidooInstance = defineFidoo();
			FidooInstance.setConsoles("nodeJS");
			FidooInstance.readSetup("nodeJS");
			FidooInstance.prepareForNodeJS();
			FidooInstance.loadSignatureData("nodeJS");
			if (typeof module !== "undefined") {
				module.exports = FidooInstance;
			}
			global.Fidoo = FidooInstance;
		} else {
			// browser
			global.Fidoo = defineFidoo();
			global.Fidoo.setConsoles("browser");
			global.Fidoo.readSetup("browser");
			if (global.Fidoo.prepareForBrowser()) {
				global.Fidoo.loadSignatureData("browser");
			} else {
				// if CrappyBrowser™, do something
				// maybe tell folks to use a real browser
				// for now, delete Fidoo for test purposes
				// so we can check in the console it is gone
				delete global.Fidoo;
			}
		}
	} else {
		console.log("Fidoo is already defined");
	} // end define globally if it doesn't already exist
})(typeof globalThis !== "undefined" ? globalThis : this); // end global function definition
