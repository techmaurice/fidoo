FIDOO
=====

Format Identification of Digital Objects Online
-----  

### File Format Signature Data Objects
Objects in memory you can use in your own browser or node app:

OBJECT.pronomSignatures: 
An array of PRONOM signatures, a trimmed down and modified version of the signatures generated by the original FIDO Python app of the Open Preservation Foundation. The original PRONOM signatures are provided by TNA UK. 
Signature updates are pushed to GitHub if there is a new version. Either update your fidoo git or download them manually.
Converting signatures: consult the higly experimental (buggy sometimes) scripts in  "debug/". Meant to be run in a browser. You are on your own there.

OBJECT.extensionPuidMap: 
An array of extensions to PUIDS, e.g. ['x-fmt/230': ['audio/midi', 'x/x']]

OBJECT.extensionPuidMap: 
An array of PUIDS to extensions, e.g. ['audio/midi': ['x-fmt/230','fmt/x']]

#### Examples 
browser: 
```javascript
console.dir(Fidoo.pronomSignatures); 
console.dir(Fidoo.extensionPuidMap); 
console.dir(Fidoo.mimePuidMapJSON); 
```

 node.js: 
```javascript
var fidoo = module.Fidoo; 
fidoo.loadSignatureData(); 
fidoo.dumpObject(fidoo.pronomSignatures); 
fidoo.dumpObject(fidoo.extensionPuidMap); 
fidoo.dumpObject(fidoo.mimePuidMap); 
```

### USAGE
The Fidoo app expects a file with filenames (e.g. /path/to/file.txt) and outputs a file with results.

`node index.js -input=~/fidoo_files.txt -output=~/fidoo_output.txt`

Use quotes around filenames with spaces, like this:
`node index.js -input=~/fidoo_files.txt -output="~/fidoo output.txt"`

### Fidoo global object variables and arrays
Can be altered directly in the library, via fidoo-setup.js or during runtime by changing the variables, for example: `fidoo.debug = false;`.
For all changes goes: Danger, Will Robinson! 
It is therefore recommended to ONLY alter the variables available in fidoo-setup.js. This setup file is loaded before any action is performed, but after the initial variables are loaded in the library. If the setup file is missing, this is silently ignored. This gives the advantage Fidoo will always run, but for node.js it also implies you can use different  settings with a single installation by rewriting or deleting the setup file.

	browserSupported: false,
	cacheJSON: 30, // days in HTML5 storage
	chunkSize: 4096, // raw bytes
	debug: true,
	errorMessages: [],
	extensionPuidMapJSON: "extensionPuidMap-v84-0.json",
	fidooSignatureFixesJSON: "fidooSignatureFixes-v84-0.json",
	identifyZip: false,
	libVersion: "0.0.1",
	matchingMethod: "strict",
	maxFiles: 250,
	mimePuidMapJSON: "mimePuidMap-v84-0.json",
	nodeInputFile: "",
	nodeJSONUri: "../json/",
	nodeOutputFile: "",
	priorityOverride: false,
	pronomSignaturesJSON: "pronomSignatures-v84-0.json",
	pronomSignatureVersion: 84,
	rawGitUrl: "https://cdn.rawgit.com/techmaurice/fidoo/master/json/",
	regexesMapLoaded: false,
	runningNodeJS: typeof process !== "undefined",
	signaturesLoaded: false,
	toStdOut: false,
	useBrowserInfo: true,

### Fidoo Object functions

#### Browser
TBA

#### node.js
TBA

TechMaurice 2016