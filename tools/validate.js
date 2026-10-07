#!/usr/bin/env node
/*
 * Checks the deck without a browser:  node tools/validate.js
 *  - loads the core, exercise types and all data files (same order as index.html)
 *  - reports cards that failed validation, duplicate ids, counts per topic / type
 *  - runs a few sanity tests of the typed-answer checker
 * Exit code 1 if anything is wrong.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');

// Script order is read from index.html so this never drifts from the app.
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script\s+src="([^"]+)"/g)].map((m) => m[1]).filter((s) => !/\/ui\/|app\.js/.test(s));

const noop = () => {};
const ctx = {
  console,
  setTimeout,
  clearTimeout,
  localStorage: { getItem: () => null, setItem: noop, removeItem: noop },
  addEventListener: noop,
  removeEventListener: noop,
  matchMedia: () => ({ matches: false, addEventListener: noop }),
  document: { addEventListener: noop, documentElement: { dataset: {} } },
  Element: function () {},
  Node: function () {},
};
ctx.window = ctx;
vm.createContext(ctx);

for (const s of scripts) {
  const file = path.join(root, s);
  vm.runInContext(fs.readFileSync(file, 'utf8'), ctx, { filename: s });
}

const B = ctx.Brezel;
B.store.load();
const originalWarn = console.warn;
console.warn = noop;
B.deck.finalize();
console.warn = originalWarn;

let failed = false;
const fail = (msg) => {
  failed = true;
  console.log('  ✗ ' + msg);
};

// --- deck ---------------------------------------------------------------------
const deck = B.deck;
console.log(`\nCards: ${deck.cards.length} valid / ${deck.rawCards.length} written`);
if (deck.problems.length) {
  console.log('\nProblems:');
  for (const p of deck.problems) fail(`${p.id}: ${p.errors.join('; ')}`);
}

const byTopic = {};
const byType = {};
for (const c of deck.cards) {
  byTopic[c.topic] = (byTopic[c.topic] || 0) + 1;
  byType[c.type] = (byType[c.type] || 0) + 1;
  if (!c.explain) fail(`${c.id}: no "explain" text`);
  try {
    const d = B.ex.get(c.type).describe(c);
    if (!d || !d.q || !d.a) fail(`${c.id}: describe() returned an empty question/answer`);
  } catch (e) {
    fail(`${c.id}: describe() threw ${e.message}`);
  }
}
console.log('\nBy topic:');
for (const t of deck.topics) console.log(`  ${t.icon}  ${t.name.padEnd(28)} ${byTopic[t.id] || 0}`);
console.log('\nBy exercise type:');
for (const [k, v] of Object.entries(byType).sort((a, b) => b[1] - a[1])) console.log(`  ${B.ex.label(k).padEnd(30)} ${v}`);

// --- typed-answer checker -------------------------------------------------------
console.log('\nChecker:');
const cases = [
  // [input, answers, opts, expected ok, expected reason/flag, label]
  ['wohnt', ['wohnt'], {}, true, 'exact', 'exact match'],
  ['wohne', ['wohnt'], {}, false, 'form', 'wohne ≠ wohnt (another verb form)'],
  ['wohnnt', ['wohnt'], {}, true, 'typo', 'one extra letter is a typo'],
  ['wohhnnt', ['wohnt'], {}, false, null, 'two wrong letters is wrong'],
  ['Unterstuetzung', ['Unterstützung'], {}, true, 'exact', 'ue for ü'],
  ['Arztin', ['Ärztin'], {}, true, 'typo', 'missing umlaut = typo'],
  ['Unterstüzung', ['Unterstützung'], {}, true, 'typo', 'one missing letter in a long word'],
  ['Unterstüzng', ['Unterstützung'], {}, false, null, 'two missing letters'],
  ['mit den Bus', ['mit dem Bus'], {}, false, 'form', 'dem ≠ den'],
  ['dem', ['den'], {}, false, null, 'short words must be exact'],
  ['Freude', ['Freunde'], {}, false, 'form', 'Freude ≠ Freunde'],
  ['er lest', ['er liest'], {}, false, 'form', 'lest ≠ liest'],
  ['Er fahrt', ['Er fährt'], {}, false, 'form', 'fahrt ≠ fährt'],
  ['Pedro is Arzt', ['Pedro ist Arzt'], {}, false, 'short', 'slip in a short word inside a sentence'],
  ['gestudiert', ['studiert'], { reject: ['gestudiert'] }, false, 'form', 'reject list'],
  ['strasse', ['Straße'], {}, true, 'exact', 'ss for ß'],
  ['wo wohnen sie', ['Wo wohnen Sie?'], {}, true, 'exact', 'case & punctuation ignored'],
  ['', ['wohnt'], {}, false, 'empty', 'empty input'],
  // slips from the Kapitel 1 worksheets
  ['schlaft', ['schläft'], {}, false, 'form', 'schlaft ≠ schläft (ihr-form)'],
  ['ist', ['isst'], {}, false, 'form', 'ist ≠ isst'],
  ['seit', ['seid'], {}, false, 'form', 'seit ≠ seid'],
  ['fahrst', ['Fährst'], { reject: ['fahrst'] }, false, 'form', 'fahrst rejected for Fährst'],
  ['blaibe', ['bleibe'], {}, true, 'typo', 'blaibe is a spelling typo'],
];
for (const [input, answers, opts, ok, flag, label] of cases) {
  const r = B.check.typed(input, answers, opts);
  const flagOk = !flag || (flag === 'exact' ? r.exact : flag === 'typo' ? r.typo : flag === 'empty' ? r.empty : r.reason === flag);
  if (r.ok === ok && flagOk) console.log(`  ✓ ${label}`);
  else fail(`${label}: "${input}" vs ${JSON.stringify(answers)} → ${JSON.stringify(r)}`);
}
const capital = B.check.typed('wo wohnen sie?', ['Wo wohnen Sie?']);
if (!capital.caseNote) fail('formal Sie note missing');
else console.log('  ✓ formal Sie capital reminder');
const nounHint = B.check.typed('lehrerin', ['Lehrerin'], { nounHint: true });
if (!nounHint.caseNote) fail('noun capital note missing');
else console.log('  ✓ noun capital reminder');

// Every typed card: the shown answer must be accepted, and must not be flagged by its own family rules.
for (const c of deck.cards) {
  if (c.type !== 'type') continue;
  for (const a of B.ex.asList(c.answer)) {
    const r = B.check.typed(a, B.ex.asList(c.answer), c);
    if (!r.ok) fail(`${c.id}: its own answer "${a}" is not accepted`);
  }
}

if (deck.cards.length < 300) fail(`expected at least 300 cards, found ${deck.cards.length}`);
console.log(failed ? '\n✗ Validation failed\n' : '\n✓ All good\n');
process.exit(failed ? 1 : 0);
