/* Home screen: overall progress, session setup, topics with their grammar rules. */
(function () {
  'use strict';
  const B = window.Brezel;
  const { h, md, pct } = B.util;
  const SIZES = [10, 20, 50, 0]; // 0 = every remaining card

  B.ui = B.ui || {};

  function greeting() {
    const hr = new Date().getHours();
    if (hr < 11) return 'Guten Morgen!';
    if (hr < 18) return 'Guten Tag!';
    return 'Guten Abend!';
  }

  /** Progress ring (a meter for one value — the number is printed inside it). */
  function ring(done, total) {
    const r = 52;
    const C = 2 * Math.PI * r;
    const off = C * (1 - (total ? done / total : 0));
    const el = h('div', { class: 'ring', role: 'img', 'aria-label': `${done} of ${total} cards mastered` });
    el.innerHTML =
      `<svg viewBox="0 0 128 128" aria-hidden="true"><circle class="ring-track" cx="64" cy="64" r="${r}"/>` +
      `<circle class="ring-fill" cx="64" cy="64" r="${r}" stroke-dasharray="${C.toFixed(2)}" stroke-dashoffset="${C.toFixed(2)}"/></svg>` +
      `<div class="ring-text"><b>${done}</b><span>/ ${total}</span></div>`;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const f = el.querySelector('.ring-fill');
      if (f) f.style.strokeDashoffset = off.toFixed(2);
    }));
    return el;
  }

  function statusBadge(s, extra) {
    if (!s || s.key === 'none') return null;
    return h('span', { class: 'badge badge-' + s.key }, h('span', { class: 'badge-icon', 'aria-hidden': 'true' }, s.icon), s.label + (extra ? ' · ' + extra : ''));
  }

  function currentStreak(st) {
    if (!st.last) return 0;
    const today = B.util.dayKey();
    const y = new Date();
    y.setDate(y.getDate() - 1);
    return st.last === today || st.last === B.util.dayKey(y) ? st.count : 0;
  }

  B.ui.statusBadge = statusBadge;

  B.ui.home = function (root) {
    const ov = B.stats.overview();
    const topics = B.stats.byTopic();
    let size = B.store.setting('size');
    if (!SIZES.includes(size)) size = 20;
    let topic = B.store.setting('topic');
    if (topic !== 'all' && !B.deck.topicMap[topic]) topic = 'all';

    // --- top bar -----------------------------------------------------------------
    const soundBtn = h('button', { class: 'icon-btn', type: 'button' });
    const paintSound = () => {
      const on = B.store.setting('sound');
      soundBtn.textContent = on ? '🔊' : '🔇';
      soundBtn.setAttribute('aria-label', on ? 'Sound on (tap to mute)' : 'Sound off (tap to unmute)');
      soundBtn.setAttribute('aria-pressed', String(!!on));
    };
    soundBtn.addEventListener('click', () => {
      B.store.setting('sound', !B.store.setting('sound'));
      paintSound();
      B.audio.play('tap');
    });
    paintSound();

    const themeBtn = h('button', { class: 'icon-btn', type: 'button' });
    const paintTheme = () => {
      const dark = B.app.isDark();
      themeBtn.textContent = dark ? '☀️' : '🌙';
      themeBtn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
    };
    themeBtn.addEventListener('click', () => {
      B.app.toggleTheme();
      paintTheme();
    });
    paintTheme();

    const streak = currentStreak(ov.streak);
    const top = h('header', { class: 'home-top' },
      h('div', { class: 'brand' }, h('span', { class: 'brand-logo', 'aria-hidden': 'true' }, '🥨'), h('span', { class: 'brand-name' }, 'Brezel')),
      h('div', { class: 'top-pills' },
        h('span', { class: 'pill pill-streak' + (streak ? '' : ' off'), title: 'Day streak' }, h('span', { 'aria-hidden': 'true' }, '🔥'), ' ', String(streak), h('span', { class: 'sr-only' }, ' day streak')),
        h('span', { class: 'pill pill-xp', title: 'Total XP' }, h('span', { 'aria-hidden': 'true' }, '⚡'), ' ', String(ov.xp), h('span', { class: 'sr-only' }, ' XP'))),
      h('div', { class: 'top-actions' }, soundBtn, themeBtn));

    // --- hero ---------------------------------------------------------------------
    const heroText = ov.complete
      ? h('div', { class: 'hero-text' },
        h('h1', {}, 'Alles fertig! 🎉'),
        h('p', {}, `You’ve mastered all ${ov.total} cards.`),
        h('p', { class: 'muted' }, 'Your detailed review is ready.'))
      : h('div', { class: 'hero-text' },
        h('h1', {}, greeting()),
        h('p', {}, ov.done ? `You’ve mastered ${ov.done} of ${ov.total} cards.` : `${ov.total} cards are waiting for you.`),
        h('p', { class: 'muted' },
          ov.done
            ? `${ov.total - ov.done} to go` + (ov.stillWrong ? ` · ${ov.stillWrong} need another try` : '')
            : 'Grammar first: word order, verbs, tenses, articles and more.'));
    const hero = h('section', { class: 'card hero' }, ring(ov.done, ov.total), heroText);

    // --- session setup --------------------------------------------------------------
    const startBtn = h('button', { class: 'btn btn-primary btn-big start-btn', type: 'button' });
    const startSub = h('p', { class: 'start-sub' });
    const sizeSeg = h('div', { class: 'seg', role: 'group', 'aria-label': 'Cards per session' });
    const sizeBtns = SIZES.map((n) => {
      const b = h('button', { type: 'button', class: 'seg-btn' }, n ? String(n) : 'All');
      b.addEventListener('click', () => {
        size = B.store.setting('size', n);
        B.audio.play('tap');
        paintSetup();
      });
      sizeSeg.append(b);
      return { n, b };
    });

    const chipRow = h('div', { class: 'topic-chips', role: 'group', 'aria-label': 'Topic' });
    const chipBtns = [{ id: 'all', icon: '✨', name: 'All topics' }].concat(B.deck.topics).map((t) => {
      const b = h('button', { type: 'button', class: 'topic-chip' }, h('span', { 'aria-hidden': 'true' }, t.icon), ' ', t.name);
      b.addEventListener('click', () => selectTopic(t.id));
      chipRow.append(b);
      return { id: t.id, b };
    });

    function selectTopic(id, scroll) {
      topic = B.store.setting('topic', id);
      B.audio.play('tap');
      paintSetup();
      const chip = chipBtns.find((c) => c.id === id);
      if (chip && chip.b.scrollIntoView) chip.b.scrollIntoView({ block: 'nearest', inline: 'center', behavior: B.util.reducedMotion() ? 'auto' : 'smooth' });
      if (scroll) setup.scrollIntoView({ block: 'start', behavior: B.util.reducedMotion() ? 'auto' : 'smooth' });
    }

    function paintSetup() {
      const pending = B.stats.pending(topic).length;
      const n = size ? Math.min(size, pending) : pending;
      sizeBtns.forEach(({ n: k, b }) => b.setAttribute('aria-pressed', String(k === size)));
      chipBtns.forEach(({ id, b }) => b.setAttribute('aria-pressed', String(id === topic)));
      topicCards.forEach(({ id, el }) => el.classList.toggle('is-selected', id === topic));
      const tName = topic === 'all' ? 'all topics' : B.deck.topicMap[topic].name;
      if (!pending) {
        startBtn.disabled = true;
        startBtn.textContent = 'Topic complete ✓';
        startSub.textContent = 'Every card here is mastered — pick another topic.';
      } else {
        startBtn.disabled = false;
        startBtn.textContent = 'Start';
        startSub.textContent = `${n} card${n === 1 ? '' : 's'} · ${tName} · ${pending} left to master`;
      }
    }

    startBtn.addEventListener('click', () => B.app.go('session', { topic, size }));

    const mistakes = ov.mistakes;
    const practiseBtn = h('button', { class: 'btn btn-outline', type: 'button', disabled: !mistakes },
      h('span', { 'aria-hidden': 'true' }, '🔁 '), `Practise mistakes${mistakes ? ` (${mistakes})` : ''}`);
    practiseBtn.addEventListener('click', () => B.app.go('session', { practice: true, size }));
    const reportBtn = h('button', { class: 'btn btn-outline', type: 'button' }, h('span', { 'aria-hidden': 'true' }, '📊 '), ov.complete ? 'Detailed review' : 'Progress report');
    reportBtn.addEventListener('click', () => B.app.go('review'));

    let setup;
    if (ov.complete) {
      const reviewBtn = h('button', { class: 'btn btn-primary btn-big', type: 'button' }, 'See my detailed review');
      reviewBtn.addEventListener('click', () => B.app.go('review'));
      const againBtn = h('button', { class: 'btn btn-outline', type: 'button' }, h('span', { 'aria-hidden': 'true' }, '↺ '), 'Start over');
      againBtn.addEventListener('click', resetAll);
      setup = h('section', { class: 'card setup' },
        h('h2', { class: 'section-title' }, 'What next?'),
        reviewBtn,
        h('div', { class: 'home-links' }, practiseBtn, againBtn));
    } else {
      setup = h('section', { class: 'card setup' },
        h('h2', { class: 'section-title' }, 'New session'),
        h('div', { class: 'field' }, h('span', { class: 'field-label' }, 'Cards'), sizeSeg),
        h('div', { class: 'field' }, h('span', { class: 'field-label' }, 'Topic'), chipRow),
        startBtn,
        startSub,
        h('div', { class: 'home-links' }, practiseBtn, reportBtn));
    }

    // --- topics ------------------------------------------------------------------------
    const topicCards = topics.map((t) => {
      const tipId = 'tip-' + t.topic.id;
      const tip = h('div', { class: 'topic-tip', id: tipId, hidden: true, html: md(t.topic.tip || '') });
      const ruleBtn = h('button', { class: 'link-btn rule-btn', type: 'button', 'aria-expanded': 'false', 'aria-controls': tipId }, h('span', { 'aria-hidden': 'true' }, '📖 '), 'Rule');
      ruleBtn.addEventListener('click', () => {
        const open = tip.hidden;
        tip.hidden = !open;
        ruleBtn.setAttribute('aria-expanded', String(open));
        if (open) B.util.pulse(tip, 'reveal');
      });
      const main = h('button', { class: 'topic-main', type: 'button', 'aria-label': `${t.topic.name}: ${t.done} of ${t.total} mastered. Select topic.` },
        h('span', { class: 'topic-icon', 'aria-hidden': 'true' }, t.topic.icon),
        h('span', { class: 'topic-text' }, h('b', {}, t.topic.name), h('small', {}, t.topic.de)),
        h('span', { class: 'topic-count' }, t.done === t.total ? '✓' : `${t.done}/${t.total}`));
      main.addEventListener('click', () => selectTopic(t.topic.id, true));
      const bar = h('div', { class: 'mini-bar', 'aria-hidden': 'true' }, h('span', { style: { width: pct(t.done, t.total) + '%' } }));
      const el = h('article', { class: 'topic-card' + (t.done === t.total ? ' is-complete' : '') },
        main, bar,
        h('div', { class: 'topic-foot' }, statusBadge(t.status, t.attempted >= B.stats.MIN_CARDS ? `${t.firstPct}% first try` : '') || h('span', { class: 'muted small' }, t.attempted ? `${t.attempted} tried` : 'Not started'), ruleBtn),
        tip);
      return { id: t.topic.id, el };
    });

    async function resetAll() {
      const ok = await B.app.confirm({
        title: 'Start over?',
        text: 'This deletes all your progress, XP and statistics. The cards stay the same.',
        ok: 'Delete progress',
        cancel: 'Cancel',
        danger: true,
      });
      if (!ok) return;
      B.store.reset();
      B.app.toast('Progress reset — viel Erfolg! 🍀');
      B.app.go('home');
    }

    const resetBtn = h('button', { class: 'link-btn danger', type: 'button' }, 'Reset progress');
    resetBtn.addEventListener('click', resetAll);

    root.append(
      top,
      h('main', { class: 'home' },
        hero,
        setup,
        h('section', { class: 'topics' },
          h('h2', { class: 'section-title' }, 'Topics'),
          h('p', { class: 'muted small topics-help' }, 'Tap a topic to practise only that. Open 📖 Rule for a quick reminder.'),
          h('div', { class: 'topic-grid' }, topicCards.map((t) => t.el))),
        h('footer', { class: 'home-foot' }, resetBtn, h('p', { class: 'muted small' }, 'Progress is saved in this browser on this device.')))
    );
    if (!ov.complete) paintSetup();
    else topicCards.forEach(({ el }) => el.querySelector('.topic-main').setAttribute('disabled', ''));

    return {
      onKey(e) {
        if (e.key === 'Enter' && e.target === document.body && !ov.complete && !startBtn.disabled) {
          e.preventDefault();
          startBtn.click();
        }
      },
    };
  };
})();
