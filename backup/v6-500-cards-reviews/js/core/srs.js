/*
 * Spaced repetition. A card is mastered the first time it is answered right; then it comes back
 * for review on its due day. Each right answer on a due card moves it one step up, so it comes
 * back later:
 *
 *   step    1    2    3    4    5    6
 *   days    1    3    7   14   30   90
 *
 * A wrong answer moves a mastered card two steps down (not below 1) and keeps it due today.
 * Once it is right again it comes back tomorrow, then climbs from that step.
 * Days are calendar days (days since 1 Jan 1970, local time), so a card is due from the morning.
 * Saved per card in Brezel.store: lv = step, due = day number, bad = 1 after a wrong answer.
 */
(function () {
  'use strict';
  const B = window.Brezel;

  const DAYS = [0, 1, 3, 7, 14, 30, 90]; // index = step
  const MAX = DAYS.length - 1;
  const DROP = 2; // steps lost by a wrong answer
  const PER_DAY = 25; // at most this many old cards fall due on one day when schedules are first added

  /** The calendar day of a time, as a number. */
  function day(t = Date.now()) {
    const d = new Date(t);
    return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
  }

  /** A mastered card that is due on or before that day. */
  const isDue = (s, today) => !!(s && s.done && (s.due == null || s.due <= today));

  /**
   * The new schedule after an answer: { lv, due, bad }, or null if nothing changes.
   * s = the card's saved state before this answer ({} for a card never answered).
   */
  function next(s, ok, today) {
    if (!s.done) return ok ? { lv: 1, due: today + DAYS[1], bad: 0 } : null;
    const lv = s.lv || 1;
    if (!ok) return { lv: Math.max(1, lv - DROP), due: today, bad: 1 };
    if (s.bad) return { lv, due: today + DAYS[1], bad: 0 };
    if (s.due > today) return null; // not due yet: an early extra answer changes nothing
    const up = Math.min(MAX, lv + 1);
    return { lv: up, due: today + DAYS[up], bad: 0 };
  }

  /**
   * Give cards mastered before spaced repetition existed a schedule. A card right on the first
   * try starts at step 2. Cards that would already be due are spread over the next days
   * (oldest first, at most PER_DAY a day), so they don't all come back at once.
   * Returns the number of cards changed.
   */
  function migrate(cards, today) {
    const old = Object.values(cards).filter((s) => s && s.done && s.lv == null);
    const late = [];
    for (const s of old) {
      s.lv = s.first === 1 ? 2 : 1;
      s.due = day(s.d || Date.now()) + DAYS[s.lv];
      if (s.due < today) late.push(s);
    }
    late.sort((a, b) => (a.d || 0) - (b.d || 0));
    const per = Math.max(PER_DAY, Math.ceil(late.length / 14));
    late.forEach((s, i) => (s.due = today + Math.floor(i / per)));
    return old.length;
  }

  /** "today", "tomorrow", "in 3 days", "in 2 weeks", "in a month", "in 3 months". */
  function when(due, today) {
    const n = due - today;
    if (n <= 0) return 'today';
    if (n === 1) return 'tomorrow';
    if (n < 14) return `in ${n} days`;
    if (n < 28) return `in ${Math.round(n / 7)} weeks`;
    const m = Math.round(n / 30);
    return m === 1 ? 'in a month' : `in ${m} months`;
  }

  /** How well a card is remembered, by step: 1–2 learning, 3–4 getting solid, 5–6 solid. */
  const GROUPS = [
    { key: 'learning', label: 'Learning', sub: 'steps 1–2: back within days', icon: '🌱', steps: [1, 2] },
    { key: 'growing', label: 'Getting solid', sub: 'steps 3–4: back in 1–2 weeks', icon: '🌿', steps: [3, 4] },
    { key: 'solid', label: 'Solid', sub: 'steps 5–6: back in 1–3 months', icon: '🌳', steps: [5, 6] },
  ];
  const group = (lv) => GROUPS.find((g) => g.steps.includes(lv || 1));

  B.srs = { DAYS, MAX, GROUPS, day, isDue, next, migrate, when, group };
})();
