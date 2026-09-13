#!/usr/bin/env node
"use strict";

/**
 * build-signatures.js
 *
 * Regenerates fidoo's json/pronomSignatures-*.json and json/formatExtensions-*.json
 * from FIDO's own PRONOM-derived signature XML files (fido/conf/formats-vNN.xml and
 * fido/conf/format_extensions.xml, from https://github.com/openpreserve/fido).
 *
 * This replaces the old debug/fidoo-convert.js (a browser-only, hand-rolled, "buggy
 * sometimes" script per its own comments) with a small dependency-free Node script
 * that can be re-run whenever FIDO/PRONOM publish a new signature version.
 *
 * FIDO's XML is simple and regular enough that a full XML parser isn't needed: this
 * uses targeted regex extraction instead of a generic DOM/SAX parser.
 *
 * Usage:
 *   node build-signatures.js <path-to-fido-conf-dir> <pronomVersion> <outDir>
 *
 * Example:
 *   node build-signatures.js ../fido/fido/conf 116 ../fidoo/json
 */

const fs = require("fs");
const path = require("path");

function decodeXmlEntities(text) {
	return text
		.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
		.replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/&apos;/g, "'")
		.replace(/&amp;/g, "&");
}

function extractAll(block, tag) {
	const re = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "g");
	const out = [];
	let m;
	while ((m = re.exec(block)) !== null) {
		out.push(decodeXmlEntities(m[1]).trim());
	}
	return out;
}

function extractOne(block, tag) {
	const values = extractAll(block, tag);
	return values.length ? values[0] : undefined;
}

// Translate a FIDO/Python-style regex source into a JS-RegExp-compatible source.
// FIDO regex sources look like: "(?s)\A\xd0\xcf...\Z" or "(?s)P\x00o\x00..."
//   (?s)  -> Python DOTALL inline flag; we use the JS "s" (dotAll) flag instead
//   \A    -> start-of-string anchor; JS doesn't support \A, use ^ (and we never
//             pass the "m" flag, so ^ behaves like \A here)
//   \Z    -> end-of-string anchor; same reasoning, translate to $
// Everything else (\xNN hex escapes, character classes, quantifiers, (?:...)
// groups) is already valid JS regex syntax and is passed through unchanged.
// A handful of upstream PRONOM signatures ship a {min,max} quantifier with
// min and max swapped (e.g. "{3000,700}"), which most regex engines reject
// outright. Since the note text for these always describes a plain byte
// offset range, swapping the two numbers back into ascending order recovers
// the obviously-intended range instead of silently dropping the signature.
function fixSwappedQuantifiers(source, context) {
	return source.replace(/\{(\d+),(\d+)\}/g, (whole, a, b) => {
		const min = Number(a);
		const max = Number(b);
		if (min > max) {
			console.warn(`  fixing swapped quantifier {${a},${b}} -> {${b},${a}} in ${context}`);
			return `{${b},${a}}`;
		}
		return whole;
	});
}

function translateRegex(source, context) {
	let out = source;
	if (out.startsWith("(?s)")) {
		out = out.slice(4);
	}
	out = out.replace(/\\A/g, "^").replace(/\\Z/g, "$");
	out = fixSwappedQuantifiers(out, context);
	return out;
}

function isArrayLike(values) {
	return Array.isArray(values) && values.length > 0;
}

function parseSignatureBlock(sigBlock, context) {
	const result = {};
	const name = extractOne(sigBlock, "name");
	if (name) result.name = name;

	const patternRe = /<pattern>([\s\S]*?)<\/pattern>/g;
	let m;
	while ((m = patternRe.exec(sigBlock)) !== null) {
		const patternBlock = m[1];
		const position = extractOne(patternBlock, "position");
		const regex = extractOne(patternBlock, "regex");
		if (!position || !regex) continue;
		const translated = translateRegex(regex, `${context} (${position})`);
		if (position === "BOF") result.bofregex = translated;
		if (position === "VAR") result.varregex = translated;
		if (position === "EOF") result.eofregex = translated;
	}
	return result;
}

