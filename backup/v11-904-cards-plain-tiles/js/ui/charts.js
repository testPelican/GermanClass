/*
 * Small dependency-free charts for the review screen.
 *   card({title, sub, legend, body, table})  – chart frame with legend + "Table" toggle
 *   stacked(rows, series)                    – horizontal stacked bars (HTML)
 *   bars(rows)                               – single-series horizontal bars (HTML)
 *   line(points)                             – line chart with crosshair (SVG)
 *   meter(value)                             – one-value progress meter
 * Colours come from CSS variables (--s1, --s2, --track, --grid) so dark mode
 * gets its own validated steps. Every mark has a hover/focus tooltip.
 */
(function () {
  'use strict';
  const B = window.Brezel;
  const { h, pct } = B.util;
  const SVG = 'http://www.w3.org/2000/svg';

  // --- tooltip -------------------------------------------------------------
  let tipEl = null;
  function tipNode() {
    if (!tipEl) {
      tipEl = h('div', { class: 'chart-tip', role: 'tooltip' });
      document.body.append(tipEl);
    }
    return tipEl;
  }

  function showTip(lines, x, y) {
    const t = tipNode();
    t.replaceChildren(...lines.filter(Boolean).map((l, i) => h('div', { class: i === 0 ? 'tip-title' : 'tip-line' }, l)));
    t.classList.add('show');
    const r = t.getBoundingClientRect();
    const left = Math.max(8, Math.min(window.innerWidth - r.width - 8, x - r.width / 2));
    let top = y - r.height - 10;
    if (top < 8) top = y + 24;
    t.style.left = left + 'px';
    t.style.top = top + 'px';
  }

  function hideTip() {
    if (tipEl) tipEl.classList.remove('show');
  }
  window.addEventListener('scroll', hideTip, { passive: true, capture: true });
  window.addEventListener('pointerdown', (e) => {
    if (!e.target.closest || !e.target.closest('[data-tip]')) hideTip();
  });

  /** Attach a tooltip to an element (mouse hover, touch tap, keyboard focus). */
  function hover(el, lines) {
    el.dataset.tip = '1';
    const at = (e) => {
      const r = el.getBoundingClientRect();
      const x = e && e.clientX != null ? e.clientX : r.left + r.width / 2;
      showTip(typeof lines === 'function' ? lines() : lines, x, r.top);
    };
    el.addEventListener('pointerenter', at);
    el.addEventListener('pointermove', (e) => e.pointerType === 'mouse' && at(e));
    el.addEventListener('pointerdown', at);
    el.addEventListener('pointerleave', (e) => e.pointerType === 'mouse' && hideTip());
    el.addEventListener('focus', () => at());
    el.addEventListener('blur', hideTip);
  }

  // --- frame -----------------------------------------------------------------
  function legendRow(items) {
    return h('ul', { class: 'legend' }, items.map((it) => h('li', {}, h('span', { class: 'sw ' + it.cls, 'aria-hidden': 'true' }), it.label)));
  }

  function dataTable({ head, rows }) {
    const numeric = (v) => typeof v === 'number' || /^[\d.,%/ —–-]+$/.test(String(v));
    return h('div', { class: 'table-scroll' },
      h('table', { class: 'data-table' },
        h('thead', {}, h('tr', {}, head.map((x, i) => h('th', { scope: 'col', class: i ? 'num' : null }, x)))),
        h('tbody', {}, rows.map((r) => h('tr', {}, r.map((v, i) => (i ? h('td', { class: numeric(v) ? 'num' : null }, String(v)) : h('th', { scope: 'row' }, String(v)))))))));
  }

  function card({ title, sub, legend, body, table, extra }) {
    const legendEl = legend && legend.length > 1 ? legendRow(legend) : null;
    const tableEl = table ? dataTable(table) : null;
    let toggle = null;
    if (tableEl) {
      tableEl.hidden = true;
      toggle = h('button', { class: 'chart-toggle', type: 'button', 'aria-pressed': 'false' }, 'Table');
      toggle.addEventListener('click', () => {
        const on = toggle.getAttribute('aria-pressed') !== 'true';
        toggle.setAttribute('aria-pressed', String(on));
        toggle.textContent = on ? 'Chart' : 'Table';
        tableEl.hidden = !on;
        body.hidden = on;
        if (legendEl) legendEl.hidden = on;
        hideTip();
      });
    }
    return h('section', { class: 'chart-card card' },
      h('div', { class: 'chart-head' },
        h('div', {}, h('h3', { class: 'chart-title' }, title), sub ? h('p', { class: 'chart-sub' }, sub) : null),
        toggle),
      legendEl, body, tableEl, extra || null);
  }

  // --- stacked horizontal bars ------------------------------------------------
  /**
   * rows:   [{label, icon?, total, parts: [n, n], value: '24/38', badge?: Element}]
   * series: [{label, cls}] — one per part; the rest of the bar is the grey track.
   */
  function stacked(rows, series, { restLabel = 'Not mastered yet', unit = 'cards' } = {}) {
    const wrap = h('div', { class: 'hbars' });
    for (const r of rows) {
      const track = h('div', { class: 'hbar-track' });
      const used = r.parts.reduce((a, b) => a + b, 0);
      r.parts.forEach((n, i) => {
        if (!n) return;
        const seg = h('div', { class: 'hbar-seg ' + series[i].cls, style: { width: (n / r.total) * 100 + '%' } });
        hover(seg, [r.label, `${series[i].label}: ${n} of ${r.total} ${unit} (${pct(n, r.total)}%)`]);
        track.append(seg);
      });
      const rest = r.total - used;
      if (rest > 0) {
        const seg = h('div', { class: 'hbar-seg hbar-rest' });
        hover(seg, [r.label, `${restLabel}: ${rest} of ${r.total} ${unit}`]);
        track.append(seg);
      }
      const aria = `${r.label}: ` + series.map((s, i) => `${s.label} ${r.parts[i]}`).join(', ') + `, ${restLabel.toLowerCase()} ${rest}, of ${r.total}` + (r.badgeText ? `. ${r.badgeText}` : '');
      wrap.append(
        h('div', { class: 'hbar-row', role: 'group', 'aria-label': aria },
          h('div', { class: 'hbar-label' },
            r.icon ? h('span', { class: 'hbar-icon', 'aria-hidden': 'true' }, r.icon) : null,
            h('span', { class: 'hbar-name', title: r.label }, r.label)),
          r.badge ? h('div', { class: 'hbar-badge' }, r.badge) : h('div', { class: 'hbar-badge' }),
          h('div', { class: 'hbar-main' }, track, h('span', { class: 'hbar-value' }, r.value)))
      );
    }
    return wrap;
  }

  // --- single-series bars ------------------------------------------------------
  /** rows: [{label, value (0–100 or null), text: '82%', tip: [lines]}] */
  function bars(rows) {
    const wrap = h('div', { class: 'hbars hbars-single' });
    for (const r of rows) {
      const track = h('div', { class: 'hbar-track' });
      if (r.value) track.append(h('div', { class: 'hbar-seg s1', style: { width: r.value + '%' } }));
      if (r.value < 100) track.append(h('div', { class: 'hbar-seg hbar-rest' }));
      const row = h('div', { class: 'hbar-row', tabindex: '0', 'aria-label': `${r.label}: ${r.text}` },
        h('div', { class: 'hbar-label' }, h('span', { class: 'hbar-name', title: r.label }, r.label)),
        h('div', { class: 'hbar-badge' }),
        h('div', { class: 'hbar-main' }, track, h('span', { class: 'hbar-value' }, r.text)));
      hover(row, r.tip || [r.label, r.text]);
      wrap.append(row);
    }
    return wrap;
  }

  // --- line chart -------------------------------------------------------------
  const svg = (tag, attrs) => {
    const el = document.createElementNS(SVG, tag);
    for (const [k, v] of Object.entries(attrs || {})) el.setAttribute(k, v);
    return el;
  };

  /**
   * points: [{x: 'label under the axis', y: 0–100, tip: [lines]}]
   * Re-draws itself when its container is resized.
   */
  function line(points, { yMax = 100, yFmt = (v) => v + '%', height = 210, ariaLabel = 'Line chart' } = {}) {
    const box = h('div', { class: 'line-chart', tabindex: '0', role: 'img', 'aria-label': ariaLabel });
    let active = -1;
    let geom = null;

    function draw() {
      const W = Math.max(260, Math.round(box.clientWidth || 600));
      const H = height;
      const m = { l: 40, r: 14, t: 14, b: 30 };
      const iw = W - m.l - m.r;
      const ih = H - m.t - m.b;
      const n = points.length;
      const xAt = (i) => m.l + (n === 1 ? iw / 2 : (i / (n - 1)) * iw);
      const yAt = (v) => m.t + ih - (v / yMax) * ih;
      geom = { xAt, yAt, m, W, H };

      const root = svg('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, 'aria-hidden': 'true' });
      for (const v of [0, 25, 50, 75, 100]) {
        root.append(svg('line', { class: 'grid', x1: m.l, x2: W - m.r, y1: yAt(v), y2: yAt(v) }));
        const t = svg('text', { class: 'axis', x: m.l - 8, y: yAt(v) + 4, 'text-anchor': 'end' });
        t.textContent = yFmt(v);
        root.append(t);
      }
      // x labels: first, last and a few in between
      const every = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(iw / 56))));
      points.forEach((p, i) => {
        if (i % every && i !== n - 1) return;
        if (i !== n - 1 && n - 1 - i < every / 2 && i !== 0) return;
        const t = svg('text', { class: 'axis', x: xAt(i), y: H - 8, 'text-anchor': 'middle' });
        t.textContent = p.x;
        root.append(t);
      });
      const cross = svg('line', { class: 'crosshair', x1: 0, x2: 0, y1: m.t, y2: m.t + ih, visibility: 'hidden' });
      root.append(cross);
      if (n > 1) {
        const d = points.map((p, i) => `${i ? 'L' : 'M'}${xAt(i).toFixed(1)},${yAt(p.y).toFixed(1)}`).join(' ');
        root.append(svg('path', { class: 'series s1-stroke', d }));
      }
      const dots = points.map((p, i) => {
        const c = svg('circle', { class: 'dot s1-fill' + (p.hollow ? ' hollow' : ''), cx: xAt(i), cy: yAt(p.y), r: n > 24 ? 3 : 4 });
        root.append(c);
        return c;
      });
      geom.cross = cross;
      geom.dots = dots;
      box.replaceChildren(root);
      if (active >= 0) focusPoint(active, false);
    }

    function focusPoint(i, showTooltip = true) {
      if (!geom || !points.length) return;
      active = Math.max(0, Math.min(points.length - 1, i));
      const x = geom.xAt(active);
      geom.cross.setAttribute('x1', x);
      geom.cross.setAttribute('x2', x);
      geom.cross.setAttribute('visibility', 'visible');
      geom.dots.forEach((d, j) => d.classList.toggle('on', j === active));
      if (showTooltip) {
        const r = box.getBoundingClientRect();
        showTip(points[active].tip, r.left + x, r.top + geom.yAt(points[active].y));
      }
    }

    function clear() {
      if (!geom) return;
      geom.cross.setAttribute('visibility', 'hidden');
      geom.dots.forEach((d) => d.classList.remove('on'));
      active = -1;
      hideTip();
    }

    function nearest(clientX) {
      const r = box.getBoundingClientRect();
      const x = clientX - r.left;
      let best = 0;
      points.forEach((_, i) => {
        if (Math.abs(geom.xAt(i) - x) < Math.abs(geom.xAt(best) - x)) best = i;
      });
      return best;
    }

    box.dataset.tip = '1';
    box.addEventListener('pointermove', (e) => focusPoint(nearest(e.clientX)));
    box.addEventListener('pointerdown', (e) => focusPoint(nearest(e.clientX)));
    box.addEventListener('pointerleave', (e) => e.pointerType === 'mouse' && clear());
    box.addEventListener('focus', () => focusPoint(active >= 0 ? active : points.length - 1));
    box.addEventListener('blur', clear);
    box.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        focusPoint((active < 0 ? points.length - 1 : active) + (e.key === 'ArrowLeft' ? -1 : 1));
      }
    });

    if (typeof ResizeObserver === 'function') {
      let lastW = 0;
      new ResizeObserver(() => {
        const w = Math.round(box.clientWidth);
        if (w && w !== lastW) {
          lastW = w;
          draw();
        }
      }).observe(box);
    }
    requestAnimationFrame(draw);
    return box;
  }

  // --- meter -------------------------------------------------------------------
  function meter(value, label) {
    return h('div', { class: 'meter', role: 'meter', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(value), 'aria-label': label },
      h('div', { class: 'meter-fill s1', style: { width: value + '%' } }));
  }

  B.charts = { card, stacked, bars, line, meter, hover, hideTip, legendRow };
})();
