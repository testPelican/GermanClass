/*
 * App shell: start-up, screen routing, theme, toasts, dialogs and confetti.
 * Screens live in js/ui/*.js as Brezel.ui.<name>(root, params) and may return
 * { destroy(), onKey(e), onBack() }.
 */
(function () {
  'use strict';
  const B = window.Brezel;
  const { h, pick, randInt, reducedMotion } = B.util;

  const appEl = document.getElementById('app');
  let current = null;
  let skipPop = false;
  let modalOpen = false;

  // --- routing ----------------------------------------------------------------
  function render(name, params) {
    if (B.charts) B.charts.hideTip();
    if (current && current.destroy) current.destroy();
    appEl.replaceChildren();
    window.scrollTo(0, 0);
    const el = h('div', { class: 'screen screen-' + name });
    appEl.append(el);
    current = Object.assign({ name }, B.ui[name](el, params || {}) || {});
  }

  /** Show a screen. Non-home screens get one history entry, so the phone's back button returns home. */
  function go(name, params) {
    const depth = (history.state && history.state.depth) || 0;
    if (name === 'home' && depth > 0) {
      skipPop = true;
      history.back();
    } else if (name !== 'home') {
      if (depth > 0) history.replaceState({ depth: 1 }, '');
      else history.pushState({ depth: 1 }, '');
    }
    render(name, params);
  }

  window.addEventListener('popstate', () => {
    if (skipPop) {
      skipPop = false;
      return;
    }
    if (current && current.onBack) {
      // stay on the page and let the screen decide (the session asks before quitting)
      history.pushState({ depth: 1 }, '');
      current.onBack();
      return;
    }
    if (current && current.name !== 'home') render('home');
  });

  document.addEventListener('keydown', (e) => {
    if (modalOpen) return;
    if (current && current.onKey) current.onKey(e);
  });

  // --- theme ------------------------------------------------------------------
  const darkQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

  function applyTheme() {
    const pref = B.store.setting('theme');
    const dark = pref === 'dark' || (pref !== 'light' && darkQuery && darkQuery.matches);
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', dark ? '#131f24' : '#ffffff');
  }

  function toggleTheme() {
    const dark = document.documentElement.dataset.theme === 'dark';
    B.store.setting('theme', dark ? 'light' : 'dark');
    applyTheme();
  }

  const isDark = () => document.documentElement.dataset.theme === 'dark';

  // --- toast ------------------------------------------------------------------
  function toast(text, { kind = '', ms = 2600 } = {}) {
    const layer = document.getElementById('toast-layer');
    const el = h('div', { class: 'toast ' + kind, role: 'status' }, text);
    layer.append(el);
    setTimeout(() => {
      el.classList.add('out');
      setTimeout(() => el.remove(), 300);
    }, ms);
  }

  // --- confirm dialog -----------------------------------------------------------
  let dialogSeq = 0;
  function confirm({ title, text, ok = 'OK', cancel = 'Cancel', danger = false }) {
    return new Promise((resolve) => {
      const prev = document.activeElement;
      const id = 'dlg-' + ++dialogSeq;
      const okBtn = h('button', { type: 'button', class: 'btn ' + (danger ? 'btn-danger' : 'btn-primary') }, ok);
      const cancelBtn = h('button', { type: 'button', class: 'btn btn-outline' }, cancel);
      const box = h('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': id },
        h('div', { class: 'modal-mascot', 'aria-hidden': 'true' }, danger ? '😮' : '🥨'),
        h('h2', { id, class: 'modal-title' }, title),
        text ? h('p', { class: 'modal-text' }, text) : null,
        h('div', { class: 'modal-actions' }, cancelBtn, okBtn));
      const overlay = h('div', { class: 'modal-backdrop' }, box);

      function close(value) {
        modalOpen = false;
        document.removeEventListener('keydown', onKey, true);
        overlay.classList.add('out');
        setTimeout(() => overlay.remove(), 200);
        if (prev && prev.focus && prev.isConnected) prev.focus({ preventScroll: true });
        resolve(value);
      }
      function onKey(e) {
        if (e.key === 'Escape') {
          e.preventDefault();
          close(false);
        } else if (e.key === 'Tab') {
          e.preventDefault();
          (document.activeElement === okBtn ? cancelBtn : okBtn).focus();
        }
      }
      okBtn.addEventListener('click', () => close(true));
      cancelBtn.addEventListener('click', () => close(false));
      overlay.addEventListener('click', (e) => e.target === overlay && close(false));
      document.addEventListener('keydown', onKey, true);
      modalOpen = true;
      document.body.append(overlay);
      (danger ? cancelBtn : okBtn).focus({ preventScroll: true });
    });
  }

  // --- confetti -------------------------------------------------------------------
  function confetti(count = 110) {
    if (reducedMotion() || typeof Element.prototype.animate !== 'function') return;
    const colors = ['#58cc02', '#1cb0f6', '#ff9600', '#ff4b4b', '#ce82ff', '#ffc800'];
    const layer = h('div', { class: 'confetti', 'aria-hidden': 'true' });
    document.body.append(layer);
    const vh = window.innerHeight;
    for (let i = 0; i < count; i++) {
      const w = randInt(6, 11);
      const p = h('i', { style: { background: pick(colors), left: Math.random() * 100 + '%', width: w + 'px', height: Math.round(w * 1.5) + 'px', borderRadius: Math.random() < 0.3 ? '50%' : '2px' } });
      layer.append(p);
      const dx = (Math.random() - 0.5) * 260;
      p.animate(
        [
          { transform: 'translate3d(0, -20px, 0) rotate(0deg)', opacity: 1 },
          { transform: `translate3d(${dx}px, ${vh + 40}px, 0) rotate(${randInt(-900, 900)}deg)`, opacity: 0.9 },
        ],
        { duration: randInt(1900, 3300), delay: Math.random() * 600, easing: 'cubic-bezier(.25,.6,.45,1)', fill: 'forwards' }
      );
    }
    setTimeout(() => layer.remove(), 4400);
  }

  // --- start-up -----------------------------------------------------------------------
  B.app = {
    go,
    toast,
    confirm,
    confetti,
    applyTheme,
    toggleTheme,
    isDark,
    get screen() { return current && current.name; },
  };

  B.store.load();
  B.deck.finalize();
  applyTheme();
  if (darkQuery && darkQuery.addEventListener) darkQuery.addEventListener('change', applyTheme);
  history.replaceState({ depth: 0 }, '');
  render('home');
  if (!B.store.storageOk) toast('⚠️ This browser is blocking storage — progress won’t be saved.', { kind: 'warn', ms: 6000 });
})();
