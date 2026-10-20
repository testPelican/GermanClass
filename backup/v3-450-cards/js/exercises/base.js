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
 * }
 * api = { changed(ready), submit(), sfx(name), speak(text), card }
 *
 * Common card fields: id, type, prompt (instruction), q (German text shown in the
 * speech bubble, "___" marks a blank), say (text for the speaker button),
 * en (English meaning, shown small), explain (the "why", shown after answering).
 */
(function () {
  'use strict';
  const B = window.Brezel;
  const { h, md, show } = B.util;

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
    if (card.q && !opts.noBubble) wrap.append(bubble(card.q, { say: card.say, big: opts.big }));
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
    need,
  };
})();
