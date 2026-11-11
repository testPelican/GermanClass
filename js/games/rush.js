/*
 * Rapid-choice games: a prompt, 2–4 answer buttons (keys 1–4) or, on High, a typed answer
 * (checked with the app's typo rule), instant feedback, next item. Four games share the engine:
 *   partizip      Partizip-Blitz   infinitive → Partizip II
 *   spiegel       Spiegel          the reflexive pronoun: mich, dich, sich, uns, euch
 *   zeitmaschine  Zeitmaschine     Präsens, Präteritum or Perfekt?
 *   hoer          Hör genau        listen, then tap the word you heard
 * Each definition has gen(topic, level) → next() (no DOM), so tools can test the content in Node.
 */
(function () {
  'use strict';
  const B = window.Brezel;
  const { h, md, show, norm, shuffle, pick, pulse, reducedMotion, levenshtein } = B.util;
  const L = B.games.lib;
  const Q = (B.games.quick = B.games.quick || {});
  const data = () => B.games.data.quick || {};
  const LABEL = { present: 'Präsens', praet: 'Präteritum', perfekt: 'Perfekt' };

  // --- the rapid-choice engine ------------------------------------------------------------------
  /**
   * cfg = {
   *   theme, gen(topic, level) → next() → item { options, answer, accept?, reject?, q, a, fixed? },
   *   prompt(item, level) → Node, explain(item, ok, given) → { html, say? },
   *   typed?(level) → bool, placeholder?, perItem?(level) → ms, rounds?(level) → n,
   *   visual?(api) → { el, show?(item), right?(item, given), wrong?(item, given) },
   *   onShow?(item, api, level), onWrong?(item, api, level), key?(e, api, item, busy, visual) → bool,
   *   points?(ms, level) → points
   * }
   */
  function rushGame(cfg) {
    return function play(stage, api) {
      const level = api.level;
      const next = cfg.gen(api.topic, level);
      const perItem = cfg.perItem ? cfg.perItem(level) : 0;
      const typed = cfg.typed ? cfg.typed(level) : false;
      const rounds = cfg.rounds ? cfg.rounds(level) : 0;
      const vis = cfg.visual ? cfg.visual(api, level) : null;

      const promptEl = h('div', { class: 'rs-prompt' });
      const timer = h('div', { class: 'g-itimer rs-itimer', hidden: true }, h('span'));
      const opts = h('div', { class: 'rs-opts', role: 'group', 'aria-label': 'Answers' });
      const fb = h('div', { class: 'rs-fb', 'aria-live': 'polite' });
      let input = null;
      let body = opts;
      if (typed) {
        input = h('input', {
          class: 'type-input rs-input', type: 'text', autocomplete: 'off', autocorrect: 'off', autocapitalize: 'off',
          spellcheck: 'false', enterkeyhint: 'done', 'aria-label': 'Your answer', placeholder: cfg.placeholder || 'Type the answer', lang: 'de',
        });
        const okBtn = h('button', { type: 'button', class: 'btn btn-primary rs-ok' }, 'OK');
        okBtn.addEventListener('click', () => submitTyped());
        body = h('div', { class: 'rs-type' }, h('div', { class: 'rs-type-row' }, input, okBtn), B.ex.umlautBar(() => input));
      }
      stage.append(h('div', { class: 'rs ' + (cfg.theme || '') + (typed ? ' is-typed' : '') }, vis ? vis.el : null, promptEl, timer, body, fb));
      promptEl.append(h('div', { class: 'rs-wait' }, 'Bereit?'));

      let item = null;
      let busy = true;
      let stopTimer = null;
      let done = 0;
      let elapsed = 0;
      let btns = [];

      function present() {
        if (api.ended) return;
        item = next();
        promptEl.replaceChildren(cfg.prompt(item, level));
        if (!reducedMotion()) pulse(promptEl, 'rs-in');
        fb.className = 'rs-fb';
        fb.replaceChildren();
        if (vis && vis.show) vis.show(item);
        if (typed) {
          input.value = '';
          input.disabled = false;
          input.classList.remove('good', 'bad');
          input.focus({ preventScroll: true });
        } else {
          const list = item.fixed ? item.options : shuffle(item.options);
          btns = list.map((o, i) => {
            const b = h('button', { type: 'button', class: 'btn g-btn rs-opt', 'aria-label': `${i + 1}: ${show(o)}` },
              h('span', { class: 'rs-key', 'aria-hidden': 'true' }, String(i + 1)),
              h('span', { class: 'rs-opt-text', lang: 'de', html: md(show(o)) }));
            b._val = o;
            b.addEventListener('click', () => resolve(o));
            return b;
          });
          opts.className = 'rs-opts n' + btns.length;
          opts.replaceChildren(...btns);
        }
        elapsed = 0;
        busy = false;
        api.frame((dt) => {
          if (busy) return false;
          elapsed += dt;
          return true;
        });
        timer.hidden = true;
        if (perItem) stopTimer = Q.itemTimer(api, timer, perItem, () => resolve(null));
        if (cfg.onShow) cfg.onShow(item, api, level);
      }

      function checkTyped(it, given) {
        const r = B.check.typed(given, it.accept || [it.answer], { reject: it.reject });
        let note = null;
        if (r.ok && r.typo) note = `Small typo — it’s **${show(r.matched)}**.`;
        return { ok: r.ok, note };
      }

      function resolve(given) {
        if (busy || !item || api.ended) return;
        busy = true;
        if (stopTimer) stopTimer();
        stopTimer = null;
        const it = item;
        let ok = false;
        let note = null;
        if (given != null && typed) ({ ok, note } = checkTyped(it, given));
        else if (given != null) ok = L.same(given, it.answer);
        if (typed) {
          input.disabled = true;
          input.classList.add(ok ? 'good' : 'bad');
        } else {
          btns.forEach((b) => {
            b.disabled = true;
            if (L.same(b._val, it.answer)) b.classList.add('good');
            else if (given != null && b._val === given) b.classList.add('bad');
            else b.classList.add('dim');
          });
        }
        // fill the gap of the prompt with the right word
        const gap = promptEl.querySelector('.q-gap');
        if (gap) gap.replaceWith(h('b', { class: 'q-fill ' + (ok ? 'good' : 'bad') }, show(it.answer)));
        const ex = cfg.explain(it, ok, given);
        fb.className = 'rs-fb show ' + (ok ? 'good' : 'bad');
        fb.innerHTML = `<span class="rs-fb-icon">${ok ? '✓' : given == null ? '⏱' : '✗'}</span> <span>${given == null ? 'Too slow! ' : ''}${ex.html}${note ? ` <small>${md(note)}</small>` : ''}</span>`;
        const el = typed ? input : btns.find((b) => b._val === given) || promptEl;
        if (ok) {
          api.hit({ el, points: cfg.points ? cfg.points(elapsed, level) : Q.speedPoints(elapsed) });
          if (vis && vis.right) vis.right(it, given);
        } else {
          api.miss({ q: it.q, a: it.a, given: given == null ? 'too slow' : given, el: promptEl });
          if (vis && vis.wrong) vis.wrong(it, given);
          if (cfg.onWrong) cfg.onWrong(it, api, level);
          else Q.say(api, ex.say);
        }
        done++;
        if (rounds) api.progress(done, rounds);
        api.wait(ok ? 560 : 1900).then((go) => {
          if (!go) return;
          if (rounds && done >= rounds) return api.end({});
          present();
        });
      }

      function submitTyped() {
        if (busy || !input) return;
        const v = input.value.trim();
        if (!v) return input.focus();
        resolve(v);
      }

      if (rounds) api.progress(0, rounds);
      return {
        begin: present,
        key(e) {
          if (cfg.key && cfg.key(e, api, item, busy, vis)) return true;
          if (typed) {
            if (e.key === 'Enter') return submitTyped(), true;
            return false; // letters go into the input
          }
          const n = parseInt(e.key, 10);
          if (n >= 1 && n <= btns.length) {
            if (!busy) resolve(btns[n - 1]._val);
            return true;
          }
          return false;
        },
        destroy() {
          if (stopTimer) stopTimer();
        },
      };
    };
  }

  Q.rushGame = rushGame;

  /** n options: the answer plus others, without repeats. */
  function options(answer, others, n) {
    return [answer].concat(L.uniq(others, [answer]).slice(0, n - 1));
  }

  const promptBox = (main, sub, label) => h('div', { class: 'rs-q' },
    label ? h('div', { class: 'rs-label' }, label) : null,
    h('div', { class: 'rs-main', lang: 'de', html: main }),
    sub ? h('div', { class: 'rs-sub' }, sub) : null);

  // --- 5. Partizip-Blitz --------------------------------------------------------------------------------
  function partizipPool(topic) {
    const seen = new Set();
    return L.verbsFor(topic, { need: ['pp'] }).filter(({ v, reflexive }) => v.pp && v.inf !== 'möchten' && !seen.has(v.inf + reflexive) && seen.add(v.inf + reflexive));
  }
  const stemOf = (inf) => (inf.endsWith('en') ? inf.slice(0, -2) : inf.endsWith('n') ? inf.slice(0, -1) : inf);

  /** Wrong but plausible participles, the trickiest first: gefliegt, gebekommen, geaufstanden … */
  function fakeParticiples(v) {
    const pre = L.isSeparable(v) ? v.forms[0].split(' ')[1] : '';
    const base = pre && v.inf.startsWith(pre) ? v.inf.slice(pre.length) : v.inf;
    const st = stemOf(base);
    const t = /[td]$/.test(st) ? 'et' : 't';
    const rest = pre && v.pp.startsWith(pre + 'ge') ? v.pp.slice(pre.length + 2) : null;
    const list = [
      pre + 'ge' + st + t,
      pre + 'ge' + base,
      !v.pp.startsWith(pre + 'ge') ? pre + 'ge' + v.pp.slice(pre.length) : null,
      rest ? 'ge' + pre + rest : null,
      rest ? pre + rest : null,
    ];
    return L.uniq(list, [v.pp]);
  }
  function realOthers(v) {
    return L.uniq([v.inf, v.prt ? v.prt[2].split(' ')[0] : null, v.forms[2].split(' ')[0]], [v.pp]);
  }
  function partizipWhy(v) {
    const pre = L.isSeparable(v) ? v.forms[0].split(' ')[1] : '';
    if (pre) return `separable: *ge* goes in the middle (${pre}**ge**…)`;
    if (!v.pp.startsWith('ge')) return 'no *ge-* after be-/ver-/ent-/er- and in -ieren verbs';
    return v.pp.endsWith('en') ? 'irregular: ge…**en**' : 'regular: ge…**t**';
  }

  function partizipGen(topic, level) {
    const next = L.deal(partizipPool(topic));
    return () => {
      const { v, reflexive } = next();
      const fakes = fakeParticiples(v);
      const real = realOthers(v);
      const aux = reflexive || v.aux !== 'sein' ? 'hat' : 'ist';
      const other = aux === 'hat' ? 'ist' : 'hat';
      const word = (reflexive ? 'sich ' : '') + v.inf;
      const opts = level === 1 ? options(v.pp, [pick(real), fakes[0] || real[1]], 3) : options(v.pp, fakes.slice(0, 3).concat(real), 4);
      const perfekt = 'er ' + L.form(v, 'perfekt', 2, { reflexive });
      return {
        v, word, en: L.isReflexive(v) || !reflexive ? L.meaning(v) : (data().reflMeaning || {})[v.inf] || L.meaning(v),
        options: opts, answer: v.pp,
        accept: [v.pp, `${aux} ${v.pp}`].concat(reflexive ? [`${aux} sich ${v.pp}`] : []),
        reject: [`${other} ${v.pp}`].concat(fakes, real),
        q: word, a: v.pp, perfekt, why: partizipWhy(v),
      };
    };
  }

  B.games.register('partizip', {
    name: 'Partizip-Blitz',
    icon: '⚡',
    color: '#ffb700',
    blurb: 'Lightning round: give the **Partizip II** of each verb — as fast as you can.',
    how: ['Pick the participle (keys 1–4)', 'High: type it (e.g. *gemacht*)', 'Faster answers score more'],
    topics: ['past', 'pastq', 'prefix', 'verblist', 'tenses'],
    time: 60,
    art: '<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" font-family="system-ui,sans-serif" font-weight="900"><circle cx="60" cy="60" r="56" fill="#fff4d6"/><path d="M68 8 30 66h26l-10 46 44-64H62z" fill="#ffc800" stroke="#e09a00" stroke-width="4" stroke-linejoin="round"/><path d="M60 22 42 56" stroke="#fff6c2" stroke-width="5" stroke-linecap="round"/><text x="96" y="40" text-anchor="middle" font-size="19" fill="#ff9600">ge-</text><text x="22" y="98" text-anchor="middle" font-size="17" fill="#ff9600">-t</text><text x="100" y="98" text-anchor="middle" font-size="17" fill="#ff9600">-en</text></svg>',
    ready: (topic) => partizipPool(topic).length >= 6,
    gen: partizipGen,
    play: rushGame({
      theme: 'rs-blitz',
      gen: partizipGen,
      typed: (level) => level === 3,
      placeholder: 'Partizip II, e.g. gemacht',
      prompt: (it, level) => promptBox(md(it.word), it.en, level === 3 ? 'Type the Partizip II' : 'Partizip II?'),
      explain: (it) => ({ html: `<b>${md(it.perfekt)}</b> <small>— ${md(it.why)}</small>`, say: it.perfekt }),
      visual: () => {
        const el = h('div', { class: 'rs-bolt', 'aria-hidden': 'true', html: '<svg viewBox="0 0 40 60"><path d="M24 2 6 34h12l-6 24 22-34H22z" fill="#ffc800" stroke="#e09a00" stroke-width="2.5" stroke-linejoin="round"/></svg>' });
        return { el, right: () => pulse(el, 'zap'), wrong: () => pulse(el, 'fizzle') };
      },
    }),
  });

  // --- 6. Spiegel (reflexive pronouns) ----------------------------------------------------------------------
  const PRON = [['ich', 0], ['du', 1], ['er', 2], ['sie', 2], ['wir', 3], ['ihr', 4], ['sie', 5], ['Sie', 5]];
  const NAMES_SG = ['Luise', 'Knut', 'Sabine', 'Klaus', 'Felix', 'Leon', 'Mia', 'Julian', 'Herr Huber', 'Frau Weber'];
  const NAMES_PL = ['Peter und Paul', 'Kathrin und Max', 'die Kollegen', 'Frau Weber und Herr Schneider'];
  const PRONOUNS = ['mich', 'dich', 'sich', 'uns', 'euch'];
  const TIMES = ['jeden Morgen', 'am Wochenende', 'am Samstag', 'gestern', 'oft'];
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  function spiegelPool(topic) {
    const frames = data().spiegel || {};
    const want = topic === 'verblist'
      ? L.VERB_LIST.filter(([, r]) => r).map(([inf]) => inf)
      : Object.keys(frames).concat(Object.values(B.deck.verbs).filter(L.isReflexive).map((v) => v.inf));
    const seen = new Set();
    return want.map(L.verb).filter((v) => v && v.forms && v.pp && !seen.has(v.inf) && seen.add(v.inf)).map((v) => ({ v, frame: frames[v.inf] || { tails: [''] } }));
  }

  function spiegelGen(topic, level) {
    const next = L.deal(spiegelPool(topic));
    const haben = () => L.verb('haben');
    const modes = level === 1 ? ['present'] : level === 2 ? ['present', 'present', 'inversion'] : ['present', 'inversion', 'perfekt', 'perfekt', 'question'];
    return () => {
      const { v, frame } = next();
      const mode = pick(modes);
      const plural = !!frame.plural;
      // the subject: [text, person]
      let subj;
      if (mode === 'question') subj = pick(PRON.filter(([s, p]) => (plural ? p >= 3 : true) && ['du', 'ihr', 'Sie', 'er', 'sie'].includes(s)));
      else if (level === 1) subj = pick(PRON.filter(([, p]) => (plural ? p >= 3 : true)));
      else {
        const r = Math.random();
        if (r < 0.2 && !plural) subj = [pick(NAMES_SG), 2];
        else if (r < 0.4) subj = [pick(NAMES_PL), 5];
        else subj = pick(PRON.filter(([, p]) => (plural ? p >= 3 : true)));
      }
      const [who, p] = subj;
      const isPerf = !frame.present && (mode === 'perfekt' || (mode === 'question' && level === 3 && Math.random() < 0.5));
      const tail = pick(isPerf ? frame.perfekt || frame.tails : frame.tails) || '';
      const [head, ...rest] = v.forms[p].split(' ');
      const aux = haben().forms[p];
      const GAP = '___';
      let words;
      let end = '.';
      if (mode === 'question') {
        words = isPerf ? [cap(aux), who, GAP, tail, v.pp] : [cap(head), who, GAP, tail, ...rest];
        end = '?';
      } else if (mode === 'inversion') {
        // a time phrase in the tail goes to the front ("Jeden Morgen dusche ich mich"); otherwise add one
        const t = TIMES.find((x) => norm(tail).startsWith(norm(x)));
        if (t) words = [cap(t), head, who, GAP, tail.slice(t.length).trim(), ...rest];
        else if (TIMES.some((x) => norm(tail).includes(norm(x))) || /schon/.test(tail)) words = [who, head, GAP, tail, ...rest];
        else words = [pick(['Heute', 'Morgen', 'Am Samstag', 'Jetzt']), head, who, GAP, tail, ...rest];
      } else if (isPerf) {
        const quiet = !TIMES.some((x) => norm(tail).includes(norm(x))) && !/schon/.test(tail);
        words = level === 3 && quiet && Math.random() < 0.4 ? [pick(['Gestern', 'Am Samstag']), aux, who, GAP, tail, v.pp] : [who, aux, GAP, tail, v.pp];
      } else words = [who, head, GAP, tail, ...rest];
      const s = cap(words.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()) + end;
      const answer = L.REFL[p];
      let others = shuffle(PRONOUNS.filter((x) => x !== answer));
      // the Polish trap: się is sich for everyone in Polish, so always offer sich
      if (level >= 2 && answer !== 'sich') others = ['sich'].concat(others.filter((x) => x !== 'sich'));
      const filled = Q.fill(s, answer);
      return {
        s, answer, options: [answer].concat(others.slice(0, level === 1 ? 2 : 3)), who,
        q: s.replace('___', '…'), a: filled, say: filled, inf: v.inf, p,
      };
    };
  }

  const MIRROR = '<svg viewBox="0 0 220 150" aria-hidden="true"><defs><linearGradient id="mi-g" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#f4fbff"/><stop offset="1" stop-color="#cfe9f7"/></linearGradient></defs><ellipse cx="110" cy="75" rx="104" ry="70" fill="#c58cf5"/><ellipse cx="110" cy="75" rx="104" ry="70" fill="none" stroke="#9b5de5" stroke-width="5"/><ellipse cx="110" cy="75" rx="90" ry="58" fill="url(#mi-g)"/><path d="M48 52q14-22 40-30M44 70q8-20 22-30" stroke="#fff" stroke-width="7" stroke-linecap="round" fill="none" opacity=".85"/><circle cx="110" cy="8" r="7" fill="#ffc800"/><circle cx="12" cy="75" r="5" fill="#ffc800"/><circle cx="208" cy="75" r="5" fill="#ffc800"/><line x1="110" y1="22" x2="110" y2="128" stroke="#9b5de5" stroke-width="2" stroke-dasharray="4 5" opacity=".45"/></svg>';

  B.games.register('spiegel', {
    name: 'Spiegel',
    icon: '🪞',
    color: '#9b5de5',
    blurb: 'Mirror, mirror: the action goes back to the subject. Pick **mich, dich, sich, uns** or **euch**.',
    how: ['Tap the pronoun or press 1–4', 'Polish says *się* for everyone — German doesn’t!', 'High: Perfekt and questions too'],
    topics: ['reflexive', 'verblist'],
    time: 60,
    art: '<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" font-family="system-ui,sans-serif" font-weight="900"><circle cx="60" cy="60" r="56" fill="#f3e8ff"/><rect x="55" y="88" width="10" height="16" fill="#9b5de5"/><rect x="38" y="102" width="44" height="8" rx="4" fill="#9b5de5"/><ellipse cx="60" cy="52" rx="32" ry="40" fill="#c58cf5"/><ellipse cx="60" cy="52" rx="25" ry="33" fill="#e9f7ff"/><path d="M44 34q6-10 16-14M42 46q3-8 9-12" stroke="#fff" stroke-width="5" stroke-linecap="round" fill="none"/><text x="60" y="64" text-anchor="middle" font-size="17" fill="#7b3fc4" transform="translate(120 0) scale(-1 1)">sich</text></svg>',
    ready: (topic) => spiegelPool(topic).length >= 3,
    gen: spiegelGen,
    play: rushGame({
      theme: 'rs-mirror',
      gen: spiegelGen,
      prompt: (it) => promptBox(Q.gapHtml(it.s), null, null),
      explain: (it) => ({ html: `${Q.gapHtml(it.s, it.answer)}`, say: it.say }),
      visual: () => {
        const subj = h('span', { class: 'mi-subj', lang: 'de' });
        const refl = h('span', { class: 'mi-refl', lang: 'de' });
        const el = h('div', { class: 'mi' }, h('div', { class: 'mi-frame', html: MIRROR }), h('div', { class: 'mi-glass' }, subj, h('span', { class: 'mi-eq', 'aria-hidden': 'true' }, '↔'), refl));
        return {
          el,
          show(it) {
            subj.textContent = it.who;
            refl.textContent = '?';
            el.classList.remove('is-right', 'is-wrong');
          },
          // the class stays until the next sentence, so the reflection stays readable
          right(it) {
            refl.textContent = it.answer;
            el.classList.add('is-right');
          },
          wrong(it) {
            refl.textContent = it.answer;
            el.classList.add('is-wrong');
          },
        };
      },
    }),
  });

  // --- 7. Zeitmaschine (which tense?) ------------------------------------------------------------------------
  function zeitPool(topic) {
    const seen = new Set();
    return L.verbsFor(topic, { need: ['prt', 'pp'] }).filter(({ v, reflexive }) => v.forms && !seen.has(v.inf + reflexive) && seen.add(v.inf + reflexive));
  }

  function zeitGen(topic, level) {
    const pool = zeitPool(topic);
    const plain = pool.filter((x) => !x.reflexive);
    const tricky = pool.filter((x) => x.reflexive || L.isSeparable(x.v));
    const nextAll = L.deal(level === 1 && plain.length >= 6 ? plain : pool);
    const nextTricky = L.deal(tricky.length ? tricky : pool);
    return function make(tries = 0) {
      const { v, reflexive } = level === 3 && Math.random() < 0.5 ? nextTricky() : nextAll();
      const p = level === 1 ? 2 : Math.floor(Math.random() * 6);
      const who = p === 2 ? pick(['er', 'sie']) : p === 5 ? pick(['sie', 'Sie']) : L.PERSONS[p];
      const forms = { present: L.form(v, 'present', p, { reflexive }), praet: L.form(v, 'praet', p, { reflexive }), perfekt: L.form(v, 'perfekt', p, { reflexive }) };
      const clear = forms.present && forms.praet && forms.perfekt && !L.same(forms.present, forms.praet);
      if (!clear && tries < 30) return make(tries + 1);
      // the Perfekt (with its helper) is never mistaken for another tense
      const tense = clear ? pick(['present', 'praet', 'perfekt']) : 'perfekt';
      const text = who + ' ' + forms[tense];
      return {
        text, tense, answer: LABEL[tense], options: [LABEL.praet, LABEL.perfekt, LABEL.present], fixed: true,
        word: (reflexive ? 'sich ' : '') + v.inf, all: forms, who,
        q: text, a: LABEL[tense], say: text,
      };
    };
  }

  const DIAL = '<svg viewBox="0 0 220 142" aria-hidden="true"><path d="M110 120 30 120A80 80 0 0 1 70 50.7Z" class="zm-s zm-praet"/><path d="M110 120 70 50.7A80 80 0 0 1 150 50.7Z" class="zm-s zm-perfekt"/><path d="M110 120 150 50.7A80 80 0 0 1 190 120Z" class="zm-s zm-present"/><path d="M30 120A80 80 0 0 1 190 120" fill="none" stroke="currentColor" stroke-width="4" opacity=".25"/><text x="38" y="138" class="zm-t zm-t-praet">Präteritum</text><text x="110" y="31" class="zm-t zm-t-perfekt">Perfekt</text><text x="182" y="138" class="zm-t zm-t-present">Präsens</text><g class="zm-needle"><path d="M110 120 110 52" stroke="currentColor" stroke-width="7" stroke-linecap="round"/><circle cx="110" cy="120" r="11" fill="currentColor"/><circle cx="110" cy="120" r="4" fill="#ffc800"/></g></svg>';
  const ANGLE = { praet: -60, perfekt: 0, present: 60 };
  const tenseOf = (label) => Object.keys(LABEL).find((k) => LABEL[k] === label);

  B.games.register('zeitmaschine', {
    name: 'Zeitmaschine',
    icon: '🕰️',
    color: '#00a6a0',
    blurb: 'Set the dial! Is the verb form **Präsens**, **Präteritum** or **Perfekt**?',
    how: ['1 Präteritum · 2 Perfekt · 3 Präsens', 'Medium: every person · High: reflexive and separable verbs, against the clock'],
    topics: ['tenses', 'praet', 'past', 'verblist'],
    time: 60,
    art: '<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><circle cx="60" cy="60" r="56" fill="#e3f6f5"/><path d="M60 80 16 80A44 44 0 0 1 38 41.9Z" fill="#ce82ff"/><path d="M60 80 38 41.9A44 44 0 0 1 82 41.9Z" fill="#1cb0f6"/><path d="M60 80 82 41.9A44 44 0 0 1 104 80Z" fill="#58cc02"/><path d="M60 80 90 58" stroke="#2b3a40" stroke-width="6" stroke-linecap="round"/><circle cx="60" cy="80" r="8" fill="#2b3a40"/><circle cx="60" cy="80" r="3" fill="#ffc800"/><rect x="20" y="88" width="80" height="16" rx="8" fill="#00a6a0"/><circle cx="34" cy="96" r="3" fill="#fff"/><circle cx="46" cy="96" r="3" fill="#fff"/><circle cx="58" cy="96" r="3" fill="#ffc800"/></svg>',
    ready: (topic) => zeitPool(topic).length >= 4,
    gen: zeitGen,
    play: rushGame({
      theme: 'rs-zeit',
      gen: zeitGen,
      perItem: (level) => (level === 3 ? 4200 : 0),
      prompt: (it) => promptBox(md(it.text), it.word, 'Which tense?'),
      explain: (it) => ({
        html: `<b>${md(it.text)}</b> = ${it.answer} <small>· ${['present', 'praet', 'perfekt'].map((t) => `${LABEL[t]}: ${it.who} ${it.all[t]}`).join(' · ')}</small>`,
        say: it.say,
      }),
      visual: (api) => {
        const el = h('div', { class: 'zm', html: DIAL });
        const needle = () => el.querySelector('.zm-needle');
        const point = (t) => {
          needle().style.transform = `rotate(${ANGLE[t] || 0}deg)`;
          el.querySelectorAll('.zm-s, .zm-t').forEach((s) => s.classList.toggle('on', s.classList.contains('zm-' + t) || s.classList.contains('zm-t-' + t)));
        };
        return {
          el,
          show() {
            el.classList.remove('is-right', 'is-wrong');
            el.querySelectorAll('.zm-s, .zm-t').forEach((s) => s.classList.remove('on'));
            needle().style.transform = 'rotate(0deg)';
            el.classList.add('is-idle');
          },
          right(it) {
            el.classList.remove('is-idle');
            point(it.tense);
            el.classList.add('is-right');
          },
          wrong(it, given) {
            el.classList.remove('is-idle');
            el.classList.add('is-wrong');
            if (given) point(tenseOf(given));
            api.after(550, () => point(it.tense)); // swing to the right era
          },
        };
      },
    }),
  });

  // --- 8. Hör genau (listening) ------------------------------------------------------------------------------
  const RATE = [0.75, 0.9, 1];

  function soundsSame(a, b) {
    if (norm(a) === norm(b)) return true;
    return (data().homophones || []).some(([x, y]) => (norm(x) === norm(a) && norm(y) === norm(b)) || (norm(x) === norm(b) && norm(y) === norm(a)));
  }
  /** Keep words that sound different from every word kept before them. */
  function audible(words) {
    const out = [];
    for (const w of words) if (w && !out.some((o) => soundsSame(o, w))) out.push(w);
    return out;
  }

  function hoerSets(topic) {
    const fams = (pred) => B.deck.families.filter(pred).map((f) => f.filter((w) => w !== 'mir' && w !== 'dir'));
    const verbs = (t, need) => L.verbsFor(t, { need });
    let sets = [];
    const add = (list) => sets.push(audible(list));
    if (topic === 'present' || topic === 'all') for (const { v } of verbs('present', [])) if (v.forms) add(v.forms);
    if (topic === 'praet' || topic === 'all') for (const { v } of verbs('praet', ['prt'])) add(v.prt.concat([v.forms[0], v.forms[2]]));
    if (topic === 'cases' || topic === 'all') fams((f) => ['der', 'ein', 'kein'].includes(f[0])).forEach(add);
    if (topic === 'possessive' || topic === 'all') fams((f) => ['mein', 'dein', 'sein', 'ihr'].includes(f[0])).forEach(add);
    if (topic === 'reflexive' || topic === 'all') {
      fams((f) => f.includes('mich')).forEach(add);
      for (const { v } of verbs('reflexive', [])) add([0, 1, 2, 3, 4, 5].map((p) => L.form(v, 'present', p, { reflexive: true })));
    }
    if (topic === 'verblist' || topic === 'all') for (const { v } of verbs('verblist', ['pp'])) add([v.forms[2], v.prt && v.prt[2], v.pp, v.inf, v.forms[1]]);
    if (topic === 'all') B.deck.families.filter((f) => f.length <= 3).forEach(add);
    sets = sets.filter((s) => s.length >= 2);
    return sets;
  }

  function hoerGen(topic, level) {
    const next = L.deal(hoerSets(topic));
    const n = level === 1 ? 3 : 4;
    return () => {
      const set = next();
      const target = pick(set);
      let others = set.filter((w) => w !== target);
      const dist = (w) => levenshtein(norm(w), norm(target));
      if (level === 1) others.sort((a, b) => dist(b) - dist(a));
      else if (level === 3) others.sort((a, b) => dist(a) - dist(b));
      else others = shuffle(others);
      return { target, answer: target, options: [target].concat(others.slice(0, n - 1)), q: '🔊 heard: ' + target, a: target };
    };
  }

  const SPEAKER = '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M10 24h10l14-12v40L20 40H10z" fill="currentColor"/><path d="M42 22q6 10 0 20M48 16q11 16 0 32" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"/></svg>';

  B.games.register('hoer', {
    name: 'Hör genau',
    icon: '👂',
    color: '#ff4fa3',
    speech: true,
    blurb: 'Listen carefully, then tap the word you **heard**. They look alike — they don’t sound alike!',
    how: ['Tap 🔊 or press R / Space to hear it again', 'Answer with a tap or keys 1–4', '12 rounds'],
    topics: ['present', 'praet', 'cases', 'possessive', 'reflexive', 'verblist'],
    art: '<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><circle cx="60" cy="60" r="56" fill="#ffe9f6"/><path d="M22 48h16l22-18v60L38 72H22z" fill="#ff4fa3"/><path d="M72 44q10 16 0 32M82 34q18 26 0 52M92 26q26 34 0 68" fill="none" stroke="#ff86d0" stroke-width="6" stroke-linecap="round"/></svg>',
    ready: (topic) => hoerSets(topic).length >= 3,
    gen: hoerGen,
    play: rushGame({
      theme: 'rs-hoer',
      gen: hoerGen,
      rounds: () => 12,
      points: (ms) => Q.speedPoints(ms, 3000, 10000),
      prompt: (it) => h('div', { class: 'rs-q' }, h('div', { class: 'rs-label' }, 'Which one did you hear?')),
      explain: (it, ok) => ({ html: ok ? `<b>${md(it.target)}</b>` : `You heard <b>${md(it.target)}</b>` }),
      visual: (api, level) => {
        let current = null;
        const btn = h('button', { type: 'button', class: 'hg-play', 'aria-label': 'Play the word again (R)', html: SPEAKER });
        const play = () => {
          if (!current) return;
          api.speak(current, { rate: RATE[level - 1] });
          pulse(btn, 'hg-ring');
        };
        btn.addEventListener('click', play);
        const el = h('div', { class: 'hg' }, btn, h('div', { class: 'hg-hint' }, 'Tap to hear it again'));
        el._play = play;
        return {
          el,
          show(it) {
            current = it.target;
            play();
          },
          wrong() {
            api.after(350, play);
          },
        };
      },
      onWrong: () => {},
      key(e, api, item, busy, vis) {
        if (e.key === 'r' || e.key === 'R' || e.key === ' ') {
          if (vis && vis.el._play) vis.el._play();
          return true;
        }
        return false;
      },
    }),
  });

  Q.fakeParticiples = fakeParticiples;
  Q.hoerSets = hoerSets;
  Q.audible = audible;
})();
