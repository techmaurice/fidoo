/*
fidoo-debug.js for debugging signatures
does not work with current version
needs a bit of love
*/

var formats = pronomSignaturesXML.formats.format;

var max_files = 1000;

function invokeDebugStuff() {
	updateStatus("INFO", "STARTING IN DEBUG MODE");
// $("#debugDump").html(JSON.stringify(xml2json("http://localhost/fidoo/js/fidoo-0.4/formats-v79.xml")));
	// set event-listener for file picker
//	document.getElementById("files").addEventListener("change", handleFileSelect, false);
// 	changeDiv("app_version", app_version);
// 	changeDiv("max_files", max_files);
// 	dumpExtensionsPuidsJSON();// 
// 	showSignatureJSON(500);
// 	dumpSignatureJSON();
//	showMimePuidsJSON(10000);
	dumpMimePuidsJSON();
//	$("#debugDump").html(JSON.stringify(mimePuidMap));
} // end function

function showSignatureJSON(max) {
	extMap = puidsToSignaturesMapping();
	var i = 0;
	for(key in extMap) {
		i++;
		if(i < max) {
			updateDiv("debugDump", "<p />" + key + " = " + JSON.stringify(extMap[key]));
			}
		}
} // end function

function dumpSignatureJSON() {
	extMap = puidsToSignaturesMapping();
	$("#debugDump").html("<textarea rows=20 cols=100>"  + JSON.stringify(extMap) + "</textarea>");
} // end function

function showExtensionsPuidsJSON(max) {
	extMap = extensionToPuidsMapping();
	var i = 0;
	for(key in extMap) {
		i++;
		if(i < max) {
			$("#debugDump").html( "<p />" + key + " = " + JSON.stringify(extMap[key]));
			}
		}
} // end function

function dumpExtensionsPuidsJSON() {
	extMap = extensionToPuidsMapping();
	$("#debugDump").append("<p />"  + JSON.stringify(extMap));
} // end function

function showMimePuidsJSON(max) {
	extMap = mimeToPuidsMapping();
	var i = 0;
	for(key in extMap) {
		i++;
		if(i < max) {
			$("#debugDump").html("<p />" + key + " = " + JSON.stringify(extMap[key]));
			}
		}
} // end function

function dumpMimePuidsJSON() {
	extMap = mimeToPuidsMapping();
	$("#debugDump").html("<p />"  + JSON.stringify(extMap));
} // end function

function XMLtoJSON(filename) {
$xml = loadXMLDoc(filename);
return xml2json($xml);
}
