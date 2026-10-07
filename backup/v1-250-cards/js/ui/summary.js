/* End-of-session summary: XP, accuracy, time, newly mastered cards and the cards that were missed. */
(function () {
  'use strict';
  const B = window.Brezel;
  const { h, md, show, pct, fmtDuration } = B.util;

  function tile(icon, value, label, cls) {
    return h('div', { class: 'stat-tile ' + (cls || '') },
      h('div', { class: 'stat-icon', 'aria-hidden': 'true' }, icon),
      h('div', { class: 'stat-value' }, value),
      h('div', { class: 'stat-label' }, label));
  }

  /** Question + answer of a card for lists (summary and review). */
  function cardLine(card, extra) {
    const d = B.ex.get(card.type).describe(card);
    const topic = B.deck.topicMap[card.topic];
    const showPrompt = card.prompt && d.q !== card.prompt;
    return h('li', { class: 'miss-item' },
      h('div', { class: 'miss-top' },
        h('span', { class: 'topic-tag' }, h('span', { 'aria-hidden': 'true' }, topic.icon + ' '), topic.name),
        h('span', { class: 'type-tag' }, B.ex.label(card.type)),
        extra && extra.count ? h('span', { class: 'miss-count', title: 'Times answered wrong' }, `✗ ${extra.count}×`) : null,
        extra && extra.done != null ? h('span', { class: 'miss-state ' + (extra.done ? 'ok' : 'todo') }, extra.done ? '✓ mastered' : '… not yet') : null),
      showPrompt ? h('div', { class: 'miss-prompt', html: md(card.prompt) }) : null,
      h('div', { class: 'miss-q', html: B.ex.richText(d.q) }),
      extra && extra.given ? h('div', { class: 'miss-given' }, h('span', { class: 'miss-k' }, 'You wrote: '), h('s', {}, show(extra.given))) : null,
      h('div', { class: 'miss-a' }, h('span', { class: 'miss-k' }, 'Answer: '), h('span', { html: md(d.a) })),
      card.explain ? h('div', { class: 'miss-why', html: md(card.explain) }) : null);
  }

  B.ui.cardLine = cardLine;
  B.ui.tile = tile;

  B.ui.summary = function (root, r) {
    const ov = B.stats.overview();
    const acc = pct(r.correct, r.answered);
    const complete = ov.complete && !r.practice;
    const title = complete
      ? `You mastered all ${ov.total} cards!`
      : r.quit
        ? 'Session saved'
        : acc >= 90
          ? 'Ausgezeichnet!'
          : acc >= 70
            ? 'Gut gemacht!'
            : 'Session complete!';
    const subtitle = complete
      ? 'Wunderbar! Your detailed review with charts is ready.'
      : r.practice
        ? `You practised ${r.total} card${r.total === 1 ? '' : 's'} you had got wrong before.`
        : r.quit
          ? `You mastered ${r.mastered} new card${r.mastered === 1 ? '' : 's'} before stopping.`
          : `You mastered ${r.mastered} new card${r.mastered === 1 ? '' : 's'}.`;

    const tiles = h('div', { class: 'stat-grid' },
      tile('⚡', '+' + r.xp, 'XP earned', 't-xp'),
      tile('🎯', acc + '%', `accuracy (${r.correct}/${r.answered})`, 't-acc'),
      tile('⏱️', fmtDuration(r.ms), 'time', 't-time'),
      tile(r.practice ? '🔁' : '⭐', r.practice ? String(r.cleared) : '+' + r.mastered, r.practice ? 'fixed' : 'mastered', 't-new'));

    const overall = h('div', { class: 'card overall' },
      h('div', { class: 'overall-row' }, h('b', {}, 'Overall'), h('span', {}, h('b', {}, String(ov.done)), ` / ${ov.total} mastered`)),
      h('div', { class: 'progress big', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': String(ov.total), 'aria-valuenow': String(ov.done), 'aria-label': 'Overall progress' },
        h('div', { class: 'progress-fill', style: { width: pct(ov.done, ov.total) + '%' } })),
      h('p', { class: 'muted small' }, complete ? 'Every card is done.' : `${ov.total - ov.done} cards left${r.bestCombo >= 3 ? ` · best combo this session: 🔥 ${r.bestCombo}` : ''}`));

    const missedCards = r.missed.map((id) => B.deck.cardMap[id]).filter(Boolean);
    const missedList = missedCards.length
      ? h('section', { class: 'card missed' },
        h('h2', { class: 'section-title' }, `Cards you missed (${missedCards.length})`),
        h('p', { class: 'muted small' }, r.practice
          ? 'Practice doesn’t change your progress — it’s just extra training.'
          : r.quit
            ? 'Cards marked “not yet” stay in the pile for your next session.'
            : 'Each one went back into the pile until you got it right. They stay in your review, so you can practise them again.'),
        h('ul', { class: 'miss-list' }, missedCards.map((c) => {
          const s = B.store.cardState(c.id);
          return cardLine(c, { done: B.store.isDone(c.id), given: !r.practice && s ? s.lw : null });
        })))
      : r.answered
        ? h('section', { class: 'card perfect' }, h('span', { 'aria-hidden': 'true' }, '💯 '), 'No mistakes this session!')
        : null;

    const primary = h('button', { class: 'btn btn-primary btn-big', type: 'button' }, complete ? 'See my detailed review' : 'Continue');
    primary.addEventListener('click', () => B.app.go(complete ? 'review' : 'home'));
    const pendingLeft = r.practice ? B.stats.mistakeCards().length : B.stats.pending(r.opts.topic).length;
    const again = !complete && pendingLeft
      ? h('button', { class: 'btn btn-outline', type: 'button' }, h('span', { 'aria-hidden': 'true' }, '▶ '), r.practice ? 'Practise again' : 'Keep going')
      : null;
    if (again) again.addEventListener('click', () => B.app.go('session', r.opts));
    const report = h('button', { class: 'btn btn-outline', type: 'button' }, h('span', { 'aria-hidden': 'true' }, '📊 '), 'Progress report');
    report.addEventListener('click', () => B.app.go('review'));

    root.append(h('main', { class: 'summary' },
      h('div', { class: 'summary-hero' },
        h('div', { class: 'summary-mascot' + (complete ? ' big' : ''), 'aria-hidden': 'true' }, complete ? '🏆' : acc >= 70 ? '🥨' : '💪'),
        h('h1', {}, title),
        h('p', { class: 'muted' }, subtitle)),
      tiles,
      overall,
      missedList,
      h('div', { class: 'summary-actions' }, primary, h('div', { class: 'home-links' }, again, complete ? null : report))));

    B.audio.play('complete');
    if (!r.quit && (acc >= 60 || complete)) setTimeout(() => B.app.confetti(complete ? 200 : 110), 150);
    primary.focus({ preventScroll: true });

    return {
      onKey(e) {
        if (e.key === 'Enter' && (e.target === document.body || e.target === primary)) {
          e.preventDefault();
          primary.click();
        }
      },
    };
  };
})();
