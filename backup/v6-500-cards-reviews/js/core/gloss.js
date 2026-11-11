/*
 * Word translations: the dotted words in the speech bubble and the Glossary.
 *
 *   data/glossary.js   Brezel.gloss.addWords({ wohnt: 'live(s)', aß: 'ate | essen', 'es gibt': 'there is / there are',
 *                                           'stehe … auf': 'get up | aufstehen' })
 *                      "meaning | base form" shows the base form in the Glossary. A key with spaces is a
 *                      phrase; "a … b" is a split verb (b comes later in the same sentence).
 *                      Split forms of separable verbs in data/lexicon.js are added automatically.
 *   card.gloss         false: no translations at all (cards that ask what a word or sentence means)
 *                      { word: false }: hide that word ("that's what this card asks")
 *                      { word: 'text' }: a different meaning for this card only
 *
 * Only question text is translated (see Brezel.ex.questionTexts); answer choices never are,
 * so a translation can't give the answer away. Names (data/lexicon.js proper nouns) get none.
 */
(function () {
  'use strict';
  const B = window.Brezel;
  const { h } = B.util;

  const WORD = /\p{L}+(?:[-'’]\p{L}+)*/gu;
  const SPLIT = ' … ';
  const STOP = /[.!?;→–—]/; // ends the search for the second half of a split verb
  const OPEN = /[\s„“"'‚‘«»(\[]/;
  const MAX_PHRASE = 4;

  const words = Object.create(null); // form → {en, base}
  const phrases = Object.create(null); // "es gibt" → {en, base}
  const splits = Object.create(null); // "stehe … auf" → {en, base}
  const names = new Set();
  const baseOf = Object.create(null); // "wohnt" → "wohnen", from data/lexicon.js
  const lower = (s) => s.toLocaleLowerCase('de');

  function parse(v) {
    if (v === false) return { hidden: true };
    const [en, base] = String(v).split(' | ');
    return { en: en.trim(), base: base ? base.trim() : null };
  }

  function addWords(obj) {
    for (const [k, v] of Object.entries(obj)) {
      if (k.includes(SPLIT)) splits[lower(k)] = parse(v);
      else if (k.includes(' ')) phrases[lower(k)] = parse(v);
      else words[k] = parse(v);
    }
  }

  function addNames(list) {
    for (const n of list) names.add(lower(String(n).replace(/_/g, ' ')));
  }

  let ready = false;
  /** Lexicon facts are read lazily: data files load after this one. */
  function prepare() {
    if (ready) return;
    ready = true;
    addNames(B.deck.properNouns);
    for (const v of Object.values(B.deck.verbs)) {
      const meaning = String(v.en || '').replace(/^.*= /, '').replace(/^to /, '').replace(/ \/ to /g, ' / '); // "sich anziehen = to get dressed" → "get dressed"
      for (const f of [...(v.forms || []), ...(v.prt || [])]) {
        const [stem, prefix] = f.split(' ');
        if (prefix) {
          const key = lower(stem + SPLIT + prefix);
          if (!splits[key]) splits[key] = { en: meaning, base: v.inf };
        } else if (lower(f) !== lower(v.inf)) baseOf[lower(f)] = v.inf;
      }
      if (v.pp && lower(v.pp) !== lower(v.inf)) baseOf[lower(v.pp)] = v.inf;
    }
  }

  function cardOverride(card, key) {
    const o = card && card.gloss && typeof card.gloss === 'object' ? card.gloss : null;
    if (!o) return null;
    if (Object.prototype.hasOwnProperty.call(o, key)) return parse(o[key]);
    const k = lower(key);
    for (const ok of Object.keys(o)) if (lower(ok) === k) return parse(o[ok]);
    return null;
  }

  function lookupWord(w, initial, card) {
    const own = cardOverride(card, w);
    if (own) return own;
    const exact = words[w];
    const low = words[lower(w)];
    // "Sie" at the start of a sentence may be she, they or formal you
    if (initial && exact && low && exact !== low) return { en: `${low.en} / ${exact.en}`, base: low.base || exact.base };
    // verb: found under its lower-case entry, so a base form from the lexicon applies
    // ("Hast" → haben), but not to a noun with the same letters ("Frage" ≠ ich frage)
    if (exact || low) return Object.assign({ verb: !!(low && (low === exact || !exact)) }, exact || low);
    return words[w.charAt(0).toUpperCase() + w.slice(1)] || null;
  }

  function isInitial(text, at) {
    let i = at - 1;
    while (i >= 0 && OPEN.test(text[i])) i--;
    return i < 0 || /[.!?:…→–—]/.test(text[i]);
  }

  /**
   * Split text into word tokens with their translation:
   * {text, start, end, en, base, hidden, name, group, label}
   * Words in one phrase or split verb share a group number and a label ("stehe … auf").
   */
  function tokens(text, card) {
    prepare();
    const toks = [];
    for (const m of String(text).matchAll(WORD)) toks.push({ text: m[0], start: m.index, end: m.index + m[0].length });
    const gap = (a, b) => text.slice(toks[a].end, toks[b].start);
    let group = 0;

    // phrases and multi-word names, longest first
    for (let i = 0; i < toks.length; i++) {
      for (let n = Math.min(MAX_PHRASE, toks.length - i); n >= 2; n--) {
        const run = toks.slice(i, i + n);
        // words next to each other; a dot is allowed for abbreviations ("St. Pölten")
        if (run.some((t) => t.group) || run.slice(1).some((t, k) => !/^\.?\s+$/.test(gap(i + k, i + k + 1)))) continue;
        const key = text.slice(run[0].start, run[n - 1].end).replace(/\s+/g, ' ');
        const hit = cardOverride(card, key) || phrases[lower(key)];
        if (hit || names.has(lower(key))) {
          group++;
          for (const t of run) Object.assign(t, hit || { name: true }, { group, label: key });
          i += n - 1;
          break;
        }
      }
    }

    // split verbs: "Heute stehe ich um 7:30 auf."
    for (let i = 0; i < toks.length; i++) {
      if (toks[i].group) continue;
      for (let k = i + 1; k < toks.length; k++) {
        if (STOP.test(gap(k - 1, k))) break;
        if (toks[k].group) continue;
        const key = toks[i].text + SPLIT + toks[k].text;
        const hit = cardOverride(card, key) || splits[lower(key)];
        if (hit) {
          group++;
          const label = k === i + 1 ? toks[i].text + ' ' + toks[k].text : key; // "schloss ab" in a table cell
          for (const t of [toks[i], toks[k]]) Object.assign(t, hit, { group, label });
          break;
        }
      }
    }

    for (const t of toks) {
      if (t.group) continue;
      const hit = lookupWord(t.text, isInitial(text, t.start), card);
      if (hit) Object.assign(t, hit);
      else if (names.has(lower(t.text))) t.name = true;
    }
    return toks;
  }

  const known = (t) => t.en || t.hidden;

  /**
   * Glossary rows for a card: [{de, en, base, hidden}] in reading order, without repeats.
   * texts: [{text, loose?}]; a loose text (from the instructions) is used only if every word is known,
   * so English or Polish words in an instruction are left out.
   */
  function entries(card, texts) {
    if (card && card.gloss === false) return [];
    const rows = [];
    const seen = new Set();
    for (const { text, loose } of texts) {
      const toks = tokens(text, card);
      if (loose && toks.some((t) => !known(t) && !t.name)) continue;
      const done = new Set();
      for (const t of toks) {
        if (!known(t) || done.has(t.group || t)) continue;
        done.add(t.group || t);
        const de = t.label || t.text;
        const base = t.base || (t.verb && baseOf[lower(de)]) || null;
        const key = lower(de) + '=' + (t.en || '');
        if (seen.has(key)) continue;
        seen.add(key);
        rows.push({ de, en: t.en || '', base: base && lower(base) !== lower(de) ? base : null, hidden: !!t.hidden });
      }
    }
    return rows;
  }

  /** Words in non-loose texts that have no translation (used by tools/validate.js). */
  function missing(card, texts) {
    const out = [];
    for (const { text, loose } of texts) {
      if (loose) continue;
      for (const t of tokens(text, card)) if (!known(t) && !t.name) out.push(t.text);
    }
    return out;
  }

  // --- dotted words + tooltip ------------------------------------------------------------
  const SKIP = '.blank-inline, .gap-slot, button';
  let tip = null;
  let tipWord = null;
  let pinned = false;

  /** Wrap every translated word inside el in a dotted span. Blanks and buttons are left alone. */
  function decorate(el, card) {
    if (!el || (card && card.gloss === false)) return;
    const parts = [];
    let text = '';
    (function walk(node) {
      for (const n of Array.from(node.childNodes)) {
        if (n.nodeType === 3) {
          parts.push({ n, at: text.length });
          text += n.nodeValue;
        } else if (n.nodeType === 1) {
          if (n.matches(SKIP)) text += ' _ ';
          else walk(n);
        }
      }
    })(el);
    const toks = tokens(text, card).filter(known);
    if (!toks.length) return;
    el._gloss = toks;

    for (const { n, at } of parts) {
      const end = at + n.nodeValue.length;
      const mine = toks.filter((t) => t.start < end && t.end > at);
      if (!mine.length) continue;
      const frag = document.createDocumentFragment();
      let pos = at;
      for (const t of mine) {
        const s = Math.max(t.start, at);
        const e = Math.min(t.end, end);
        if (s > pos) frag.append(text.slice(pos, s));
        frag.append(h('span', { class: 'gw', dataset: { t: String(toks.indexOf(t)), g: String(t.group || '') } }, text.slice(s, e)));
        pos = e;
      }
      if (pos < end) frag.append(text.slice(pos, end));
      n.replaceWith(frag);
    }

    el.addEventListener('pointerover', (e) => {
      const w = e.pointerType === 'mouse' && wordAt(e.target, el);
      if (w && !pinned) showTip(w, el);
    });
    el.addEventListener('pointerout', (e) => {
      if (e.pointerType !== 'mouse' || pinned || !tipWord) return;
      const to = e.relatedTarget && e.relatedTarget.closest ? e.relatedTarget.closest('.gw') : null;
      if (!to || to.dataset.t !== tipWord.dataset.t) hideTip();
    });
    el.addEventListener('click', (e) => {
      const w = wordAt(e.target, el);
      if (!w) return;
      if (pinned && tipWord && tipWord.dataset.t === w.dataset.t) return hideTip();
      showTip(w, el);
      pinned = true;
    });
  }

  function wordAt(node, root) {
    const w = node && node.closest ? node.closest('.gw') : null;
    return w && root.contains(w) ? w : null;
  }

  function showTip(w, root) {
    const t = root._gloss[+w.dataset.t];
    if (!t) return;
    if (!tip) {
      tip = h('div', { class: 'gloss-tip', role: 'tooltip', id: 'gloss-tip', hidden: true });
      document.body.append(tip);
      document.addEventListener('pointerdown', (e) => {
        if (tip.hidden || (e.target.closest && (e.target.closest('.gw') || e.target.closest('.gloss-tip')))) return;
        hideTip();
      }, true);
      window.addEventListener('resize', hideTip);
      window.addEventListener('scroll', hideTip, true);
    }
    hideTip();
    tipWord = w;
    // light up the whole phrase or split verb, and both halves of a word split by **bold** markup
    root.querySelectorAll(t.group ? `.gw[data-g="${t.group}"]` : `.gw[data-t="${w.dataset.t}"]`).forEach((x) => x.classList.add('on'));
    w.setAttribute('aria-describedby', 'gloss-tip');
    tip.replaceChildren(...[
      t.group && !t.name && t.label.includes(' ') ? h('span', { class: 'gloss-tip-de' }, t.label) : null,
      t.hidden ? h('span', { class: 'gloss-tip-en is-hidden' }, '🤫 That’s what this card asks!') : h('span', { class: 'gloss-tip-en' }, t.en),
    ].filter(Boolean));
    tip.hidden = false;
    place(w);
  }

  function place(w) {
    const r = w.getClientRects()[0] || w.getBoundingClientRect();
    tip.classList.remove('above');
    tip.style.left = '0px';
    tip.style.top = '0px';
    const tw = tip.offsetWidth;
    const th = tip.offsetHeight;
    const vw = document.documentElement.clientWidth;
    const cx = r.left + r.width / 2;
    const left = Math.max(8, Math.min(cx - tw / 2, vw - tw - 8));
    let top = r.bottom + 10;
    if (top + th > window.innerHeight - 8) {
      top = r.top - th - 10;
      tip.classList.add('above');
    }
    tip.style.left = left + 'px';
    tip.style.top = top + 'px';
    tip.style.setProperty('--arrow', Math.round(cx - left) + 'px');
  }

  function hideTip() {
    pinned = false;
    if (tipWord) {
      document.querySelectorAll('.gw.on').forEach((x) => x.classList.remove('on'));
      tipWord.removeAttribute('aria-describedby');
      tipWord = null;
    }
    if (tip) tip.hidden = true;
  }

  B.gloss = {
    addWords,
    addNames,
    tokens,
    entries,
    missing,
    decorate,
    hideTip,
    tipOpen: () => !!(tip && !tip.hidden),
  };
})();
