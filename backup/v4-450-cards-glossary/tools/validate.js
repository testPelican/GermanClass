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

// --- Glossary: rules and word translations ------------------------------------------
console.log('\nGlossary:');
const { norm, show } = B.util;
const words = (s) => ` ${norm(String(s || '').replace(/\*+/g, ''))} `;
let glossErrors = 0;
const gfail = (msg) => {
  glossErrors++;
  fail(msg);
};
for (const c of deck.cards) {
  const ids = [].concat(c.rule || []);
  if (!ids.length) gfail(`${c.id}: no "rule" (see data/rules.js)`);
  for (const id of ids) if (!deck.ruleMap[id]) gfail(`${c.id}: unknown rule "${id}"`);

  // Every word of the question needs a translation. A table shows a random set of cells, so check them all.
  const texts = B.ex.questionTexts(c);
  if (c.type === 'table') {
    if (c.verb) texts.push({ text: c.verb });
    for (const r of c.verb ? deck.verbRows(c.verb) : c.rows) texts.push({ text: show(r[0]) }, { text: show(r[1]) });
  }
  const missing = [...new Set(B.gloss.missing(c, texts))];
  if (missing.length) gfail(`${c.id}: no translation for ${missing.join(', ')} (add to data/glossary.js)`);

  // A translation must not say what an English answer option says (cards that ask for a meaning need gloss: false).
  if (c.type === 'mc') {
    const en = B.gloss.entries(c, texts).map((r) => words(r.en)).join('|');
    const answer = norm(c.correct).replace(/^(to|the|a|an) /, '');
    if (answer.length > 2 && en.includes(` ${answer} `)) gfail(`${c.id}: a translation gives away the answer "${c.correct}" (add gloss: false)`);
  }

  // The rule must not contain an answer sentence of the card — unless it stays folded (asksRule: true).
  if (!c.asksRule) {
    const rule = deck.rulesFor(c).map((r) => words([r.title, r.text, ...(r.points || [])].join(' . '))).join(' ');
    const filled = (a) => (c.q && B.ex.BLANK.test(c.q) ? c.q.replace(B.ex.BLANK, a) : null);
    const answers = [
      ...B.ex.choices(c).filter((a) => c.type !== 'mc' || a === c.correct),
      ...(c.type === 'type' ? B.ex.asList(c.answer).map(filled) : []),
      c.type === 'mc' ? filled(c.correct) : null,
      c.type === 'gap' ? c.q.replace(/\{([^}|]+)[^}]*\}/g, '$1') : null,
      c.type === 'spot' ? c.fixed || c.q.replace(c.wrong, c.correct) : null,
      ...(c.type === 'table' ? (c.verb ? deck.verbRows(c.verb) : c.rows).map((r) => r[1]) : []),
    ].filter(Boolean).map((a) => norm(show(a))).filter((a) => a.includes(' '));
    const hit = answers.find((a) => rule.includes(` ${a} `));
    if (hit) gfail(`${c.id}: the rule text contains the answer "${hit}" (change the example, or add asksRule: true)`);
  }
}
const folded = deck.cards.filter((c) => c.asksRule).length;
const hidden = deck.cards.filter((c) => c.gloss === false).length;
if (!glossErrors) console.log(`  ✓ every card has a rule (${deck.rules.length} rules; ${folded} cards keep it folded)`);
if (!glossErrors) console.log(`  ✓ every question word has a translation (${hidden} meaning cards hide them)`);

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
  // Präteritum vs present, reflexive pronouns
  ['freut', ['freute'], {}, false, 'form', 'freut ≠ freute (present vs Präteritum)'],
  ['ärgert sich', ['ärgerte sich'], {}, false, 'form', 'ärgert sich ≠ ärgerte sich'],
  ['stellt sich vor', ['stellte sich vor'], {}, false, 'form', 'stellt ≠ stellte (separable Präteritum)'],
  ['hatte', ['hatten'], {}, false, 'form', 'hatte ≠ hatten'],
  ['dich', ['mich'], {}, false, 'form', 'dich ≠ mich'],
  ['freue dich', ['freue mich'], {}, false, 'form', 'freue dich ≠ freue mich'],
  ['Ja, ich habe schön einmal Brot gebacken', ['Ja, ich habe schon einmal Brot gebacken'], {}, false, 'form', 'schön ≠ schon'],
  ['gewinnen', ['gewonnen'], { reject: ['gewinnen'] }, false, 'form', 'gewinnen rejected for gewonnen'],
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

if (deck.cards.length < 450) fail(`expected at least 450 cards, found ${deck.cards.length}`);
console.log(failed ? '\n✗ Validation failed\n' : '\n✓ All good\n');
process.exit(failed ? 1 : 0);
