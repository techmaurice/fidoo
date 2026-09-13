# Changelog (2026 modernization pass)

This documents the changes made in this modernization pass. The public API
(`Fidoo.identifyFile(...)` and friends) is unchanged, so this should be a
drop-in upgrade for existing consumers.

## Signature data: PRONOM/FIDO v84 → v116

- `json/pronomSignatures-v84-0.json` and `json/formatExtensions-v84-0.json`
  (dated ~2016) are replaced with `pronomSignatures-v116-0.json` and
  `formatExtensions-v116-0.json`, regenerated from FIDO's current
  `formats-v116.xml` / `format_extensions.xml`
  (https://github.com/openpreserve/fido). Format coverage grew from 1,328 to
  2,410 PUIDs.
- `json/mimePuidMapFixes-v84-0.json` was carried over unchanged (renamed to
  `-v116-0`); all PUIDs it references still exist in the v116 data.
- Fidoo's own custom `fidoo-fmt/torrent` signature (BitTorrent, added
  directly to this repo in 2016 and never part of upstream FIDO) was
  preserved through the regeneration. The old `fido-x-fmt/384` (Quicktime)
  entry was dropped because FIDO's own `formats-v116.xml` now carries a
  proper signature for it directly (`x-fmt/384`).
- The old `debug/fidoo-convert.js` ("works, but needs cleaning up", browser
  only) is replaced by `tools/build-signatures.js`, a small dependency-free
  Node script that regenerates the two JSON files from a FIDO checkout. See
  DOCUMENTATION.md for usage — re-run it whenever FIDO/PRONOM ship a new
  release.
- FIDO's regex sources use Python-flavoured syntax (`(?s)` inline dotall,
  `\A`/`\Z` anchors) that plain `new RegExp()` can't parse. The conversion
  script translates these to JS-compatible equivalents.
- Fixed: 5 signatures in the upstream v116 data ship a `{min,max}` regex
  quantifier with the two numbers swapped (e.g. `{3000,700}`), which is
  invalid and would throw at compile time. The build script detects and
  corrects these (logging a warning) instead of dropping the signature.

- `json/example_result_pdf.json` (the sample output in DOCUMENTATION.md) was
  regenerated against v116 using a minimal local PDF 1.4 file, since the
  original example file (from the OPF format-corpus, via a now-dead RawGit
  link) could not be fetched in this environment.

## lib/fidoo-core.js

- Rewritten in modern ES6+ (const/let, arrow functions, template literals);
  behavior and the public `Fidoo` API are unchanged.
- Removed the `Array.prototype.equals` monkey-patch (a real footgun for
  anything else sharing the page/process) in favor of a local helper.
- Regex compilation no longer needs the `unescape()` (deprecated global)
  workaround, since current signature data already uses `\xNN`-style
  escapes directly.
- Regex flags changed from `"igm"` to `"is"`: dropped `g` (which required
  manually resetting `lastIndex` before every match — a documented footgun
  in the old code — and is unnecessary once dropped), dropped `m` (which
  made `^`/`$` match at *any* embedded newline in a chunk, not just the
  true start/end of the BOF/EOF chunk — a latent false-positive risk), and
  added `s` (dotAll, so `.` correctly matches embedded newline bytes in
  binary content, matching the intent of FIDO's `(?s)` patterns).
- Hardened `initializeRegexes()`: a single malformed signature (see above)
  used to throw and, per the default config (`exitOnFatalNodeJS: true`),
  crash/exit the entire process on load. It now skips just that one
  signature with a non-fatal log message.
- `Fidoo.isArray` (a hand-rolled `Object.prototype.toString` check) removed
  in favor of `Array.isArray`.
- Dropped the unused `Fidoo.fs = require('fs')` (flagged "not used?" in the
  original comments, and confirmed unused).
- The dead RawGit CDN URL (`cdn.rawgit.com`, shut down in 2019) is replaced
  with a working jsDelivr GitHub CDN URL.
- Browser-side signature loading (`Fidoo.loadJSON`) now uses `fetch()`
  instead of `XMLHttpRequest`.

## fidoo-cli.js / lib/fidoo-setup.js

- Modern syntax throughout (const/let, template literals).
- Fixed deprecated `new Buffer(...)` calls → `Buffer.alloc(...)`.
- Fixed a dead code path: `fs.readSync(fd, buf, ..., callback)` was passing
  a callback that `fs.readSync` never invokes (it's a synchronous-only
  API), so read errors on the "split large file" path were silently
  swallowed. Wrapped in `try`/`finally` instead.
- Fixed `fs.appendFileSync(outputFile, results, encoding="utf8")`, which
  relied on an accidental implicit-global assignment (`encoding` was never
  declared) to smuggle a third positional argument through — replaced with
  a plain `"utf8"` argument.
- Signature JSON filenames updated to the v116 set.

## fidoo-web.html / lib/fidoo-core.js: fixed a signature-data load race

- Found while testing: identifying a file in the browser demo very shortly
  after page load could return an empty result (`signatureMatches: {}`,
  `extensionPuids: []`, `mimetypePuids: []`) for *any* file, not because
  nothing matched but because `Fidoo.pronomSignatures`/`regexesMap` were
  still empty — the ~700KB of signature JSON is fetched asynchronously and
  hadn't arrived yet. This race existed in the original code too (it used
  async `XMLHttpRequest`), but the v116 data is roughly 2x the size of v84,
  so it's now much easier to hit in normal use.
- Added `Fidoo.ready`, a promise that resolves once signature data has
  actually finished loading (immediately in node.js; after all fetches
  resolve in the browser).
- `fidoo-web.html` now disables the "Browse files" button/input and shows
  "Loading signature data..." until `Fidoo.ready` resolves, instead of the
  old fixed 100ms `setTimeout` guess for showing the signature version.

