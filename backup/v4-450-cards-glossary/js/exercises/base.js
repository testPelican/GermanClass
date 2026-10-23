/*
 * Exercise registry. Every exercise type is a plugin:
 *
 *   Brezel.ex.register('mc', {
 *     label: 'Multiple choice',
 *     validate(card, deck) -> [error strings]        // run once at start-up
 *     describe(card)       -> {q, a}                 // plain text for the review screen
 *     render(card, root, api) -> controller
 *   })
 *
 * controller = {
 *   check()    -> {ok, given, note?, typo?}  // given = what the learner answered (text)
 *   solution() -> {html, say?}               // the correct answer, shown when wrong
 *   lock(res)  -> void                       // freeze + colour the answer after checking
 *   key?(e)    -> true if the key was handled
 *   focus?()   -> focus the main input
 *   glossTexts?() -> question text for the Glossary, if more than questionTexts(card) is shown
 * }
 * api = { changed(ready), submit(), sfx(name), speak(text), card }
 *
 * Common card fields: id, type, prompt (instruction), q (German text shown in the
 * speech bubble, "___" marks a blank), say (text for the speaker button),
 * en (English meaning, shown small), explain (the "why", shown after answering),
 * rule (id from data/rules.js, shown in the Glossary), asksRule (the rule gives the answer away),
 * gloss (word translations: see js/core/gloss.js).
 */
