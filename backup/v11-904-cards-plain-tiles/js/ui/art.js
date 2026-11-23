/*
 * Topic pictures: one small animated SVG per topic (flat, friendly, readable from 18 px up).
 *
 *   B.art.topic(id) → '<svg class="t-art t-art-<id>" viewBox="0 0 64 64" aria-hidden="true">…</svg>'
 *                     ids: all, rules, verblist, order, present, past, cases, prepositions, gender,
 *                     possessive, questions, verbs, prefix, tenses, praet, reflexive, pastq, vocab;
 *                     any other id gets a generic card with a star.
 *   B.art.color(id) → the topic's accent colour (works on light and dark surfaces)
 *   B.art.burst(el) → plays the one-shot "hello" animation of every picture inside el
 *   B.art.ids       → the topic ids that have their own picture
 *
 * Animation hooks (all in css/art.css, CSS only):
 *   - a gentle loop while an ancestor has .is-playing, or on hover of an ancestor .art-host
 *     (hover-capable devices only);
 *   - a lively one-shot while an ancestor has .art-burst (B.art.burst adds and removes it);
 *   - otherwise the picture is still; prefers-reduced-motion keeps it still.
 * Every moving part is a <g class="ta ta-…"> without a transform attribute (CSS transforms would
 * replace it); css/art.css gives each part its --loop and --burst animation.
 * No ids inside the SVGs, so any number of pictures can share a page.
 */
