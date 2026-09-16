#!/usr/bin/env node
// Refreshes the board's embedded self-template (const BOARD_TPL_B64) in index.html.
//
// "Download updated board" rebuilds the page from this template: it decodes the
// base64, drops the live data into __DATA__ and the template's own base64 into
// __SELF_TPL__. The template is therefore index.html itself with
//   let DATA=...;                ->  let DATA=__DATA__;
//   const BOARD_TPL_B64="...";   ->  const BOARD_TPL_B64="__SELF_TPL__";
// encoded as UTF-8 base64. Run this after any edit to index.html; it is a
// no-op when the embedded copy is already current.
//
//   node tools/selftpl.js            # update index.html in place
//   node tools/selftpl.js --check    # exit 1 if index.html is stale, change nothing
'use strict';
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'index.html');
const src = fs.readFileSync(file, 'utf8');

const DATA_RE = /^let DATA=.*;$/m;
const TPL_RE = /^const BOARD_TPL_B64="[^"\n]*";$/m;
if (!DATA_RE.test(src)) throw new Error('index.html: no `let DATA=...;` line');
if (!TPL_RE.test(src)) throw new Error('index.html: no `const BOARD_TPL_B64="...";` line');

const template = src
  .replace(DATA_RE, 'let DATA=__DATA__;')
  .replace(TPL_RE, 'const BOARD_TPL_B64="__SELF_TPL__";');
const b64 = Buffer.from(template, 'utf8').toString('base64');
const out = src.replace(TPL_RE, () => 'const BOARD_TPL_B64="' + b64 + '";');

if (out === src) {
  console.log('selftpl: index.html already current (' + b64.length + ' b64 chars)');
} else if (process.argv.includes('--check')) {
  console.error('selftpl: index.html embedded template is stale; run node tools/selftpl.js');
  process.exit(1);
} else {
  fs.writeFileSync(file, out);
  console.log('selftpl: updated index.html (' + b64.length + ' b64 chars)');
}
