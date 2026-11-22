/*
 * Typed-answer checking.
 * Rule: one wrong letter is forgiven (a typo) — two is wrong.
 * Exceptions, so the typo rule never accepts wrong grammar:
 *   - if the "typo" is actually another real form of the same word
 *     (wohne vs wohnt, dem vs den, meine vs meiner) it counts as wrong;
 *   - short words (3 letters or less, e.g. "ist", "dem", "im") must be exact,
 *     on their own or inside a longer answer.
 * Umlauts may be typed as ae/oe/ue and ß as ss.
 */
(function () {
  'use strict';
  const B = window.Brezel;
  const { norm, levenshtein } = B.util;

  /** The one word that differs between two normalised answers, if exactly one does. */
  function diffWord(input, answer) {
    const x = input.split(' ');
    const y = answer.split(' ');
    if (x.length !== y.length) return null;
    const diff = [];
    for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) diff.push(i);
    return diff.length === 1 ? { got: x[diff[0]], want: y[diff[0]] } : null;
  }

  /** Would the single-letter difference between a and b change the grammar? */
  function isOtherForm(input, answer) {
    const d = diffWord(input, answer);
    return !!d && B.deck.sameFamily(d.got, d.want);
  }

  /**
   * @param {string} input   what the learner typed
   * @param {string[]} answers accepted answers (first = the one we show)
   * @param {{reject?: string[], strict?: boolean, nounHint?: boolean}} opts
   * @returns {{ok:boolean, exact?:boolean, typo?:boolean, reason?:string, matched:string, caseNote?:string}}
   */
  function typed(input, answers, opts = {}) {
    const raw = String(input == null ? '' : input).trim();
    const ni = norm(raw);
    const list = answers.map((a) => ({ raw: a, n: norm(a) }));
    const fallback = list[0] ? list[0].raw : '';
    if (!ni) return { ok: false, empty: true, matched: fallback };

    for (const a of list) {
      if (a.n === ni) return { ok: true, exact: true, matched: a.raw, caseNote: caseNote(raw, a.raw, opts) };
    }

    const reject = new Set((opts.reject || []).map(norm));
    if (reject.has(ni)) return { ok: false, reason: 'form', matched: fallback };

    if (!opts.strict) {
      for (const a of list) {
        if (a.n.length <= 3) continue;
        if (levenshtein(ni, a.n) !== 1) continue;
        if (isOtherForm(ni, a.n)) return { ok: false, reason: 'form', matched: a.raw };
        // inside a longer answer, a slip in a tiny word (ist/bin, im/in) is not a typo either
        const d = diffWord(ni, a.n);
        if (d && d.want.length <= 3) return { ok: false, reason: 'short', matched: a.raw };
        return { ok: true, typo: true, matched: a.raw, caseNote: caseNote(raw, a.raw, opts) };
      }
    }
    return { ok: false, matched: fallback };
  }

  /** Nouns (and formal Sie) are capitalised in German — remind gently when the learner didn't. */
  function caseNote(raw, answer, opts) {
    if (/\sSie\b/.test(answer) && /\ssie\b/.test(raw)) return 'Tip: formal **Sie** (you) is always written with a capital S.';
    if (!opts.nounHint) return null;
    const a = answer.trim();
    const first = a.charAt(0);
    if (first && first === first.toUpperCase() && first !== first.toLowerCase() && raw.charAt(0) === raw.charAt(0).toLowerCase()) {
      return `Remember: German nouns start with a capital letter — **${a}**.`;
    }
    return null;
  }

  B.check = { typed, isOtherForm };
})();