(function () {
  'use strict';
  const B = window.Brezel;

  const FONT = 'system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif';

  /** A five-pointed star path around (cx, cy). */
  function star(cx, cy, R, r, n = 5) {
    const pts = [];
    for (let i = 0; i < n * 2; i++) {
      const a = (Math.PI / n) * i - Math.PI / 2;
      const rad = i % 2 ? r : R;
      pts.push(`${(cx + Math.cos(a) * rad).toFixed(2)} ${(cy + Math.sin(a) * rad).toFixed(2)}`);
    }
    return 'M' + pts.join('L') + 'Z';
  }

  /** A four-pointed sparkle (concave sides) around (x, y). */
  const sparkle = (x, y, s) => `M${x} ${y - s}Q${x} ${y} ${x + s} ${y}Q${x} ${y} ${x} ${y + s}Q${x} ${y} ${x - s} ${y}Q${x} ${y} ${x} ${y - s}Z`;

  /** A small heart whose point is at (x, y + h·0.42). */
  function heart(x, y, w) {
    const k = w / 11;
    const f = (n) => (n * k).toFixed(2);
    return `M${x} ${(y + 4.5 * k).toFixed(2)}c${f(-3.5)} ${f(-2.6)} ${f(-5.5)} ${f(-4.6)} ${f(-5.5)} ${f(-6.9)}a${f(2.9)} ${f(2.9)} 0 0 1 ${f(5.5)} ${f(-1.3)} ${f(2.9)} ${f(2.9)} 0 0 1 ${f(5.5)} ${f(1.3)}c0 ${f(2.3)} ${f(-2)} ${f(4.3)} ${f(-5.5)} ${f(6.9)}z`;
  }

  const COLORS = {
    all: '#a560e8',
    rules: '#1cb0f6',
    verblist: '#f5b800',
    order: '#58cc02',
    present: '#ff9600',
    past: '#2a78d6',
    cases: '#ff4b4b',
    prepositions: '#e5487d',
    gender: '#ce82ff',
    possessive: '#e8743b',
    questions: '#00b5d8',
    verbs: '#6c7bd9',
    prefix: '#ff6fc0',
    tenses: '#8e5cf7',
    praet: '#c9a227',
    reflexive: '#00c2a8',
    pastq: '#3fa7ff',
    vocab: '#4cb944',
  };

  const ART = {
    // ✨ all topics: a fan of cards with sparkles
    all: () => `
      <g class="ta ta-c1"><rect x="21" y="13" width="22" height="31" rx="4" fill="#ffc800" transform="rotate(-24 32 50)"/><circle cx="25.5" cy="18" r="2" fill="#fff" transform="rotate(-24 32 50)"/></g>
      <g class="ta ta-c3"><rect x="21" y="13" width="22" height="31" rx="4" fill="#1cb0f6" transform="rotate(24 32 50)"/><circle cx="25.5" cy="18" r="2" fill="#fff" transform="rotate(24 32 50)"/></g>
      <g class="ta ta-c2"><rect x="21" y="12" width="22" height="32" rx="4" fill="#a560e8"/><rect x="21" y="38" width="22" height="6" rx="3" fill="#8441c4"/><path d="${star(32, 27, 7.5, 3.2)}" fill="#fff" stroke="#fff" stroke-width="1.2" stroke-linejoin="round"/></g>
      <g class="ta ta-sp1"><path d="${sparkle(10, 15, 5.5)}" fill="#ffc800"/></g>
      <g class="ta ta-sp2"><path d="${sparkle(54, 12, 4.5)}" fill="#ff86d0"/></g>`,

    // 📏 rules: a ruler and a pencil drawing a line
    rules: () => `
      <rect x="5" y="40" width="54" height="15" rx="3.5" fill="#1cb0f6"/>
      <rect x="5" y="50" width="54" height="5" rx="2.5" fill="#1899d6"/>
      <path d="M11 40v6M17 40v4M23 40v6M29 40v4M35 40v6M41 40v4M47 40v6M53 40v4" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/>
      <path class="ta ta-line" d="M10 33H44" stroke="#ff4b4b" stroke-width="3.6" stroke-linecap="round" stroke-dasharray="34 40" fill="none"/>
      <g class="ta ta-pencil"><g transform="translate(44 33) rotate(32)">
        <path d="M0 0L-4.2 -8H4.2Z" fill="#f7d9a8"/><path d="M0 0L-1.7 -3.3H1.7Z" fill="#4b4b4b"/>
        <rect x="-4.2" y="-22" width="8.4" height="14" fill="#ffc800"/><rect x="-1" y="-22" width="2" height="14" fill="#f0a800"/>
        <rect x="-4.2" y="-25" width="8.4" height="3.4" fill="#c4ccd4"/><rect x="-4.2" y="-30" width="8.4" height="5.6" rx="2.2" fill="#ff86d0"/>
      </g></g>`,

    // 📒 verb list: a spiral notebook whose pages flip
    verblist: () => `
      <rect x="10" y="7" width="45" height="51" rx="6" fill="#f5b800"/>
      <rect x="10" y="50" width="45" height="8" rx="4" fill="#d99c00"/>
      <g class="ta ta-ribbon"><path d="M43 7v13l3-2.6 3 2.6V7z" fill="#ff4b4b"/></g>
      <rect x="15" y="11" width="36" height="42" rx="3" fill="#fff4cc"/>
      <path d="M22 21h23M22 28h23M22 35h17M22 42h20" stroke="#f3dc8f" stroke-width="2.6" stroke-linecap="round"/>
      <g class="ta ta-page">
        <rect x="15" y="11" width="36" height="42" rx="3" fill="#fff"/>
        <path d="M19.5 14v36" stroke="#ffb3b3" stroke-width="1.6"/>
        <path d="M23 21h22M23 28h22M23 35h16M23 42h19" stroke="#9fd3f5" stroke-width="2.8" stroke-linecap="round"/>
      </g>
      <path d="M12 16.5h6M12 23.5h6M12 30.5h6M12 37.5h6M12 44.5h6" stroke="#4b4b4b" stroke-width="2.6" stroke-linecap="round"/>`,

    // 🧩 word order: two puzzle pieces clicking together
    order: () => `
      <g class="ta ta-left"><path d="M8 22a4 4 0 0 1 4-4h18v9a5 5 0 0 1 0 10v9H12a4 4 0 0 1-4-4z" fill="#58cc02"/><circle cx="18" cy="32" r="3.4" fill="#8ee04f"/></g>
      <g class="ta ta-right"><path d="M30 18h22a4 4 0 0 1 4 4v20a4 4 0 0 1-4 4H30v-9a5 5 0 0 0 0-10z" fill="#ffc800"/><path d="M30 19.2V27a5 5 0 0 1 0 10v7.8" fill="none" stroke="#d99c00" stroke-width="2.2" stroke-linecap="round"/><circle cx="46" cy="32" r="3.4" fill="#ffe27a"/></g>
      <g class="ta ta-spark" opacity="0"><path d="${sparkle(30, 12, 6)}" fill="#58cc02"/><path d="${sparkle(38, 52, 4)}" fill="#ffc800"/></g>`,

    // ⏱️ present tense: a stopwatch ticking now
    present: () => `
      <g class="ta ta-watch">
        <rect x="29.5" y="11" width="5" height="6" fill="#e07f00"/>
        <g class="ta ta-btn"><rect x="25.5" y="6" width="13" height="6.5" rx="3.2" fill="#ff9600"/></g>
        <rect x="46" y="12" width="7" height="5.5" rx="2" fill="#ff9600" transform="rotate(42 49.5 14.7)"/>
        <circle cx="32" cy="37" r="21" fill="#ff9600"/>
        <circle cx="32" cy="37" r="21" fill="none" stroke="#e07f00" stroke-width="2.4"/>
        <circle cx="32" cy="37" r="16" fill="#fff"/>
        <path d="M32 37V21a16 16 0 0 1 13.86 8z" fill="#ffe2b8"/>
        <path d="M32 22.5v3M32 48.5v3M17.5 37h3M43.5 37h3" stroke="#ffb54d" stroke-width="2.4" stroke-linecap="round"/>
        <g class="ta ta-hand"><rect x="30.6" y="24" width="2.8" height="14" rx="1.4" fill="#3c3c3c" transform="rotate(60 32 37)"/></g>
        <circle cx="32" cy="37" r="2.6" fill="#3c3c3c"/>
      </g>`,

    // ⏪ past tense (Perfekt): a clock whose hands run backwards
    past: () => `
      <g class="ta ta-arrow">
        <path d="M50.4 18.6A24 24 0 0 0 9.45 25.8" fill="none" stroke="#ffc800" stroke-width="4" stroke-linecap="round"/>
        <path d="M8.4 28.6L6.6 21.6L14.4 24.4Z" fill="#ffc800" stroke="#ffc800" stroke-width="1.6" stroke-linejoin="round"/>
      </g>
      <circle cx="32" cy="34" r="19" fill="#2a78d6"/>
      <circle cx="32" cy="34" r="14.5" fill="#fff"/>
      <path d="M32 21.5v2.8M32 43.7v2.8M19.5 34h2.8M41.7 34h2.8" stroke="#9cb9e6" stroke-width="2.4" stroke-linecap="round"/>
      <g class="ta ta-hr"><rect x="30.5" y="27" width="3" height="8" rx="1.5" fill="#3c3c3c" transform="rotate(-70 32 34)"/></g>
      <g class="ta ta-min"><rect x="30.7" y="22.5" width="2.6" height="12.5" rx="1.3" fill="#3c3c3c"/></g>
      <circle cx="32" cy="34" r="2.5" fill="#3c3c3c"/>`,

    // 🎯 articles & cases: a target hit by an arrow
    cases: () => `
      <g class="ta ta-target">
        <circle cx="27" cy="37" r="21" fill="#ff4b4b"/>
        <circle cx="27" cy="37" r="15.5" fill="#fff"/>
        <circle cx="27" cy="37" r="10" fill="#ff4b4b"/>
        <circle cx="27" cy="37" r="4.5" fill="#fff"/>
      </g>
      <g class="ta ta-ripple" opacity="0"><circle cx="27" cy="37" r="21" fill="none" stroke="#ff4b4b" stroke-width="2.5"/></g>
      <g class="ta ta-arrow">
        <path d="M28.5 35.5L52 12" stroke="#a0662d" stroke-width="3.6" stroke-linecap="round"/>
        <path d="M50.5 13.5l1.2-9 4.2 4.2z" fill="#ffc800" stroke="#ffc800" stroke-width="1.2" stroke-linejoin="round"/>
        <path d="M50.5 13.5l9-1.2-4.2-4.2z" fill="#ffb000" stroke="#ffb000" stroke-width="1.2" stroke-linejoin="round"/>
      </g>`,

    // 📍 prepositions: a pin dropping onto a folded map
    prepositions: () => `
      <path d="M4 46L22 42V58L4 62Z" fill="#a8e07a"/>
      <path d="M22 42L42 46V62L22 58Z" fill="#8cd35a"/>
      <path d="M42 46L60 42V58L42 62Z" fill="#a8e07a"/>
      <path d="M8 56c8-6 16 2 24-5" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-dasharray="2.6 3"/>
      <g class="ta ta-shadow"><ellipse cx="32" cy="51" rx="6.5" ry="2" fill="#000" fill-opacity="0.2"/></g>
      <g class="ta ta-pin">
        <path d="M32 50C28 44 18 36 18 25A14 14 0 0 1 46 25C46 36 36 44 32 50Z" fill="#e5487d"/>
        <circle cx="32" cy="25" r="6" fill="#fff"/>
        <ellipse cx="25" cy="19" rx="2.2" ry="3.4" fill="#fff" fill-opacity="0.35" transform="rotate(30 25 19)"/>
      </g>`,

    // 👩‍🏫 female & male forms: two colleagues, he and she, waving
    gender: () => `
      <g class="ta ta-he">
        <path d="M8 57v-6c0-7.5 6-12.5 13-12.5s13 5 13 12.5v6z" fill="#1cb0f6"/>
        <path d="M21 38.5l-2.6 3.6 2.6 8 2.6-8z" fill="#ffc800"/>
        <circle cx="21" cy="27" r="8.5" fill="#ffd6a8"/>
        <path d="M12.5 26c0-6.2 3.8-9.8 8.5-9.8s8.5 3.4 8.5 8.8c-2.8-1.4-5.4-3.2-6.8-5.6-2.4 3.2-6.2 5.4-10.2 6.6z" fill="#6b4a2b"/>
        <circle cx="18" cy="28.5" r="1.3" fill="#3c3c3c"/><circle cx="24" cy="28.5" r="1.3" fill="#3c3c3c"/>
        <path d="M18.5 31.8q2.5 2 5 0" fill="none" stroke="#3c3c3c" stroke-width="1.4" stroke-linecap="round"/>
      </g>
      <g class="ta ta-she">
        <circle cx="43" cy="16" r="4.2" fill="#a0522d"/>
        <circle cx="43" cy="28" r="9.6" fill="#a0522d"/>
        <path d="M31 57v-5c0-6.6 5.4-11.6 12-11.6s12 5 12 11.6v5z" fill="#ce82ff"/>
        <circle cx="43" cy="29.5" r="7.6" fill="#ffd6a8"/>
        <path d="M35.4 28c1.5-4.8 4.6-7.2 7.6-7.2s6 2.2 7.4 6.8c-3-.6-6-2.4-7.6-4.8-1.6 2.6-4.4 4.4-7.4 5.2z" fill="#a0522d"/>
        <circle cx="40.4" cy="30.3" r="1.25" fill="#3c3c3c"/><circle cx="45.6" cy="30.3" r="1.25" fill="#3c3c3c"/>
        <path d="M40.6 33.2q2.4 1.9 4.8 0" fill="none" stroke="#3c3c3c" stroke-width="1.4" stroke-linecap="round"/>
        <g class="ta ta-wave"><path d="M52.5 45.5L57.5 34" stroke="#ce82ff" stroke-width="4.6" stroke-linecap="round"/><circle cx="58" cy="31.6" r="3.2" fill="#ffd6a8"/></g>
      </g>`,

    // 🏠 possessives: a house whose door opens on a heart (mein Haus)
    possessive: () => `
      <g class="ta ta-smoke" opacity="0"><circle cx="45" cy="8" r="2.8" fill="#c9c9c9"/></g>
      <rect x="41.5" y="11" width="6.5" height="12" rx="1.5" fill="#c95f2b"/>
      <path d="M9 30L32 12L55 30Z" fill="#e8743b" stroke="#e8743b" stroke-width="5" stroke-linejoin="round"/>
      <rect x="14" y="28" width="36" height="28" rx="3" fill="#ffe2c4"/>
      <rect x="18" y="33" width="9.5" height="8.5" rx="1.6" fill="#9fd8f7"/>
      <path d="M22.75 33v8.5M18 37.25h9.5" stroke="#fff" stroke-width="1.6"/>
      <rect x="31" y="37" width="13" height="19" rx="2.5" fill="#6b3a1f"/>
      <g class="ta ta-heart"><path d="${heart(37.5, 46, 10)}" fill="#ff4b4b"/></g>
      <g class="ta ta-door"><rect x="31" y="37" width="13" height="19" rx="2.5" fill="#b5652e"/><rect x="33" y="40" width="9" height="6" rx="1.2" fill="#c97a40"/><circle cx="41.2" cy="48" r="1.4" fill="#ffc800"/></g>
      <path d="M9 57.5h46" stroke="#d9b38c" stroke-width="3" stroke-linecap="round"/>`,

    // ❓ questions & negation: a bouncing "?" bubble with a small "nein" cross
    questions: () => `
      <g class="ta ta-bubble">
        <rect x="6" y="8" width="42" height="32" rx="13" fill="#00b5d8"/>
        <path d="M16 36L11 49L26 39Z" fill="#00b5d8" stroke="#00b5d8" stroke-width="2" stroke-linejoin="round"/>
        <text x="27" y="34.5" text-anchor="middle" font-family="${FONT}" font-size="26" font-weight="900" fill="#fff">?</text>
      </g>
      <g class="ta ta-no">
        <circle cx="48" cy="46" r="10" fill="#ff4b4b" stroke="#fff" stroke-width="2.6"/>
        <path d="M44.2 42.2l7.6 7.6M51.8 42.2l-7.6 7.6" stroke="#fff" stroke-width="3.2" stroke-linecap="round"/>
      </g>`,

    // 🔗 modal verbs & gern: two gears working together, and a heart for gern
    verbs: () => `
      <g class="ta ta-g1">
        <circle cx="25" cy="39" r="15.2" fill="none" stroke="#6c7bd9" stroke-width="5" stroke-dasharray="4.775 4.775"/>
        <circle cx="25" cy="39" r="13.2" fill="#6c7bd9"/>
        <circle cx="25" cy="39" r="8.4" fill="none" stroke="#5563c4" stroke-width="2.2"/>
        <circle cx="25" cy="39" r="4.4" fill="#fff"/>
      </g>
      <g class="ta ta-g2">
        <circle cx="46" cy="21" r="9.8" fill="none" stroke="#ffc800" stroke-width="4.2" stroke-dasharray="4.4 4.4"/>
        <circle cx="46" cy="21" r="8.2" fill="#ffc800"/>
        <circle cx="46" cy="21" r="3.2" fill="#fff"/>
      </g>
      <g class="ta ta-heart"><path d="${heart(13, 12, 12)}" fill="#ff86d0"/></g>`,

    // ✂️ separable verbs: scissors cutting auf | stehen apart
    prefix: () => `
      <g class="ta ta-pre"><rect x="5" y="42" width="21" height="15" rx="4" fill="#ff6fc0"/><text x="15.5" y="52.9" text-anchor="middle" font-family="${FONT}" font-size="9" font-weight="800" fill="#fff">auf</text></g>
      <g class="ta ta-stem"><rect x="29" y="43.2" width="29.8" height="12.6" rx="3.6" fill="#fff" stroke="#ff6fc0" stroke-width="2.4"/><text x="43.9" y="52.8" text-anchor="middle" font-family="${FONT}" font-size="8.4" font-weight="800" fill="#d6409f">stehen</text></g>
      <path class="ta ta-cut" d="M27.5 38v23" stroke="#ff6fc0" stroke-width="1.8" stroke-linecap="round" stroke-dasharray="2.4 2.6"/>
      <g class="ta ta-bladeA"><path d="M22.5 16.5L30 36" stroke="#9aa5b1" stroke-width="3.8" stroke-linecap="round"/><circle cx="19.5" cy="12.5" r="5" fill="none" stroke="#ff6fc0" stroke-width="3.4"/></g>
      <g class="ta ta-bladeB"><path d="M31.5 16.5L24 36" stroke="#b7c0ca" stroke-width="3.8" stroke-linecap="round"/><circle cx="34.5" cy="12.5" r="5" fill="none" stroke="#ff6fc0" stroke-width="3.4"/></g>
      <circle cx="27" cy="28.2" r="2.1" fill="#4b4b4b"/>`,

    // 🧠 tenses: a timeline whose three moments light up in turn
    tenses: () => `
      <path d="M7 40H54" stroke="#8e5cf7" stroke-width="4" stroke-linecap="round"/>
      <path d="M50.5 34.5L57 40l-6.5 5.5" fill="none" stroke="#8e5cf7" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
      <g class="ta ta-d1"><circle cx="13" cy="40" r="6.6" fill="#3fa7ff" stroke="#fff" stroke-width="2.4"/></g>
      <g class="ta ta-d2"><circle cx="29" cy="40" r="6.6" fill="#ff9600" stroke="#fff" stroke-width="2.4"/></g>
      <g class="ta ta-d3"><circle cx="45" cy="40" r="6.6" fill="#58cc02" stroke="#fff" stroke-width="2.4"/></g>
      <g class="ta ta-mark"><path d="M29 31L21 19.5h16Z" fill="#8e5cf7" stroke="#8e5cf7" stroke-width="2.6" stroke-linejoin="round"/></g>`,

    // 📜 simple past (written): a scroll and a quill
    praet: () => `
      <g class="ta ta-paper">
        <rect x="14" y="12" width="32" height="38" fill="#fbe9b7"/>
        <path d="M19 21h22M19 27h22M19 33h16" stroke="#d6b25a" stroke-width="2.3" stroke-linecap="round"/>
        <path class="ta ta-ink" d="M19 39h20" stroke="#d6b25a" stroke-width="2.3" stroke-linecap="round" stroke-dasharray="20 24"/>
      </g>
      <rect x="10" y="7" width="40" height="8.5" rx="4.25" fill="#e8c66a"/>
      <path d="M14 11.25h32" stroke="#d1a944" stroke-width="1.6" stroke-linecap="round"/>
      <g class="ta ta-roll"><rect x="10" y="46" width="40" height="8.5" rx="4.25" fill="#e8c66a"/><path d="M14 50.25h32" stroke="#d1a944" stroke-width="1.6" stroke-linecap="round"/></g>
      <g class="ta ta-quill">
        <path d="M44.5 40C47 30 52 20 60 8C56.5 20 52.5 30 46.2 40.6Z" fill="#fff" stroke="#c9a227" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M45.2 40L58.8 9.5" stroke="#c9a227" stroke-width="1.6" stroke-linecap="round"/>
        <path d="M44.2 39.6l-1.6 4 3.2-1.8z" fill="#4b4b4b" stroke="#4b4b4b" stroke-width="1" stroke-linejoin="round"/>
      </g>`,

    // 🪞 reflexive verbs: a hand mirror, its shine and an arrow that comes back (sich)
    reflexive: () => `
      <g class="ta ta-mirror">
        <rect x="28.5" y="48" width="7" height="13" rx="3.5" fill="#00a08a"/>
        <ellipse cx="32" cy="28" rx="18" ry="22" fill="#00c2a8"/>
        <ellipse cx="32" cy="28" rx="13.5" ry="17.5" fill="#d4f6ff"/>
        <g class="ta ta-loop">
          <path d="M37.5 34V22.5a5.5 5.5 0 0 0-11 0V33" fill="none" stroke="#00a08a" stroke-width="3.4" stroke-linecap="round"/>
          <path d="M22.6 29.6L26.5 34.6l3.9-5" fill="none" stroke="#00a08a" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>
        </g>
        <g class="ta ta-shine"><path d="M23.5 39L32 16.5h4L27.5 39Z" fill="#fff" fill-opacity="0.8"/></g>
      </g>
      <g class="ta ta-spark"><path d="${sparkle(52, 9, 5)}" fill="#ffc800"/></g>`,

    // 💬 talking about the past: two speech bubbles taking turns
    pastq: () => `
      <g class="ta ta-qa">
        <rect x="5" y="7" width="34" height="24" rx="10" fill="#3fa7ff"/>
        <path d="M12 28l-3 10 11-7.5z" fill="#3fa7ff" stroke="#3fa7ff" stroke-width="1.6" stroke-linejoin="round"/>
        <circle cx="22" cy="19" r="7" fill="#fff"/>
        <path d="M22 15v4.4l3 1.8" fill="none" stroke="#3fa7ff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
      </g>
      <g class="ta ta-qb">
        <rect x="25" y="29" width="34" height="24" rx="10" fill="#ffc800"/>
        <path d="M52 50l3 10-11-7.5z" fill="#ffc800" stroke="#ffc800" stroke-width="1.6" stroke-linejoin="round"/>
        <g class="ta ta-dot1"><circle cx="34" cy="41" r="2.8" fill="#7a5a00"/></g>
        <g class="ta ta-dot2"><circle cx="42" cy="41" r="2.8" fill="#7a5a00"/></g>
        <g class="ta ta-dot3"><circle cx="50" cy="41" r="2.8" fill="#7a5a00"/></g>
      </g>`,

    // 📚 vocabulary: a stack of books and an Ä block
    vocab: () => `
      <g class="ta ta-b1"><rect x="8" y="48" width="46" height="9.5" rx="2.6" fill="#4cb944"/><rect x="8" y="48" width="7" height="9.5" rx="2.6" fill="#3a9a33"/><rect x="45" y="50.2" width="7" height="5.2" rx="1" fill="#fff"/></g>
      <g class="ta ta-b2"><rect x="12" y="38.5" width="41" height="9.5" rx="2.6" fill="#1cb0f6"/><rect x="46" y="38.5" width="7" height="9.5" rx="2.6" fill="#1899d6"/><rect x="14" y="40.7" width="7" height="5.2" rx="1" fill="#fff"/></g>
      <g class="ta ta-b3"><rect x="6" y="29" width="42" height="9.5" rx="2.6" fill="#ff9600"/><rect x="6" y="29" width="7" height="9.5" rx="2.6" fill="#e07f00"/><rect x="39" y="31.2" width="7" height="5.2" rx="1" fill="#fff"/></g>
      <g class="ta ta-block"><rect x="31" y="9" width="19" height="19" rx="4.5" fill="#a560e8"/><text x="40.5" y="24.6" text-anchor="middle" font-family="${FONT}" font-size="15" font-weight="900" fill="#fff">Ä</text></g>`,
  };

  // anything else: a card with a twinkling star
  const FALLBACK = () => `
      <rect x="13" y="9" width="38" height="46" rx="8" fill="#1cb0f6"/>
      <rect x="13" y="47" width="38" height="8" rx="4" fill="#1899d6"/>
      <g class="ta ta-star"><path d="${star(32, 29, 11, 4.8)}" fill="#fff" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/></g>`;

  // the markup never changes, so build each picture once
  const cache = Object.create(null);

  function topic(id) {
    const known = !!ART[id];
    const key = known ? id : 'other';
    if (!cache[key]) cache[key] = (known ? ART[id] : FALLBACK)().replace(/\n\s*/g, '');
    const cls = 't-art t-art-' + String(id || 'other').replace(/[^\w-]/g, '') + (known ? '' : ' t-art-other');
    return `<svg class="${cls}" viewBox="0 0 64 64" aria-hidden="true" focusable="false">${cache[key]}</svg>`;
  }

  /** Play the one-shot animation of the pictures inside el (again, if it is still running). */
  function burst(el) {
    if (!el) return;
    el.classList.remove('art-burst');
    void el.offsetWidth; // restart the animations
    el.classList.add('art-burst');
    clearTimeout(el._artT);
    el._artT = setTimeout(() => el.classList.remove('art-burst'), 1100);
  }

  B.art = {
    topic,
    color: (id) => COLORS[id] || '#1cb0f6',
    burst,
    ids: Object.keys(ART),
  };
})();
