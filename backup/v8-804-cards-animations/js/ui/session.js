/*
 * A learning session.
 *  - The queue is the reviews due today, then new cards (optionally one topic), cut to the session
 *    size and shuffled. Reviews come first, so a mastered card never waits past its day (js/core/srs.js).
 *  - A wrong answer shows the correct one and puts the card back at a random later position.
 *  - Only correct answers count as mastered (practice mode never changes mastery).
 *  - opts.level (low | medium | high | mixed) keeps only cards of that difficulty (js/core/level.js);
 *    a card and its easier copy are never in the same session.
 * The 📖 Glossary button (or G) shows the question's words in English and the card's rule.
 * 💡 Help me (or H) gives a hint, step by step (the exercise decides what: a first letter, two wrong
 * options gone, a word placed …). Each hint costs XP; the answer still counts when it is right.
 * Keys: Enter = check / continue, 1–6 = choose, G = Glossary, H = Help me, Esc = quit.
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
  const XP_HINT = 3; // each Help me hint costs this much of the card's XP (never below XP_MIN)
  const XP_MIN = 2;

  function buildQueue({ topic, size, practice, level }) {
    const lv = practice ? null : level;
    let list = practice ? shuffle(B.stats.mistakeCards()) : shuffle(B.stats.due(topic, lv)).concat(shuffle(B.stats.fresh(topic, lv)));
    // a card and its easier copy never come in the same session (reviews win: they come first)
    const seen = new Set();
    list = list.filter((c) => {
      const k = B.level.base(c);
      return !seen.has(k) && seen.add(k);
    });
    return shuffle(size ? list.slice(0, size) : list);
  }

  // feedback marks that draw themselves (css: .fb-icon)
  const MARK_OK = '<svg viewBox="0 0 40 40" aria-hidden="true"><circle class="fb-ring" cx="20" cy="20" r="16" pathLength="1"/><path class="fb-mark" d="M12.5 20.5l5 5 10-11" pathLength="1"/></svg>';
  const MARK_BAD = '<svg viewBox="0 0 40 40" aria-hidden="true"><circle class="fb-ring" cx="20" cy="20" r="16" pathLength="1"/><path class="fb-mark" d="M14.5 14.5l11 11" pathLength="1"/><path class="fb-mark fb-mark-2" d="M25.5 14.5l-11 11" pathLength="1"/></svg>';
  // the combo flame in the top bar: orange from 2 in a row, blue from 5, purple from 10
  const FLAME = '<svg viewBox="0 0 32 40" aria-hidden="true"><path class="fl-outer" d="M16 1.5c1.6 6.4 10.5 10.6 10.5 21.3a10.5 10.5 0 0 1-21 0c0-6.2 3.2-9.6 5.4-12.4.2 3.8 1.8 6 4 6.4-1.4-5-1-10.4 1.1-15.3z"/><path class="fl-inner" d="M16 17c1 3.8 6 6 6 10.8a6 6 0 0 1-12 0c0-3.2 1.8-5.2 3.2-6.8.1 1.9.9 3 2 3.2-.5-2.6-.3-4.8.8-7.2z"/></svg>';

  /** Little stars and dots flying out of an element (a right answer). */
  function starBurst(el) {
    if (!el || reducedMotion() || typeof Element.prototype.animate !== 'function') return;
    const r = el.getBoundingClientRect();
    const layer = h('div', { class: 'burst', 'aria-hidden': 'true', style: { left: r.left + r.width / 2 + 'px', top: r.top + r.height / 2 + 'px' } });
    document.body.append(layer);
    const colors = ['#ffc800', '#58cc02', '#1cb0f6', '#ff9600', '#ce82ff'];
    for (let i = 0; i < 14; i++) {
      const star = i % 3 === 0;
      const p = h('i', { class: star ? 'burst-star' : 'burst-dot', style: { color: pick(colors) } });
      if (star) p.innerHTML = '<svg viewBox="0 0 20 20"><path d="M10 1l2.6 5.6 6.1.7-4.5 4.2 1.2 6L10 14.5 4.6 17.5l1.2-6L1.3 7.3l6.1-.7z" fill="currentColor"/></svg>';
      layer.append(p);
      const a = (Math.PI * 2 * i) / 14 + Math.random() * 0.4;
      const d = randInt(46, 96);
      p.animate(
        [
          { transform: 'translate(-50%, -50%) scale(0.3) rotate(0deg)', opacity: 1 },
          { transform: `translate(calc(-50% + ${Math.cos(a) * d}px), calc(-50% + ${Math.sin(a) * d - 18}px)) scale(1) rotate(${randInt(-160, 160)}deg)`, opacity: 1, offset: 0.7 },
          { transform: `translate(calc(-50% + ${Math.cos(a) * d * 1.15}px), calc(-50% + ${Math.sin(a) * d * 1.15 + 6}px)) scale(0.6)`, opacity: 0 },
        ],
        { duration: randInt(620, 900), easing: 'cubic-bezier(.2,.8,.3,1)', fill: 'forwards' }
      );
    }
    setTimeout(() => layer.remove(), 1000);
  }

  /** "+10 XP" flies from the feedback chip up to the XP counter; done() runs when it lands. */
  function flyTo(from, to, text, done) {
    if (!from || !to || reducedMotion() || typeof Element.prototype.animate !== 'function') return done();
    const a = from.getBoundingClientRect();
    const b = to.getBoundingClientRect();
    const chip = h('div', { class: 'xp-fly', 'aria-hidden': 'true', style: { left: a.left + 'px', top: a.top + 'px', width: a.width + 'px', height: a.height + 'px' } }, text);
    document.body.append(chip);
    const dx = b.left + b.width / 2 - (a.left + a.width / 2);
    const dy = b.top + b.height / 2 - (a.top + a.height / 2);
    const anim = chip.animate(
      [
        { transform: 'translate(0, 0) scale(1)', opacity: 1 },
        { transform: `translate(${dx * 0.35}px, ${dy * 0.5 - 40}px) scale(1.15)`, opacity: 1, offset: 0.35 },
        { transform: `translate(${dx}px, ${dy}px) scale(0.45)`, opacity: 0.2 },
      ],
      { duration: 760, delay: 280, easing: 'cubic-bezier(.45,0,.3,1)', fill: 'forwards' }
    );
    const finish = () => {
      chip.remove();
      done();
    };
    anim.onfinish = finish;
    anim.oncancel = finish;
  }

  /** ●●●○○○ — a review card's step. */
  function stepDots(lv) {
    return h('span', { class: 'step-dots', 'aria-hidden': 'true' }, '●'.repeat(lv) + '○'.repeat(B.srs.MAX - lv));
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
    const level = practice ? 'mixed' : opts.level || 'mixed';
    const reviews = new Set(practice ? [] : queue.filter((c) => B.store.isDone(c.id)).map((c) => c.id));
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
    let hintsUsed = 0; // on the card on screen
    let hintEl = null;
    const startedAt = Date.now();
    B.store.beginSession(practice, { level, size: opts.size || 0, total });

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
    const flameNum = h('b', { class: 'flame-n' });
    const flameEl = h('div', { class: 'flame', title: 'Right answers in a row', 'aria-hidden': 'true' }, h('span', { class: 'flame-pic', html: FLAME }), flameNum);
    const xpNum = h('b', {}, '0');
    const xpPill = h('div', { class: 'pill xp-pill', title: 'XP this session' }, h('span', { 'aria-hidden': 'true' }, '⚡'), ' ', xpNum, h('span', { class: 'sr-only' }, ' XP'));
    let xpShown = 0;
    const stage = h('main', { class: 's-stage' });
    const skipBtn = h('button', { class: 'btn btn-ghost skip-btn', type: 'button' }, 'I don’t know');
    skipBtn.addEventListener('click', () => check(true));
    const helpBtn = h('button', { class: 'btn btn-outline help-btn', type: 'button', 'aria-label': 'Help me', title: 'A hint, step by step (H) — costs a little XP' },
      h('span', { class: 'help-icon', 'aria-hidden': 'true' }, '💡'), h('span', { class: 'help-btn-label' }, 'Help me'), h('span', { class: 'help-dots', 'aria-hidden': 'true' }));
    helpBtn.addEventListener('click', () => useHint());
    const glossBtn = h('button', { class: 'btn btn-outline gloss-btn', type: 'button', 'aria-label': 'Glossary', title: 'Words and rule (G)' },
      h('span', { 'aria-hidden': 'true' }, '📖'), h('span', { class: 'gloss-btn-label' }, 'Glossary'));
    glossBtn.addEventListener('click', () => openGlossary());
    const mainBtn = h('button', { class: 'btn btn-primary main-btn', type: 'button' }, 'Check');
    mainBtn.addEventListener('click', () => (phase === 'feedback' ? next() : check(false)));
    const feedback = h('div', { class: 'feedback', 'aria-live': 'polite' });
    const foot = h('footer', { class: 's-foot' }, feedback, h('div', { class: 's-foot-inner' }, skipBtn, helpBtn, glossBtn, mainBtn));

    root.append(h('div', { class: 'session' + (practice ? ' is-practice' : '') },
      h('header', { class: 's-top' }, quitBtn, bar, flameEl, xpPill, totalPill),
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
      /** Speak a German word the learner just picked (a choice, chip or tile) — only with sound on. */
      say(text) {
        if (text && B.store.setting('sound')) B.audio.speak(show(text));
      },
      get card() {
        return card;
      },
    };

    // --- flow ------------------------------------------------------------------------
    function showCard(animate) {
      B.gloss.hideTip();
      card = queue[idx];
      const def = B.ex.get(card.type);
      const topic = B.deck.topicMap[card.topic];
      const prev = B.store.cardState(card.id);
      const tag = missed.has(card.id)
        ? h('span', { class: 'again-tag' }, '↻ Try again')
        : reviews.has(card.id)
          ? h('span', { class: 'again-tag is-review', title: `Review · step ${prev.lv || 1} of ${B.srs.MAX}` }, '🔁 Review ', stepDots(prev.lv || 1))
          : prev && prev.w
            ? h('span', { class: 'again-tag old' }, '↻ Missed before')
            : null;
      const exRoot = h('div', { class: 'ex ex-' + card.type });
      const lv = B.level.of(card);
      hintEl = h('div', { class: 'hint-note', 'aria-live': 'polite', hidden: true });
      const wrap = h('div', { class: 's-card' + (animate ? ' enter' : '') },
        h('div', { class: 'card-meta' },
          h('span', { class: 'topic-tag' }, h('span', { class: 'tag-art', 'aria-hidden': 'true', html: B.art.topic(card.topic) }), topic.name),
          h('span', { class: 'level-tag lv-' + lv, title: 'Difficulty' }, B.level.name(lv)),
          tag),
        exRoot,
        hintEl);
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
      hintsUsed = 0;
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
      paintHelp();
      if (!introEl) focusCard();
    }

    // --- 💡 Help me ------------------------------------------------------------------------------
    const hintMax = () => (ctrl && ctrl.hint && ctrl.hints ? ctrl.hints : 0);

    function paintHelp() {
      const max = hintMax();
      const left = Math.max(0, max - hintsUsed);
      helpBtn.disabled = !left;
      helpBtn.title = !max ? 'No hints for this kind of card' : left ? `A hint, step by step (H) — ${left} left, each costs ${XP_HINT} XP` : 'No more hints for this card';
      helpBtn.querySelector('.help-dots').textContent = max > 1 ? '●'.repeat(left) + '○'.repeat(max - left) : '';
    }

    function useHint() {
      if (phase !== 'answer' || introEl || hintsUsed >= hintMax()) return;
      let res = null;
      try {
        res = ctrl.hint(hintsUsed + 1);
      } catch (err) {
        console.error('[Brezel] hint failed', card.id, err);
      }
      if (!res) {
        hintsUsed = hintMax();
        return paintHelp();
      }
      hintsUsed++;
      B.audio.play('tap');
      if (res.note || res.html) {
        hintEl.hidden = false;
        // res.html: markup built by the exercise itself (already escaped)
        hintEl.replaceChildren(h('span', { class: 'hint-icon', 'aria-hidden': 'true' }, '💡'), h('span', { html: res.html || md(res.note) }));
        pulse(hintEl, 'reveal');
      }
      paintHelp();
      if (B.achievements) B.achievements.evaluate();
      focusCard();
    }

    function focusCard() {
      if (ctrl && ctrl.focus) ctrl.focus();
      else if (document.activeElement && document.activeElement !== document.body && !stage.contains(document.activeElement)) document.activeElement.blur();
    }

    function openGlossary() {
      if (phase !== 'answer' || introEl) return;
      B.glossary.open(card, ctrl && ctrl.glossTexts ? ctrl.glossTexts() : B.ex.questionTexts(card));
    }

    function check(skipped) {
      if (phase !== 'answer' || introEl) return;
      if (!skipped && !ready) return;
      phase = 'feedback';
      B.gloss.hideTip();
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
        gained = Math.max(XP_MIN, XP_CORRECT - hintsUsed * XP_HINT) + (combo >= 5 ? XP_COMBO : 0);
        cleared.add(card.id);
        if (firstSeen) firstTry++;
      } else {
        combo = 0;
        missed.add(card.id);
        requeue();
      }
      xp += gained;
      const { newlyDone, due } = B.store.record(card, ok, res.skipped ? '(skipped)' : res.given, ms, { practice, xp: gained, hints: hintsUsed, skipped: !!res.skipped });
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
      paintFlame(ok);
      renderFeedback(res, ok, gained, due);
      setFooter(ok ? 'good' : 'bad');
      if (ok) starBurst(mainBtn);
      if (gained) {
        const target = xp;
        flyTo(feedback.querySelector('.fb-xp'), xpPill, '+' + gained, () => countXP(target));
      }
      if (B.achievements) B.achievements.evaluate();
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

    /** The flame grows with the combo; a mistake blows it out. */
    function paintFlame(ok) {
      const lit = combo >= 2;
      if (!ok && flameEl.classList.contains('lit')) {
        flameEl.classList.remove('lit');
        pulse(flameEl, 'puff');
        return;
      }
      flameEl.classList.toggle('lit', lit);
      flameEl.classList.toggle('t2', combo >= 5 && combo < 10);
      flameEl.classList.toggle('t3', combo >= 10);
      flameEl.style.setProperty('--fs', String(Math.min(1.35, 0.85 + combo * 0.035)));
      flameNum.textContent = lit ? String(combo) : '';
      if (lit) pulse(flameEl, 'grow');
    }

    function countXP(target) {
      const from = xpShown;
      xpShown = target;
      pulse(xpPill, 'bump');
      if (reducedMotion()) return (xpNum.textContent = String(target));
      const t0 = performance.now();
      const step = (t) => {
        const k = Math.min(1, (t - t0) / 450);
        xpNum.textContent = String(Math.round(from + (target - from) * k));
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }

    function showCombo(n) {
      comboEl.textContent = '🔥 ' + COMBOS[n];
      pulse(comboEl, 'show');
      setTimeout(() => B.audio.play('combo'), 260);
    }

    function renderFeedback(res, ok, gained, due) {
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
      if (ok && due != null) body.push(h('div', { class: 'fb-next' }, `📅 This card comes back ${B.srs.when(due, B.srs.day())} for a review.`));
      if (!ok) {
        body.push(h('div', { class: 'fb-again' }, comeBackGap === 0
          ? '↻ This card comes straight back — try it again.'
          : '↻ This card goes back into the pile — you’ll see it again later.'));
      }

      feedback.replaceChildren(h('div', { class: 'fb-inner' },
        h('div', { class: 'fb-head' },
          h('span', { class: 'fb-icon', 'aria-hidden': 'true', html: ok ? MARK_OK : MARK_BAD }),
          h('h3', { class: 'fb-title' }, title),
          gained ? h('span', { class: 'fb-xp', title: hintsUsed ? `${hintsUsed} hint${hintsUsed > 1 ? 's' : ''} used` : null }, `+${gained} XP` + (hintsUsed ? ' · 💡' + hintsUsed : '')) : null,
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
        helpBtn.hidden = false;
        glossBtn.hidden = false;
        return;
      }
      foot.classList.add('has-feedback', mode === 'good' ? 'is-good' : 'is-bad');
      mainBtn.textContent = 'Continue';
      mainBtn.className = 'btn main-btn ' + (mode === 'good' ? 'btn-primary' : 'btn-danger');
      mainBtn.disabled = false;
      skipBtn.hidden = true;
      helpBtn.hidden = true;
      glossBtn.hidden = true;
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
      B.store.endSession({ bestCombo, quit: !!quitEarly, fixed: practice ? cleared.size : 0 });
      if (B.achievements) B.achievements.evaluate();
      B.app.go('summary', {
        practice,
        opts,
        total,
        answered,
        correct,
        wrong: answered - correct,
        firstTry,
        reviewed: [...reviews].filter((id) => cleared.has(id)).length,
        cleared: cleared.size,
        missed: [...missed],
        mastered,
        xp,
        bestCombo,
        ms: Date.now() - startedAt,
        quit: !!quitEarly,
        level,
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
            : `This session: ${total} card${total === 1 ? '' : 's'}${reviews.size ? ` (${reviews.size} to review)` : ''}${topicName}` + (level !== 'mixed' ? ` · ${B.level.SETTINGS.find((x) => x.key === level).name}` : '')),
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
          if (B.gloss.tipOpen()) B.gloss.hideTip();
          else quit();
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
        if ((e.key === 'g' || e.key === 'G') && !/^(INPUT|TEXTAREA)$/.test(e.target.tagName)) {
          e.preventDefault();
          openGlossary();
          return;
        }
        if ((e.key === 'h' || e.key === 'H') && !/^(INPUT|TEXTAREA)$/.test(e.target.tagName)) {
          e.preventDefault();
          useHint();
          return;
        }
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
        B.gloss.hideTip();
        if (B.audio.canSpeak) window.speechSynthesis.cancel();
      },
    };
  };
})();
