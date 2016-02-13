// Fidoo v0.0.1
// used only with node.js
// this is only an example app, "AS IS"
// if you want more functionality, use the library and your imagination
// or drop me an e-mail <mauder@gmail.com> to work something out

var fidoo = require("./lib/fidoo-core.js");
var fs = require("fs");
var inputFile = "";
var outputFile = "";
var results = {};

function main() {
	if(processArguments()) {
		identifyFiles();
		}
	}

function identifyFiles() {
	try {
		var filenames = fs.readFileSync(inputFile, "utf-8").trim().split("\n");
		}
	catch(error) { // TODO more handling
		console.error(error);
		process.exit(0);
		}
	if(filenames.length == 0) {
		console.error(inputFile + " is empty");
		process.exit(0);
		}
	filenames.forEach(function(val, index, array) {
		console.log("Identifying: " + val);
		try {
			var binaryString = chunkFile(val);
			results[val] = fidoo.identifyFile(binaryString, null, null, val, "");
			}
		catch(error) {
			// this can happen when a file is too big (> several 100 MB)
			// or some other unspecified file reading error
			results[val] = {result: "", warning: "", error: String(error)};
			}
		});
		results = JSON.stringify(results, null, " ");
		fs.writeFile(outputFile, results, function(error) {
			if(error) {
				return console.log(error);
			}
		console.log("Identification done");
		console.log("Results saved to " + outputFile);
		}); 		
	}

// here we limit the size of files (or binaryString) to max 64 MB
function chunkFile(filename) {
	// if len > 64 MB
	// chunk = 0+32MB + end-32MB
	var maxChunkSize = (64 * 1024 * 1024);
	var halfChunkSize = (32 * 1024 * 1024);
	var fd = fs.openSync(filename, "r");
	var stats = fs.fstatSync(fd);
	var tempChunk;
	if(stats.size > maxChunkSize) {
// 		console.log(stats.size + " - " + halfChunkSize + " = " + (stats.size - halfChunkSize));
// 		console.log("Biggie!");
		var startChunk = new Buffer(halfChunkSize);
		var endChunk = new Buffer(halfChunkSize);
		fs.readSync(fd, startChunk, 0, halfChunkSize, 0, function(error, bytesRead, buffer) { console.log(error); } );
		fs.readSync(fd, endChunk, 0, halfChunkSize, (stats.size - halfChunkSize), function(error, bytesRead, buffer) { console.log(error); });
		return startChunk.toString("binary") + endChunk.toString("binary");
		}
	else {
		var startChunk = new Buffer(halfChunkSize);
		fs.readSync(fd, startChunk, 0, stats.size, 0);
		return String(startChunk.toString("binary"));
		}
	
	}

function processArguments() {
	if(process.argv.length === 2) {
		showVersion();
		showUsage();
		process.exit(0);
		}
	process.argv.forEach(function (val, index, array) {
		if(val === "-v") {
			showVersion();
			process.exit(0);
			}
		if(val.indexOf('=') !== -1) {
			val = val.split("=");
			if(val[0] === "-input") {
				inputFile = val[1];
				}
			if(val[0] === "-output") {
				outputFile = val[1];
				}
			}
	});
	if(inputFile !== "" && outputFile !== "") {
		console.log("Using filelist from '" + inputFile + "', outputting to '" + outputFile + "'");
		return true;
		}
	else {
		console.log("Error: empty or invalid arguments");
		showUsage();
		process.exit(0);
		}
	return false;
}

function showUsage() {
	console.log("Usage: node index.js -input=files.txt -output=output.json");
	console.log("More options available, see DOCUMENTATION.md");
	}

function showVersion() {
	console.log("Fidoo version v" + fidoo.libVersion + " using PRONOM/FIDO signatures v" + fidoo.pronomSignatureVersion);
	}

function dumpSignatures() {
	fidoo.dumpObject(fidoo.pronomSignatures);
	fidoo.dumpObject(fidoo.extensionPuidMap);
	fidoo.dumpObject(fidoo.mimePuidMap);
	}

if (require.main === module) {
    main();
}
