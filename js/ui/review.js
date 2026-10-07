/*
 * Detailed review: strong and weak areas with charts and numbers.
 * Available any time; after the whole deck is mastered it becomes the final report.
 */
(function () {
  'use strict';
  const B = window.Brezel;
  const { h, md, pct, fmtDuration } = B.util;

  const SERIES = [
    { label: 'Right first time', cls: 's1' },
    { label: 'Right after a retry', cls: 's2' },
  ];

  function dateLabel(t) {
    try {
      return new Date(t).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
    } catch (e) {
      return '';
    }
  }

  B.ui.review = function (root) {
    const ov = B.stats.overview();
    const topics = B.stats.byTopic();
    const types = B.stats.byType();
    const sessions = B.stats.sessions();
    const missed = B.stats.missed(10);

    const back = h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Back to home' }, '←');
    back.addEventListener('click', () => B.app.go('home'));
    const top = h('header', { class: 'page-top' }, back, h('h1', { class: 'page-title' }, ov.complete ? 'Your final review' : 'Progress report'));
    const main = h('main', { class: 'review' });
    root.append(top, main);

    if (!ov.attempted) {
      const go = h('button', { class: 'btn btn-primary btn-big', type: 'button' }, 'Start learning');
      go.addEventListener('click', () => B.app.go('session', { topic: 'all', size: B.store.setting('size') }));
      main.append(h('section', { class: 'card empty-state' },
        h('div', { class: 'empty-mascot', 'aria-hidden': 'true' }, '🥨'),
        h('h2', {}, 'No answers yet'),
        h('p', { class: 'muted' }, 'Answer a few cards and your strengths and weak spots will show up here.'),
        go));
      return {};
    }

    // --- hero: first-try accuracy -----------------------------------------------------
    const heroStatus = B.ui.statusBadge(ov.status);
    main.append(h('section', { class: 'card review-hero' },
      ov.complete
        ? h('p', { class: 'banner' }, h('span', { 'aria-hidden': 'true' }, '🎉 '), `All ${ov.total} cards mastered — here’s how it went.`)
        : h('p', { class: 'banner soft' }, `You’ve mastered ${ov.done} of ${ov.total} cards. The report fills in as you go — the full review is ready when you finish the deck.`),
      h('div', { class: 'hero-num' },
        h('span', { class: 'hero-big' }, ov.firstPct + '%'),
        h('span', { class: 'hero-cap' }, 'right on the first try')),
      B.charts.meter(ov.firstPct, 'First-try accuracy'),
      h('div', { class: 'hero-foot' },
        heroStatus,
        h('span', { class: 'muted small' }, `${ov.first} of ${ov.attempted} cards answered correctly the first time you saw them`))));

    // --- KPI tiles -------------------------------------------------------------------------
    const tile = B.ui.tile;
    main.append(h('div', { class: 'stat-grid six' },
      tile('⭐', `${ov.done}/${ov.total}`, 'cards mastered'),
      tile('✍️', String(ov.answers), 'answers given'),
      tile('✗', String(ov.wrong), 'mistakes', ov.wrong ? 't-bad' : ''),
      tile('⏱️', fmtDuration(ov.timeMs), 'time practising'),
      tile('📅', String(ov.sessions), ov.sessions === 1 ? 'session' : 'sessions'),
      tile('🔥', String(ov.bestCombo), 'best combo')));

    // --- strengths & weak spots ----------------------------------------------------------------
    const judged = topics.filter((t) => t.status.key !== 'none');
    const strong = judged.filter((t) => t.status.key === 'good').sort((a, b) => b.firstPct - a.firstPct);
    const weak = judged.filter((t) => t.status.key !== 'good').sort((a, b) => a.firstPct - b.firstPct);
    const areaItem = (t) => h('li', { class: 'area-item' },
      h('span', { class: 'area-icon', 'aria-hidden': 'true' }, t.topic.icon),
      h('span', { class: 'area-name' }, t.topic.name),
      h('span', { class: 'area-num' }, `${t.firstPct}%`),
      B.ui.statusBadge(t.status));
    const noneYet = (txt) => h('p', { class: 'muted small' }, txt);
    main.append(h('div', { class: 'areas' },
      h('section', { class: 'card area strong' },
        h('h2', { class: 'section-title' }, h('span', { 'aria-hidden': 'true' }, '💪 '), 'You know these well'),
        strong.length ? h('ul', { class: 'area-list' }, strong.map(areaItem)) : noneYet(`No topic is at ${B.stats.STRONG}%+ first-try accuracy yet — keep going!`)),
      h('section', { class: 'card area weak' },
        h('h2', { class: 'section-title' }, h('span', { 'aria-hidden': 'true' }, '🎯 '), 'Focus on these'),
        weak.length ? h('ul', { class: 'area-list' }, weak.map(areaItem)) : noneYet(judged.length ? 'Nothing weak right now — sehr gut!' : `Answer at least ${B.stats.MIN_CARDS} cards in a topic to see how you’re doing.`))));

    // --- chart: mastery by topic ------------------------------------------------------------------
    const topicRows = topics.map((t) => ({
      label: t.topic.name,
      icon: t.topic.icon,
      total: t.total,
      parts: [t.first, t.retry],
      value: `${t.done}/${t.total}`,
      badge: B.ui.statusBadge(t.status, `${t.firstPct}%`),
      badgeText: t.status.key !== 'none' ? `${t.status.label}, ${t.firstPct}% first try` : '',
    }));
    main.append(B.charts.card({
      title: 'Mastery by topic',
      sub: `How each card was mastered. Badges: first-try accuracy — Strong ≥ ${B.stats.STRONG}%, Getting there ≥ ${B.stats.OKAY}%, below that Needs work.`,
      legend: SERIES.concat({ label: 'Not mastered yet', cls: 'rest' }),
      body: B.charts.stacked(topicRows, SERIES),
      table: {
        head: ['Topic', 'First try', 'After retry', 'Still wrong', 'Not seen', 'Mistakes', 'First-try %'],
        rows: topics.map((t) => [t.topic.name, t.first, t.retry, t.stillWrong, t.unseen, t.wrong, t.attempted ? t.firstPct + '%' : '—']),
      },
    }));

    // --- chart: by exercise type ------------------------------------------------------------------------
    const typeRows = types
      .filter((t) => t.attempted)
      .sort((a, b) => a.firstPct - b.firstPct)
      .map((t) => ({
        label: t.label,
        value: t.firstPct,
        text: `${t.firstPct}%`,
        tip: [t.label, `${t.first} of ${t.attempted} right on the first try (${t.firstPct}%)`, `${t.wrong} mistake${t.wrong === 1 ? '' : 's'} in total`],
      }));
    if (typeRows.length) {
      main.append(B.charts.card({
        title: 'First-try accuracy by exercise type',
        sub: 'Hardest formats at the top.',
        body: B.charts.bars(typeRows),
        table: {
          head: ['Exercise type', 'Cards tried', 'Right first time', 'Mistakes', 'First-try %'],
          rows: types.filter((t) => t.attempted).map((t) => [t.label, t.attempted, t.first, t.wrong, t.firstPct + '%']),
        },
      }));
    }

    // --- chart: accuracy per session -------------------------------------------------------------------------
    if (sessions.length >= 2) {
      const pts = sessions.map((s, i) => ({
        x: '#' + (i + 1),
        y: s.accuracy,
        hollow: s.practice,
        tip: [`Session ${i + 1}${s.practice ? ' (practice)' : ''} · ${dateLabel(s.start)}`, `${s.accuracy}% correct`, `${s.correct} right, ${s.wrong} wrong`],
      }));
      main.append(B.charts.card({
        title: 'Accuracy per session',
        sub: 'Share of answers that were right in each session' + (sessions.some((s) => s.practice) ? ' (hollow dots = practice).' : '.'),
        body: B.charts.line(pts, { ariaLabel: 'Accuracy per session: ' + pts.map((p) => `${p.x} ${p.y}%`).join(', ') }),
        table: {
          head: ['Session', 'Date', 'Answers', 'Right', 'Wrong', 'Accuracy'],
          rows: sessions.map((s, i) => [`#${i + 1}${s.practice ? ' (practice)' : ''}`, dateLabel(s.start), s.answered, s.correct, s.wrong, s.accuracy + '%']),
        },
      }));
    }

    // --- most missed cards ---------------------------------------------------------------------------------------
    if (missed.length) {
      main.append(h('section', { class: 'card missed' },
        h('h2', { class: 'section-title' }, h('span', { 'aria-hidden': 'true' }, '🧐 '), 'Your most-missed cards'),
        h('p', { class: 'muted small' }, 'With what you wrote last time and the correct answer.'),
        h('ol', { class: 'miss-list' }, missed.map(({ card, state }) => B.ui.cardLine(card, { count: state.w, given: state.lw, done: state.done })))));
    }

    // --- rule reminders for weak topics -----------------------------------------------------------------------------
    if (weak.length) {
      main.append(h('section', { class: 'card tips' },
        h('h2', { class: 'section-title' }, h('span', { 'aria-hidden': 'true' }, '📖 '), 'Rules to revise'),
        weak.map((t) => h('div', { class: 'tip-block' },
          h('h3', {}, h('span', { 'aria-hidden': 'true' }, t.topic.icon + ' '), t.topic.name, h('span', { class: 'muted' }, ' · ' + t.topic.de)),
          h('p', { html: md(t.topic.tip || '') })))));
    }

    // --- actions -----------------------------------------------------------------------------------------------------
    const mistakes = ov.mistakes;
    const practise = h('button', { class: 'btn btn-primary btn-big', type: 'button', disabled: !mistakes }, mistakes ? `Practise my ${mistakes} mistake${mistakes === 1 ? '' : 's'}` : 'No mistakes to practise');
    practise.addEventListener('click', () => B.app.go('session', { practice: true, size: B.store.setting('size') }));
    const home = h('button', { class: 'btn btn-outline', type: 'button' }, 'Back home');
    home.addEventListener('click', () => B.app.go('home'));
    const reset = h('button', { class: 'btn btn-outline danger-text', type: 'button' }, '↺ Start over');
    reset.addEventListener('click', async () => {
      const ok = await B.app.confirm({ title: 'Start over?', text: 'This deletes all your progress and statistics.', ok: 'Delete progress', danger: true });
      if (!ok) return;
      B.store.reset();
      B.app.toast('Progress reset — viel Erfolg! 🍀');
      B.app.go('home');
    });
    main.append(h('div', { class: 'review-actions' }, practise, h('div', { class: 'home-links' }, home, reset)));

    if (ov.complete && !B.store.state.celebrated) {
      B.store.state.celebrated = true;
      B.store.save();
      setTimeout(() => B.app.confetti(160), 200);
    }

    return {
      onKey(e) {
        if (e.key === 'Escape') B.app.go('home');
      },
    };
  };
})();
