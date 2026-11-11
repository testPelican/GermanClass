/*
 * Home screen: overall progress, reviews due, session setup (cards, topic, difficulty slider,
 * Start Learning / Start Gaming), topics with their grammar rules (💻 = has minigames), achievements.
 */
(function () {
  'use strict';
  const B = window.Brezel;
  const { h, md, pct } = B.util;
  const SIZES = [5, 10, 20, 50, 0]; // 0 = every remaining card

  // --- the difficulty slider -------------------------------------------------------------------
  const LEVEL_LOOK = {
    low: { color: '#58cc02', shadow: '#46a302', text: 'Recognise: true / false, multiple choice, small pairs' },
    medium: { color: '#ff9600', shadow: '#d97f00', text: 'Build: fill gaps, sort, spot the mistake, short sentences' },
    high: { color: '#ff4b4b', shadow: '#d93636', text: 'Produce: type answers, tables, long sentences' },
    mixed: { color: '#a560e8', shadow: '#8441c4', text: 'All difficulties, shuffled together' },
  };
  // little pictures for each stop: a hill, a mountain, a peak, a pair of dice
  const LEVEL_ART = {
    low: '<svg viewBox="0 0 64 64" aria-hidden="true"><g class="lv-sun"><circle cx="47" cy="17" r="7" fill="#ffc800"/><path d="M47 4v4M47 26v4M34 17h4M56 17h4M37.8 7.8l2.8 2.8M53.4 23.4l2.8 2.8M37.8 26.2l2.8-2.8M53.4 10.6l2.8-2.8" stroke="#ffc800" stroke-width="2.4" stroke-linecap="round"/></g><path d="M0 58c12-20 32-22 64-6v12H0z" fill="#58cc02"/><path d="M0 58c10-12 24-14 40-4L0 64z" fill="#46a302"/><g class="lv-flag"><path d="M26 41V27" stroke="#4b4b4b" stroke-width="2.2" stroke-linecap="round"/><path d="M26 27l11 3.5-11 3.5z" fill="#ff4b4b"/></g></svg>',
    medium: '<svg viewBox="0 0 64 64" aria-hidden="true"><g class="lv-cloud"><path d="M8 20a5 5 0 0 1 9-3 4 4 0 0 1 7 3z" fill="#fff" stroke="#d0e6f2" stroke-width="1.5"/></g><path d="M2 58l20-34 9 14 9-16 22 36z" fill="#ff9600"/><path d="M22 24l6 10-3.5-1.5L22 36l-2.5-3.5-3.5 1.5z" fill="#fff"/><path d="M40 22l5.5 9-3-1-2.5 3-2.5-3-3 1z" fill="#fff"/><path d="M2 58l20-34 4 6L10 58z" fill="#d97f00" opacity=".5"/><path d="M14 58c6-6 10-10 18-12s12-4 18-10" fill="none" stroke="#ffe0b0" stroke-width="1.8" stroke-dasharray="3 3"/></svg>',
    high: '<svg viewBox="0 0 64 64" aria-hidden="true"><g class="lv-stars"><path d="M10 12l1.4 3 3 .4-2.2 2 .6 3-2.8-1.6-2.8 1.6.6-3-2.2-2 3-.4z" fill="#ffc800"/><path d="M53 24l1 2 2.2.3-1.6 1.5.4 2.2-2-1.1-2 1.1.4-2.2-1.6-1.5 2.2-.3z" fill="#ffc800"/></g><path d="M2 60L32 14l30 46z" fill="#ff4b4b"/><path d="M2 60L32 14l6 9L14 60z" fill="#d93636" opacity=".55"/><path d="M32 14l9 13.5-5-2-4 5-4-5-5 2z" fill="#fff"/><g class="lv-flag"><path d="M32 15V3" stroke="#4b4b4b" stroke-width="2.2" stroke-linecap="round"/><path d="M32 3l10 3-10 3z" fill="#ffc800"/></g></svg>',
    mixed: '<svg viewBox="0 0 64 64" aria-hidden="true"><g class="lv-die-a"><rect x="6" y="20" width="30" height="30" rx="7" fill="#a560e8"/><rect x="6" y="20" width="30" height="30" rx="7" fill="none" stroke="#8441c4" stroke-width="2"/><circle cx="14" cy="28" r="3" fill="#fff"/><circle cx="21" cy="35" r="3" fill="#fff"/><circle cx="28" cy="42" r="3" fill="#fff"/></g><g class="lv-die-b"><rect x="32" y="8" width="26" height="26" rx="6" fill="#ce82ff"/><rect x="32" y="8" width="26" height="26" rx="6" fill="none" stroke="#a560e8" stroke-width="2"/><circle cx="39" cy="15" r="2.6" fill="#fff"/><circle cx="51" cy="15" r="2.6" fill="#fff"/><circle cx="39" cy="27" r="2.6" fill="#fff"/><circle cx="51" cy="27" r="2.6" fill="#fff"/></g><circle cx="12" cy="56" r="2" fill="#58cc02"/><circle cx="22" cy="58" r="2" fill="#ff9600"/><circle cx="32" cy="56" r="2" fill="#ff4b4b"/></svg>',
  };

  /**
   * A 4-stop slider: Low · Medium · High · Mixed. Drag the thumb, tap a stop, or use the arrow keys.
   * onChange(key) runs when the value changes. Returns { el, set(key) }.
   */
  function levelSlider(value, onChange) {
    const keys = B.level.SETTINGS.map((x) => x.key);
    let idx = Math.max(0, keys.indexOf(value));
    const fill = h('div', { class: 'lv-fill' });
    const thumb = h('div', { class: 'lv-thumb', 'aria-hidden': 'true' }, h('span', { class: 'lv-thumb-dot' }));
    const track = h('div', { class: 'lv-track' }, fill, keys.map((_, i) => h('span', { class: 'lv-tick', style: { left: (i / (keys.length - 1)) * 100 + '%' } })), thumb);
    const stops = B.level.SETTINGS.map((x, i) => {
      const b = h('button', { type: 'button', class: 'lv-stop lv-' + x.key, tabindex: '-1', 'aria-label': x.name },
        h('span', { class: 'lv-art', html: LEVEL_ART[x.key] }),
        h('span', { class: 'lv-name' }, x.name));
      b.addEventListener('click', () => set(i, true));
      return b;
    });
    const el = h('div', {
      class: 'lv-slider',
      role: 'slider',
      tabindex: '0',
      'aria-label': 'Difficulty',
      'aria-valuemin': '0',
      'aria-valuemax': String(keys.length - 1),
    }, h('div', { class: 'lv-stops' }, stops), h('div', { class: 'lv-rail' }, track));

    function paint(dragPct) {
      const k = keys[idx];
      const look = LEVEL_LOOK[k];
      const p = dragPct != null ? dragPct : (idx / (keys.length - 1)) * 100;
      el.style.setProperty('--lv', look.color);
      el.style.setProperty('--lv-shadow', look.shadow);
      el.style.setProperty('--lv-pos', p + '%');
      el.style.setProperty('--lv-pos-n', String(p)); // lets the rainbow fill span the whole rail
      el.classList.toggle('dragging', dragPct != null);
      el.setAttribute('aria-valuenow', String(idx));
      el.setAttribute('aria-valuetext', B.level.SETTINGS[idx].name);
      stops.forEach((b, i) => {
        b.classList.toggle('is-active', i === idx);
        b.setAttribute('aria-pressed', String(i === idx));
      });
    }

    function set(i, user) {
      i = Math.max(0, Math.min(keys.length - 1, i));
      const changed = i !== idx;
      idx = i;
      paint();
      if (changed || user) {
        B.util.pulse(thumb, 'lv-pop');
        B.util.pulse(stops[idx].querySelector('.lv-art'), 'lv-bounce');
      }
      if (changed) {
        B.audio.play('tap');
        onChange(keys[idx]);
      }
    }

    // drag: the thumb follows the finger, then snaps to the nearest stop with a spring
    let dragging = false;
    const pctAt = (x) => {
      const r = track.getBoundingClientRect();
      return Math.max(0, Math.min(100, ((x - r.left) / r.width) * 100));
    };
    track.addEventListener('pointerdown', (e) => {
      if (e.button !== undefined && e.button !== 0) return;
      dragging = true;
      track.setPointerCapture && track.setPointerCapture(e.pointerId);
      paint(pctAt(e.clientX));
      e.preventDefault();
    });
    track.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const p = pctAt(e.clientX);
      const near = Math.round((p / 100) * (keys.length - 1));
      if (near !== idx) {
        idx = near;
        B.util.pulse(stops[idx].querySelector('.lv-art'), 'lv-bounce');
        B.audio.play('tap');
        onChange(keys[idx]);
      }
      paint(p);
    });
    const end = (e) => {
      if (!dragging) return;
      dragging = false;
      set(Math.round((pctAt(e.clientX) / 100) * (keys.length - 1)), true);
    };
    track.addEventListener('pointerup', end);
    track.addEventListener('pointercancel', () => {
      dragging = false;
      paint();
    });
    el.addEventListener('keydown', (e) => {
      const step = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[e.key];
      if (step) set(idx + step, true);
      else if (e.key === 'Home') set(0, true);
      else if (e.key === 'End') set(keys.length - 1, true);
      else return;
      e.preventDefault();
      e.stopPropagation();
    });
    paint();
    return { el, set: (k) => set(keys.indexOf(k)) };
  }

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
    let level = B.store.setting('level');
    if (!B.level.SETTINGS.some((x) => x.key === level)) level = 'mixed';

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
    const dueLine = ov.due
      ? h('p', { class: 'due-line' }, h('span', { 'aria-hidden': 'true' }, '🔁 '), `${ov.due} card${ov.due === 1 ? '' : 's'} to review today`)
      : null;
    const heroText = ov.complete
      ? h('div', { class: 'hero-text' },
        h('h1', {}, 'Alles fertig! 🎉'),
        h('p', {}, `You’ve mastered all ${ov.total} cards.`),
        h('p', { class: 'muted' }, 'Your detailed review is ready.'),
        dueLine)
      : h('div', { class: 'hero-text' },
        h('h1', {}, greeting()),
        h('p', {}, ov.done ? `You’ve mastered ${ov.done} of ${ov.total} cards.` : `${ov.total} cards are waiting for you.`),
        h('p', { class: 'muted' },
          ov.done
            ? `${ov.total - ov.done} to go` + (ov.stillWrong ? ` · ${ov.stillWrong} need another try` : '')
            : 'Grammar first: word order, verbs, tenses, articles and more.'),
        dueLine);
    const hero = h('section', { class: 'card hero' }, ring(ov.done, ov.total), heroText);

    // --- session setup --------------------------------------------------------------
    const startBtn = h('button', { class: 'btn btn-primary btn-big start-btn', type: 'button' });
    const gameBtn = h('button', { class: 'btn btn-big game-btn', type: 'button' }, h('span', { class: 'game-btn-icon', 'aria-hidden': 'true' }, '🎮'), ' Start Gaming');
    const startSub = h('p', { class: 'start-sub' });
    const levelInfo = h('p', { class: 'lv-info', 'aria-live': 'polite' });
    const slider = levelSlider(level, (k) => {
      level = B.store.setting('level', k);
      paintSetup();
    });
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
      const due = B.stats.due(topic, level).length;
      const fresh = B.stats.fresh(topic, level).length;
      const pending = due + fresh;
      const n = size ? Math.min(size, pending) : pending;
      const look = LEVEL_LOOK[level];
      const lvName = B.level.SETTINGS.find((x) => x.key === level).name;
      const atLevel = B.deck.cards.filter((c) => (topic === 'all' || B.deck.inTopic(c, topic)) && B.level.fits(c, level)).length;
      levelInfo.style.setProperty('--lv', look.color);
      levelInfo.replaceChildren(h('b', {}, lvName), ` · ${look.text} · ${atLevel} card${atLevel === 1 ? '' : 's'}`);
      const games = B.games ? B.games.forTopic(topic) : [];
      gameBtn.classList.toggle('no-games', !games.length);
      gameBtn.title = games.length ? `${games.length} game${games.length === 1 ? '' : 's'}: ${games.map((g) => g.name).join(', ')}` : 'No games for this topic yet';
      sizeBtns.forEach(({ n: k, b }) => b.setAttribute('aria-pressed', String(k === size)));
      chipBtns.forEach(({ id, b }) => b.setAttribute('aria-pressed', String(id === topic)));
      topicCards.forEach(({ id, el }) => el.classList.toggle('is-selected', id === topic));
      const tName = topic === 'all' ? 'all topics' : B.deck.topicMap[topic].name;
      const gamesLine = games.length ? ` · 💻 ${games.length} game${games.length === 1 ? '' : 's'}` : '';
      if (!pending) {
        const next = B.stats.nextDue(topic, level);
        startBtn.disabled = true;
        startBtn.textContent = 'All caught up ✓';
        startSub.textContent = (atLevel
          ? `Every ${level === 'mixed' ? '' : lvName + ' '}card here is mastered.` + (next != null ? ` The next review is ${B.srs.when(next, B.srs.day())}.` : '') + ' Pick another topic or difficulty — or play a game.'
          : `There are no ${lvName} cards in ${tName}. Pick another difficulty.`) + gamesLine;
      } else {
        startBtn.disabled = false;
        startBtn.replaceChildren(h('span', { 'aria-hidden': 'true' }, '▶ '), 'Start Learning');
        const parts = [due ? `${due} to review` : '', fresh ? `${fresh} new` : ''].filter(Boolean).join(' + ');
        startSub.textContent = `${n} card${n === 1 ? '' : 's'} · ${tName} · ${parts}` + (due && n < pending ? ' · reviews first' : '') + gamesLine;
      }
    }

    startBtn.addEventListener('click', () => B.app.go('session', { topic, size, level }));
    gameBtn.addEventListener('click', () => {
      if (!B.games || !B.games.has(topic)) {
        const tName = topic === 'all' ? 'all topics' : B.deck.topicMap[topic].name;
        B.app.alert({ title: 'Sorry!', text: `There are no games for ${tName} yet. Pick another topic — the ones with 💻 have games.`, icon: '🙈' });
        return;
      }
      B.app.go('arcade', { topic, level });
    });

    const mistakes = ov.mistakes;
    const practiseBtn = h('button', { class: 'btn btn-outline', type: 'button', disabled: !mistakes },
      h('span', { 'aria-hidden': 'true' }, '🔁 '), `Practise mistakes${mistakes ? ` (${mistakes})` : ''}`);
    practiseBtn.addEventListener('click', () => B.app.go('session', { practice: true, size }));
    const reportBtn = h('button', { class: 'btn btn-outline', type: 'button' }, h('span', { 'aria-hidden': 'true' }, '📊 '), ov.complete ? 'Detailed review' : 'Progress report');
    reportBtn.addEventListener('click', () => B.app.go('review'));

    const bookBtn = h('button', { class: 'btn btn-outline', type: 'button' }, h('span', { 'aria-hidden': 'true' }, '📖 '), 'Rule book');
    bookBtn.addEventListener('click', () => B.app.go('rulebook'));

    // Once every card is mastered, sessions are reviews only: the setup stays.
    const setup = h('section', { class: 'card setup' },
      h('h2', { class: 'section-title' }, ov.complete ? 'Keep it fresh' : 'New session'),
      h('div', { class: 'field' }, h('span', { class: 'field-label' }, 'Cards'), sizeSeg),
      h('div', { class: 'field' }, h('span', { class: 'field-label' }, 'Topic'), chipRow),
      h('div', { class: 'field field-level' }, h('span', { class: 'field-label', id: 'lv-label' }, 'Difficulty'), slider.el, levelInfo),
      h('div', { class: 'start-row' }, startBtn, gameBtn),
      startSub,
      h('div', { class: 'home-links' }, practiseBtn, reportBtn, bookBtn));

    // --- topics ------------------------------------------------------------------------
    const topicCards = topics.map((t) => {
      const tipId = 'tip-' + t.topic.id;
      const allRules = h('button', { class: 'link-btn tip-more', type: 'button' }, 'All rules of this topic →');
      allRules.addEventListener('click', () => B.app.go('rulebook', { topic: t.topic.collects ? null : t.topic.id }));
      if (t.topic.collects) allRules.textContent = 'Open the Rule book →';
      const tip = h('div', { class: 'topic-tip', id: tipId, hidden: true }, h('div', { html: md(t.topic.tip || '') }), allRules);
      const ruleBtn = h('button', { class: 'link-btn rule-btn', type: 'button', 'aria-expanded': 'false', 'aria-controls': tipId }, h('span', { 'aria-hidden': 'true' }, '📖 '), 'Rule');
      ruleBtn.addEventListener('click', () => {
        const open = tip.hidden;
        tip.hidden = !open;
        ruleBtn.setAttribute('aria-expanded', String(open));
        if (open) B.util.pulse(tip, 'reveal');
      });
      const games = B.games ? B.games.forTopic(t.topic.id) : [];
      const main = h('button', { class: 'topic-main', type: 'button', 'aria-label': `${t.topic.name}: ${t.done} of ${t.total} mastered${t.due ? `, ${t.due} to review today` : ''}${games.length ? `, ${games.length} games` : ''}. Select topic.` },
        h('span', { class: 'topic-icon', 'aria-hidden': 'true' }, t.topic.icon),
        h('span', { class: 'topic-text' }, h('b', {}, t.topic.name), h('small', {}, t.topic.de)),
        games.length ? h('span', { class: 'game-pill', title: `Minigames: ${games.map((g) => g.name).join(', ')}` }, '💻', h('span', { class: 'game-pill-n' }, String(games.length))) : null,
        t.due ? h('span', { class: 'due-pill', title: `${t.due} to review today` }, `🔁 ${t.due}`) : null,
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
          h('p', { class: 'muted small topics-help' }, 'Tap a topic to practise only that. Open 📖 Rule for a quick reminder. 💻 = this topic has minigames.'),
          h('div', { class: 'topic-grid' }, topicCards.map((t) => t.el))),
        B.ui.achievementsSection ? h('div', { class: 'home-ach' }, B.ui.achievementsSection()) : null,
        h('footer', { class: 'home-foot' }, resetBtn, h('p', { class: 'muted small' }, 'Progress is saved in this browser on this device.')))
    );
    paintSetup();

    return {
      onKey(e) {
        if (e.key === 'Enter' && e.target === document.body && !startBtn.disabled) {
          e.preventDefault();
          startBtn.click();
        }
      },
    };
  };
})();
