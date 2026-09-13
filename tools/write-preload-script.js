#!/usr/bin/env node
"use strict";

/**
 * write-preload-script.js
 *
 * Regenerates the <name>.js "preload script" companion for a signature JSON
 * file that isn't produced by build-signatures.js itself - currently that's
 * just mimePuidMapFixes-*.json, which is hand-maintained and carried over
 * as-is across PRONOM versions (see DOCUMENTATION.md).
 *
 * Usage:
 *   node write-preload-script.js <path-to.json>
 *
 * Example:
 *   node write-preload-script.js ../json/mimePuidMapFixes-v116-0.json
 */

const fs = require("fs");
const path = require("path");
const { writePreloadScript } = require("./build-signatures.js");

function main() {
	const [, , jsonPath] = process.argv;
	if (!jsonPath) {
		console.error("Usage: node write-preload-script.js <path-to.json>");
		process.exit(1);
	}
	const data = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
	const filename = path.basename(jsonPath);
	const jsPath = jsonPath.replace(/\.json$/, ".js");
	writePreloadScript(jsPath, filename, data);
}

main();
