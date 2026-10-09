/*
 * Progress statistics, computed from the deck + saved progress.
 * Used by the home screen, the session summary and the review report.
 */
(function () {
  'use strict';
  const B = window.Brezel;
  const { pct } = B.util;

  const STRONG = 85; // first-try accuracy (%) for "Strong"
  const OKAY = 65; // … for "Getting there"
  const MIN_CARDS = 3; // attempted cards needed before we judge an area
  const MAX_MS = 120000; // cap each answer's time so an idle tab doesn't count

  function status(p, attempted) {
    if (attempted < MIN_CARDS) return { key: 'none', icon: '·', label: 'Not enough data yet' };
    if (p >= STRONG) return { key: 'good', icon: '✓', label: 'Strong' };
    if (p >= OKAY) return { key: 'warn', icon: '!', label: 'Getting there' };
    return { key: 'bad', icon: '✗', label: 'Needs work' };
  }

  /** Aggregate a list of cards. first = right on the very first try; retry = mastered later. */
  function summarize(cards) {
    let done = 0, first = 0, retry = 0, attempted = 0, wrong = 0, answers = 0, stillWrong = 0;
    for (const c of cards) {
      const s = B.store.cardState(c.id);
      if (!s || !s.a) continue;
      attempted++;
      answers += s.a;
      wrong += s.w;
      if (s.done) {
        done++;
        if (s.first === 1) first++;
        else retry++;
      } else stillWrong++;
    }
    const firstPct = pct(first, attempted);
    return {
      total: cards.length,
      done,
      first,
      retry,
      stillWrong,
      unseen: cards.length - attempted,
      notDone: cards.length - done,
      attempted,
      answers,
      wrong,
      firstPct,
      accuracy: pct(answers - wrong, answers),
      status: status(firstPct, attempted),
    };
  }

  function overview() {
    const st = B.store.state;
    const all = summarize(B.deck.cards);
    const timeMs = st.log.reduce((sum, l) => sum + Math.min(l.ms || 0, MAX_MS), 0);
    return Object.assign(all, {
      timeMs,
      sessions: st.sessions.length,
      xp: st.xp,
      streak: st.streak,
      bestCombo: st.bestCombo || 0,
      mistakes: mistakeCards().length,
      complete: B.deck.cards.length > 0 && all.done === B.deck.cards.length,
    });
  }

  const byTopic = () => B.deck.topics.map((t) => Object.assign({ topic: t }, summarize(B.deck.byTopic(t.id))));

  function byType() {
    const groups = {};
    for (const c of B.deck.cards) (groups[c.type] = groups[c.type] || []).push(c);
    return Object.entries(groups).map(([type, cards]) => Object.assign({ type, label: B.ex.label(type) }, summarize(cards)));
  }

  /** Answer accuracy per session (oldest first), practice sessions included but flagged. */
  function sessions(limit = 30) {
    return B.store.state.sessions
      .filter((s) => s.answered > 0)
      .slice(-limit)
      .map((s) => ({
        id: s.id,
        start: s.start,
        answered: s.answered,
        correct: s.correct,
        wrong: s.wrong,
        accuracy: pct(s.correct, s.answered),
        practice: !!s.practice,
      }));
  }

  /** Cards answered wrong at least once. */
  function mistakeCards() {
    return B.deck.cards.filter((c) => {
      const s = B.store.cardState(c.id);
      return s && s.w > 0;
    });
  }

  /** The most-missed cards, worst first. */
  function missed(limit = 10) {
    return mistakeCards()
      .map((card) => ({ card, state: B.store.cardState(card.id) }))
      .sort((a, b) => b.state.w - a.state.w || (a.state.done ? 1 : 0) - (b.state.done ? 1 : 0) || b.state.a - a.state.a)
      .slice(0, limit);
  }

  const pending = (topic) =>
    B.deck.cards.filter((c) => (topic === 'all' || !topic || c.topic === topic) && !B.store.isDone(c.id));

  B.stats = { STRONG, OKAY, MIN_CARDS, status, summarize, overview, byTopic, byType, sessions, missed, mistakeCards, pending };
})();
