/* Shared helpers: DOM building, text normalisation, shuffling, animation. */
(function () {
  'use strict';
  const B = (window.Brezel = window.Brezel || {});

  const reducedMotion = () =>
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /** Tiny hyperscript: h('div', {class: 'x', onClick: fn}, child, 'text') */
  function h(tag, props, ...kids) {
    const el = document.createElement(tag);
    if (props) {
      for (const [k, v] of Object.entries(props)) {
        if (v == null || v === false) continue;
        if (k === 'class') el.className = v;
        else if (k === 'html') el.innerHTML = v;
        else if (k === 'text') el.textContent = v;
        else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
        else if (k === 'dataset') Object.assign(el.dataset, v);
        else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
        else el.setAttribute(k, v === true ? '' : v);
      }
    }
    for (const kid of kids.flat(Infinity)) {
      if (kid == null || kid === false) continue;
      el.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
    }
    return el;
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /** Escapes, then supports **bold** and *italic* — used for explanations. */
  function md(s) {
    return esc(s)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>');
  }

  /** Words joined with "_" form one tile ("St._Pölten"); show them with a space. */
  const show = (s) => String(s == null ? '' : s).replace(/_/g, ' ');

  /**
   * Normalise text for comparison: case-insensitive, punctuation-insensitive,
   * umlauts written as ae/oe/ue and ß as ss (so English keyboards work too).
   */
  function norm(s) {
    return String(s == null ? '' : s)
      .normalize('NFC')
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/[„“”"'’‚‘«»]/g, '')
      .replace(/[.,!?;:…]/g, ' ')
      .replace(/ä/g, 'ae')
      .replace(/ö/g, 'oe')
      .replace(/ü/g, 'ue')
      .replace(/ß/g, 'ss')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function levenshtein(a, b) {
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;
    let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
      const cur = [i];
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      }
      prev = cur;
    }
    return prev[b.length];
  }

  function shuffle(list) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /** Shuffle, but avoid returning the original order when possible. */
  function shuffleAway(list, same = (x, y) => x === y) {
    if (list.length < 2) return list.slice();
    let out = shuffle(list);
    for (let tries = 0; tries < 12 && out.every((x, i) => same(x, list[i])); tries++) out = shuffle(list);
    return out;
  }

  const randInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
  const pick = (list) => list[Math.floor(Math.random() * list.length)];

  /**
   * FLIP animation: measure nodes, run a DOM mutation, then animate every node
   * from its old position to its new one.
   */
  function flip(nodes, mutate, { duration = 280, easing = 'cubic-bezier(.2,.8,.2,1)' } = {}) {
    const els = Array.from(nodes).filter(Boolean);
    const first = new Map(els.map((n) => [n, n.getBoundingClientRect()]));
    mutate();
    if (reducedMotion() || typeof Element.prototype.animate !== 'function') return;
    for (const n of els) {
      if (!n.isConnected) continue;
      const a = first.get(n);
      const b = n.getBoundingClientRect();
      const dx = a.left - b.left;
      const dy = a.top - b.top;
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) continue;
      n.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'translate(0, 0)' }], {
        duration,
        easing,
      });
    }
  }

  /** Re-trigger a CSS animation class. */
  function pulse(el, cls) {
    if (!el) return;
    el.classList.remove(cls);
    void el.offsetWidth; // force reflow so the animation restarts
    el.classList.add(cls);
    el.addEventListener('animationend', () => el.classList.remove(cls), { once: true });
  }

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  function fmtDuration(ms) {
    const s = Math.round((ms || 0) / 1000);
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ${String(s % 60).padStart(2, '0')}s`;
    return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`;
  }

  const pct = (num, den) => (den ? Math.round((num / den) * 100) : 0);

  function dayKey(d = new Date()) {
    const x = d instanceof Date ? d : new Date(d);
    return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
  }

  /** Split "Wohnt Julia in Salzburg?" into words + final punctuation. */
  function splitSentence(s) {
    const m = String(s).trim().match(/^(.*?)([.?!…]*)$/);
    return { words: m[1].split(/\s+/).filter(Boolean), punct: m[2] || '' };
  }

  B.util = {
    h, esc, md, show, norm, levenshtein, shuffle, shuffleAway, randInt, pick,
    flip, pulse, wait, fmtDuration, pct, dayKey, splitSentence, reducedMotion,
  };
})();
