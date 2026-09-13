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

## Not in scope for this pass

Per your instructions, this pass did not touch: `package.json` (version,
scripts, dependencies), test tooling, linting, or CI. The `test` script is
still the placeholder `"-v"`. `tools/build-signatures.js` currently uses
Node's built-in modules only (no new runtime dependency), so nothing here
required a `package.json` change.

If/when you're ready to publish, consider bumping the version (this is a
behavior-preserving but fairly substantial internal change — `0.2.0` would
be a reasonable semver-minor bump) and updating `Fidoo.libVersion` in
`lib/fidoo-core.js` to match.
