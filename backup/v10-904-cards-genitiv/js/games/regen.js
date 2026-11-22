/*
 * Artikel-Regen: nouns rain down in lanes. Answer the lowest one with der, die or das before it
 * hits the ground: right → it drops into its bucket (and is spoken: "der Bahnhof"), wrong → it
 * shatters, on the ground → splash. Both cost a life. Survive 90 seconds.
 * Nouns: Brezel.games.data.play.nouns (only those with a glossary meaning).
 *   Low: slow rain, 5 lives, the English meaning under each word · Medium: faster, 4 lives ·
 *   High: fast and dense, 3 lives. Speed and density keep rising during the game.
 */
(function () {
  'use strict';
  const B = window.Brezel;
  const { h, reducedMotion } = B.util;

  const ARTS = ['der', 'die', 'das'];
  const FALL = { 1: 9500, 2: 7400, 3: 5600 }; // ms from the top to the ground at the start
  const SPAWN = { 1: 2900, 2: 2200, 3: 1650 }; // ms between new words at the start
  const LIVE = { 1: 3, 2: 4, 3: 5 }; // words in the air at most
  const nouns = () => B.games.data.play._gen.regenNouns();

  const ART =
    '<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">' +
    '<g fill="#ffffff" stroke="#bfe6fb" stroke-width="3"><circle cx="38" cy="44" r="16"/><circle cx="60" cy="34" r="21"/><circle cx="84" cy="44" r="16"/></g>' +
    '<rect x="30" y="40" width="62" height="20" rx="10" fill="#ffffff"/>' +
    '<path d="M32 70c0 0-9 12-9 18a9 9 0 0 0 18 0c0-6-9-18-9-18z" fill="#1cb0f6"/>' +
    '<path d="M60 80c0 0-9 12-9 18a9 9 0 0 0 18 0c0-6-9-18-9-18z" fill="#ff4b8b"/>' +
    '<path d="M88 70c0 0-9 12-9 18a9 9 0 0 0 18 0c0-6-9-18-9-18z" fill="#58cc02"/>' +
    '<g font-family="system-ui,-apple-system,Segoe UI,sans-serif" font-weight="900" font-size="9" fill="#fff" text-anchor="middle">' +
    '<text x="32" y="92">der</text><text x="60" y="102">die</text><text x="88" y="92">das</text></g>' +
    '<path d="M100 14l2.6 6 6 2.6-6 2.6-2.6 6-2.6-6-6-2.6 6-2.6z" fill="#ffc800"/></svg>';

  const BUCKET =
    '<svg viewBox="0 0 48 40" aria-hidden="true"><path d="M6 10h36l-5 26a4 4 0 0 1-4 3H15a4 4 0 0 1-4-3Z" fill="currentColor" opacity=".9"/>' +
    '<ellipse cx="24" cy="10" rx="19" ry="5" fill="currentColor"/><ellipse cx="24" cy="10" rx="15" ry="3" fill="#000" opacity=".18"/></svg>';

  B.games.register('regen', {
    name: 'Artikel-Regen',
    icon: '🌧️',
    art: ART,
    color: '#1cb0f6',
    blurb: 'Nouns are raining down. Catch each one in the right bucket: der, die or das.',
    how: ['Answer the **lowest** word before it lands', 'Tap **der**, **die** or **das**', 'Keys: 1 / 2 / 3 or ← ↓ →'],
    topics: ['cases', 'gender', 'vocab'],
    ready: () => nouns().length >= 20,
    time: 90,
    lives: (level) => ({ 1: 5, 2: 4, 3: 3 })[level] || 4,

    play(stage, api) {
      const level = api.level;
      const next = B.games.lib.deal(nouns());
      const soundOn = () => B.store.setting('sound') !== false;
      const drops = []; // { el, noun, art, y, lane, h, done }
      let elapsed = 0;
      let spawnIn = 400;
      let caught = 0;
      let skyH = 0;
      let skyW = 0;
      let lanes = 3;

      const sky = h('div', { class: 'rg-sky', 'aria-live': 'polite' },
        h('div', { class: 'rg-cloud c1', 'aria-hidden': 'true' }),
        h('div', { class: 'rg-cloud c2', 'aria-hidden': 'true' }),
        h('div', { class: 'rg-ground', 'aria-hidden': 'true' }));
      const buckets = ARTS.map((art, i) => {
        const b = h('button', { type: 'button', class: 'rg-bucket rg-' + art, 'aria-label': `${art} (key ${i + 1})`, onClick: () => answer(art) },
          h('span', { class: 'rg-bucket-ico', html: BUCKET }),
          h('span', { class: 'rg-bucket-art' }, art),
          h('span', { class: 'rg-key', 'aria-hidden': 'true' }, String(i + 1)));
        return b;
      });
      const wrap = h('div', { class: 'rg-wrap' }, sky, h('div', { class: 'rg-buckets' }, buckets));
      stage.append(wrap);

      function measure() {
        skyH = sky.clientHeight;
        skyW = sky.clientWidth;
        lanes = skyW >= 560 ? 4 : 3;
      }
      const onResize = () => measure();
      window.addEventListener('resize', onResize);
      measure();

      const ground = () => skyH - 14; // where a word lands (its bottom edge)
      const live = () => drops.filter((d) => !d.done);
      const lowest = () => live().reduce((m, d) => (!m || d.y > m.y ? d : m), null);

      function paintActive() {
        const a = lowest();
        for (const d of drops) d.el.classList.toggle('active', d === a);
      }

      function spawn() {
        const n = next();
        if (!n) return;
        // a lane whose last word has moved down far enough
        const free = [];
        for (let i = 0; i < lanes; i++) {
          const top = live().filter((d) => d.lane === i).reduce((m, d) => Math.min(m, d.y), Infinity);
          if (top > 70) free.push(i);
        }
        if (!free.length) {
          spawnIn = 300;
          return;
        }
        const lane = free[Math.floor(Math.random() * free.length)];
        const el = h('div', { class: 'rg-drop', lang: 'de' },
          h('span', { class: 'rg-art' }),
          h('span', { class: 'rg-word' }, n.noun),
          level === 1 ? h('span', { class: 'rg-en' }, n.en) : null);
        sky.append(el);
        // the lane's centre, kept inside the sky for long words
        const w = el.offsetWidth || 120;
        const x = Math.max(w / 2 + 6, Math.min(skyW - w / 2 - 6, ((lane + 0.5) / lanes) * skyW));
        el.style.left = x + 'px';
        const d = { el, noun: n.noun, art: n.art, x, y: -el.offsetHeight - 4, lane, h: el.offsetHeight || 44, done: false };
        place(d);
        drops.push(d);
        paintActive();
      }

      function place(d) {
        d.el.style.transform = `translate(-50%, ${d.y}px)`;
      }

      function remove(d, ms) {
        d.done = true;
        api.after(ms, () => {
          d.el.remove();
          const i = drops.indexOf(d);
          if (i >= 0) drops.splice(i, 1);
        });
        paintActive();
      }

      function answer(art) {
        if (api.ended) return;
        const d = lowest();
        const btn = buckets[ARTS.indexOf(art)];
        B.util.pulse(btn, 'press');
        if (!d) return;
        d.el.querySelector('.rg-art').textContent = d.art;
        d.el.classList.add('rg-' + d.art);
        if (art === d.art) {
          caught++;
          api.hit({ el: d.el });
          fly(d, btn);
          B.util.pulse(btn, 'gulp');
          if (soundOn()) api.speak(`${d.art} ${d.noun}`);
        } else {
          d.el.classList.add('shatter');
          api.miss({ q: d.noun, a: `${d.art} ${d.noun}`, given: `${art} ${d.noun}`, el: d.el });
          remove(d, 450);
        }
      }

      function fly(d, btn) {
        d.done = true;
        paintActive();
        const s = sky.getBoundingClientRect();
        const b = btn.getBoundingClientRect();
        const dx = b.left + b.width / 2 - s.left - d.x;
        const dy = b.top + b.height / 2 - s.top - (d.y + d.h / 2);
        if (reducedMotion() || typeof d.el.animate !== 'function') return remove(d, 0);
        d.el.animate(
          [
            { transform: `translate(-50%, ${d.y}px) translate(0px, 0px) scale(1)`, opacity: 1 },
            { transform: `translate(-50%, ${d.y}px) translate(${dx}px, ${dy}px) scale(.35)`, opacity: 0.2 },
          ],
          { duration: 420, easing: 'cubic-bezier(.5,0,.8,.6)', fill: 'forwards' }
        );
        remove(d, 430);
      }

      function frame(dt) {
        if (!skyH) measure();
        elapsed += dt;
        const ramp = Math.max(0.5, 1 - elapsed / 150000); // slowly faster
        const speed = (ground() + 40) / (FALL[level] * ramp); // px per ms
        for (const d of drops) {
          if (d.done) continue;
          d.y += speed * dt;
          place(d);
          if (d.y + d.h >= ground()) {
            d.el.querySelector('.rg-art').textContent = d.art;
            d.el.classList.add('splash', 'rg-' + d.art);
            api.miss({ q: d.noun, a: `${d.art} ${d.noun}`, given: '— (it landed)', el: d.el });
            remove(d, 500);
          }
        }
        spawnIn -= dt;
        if (spawnIn <= 0) {
          spawnIn = SPAWN[level] * Math.max(0.55, 1 - elapsed / 120000);
          if (live().length < LIVE[level]) spawn();
        }
        paintActive();
      }

      return {
        begin() {
          measure();
          api.frame(frame);
        },
        key(e) {
          const k = { 1: 'der', 2: 'die', 3: 'das', ArrowLeft: 'der', ArrowDown: 'die', ArrowRight: 'das' }[e.key];
          if (!k) return false;
          answer(k);
          return true;
        },
        timeUp() {
          api.end({ won: true, note: `You survived the rain — ${caught} nouns caught!` });
        },
        destroy() {
          window.removeEventListener('resize', onResize);
        },
      };
    },
  });
})();
