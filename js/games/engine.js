/*
 * Minigames: the registry, shared content helpers and the contract between a game and the
 * game screen (js/ui/arcade.js), which draws the frame around every game: intro, 3-2-1
 * countdown, score, combo, lives, timer, results and "Another game?".
 *
 *   Brezel.games.register('haben-sein', {
 *     name: 'Haben oder sein?',            // shown on the intro and results
 *     icon: '⚖️',                          // small icon (emoji) for lists and the top bar
 *     art: '<svg viewBox="0 0 120 120">…', // optional big picture for the intro (inline SVG)
 *     color: '#58cc02',                    // accent colour of the game
 *     blurb: 'Swipe each verb to its helper for the Perfekt.',
 *     how: ['← haben · sein →', 'Swipe, tap or use the arrow keys'],   // short how-to lines
 *     topics: ['past', 'pastq', 'verblist'], // topic ids it practises ('*' = every topic)
 *     speech: true,                        // optional: needs text-to-speech (hidden without it)
 *     ready(topic, level) → bool,          // optional: is there enough content for this topic?
 *     time: 60 | (level) => seconds,       // optional: the frame runs a countdown, then calls timeUp()
 *     lives: 3 | (level) => n,             // optional: the game ends when they run out
 *     play(stage, api) → controller,       // build the game inside `stage`
 *   })
 *
 *   controller = { begin?() — the 3-2-1 countdown is over: start here (timers only run from now),
 *                  destroy?(), key?(e) → true if handled, timeUp?() (default: api.end()) }
 *   play() runs before the countdown, so build the screen there and start the action in begin().
 *
 *   api = {
 *     topic,                 'all' or a topic id
 *     level,                 1 (Low) | 2 (Medium) | 3 (High) — "Mixed" picks one per game
 *     hit({ points = 10, el, text }) → points scored   a right answer: combo, sound, "+20" near el
 *     miss({ q, a, given, el })      a mistake: sound, shake, loses a life; listed on the results
 *     end({ won, note })             finish now (won: true/false for games you can win or lose)
 *     progress(done, total)          round-based games: shows "3 / 10" instead of a timer
 *     speak(text, { rate })          German text-to-speech
 *     sfx(name)                      'tap','drop','correct','wrong','combo','complete','tick','go','flip','whoosh','boom','levelup'
 *     after(ms, fn) · every(ms, fn) · frame(fn(dt, t) → false to stop) · wait(ms) → Promise<bool>
 *                                    timers that stop by themselves when the game ends or pauses
 *     get ended, get score, get combo, get lives, get timeLeft
 *   }
 *
 * Games never change learning progress; they earn XP and are saved in Brezel.store (state.games).
 * Content helpers are in Brezel.games.lib (below). Game files must not touch the DOM when they
 * load: tools/validate.js loads them in Node to check their content.
 */
