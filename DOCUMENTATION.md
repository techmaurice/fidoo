Fidoo
=====

Format Identification of Digital Objects Online
-----  

### Fidoo is a file format identification library
Although the example node.js app and web app that go with the library work as expected, Fidoo is not a turn-key app but a file format identification library written in Javascript. Fidoo supports implementation in both node.js and webbased HTML5 applications. 

Fidoo only has one function, that is to identify the format of files and offers no support to read or write files, except reading its own configuration and signature-files. It is up to you how you supply the binary content of files to Fidoo to analyse the format and what to do with the results. 

This makes Fidoo a "real" Javascript library you can use in your own projects. Some examples: to check the filetype of files before uploading to a website or offline as part of a server workflow. 

### Synchronous execution
Fidoo is executed synchronous. You supply a binary string and get a Javascript object back as resultset. Please note that execution in a browser will be asynchronous due to the way browsers read files from the local filesystem.

In node.js you can use both synchronous and asynchronous functions to read files, although asynchronous reading is recommended as it prevents application blocking and yields better performance due to the internal workings of node.js. The downside of asynchronous reading is you have to keep track of results using events and/or callbacks instead of waiting for them synchronously.

### Fidoo functions
If you load `fidoo-core.js`, Fidoo is ready for use, after loading its configuration and signature files automatically.

Although Fidoo contains multiple functions, there is only one you should use:
`Fidoo.identifyFile(**binarystream**, **matchingMethod** (strict/relaxed), **disablePriority** (true/false), [, [**filename**], [**mimetype]])` 
  
which returns a Javascript object. 

Arguments matchingMethod and disablePriority are optional and default to what is configured. 

Arguments filename and mimetype are optional, but if these are supplied you will get a richer resultset returned with information about the extension and mimetype.

#### Runtime options
Before each call to `Fidoo.identifyFile` you can change configuration, for example to first perform "strict" identification of a file and successively a "relaxed" identification. Also you can enable or disable "priority override" at will, or one or both while calling `Fidoo.identifyFile`.

#### Resultset
Fidoo returns a resultset depending on configuration, and if you supplied the filename and/or mimetype. Because the resultset is a Javascript object, you can easily modify or enhance it, save it as a JSON file or insert it into a JSON database.

Two main object arrays are passed back in the resultset: "result", "warning" and "error".

Possible errors:
`Fidoo.identifyFile expects at least one argument: binaryString (type: string)`
This happens when you call Fidoo.identifyFile without arguments

`Fidoo.identifyFile expects binaryString to be a string, not an object`
This happens when you pass an object instead of a string.

`Fidoo.identifyFile expects binaryString to be a string`
This happens when you pass "something" else (eg. null, false) instead of a string.

Possible warnings:
`empty binaryString`
This happens when the string is empty (ie. maybe an empty file).

### Example app: usage
The Fidoo example app `fidoo.js` expects a plain text file with filenames (e.g. /path/to/file.txt) with one file per line and outputs a json file with results.

`node fidoo.js -input=~/fidoo_files.txt -output=~/fidoo_output.json`

Use quotes around filenames with spaces, like this:
`node fidoo.js -input=~/fidoo_files.txt -output="~/fidoo output.json"`

Please note that all "logic" for reading and writing files is done in `fidoo.js` and not in the library `fidoo-core.js`. If you want to extend or change the app, please only do so in `fidoo.js`. It would be cool if you commit any offspring to the Fidoo repository on GitHub, so it can be incorporated as example. Give it a unique name (e.g. `fidoo-yourname.js` and push it to the main branch of Fidoo. Don't forget your documentation ;)

### Fidoo global object variables and arrays
Can be altered directly in the library, via fidoo-setup.js or during runtime by changing the variables, for example: `fidoo.debug = false;`.
For all changes goes: *Danger, Will Robinson*! 

It is therefore recommended to ONLY alter the variables available in fidoo-setup.js. This setup file is loaded before any action is performed, but after the initial variables are loaded in the library. If the setup file is missing, this is silently ignored. This gives the advantage Fidoo will always run, but for node.js it also implies you can use different  settings with a single installation by rewriting or deleting the setup file.

		checkJSON: [],
		chunkSize: 4096, // raw bytes
		debug: true,
		extensionPuidMap: {},
		extensionPuidMapJSON: "extensionPuidMap-v84-0.json",
		fidooSignatureFixesJSON: "fidooSignatureFixes-v84-0.json",
		libVersion: "0.0.2",
		matchingMethod: "strict",
		mimePuidMap: {},
		mimePuidMapJSON: "mimePuidMap-v84-0.json",
		nodeJSONUri: "../json/",
		disablePriority: false,
		pronomSignatures: {},
		pronomSignaturesJSON: "pronomSignatures-v84-0.json",
		pronomSignatureVersion: 84,
		rawGitUrl: "https://cdn.rawgit.com/techmaurice/fidoo/master/json/",
		regexesMap: {},
		runningNodeJS: typeof process !== "undefined",
		signaturesLoaded: false,

### Fidoo Object functions

#### Browser
TBA

#### node.js
TBA

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
fidoo.dumpObject(fidoo.pronomSignatures); 
fidoo.dumpObject(fidoo.extensionPuidMap); 
fidoo.dumpObject(fidoo.mimePuidMap); 
```

### License
Apache 2.0, see LICENSE.txt for more information

### Need help implementing Fidoo into your project?
Drop an email and we can work something out.
  
### Notes
Although you are free to use Fidoo in your own projects, I would very much appreciate to get credited.

If you use Fidoo in your workflow and/or think it is useful, consider making a donation through PayPal <https://www.paypal.me/techmaurice>. Any amount is welcome and helps the development of Fidoo.

If you have any questions, suggestions or a code fix, please submit these to Github <https://github.com/techmaurice/fidoo/>.

<hr />
TechMaurice 2016
