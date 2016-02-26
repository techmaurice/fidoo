// Fidoo v0.1.0
// used only with node.js
// this is only an example app, "AS IS"
// if you want more functionality, use the library and your imagination
// or drop me an e-mail <mauder@gmail.com> to work something out

// NOTE:
// this node.js app reads files synchronously
// if the files were read asynchronously
// the app would possibly be much faster,
// but then we would end up in callback hell
// and possibly run out of file descriptors (aka `EMFILE errno 20`)
// if we do not control that too

var appVersion = "0.1.1";

var Fidoo = require("./lib/fidoo-core.js");
var fs = require("fs");
var maxFileSize = (1024 * 1024) * 32; // MB
var splitChunkSize = (1024 * 1024) * 1; // MB
var inputFile = "";
var outputFile = "";
// write results to file every N files
// to prevent out of memory
// and/or slow object to json conversion
// with lots of results (>50.000)
var writeResultsNumber = 1000;
var results = {};

function main() {
	if(processArguments()) {
		identifyFiles();
		}
	}

function identifyFiles() {
	try { // load filenames from inputFile
		var filenames = fs.readFileSync(inputFile, "utf-8").trim().split("\n");
		}
	catch(error) { // TODO more catching
		process.stderr.write(error + "\n");
		process.exit(0);
		}
	if(filenames.length == 0) {
		process.stderr.write(inputFile + " is empty\n");
		process.exit(0);
		}
	try { // touch to test outputFile
		fs.closeSync(fs.openSync(outputFile, "w"));
		}
	catch(error) { // TODO more catching
		process.stderr.write(error + "\n");
		process.exit(0);
		}
	var start = new Date().getTime();
	var i = 0;
	var count = 0;
	var overwrite = Array(80).join(" ");
	filenames.forEach(function(filename, index, array) {
		i++;
		count++;
		var truncatedFilename = truncateFilename(filename, 54);
		process.stdout.write(overwrite + "\r");
		process.stdout.write("Identifying: " + truncatedFilename + "\r");
		try {
			// here we call Fidoo
			results[filename] = Fidoo.identifyFile(chunkFile(filename), filename, "", null, null);
			}
		catch(error) {
			// this can happen when a file is too big (> several 100 MB)
			// the file cannot be found or opened (permissions)
			// or some other unspecified file reading error
			results[filename] = {result: "", warning: "", error: String(error)};
			}
		if(i == writeResultsNumber || count == filenames.length) {
			results = JSON.stringify(results, null, " ");
			// because we append json text
			// instead of dumping one big whopper
			// we need to repair the structure
			// otherwise json is invalid
			var length = results.length;
			if(count == writeResultsNumber && filenames.length >  writeResultsNumber) {
				// start of file
				// replace last "}" with ",\n "
				results = results.substr(0, (length - 1));
				results = results.trim() + ",\n ";
				}
			else if(count != filenames.length) {
 				// replace first "{" with ""
 				// replace last "}" with ",\n "
				results = results.substr(1, (length - 2));
				results = results.trim() + ",\n ";
				}
			else if(count == filenames.length && filenames.length > writeResultsNumber) {
 				// replace first "{" with ""
				results = results.substr(1);
				results = results.trim();
				}
			try {
				fs.appendFileSync(outputFile, results, encoding="utf8");
				}
			catch(error) { // TODO more catching
				process.stderr.write(error + "\n");
				process.exit(0);
				}
			results = {};
			i = 0;
			}
		});
		var end = new Date().getTime();	
		var seconds = Math.ceil((end - start)/1000);
		var numFilesSecond = Math.ceil(filenames.length / seconds);
		var duration = new Date(null);
		duration.setSeconds(seconds); 
		duration = duration.toISOString().substr(11, 8);
		process.stdout.write(overwrite + "\r");
		process.stdout.write("\rIdentified " + filenames.length + " files in " + duration + " (" + numFilesSecond + " files/second)\n");
	}

function chunkFile(filename) {
	var fd = fs.openSync(filename, "r");
	var stats = fs.fstatSync(fd);
	if(stats.size == 0) {
		fs.closeSync(fd);
		return "";
		}
	if(stats.size > maxFileSize) {
		// if the file is bigger than maxFileSize
		// we split it in two pieces of splitChunkSize (start / end)
		// and glue them together
		// this should yield enough (splitChunkSize * 2) bytes
		// to identify the file
		// kinda hacky but the only way to prevent 
		// node.js choking on big files
		var startChunk = new Buffer(splitChunkSize);
		var endChunk = new Buffer(splitChunkSize);
		fs.readSync(fd, startChunk, 0, splitChunkSize, 0, function(error, bytesRead, buffer) { 
			if(error) {
				fs.closeSync(fd);
				}
			});
		fs.readSync(fd, endChunk, 0, splitChunkSize, (stats.size - splitChunkSize), function(error, bytesRead, buffer) { 
			if(error) {
				fs.closeSync(fd);
				}
			});
		fs.closeSync(fd);
		return String(startChunk.toString("binary") + endChunk.toString("binary"));
		}
	else {
		var chunk = new Buffer(stats.size);
		fs.readSync(fd, chunk, 0, stats.size, 0);
		fs.closeSync(fd);
		return String(chunk.toString("binary"));
		}
	}


function truncateFilename(s, len) {
    if(s.length <= len) {
        return s;
    }
    var lastIndex = s.lastIndexOf(".");
    if(lastIndex == -1) {
    	lastIndex = 0;
    	}
    var ext = s.substring(lastIndex + 1, s.length).toLowerCase();
    // ugly hack to prevent overflow of terminal screen
    // all extensions > 4 characters will be cut off
    if(ext.length > 4) {
    	ext = ext.substring(0,4) + "[...]";
    	len = len - 4;
    	}
    var filename = s.replace('.' + ext,'');
    filename = filename.substr(0, len) + (s.length > len ? '[...]' : '');
    return filename + '.' + ext;
};

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
			if(val[0] === "-inputfile") {
				inputFile = val[1];
				}
			if(val[0] === "-outputfile") {
				outputFile = val[1];
				}
			}
	});
	if(inputFile !== "" && outputFile !== "") {
		showVersion();
		process.stdout.write("Using filelist from '" + inputFile + "', outputting to '" + outputFile + "'\n");
		return true;
		}
	else {
		process.stderr.write("Error: empty or invalid arguments\n");
		showVersion();
		showUsage();
		process.exit(0);
		}
	return false;
}

function showUsage() {
	process.stdout.write("Usage: node fidoo-cli.js -inputfile=files.txt -outputfile=output.json\n");
	process.stdout.write("For more information, see DOCUMENTATION.md\n");
	}

function showVersion() {
	process.stdout.write("Fidoo-cli demo app version " + appVersion + " by Maurice de Rooij\nUsing Fidoo library version " + Fidoo.libVersion + " with PRONOM/FIDO signatures version " + Fidoo.pronomSignatureVersion + "\n");
	}

if (require.main === module) {
    main();
}
