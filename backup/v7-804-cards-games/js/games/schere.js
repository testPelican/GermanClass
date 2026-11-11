/*
 * Die Schere: a sentence arrives with its verb glued together in position 2
 * ("Helga aufsteht jeden Tag um sieben Uhr."). Separable verb → ✂ cut: the prefix flies to the
 * end. Inseparable verb (be-, ver-, ent-, er-, ge-, unter-, über- …) → 🔗 keep it together.
 * Sentences: Brezel.games.data.play.schere.
 *   Low: 75 s, 5 lives, the infinitive is shown as a hint · Medium: 60 s, 3 lives ·
 *   High: 60 s, 3 lives, and after cutting you also put the prefix in its place yourself.
 */
(function () {
  'use strict';
  const B = window.Brezel;
  const { h, md, flip, reducedMotion } = B.util;

  const INSEP = /^(be|ver|ent|er|ge|zer|emp|miss|unter|über)/;
  const data = () => B.games.data.play;

  const ART =
    '<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">' +
    '<rect x="8" y="74" width="44" height="30" rx="9" fill="#ffffff" stroke="#ffc58f" stroke-width="3"/>' +
    '<text x="30" y="95" text-anchor="middle" font-family="system-ui,-apple-system,Segoe UI,sans-serif" font-weight="900" font-size="16" fill="#ff8a1f">auf</text>' +
    '<rect x="64" y="74" width="50" height="30" rx="9" fill="#ffffff" stroke="#ffc58f" stroke-width="3"/>' +
    '<text x="89" y="95" text-anchor="middle" font-family="system-ui,-apple-system,Segoe UI,sans-serif" font-weight="900" font-size="16" fill="#3c3c3c">steht</text>' +
    '<path d="M58 66v46" stroke="#ff4b4b" stroke-width="3" stroke-dasharray="5 4" stroke-linecap="round"/>' +
    '<path d="M50 30L64 66l-5 2z" fill="#9aa7b0"/><path d="M66 30L52 66l5 2z" fill="#cfd8dd"/>' +
    '<circle cx="58" cy="47" r="3.6" fill="#3c3c3c"/>' +
    '<circle cx="42" cy="18" r="10" fill="none" stroke="#ff8a1f" stroke-width="6"/>' +
    '<circle cx="74" cy="18" r="10" fill="none" stroke="#ff8a1f" stroke-width="6"/>' +
    '<path d="M98 30l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="#ffc800"/></svg>';

  const SCISSORS =
    '<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="11" cy="9" r="6" fill="none" stroke="currentColor" stroke-width="3.5"/>' +
    '<circle cx="29" cy="9" r="6" fill="none" stroke="currentColor" stroke-width="3.5"/>' +
    '<path class="sch-blade-a" d="M15 14l9 24 3-1z" fill="#9aa7b0"/><path class="sch-blade-b" d="M25 14l-9 24-3-1z" fill="#cfd8dd"/></svg>';

  /** Parsed sentences for a topic: Verb list → only verbs from the list. */
  function items(topic) {
    const parsed = data().schere.map(data()._gen.parseSchere).filter(Boolean);
    if (topic !== 'verblist') return parsed;
    const list = new Set(B.games.lib.VERB_LIST.map(([inf]) => inf));
    return parsed.filter((x) => list.has(x.inf));
  }

  /** Why an inseparable verb stays together: "be- can't stand alone". */
  function whyKeep(inf) {
    const m = inf.match(INSEP);
    if (!m) return `*${inf}* is not separable, so it stays one word.`;
    if (m[1] === 'unter' || m[1] === 'über') return `**${m[1]}-** is inseparable here: *${inf}* stays one word.`;
    return `**${m[1]}-** can’t stand alone, so *${inf}* stays one word.`;
  }

  const words = (s) => (s ? s.split(/\s+/).filter(Boolean) : []);
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const low = (s) => s.charAt(0).toLowerCase() + s.slice(1);

  B.games.register('schere', {
    name: 'Die Schere',
    icon: '✂️',
    art: ART,
    color: '#ff8a1f',
    blurb: 'Separable or not? Cut the prefix off — or keep the verb in one piece.',
    how: ['✂ **Cut** a separable verb: *aufsteht* → *steht … auf*', '🔗 **Keep** an inseparable one: *beantworte*', 'Keys: ← cut · → keep'],
    topics: ['prefix', 'verblist', 'order'],
    ready: (topic) => items(topic).length >= 10,
    time: (level) => (level === 1 ? 75 : 60),
    lives: (level) => (level === 1 ? 5 : 3),

    play(stage, api) {
      const level = api.level;
      const next = B.games.lib.deal(items(api.topic));
      const soundOn = () => B.store.setting('sound') !== false;
      let cur = null; // { it, els… }
      let phase = 'wait'; // wait → decide → (place) → show → …
      let slotSel = 0;

      const line = h('div', { class: 'sch-line', lang: 'de', 'aria-live': 'polite' });
      const hint = h('div', { class: 'sch-hint' });
      const note = h('div', { class: 'sch-note', 'aria-live': 'polite' });
      const cutBtn = h('button', { type: 'button', class: 'btn g-btn sch-cut' }, h('span', { class: 'sch-ico', html: SCISSORS }), 'Cut');
      const keepBtn = h('button', { type: 'button', class: 'btn g-btn sch-keep' }, h('span', { class: 'sch-ico', 'aria-hidden': 'true' }, '🔗'), 'Keep');
      cutBtn.addEventListener('click', () => decide(true));
      keepBtn.addEventListener('click', () => decide(false));
      const card = h('div', { class: 'sch-card' }, line, hint, note);
      stage.append(h('div', { class: 'sch-wrap' }, card, h('div', { class: 'sch-actions' }, cutBtn, keepBtn)));

      function setButtons(on) {
        cutBtn.disabled = keepBtn.disabled = !on;
      }

      function show() {
        if (api.ended) return;
        const it = next();
        const initial = !it.before; // verb first: "Passt du …?"
        const pre = it.sep ? h('span', { class: 'sch-pre' }, initial ? cap(it.prefix) : it.prefix) : null;
        const stem = h('span', { class: 'sch-stem' }, it.sep && initial ? low(it.verb) : it.verb);
        const pill = h('span', { class: 'sch-verb' }, pre, stem);
        const before = words(it.before).map((w) => h('span', { class: 'sch-w' }, w));
        const between = words(it.between).map((w) => h('span', { class: 'sch-w' }, w));
        const end = h('span', { class: 'sch-end' }, it.end);
        line.replaceChildren(...before, pill, ...between, end);
        hint.textContent = level === 1 ? `(${it.inf})` : '';
        note.replaceChildren();
        card.classList.remove('good', 'bad', 'enter');
        void card.offsetWidth;
        card.classList.add('enter');
        cur = { it, pre, stem, pill, between, end, initial };
        phase = 'decide';
        setButtons(true);
      }

      /** Move the prefix to slot k (0 = right after the verb … between.length = the end). */
      function placePrefix(k) {
        const { pre, stem, between, end, initial, it } = cur;
        flip([pre, stem, ...between, end], () => {
          pre.textContent = it.prefix;
          if (initial) stem.textContent = it.verb;
          pre.classList.add('moved');
          if (k >= between.length) line.insertBefore(pre, end);
          else line.insertBefore(pre, between[k]);
        }, { duration: 420 });
      }

      function snip() {
        const s = h('span', { class: 'sch-snip', html: SCISSORS, 'aria-hidden': 'true' });
        if (cur.pre) s.style.setProperty('--snip-x', cur.pre.offsetLeft + cur.pre.offsetWidth + 'px');
        cur.pill.append(s);
        api.sfx('whoosh');
        api.after(reducedMotion() ? 0 : 420, () => s.remove());
      }

      function result(ok, given) {
        const { it } = cur;
        card.classList.add(ok ? 'good' : 'bad');
        if (ok) {
          api.hit({ el: cur.pill, points: level === 3 && it.sep ? 15 : 10 });
          note.innerHTML = it.sep ? `✂ <b>${it.inf}</b> is separable.` : `🔗 ${md(whyKeep(it.inf))}`;
        } else {
          note.innerHTML = (it.sep ? `<b>${it.inf}</b> is separable: ` : md(whyKeep(it.inf)) + ' ') + `<span class="sch-fix">${md(it.correct)}</span>`;
          api.miss({ q: `${it.before} ${it.glued} ${it.between}`.replace(/\s+/g, ' ').trim() + it.end, a: it.correct, given, el: cur.pill });
          if (soundOn()) api.speak(it.correct);
        }
        phase = 'show';
        setButtons(false);
        api.after(ok ? 950 : 2100, show);
      }

      function decide(cut) {
        if (phase !== 'decide' || api.ended) return;
        const { it } = cur;
        phase = 'busy';
        setButtons(false);
        api.sfx('tap');
        if (cut && it.sep) {
          snip();
          if (level === 3 && cur.between.length) return startPlacing();
          api.after(reducedMotion() ? 0 : 260, () => {
            placePrefix(cur.between.length);
            result(true);
          });
        } else if (!cut && !it.sep) {
          cur.pill.classList.add('kept');
          result(true);
        } else if (!cut && it.sep) {
          // kept a separable verb: show the cut anyway
          placePrefix(cur.between.length);
          result(false, 'kept together');
        } else {
          cur.pill.classList.add('no-cut');
          result(false, 'cut');
        }
      }

      // --- High: put the prefix in its place -------------------------------------------------
      let slots = [];
      function startPlacing() {
        phase = 'place';
        setButtons(false);
        const { pre, stem, between, end, initial, it } = cur;
        pre.textContent = it.prefix;
        if (initial) stem.textContent = it.verb;
        pre.classList.add('floating');
        cur.pill.after(pre); // lift it out of the verb
        slots = [];
        const anchors = between.concat(end);
        anchors.forEach((a, k) => {
          const s = h('button', { type: 'button', class: 'sch-slot', 'aria-label': k === between.length ? 'Put it at the end' : `Put it before “${a.textContent}”`, onClick: () => drop(k) }, '▾');
          line.insertBefore(s, a);
          slots.push(s);
        });
        slotSel = 0;
        paintSlots();
        note.textContent = 'Where does the prefix go? Tap a ▾';
      }

      function paintSlots() {
        slots.forEach((s, k) => s.classList.toggle('sel', k === slotSel));
      }

      function drop(k) {
        if (phase !== 'place') return;
        slots.forEach((s) => s.remove());
        slots = [];
        const { pre, between, it } = cur;
        pre.classList.remove('floating');
        const right = k >= between.length;
        placePrefix(right ? between.length : k);
        if (right) result(true);
        else {
          const built = [it.before, it.verb, ...between.slice(0, k).map((x) => x.textContent), it.prefix, ...between.slice(k).map((x) => x.textContent)].filter(Boolean).join(' ') + it.end;
          api.after(reducedMotion() ? 0 : 450, () => {
            placePrefix(between.length);
            result(false, built);
          });
        }
      }

      return {
        begin: show,
        key(e) {
          if (phase === 'decide') {
            if (e.key === 'ArrowLeft' || e.key === '1' || e.key === 'c') return decide(true), true;
            if (e.key === 'ArrowRight' || e.key === '2' || e.key === 'k') return decide(false), true;
          } else if (phase === 'place') {
            if (e.key === 'ArrowLeft') return (slotSel = Math.max(0, slotSel - 1)), paintSlots(), true;
            if (e.key === 'ArrowRight') return (slotSel = Math.min(slots.length - 1, slotSel + 1)), paintSlots(), true;
            if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') return drop(slotSel), true;
          }
          return false;
        },
      };
    },
  });
})();
