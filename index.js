// Fidoo v0.0.1
// used only with node.js
// this is only an example app, "AS IS"
// if you want more functionality, use the library and your imagination
// or drop me an e-mail <mauder@gmail.com> to work something out

var fidoo = require("./lib/fidoo-core.js");

function main() {
	processArguments();
	}

function processArguments() {
	if(process.argv.length === 2) {
		showUsage();
		process.exit(0);
		}
	process.argv.forEach(function (val, index, array) {
		if(val === "-v") {
			showVersion();
			process.exit(0);
			}
		if(val === "-stdout") {
			fidoo.toStdOut = true;
			}
		if(val.indexOf('=') !== -1) {
			val = val.split("=");
			if(val[0] === "-input") {
				fidoo.setNodeInputFile(val[1]);
				}
			if(val[0] === "-output") {
				fidoo.setNodeOutputFile(val[1]);
				}
			}
	});
	if(fidoo.nodeInputFile !== "" && fidoo.nodeOutputFile !== "") {
		console.log("Using filelist from '" + fidoo.nodeInputFile + "', outputting to '" + fidoo.nodeOutputFile + "'");
		}
	else {
		console.log("Error: empty or invalid arguments");
		showUsage();
		process.exit(0);
		}
	return true;
}

function showUsage() {
	showVersion();
	console.log("Usage: node index.js -input=files.txt -output=output.txt");
	console.log("More options available, see README");
	}

function showVersion() {
	console.log("Fidoo version v" + fidoo.libVersion + " using PRONOM/FIDO signatures v" + fidoo.pronomSignatureVersion);
	}

function dumpSignatures() {
	fidoo.loadSignatureData();
	fidoo.dumpObject(fidoo.pronomSignatures);
	fidoo.dumpObject(fidoo.extensionPuidMap);
	fidoo.dumpObject(fidoo.mimePuidMap);
	}

if (require.main === module) {
    main();
}