### Correction: `file://` needs preloaded `<script>` data, not a request API

The original 0.1.x code used `XMLHttpRequest` for browser signature loading,
and this pass initially "modernized" that to `fetch()`. Both turned out to
be dead ends for the common "just double-click fidoo-web.html, no server
needed" workflow: current Chrome treats a `file://` page as a "null" origin
and blocks *any* same-tree `file://` request from it as a CORS violation,
for every request API, not just `fetch()`. (This apparently used to be more
permissive for XHR specifically - hence the original code working in 2016 -
but that's since been tightened.)

Fixed properly this time: signature data is now also shipped as `.js`
"preload script" files (`json/*.js`, generated by `tools/build-signatures.js`
/ `tools/write-preload-script.js` alongside the `.json` files) that just
assign the data onto `window.FidooPreloadedJSON`. `fidoo-web.html` loads
these via ordinary `<script>` tags - which are *not* subject to the
file:// CORS restriction - before `fidoo-core.js` runs, and
`Fidoo.loadSignatureData("browser")` uses that preloaded data directly when
present. `Fidoo.loadJSON` (XHR) is kept as a fallback for anyone who serves
this over an actual http(s) origin and wants to swap in JSON without
regenerating the `.js` wrapper.

Verified by loading `lib/fidoo-setup.js` + the three `json/*.js` preload
scripts + `lib/fidoo-core.js` in order inside a sandboxed (non-node)
JS context with a stubbed `XMLHttpRequest` that throws if constructed -
confirming the preload path is actually used and `Fidoo.ready` resolves
with all 2,410 formats loaded, without a real browser available in this
environment to click-test directly.

## fidoo-web.html

- Modernized the embedded demo script (const/let, arrow functions,
  `for...of`, `Array.from`).
- Removed the legacy `escape()`/`unescape()`/`decodeURIComponent()` chain
  used to work around non-ASCII filenames — modern browsers handle Unicode
  strings in the DOM natively, so filenames are now used as-is.
- Switched `innerHTML` assignments of filenames to `textContent` (the
  values were always plain filenames, never meant to contain markup).
- Removed `returnBrowserInfo()`, a function that was defined and called but
  whose return value was never used.

## package.json: made it npm-publish-ready

- `main` was `"fidoo-cli.js"` (the command-line demo), so `require("fidoo")`
  would have loaded the CLI instead of the library. Changed to
  `"lib/fidoo-core.js"`.
- `license` was `"Apache 2.0"`, which is not a valid SPDX identifier (npm
  warns/flags this on publish). Changed to `"Apache-2.0"`.
- `version` bumped `0.1.4` → `0.2.0` (semver-minor, since this pass is
  behavior-preserving but a substantial internal rewrite plus a signature
  data migration). `Fidoo.libVersion` in `lib/fidoo-core.js` was updated to
  match, so `Fidoo.libVersion` and the published package version agree.
- Added a `files` allowlist (`lib`, `json`, `fidoo-cli.js`,
  `DOCUMENTATION.md`) so the published tarball doesn't pick up
  `debug/`, `fidoo-web.html`, test fixtures, etc. — only what the library
  actually needs at runtime.
- `scripts.test` was `"-v"`, left over from some other setup and not a
  runnable command (`npm test` would fail immediately). There's still no
  real test suite, so this was changed to a non-failing placeholder
  (`echo "no tests specified yet"`) rather than left broken.
- Added `engines.node: ">=16.9.0"` to document the minimum runtime this was
  written and tested against (uses `Object.hasOwn`, added in Node 16.9).

Package name availability was confirmed manually (`fidoo` is not taken on
npm) before bumping the version, since a version number can't be reused
once published.

## fidoo-web.html renamed to fidoo-standalone.html; added fidoo-web-example.html

- `fidoo-web.html` is renamed to `fidoo-standalone.html` to make explicit
  what makes it special: it's the "just open the file, no server needed"
  demo, using the `<script>`-tag signature-data preload described above.
  All references to it (`lib/fidoo-core.js` comments,
  `tools/build-signatures.js`'s generated file header, `DOCUMENTATION.md`)
  were updated to match. `README.md`'s external demo link was untouched
  (it points at a hosted copy, not this repo file).
- Added `fidoo-web-example.html`, a second demo for the case where you're
  serving this over an actual http(s) server rather than opening it from
  disk. Instead of the generated `.js` preload wrappers, it fetches the
  three plain `.json` files directly from `json/` with `fetch()`, using the
  filenames declared in `lib/fidoo-setup.js`, then loads `lib/fidoo-core.js`
  via a dynamically-created `<script>` tag only once that data is in place
  — so `Fidoo.loadSignatureData("browser")` finds `window.FidooPreloadedJSON`
  already populated and never falls back to its own XHR loader. Since
  `fetch()` refuses `file://` URLs outright, this page will not work opened
  directly from disk — that's what `fidoo-standalone.html` is for. Each demo
  now links to the other in its own header comment/body text so it's easy
  to tell which one to use.
- Verified the fetch()-preload flow the same way the original preload-script
  mechanism was verified earlier in this pass: in a sandboxed (non-node)
  `vm` context with a stubbed `fetch()` (serving the real local JSON files)
  and a stubbed `XMLHttpRequest` that throws if constructed, confirming all
  2,410 formats load via `fetch()` and `Fidoo.ready` resolves without XHR
  ever being touched.
- The three generated `json/*.js` preload files were regenerated with
  `tools/write-preload-script.js` purely to pick up the renamed-file
  mention in their auto-generated header comment — their signature data is
  byte-for-byte unchanged.

## Not in scope for this pass

Per your instructions, this pass did not add a real test suite, linting,
or CI. `scripts.test` is a placeholder — see above.
