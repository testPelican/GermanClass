/*
 * A learning session.
 *  - The queue is every not-yet-mastered card (optionally one topic), shuffled, cut to the session size.
 *  - A wrong answer shows the correct one and puts the card back at a random later position.
 *  - Only correct answers count as mastered (practice mode never changes mastery).
 * Keys: Enter = check / continue, 1–6 = choose, Esc = quit.
 */
(function () {
  'use strict';
  const B = window.Brezel;
  const { h, md, show, shuffle, randInt, pick, wait, pulse, reducedMotion } = B.util;

  const PRAISE = ['Richtig!', 'Super!', 'Sehr gut!', 'Genau!', 'Perfekt!', 'Toll!', 'Klasse!', 'Prima!'];
  const OOPS = ['Not quite', 'Almost!', 'Oops!', 'Not this time'];
  const COMBOS = { 3: '3 in a row!', 5: '5 in a row! +5 XP per card', 10: '10 in a row — unstoppable!', 15: '15 in a row!', 20: '20 in a row — Wahnsinn!', 30: '30 in a row!!' };
  const XP_CORRECT = 10;
  const XP_COMBO = 5; // bonus per card while on a streak of 5+

  function buildQueue({ topic, size, practice }) {
    const pool = practice ? B.stats.mistakeCards() : B.stats.pending(topic);
    const list = shuffle(pool);
    return size ? list.slice(0, size) : list;
  }

  B.ui.session = function (root, opts) {
    const practice = !!opts.practice;
    const queue = buildQueue(opts);
    if (!queue.length) {
      setTimeout(() => {
        B.app.toast(practice ? 'No mistakes to practise 🎉' : 'Nothing left to learn here 🎉');
        B.app.go('home');
      });
      return {};
    }

    const total = queue.length;
    const deckTotal = B.deck.cards.length;
    const cleared = new Set(); // answered correctly in this session
    const missed = new Set(); // answered wrong at least once in this session
    let idx = 0;
    let combo = 0;
    let bestCombo = 0;
    let xp = 0;
    let answered = 0;
    let correct = 0;
    let mastered = 0;
    let firstTry = 0;
    let card = null;
    let ctrl = null;
    let ready = false;
    let phase = 'answer'; // answer → feedback → (busy) → answer … → done
    let shownAt = 0;
    let comeBackGap = 0;
    let introEl = null;
    let introTimer = 0;
    const startedAt = Date.now();
    B.store.beginSession(practice);

    const doneCount = () => B.deck.cards.reduce((n, c) => n + (B.store.isDone(c.id) ? 1 : 0), 0);

    // --- layout -----------------------------------------------------------------
    const quitBtn = h('button', { class: 'icon-btn quit-btn', type: 'button', 'aria-label': 'Quit session', title: 'Quit (Esc)' }, '✕');
    quitBtn.addEventListener('click', () => quit());
    const fill = h('div', { class: 'progress-fill' });
    const bar = h('div', { class: 'progress', role: 'progressbar', 'aria-label': 'Session progress', 'aria-valuemin': '0', 'aria-valuemax': String(total), 'aria-valuenow': '0' }, fill);
    const doneNum = h('b', {}, String(doneCount()));
    const totalPill = h('div', { class: 'pill total-pill', title: practice ? 'Practice — mastery is not changed' : 'Cards mastered overall' },
      h('span', { 'aria-hidden': 'true' }, practice ? '🔁' : '⭐'), ' ', doneNum, h('span', { class: 'of' }, '/' + deckTotal));
    const comboEl = h('div', { class: 'combo-flag', 'aria-live': 'polite' });
    const stage = h('main', { class: 's-stage' });
    const skipBtn = h('button', { class: 'btn btn-ghost skip-btn', type: 'button' }, 'I don’t know');
    skipBtn.addEventListener('click', () => check(true));
    const mainBtn = h('button', { class: 'btn btn-primary main-btn', type: 'button' }, 'Check');
    mainBtn.addEventListener('click', () => (phase === 'feedback' ? next() : check(false)));
    const feedback = h('div', { class: 'feedback', 'aria-live': 'polite' });
    const foot = h('footer', { class: 's-foot' }, feedback, h('div', { class: 's-foot-inner' }, skipBtn, mainBtn));

    root.append(h('div', { class: 'session' + (practice ? ' is-practice' : '') },
      h('header', { class: 's-top' }, quitBtn, bar, totalPill),
      comboEl,
      stage,
      foot));

    const api = {
      changed(r) {
        if (phase !== 'answer') return;
        ready = !!r;
        mainBtn.disabled = !ready;
      },
      submit() {
        if (ready) check(false);
      },
      sfx: (name) => B.audio.play(name),
      speak: (text) => B.audio.speak(text),
      get card() {
        return card;
      },
    };

    // --- flow ------------------------------------------------------------------------
    function showCard(animate) {
      card = queue[idx];
      const def = B.ex.get(card.type);
      const topic = B.deck.topicMap[card.topic];
      const prev = B.store.cardState(card.id);
      const tag = missed.has(card.id)
        ? h('span', { class: 'again-tag' }, '↻ Try again')
        : prev && prev.w
          ? h('span', { class: 'again-tag old' }, '↻ Missed before')
          : null;
      const exRoot = h('div', { class: 'ex ex-' + card.type });
      const wrap = h('div', { class: 's-card' + (animate ? ' enter' : '') },
        h('div', { class: 'card-meta' }, h('span', { class: 'topic-tag' }, h('span', { 'aria-hidden': 'true' }, topic.icon + ' '), topic.name), tag),
        exRoot);
      // Drop the entrance class once it has played, otherwise removing a later
      // .shake would let card-in run a second time.
      if (animate) {
        wrap.addEventListener('animationend', function done(e) {
          if (e.target !== wrap) return;
          wrap.classList.remove('enter');
          wrap.removeEventListener('animationend', done);
        });
      }
      ready = false;
      phase = 'answer';
      setFooter('check');
      stage.replaceChildren(wrap);
      stage.scrollTop = 0;
      try {
        ctrl = def.render(card, exRoot, api);
      } catch (err) {
        // A broken card must never block the session: log it and move on.
        console.error('[Brezel] card failed to render', card.id, err);
        queue.splice(idx, 1);
        if (idx >= queue.length) return finish(false);
        return showCard(animate);
      }
      shownAt = performance.now();
      if (!introEl) focusCard();
    }

    function focusCard() {
      if (ctrl && ctrl.focus) ctrl.focus();
      else if (document.activeElement && document.activeElement !== document.body && !stage.contains(document.activeElement)) document.activeElement.blur();
    }

    function check(skipped) {
      if (phase !== 'answer' || introEl) return;
      if (!skipped && !ready) return;
      phase = 'feedback';
      const ms = performance.now() - shownAt;
      let res = ctrl.check() || { ok: false };
      if (skipped) res = { ok: false, given: '', skipped: true };
      try {
        ctrl.lock(res);
      } catch (err) {
        console.error('[Brezel] lock failed', card.id, err);
      }
      const ok = !!res.ok;
      const firstSeen = !cleared.has(card.id) && !missed.has(card.id);
      answered++;
      let gained = 0;
      if (ok) {
        correct++;
        combo++;
        bestCombo = Math.max(bestCombo, combo);
        gained = XP_CORRECT + (combo >= 5 ? XP_COMBO : 0);
        cleared.add(card.id);
        if (firstSeen) firstTry++;
      } else {
        combo = 0;
        missed.add(card.id);
        requeue();
      }
      xp += gained;
      const { newlyDone } = B.store.record(card, ok, res.skipped ? '(skipped)' : res.given, ms, { practice, xp: gained });
      if (newlyDone) {
        mastered++;
        doneNum.textContent = String(doneCount());
        pulse(totalPill, 'bump');
      }
      B.store.setBestCombo(bestCombo);
      paintProgress();
      B.audio.play(ok ? 'correct' : 'wrong');
      if (ok && COMBOS[combo]) showCombo(combo);
      if (!ok) pulse(stage.firstElementChild, 'shake');
      renderFeedback(res, ok, gained);
      setFooter(ok ? 'good' : 'bad');
    }

    /** Wrong → back into the pile, at a random later spot (at least two cards later when possible). */
    function requeue() {
      const rest = queue.length - (idx + 1);
      const pos = randInt(idx + 1 + Math.min(2, rest), queue.length);
      queue.splice(pos, 0, card);
      comeBackGap = pos - idx - 1;
    }

    function paintProgress() {
      const p = (cleared.size / total) * 100;
      fill.style.width = p + '%';
      bar.setAttribute('aria-valuenow', String(cleared.size));
      bar.classList.toggle('has-progress', cleared.size > 0);
    }

    function showCombo(n) {
      comboEl.textContent = '🔥 ' + COMBOS[n];
      pulse(comboEl, 'show');
      setTimeout(() => B.audio.play('combo'), 260);
    }

    function renderFeedback(res, ok, gained) {
      let sol = null;
      try {
        sol = ctrl.solution ? ctrl.solution() : null;
      } catch (err) {
        console.error('[Brezel] solution failed', card.id, err);
      }
      const say = sol && sol.say;
      const title = ok ? (res.typo ? 'Correct — small typo' : pick(PRAISE)) : res.skipped ? 'Here’s the answer' : pick(OOPS);
      const speak = say && B.audio.canSpeak
        ? h('button', { class: 'speak-btn fb-speak', type: 'button', 'aria-label': 'Listen to the answer', title: 'Listen' }, '🔊')
        : null;
      if (speak) speak.addEventListener('click', () => B.audio.speak(say));

      const body = [];
      if (!ok && sol) body.push(h('div', { class: 'fb-label' }, 'Correct answer:'), h('div', { class: 'fb-answer', html: sol.html }));
      if (!ok && res.given && !res.skipped) {
        body.push(h('div', { class: 'fb-given' }, h('span', { class: 'fb-given-label' }, 'You answered: '), h('span', { class: 'fb-given-text' }, show(res.given))));
      }
      if (res.note) body.push(h('div', { class: 'fb-note', html: md(res.note) }));
      if (card.explain) body.push(h('div', { class: 'fb-explain' }, h('span', { class: 'fb-why' }, 'Why? '), h('span', { html: md(card.explain) })));
      if (!ok) {
        body.push(h('div', { class: 'fb-again' }, comeBackGap === 0
          ? '↻ This card comes straight back — try it again.'
          : '↻ This card goes back into the pile — you’ll see it again later.'));
      }

      feedback.replaceChildren(h('div', { class: 'fb-inner' },
        h('div', { class: 'fb-head' },
          h('span', { class: 'fb-icon', 'aria-hidden': 'true' }, ok ? '✓' : '✗'),
          h('h3', { class: 'fb-title' }, title),
          gained ? h('span', { class: 'fb-xp' }, `+${gained} XP`) : null,
          speak),
        h('div', { class: 'fb-body' }, body)));
    }

    function setFooter(mode) {
      foot.classList.remove('is-good', 'is-bad', 'has-feedback');
      if (mode === 'check') {
        feedback.replaceChildren();
        mainBtn.textContent = 'Check';
        mainBtn.className = 'btn btn-primary main-btn';
        mainBtn.disabled = !ready;
        skipBtn.hidden = false;
        return;
      }
      foot.classList.add('has-feedback', mode === 'good' ? 'is-good' : 'is-bad');
      mainBtn.textContent = 'Continue';
      mainBtn.className = 'btn main-btn ' + (mode === 'good' ? 'btn-primary' : 'btn-danger');
      mainBtn.disabled = false;
      skipBtn.hidden = true;
      mainBtn.focus({ preventScroll: true });
    }

    async function next() {
      if (phase !== 'feedback') return;
      phase = 'busy';
      B.charts && B.charts.hideTip();
      idx++;
      if (idx >= queue.length) return finish(false);
      const old = stage.firstElementChild;
      if (old && !reducedMotion()) {
        old.classList.add('leave');
        foot.classList.add('leaving');
        await wait(170);
        foot.classList.remove('leaving');
      }
      if (phase === 'busy') showCard(true);
    }

    function finish(quitEarly) {
      if (phase === 'done') return;
      phase = 'done';
      B.store.endSession({ bestCombo, quit: !!quitEarly });
      B.app.go('summary', {
        practice,
        opts,
        total,
        answered,
        correct,
        wrong: answered - correct,
        firstTry,
        cleared: cleared.size,
        missed: [...missed],
        mastered,
        xp,
        bestCombo,
        ms: Date.now() - startedAt,
        quit: !!quitEarly,
      });
    }

    async function quit() {
      if (phase === 'done') return;
      if (!answered) {
        phase = 'done';
        B.store.endSession();
        B.app.go('home');
        return;
      }
      const yes = await B.app.confirm({
        title: 'Quit this session?',
        text: 'Everything you answered is saved. Cards you haven’t got right yet stay in the pile for next time.',
        ok: 'Quit',
        cancel: 'Keep learning',
      });
      if (yes) finish(true);
    }

    // --- intro: "23 / 300" ------------------------------------------------------------
    function intro() {
      const done = doneCount();
      const topicName = opts.topic && opts.topic !== 'all' && B.deck.topicMap[opts.topic] ? ' · ' + B.deck.topicMap[opts.topic].name : '';
      const num = h('span', { class: 'intro-done' }, reducedMotion() ? String(done) : '0');
      const barFill = h('span', { class: 'intro-fill' });
      introEl = h('div', { class: 'intro', role: 'dialog', 'aria-label': `${done} of ${deckTotal} cards mastered` },
        h('div', { class: 'intro-inner' },
          h('div', { class: 'intro-mascot', 'aria-hidden': 'true' }, '🥨'),
          h('div', { class: 'intro-count' }, num, h('span', { class: 'intro-total' }, ' / ' + deckTotal)),
          h('div', { class: 'intro-label' }, 'cards mastered so far'),
          h('div', { class: 'intro-bar', 'aria-hidden': 'true' }, barFill),
          h('div', { class: 'intro-session' }, practice
            ? `Practising ${total} card${total === 1 ? '' : 's'} you got wrong before`
            : `This session: ${total} card${total === 1 ? '' : 's'}${topicName}`),
          h('div', { class: 'intro-tap' }, 'Tap anywhere to start')));
      introEl.addEventListener('click', dismissIntro);
      root.append(introEl);

      requestAnimationFrame(() => requestAnimationFrame(() => (barFill.style.width = (done / deckTotal) * 100 + '%')));
      if (!reducedMotion() && done > 0) {
        const t0 = performance.now();
        const step = (t) => {
          if (!introEl) return;
          const k = Math.min(1, (t - t0) / 900);
          num.textContent = String(Math.round(done * (1 - Math.pow(1 - k, 3))));
          if (k < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }
      introTimer = setTimeout(dismissIntro, 2600);
    }

    function dismissIntro() {
      if (!introEl) return;
      clearTimeout(introTimer);
      const el = introEl;
      introEl = null;
      el.classList.add('out');
      setTimeout(() => el.remove(), 260);
      focusCard();
    }

    // --- start ---------------------------------------------------------------------------
    showCard(false);
    paintProgress();
    intro();

    return {
      onKey(e) {
        if (e.isComposing || e.ctrlKey || e.metaKey || e.altKey) return;
        if (introEl) {
          if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
            e.preventDefault();
            dismissIntro();
          }
          return;
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          quit();
          return;
        }
        if (e.key === 'Enter' && e.repeat) {
          e.preventDefault();
          return;
        }
        if (phase === 'feedback') {
          if (e.key === 'Enter') {
            e.preventDefault();
            next();
          }
          return;
        }
        if (phase !== 'answer') return;
        if (ctrl && ctrl.key && ctrl.key(e)) {
          e.preventDefault();
          return;
        }
        if (e.key === 'Enter') {
          e.preventDefault();
          check(false);
        }
      },
      onBack: () => (introEl ? dismissIntro() : quit()),
      destroy() {
        clearTimeout(introTimer);
        if (B.audio.canSpeak) window.speechSynthesis.cancel();
      },
    };
  };
})();
