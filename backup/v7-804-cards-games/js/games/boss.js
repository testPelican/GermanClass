/*
 * Bossfight: every topic has its monster (Brezel.games.data.play.bosses: Der Akkusativ-Drache,
 * Die Perfekt-Krake …). Answer real cards of the topic with the normal exercise screens:
 * a right answer hits the boss, a wrong one lets it strike back (you have 3 hearts).
 * Every 4th right answer in a row is a critical hit (2 damage).
 *   Low: 5 HP, quick card types · Medium: 7 HP · High: 9 HP, typed answers and tables too.
 * Games never change learning progress, so nothing here calls Brezel.store.record.
 * The monster is drawn by monster() from a few features (shape, eyes, horns, fangs, extra).
 */
(function () {
  'use strict';
  const B = window.Brezel;
  const { h, md, show, pick, reducedMotion } = B.util;

  const HP = { 1: 5, 2: 7, 3: 9 };
  const QUICK = ['mc', 'tf', 'gap', 'match', 'sort', 'spot', 'order'];
  const TYPES = { 1: QUICK, 2: QUICK, 3: QUICK.concat(['type', 'table']) };
  const MIN_CARDS = 8;
  const TAUNT = {
    start: ['Ha! Das schaffst du nie!', 'Komm nur her!', 'Ich bin unbesiegbar!', 'Na, bist du bereit?'],
    hurt: ['Autsch!', 'Au! Das tat weh!', 'Nein, nein, nein!', 'Grrr …', 'Nicht schlecht …', 'Hilfe!'],
    laugh: ['Hahaha!', 'Falsch! Hehe.', 'Das war nix!', 'Noch einmal?', 'Hehehe …'],
  };

  // --- the monster -------------------------------------------------------------------------------
  let uid = 0;

  function shade(hex, amt) {
    const n = parseInt(String(hex).slice(1), 16);
    const t = amt < 0 ? 0 : 255;
    const p = Math.abs(amt);
    const mix = (c) => Math.round((t - c) * p + c);
    const r = mix(n >> 16);
    const g = mix((n >> 8) & 255);
    const b = mix(n & 255);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  const SHAPES = {
    blob: { d: 'M100 38C150 38 172 88 170 132C168 168 32 168 30 132C28 88 50 38 100 38Z', face: [100, 98], top: 40, spread: 34, feet: 160, belly: true },
    tall: { d: 'M55 70a45 42 0 0 1 90 0V150a18 18 0 0 1-18 18H73a18 18 0 0 1-18-18Z', face: [100, 82], top: 30, spread: 26, feet: 166, belly: true },
    square: { d: 'M58 46H142a20 20 0 0 1 20 20V146a20 20 0 0 1-20 20H58a20 20 0 0 1-20-20V66a20 20 0 0 1 20-20Z', face: [100, 96], top: 46, spread: 40, feet: 164, belly: true, cracks: true },
    wide: { d: 'M22 116a78 54 0 1 0 156 0a78 54 0 1 0-156 0Z', face: [100, 106], top: 64, spread: 40, feet: 166, belly: true },
    ghost: { d: 'M44 168V96C44 48 156 48 156 96V168q-9.33-12-18.67 0t-18.67 0t-18.67 0t-18.67 0t-18.67 0t-18.67 0Z', face: [100, 100], top: 54, spread: 30, feet: 0, belly: false },
    worm: { d: 'M28 150a24 24 0 1 0 48 0a24 24 0 1 0-48 0ZM58 138a28 28 0 1 0 56 0a28 28 0 1 0-56 0ZM90 110a40 40 0 1 0 80 0a40 40 0 1 0-80 0Z', face: [130, 104], top: 72, spread: 22, feet: 0, belly: false },
  };

  /** SVG markup (no outer <svg>) for a boss config, in a 200 × 200 box. */
  function monsterParts(cfg) {
    const id = 'bm' + ++uid;
    const S = SHAPES[cfg.shape] || SHAPES.blob;
    const c = cfg.color || '#7c5cff';
    const dark = shade(c, -0.42);
    const light = shade(c, 0.55);
    const [fx, fy] = S.face;
    const top = S.top;
    const sp = S.spread;
    const ink = '#26212e';
    const behind = [];
    const front = [];
    const over = [];

    // extras drawn behind the body
    if (cfg.extra === 'wings') {
      const wing = `M62 104C22 70 6 112 12 136C24 124 32 130 38 144C44 132 52 132 62 140Z`;
      behind.push(`<path d="${wing}" fill="${dark}"/><path d="${wing}" fill="${dark}" transform="translate(200 0) scale(-1 1)"/>`);
    }
    if (cfg.extra === 'tentacles') {
      for (let i = 0; i < 5; i++) {
        const x = 52 + i * 24;
        behind.push(`<path class="b-tent" style="animation-delay:${-i * 0.35}s" d="M${x} 148q-12 22 4 34q10 8-2 14" fill="none" stroke="${shade(c, -0.15)}" stroke-width="13" stroke-linecap="round"/>`);
      }
    }
    if (cfg.extra === 'ears') {
      behind.push(`<path d="M${fx - sp - 22} ${top + 34}L${fx - sp - 6} ${top - 26}L${fx - sp + 22} ${top + 14}Z" fill="${c}"/>` +
        `<path d="M${fx + sp + 22} ${top + 34}L${fx + sp + 6} ${top - 26}L${fx + sp - 22} ${top + 14}Z" fill="${c}"/>` +
        `<path d="M${fx - sp - 12} ${top + 22}L${fx - sp - 4} ${top - 10}L${fx - sp + 10} ${top + 12}Z" fill="#ffb3c7"/>` +
        `<path d="M${fx + sp + 12} ${top + 22}L${fx + sp + 4} ${top - 10}L${fx + sp - 10} ${top + 12}Z" fill="#ffb3c7"/>`);
    }
    if (cfg.horns) {
      const xs = cfg.horns === 1 ? [0] : cfg.horns === 2 ? [-sp, sp] : [-sp, 0, sp];
      for (const dx of xs) {
        const x = fx + dx;
        const lean = dx < 0 ? -6 : dx > 0 ? 6 : 0;
        behind.push(`<path d="M${x - 11} ${top + 14}Q${x - 6} ${top - 8} ${x + lean} ${top - 26}Q${x + 6} ${top - 6} ${x + 11} ${top + 14}Z" fill="#f6e7c1" stroke="${shade('#f6e7c1', -0.25)}" stroke-width="2.5"/>`);
      }
    }
    if (cfg.extra === 'feathers') {
      const cols = ['#ff4b4b', '#ffc800', '#1cb0f6'];
      cols.forEach((col, i) => behind.push(`<ellipse cx="${fx - 16 + i * 16}" cy="${top - 10}" rx="7" ry="22" fill="${col}" transform="rotate(${-24 + i * 24} ${fx - 16 + i * 16} ${top + 8})"/>`));
    }
    if (cfg.extra === 'spikes') {
      for (let dx = -40; dx <= 40; dx += 20) {
        const x = fx + dx;
        const y = cfg.shape === 'square' ? top : top + (dx * dx) / 95;
        behind.push(`<path d="M${x - 9} ${y + 10}L${x} ${y - 14}L${x + 9} ${y + 10}Z" fill="${dark}"/>`);
      }
    }
    if (cfg.extra === 'antennae') {
      behind.push(`<path d="M${fx - 14} ${top + 6}Q${fx - 22} ${top - 18} ${fx - 30} ${top - 30}M${fx + 14} ${top + 6}Q${fx + 22} ${top - 18} ${fx + 30} ${top - 30}" fill="none" stroke="${dark}" stroke-width="5" stroke-linecap="round"/>` +
        `<circle cx="${fx - 31}" cy="${top - 32}" r="7" fill="#ffc800"/><circle cx="${fx + 31}" cy="${top - 32}" r="7" fill="#ffc800"/>`);
    }

    // feet + body + belly
    const feet = S.feet ? `<ellipse cx="${fx - 30}" cy="${S.feet}" rx="19" ry="10" fill="${dark}"/><ellipse cx="${fx + 30}" cy="${S.feet}" rx="19" ry="10" fill="${dark}"/>` : '';
    const body = `<path d="${S.d}" fill="${c}"/>`;
    const belly = S.belly ? `<ellipse cx="${fx}" cy="${fy + 46}" rx="40" ry="26" fill="${light}" opacity=".7"/>` : '';
    const shine = `<ellipse cx="${fx - sp - 4}" cy="${top + 30}" rx="9" ry="14" fill="#fff" opacity=".25" transform="rotate(25 ${fx - sp - 4} ${top + 30})"/>`;
    const cracks = S.cracks ? `<path d="M52 72l14 10-6 12M150 130l-12-6 4-14M120 58l-6 10" fill="none" stroke="${dark}" stroke-width="3" stroke-linecap="round" opacity=".55"/>` : '';

    if (cfg.extra === 'bandages') {
      front.push(`<clipPath id="${id}c"><path d="${S.d}"/></clipPath><g clip-path="url(#${id}c)" opacity=".92">` +
        [62, 92, 122, 148].map((y, i) => `<path d="M20 ${y + (i % 2 ? 8 : -6)}L180 ${y + (i % 2 ? -8 : 6)}" stroke="#f3ead2" stroke-width="13"/>`).join('') +
        `<path d="M20 ${76}L180 ${84}" stroke="${shade('#f3ead2', -0.12)}" stroke-width="3" opacity=".6"/></g>`);
    }

    // eyes
    const eyes = cfg.eyes === 1 ? [[0, -6, 19]] : cfg.eyes === 3 ? [[-30, 0, 11], [0, -18, 13], [30, 0, 11]] : [[-22, -6, 13], [22, -6, 13]];
    for (const [dx, dy, r] of eyes) {
      const x = fx + dx;
      const y = fy + dy;
      front.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="#fff"/>` +
        `<g class="b-pupil"><circle cx="${x + r * 0.15}" cy="${y + r * 0.12}" r="${r * 0.48}" fill="${ink}"/><circle cx="${x + r * 0.3}" cy="${y - r * 0.12}" r="${r * 0.16}" fill="#fff"/></g>` +
        `<rect class="b-lid" x="${x - r - 1}" y="${y - r - 1}" width="${2 * r + 2}" height="${2 * r + 2}" rx="${r}" fill="${shade(c, -0.08)}"/>`);
      const tilt = dx < 0 ? 5 : dx > 0 ? -5 : 0;
      front.push(`<path d="M${x - r} ${y - r - 6 - tilt}L${x + r} ${y - r - 6 + tilt}" stroke="${ink}" stroke-width="5" stroke-linecap="round"/>`);
    }

    // mouth
    const my = fy + 26;
    if (cfg.extra === 'feathers') {
      front.push(`<path d="M${fx - 15} ${my - 6}L${fx + 15} ${my - 6}L${fx} ${my + 18}Z" fill="#ff9f1c" stroke="${shade('#ff9f1c', -0.3)}" stroke-width="2"/>`);
    } else {
      front.push(`<path d="M${fx - 28} ${my}Q${fx} ${my + 30} ${fx + 28} ${my}Q${fx} ${my + 10} ${fx - 28} ${my}Z" fill="${ink}"/>`);
      if (cfg.fangs) front.push(`<path d="M${fx - 19} ${my + 4}l5 11 5-9ZM${fx + 9} ${my + 5}l5 10 5-11Z" fill="#fff"/>`);
      else front.push(`<ellipse cx="${fx}" cy="${my + 12}" rx="10" ry="5" fill="#ff6f91"/>`);
    }
    if (cfg.extra === 'tusks') {
      front.push(`<path d="M${fx - 26} ${my + 2}q-12 24 6 34q-4-16 4-30Z" fill="#fffaf0" stroke="#d9cbb0" stroke-width="2"/>` +
        `<path d="M${fx + 26} ${my + 2}q12 24-6 34q4-16-4-30Z" fill="#fffaf0" stroke="#d9cbb0" stroke-width="2"/>`);
    }

    // extras on top
    if (cfg.extra === 'eyepatch') {
      const [dx, dy, r] = eyes[eyes.length - 1];
      over.push(`<path d="M${fx - sp - 22} ${fy - 30}L${fx + sp + 22} ${fy + 4}" stroke="${ink}" stroke-width="4"/>` +
        `<ellipse cx="${fx + dx}" cy="${fy + dy}" rx="${r + 4}" ry="${r + 2}" fill="${ink}"/>` +
        `<path d="M${fx - 46} ${top + 8}Q${fx} ${top - 22} ${fx + 46} ${top + 8}Q${fx} ${top + 2} ${fx - 46} ${top + 8}Z" fill="#e8384f"/>` +
        `<circle cx="${fx - 6}" cy="${top - 2}" r="3" fill="#fff"/><circle cx="${fx + 10}" cy="${top}" r="3" fill="#fff"/>`);
    }
    if (cfg.extra === 'crown') {
      over.push(`<path d="M${fx - 30} ${top + 6}V${top - 20}L${fx - 15} ${top - 6}L${fx} ${top - 28}L${fx + 15} ${top - 6}L${fx + 30} ${top - 20}V${top + 6}Z" fill="#ffc800" stroke="#e0a200" stroke-width="2.5" stroke-linejoin="round"/>` +
        `<circle cx="${fx}" cy="${top - 4}" r="4" fill="#ff4b4b"/><circle cx="${fx - 18}" cy="${top}" r="3" fill="#1cb0f6"/><circle cx="${fx + 18}" cy="${top}" r="3" fill="#58cc02"/>`);
    }
    if (cfg.extra === 'hat') {
      over.push(`<path d="M${fx - 34} ${top + 10}L${fx + 8} ${top - 42}L${fx + 34} ${top + 10}Z" fill="#2c2f7a"/>` +
        `<ellipse cx="${fx}" cy="${top + 10}" rx="44" ry="9" fill="#23255f"/>` +
        `<path d="M${fx + 2} ${top - 18}l3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z" fill="#ffc800"/>`);
    }
    if (cfg.extra === 'mirror') {
      over.push(`<g class="b-mirror"><rect x="164" y="122" width="8" height="34" rx="4" fill="#b8860b"/>` +
        `<ellipse cx="168" cy="108" rx="20" ry="25" fill="#ffc800"/><ellipse cx="168" cy="108" rx="14" ry="19" fill="#d8f3ff"/>` +
        `<path d="M160 98l10-8M158 108l14-12" stroke="#fff" stroke-width="3" stroke-linecap="round"/></g>`);
    }

    return `<ellipse class="b-shadow" cx="${fx}" cy="186" rx="58" ry="8" fill="#000" opacity=".12"/>` +
      `<g class="b-body">${behind.join('')}${feet}${body}${belly}${shine}${cracks}${front.join('')}${over.join('')}</g>`;
  }

  const monster = (cfg) => `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${monsterParts(cfg)}</svg>`;

  const ART =
    '<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">' +
    `<g transform="translate(6 10) scale(.54)">${monsterParts({ color: '#ff4b4b', shape: 'blob', eyes: 2, horns: 2, fangs: true })}</g>` +
    '<g transform="rotate(-38 92 70)"><rect x="88" y="22" width="9" height="62" rx="3" fill="#e9eef2" stroke="#9aa7b0" stroke-width="2"/>' +
    '<path d="M88 22l4.5-10 4.5 10Z" fill="#e9eef2" stroke="#9aa7b0" stroke-width="2"/>' +
    '<rect x="78" y="82" width="29" height="7" rx="3.5" fill="#ffc800"/><rect x="88.5" y="89" width="8" height="18" rx="3" fill="#8c5a2b"/></g>' +
    '<path d="M18 14l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="#ffc800"/></svg>';

  // --- content ----------------------------------------------------------------------------------
  function bossFor(topic) {
    const all = B.games.data.play.bosses;
    return all[topic] || all.all;
  }

  const poolFor = (topic, level) => B.games.lib.cardsFor(topic, level, { types: TYPES[level] || QUICK, min: MIN_CARDS });

  const plain = (s) => String(s == null ? '' : s).replace(/_{3,}/g, '…');

  B.games.register('boss', {
    name: 'Bossfight',
    icon: '🐉',
    art: ART,
    color: '#ff4b4b',
    blurb: 'Every topic has its monster. Answer its cards right to bring it down — before it gets you.',
    how: ['A right answer hits the boss, a wrong one costs a heart', '4 right in a row = a critical hit', 'Keys: Enter checks and continues; 1–4 pick an option'],
    topics: '*',
    ready: (topic, level) => poolFor(topic, level).length >= MIN_CARDS,
    lives: 3,

    play(stage, api) {
      const level = api.level;
      const boss = bossFor(api.topic);
      const maxHp = HP[level] || 7;
      let hp = maxHp;
      const next = B.games.lib.deal(poolFor(api.topic, level));
      let card = null;
      let ctrl = null;
      let ready = false;
      let phase = 'wait'; // wait → answer → busy → feedback → answer …
      let tauntTimer = 0;

      // --- layout ------------------------------------------------------------------------------
      const mon = h('div', { class: 'boss-mon', html: monster(boss) });
      const say = h('div', { class: 'boss-say', 'aria-live': 'polite', hidden: true });
      const hpBar = h('div', { class: 'boss-hp', role: 'meter', 'aria-label': 'Boss health', 'aria-valuemin': '0', 'aria-valuemax': String(maxHp) });
      const hpCells = Array.from({ length: maxHp }, () => h('span', { class: 'boss-hp-cell' }));
      hpBar.append(...hpCells);
      const arena = h('div', { class: 'boss-arena' },
        h('div', { class: 'boss-stage' }, mon, say),
        h('div', { class: 'boss-info' }, h('div', { class: 'boss-name' }, boss.name), hpBar));
      const flash = h('div', { class: 'boss-flash', 'aria-hidden': 'true' });
      const cardEl = h('div', { class: 'boss-card' });
      const fb = h('div', { class: 'boss-fb', 'aria-live': 'polite' });
      const mainBtn = h('button', { type: 'button', class: 'btn btn-primary boss-btn', disabled: true }, '⚔ Attack');
      mainBtn.addEventListener('click', () => (phase === 'feedback' ? nextCard() : check()));
      const foot = h('div', { class: 'boss-foot' }, fb, mainBtn);
      const wrap = h('div', { class: 'boss-wrap' }, arena, cardEl, foot, flash);
      stage.append(wrap);
      paintHp();

      function paintHp() {
        hpCells.forEach((cell, i) => cell.classList.toggle('lost', i >= hp));
        hpBar.setAttribute('aria-valuenow', String(hp));
      }

      function taunt(kind) {
        say.textContent = pick(TAUNT[kind]);
        say.hidden = false;
        B.util.pulse(say, 'pop');
        const mine = ++tauntTimer;
        api.after(1700, () => {
          if (mine === tauntTimer) say.hidden = true;
        });
      }

      const exApi = {
        changed(r) {
          if (phase !== 'answer') return;
          ready = !!r;
          mainBtn.disabled = !ready;
        },
        submit() {
          if (ready) check();
        },
        sfx: (n) => api.sfx(n),
        speak: (t) => B.store.setting('sound') !== false && api.speak(t),
        get card() {
          return card;
        },
      };

      function nextCard() {
        if (api.ended) return;
        B.gloss.hideTip();
        for (let tries = 0; tries < 5; tries++) {
          card = next();
          const def = card && B.ex.get(card.type);
          if (!def) continue;
          const exRoot = h('div', { class: 'ex ex-' + card.type });
          try {
            ctrl = def.render(card, exRoot, exApi);
          } catch (err) {
            console.error('[Brezel] boss: card failed to render', card.id, err);
            continue;
          }
          cardEl.replaceChildren(exRoot);
          cardEl.scrollTop = 0;
          cardEl.classList.remove('enter');
          void cardEl.offsetWidth;
          cardEl.classList.add('enter');
          fb.replaceChildren();
          foot.classList.remove('is-good', 'is-bad');
          ready = false;
          phase = 'answer';
          mainBtn.textContent = '⚔ Attack';
          mainBtn.className = 'btn btn-primary boss-btn';
          mainBtn.disabled = true;
          if (ctrl && ctrl.focus) ctrl.focus();
          return;
        }
        api.end({ note: 'No more cards to fight with.' });
      }

      function shoot(done) {
        if (reducedMotion() || typeof Element.prototype.animate !== 'function') return done();
        const box = wrap.getBoundingClientRect();
        const a = mainBtn.getBoundingClientRect();
        const b = mon.getBoundingClientRect();
        const shot = h('div', { class: 'boss-shot', 'aria-hidden': 'true' }, '🥨');
        shot.style.left = a.left - box.left + a.width / 2 + 'px';
        shot.style.top = a.top - box.top + 'px';
        wrap.append(shot);
        api.sfx('whoosh');
        const dx = b.left + b.width / 2 - (a.left + a.width / 2);
        const dy = b.top + b.height / 2 - a.top;
        const anim = shot.animate(
          [
            { transform: 'translate(-50%, -50%) scale(.6) rotate(0deg)', opacity: 1 },
            { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(1.3) rotate(540deg)`, opacity: 1 },
          ],
          { duration: 380, easing: 'cubic-bezier(.4,0,.7,1)' }
        );
        anim.onfinish = () => {
          shot.remove();
          done();
        };
      }

      function damage(n, crit) {
        const tag = h('div', { class: 'boss-dmg' + (crit ? ' crit' : ''), 'aria-hidden': 'true' }, crit ? `KRITISCH! −${n}` : `−${n}`);
        mon.parentNode.append(tag);
        api.after(1000, () => tag.remove());
      }

      function check() {
        if (phase !== 'answer' || !ready || api.ended) return;
        phase = 'busy';
        mainBtn.disabled = true;
        B.gloss.hideTip();
        let res;
        try {
          res = ctrl.check() || { ok: false };
          ctrl.lock(res);
        } catch (err) {
          console.error('[Brezel] boss: check failed', card.id, err);
          res = res || { ok: false };
        }
        let sol = null;
        try {
          sol = ctrl.solution ? ctrl.solution() : null;
        } catch (err) {
          sol = null;
        }
        if (res.ok) {
          const streak = api.combo + 1;
          const crit = streak % 4 === 0;
          const dmg = Math.min(hp, crit ? 2 : 1);
          foot.classList.add('is-good');
          fb.replaceChildren(h('b', {}, crit ? '💥 Kritischer Treffer!' : pick(['Treffer!', 'Volltreffer!', 'Richtig!', 'Bumm!'])));
          shoot(() => {
            if (api.ended) return;
            hp -= dmg;
            paintHp();
            B.util.pulse(mon, 'hit');
            damage(dmg, crit);
            api.sfx('boom');
            api.hit({ el: mon, points: 20 * dmg });
            if (hp <= 0) {
              mon.classList.add('defeated');
              say.hidden = true;
              api.sfx('levelup');
              api.after(1300, () => api.end({ won: true, note: `${boss.name} is defeated!` }));
              return;
            }
            taunt('hurt');
            api.after(800, nextCard);
          });
          return;
        }
        // wrong: the boss strikes back
        const d = B.ex.get(card.type).describe(card);
        B.util.pulse(mon, 'attack');
        B.util.pulse(flash, 'on');
        taunt('laugh');
        api.miss({ q: plain(d.q), a: plain(d.a), given: res.given ? String(res.given) : null, el: arena });
        foot.classList.add('is-bad');
        fb.replaceChildren(
          h('div', { class: 'boss-fb-head' }, h('b', {}, 'Autsch! '), 'The right answer:'),
          sol && sol.html ? h('div', { class: 'boss-fb-sol', html: sol.html }) : h('div', { class: 'boss-fb-sol', html: md(show(d.a)) }),
          card.explain ? h('div', { class: 'boss-fb-why', html: md(card.explain) }) : null);
        if (sol && sol.say && B.store.setting('sound') !== false) api.speak(sol.say);
        if (!api.lives) return; // out of hearts: the frame ends the game
        api.after(300, () => {
          if (api.ended) return;
          phase = 'feedback';
          mainBtn.textContent = 'Continue';
          mainBtn.className = 'btn btn-danger boss-btn';
          mainBtn.disabled = false;
          mainBtn.focus({ preventScroll: true });
        });
      }

      return {
        begin() {
          B.util.pulse(mon, 'roar');
          taunt('start');
          nextCard();
        },
        key(e) {
          const inField = /^(INPUT|TEXTAREA)$/.test(e.target && e.target.tagName);
          if (e.key === 'Enter') {
            if (phase === 'feedback') return nextCard(), true;
            if (phase === 'answer') {
              // a table moves to its next empty cell first
              if (ctrl && ctrl.key && inField && ctrl.key(e)) return true;
              if (ready) check();
              return true;
            }
            return phase === 'busy';
          }
          if (phase === 'answer' && ctrl && ctrl.key && !inField) return !!ctrl.key(e);
          return false;
        },
        destroy() {
          B.gloss.hideTip();
        },
      };
    },
  });

  // exposed for tests and for anyone who wants to draw a boss elsewhere
  B.games.data.play._gen.monster = monster;
  B.games.data.play._gen.bossPool = poolFor;
})();
