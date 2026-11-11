/*
 * Achievements on screen (definitions and unlocking: js/core/achievements.js).
 *   Brezel.ui.achievementsSection()      the home-page block: "Achievements x / N" and a grid of badges.
 *                                        Locked badges are grey with a lock (and a progress bar where there is one);
 *                                        earned ones are in colour with the date. Tap a badge for its details.
 *   Brezel.ui.celebrateAchievements(list) the "Achievement unlocked!" pop-up (one after another), with sound and confetti.
 *                                        Called by Brezel.achievements.evaluate().
 */
(function () {
  'use strict';
  const B = window.Brezel;
  const { h, pct } = B.util;

  B.ui = B.ui || {};

  const LOCK =
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="5" y="10.5" width="14" height="10" rx="2.5" fill="currentColor"/>' +
    '<path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" fill="none" stroke="currentColor" stroke-width="2.4"/></svg>';

  const longDate = (t) => new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const shortDate = (t) => new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

  /** [current, goal] of a definition, clamped; null if it has no progress. */
  function progressOf(def, snap) {
    if (!def.progress || !snap) return null;
    try {
      const [cur, goal] = def.progress(snap);
      const g = Math.max(1, Number(goal) || 1);
      return { cur: Math.max(0, Math.min(Number(cur) || 0, g)), goal: g };
    } catch (e) {
      return null;
    }
  }

  function art(def, { big = false, locked = false } = {}) {
    const el = h('span', { class: 'ach-art' + (big ? ' big' : ''), html: def.icon || '' });
    if (locked) el.append(h('span', { class: 'ach-lock', html: LOCK }));
    return el;
  }

  function bar(p, cls) {
    return h('span', { class: cls || 'ach-bar', 'aria-hidden': 'true' }, h('span', { style: { width: pct(p.cur, p.goal) + '%' } }));
  }

  function setColor(el, def) {
    el.style.setProperty('--ach', def.color || '#1cb0f6');
    return el;
  }

  // --- details dialog ----------------------------------------------------------------------------
  function openDetails(def) {
    const at = B.achievements.unlockedAt(def.id);
    const p = at ? null : progressOf(def, B.achievements.snapshot());
    B.app.sheet((close) => {
      const ok = h('button', { type: 'button', class: 'btn btn-primary btn-big', 'data-autofocus': '', onClick: () => close() }, at ? 'Toll!' : 'Got it');
      return setColor(h('div', { class: 'modal ach-modal ' + (at ? 'is-unlocked' : 'is-locked'), role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'ach-dlg-title' },
        h('div', { class: 'ach-hero' }, at ? h('span', { class: 'ach-rays', 'aria-hidden': 'true' }) : null, art(def, { big: true, locked: !at })),
        h('h2', { class: 'modal-title', id: 'ach-dlg-title', lang: 'de' }, def.name),
        h('p', { class: 'ach-en' }, def.en),
        h('p', { class: 'ach-desc' }, h('b', {}, at ? 'You did it: ' : 'How to earn it: '), def.desc),
        p && p.goal > 1
          ? h('div', { class: 'ach-progress' }, bar(p, 'ach-bar big'), h('span', { class: 'ach-progress-num' }, `${p.cur} / ${p.goal}`))
          : null,
        h('p', { class: 'ach-when' }, at ? `🏅 Earned on ${longDate(at)}` : 'Not earned yet. Keep going!'),
        ok), def);
    });
  }

  // --- home section ------------------------------------------------------------------------------
  B.ui.achievementsSection = function () {
    const A = B.achievements;
    if (!A) return null;
    const snap = A.snapshot();
    const { unlocked, total } = A.count();
    const grid = h('div', { class: 'ach-grid' });
    A.list.forEach((def, i) => {
      const at = A.unlockedAt(def.id);
      const p = at ? null : progressOf(def, snap);
      const label = at
        ? `${def.name} (${def.en}): earned on ${longDate(at)}`
        : `${def.name} (${def.en}): locked. ${def.desc}${p && p.goal > 1 ? ` Progress ${p.cur} of ${p.goal}.` : ''}`;
      const btn = h('button', { type: 'button', class: 'ach-badge ' + (at ? 'is-unlocked' : 'is-locked'), 'aria-label': label, onClick: () => openDetails(def) },
        art(def, { locked: !at }),
        h('span', { class: 'ach-name', lang: 'de' }, def.name),
        at
          ? h('span', { class: 'ach-meta' }, shortDate(at))
          : p && p.goal > 1 && p.cur > 0
            ? bar(p)
            : h('span', { class: 'ach-meta' }, 'Locked'));
      btn.style.setProperty('--i', String(i));
      grid.append(setColor(btn, def));
    });

    return h('section', { class: 'card ach-section', 'aria-labelledby': 'ach-title' },
      h('div', { class: 'ach-head' },
        h('h2', { class: 'section-title', id: 'ach-title' }, h('span', { 'aria-hidden': 'true' }, '🏅 '), 'Achievements'),
        h('span', { class: 'ach-count', 'aria-label': `${unlocked} of ${total} earned` }, h('b', {}, String(unlocked)), ` / ${total}`)),
      h('div', { class: 'ach-total', 'aria-hidden': 'true' }, h('span', { style: { width: pct(unlocked, total) + '%' } })),
      h('p', { class: 'muted small ach-help' }, 'Earn badges by learning and playing. Tap one to see how to get it.'),
      grid);
  };

  // --- "Achievement unlocked!" ----------------------------------------------------------------------
  const queue = [];
  let showing = false;
  let layer = null;

  B.ui.celebrateAchievements = function (list) {
    if (!list || !list.length || typeof document === 'undefined') return;
    queue.push(...list);
    B.audio.play('combo');
    if (B.app && B.app.confetti) setTimeout(() => B.app.confetti(Math.min(150, 60 + list.length * 25)), 120);
    if (!showing) next();
  };

  function next() {
    const def = queue.shift();
    if (!def) {
      showing = false;
      return;
    }
    showing = true;
    if (!layer || !layer.isConnected) {
      layer = h('div', { class: 'ach-pop-layer', role: 'status', 'aria-live': 'polite' });
      document.body.append(layer);
    }
    let timer = 0;
    let gone = false;
    const dismiss = () => {
      if (gone) return;
      gone = true;
      clearTimeout(timer);
      el.classList.add('out');
      setTimeout(() => {
        el.remove();
        next();
      }, 260);
    };
    const el = setColor(h('div', { class: 'ach-pop', onClick: dismiss },
      art(def),
      h('div', { class: 'ach-pop-text' },
        h('span', { class: 'ach-pop-kicker' }, 'Achievement unlocked!'),
        h('b', { class: 'ach-pop-name', lang: 'de' }, def.name),
        h('span', { class: 'ach-pop-en' }, def.en))), def);
    layer.append(el);
    timer = setTimeout(dismiss, queue.length ? 2600 : 3600);
  }
})();
