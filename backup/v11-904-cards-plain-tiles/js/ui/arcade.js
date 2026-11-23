/*
 * The game screen. "Start Gaming" on the home screen opens it with { topic, level } (level =
 * the difficulty setting: low | medium | high | mixed). It plays the topic's games in a shuffled
 * rotation: intro → 3-2-1 → game → results → "Another game?".
 * The frame around a game (score, combo, lives, timer, results) lives here; the games themselves
 * are plugins in js/games/ (contract: js/games/engine.js).
 * Game time only runs while the page is visible, so switching apps pauses the game.
 */
(function () {
  'use strict';
  const B = window.Brezel;
  const { h, md, show, shuffle, pulse, reducedMotion } = B.util;

  const LEVELS = { 1: 'Low', 2: 'Medium', 3: 'High' };
  const SETTING_LEVEL = { low: 1, medium: 2, high: 3 };
  const COMBO_AT = { 5: '5 in a row! ×2', 10: '10 in a row! ×3', 15: '15 in a row!', 20: '20 in a row — Wahnsinn!', 30: '30 in a row!!' };
  const HEART = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.6-9.3C.9 8.3 3 4.5 6.7 4.5c2.1 0 3.6 1.2 4.3 2.4h2c.7-1.2 2.2-2.4 4.3-2.4 3.7 0 5.8 3.8 4.3 7.2C19.5 16.4 12 21 12 21z"/></svg>';

  function levelFor(setting) {
    return SETTING_LEVEL[setting] || 1 + Math.floor(Math.random() * 3);
  }

  function bestScore(id, level) {
    return (B.store.state.games || []).filter((g) => g.game === id && g.level === level).reduce((m, g) => Math.max(m, g.score || 0), 0);
  }

  function artOf(def, big) {
    return def.art
      ? h('div', { class: 'g-art' + (big ? ' big' : ''), html: def.art, 'aria-hidden': 'true' })
      : h('div', { class: 'g-art g-art-emoji' + (big ? ' big' : ''), 'aria-hidden': 'true' }, def.icon || '🎮');
  }

  B.ui.arcade = function (root, opts) {
    const topic = opts.topic || 'all';
    const setting = opts.level || 'mixed';
    const available = B.games.forTopic(topic, SETTING_LEVEL[setting] || 2);
    if (!available.length) {
      setTimeout(() => {
        B.app.toast('Sorry, there are no games for this topic yet.');
        B.app.go('home');
      });
      return {};
    }
    const topicName = topic === 'all' ? 'All topics' : (B.deck.topicMap[topic] || {}).name || topic;

    // shuffled rotation; a requested game goes first
    let rotation = shuffle(available);
    if (opts.game) {
      const i = rotation.findIndex((g) => g.id === opts.game);
      if (i > 0) rotation.unshift(rotation.splice(i, 1)[0]);
    }
    let gi = 0;
    let run = null; // the game being played
    let overlay = null; // intro or results
    let overlayKey = null;

    const shell = h('div', { class: 'arcade' });
    root.append(shell);

    let pending = null; // the next rotation, once the current one is used up
    /** The game "Another game?" offers, without moving on yet. */
    function peekNext() {
      if (gi + 1 < rotation.length) return rotation[gi + 1];
      if (!pending) {
        const last = rotation[rotation.length - 1];
        pending = shuffle(available);
        if (pending.length > 1 && pending[0] === last) pending.push(pending.shift());
      }
      return pending[0];
    }
    function nextDef() {
      const def = peekNext();
      if (gi + 1 < rotation.length) gi++;
      else {
        rotation = pending;
        pending = null;
        gi = 0;
      }
      return def;
    }

    function setOverlay(el, onKey) {
      if (overlay) overlay.remove();
      overlay = el;
      overlayKey = onKey || null;
      if (el) shell.append(el);
    }

    // --- intro ---------------------------------------------------------------------------
    function intro(def) {
      if (run) run.stop();
      run = null;
      const level = levelFor(setting);
      shell.replaceChildren();
      shell.style.setProperty('--g', def.color || 'var(--blue)');
      shell.className = 'arcade is-intro';
      const go = h('button', { type: 'button', class: 'btn btn-primary btn-big g-go' }, 'Los geht’s!');
      go.addEventListener('click', () => start(def, level));
      const other = available.length > 1 ? h('button', { type: 'button', class: 'link-btn g-other' }, 'Play a different game →') : null;
      if (other) other.addEventListener('click', () => intro(nextDef()));
      const back = h('button', { type: 'button', class: 'icon-btn g-x', 'aria-label': 'Back home', title: 'Back (Esc)' }, '✕');
      back.addEventListener('click', () => B.app.go('home'));
      const best = bestScore(def.id, level);
      const card = h('div', { class: 'g-intro', role: 'dialog', 'aria-label': def.name },
        back,
        artOf(def, true),
        h('h1', { class: 'g-intro-name' }, def.name),
        h('p', { class: 'g-intro-blurb', html: md(def.blurb || '') }),
        h('div', { class: 'g-intro-tags' },
          h('span', { class: 'g-tag' }, topicName),
          h('span', { class: 'g-tag g-lv g-lv-' + level }, LEVELS[level] + (setting === 'mixed' ? ' · mixed' : '')),
          best ? h('span', { class: 'g-tag' }, '🏆 Best ' + best) : null),
        def.how && def.how.length ? h('ul', { class: 'g-how' }, def.how.map((x) => h('li', { html: md(x) }))) : null,
        go,
        other);
      setOverlay(h('div', { class: 'g-intro-wrap' }, card), (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          go.click();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          B.app.go('home');
        }
      });
      go.focus({ preventScroll: true });
    }

    // --- one game ----------------------------------------------------------------------------
    function start(def, level) {
      setOverlay(null);
      shell.replaceChildren();
      shell.className = 'arcade is-playing';

      const time = B.games.value(def.time, level) || 0;
      const maxLives = B.games.value(def.lives, level) || 0;
      const state = { score: 0, combo: 0, bestCombo: 0, correct: 0, wrong: 0, lives: maxLives, ended: false, started: false, mistakes: [], gt: 0, timeLeft: time };

      // frame
      const quitBtn = h('button', { type: 'button', class: 'icon-btn g-x', 'aria-label': 'Quit game', title: 'Quit (Esc)' }, '✕');
      quitBtn.addEventListener('click', () => quit());
      const scoreEl = h('b', {}, '0');
      const scorePill = h('div', { class: 'pill g-score', title: 'Score' }, h('span', { 'aria-hidden': 'true' }, '⭐'), ' ', scoreEl);
      const livesEl = maxLives ? h('div', { class: 'g-lives', 'aria-label': `${maxLives} lives` }) : null;
      const paintLives = () => {
        if (!livesEl) return;
        livesEl.replaceChildren(...Array.from({ length: maxLives }, (_, i) => h('span', { class: 'g-heart' + (i < state.lives ? '' : ' lost'), html: HEART })));
        livesEl.setAttribute('aria-label', `${state.lives} of ${maxLives} lives left`);
      };
      paintLives();
      const timerFill = h('span', {});
      const timerText = h('span', { class: 'g-time-text' });
      const bar = h('div', { class: 'g-bar' + (time ? '' : ' is-rounds') }, h('div', { class: 'g-timer' }, timerFill), timerText);
      const comboEl = h('div', { class: 'g-combo', 'aria-live': 'polite' });
      const stage = h('main', { class: 'g-stage' });
      shell.append(
        h('header', { class: 'g-top' },
          quitBtn,
          h('div', { class: 'g-name' }, h('span', { 'aria-hidden': 'true' }, def.icon || '🎮'), h('span', { class: 'g-name-text' }, def.name)),
          h('span', { class: 'g-tag g-lv g-lv-' + level }, LEVELS[level]),
          livesEl,
          scorePill),
        bar,
        comboEl,
        stage);

      // --- game clock: one rAF loop drives every timer, and stops while the page is hidden ----
      const tasks = []; // { at, fn, every? }
      const frames = new Set();
      const waits = new Set();
      let raf = 0;
      let lastT = 0;
      let lastTick = Math.ceil(time);

      function loop(t) {
        raf = requestAnimationFrame(loop);
        const dt = lastT ? Math.max(0, Math.min(100, t - lastT)) : 16;
        lastT = t;
        if (document.hidden || !state.started || state.ended) return;
        state.gt += dt;
        if (time) {
          state.timeLeft = Math.max(0, time - state.gt / 1000);
          timerFill.style.width = (state.timeLeft / time) * 100 + '%';
          const secs = Math.ceil(state.timeLeft);
          timerText.textContent = secs + ' s';
          bar.classList.toggle('low', state.timeLeft <= 10);
          if (secs < lastTick) {
            lastTick = secs;
            if (secs <= 5 && secs > 0) B.audio.play('tick');
          }
          if (state.timeLeft <= 0) {
            if (!state.timeUp) {
              // once only: a game's timeUp() may finish its last move before calling api.end()
              state.timeUp = true;
              if (ctrl && ctrl.timeUp) ctrl.timeUp();
              else api.end({ note: 'Time’s up!' });
            }
            return;
          }
        }
        for (const fn of Array.from(frames)) {
          if (state.ended) return;
          let keep;
          try {
            keep = fn(dt, state.gt);
          } catch (err) {
            console.error('[Brezel] game frame failed', def.id, err);
            keep = false;
          }
          if (keep === false) frames.delete(fn);
        }
        for (let i = 0; i < tasks.length; i++) {
          const task = tasks[i];
          if (state.ended) return;
          if (task.at > state.gt) continue;
          if (task.every) task.at += task.every;
          else tasks.splice(i--, 1);
          try {
            task.fn();
          } catch (err) {
            console.error('[Brezel] game timer failed', def.id, err);
          }
        }
      }

      function stopClock() {
        cancelAnimationFrame(raf);
        tasks.length = 0;
        frames.clear();
        for (const r of waits) r(false);
        waits.clear();
      }

      // --- the api handed to the game -----------------------------------------------------------
      function floatAt(el, text, cls) {
        const box = shell.getBoundingClientRect();
        const r = (el && el.isConnected ? el : scorePill).getBoundingClientRect();
        const f = h('div', { class: 'g-float ' + (cls || ''), 'aria-hidden': 'true' }, text);
        f.style.left = r.left - box.left + r.width / 2 + 'px';
        f.style.top = r.top - box.top + r.height / 2 + 'px';
        shell.append(f);
        setTimeout(() => f.remove(), 950);
      }

      const api = {
        topic,
        level,
        get ended() {
          return state.ended;
        },
        get score() {
          return state.score;
        },
        get combo() {
          return state.combo;
        },
        get lives() {
          return state.lives;
        },
        get timeLeft() {
          return state.timeLeft;
        },
        hit({ points = 10, el = null, text = null } = {}) {
          if (state.ended) return 0;
          state.correct++;
          state.combo++;
          state.bestCombo = Math.max(state.bestCombo, state.combo);
          const mult = state.combo >= 10 ? 3 : state.combo >= 5 ? 2 : 1;
          const pts = Math.round(points * mult);
          state.score += pts;
          scoreEl.textContent = String(state.score);
          pulse(scorePill, 'bump');
          floatAt(el, text || '+' + pts, 'good');
          B.audio.play('correct');
          if (COMBO_AT[state.combo]) {
            comboEl.textContent = '🔥 ' + COMBO_AT[state.combo];
            pulse(comboEl, 'show');
            setTimeout(() => B.audio.play('combo'), 200);
          }
          return pts;
        },
        miss({ q = null, a = null, given = null, el = null } = {}) {
          if (state.ended) return;
          state.wrong++;
          state.combo = 0;
          if (q || a) state.mistakes.push({ q, a, given });
          B.audio.play('wrong');
          floatAt(el, '✗', 'bad');
          pulse(el && el.isConnected ? el : stage, 'g-shake');
          if (maxLives) {
            state.lives = Math.max(0, state.lives - 1);
            paintLives();
            if (livesEl) pulse(livesEl, 'g-shake');
            if (!state.lives) api.after(650, () => api.end({ won: false, note: 'Out of lives' }));
          }
        },
        progress(done, total) {
          if (time) return;
          bar.classList.remove('is-empty');
          timerFill.style.width = (total ? (done / total) * 100 : 0) + '%';
          timerText.textContent = `${done} / ${total}`;
        },
        end(extra = {}) {
          if (state.ended) return;
          state.ended = true;
          stopClock();
          try {
            if (ctrl && ctrl.destroy) ctrl.destroy();
          } catch (err) {
            console.error('[Brezel] game destroy failed', def.id, err);
          }
          results(def, level, state, extra);
        },
        speak: (text, o) => B.audio.speak(text, o),
        sfx: (name) => B.audio.play(name),
        after(ms, fn) {
          if (!state.ended) tasks.push({ at: state.gt + ms, fn });
        },
        every(ms, fn) {
          if (!state.ended) tasks.push({ at: state.gt + ms, fn, every: Math.max(16, ms) });
        },
        frame(fn) {
          if (!state.ended) frames.add(fn);
          return () => frames.delete(fn);
        },
        wait(ms) {
          return new Promise((resolve) => {
            if (state.ended) return resolve(false);
            waits.add(resolve);
            tasks.push({ at: state.gt + ms, fn: () => waits.delete(resolve) && resolve(true) });
          });
        },
      };

      let ctrl = null;
      run = {
        def,
        state,
        stop() {
          if (!state.ended) {
            state.ended = true;
            stopClock();
            try {
              if (ctrl && ctrl.destroy) ctrl.destroy();
            } catch (err) {
              /* leaving anyway */
            }
          }
          cancelAnimationFrame(raf);
        },
        key: (e) => ctrl && ctrl.key && ctrl.key(e),
      };

      try {
        ctrl = def.play(stage, api) || {};
      } catch (err) {
        console.error('[Brezel] game failed to start', def.id, err);
        B.app.toast('This game could not start — trying another one.');
        run.stop();
        return available.length > 1 ? intro(nextDef()) : B.app.go('home');
      }
      if (time) {
        timerFill.style.width = '100%';
        timerText.textContent = Math.ceil(time) + ' s';
      } else if (!timerText.textContent) bar.classList.add('is-empty');
      raf = requestAnimationFrame(loop);
      countdown(() => {
        state.started = true;
        if (ctrl.begin) ctrl.begin();
      });
    }

    function countdown(done) {
      if (reducedMotion()) return done();
      const steps = ['3', '2', '1', 'Los!'];
      const el = h('div', { class: 'g-count', 'aria-hidden': 'true' });
      shell.append(el);
      let i = 0;
      const step = () => {
        if (!el.isConnected) return;
        if (i >= steps.length) {
          el.remove();
          return done();
        }
        el.replaceChildren(h('span', { class: i === steps.length - 1 ? 'go' : '' }, steps[i]));
        B.audio.play(i === steps.length - 1 ? 'go' : 'tick');
        i++;
        setTimeout(step, i === steps.length ? 420 : 560);
      };
      step();
    }

    // --- results + "Another game?" ------------------------------------------------------------
    function results(def, level, state, extra) {
      const ms = Math.round(state.gt);
      const perfect = state.wrong === 0 && state.correct > 0;
      const won = extra.won === true ? true : extra.won === false ? false : null;
      const prevBest = bestScore(def.id, level);
      const record = state.score > prevBest && state.score > 0;
      const xp = Math.min(60, state.correct * 2 + (won ? 15 : 0) + (perfect ? 10 : 0));
      B.store.recordGame({
        game: def.id, topic, level, score: state.score, correct: state.correct, wrong: state.wrong,
        won, perfect, ms, xp, bestCombo: state.bestCombo,
      });
      if (B.achievements) B.achievements.evaluate();

      const title = won === true ? 'Gewonnen!' : won === false ? (extra.note === 'Out of lives' ? 'Game over' : 'Knapp daneben!') : perfect ? 'Perfekt!' : state.correct >= 10 ? 'Super gespielt!' : 'Fertig!';
      const sub = extra.note && extra.note !== 'Out of lives' ? extra.note : won === false ? 'No lives left — have another go!' : perfect ? 'Not a single mistake.' : '';
      const scoreNum = h('div', { class: 'g-res-score' }, '0');
      const next = available.length > 1 ? peekNext() : null;
      const nextBtn = next ? h('button', { type: 'button', class: 'btn btn-primary btn-big' }, h('span', { 'aria-hidden': 'true' }, '▶ '), 'Yes — ' + next.name) : null;
      if (nextBtn) nextBtn.addEventListener('click', () => intro(nextDef()));
      const againBtn = h('button', { type: 'button', class: 'btn ' + (next ? 'btn-outline' : 'btn-primary btn-big') }, h('span', { 'aria-hidden': 'true' }, '↻ '), next ? 'Play this again' : 'Yes — play again');
      againBtn.addEventListener('click', () => intro(def));
      const homeBtn = h('button', { type: 'button', class: 'btn btn-outline' }, 'No, thanks');
      homeBtn.addEventListener('click', () => B.app.go('home'));

      const stat = (icon, val, label) => h('div', { class: 'g-res-stat' }, h('span', { 'aria-hidden': 'true' }, icon), h('b', {}, String(val)), h('small', {}, label));
      const mistakes = state.mistakes.slice(0, 8);
      const card = h('div', { class: 'g-results', role: 'dialog', 'aria-label': 'Results' },
        artOf(def, false),
        h('h1', { class: 'g-res-title' }, title),
        sub ? h('p', { class: 'g-res-sub' }, sub) : null,
        scoreNum,
        h('div', { class: 'g-res-best' }, record ? h('span', { class: 'g-record' }, prevBest ? '🏆 New best score!' : '🏆 First score!') : `Best: ${prevBest}`),
        h('div', { class: 'g-res-stats' },
          stat('✓', state.correct, 'right'),
          stat('✗', state.wrong, 'wrong'),
          stat('🔥', state.bestCombo, 'best combo'),
          stat('⚡', '+' + xp, 'XP')),
        mistakes.length
          ? h('details', { class: 'g-res-miss' }, h('summary', {}, `Your mistakes (${state.mistakes.length})`),
            h('ul', {}, mistakes.map((m) => h('li', {},
              m.q ? h('span', { class: 'g-miss-q', html: B.ex.richText(m.q) }) : null,
              m.given ? h('s', {}, show(m.given)) : null,
              m.a ? h('b', { html: '→ ' + md(show(m.a)) }) : null))))
          : null,
        h('div', { class: 'g-again' },
          h('h2', {}, 'Noch ein Spiel?'),
          h('p', { class: 'muted' }, 'Another game?'),
          nextBtn,
          h('div', { class: 'g-again-row' }, againBtn, homeBtn)));
      shell.className = 'arcade is-results';
      setOverlay(h('div', { class: 'g-results-wrap' }, card), (e) => {
        if (e.key === 'Enter' && (e.target === document.body || e.target.tagName !== 'BUTTON')) {
          e.preventDefault();
          (nextBtn || againBtn).click();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          B.app.go('home');
        }
      });
      B.audio.play(won === false ? 'wrong' : 'complete');
      if (won || perfect || record) setTimeout(() => B.app.confetti(won ? 160 : 90), 200);
      // count the score up
      if (reducedMotion() || !state.score) scoreNum.textContent = String(state.score);
      else {
        const t0 = performance.now();
        const step = (t) => {
          if (!scoreNum.isConnected) return;
          const k = Math.min(1, (t - t0) / 900);
          scoreNum.textContent = String(Math.round(state.score * (1 - Math.pow(1 - k, 3))));
          if (k < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }
      (nextBtn || againBtn).focus({ preventScroll: true });
    }

    async function quit() {
      if (!run || run.state.ended) return B.app.go('home');
      const yes = await B.app.confirm({ title: 'Quit this game?', text: 'This round won’t be scored.', ok: 'Quit', cancel: 'Keep playing' });
      if (yes) {
        run.stop();
        B.app.go('home');
      }
    }

    intro(rotation[0]);

    return {
      onKey(e) {
        if (e.isComposing || e.ctrlKey || e.metaKey || e.altKey) return;
        if (overlayKey) return overlayKey(e);
        if (!run || run.state.ended) return;
        if (e.key === 'Escape') {
          e.preventDefault();
          quit();
          return;
        }
        if (!run.state.started) return;
        if (run.key(e)) e.preventDefault();
      },
      onBack: () => quit(),
      destroy() {
        if (run) run.stop();
        if (B.audio.canSpeak) window.speechSynthesis.cancel();
      },
    };
  };
})();
