#!/usr/bin/env node
/* Prints a JavaScript file without its comments, for the one-file build (tools/bundle.py), which is near its size
   limit. The comments are found by the parser that ships inside Node, so text that only looks like a comment (in a
   string, a template or a regular expression) is never touched, and the result is checked to parse to the same
   program before it is printed; if it does not, the file is printed unchanged.

     node --expose-internals tools/strip.js js/game.js */
'use strict';
const fs = require('fs');
const acorn = require('internal/deps/acorn/acorn/dist/acorn');
const OPT = { ecmaVersion: 'latest', sourceType: 'script' };
const src = fs.readFileSync(process.argv[2], 'utf8');
const tree = s => JSON.stringify(acorn.parse(s, OPT), (k, v) => (k === 'start' || k === 'end' ? undefined : v));

const cuts = [];
acorn.parse(src, { ...OPT, onComment: (block, text, start, end) => cuts.push([start, end, block]) });
let out = '', at = 0;
for (const [start, end, block] of cuts) {
  const ls = src.lastIndexOf('\n', start - 1) + 1, le = src.indexOf('\n', end), lineEnd = le < 0 ? src.length : le;
  const alone = !src.slice(ls, start).trim() && !src.slice(end, lineEnd).trim() && ls >= at;
  if (alone) {
    // a comment on lines of its own: the lines go
    out += src.slice(at, ls);
    at = le < 0 ? src.length : le + 1;
  } else {
    // a comment after code: the comment goes; one spanning lines leaves a line break (it ends a statement as one would)
    out += src.slice(at, start).replace(/[ \t]+$/, '') + (block && /\n/.test(src.slice(start, end)) ? '\n' : block ? ' ' : '');
    at = end;
  }
}
out += src.slice(at);
let same = false;
try {
  same = tree(out) === tree(src);
} catch (_) {}
process.stdout.write(same ? out : src);
if (!same) process.stderr.write('strip.js: ' + process.argv[2] + ' kept whole (the stripped copy did not match)\n');
