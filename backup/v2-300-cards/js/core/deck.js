/*
 * The deck registry. Content files in /data call:
 *   Brezel.deck.addTopics([...])
 *   Brezel.deck.addVerbs({...}), addFamilies([...]), addProperNouns([...])
 *   Brezel.deck.addCards('topicId', [...])
 * finalize() then validates everything; broken cards are skipped and reported
 * in the console (and by tools/validate.js), so one typo never breaks the app.
 */
(function () {
  'use strict';
  const B = window.Brezel;
  const { norm } = B.util;

  const PRONOUNS = ['ich', 'du', 'er/sie/es', 'wir', 'ihr', 'sie/Sie'];

  const deck = {
    topics: [],
    topicMap: Object.create(null),
    rawCards: [],
    cards: [], // valid cards, after finalize()
    cardMap: Object.create(null),
    verbs: Object.create(null),
    families: [],
    properNouns: new Set(),
    problems: [],
    PRONOUNS,

    addTopics(list) {
      for (const t of list) {
        this.topics.push(t);
        this.topicMap[t.id] = t;
      }
    },

    addCards(topicId, list) {
      for (const c of list) this.rawCards.push(Object.assign({ topic: topicId }, c));
    },

    /** verbs: { wohnen: { en, forms: [6 present forms], pp, aux } } */
    addVerbs(obj) {
      for (const [inf, v] of Object.entries(obj)) this.verbs[inf] = Object.assign({ inf }, v);
    },

    /** Groups of words that differ by one letter but are different grammar (dem/den/der). */
    addFamilies(list) {
      for (const f of list) this.families.push(f);
    },

    addProperNouns(list) {
      for (const w of list) this.properNouns.add(w);
    },

    /** Table rows for a verb: [['ich','wohne'], ['du','wohnst'], ...] */
    verbRows(inf) {
      const v = this.verbs[inf];
      return v ? PRONOUNS.map((p, i) => [p, v.forms[i]]) : null;
    },

    /** True when a and b are different members of the same word family (e.g. wohnt/wohne). */
    sameFamily(a, b) {
      const fa = this._familyIndex.get(norm(a));
      const fb = this._familyIndex.get(norm(b));
      if (!fa || !fb) return false;
      for (const id of fa) if (fb.has(id)) return true;
      return false;
    },

    _familyIndex: new Map(),

    _buildFamilies() {
      const idx = new Map();
      const add = (words, id) => {
        for (const w of words) {
          if (!w) continue;
          const k = norm(w);
          if (!idx.has(k)) idx.set(k, new Set());
          idx.get(k).add(id);
        }
      };
      this.families.forEach((f, i) => add(f, 'f' + i));
      for (const v of Object.values(this.verbs)) {
        const forms = v.forms || [];
        // separable forms ("kaufe ein"): the conjugated part alone is a member too
        add([v.inf, v.pp, ...forms, ...forms.map((f) => f.split(' ')[0])], 'v:' + v.inf);
      }
      this._familyIndex = idx;
    },

    finalize() {
      this._buildFamilies();
      this.cards = [];
      this.cardMap = Object.create(null);
      this.problems = [];
      const seen = new Set();
      for (const c of this.rawCards) {
        const errs = [];
        if (!c.id) errs.push('missing id');
        else if (seen.has(c.id)) errs.push('duplicate id');
        if (!this.topicMap[c.topic]) errs.push(`unknown topic "${c.topic}"`);
        const type = B.ex && B.ex.get(c.type);
        if (!type) errs.push(`unknown type "${c.type}"`);
        else if (type.validate) errs.push(...type.validate(c, this));
        if (errs.length) {
          this.problems.push({ id: c.id || '(no id)', errors: errs });
          continue;
        }
        seen.add(c.id);
        this.cards.push(c);
        this.cardMap[c.id] = c;
      }
      if (this.problems.length && typeof console !== 'undefined') {
        console.warn(`[Brezel] ${this.problems.length} card(s) skipped:`, this.problems);
      }
      return this;
    },

    byTopic(topicId) {
      return this.cards.filter((c) => c.topic === topicId);
    },
  };

  B.deck = deck;
})();
