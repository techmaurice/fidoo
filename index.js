var fidoo = require("./lib/fidoo-core.js");
fidoo.debug = false;
// print process.argv
process.argv.forEach(function (val, index, array) {
	if(val === "-v") {
		console.log("Fidoo version v" + fidoo.libVersion);
		console.log("Using PRONOM/FIDO signatures v" + fidoo.pronomSignatureVersion);
		process.exit(0);
		}
});

// fidoo.loadSignatureData();
// fidoo.dumpObject(fidoo.pronomSignatures);
// fidoo.dumpObject(fidoo.extensionPuidMap);
// fidoo.dumpObject(fidoo.mimePuidMap);
// fidoo.dumpObject(fidoo);
