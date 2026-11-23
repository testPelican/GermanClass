/*
 * Difficulty. Every card is Low (1), Medium (2) or High (3):
 *   - a card may say so itself: { level: 2 } (the Verb list does: Präsens 1, Präteritum 2, Perfekt 3);
 *   - otherwise the level comes from what the card asks you to do (auto() below):
 *       recognise (true/false, multiple choice, small match)        → Low
 *       arrange with help (gaps with chips, sort, spot, short order) → Medium
 *       produce from memory (typing, tables, long sentences)         → High
 * Some cards are split into easier copies, so each level has its own version (variants()):
 *   - a typed card with a one-word answer gets a Low multiple-choice copy (id "pr-04~1"); its wrong
 *     options are other real forms of the same word from data/lexicon.js (liest → lese, lest, lesen);
 *   - a typed full sentence gets a Medium sentence-builder copy (id "pa-64~2").
 * A copy has its own progress and reviews. A session never shows a card and its copy together.
 * The session setting is low | medium | high | mixed (mixed = every level).
 * Add { split: false } to a card that should never get a copy.
 */
(function () {
  'use strict';
  const B = window.Brezel;
  const { norm, show, levenshtein, splitSentence } = B.util;

  const SETTINGS = [
    { key: 'low', n: 1, name: 'Low', sub: 'Recognise' },
    { key: 'medium', n: 2, name: 'Medium', sub: 'Build' },
    { key: 'high', n: 3, name: 'High', sub: 'Produce' },
    { key: 'mixed', n: 0, name: 'Mixed', sub: 'Everything' },
  ];
  const NAMES = { 1: 'Low', 2: 'Medium', 3: 'High' };

  const words = (s) => splitSentence(show(String(s || '').replace(/\{[^}]*\}/g, 'x'))).words.length;
  const asList = (x) => (Array.isArray(x) ? x : x == null ? [] : [x]);
  const gapCount = (q) => (String(q).match(/\{[^}]+\}/g) || []).length;

  /** The level a card would get from its exercise type and size. */
  function auto(c) {
    switch (c.type) {
      case 'tf':
        return 1;
      case 'mc': {
        const opts = [c.correct, ...(c.wrong || [])];
        // full-sentence options need careful reading
        return opts.some((o) => words(o) >= 5) || opts.length >= 5 ? 2 : 1;
      }
      case 'match':
        return c.pairs.length <= 4 ? 1 : 2;
      case 'gap': {
        const gaps = gapCount(c.q);
        const chips = gaps + asList(c.options).length;
        if (gaps <= 1 && chips <= 3) return 1;
        return gaps >= 3 || chips >= 7 ? 3 : 2;
      }
      case 'sort': {
        const items = c.buckets.reduce((n, b) => n + b.items.length, 0);
        return items > 9 ? 3 : 2;
      }
      case 'spot':
        return 2;
      case 'order': {
        const n = words(c.answer) - (c.start ? words(c.start) : 0);
        const extra = asList(c.extra).length;
        if (n <= 4 && !extra) return 1;
        return n >= 8 || extra >= 2 || n + extra >= 9 ? 3 : 2;
      }
      case 'type': {
        const a = asList(c.answer)[0];
        return 3;
      }
      case 'table':
        return 3;
      default:
        return 2;
    }
  }

  /** 1 | 2 | 3 */
  function of(card) {
    const n = Number(card && card.level);
    return n === 1 || n === 2 || n === 3 ? n : card && card._auto ? card._auto : auto(card);
  }

  /** Does the card belong to the session setting (low | medium | high | mixed)? */
  function fits(card, setting) {
    const s = SETTINGS.find((x) => x.key === setting);
    return !s || !s.n || of(card) === s.n;
  }

  // --- easier copies ------------------------------------------------------------------------------
  const PRONOUNS = new Set(['ich', 'du', 'er', 'sie', 'es', 'wir', 'ihr']);
  const W_WORDS = new Set(['wo', 'wer', 'wie', 'was', 'wann', 'woher', 'wohin', 'welche', 'welcher', 'welches', 'welchen', 'welchem']);

  /** Other real forms of the same word (closest first), never one of the accepted answers. */
  function distractors(card, deck, pool) {
    const answers = asList(card.answer);
    const a = answers[0];
    const na = norm(a);
    const taken = new Set(answers.map(norm));
    const out = [];
    const add = (x) => {
      const n = norm(x);
      if (!x || !n || taken.has(n)) return;
      taken.add(n);
      out.push(show(x));
    };
    // 1. the card's own list of tempting wrong answers
    asList(card.reject).forEach(add);
    // 2. other forms of the same verb: the same tense first
    for (const v of Object.values(deck.verbs)) {
      const groups = [v.forms || [], v.prt || [], [v.pp, v.inf]];
      const gi = groups.findIndex((g) => g.some((f) => f && norm(f) === na));
      if (gi < 0) continue;
      const rank = (f) => levenshtein(norm(f), na);
      groups[gi].filter(Boolean).slice().sort((x, y) => rank(x) - rank(y)).forEach(add);
      groups.filter((_, i) => i !== gi).flat().filter(Boolean).sort((x, y) => rank(x) - rank(y)).forEach(add);
      break;
    }
    // 3. word families (dem / den / der …), except where another member could also be right.
    //    A translation only takes them when the plural is asked for (Besprechung / Besprechungen).
    const translation = /^translate/i.test(card.prompt || '');
    if (out.length < 3 && !PRONOUNS.has(na) && !W_WORDS.has(na) && (!translation || /plural/i.test(card.prompt))) {
      for (const fam of deck.families) {
        if (!fam.some((w) => norm(w) === na)) continue;
        let members = fam.filter((w) => norm(w) !== na);
        // in / im / ins vs an / am / ans: "am Kino" might also be right, so stay with the same preposition
        if (fam.includes('ins')) members = members.filter((w) => w[0] === a[0].toLowerCase());
        // reflexive pronouns: the Dativ (mir, dir) isn't taught yet
        if (fam.includes('mich') && !['mir', 'dir'].includes(na)) members = members.filter((w) => w !== 'mir' && w !== 'dir');
        members.sort((x, y) => levenshtein(norm(x), na) - levenshtein(norm(y), na)).forEach(add);
      }
    }
    // 4. a translation card: the answers of other translation cards of the topic
    if (out.length < 3 && pool && translation) {
      pool.filter((o) => o !== card && o.rule === card.rule).concat(pool.filter((o) => o !== card && o.rule !== card.rule))
        .map((o) => asList(o.answer)[0]).forEach(add);
    }
    return out.slice(0, 3);
  }

  /** A typed card turned into multiple choice (Low). */
  function choiceCopy(c, deck, pool) {
    if (words(asList(c.answer)[0]) > 2) return null;
    const wrong = distractors(c, deck, pool);
    if (wrong.length < 2) return null;
    const copy = Object.assign({}, c, {
      id: c.id + '~1',
      type: 'mc',
      level: 1,
      variantOf: c.id,
      prompt: String(c.prompt || 'Choose the answer').replace(/^(Type|Write)\b/, 'Choose'),
      correct: show(asList(c.answer)[0]),
      wrong,
    });
    for (const k of ['answer', 'reject', 'strict', 'placeholder', 'sayAnswer']) delete copy[k];
    return copy;
  }

  /** A typed full sentence turned into a sentence builder (Medium). */
  function orderCopy(c) {
    const answers = asList(c.answer);
    if (words(answers[0]) < 3) return null;
    const copy = Object.assign({}, c, {
      id: c.id + '~2',
      type: 'order',
      level: 2,
      variantOf: c.id,
      answer: answers[0],
      answers: answers.slice(1),
    });
    for (const k of ['reject', 'strict', 'placeholder', 'hint']) delete copy[k];
    if (c.hint) copy.prompt = (c.prompt || 'Build the sentence') + ` (${c.hint})`;
    return copy;
  }

  /**
   * Easier copies of typed cards (called by deck.finalize() with the valid cards).
   * The original moves up a level if its copy now takes its place.
   */
  function variants(cards, deck) {
    const out = [];
    const byTopic = {};
    for (const c of cards) (byTopic[c.topic] = byTopic[c.topic] || []).push(c);
    for (const c of cards) {
      c._auto = auto(c);
      // a card with its own level (e.g. the Verb list) is already where its author wants it
      if (c.type !== 'type' || c.split === false || c.variantOf || c.level) continue;
      const pool = byTopic[c.topic].filter((o) => o.type === 'type' && words(asList(o.answer)[0]) <= 2 && !!o.noun === !!c.noun);
      const copy = choiceCopy(c, deck, pool) || orderCopy(c);
      if (!copy) continue;
      out.push(copy);
      if (of(c) <= copy.level) c._auto = Math.min(3, copy.level + 1);
    }
    for (const c of out) c._auto = c.level;
    return out;
  }

  /** The family id of a card and its copies. */
  const base = (card) => card.variantOf || card.id;

  B.level = { SETTINGS, NAMES, auto, of, fits, variants, distractors, base, name: (n) => NAMES[n] || '' };
})();