function parseFormatsXml(xmlText) {
	const formatBlocks = xmlText.match(/<format>[\s\S]*?<\/format>/g) || [];

	const puidToFormat = {};
	const idToPuid = {};

	for (const block of formatBlocks) {
		const puid = extractOne(block, "puid");
		if (!puid) continue;

		const entry = {};
		const name = extractOne(block, "name");
		if (name) entry.name = name;

		const version = extractOne(block, "version");
		if (version) entry.version = version;

		const extensions = extractAll(block, "extension");
		if (isArrayLike(extensions)) {
			entry.extension = extensions.length === 1 ? extensions[0] : extensions;
		}

		const mimes = extractAll(block, "mime");
		if (isArrayLike(mimes)) {
			entry.mime = mimes.length === 1 ? mimes[0] : mimes;
		}

		// FIDO renamed PRONOM's "apple_uid" field to "apple_uti"; fidoo's own
		// data/API keeps the original "apple_uid" property name for compatibility.
		const appleUti = extractOne(block, "apple_uti") || extractOne(block, "apple_uid");
		if (appleUti) entry.apple_uid = appleUti;

		const hasPriorityOver = extractAll(block, "has_priority_over");
		if (isArrayLike(hasPriorityOver)) entry.has_priority_over = hasPriorityOver;

		// details/content_type
		const detailsBlock = extractOne(block, "details");
		if (detailsBlock) {
			const contentType = extractOne(detailsBlock, "content_type");
			if (contentType) entry.content_type = contentType;
		}

		const signatureBlocks = block.match(/<signature>[\s\S]*?<\/signature>/g) || [];
		if (signatureBlocks.length) {
			entry.signatures = signatureBlocks.map((sig) => parseSignatureBlock(sig, puid)).filter((s) => s.bofregex || s.varregex || s.eofregex);
			if (entry.signatures.length === 0) delete entry.signatures;
		}

		const pronomId = extractOne(block, "pronom_id");
		if (pronomId) idToPuid[pronomId] = puid;

		puidToFormat[puid] = entry;
	}

	// second pass: resolve is_subtype_of / is_supertype_of (stored by pronom_id) to PUIDs
	for (const block of formatBlocks) {
		const puid = extractOne(block, "puid");
		if (!puid || !puidToFormat[puid]) continue;
		const detailsBlock = extractOne(block, "details");
		if (!detailsBlock) continue;

		const subtypeIds = extractAll(detailsBlock, "is_subtype_of");
		const subtypePuids = subtypeIds.map((id) => idToPuid[id]).filter(Boolean);
		if (subtypePuids.length) puidToFormat[puid].is_subtype_of = subtypePuids;

		const supertypeIds = extractAll(detailsBlock, "is_supertype_of");
		const supertypePuids = supertypeIds.map((id) => idToPuid[id]).filter(Boolean);
		if (supertypePuids.length) puidToFormat[puid].is_supertype_of = supertypePuids;
	}

	return puidToFormat;
}

function main() {
	const [, , confDir, pronomVersion, outDir] = process.argv;
	if (!confDir || !pronomVersion || !outDir) {
		console.error("Usage: node build-signatures.js <fido-conf-dir> <pronomVersion> <outDir>");
		process.exit(1);
	}

	const versionTag = `${pronomVersion}-0`;

	const formatsXmlPath = path.join(confDir, `formats-v${pronomVersion}.xml`);
	const extensionsXmlPath = path.join(confDir, "format_extensions.xml");

	console.log(`Reading ${formatsXmlPath} ...`);
	const formatsXml = fs.readFileSync(formatsXmlPath, "utf-8");
	const pronomFormats = parseFormatsXml(formatsXml);
	console.log(`Parsed ${Object.keys(pronomFormats).length} PRONOM formats`);

	console.log(`Reading ${extensionsXmlPath} ...`);
	const extensionsXml = fs.readFileSync(extensionsXmlPath, "utf-8");
	const extensionFormats = parseFormatsXml(extensionsXml);
	console.log(`Parsed ${Object.keys(extensionFormats).length} format-extension entries`);

	const pronomSignatures = {
		version: versionTag,
		comment: "Do not edit this file unless you know what you are doing",
		formats: pronomFormats,
	};

	const formatExtensions = {
		version: versionTag,
		comment: "Use this file to add your own signatures",
		formats: extensionFormats,
	};

	fs.mkdirSync(outDir, { recursive: true });
	const pronomOut = path.join(outDir, `pronomSignatures-v${versionTag}.json`);
	const extOut = path.join(outDir, `formatExtensions-v${versionTag}.json`);

	fs.writeFileSync(pronomOut, JSON.stringify(pronomSignatures, null, " "));
	fs.writeFileSync(extOut, JSON.stringify(formatExtensions, null, " "));

	console.log(`Wrote ${pronomOut}`);
	console.log(`Wrote ${extOut}`);
}

main();
