(function(window){
	"use strict";
	function defineFidoo(){
		var Fidoo = {};
		Fidoo.debug = true;
		Fidoo.appVersion = "0.5";
		Fidoo.supported = false;
		Fidoo.matchingMethod = "strict";
		Fidoo.priorityOverride = false;
		Fidoo.identifyZip = false;
		Fidoo.chunkSize = 4096; // raw bytes
		Fidoo.pronomVersion = 84;
		Fidoo.maxFiles = 250;
		Fidoo.rawGitUrl = "https://cdn.rawgit.com/techmaurice/fidoo/master/json/";
		Fidoo.pronomSignaturesJSON = "pronomSignatures-v84-0.json";
		Fidoo.extensionPuidMapJSON = "extensionPuidMap-v84-0.json";
		Fidoo.mimePuidMapJSON = "mimePuidMap-v84-0.json";
		Fidoo.fidooSignatureFixesJSON = "fidooSignatureFixes-v84-0.json";
		Fidoo.signaturesLoaded = false;
		Fidoo.regexesMapLoaded = false;
		Fidoo.useBrowserInfo = true;
		Fidoo.errorMessages = [];
		// error consoles (console.log, console.error, console.debug)
		Fidoo.consoleFatal = function(message){console.error(message);}
		Fidoo.consoleDebug = function(message){console.debug(message);}
		
		Fidoo.readSetup = function() {
			if(window.FidooUserSetup) {
				
				}
			if(window.FidooCSS) {
				
				}
			if(window.FidooConfiguration) {
				
				}

			}
		
		/**
		* @desc checks browser support
		* @return bool Indicates if browser is supported (true or false)
		*/
		Fidoo.checkBrowserSupport = function() {
			if(window.File && window.FileReader && window.FileList && window.Blob && window.Worker && window.XMLHttpRequest) {
				Fidoo.browserSupported = true;
				Fidoo.logHandler("info", "Your browser fully supports Fidoo");
				}
			else {
				Fidoo.browserSupported = false;
				Fidoo.logHandler("info", "Your browser does not support Fidoo, please try again with Firefox or Chrome");
				}
			} // end Fidoo.checkBrowserSupport()
		
		Fidoo.loadSignatureData = function () {
			var status = Fidoo.parseSignatureData();

			if(status === true) {
				Fidoo.signaturesLoaded = true;
				return true;
				}
			else {
				Fidoo.logHandler("fatal error", "could not load signature data");
				return false;
				}
			} // end Fidoo.processFileObject
		
		Fidoo.parseSignatureData = function() {
			var status = false;
			
			return status;
			} // end Fidoo.ParseSignatureData
		
		Fidoo.processFileObject = function(fileObject) {
			var status = false;
			if(Fidoo.signaturesLoaded === false) {
				status = Fidoo.loadSignatureData();
				}
			} // end Fidoo.processFileObject

		Fidoo.each = function() {
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
			} // end Fidoo.logHandler
/* ################################################################### */
        return Fidoo;
    } // end defineFidoo()


	// define globally if it doesn't already exist
    if(typeof(Fidoo) === 'undefined'){
        window.Fidoo = defineFidoo();
		// check browser support
		window.Fidoo.checkBrowserSupport();
		}
	else{
		console.log("Fidoo is already defined");
	    }
})(window);

Fidoo.processFileObject("bla");
// console.dir(Fidoo);
