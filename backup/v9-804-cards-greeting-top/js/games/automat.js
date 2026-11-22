/*
 * Verb-Automat: a slot machine with three reels (person · verb · tense). Pull the lever, the reels
 * stop one after another, then give the verb form: Low picks from 4 (Präsens), Medium 4 tricky
 * options (Präsens + Präteritum), High types it (+ Perfekt). Reflexive verbs come with their
 * pronoun (ich ziehe mich an). 10 spins; quick answers score more.
 * gen(topic, level) → next() makes the spins without a DOM, for tests.
 */
(function () {
  'use strict';
  const B = window.Brezel;
  const { h, md, show, shuffle, pick, pulse, reducedMotion } = B.util;
  const L = B.games.lib;
  const Q = B.games.quick;
  const LABEL = { present: 'Präsens', praet: 'Präteritum', perfekt: 'Perfekt' };
  const TENSES = { 1: ['present'], 2: ['present', 'praet'], 3: ['present', 'praet', 'perfekt'] };
  const SHOWN = [['ich'], ['du'], ['er', 'sie', 'es'], ['wir'], ['ihr'], ['sie', 'Sie']];
  const ENDINGS = { present: ['e', 'st', 't', 'en', 't', 'en'], praet: ['te', 'test', 'te', 'ten', 'tet', 'ten'] };
  const SPINS = 10;

  function automatPool(topic) {
    const seen = new Set();
    return L.verbsFor(topic).filter(({ v, reflexive }) => v.forms && !seen.has(v.inf + reflexive) && seen.add(v.inf + reflexive));
  }

  /** "kauf" + "ein" + pronoun → "kaufe mich ein"-style assembly, like lib.form. */
  function assemble(head, prefix, pron) {
    return [head, pron, prefix].filter(Boolean).join(' ');
  }

  /** Wrong but believable forms: no vowel change (er fahrt), a weak Präteritum (er fahrte), the wrong helper (er ist gelesen). */
  function fakeForms(v, tense, p, reflexive) {
    const pron = reflexive ? L.REFL[p] : null;
    const prefix = L.isSeparable(v) ? v.forms[0].split(' ')[1] : '';
    const base = prefix && v.inf.startsWith(prefix) ? v.inf.slice(prefix.length) : v.inf;
    const stem = base.endsWith('en') ? base.slice(0, -2) : base.replace(/n$/, '');
    if (tense === 'perfekt') {
      if (!v.pp) return [];
      const wrongAux = L.verb(reflexive || v.aux !== 'sein' ? 'sein' : 'haben');
      return wrongAux ? [[wrongAux.forms[p], pron, v.pp].filter(Boolean).join(' ')] : [];
    }
    const e = /[td]$/.test(stem) && (p === 1 || p === 2 || p === 4) ? 'e' : '';
    let end = ENDINGS[tense][p];
    if (end === 'st' && /[sßzx]$/.test(stem)) end = 't'; // du vergesst, not "vergessst"
    return [assemble(stem + e + end, prefix, pron)];
  }

  function automatGen(topic, level) {
    const pool = automatPool(topic);
    const tenses = TENSES[level];
    return function make(tries = 0) {
      let tense = pick(tenses);
      let cands = pool.filter(({ v }) => (tense === 'present' ? v.forms : tense === 'praet' ? v.prt : v.pp));
      if (!cands.length) {
        tense = 'present';
        cands = pool;
      }
      const { v, reflexive } = pick(cands);
      const p = Math.floor(Math.random() * 6);
      const who = pick(SHOWN[p]);
      const answer = L.form(v, tense, p, { reflexive });
      if (!answer) return tries < 30 ? make(tries + 1) : null;
      const sameTense = [0, 1, 2, 3, 4, 5].map((q) => L.form(v, tense, q, { reflexive }));
      const otherTense = Object.keys(LABEL).filter((t) => t !== tense).map((t) => L.form(v, t, p, { reflexive }));
      const fakes = level >= 2 ? fakeForms(v, tense, p, reflexive) : [];
      const others = level === 1 ? shuffle(sameTense) : [...fakes, ...shuffle(otherTense), ...shuffle(sameTense)];
      const word = (reflexive ? 'sich ' : '') + v.inf;
      return {
        p, who, v, reflexive, tense, word, answer,
        options: [answer].concat(L.uniq(others, [answer]).slice(0, 3)),
        accept: [answer, `${who} ${answer}`],
        reject: L.uniq([...sameTense, ...otherTense, ...fakes], [answer]),
        en: L.meaning(v),
        q: `${who} + ${word} + ${LABEL[tense]}`,
        a: `${who} ${answer}`,
      };
    };
  }

  const LEVER = '<svg viewBox="0 0 40 120" aria-hidden="true"><rect x="16" y="20" width="8" height="78" rx="4" fill="#9aa5ab"/><rect x="17.5" y="22" width="2.5" height="74" rx="1.2" fill="#fff" opacity=".5"/><circle cx="20" cy="18" r="15" fill="#ff4b4b"/><circle cx="15" cy="13" r="5" fill="#fff" opacity=".55"/><rect x="6" y="94" width="28" height="22" rx="7" fill="#c62f2f"/></svg>';

  function play(stage, api) {
    const level = api.level;
    const next = automatGen(api.topic, level);
    const typed = level === 3;
    const pool = automatPool(api.topic);
    const reelVals = [
      SHOWN.flat(),
      pool.map(({ v, reflexive }) => (reflexive ? 'sich ' : '') + v.inf),
      TENSES[level].map((t) => LABEL[t]),
    ];

    const strips = [0, 1, 2].map(() => h('div', { class: 'am-strip' }));
    const reels = strips.map((s, i) => h('div', { class: 'am-reel am-reel-' + i }, s));
    const lever = h('button', { type: 'button', class: 'am-lever', 'aria-label': 'Pull the lever (Space)', html: LEVER });
    lever.addEventListener('click', () => spin());
    const bulbs = h('div', { class: 'am-bulbs', 'aria-hidden': 'true' }, Array.from({ length: 9 }, () => h('i')));
    const machine = h('div', { class: 'am-machine' },
      h('div', { class: 'am-marquee' }, bulbs, h('span', {}, 'VERB-AUTOMAT')),
      h('div', { class: 'am-window', role: 'img', 'aria-label': 'Reels' }, reels),
      h('div', { class: 'am-labels', 'aria-hidden': 'true' }, h('span', {}, 'Person'), h('span', {}, 'Verb'), h('span', {}, 'Zeit')),
      lever);
    const ask = h('div', { class: 'am-ask', 'aria-live': 'polite' });
    const opts = h('div', { class: 'rs-opts am-opts', role: 'group', 'aria-label': 'Answers' });
    const fb = h('div', { class: 'rs-fb am-fb', 'aria-live': 'polite' });
    let input = null;
    let typeBox = null;
    if (typed) {
      input = h('input', { class: 'type-input rs-input', type: 'text', autocomplete: 'off', autocorrect: 'off', autocapitalize: 'off', spellcheck: 'false', enterkeyhint: 'done', 'aria-label': 'Your answer', placeholder: 'Type the verb form', lang: 'de', disabled: true });
      const okBtn = h('button', { type: 'button', class: 'btn btn-primary rs-ok' }, 'OK');
      okBtn.addEventListener('click', () => submitTyped());
      typeBox = h('div', { class: 'rs-type', hidden: true }, h('div', { class: 'rs-type-row' }, input, okBtn), B.ex.umlautBar(() => input));
    }
    stage.append(h('div', { class: 'am' + (typed ? ' is-typed' : '') }, machine, ask, typed ? typeBox : opts, fb));

    // the reels show something before the first spin
    strips.forEach((s, i) => s.replaceChildren(h('div', { class: 'am-cell' }, reelVals[i][0] || '?')));

    let state = 'idle'; // idle → spinning → answer → feedback → idle …
    let item = null;
    let done = 0;
    let elapsed = 0;
    let btns = [];
    api.progress(0, SPINS);

    function idle() {
      state = 'idle';
      machine.classList.add('is-idle');
      lever.disabled = false;
      ask.replaceChildren(h('div', { class: 'am-pull' }, 'Pull the lever!', h('small', {}, ' Space / Enter')));
      opts.replaceChildren();
      if (typeBox) typeBox.hidden = true;
    }

    async function spin() {
      if (state !== 'idle' || api.ended) return;
      state = 'spinning';
      item = next();
      if (!item) return api.end({});
      machine.classList.remove('is-idle');
      lever.disabled = true;
      pulse(lever, 'pull');
      api.sfx('whoosh');
      fb.className = 'rs-fb am-fb';
      fb.replaceChildren();
      ask.replaceChildren(h('div', { class: 'am-pull spinning' }, 'Rrrrr…'));
      const finals = [item.who, item.word, LABEL[item.tense]];
      const durs = reducedMotion() ? [0, 0, 0] : [900, 1300, 1700];
      strips.forEach((strip, i) => {
        const vals = Array.from({ length: 12 }, () => pick(reelVals[i]));
        vals.push(finals[i]);
        strip.replaceChildren(...vals.map((x) => h('div', { class: 'am-cell', lang: 'de' }, x)));
        const cell = strip.firstElementChild.offsetHeight || 56;
        const to = `translateY(${-(vals.length - 1) * cell}px)`;
        if (!durs[i] || typeof strip.animate !== 'function') strip.style.transform = to;
        else strip.animate([{ transform: 'translateY(0)' }, { transform: to }], { duration: durs[i], easing: 'cubic-bezier(.12,.75,.3,1.06)', fill: 'forwards' });
      });
      for (let i = 0; i < 3; i++) {
        const prev = i ? durs[i - 1] : 0;
        if (!(await api.wait(durs[i] - prev))) return;
        api.sfx('drop');
        pulse(reels[i], 'stop');
      }
      if (!(await api.wait(150))) return;
      ask.replaceChildren(h('div', { class: 'am-q' },
        h('span', { class: 'am-chip' }, item.who), h('span', { class: 'am-plus' }, '+'),
        h('span', { class: 'am-chip' }, item.word), h('span', { class: 'am-plus' }, '+'),
        h('span', { class: 'am-chip am-chip-t' }, LABEL[item.tense])),
      h('div', { class: 'am-en' }, item.en));
      state = 'answer';
      elapsed = 0;
      api.frame((dt) => {
        if (state !== 'answer') return false;
        elapsed += dt;
        return true;
      });
      if (typed) {
        typeBox.hidden = false;
        input.disabled = false;
        input.value = '';
        input.classList.remove('good', 'bad');
        input.focus({ preventScroll: true });
      } else {
        btns = shuffle(item.options).map((o, i) => {
          const b = h('button', { type: 'button', class: 'btn g-btn rs-opt', 'aria-label': `${i + 1}: ${o}` }, h('span', { class: 'rs-key', 'aria-hidden': 'true' }, String(i + 1)), h('span', { class: 'rs-opt-text', lang: 'de' }, o));
          b._val = o;
          b.addEventListener('click', () => resolve(o));
          return b;
        });
        opts.className = 'rs-opts am-opts n' + btns.length;
        opts.replaceChildren(...btns);
      }
    }

    function resolve(given) {
      if (state !== 'answer' || api.ended) return;
      state = 'feedback';
      const it = item;
      let ok;
      let note = null;
      if (typed) {
        const r = B.check.typed(given, it.accept, { reject: it.reject });
        ok = r.ok;
        if (r.ok && r.typo) note = `Small typo — it’s **${r.matched}**.`;
        input.disabled = true;
        input.classList.add(ok ? 'good' : 'bad');
      } else {
        ok = L.same(given, it.answer);
        btns.forEach((b) => {
          b.disabled = true;
          if (L.same(b._val, it.answer)) b.classList.add('good');
          else if (b._val === given) b.classList.add('bad');
          else b.classList.add('dim');
        });
      }
      fb.className = 'rs-fb am-fb show ' + (ok ? 'good' : 'bad');
      fb.innerHTML = `<span class="rs-fb-icon">${ok ? '✓' : '✗'}</span> <span><b>${md(show(it.a))}</b>${note ? ` <small>${md(note)}</small>` : ''}</span>`;
      const el = typed ? input : btns.find((b) => b._val === given) || ask;
      if (ok) {
        api.hit({ el, points: Q.speedPoints(elapsed, 2500, 10000) });
        machine.classList.add('jackpot');
        api.after(700, () => machine.classList.remove('jackpot'));
      } else {
        api.miss({ q: it.q, a: it.a, given, el: ask });
        Q.say(api, it.a);
      }
      done++;
      api.progress(done, SPINS);
      api.wait(ok ? 700 : 2000).then((go) => {
        if (!go) return;
        if (done >= SPINS) return api.end({});
        idle();
      });
    }

    function submitTyped() {
      if (state !== 'answer' || !input) return;
      const v = input.value.trim();
      if (!v) return input.focus();
      resolve(v);
    }

    idle();
    lever.disabled = true; // until the countdown is over

    return {
      begin() {
        lever.disabled = false;
        lever.focus({ preventScroll: true });
      },
      key(e) {
        if (state === 'idle' && (e.key === ' ' || e.key === 'Enter')) return spin(), true;
        if (state !== 'answer') return e.key === ' ' || e.key === 'Enter';
        if (typed) {
          if (e.key === 'Enter') return submitTyped(), true;
          return false;
        }
        const n = parseInt(e.key, 10);
        if (n >= 1 && n <= btns.length) return resolve(btns[n - 1]._val), true;
        return false;
      },
    };
  }

  B.games.register('automat', {
    name: 'Verb-Automat',
    icon: '🎰',
    color: '#ff4b4b',
    blurb: 'Pull the lever! Person, verb and tense spin — then hit the right **verb form** for the jackpot.',
    how: ['Pull the lever (Space / Enter), answer with 1–4', 'Medium adds the Präteritum · High: type it, Perfekt too', '10 spins — quick answers score more'],
    topics: ['present', 'praet', 'verbs', 'verblist', 'reflexive', 'tenses'],
    art: '<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" font-family="system-ui,sans-serif" font-weight="900"><rect width="120" height="120" rx="28" fill="#fff1dc"/><rect x="12" y="22" width="80" height="84" rx="14" fill="#ff4b4b"/><rect x="20" y="12" width="64" height="18" rx="9" fill="#ffc800"/><circle cx="30" cy="21" r="3" fill="#fff"/><circle cx="42" cy="21" r="3" fill="#fff"/><circle cx="54" cy="21" r="3" fill="#fff"/><circle cx="66" cy="21" r="3" fill="#fff"/><circle cx="78" cy="21" r="3" fill="#fff"/><rect x="20" y="40" width="64" height="32" rx="7" fill="#fff"/><path d="M41.3 40v32M62.6 40v32" stroke="#ffd1d1" stroke-width="2"/><text x="31" y="61" text-anchor="middle" font-size="12" fill="#3c3c3c">ich</text><text x="52" y="61" text-anchor="middle" font-size="12" fill="#3c3c3c">bin</text><text x="73" y="62" text-anchor="middle" font-size="14" fill="#58cc02">✓</text><rect x="26" y="82" width="52" height="14" rx="7" fill="#c62f2f"/><rect x="99" y="44" width="6" height="40" rx="3" fill="#9aa5ab"/><circle cx="102" cy="40" r="9" fill="#ff9600"/><rect x="94" y="80" width="16" height="12" rx="4" fill="#c62f2f"/></svg>',
    ready: (topic) => automatPool(topic).length >= 4,
    gen: automatGen,
    play,
  });

  Q.fakeForms = fakeForms;
})();
