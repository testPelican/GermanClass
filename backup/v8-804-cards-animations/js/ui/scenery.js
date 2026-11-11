/*
 * The time-of-day scenery above the greeting on the start screen: a little Alpine view that follows
 * the clock — sunrise (Guten Morgen), sunshine (Guten Tag), sunset (Guten Abend), moon and stars at night.
 *   B.scene.now(date?) → 'morning' | 'day' | 'evening' | 'night'
 *   B.scene.svg(kind)  → the picture (inline SVG); its front hill is the card's own colour, so it melts
 *                        into the card in both themes. Clouds drift, stars twinkle, birds fly, the
 *                        chalet lights up in the evening (css: .scene in css/app.css).
 */
(function () {
  'use strict';
  const B = window.Brezel;

  function now(d = new Date()) {
    const hr = d.getHours();
    if (hr >= 5 && hr < 11) return 'morning';
    if (hr >= 11 && hr < 18) return 'day';
    if (hr >= 18 && hr < 22) return 'evening';
    return 'night';
  }

  const LOOK = {
    morning: { sky: ['#ffcf9e', '#ffe9d6', '#fff6ec'], far: '#e3b9c9', near: '#c995b4', snow: '#fff4f0', meadow: '#a8d86e' },
    day: { sky: ['#5cbcf5', '#a6dcfb', '#e2f5ff'], far: '#9fd3c0', near: '#6fbf8f', snow: '#ffffff', meadow: '#8fd14f' },
    evening: { sky: ['#5b3f8f', '#c0628f', '#ffab76'], far: '#7d5a8f', near: '#583f73', snow: '#f6d3e0', meadow: '#4f6b54' },
    night: { sky: ['#0b1733', '#18294f', '#2b3f6b'], far: '#26365c', near: '#1a2746', snow: '#c9d6f0', meadow: '#22344a' },
  };

  const cloud = (x, y, s, cls) =>
    `<g class="sc-cloud ${cls}" transform="translate(${x} ${y}) scale(${s})"><ellipse cx="0" cy="0" rx="22" ry="9" fill="#fff" opacity=".92"/><ellipse cx="-10" cy="-6" rx="11" ry="9" fill="#fff" opacity=".92"/><ellipse cx="8" cy="-8" rx="13" ry="11" fill="#fff" opacity=".92"/></g>`;

  function stars(n, seed) {
    let out = '';
    let r = seed;
    const rand = () => ((r = (r * 9301 + 49297) % 233280) / 233280);
    for (let i = 0; i < n; i++) {
      const x = Math.round(rand() * 400);
      const y = Math.round(4 + rand() * 46);
      const s = (0.6 + rand() * 1.1).toFixed(1);
      out += `<circle class="sc-star" cx="${x}" cy="${y}" r="${s}" fill="#fff" style="animation-delay:-${(rand() * 3).toFixed(2)}s;animation-duration:${(2 + rand() * 2.5).toFixed(2)}s"/>`;
    }
    return out;
  }

  const bird = (x, y, d) =>
    `<g class="sc-bird" style="animation-delay:${d}s" transform="translate(${x} ${y})"><path class="sc-wing" d="M-5 0q2.5-3 5 0q2.5-3 5 0" fill="none" stroke="#5a4a5a" stroke-width="1.4" stroke-linecap="round"/></g>`;

  function svg(kind) {
    const k = LOOK[kind] ? kind : now();
    const L = LOOK[k];
    const id = 'scg-' + k;
    const sun = {
      morning: `<g class="sc-sun sc-rise"><circle cx="300" cy="58" r="20" fill="#ffd27a" opacity=".45"/><circle cx="300" cy="58" r="13" fill="#ffb347"/></g>`,
      day: `<g class="sc-sun"><g class="sc-rays">${Array.from({ length: 10 }, (_, i) => `<rect x="318.5" y="13" width="3" height="7" rx="1.5" fill="#ffd84a" transform="rotate(${i * 36} 320 31)"/>`).join('')}</g><circle cx="320" cy="31" r="10" fill="#ffc800"/></g>`,
      evening: `<g class="sc-sun sc-set"><circle cx="196" cy="50" r="26" fill="#ffb37a" opacity=".35"/><circle cx="196" cy="50" r="15" fill="#ff8a5b"/></g><g class="sc-moon-small"><circle cx="330" cy="18" r="6" fill="#fff4d6"/><circle cx="333" cy="16" r="5.4" fill="#5b3f8f"/></g>`,
      night: `<g class="sc-moon"><circle cx="318" cy="24" r="17" fill="#fff6c9" opacity=".18"/><circle cx="318" cy="24" r="11" fill="#fff4c4"/><circle cx="323" cy="20" r="9.6" fill="#0f1d3a"/></g><path class="sc-shoot" d="M70 8l-26 12" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>`,
    }[k];
    const sky = (k === 'night' ? stars(34, 7) : k === 'evening' ? stars(10, 3) : '') + sun;
    const weather = k === 'day'
      ? cloud(70, 24, 1, 'c1') + cloud(205, 14, 0.75, 'c2') + cloud(380, 30, 0.9, 'c3')
      : k === 'morning'
        ? cloud(120, 22, 0.8, 'c1') + cloud(360, 16, 0.6, 'c2') + bird(190, 26, 0) + bird(205, 20, 0.4) + bird(176, 18, 0.8)
        : k === 'evening'
          ? cloud(250, 30, 0.7, 'c2 dusk')
          : '';
    const lit = k === 'evening' || k === 'night';
    const chalet = `<g class="sc-chalet" transform="translate(234 65)"><path d="M0 10V3l7-6 7 6v7z" fill="${lit ? '#3a2c3f' : '#b9784a'}"/><path d="M-2 4l9-8 9 8" fill="none" stroke="${lit ? '#2a2030' : '#8a5634'}" stroke-width="2.2" stroke-linejoin="round"/><rect class="${lit ? 'sc-window' : ''}" x="5" y="4" width="4" height="4" rx=".6" fill="${lit ? '#ffd56a' : '#e9f5ff'}"/></g>`;
    return `<svg class="scene scene-${k}" viewBox="0 0 400 90" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${L.sky[0]}"/><stop offset=".55" stop-color="${L.sky[1]}"/><stop offset="1" stop-color="${L.sky[2]}"/></linearGradient></defs>
<rect width="400" height="90" fill="url(#${id})"/>
${sky}${weather}
<path d="M0 70L38 44l22 14 40-30 34 26 26-16 44 30 30-22 40 28 36-34 40 30 30-16 20 12V90H0z" fill="${L.far}" opacity=".85"/>
<path d="M100 28l14 11-6-1-8 6-7-5-7 2z M296 34l12 10-5-1-7 5-6-4-6 2z" fill="${L.snow}" opacity=".9"/>
<path d="M0 78l50-26 30 16 46-34 40 30 34-20 42 28 38-26 44 30 30-14 46 22V90H0z" fill="${L.near}"/>
<path d="M126 34l13 10-6-1-7 6-6-5-6 2z" fill="${L.snow}"/>
<path d="M0 82c40-12 80-14 120-8s70 10 120 2 90-14 160-4V90H0z" fill="${L.meadow}"/>
${chalet}
<path d="M0 86c50-7 100-8 160-4s110 6 160 1 60-5 80-4V90H0z" style="fill:var(--surface)"/>
</svg>`;
  }

  B.scene = { now, svg };
})();
