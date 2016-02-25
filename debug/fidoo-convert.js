/*
fidoo-convert.js for converting signatures
works, but needs cleaning up
*/

function puidsToSignaturesMapping(signature) {
	var formats = signature.formats.format;
	var puidToSigMap = new Object;
	var idToPuidMap = new Object;
	var puidToIdMap = new Object;
	for (var format in formats) {
		if (formats.hasOwnProperty(format)) {
			puidToSigMap[formats[format].puid] = {};
			if(formats[format].pronom_id) {
				idToPuidMap[formats[format].pronom_id] = formats[format].puid;
				puidToIdMap[formats[format].puid] = formats[format].pronom_id;
				}
			if(formats[format].name) {
				puidToSigMap[formats[format].puid].name = formats[format].name;
				}
			if(formats[format].version) {
				puidToSigMap[formats[format].puid].version = formats[format].version;
				}
			if(formats[format].extension) {
				puidToSigMap[formats[format].puid].extension = formats[format].extension;
				}
			if(formats[format].mime) {
				puidToSigMap[formats[format].puid].mime = formats[format].mime;
				}
			if(formats[format].details && formats[format].details.content_type) {
				puidToSigMap[formats[format].puid].content_type = formats[format].details.content_type;
				}
			if(formats[format].apple_uid) {
				puidToSigMap[formats[format].puid].apple_uid = formats[format].apple_uid;
				}
			if(formats[format].has_priority_over) {
				if(isArray(formats[format].has_priority_over)) {
					puidToSigMap[formats[format].puid].has_priority_over = formats[format].has_priority_over;
					}
				else {
					puidToSigMap[formats[format].puid].has_priority_over = [formats[format].has_priority_over]
					}
				}

			if(formats[format].signature) {
				if(isArray(formats[format].signature)) {
					var signatures = [];
					for(s = 0; s < formats[format].signature.length; s++) {
					signatures.push(puidsToSignaturesMappingHelper(formats[format].signature[s]));
						}
					puidToSigMap[formats[format].puid].signatures = signatures;
					}
				else {
					var signatures = [];
	signatures.push(puidsToSignaturesMappingHelper(formats[format].signature));
					puidToSigMap[formats[format].puid].signatures = signatures;
					}
				} // end if formats signature
			
			} // if format property is true
		} // for format
	// reiterate to map subtypes and supertypes
	for (var format in formats) {
		if (formats.hasOwnProperty(format)) {
			if(formats[format].details && formats[format].details.is_subtype_of) {
				if(isArray(formats[format].details.is_subtype_of)) {
					var subtypes = [];
					for(s = 0; s < formats[format].details.is_subtype_of.length; s++) {
					subtypes.push(idToPuidMap[formats[format].details.is_subtype_of[s]]);
						}
					puidToSigMap[formats[format].puid].is_subtype_of = subtypes;
					}
				else {
					puidToSigMap[formats[format].puid].is_subtype_of = [idToPuidMap[formats[format].details.is_subtype_of]];
					}
				} // end if formats subtype
			if(formats[format].details && formats[format].details.is_supertype_of) {
				if(isArray(formats[format].details.is_supertype_of)) {
					var supertypes = [];
					for(s = 0; s < formats[format].details.is_supertype_of.length; s++) {
					supertypes.push(idToPuidMap[formats[format].details.is_supertype_of[s]]);
						}
					puidToSigMap[formats[format].puid].is_supertype_of = supertypes;
					}
				else {
					puidToSigMap[formats[format].puid].is_supertype_of = [idToPuidMap[formats[format].details.is_supertype_of]];
					}
				} // end if formats supertype
			} // if format property is true
		} // for format
	return puidToSigMap;
	} // end function

function puidsToSignaturesMappingHelper(signature) {
		var result = {};
		if(signature.name) {
			result.name = signature.name;
			}
		if(signature.pattern) {
			var patterns = signature.pattern;
			if(isArray(patterns)) {
				for(x = 0; x < patterns.length; x++) {
					if(patterns[x].position == "BOF") {
						result.bofregex = patterns[x].regex;
						}
					if(patterns[x].position == "VAR") {
						result.varregex = patterns[x].regex;
						}
					if(patterns[x].position == "EOF") {
						result.eofregex = patterns[x].regex;
						}
					}
				}
			else {
				if(patterns.position == "BOF") {
					result.bofregex = patterns.regex;
					}
				if(patterns.position == "VAR") {
					result.varregex = patterns.regex;
					}
				if(patterns.position == "EOF") {
					result.eofregex = patterns.regex;
					}
				}

			}
		return result;
	} // end function

function mimeToPuidsMapping(formats) {
	var mimeMap = new Object;
	for (var format in formats) {
		if (formats.hasOwnProperty(format)) {
			if(isArray(formats[format].mime)) {
				for(x = 0; x < formats[format].mime.length; x++) {
					if(!mimeMap[formats[format].mime[x]]) {
						if(!formats[format].mime[x]) {
							continue;
							} // formats[format].mime[x] is undefined
						else {
							mimeMap[formats[format].mime[x]] = [];
							} // formats[format].mime[x] is defined
						} // if mime not in extmap
				mimeMap[formats[format].mime[x]].push(format);
						} // for x
					} // if isArray mime
			else {
				if(!mimeMap[formats[format].mime]) {
					if(!formats[format].mime) {
						continue;
						} // formats[format].mime is undefined
					else {
						mimeMap[formats[format].mime] = [];
						} // formats[format].mime is defined
					} // if mime not in extmap
				mimeMap[formats[format].mime].push(format);
				} // else is single mime
			} // if format property is true
		} // for format
	return mimeMap;
	} // end function

function extensionToPuidsMapping(formats) {
	var extMap = new Object;
	for (var format in formats) {
		if (formats.hasOwnProperty(format)) {
			if(isArray(formats[format].extension)) {
				for(x = 0; x < formats[format].extension.length; x++) {
					if(!extMap[formats[format].extension[x]]) {
						if(!formats[format].extension[x]) {
							continue;
							} // formats[format].extension[x] is undefined
						else {
							extMap[formats[format].extension[x]] = [];
							} // formats[format].extension[x] is defined
						} // if extension not in extmap
				extMap[formats[format].extension[x]].push(format);
						} // for x
					} // if isArray extension
			else {
				if(!extMap[formats[format].extension]) {
					if(!formats[format].extension) {
						continue;
						} // formats[format].extension is undefined
					else {
						extMap[formats[format].extension] = [];
						} // formats[format].extension is defined
					} // if extension not in extmap
				extMap[formats[format].extension].push(format);
				} // else is single extension
			} // if format property is true
		} // for format
	return extMap;
	} // end function


