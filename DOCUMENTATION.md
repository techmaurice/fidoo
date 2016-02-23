Fidoo
=====

Format Identification of Digital Objects Online
-----

<h3 style="color: red;"></h3>

A javascript library to determine the file-type and version of a file.

Fidoo can be used to check file-types before uploading or as a node.js app to analyse files on a file-system.

Fidoo uses a trimmed down and modified  [FIDO](https://github.com/openpreserve/fido/) signature version of [PRONOM](http://www.nationalarchives.gov.uk/pronom/) signature files.

Project demo: <https://rawgit.com/techmaurice/fidoo/master/fidoo-web.html>

"Fancy" demo: <http://www.techmaurice.com/fidoo/>

### Fidoo is a file format identification library
Although the example node.js app and web app which are included with this repository work as expected, Fidoo is not a turn-key app but a file format identification library written in Javascript. Fidoo supports implementation in both node.js and webbased HTML5 applications. 

Fidoo only has one function, that is to identify the format of files and offers no support to read or write files, except reading its own configuration and signature-files. It is up to you how you supply the binary content of files to Fidoo to analyse the format and what to do with the results. 

This makes Fidoo a "real" Javascript library you can use in your own projects. Some examples: to check the filetype of files before uploading to a website or offline as part of a server workflow. 

### Synchronous execution
Fidoo is executed synchronous. You supply a binary string and get a Javascript object back as resultset. Please note that execution in a browser will be asynchronous due to the way browsers read files from the local filesystem.

In node.js you can use both synchronous and asynchronous functions to read files, although asynchronous reading is recommended as it prevents application blocking and yields better performance due to the internal workings of node.js. The downside of asynchronous reading is you have to keep track of results using events and/or callbacks instead of waiting for them synchronously.

Also with asynchronous reading in node.js you need to keep a keen eye on how many files are opened at one time, and more important, close the file descriptors. If you run out of file descriptors, node.js will give up. 
Of course you can enlarge the number of file descriptors (look it up for you particular OS) but it is better to close them as you should.

### Fidoo functions
If you load `fidoo-core.js`, Fidoo is ready for use, after loading its configuration and signature files automatically.

Although Fidoo contains multiple functions, there is only one you should use:

```javascript
Fidoo.identifyFile(**binarystream** [[, **filename**] [, **mimetype**] [, **matchingMethod** ("strict"/"relaxed")] [, **disablePriority** (true/false)]])
```
which returns a Javascript object. 

Arguments matchingMethod and disablePriority are optional and default to what is configured. 
If matchingMethod is "strict", matching PUIDs are only returned when _all_ matches are satisfied for that particular signature (BOF or BOF + EOF or BOF + VAR or BOF +  VAR + EOF). 

If matchingMethod is "relaxed", matching PUIDs are returned if at least BOF matches.

Arguments filename and mimetype are optional, but if these are supplied you will get a richer resultset returned with information about the file extension and mimetype.

#### Runtime options
Before each call to `Fidoo.identifyFile` you can change configuration, for example to first perform "strict" identification of a file and successively a "relaxed" identification. Also you can enable or disable "priority override" at will, or one or both while calling `Fidoo.identifyFile`.
You can also call `identifyFile` with different options, see usage.

#### Resultset
Fidoo returns a resultset depending on configuration, and if you supplied the filename and/or mimetype. Because the resultset is a Javascript object, you can easily modify or enhance it, save it as a JSON file or insert it into a JSON database.

Two main object arrays are passed back in the resultset: "result", "warning" and "error".

Resultset structure:
		PUID (ex. fmt/43) is an array with the following keys per result:
			pronomSignaturename: Pronom signature name, ex. "JFIF 1.01" (string)
			pronomFormatName: Format name, ex. "JPEG File Interchange Format" (string)
			pronomFormatVersion: Format version, ex. "1.01" (string)
			pronomMimetypes: Mime type, ex. "image/jpeg" (string or array when multiple) // Needs fix
			pronomContentType:	Content type, ex. "Image (Raster)" (string)
			pronomAppleUid: Apple UID, ex. "public.jpeg" (string)
			pronomHasPriorityOver:	PUID , ex. "fmt/41" (array)
			matchtypes:	"bof", "eof", "var" (array)
			score:	"bof", "eof", "var" (array)


[Example result](https://cdn.rawgit.com/techmaurice/fidoo/master/json/example_result_pdf.json) of the file [embedded-png.pdf](https://cdn.rawgit.com/openpreserve/format-corpus/97a8bf726d56106f3d7e5c8c481e26da7f5cc86e/office-examples/OpenOffice.org%203.2.0%20OSX/embeds/embedded-png.pdf) from the OPF format-corpus.


Possible errors:
`Fidoo.identifyFile expects at least one argument: binaryString (type: string)`
This happens when you call Fidoo.identifyFile without arguments

`Fidoo.identifyFile expects binaryString to be a string, not an object`
This happens when you pass an object instead of a string.

`Fidoo.identifyFile expects binaryString to be a string`
This happens when you pass "something" else (eg. null, false) instead of a string.

`EACCES: permission denied`, `ENOENT`, `E...`, etc ...
This happens if there is no permission to open a file, the file is not found, or some other unspecified file error. 
Please note that these kind of file errors are emitted by node.js, not Fidoo itself, as Fidoo does not read files.

Possible warnings:
`empty binaryString`
This happens when the string is empty (ie. maybe an empty file).

### Example app: usage
The Fidoo example app `fidoo-cli.js` expects a plain text file with filenames (e.g. /path/to/file.txt) with one file per line and outputs a json file with results.

`node fidoo-cli.js -inputfile=~/fidoo_files.txt -outputfile=~/fidoo_output.json`

Use quotes around filenames with spaces, like this:
`node fidoo-cli.js -inputfile=~/fidoo_files.txt -outputfile="~/fidoo outputfile.json"`

Please note that all "logic" for reading and writing files is done in `fidoo-cli.js` and not in the library `fidoo-core.js`. If you want to extend or change the app, please only do so in `fidoo-cli.js`. It would be cool if you commit any offspring to the Fidoo repository on GitHub, so it can be incorporated as example. Give it a unique name (e.g. `fidoo-yourname.js` and push it to the main branch of Fidoo. Don't forget your documentation ;)

### Fidoo global object variables and arrays
Can be altered directly in the library, via fidoo-setup.js or during runtime by changing the variables, for example: `fidoo.debug = false;`.
For all changes goes: *Danger, Will Robinson*! 

It is therefore recommended to ONLY alter the variables available in fidoo-setup.js. This setup file is loaded before any action is performed, but after the initial variables are loaded in the library. If the setup file is missing, this is silently ignored, except when debug is enabled. This gives the advantage Fidoo will always run, but for node.js it also implies you can use different  settings with a single installation by rewriting or deleting the setup file.

### Fidoo functions

The `Fidoo` object is static and saves no results. The function `identifyFile` returns a result set as an array (see above).

#### Browser
If you load fidoo-core.js with a script tag in a browser, call `identifyFile` from the automatically available global variable Fidoo.

```javascript
var resultArray = Fidoo.identifyFile(**binarystream** [[, **filename**] [, **mimetype**] [, **matchingMethod** ("strict"/"relaxed")] [, **disablePriority** (true/false)]])
```

#### node.js
If you load fidoo-core.js (by using require) into a global variable in node.js, Fidoo is automatically `exported` to that variable.

```javascript
var Fidoo = require("./lib/fidoo-core.js");
var resultArray = Fidoo.identifyFile(**binarystream** [[, **filename**] [, **mimetype**] [, **matchingMethod** ("strict"/"relaxed")] [, **disablePriority** (true/false)]])
```

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
var Fidoo = module.Fidoo; 
Fidoo.dumpObject(Fidoo.pronomSignatures); 
Fidoo.dumpObject(Fidoo.extensionPuidMap); 
Fidoo.dumpObject(Fidoo.mimePuidMap); 
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