(function () {
  'use strict';
  const B = window.Brezel;
  const { norm, shuffle } = B.util;

  const list = [];
  const map = Object.create(null);

  function register(id, def) {
    def.id = id;
    if (map[id]) list.splice(list.indexOf(map[id]), 1);
    map[id] = def;
    list.push(def);
  }

  const covers = (def, topic) => def.topics === '*' || topic === 'all' || (Array.isArray(def.topics) && def.topics.includes(topic));

  /** Games for a topic ('all' = every game) that have enough content and, if needed, speech. */
  function forTopic(topic, level) {
    return list.filter((g) => {
      if (!covers(g, topic)) return false;
      if (g.speech && !(B.audio && B.audio.canSpeak)) return false;
      try {
        return !g.ready || !!g.ready(topic || 'all', level || 2);
      } catch (e) {
        console.warn('[Brezel] game', g.id, 'ready() failed', e);
        return false;
      }
    });
  }

  const value = (x, level) => (typeof x === 'function' ? x(level) : x);

  // --- content helpers ------------------------------------------------------------------------
  const PERSONS = ['ich', 'du', 'er/sie/es', 'wir', 'ihr', 'sie/Sie'];
  const REFL = ['mich', 'dich', 'sich', 'uns', 'euch', 'sich'];

  /** The user's verb list (Begegnungen A2+ Kapitel 1, D2): [infinitive, reflexive?]. Topic "verblist". */
  const VERB_LIST = [
    'abschließen', 'anfangen', 'aufstehen', 'backen', 'beginnen', 'bekommen', 'bieten', 'bleiben', 'essen', 'fahren',
    'fliegen', 'geben', 'gehen', 'gewinnen', 'halten', 'heißen', 'helfen', 'kommen', 'lesen', 'nehmen', 'einnehmen',
    'schießen', 'schlafen', 'schreiben', 'sein', 'singen', 'stehen', 'sprechen', 'trinken', 'umziehen', 'vergessen',
  ].map((v) => [v, false]).concat([
    'anziehen', 'ärgern', 'bedanken', 'befinden', 'beschweren', 'beeilen', 'duschen', 'erinnern', 'erkälten', 'freuen',
    'föhnen', 'interessieren', 'kämmen', 'schminken', 'streiten', 'treffen', 'umziehen', 'unterhalten', 'verlieben', 'vorstellen',
  ].map((v) => [v, true]));

  const MODALS = ['müssen', 'können', 'möchten', 'mögen', 'wollen', 'dürfen', 'sollen'];
  const INSEPARABLE = /^(be|ver|ent|er|ge|zer|emp|miss|unter|über|hinter|wider)/;

  const verb = (inf) => B.deck.verbs[inf] || null;
  /** "sich anziehen = to get dressed" in the lexicon marks a reflexive verb. */
  const isReflexive = (v) => /^sich /.test(String(v && v.en));
  const isSeparable = (v) => !!(v && v.forms && v.forms[0].includes(' '));
  const isInseparable = (v) => !!(v && !isSeparable(v) && INSEPARABLE.test(v.inf) && v.pp && !v.pp.startsWith('ge'));
  /** English meaning without "sich … =" and "to". */
  const meaning = (v) => String((v && v.en) || '').replace(/^.*= /, '').replace(/^to /, '');

  /**
   * A full verb form with its reflexive pronoun and prefix in place:
   *   form(anziehen, 'present', 0, { reflexive: true }) → "ziehe mich an"
   *   form(anziehen, 'perfekt', 2, { reflexive: true }) → "hat sich angezogen"
   *   form(fahren, 'perfekt', 0) → "bin gefahren"
   * tense: 'present' | 'praet' | 'perfekt'. Returns null if the lexicon lacks that form.
   * Reflexive verbs always take haben in the Perfekt (sich umziehen ≠ umziehen).
   */
  function form(v, tense, person, { reflexive = false } = {}) {
    if (!v) return null;
    const pron = reflexive ? REFL[person] : null;
    if (tense === 'perfekt') {
      if (!v.pp) return null;
      const auxInf = reflexive ? 'haben' : v.aux || 'haben';
      const aux = verb(auxInf);
      if (!aux) return null;
      return [aux.forms[person], pron, v.pp].filter(Boolean).join(' ');
    }
    const forms = tense === 'praet' ? v.prt : v.forms;
    if (!forms || !forms[person]) return null;
    const [head, ...rest] = forms[person].split(' ');
    return [head, pron, ...rest].filter(Boolean).join(' ');
  }

  /**
   * Lexicon verbs that fit a topic: [{ v, reflexive }]. need: fields the game needs ('prt', 'pp').
   * verblist → the user's list; reflexive → reflexive verbs; prefix → separable + inseparable;
   * praet → verbs with a Präteritum; past / pastq / tenses → verbs with a participle; verbs → modals.
   */
  function verbsFor(topic, { need = [] } = {}) {
    const all = Object.values(B.deck.verbs);
    let out;
    switch (topic) {
      case 'verblist':
        out = VERB_LIST.map(([inf, reflexive]) => ({ v: verb(inf), reflexive })).filter((x) => x.v);
        break;
      case 'reflexive':
        out = all.filter(isReflexive).map((v) => ({ v, reflexive: true }));
        break;
      case 'prefix':
        out = all.filter((v) => isSeparable(v) || isInseparable(v)).map((v) => ({ v, reflexive: false }));
        break;
      case 'verbs':
        out = MODALS.map(verb).filter(Boolean).map((v) => ({ v, reflexive: false }));
        break;
      case 'praet':
        out = all.filter((v) => v.prt).map((v) => ({ v, reflexive: isReflexive(v) }));
        break;
      case 'past':
      case 'pastq':
      case 'tenses':
      case 'present':
      case 'all':
        out = all.map((v) => ({ v, reflexive: isReflexive(v) }));
        break;
      default:
        out = [];
    }
    return out.filter(({ v }) => need.every((k) => (k === 'prt' ? v.prt : k === 'pp' ? v.pp : v[k])));
  }

  /**
   * Cards of a topic for the game's level (falls back to every level when fewer than `min`).
   * types: allowed exercise types. Variant cards (easy copies of typed cards) are left out.
   */
  function cardsFor(topic, level, { types = null, min = 8 } = {}) {
    const inTopic = (c) => !topic || topic === 'all' || B.deck.inTopic(c, topic);
    const base = B.deck.cards.filter((c) => inTopic(c) && !c.variantOf && (!types || types.includes(c.type)));
    const fits = B.level ? base.filter((c) => B.level.of(c) === level) : base;
    return fits.length >= min ? fits : base;
  }

  /** Random order without repeats; refills (reshuffled) when used up, never repeating the last item first. */
  function deal(items) {
    let bag = [];
    let last = null;
    return function next() {
      if (!items.length) return null;
      if (!bag.length) {
        bag = shuffle(items);
        if (bag.length > 1 && bag[0] === last) bag.push(bag.shift());
      }
      last = bag.shift();
      return last;
    };
  }

  const sample = (items, n) => shuffle(items).slice(0, n);
  const same = (a, b) => norm(a) === norm(b);
  /** Unique by normalised text, without `except`. */
  const uniq = (items, except = []) => {
    const seen = new Set(except.map(norm));
    return items.filter((x) => x && !seen.has(norm(x)) && seen.add(norm(x)));
  };

  B.games = {
    register,
    get: (id) => map[id] || null,
    get list() {
      return list.slice();
    },
    forTopic,
    has: (topic, level) => forTopic(topic, level).length > 0,
    covers,
    value,
    data: {},
    lib: {
      PERSONS, REFL, VERB_LIST, MODALS,
      verb, isReflexive, isSeparable, isInseparable, meaning, form, verbsFor, cardsFor, deal, sample, same, uniq,
    },
  };
})();