(function () {
  'use strict';
  const B = window.Brezel;
  const { h, md, show, norm } = B.util;

  const types = Object.create(null);
  const BLANK = /_{3,}/;

  function register(name, def) {
    def.name = name;
    types[name] = def;
  }

  /** Markdown-lite + "___" blanks (done before show(), which turns _ into spaces). */
  function richText(text) {
    return String(text == null ? '' : text)
      .split(BLANK)
      .map((part) => md(show(part)))
      .join('<span class="blank-inline">&nbsp;</span>');
  }

  function speakButton(say) {
    if (!say || !B.audio.canSpeak) return null;
    return h('button', {
      class: 'speak-btn',
      type: 'button',
      'aria-label': 'Listen',
      title: 'Listen',
      onClick: (e) => {
        e.stopPropagation();
        B.audio.speak(say);
      },
    }, '🔊');
  }

  /** Mascot + speech bubble. */
  function bubble(text, { say, big } = {}) {
    return h('div', { class: 'bubble-row' },
      h('div', { class: 'mascot', 'aria-hidden': 'true' }, '🥨'),
      h('div', { class: 'bubble' + (big ? ' bubble-big' : '') },
        speakButton(say),
        h('span', { class: 'bubble-text', html: richText(text) }))
    );
  }

  /** Title + optional bubble — the standard top of every exercise. */
  function header(card, fallback, opts = {}) {
    const wrap = h('div', { class: 'ex-head' });
    wrap.append(h('h2', { class: 'ex-title', html: md(card.prompt || fallback) }));
    if (card.q && !opts.noBubble) {
      const b = bubble(card.q, { say: card.say, big: opts.big });
      B.gloss.decorate(b.querySelector('.bubble-text'), card);
      wrap.append(b);
    }
    if (card.en && !opts.noEn) wrap.append(h('p', { class: 'ex-en' }, '“' + card.en + '”'));
    if (card.hint) wrap.append(h('p', { class: 'ex-hint' }, h('span', { 'aria-hidden': 'true' }, '💡 '), show(card.hint)));
    return wrap;
  }

  /** The question sentence with its blank filled in (for speech and solutions). */
  function filled(card, answer) {
    if (card.sayAnswer) return card.sayAnswer;
    if (card.q && BLANK.test(card.q)) return show(card.q.replace(BLANK, answer));
    return card.say || null;
  }

  /** Put text into the bubble's blank after checking. */
  function fillBlank(root, text, cls) {
    const b = root.querySelector('.blank-inline');
    if (!b) return;
    b.textContent = show(text);
    b.classList.add('filled');
    if (cls) b.classList.add(cls);
  }

  /** Buttons for ä ö ü ß; inserts into whichever input is active. */
  function umlautBar(getInput) {
    const chars = ['ä', 'ö', 'ü', 'ß', 'Ä', 'Ö', 'Ü'];
    return h('div', { class: 'umlauts', role: 'group', 'aria-label': 'Special letters' },
      chars.map((ch) =>
        h('button', {
          type: 'button',
          class: 'umlaut',
          tabindex: '-1',
          // pointerdown + preventDefault keeps the keyboard open on phones
          onPointerdown: (e) => e.preventDefault(),
          onClick: () => {
            const input = getInput();
            if (!input || input.disabled) return;
            const s = input.selectionStart ?? input.value.length;
            const t = input.selectionEnd ?? input.value.length;
            input.value = input.value.slice(0, s) + ch + input.value.slice(t);
            input.focus();
            input.setSelectionRange(s + 1, s + 1);
            input.dispatchEvent(new Event('input', { bubbles: true }));
          },
        }, ch)
      )
    );
  }

  /** Typed-answer feedback note (typo accepted / wrong form / capital letter). */
  function typedNote(res, given) {
    if (res.ok && res.typo) return `Small typo — accepted! Exact spelling: **${show(res.matched)}**.`;
    if (res.ok && res.caseNote) return res.caseNote;
    if (!res.ok && res.reason === 'form') {
      return `Close, but “${given}” is a different grammatical form — one letter changes the grammar here, so it counts as wrong.`;
    }
    if (!res.ok && res.reason === 'short') {
      return 'Close — but short words like *ist, bin, im, ins, dem* must be spelled exactly: one letter changes the word.';
    }
    return null;
  }

  const asList = (x) => (Array.isArray(x) ? x : x == null ? [] : [x]);

  /** Every answer option and accepted answer of a card. */
  function choices(c) {
    const gaps = c.type === 'gap' && c.q ? [...c.q.matchAll(/\{([^}]+)\}/g)].flatMap((m) => m[1].split('|')) : [];
    return [
      c.correct, ...asList(c.wrong), ...asList(c.options), ...asList(c.extra), c.fix,
      ...(typeof c.answer === 'string' || Array.isArray(c.answer) ? asList(c.answer) : []), ...asList(c.answers),
      ...(c.pairs || []).flat(), ...(c.buckets || []).flatMap((b) => b.items || []), ...gaps,
    ].filter((x) => typeof x === 'string');
  }

  /**
   * The German the learner sees before answering — the only text the Glossary translates:
   * emphasised words in the instruction (unless they are answer options), the bubble with
   * its blanks and gaps left empty, the hint and a fixed sentence start.
   */
  function questionTexts(card) {
    // a blank stays as "_", so the word after it doesn't count as the start of a sentence
    const plain = (s) => String(s).split(BLANK).map(show).join(' _ ');
    const out = [];
    // short options ("ist", "hat gelesen") must not be translated; a full answer sentence may repeat prompt words
    const opts = choices(card).map(norm).filter((o) => o.split(' ').length <= 3).map((o) => ` ${o} `);
    for (const m of String(card.prompt || '').matchAll(/\*\*(.+?)\*\*|\*(.+?)\*/g)) {
      const seg = m[1] || m[2];
      const n = norm(seg.replace(BLANK, ' '));
      if (n && !opts.some((o) => o.includes(` ${n} `))) out.push({ text: plain(seg), loose: true });
    }
    if (card.q) out.push({ text: plain(card.q.replace(/\{[^}]+\}/g, '___')) });
    // a hint may be English ("as") or carry a translation: "aufhören (to stop / finish)"
    if (card.hint) out.push({ text: plain(String(card.hint).replace(/\s*\([^)]*\)/g, '')), loose: true });
    if (card.start) out.push({ text: plain(card.start) });
    return out;
  }

  /** Validation helper: collect messages when conditions fail. */
  function need(errs, cond, msg) {
    if (!cond) errs.push(msg);
    return !!cond;
  }

  B.ex = {
    register,
    get: (name) => types[name],
    names: () => Object.keys(types),
    label: (name) => (types[name] ? types[name].label : name),
    BLANK,
    richText,
    speakButton,
    bubble,
    header,
    filled,
    fillBlank,
    umlautBar,
    typedNote,
    asList,
    choices,
    questionTexts,
    need,
  };
})();
