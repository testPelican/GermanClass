/*
 * Content for the play games: Memory (js/games/memory.js), Die Schere (schere.js),
 * Bossfight (boss.js) and Artikel-Regen (regen.js). Everything here comes from the user's
 * material (cards, data/lexicon.js, data/glossary.js); the generators below are DOM-free so
 * they can be checked in Node.
 *
 *   schere   sentences with the conjugated verb in [brackets]; a separable verb also marks its
 *            prefix: 'Helga [steht] jeden Tag um sieben Uhr [auf].' The game glues the prefix to
 *            the verb ("aufsteht") and asks: cut it off (separable) or keep it (inseparable)?
 *   nouns    Artikel-Regen: singular nouns by article. Only nouns that have a translation in
 *            data/glossary.js are used, so new words appear here automatically once glossed.
 *   jobs     Memory (topic "gender"): male ↔ female job titles.
 *   bosses   Bossfight: one monster per topic, drawn from these features by js/games/boss.js.
 */
(function () {
  'use strict';
  const B = window.Brezel;
  const { norm } = B.util;

  const schere = [
    // separable: the prefix goes to the end
    { s: 'Helga [steht] jeden Tag um sieben Uhr [auf].', inf: 'aufstehen' },
    { s: 'Der Film [fängt] um acht Uhr [an].', inf: 'anfangen' },
    { s: 'Manchmal [kaufe] ich allein [ein].', inf: 'einkaufen' },
    { s: 'Am Sonntag [sehe] ich [fern].', inf: 'fernsehen' },
    { s: 'Martina [zieht] nach Berlin [um].', inf: 'umziehen' },
    { s: 'Ich [rufe] dich heute Abend [an].', inf: 'anrufen' },
    { s: 'Pedro [schließt] sein Studium [ab].', inf: 'abschließen' },
    { s: 'Der Patient [nimmt] eine Tablette [ein].', inf: 'einnehmen' },
    { s: 'Ich [stelle] mich [vor].', inf: 'vorstellen' },
    { s: 'Felix [zieht] sich schnell [an].', inf: 'anziehen' },
    { s: 'Wann [stehst] du [auf]?', inf: 'aufstehen' },
    { s: 'Der Unterricht [fängt] um acht [an].', inf: 'anfangen' },
    { s: 'Ich [hole] dich am Bahnhof [ab].', inf: 'abholen' },
    { s: 'Wir [laden] unsere Freunde [ein].', inf: 'einladen' },
    { s: 'Die Lehrerin [liest] ein Märchen [vor].', inf: 'vorlesen' },
    { s: 'Ich [höre] um fünf Uhr [auf].', inf: 'aufhören' },
    { s: '[Passt] du heute auf die Kinder [auf]?', inf: 'aufpassen' },
    { s: 'Er [gibt] viel Geld für Bücher [aus].', inf: 'ausgeben' },
    { s: '[Schalten] Sie bitte den Computer [aus]!', inf: 'ausschalten' },
    { s: 'Ich [bereite] mich auf eine Prüfung [vor].', inf: 'vorbereiten' },
    { s: 'Mein Kopf [tut] [weh].', inf: 'wehtun' },
    { s: 'Gestern [stand] Helga um sechs Uhr [auf].', inf: 'aufstehen' },
    { s: 'Der Unterricht [fing] um acht Uhr [an].', inf: 'anfangen' },
    // inseparable: the verb stays one word
    { s: 'Ich [beantworte] die E-Mail.', inf: 'beantworten' },
    { s: 'Pedro [bekommt] eine Stelle bei Uniqa.', inf: 'bekommen' },
    { s: 'Wir [besuchen] am Sonntag meine Eltern.', inf: 'besuchen' },
    { s: 'Ich [verstehe] die Frage nicht.', inf: 'verstehen' },
    { s: 'Die Bluse [gefällt] mir.', inf: 'gefallen' },
    { s: 'Der Kurs [beginnt] um neun Uhr.', inf: 'beginnen' },
    { s: 'Ich [vergesse] oft meine Hausaufgaben.', inf: 'vergessen' },
    { s: 'Du [erinnerst] dich gern an deine Schulzeit.', inf: 'erinnern' },
    { s: 'Alexandra [entspannt] sich.', inf: 'entspannen' },
    { s: 'Martina [übersetzt] E-Mails ins Englische.', inf: 'übersetzen' },
    { s: 'Die Lehrerin [unterrichtet] die Kinder.', inf: 'unterrichten' },
    { s: 'Wir [erwarten] heute viele Gäste.', inf: 'erwarten' },
    { s: 'Frau Weber und Herr Schneider [begrüßen] sich.', inf: 'begrüßen' },
    { s: 'Ich [unterschreibe] den Vertrag.', inf: 'unterschreiben' },
    { s: 'Kathrin und Max [unterhalten] sich.', inf: 'unterhalten' },
    { s: 'Er [bedankt] sich für die Blumen.', inf: 'bedanken' },
    { s: 'Ich [beschwere] mich über das Zimmer.', inf: 'beschweren' },
    { s: 'Ich [bekam] eine Chance.', inf: 'bekommen' },
  ];

  const nouns = {
    der: [
      'Abend', 'Alkohol', 'Apfelsaft', 'Arzt', 'Ausflug', 'Bahnhof', 'Bruder', 'Bus', 'Drucker', 'Fernseher', 'Film',
      'Fotoapparat', 'Fußball', 'Hund', 'Kaffee', 'Kellner', 'Koch', 'Kopf', 'Kurs', 'Lehrer', 'Mann', 'Nachbar', 'Ort',
      'Pullover', 'Roman', 'Samstag', 'Schreibtisch', 'Sonntag', 'Sport', 'Supermarkt', 'Tag', 'Tee', 'Unterricht',
      'Urlaub', 'Vertrag', 'Vortrag', 'Zug', 'Zustand', 'Kaufmann', 'Wechsel', 'Informatiker', 'Freund', 'Kollege',
      'Kunde', 'Monat', 'Termin', 'Student', 'Brief', 'Computer', 'Morgen', 'Patient', 'Beruf',
    ],
    die: [
      'Adresse', 'Arbeit', 'Ärztin', 'Ausbildung', 'Bahn', 'Bedienung', 'Biologie', 'Brille', 'Chance', 'Currywurst',
      'Dose', 'Fähre', 'Firma', 'Frage', 'Frau', 'Freizeit', 'Freundin', 'Idee', 'Kauffrau', 'Lehrerin', 'Medaille',
      'Medizin', 'Miete', 'Milch', 'Musik', 'Mutter', 'Nachbarin', 'Schauspielerin', 'Schule', 'Schulzeit', 'Sonne',
      'Stelle', 'Uhr', 'Woche', 'Zeit', 'Zeitung', 'Prüfung', 'Chefin', 'Kunst', 'Blume', 'Besprechung',
      'Unterstützung', 'Kollegin', 'Studentin', 'Bluse', 'Hotelrezeption', 'Arbeitszeit', 'Familie', 'Stadt', 'Wohnung',
      'Angst', 'Tablette', 'Vorlesung',
    ],
    das: [
      'Auto', 'Bett', 'Brot', 'Buch', 'Essen', 'Fleisch', 'Flugzeug', 'Gedicht', 'Geschäft', 'Glas', 'Internet', 'Jahr',
      'Kino', 'Märchen', 'Paket', 'Problem', 'Projekt', 'Restaurant', 'Salz', 'Schwimmbad', 'Studium', 'Theater', 'Tor',
      'Wohnzimmer', 'Zentrum', 'Zimmer', 'Computerprogramm', 'Masterdiplom', 'Kind', 'Haus', 'Wetter', 'Büro', 'Fach',
      'Telefon', 'Handy', 'Glück', 'Patent',
    ],
  };

  const jobs = [
    ['der Lehrer', 'die Lehrerin'], ['der Arzt', 'die Ärztin'], ['der Koch', 'die Köchin'], ['der Kaufmann', 'die Kauffrau'],
    ['der Student', 'die Studentin'], ['der Kellner', 'die Kellnerin'], ['der Informatiker', 'die Informatikerin'],
    ['der Schauspieler', 'die Schauspielerin'], ['der Büromanager', 'die Büromanagerin'], ['der Patentprüfer', 'die Patentprüferin'],
    ['der Nachbar', 'die Nachbarin'], ['der Freund', 'die Freundin'], ['der Kollege', 'die Kollegin'], ['der Kunde', 'die Kundin'],
    ['der Fußballspieler', 'die Fußballspielerin'], ['der Marketingmanager', 'die Marketingmanagerin'],
  ];

  /*
   * Bosses: shape (blob | tall | square | wide | ghost | worm), eyes (1–3), horns (0–3), fangs,
   * extra (wings | tentacles | bandages | eyepatch | ears | tusks | feathers | crown | spikes | antennae | hat | mirror).
   */
  const bosses = {
    all: { name: 'Der Grammatik-Gigant', color: '#7c5cff', shape: 'wide', eyes: 3, horns: 2, fangs: true, extra: 'crown' },
    rules: { name: 'Der Regel-Riese', color: '#3f8cff', shape: 'tall', eyes: 1, horns: 0, fangs: false, extra: 'hat' },
    verblist: { name: 'Das Verben-Ungeheuer', color: '#e2458e', shape: 'blob', eyes: 3, horns: 3, fangs: true, extra: 'spikes' },
    order: { name: 'Der Satzbau-Golem', color: '#8c7a6b', shape: 'square', eyes: 2, horns: 0, fangs: false, extra: 'spikes' },
    present: { name: 'Der Präsens-Pirat', color: '#ff7a45', shape: 'blob', eyes: 2, horns: 0, fangs: true, extra: 'eyepatch' },
    past: { name: 'Die Perfekt-Krake', color: '#b04ad8', shape: 'blob', eyes: 2, horns: 0, fangs: false, extra: 'tentacles' },
    cases: { name: 'Der Akkusativ-Drache', color: '#2fb35a', shape: 'wide', eyes: 2, horns: 2, fangs: true, extra: 'wings' },
    prepositions: { name: 'Der Präpositions-Papagei', color: '#ffb000', shape: 'blob', eyes: 2, horns: 0, fangs: false, extra: 'feathers' },
    gender: { name: 'Die Endungs-Echse', color: '#00b39b', shape: 'worm', eyes: 2, horns: 1, fangs: false, extra: 'spikes' },
    possessive: { name: 'Das Besitz-Biest', color: '#d4483b', shape: 'square', eyes: 2, horns: 2, fangs: true, extra: 'crown' },
    questions: { name: 'Der Frage-Fuchs', color: '#ff8a1f', shape: 'blob', eyes: 2, horns: 0, fangs: true, extra: 'ears' },
    verbs: { name: 'Das Modal-Mammut', color: '#9a7356', shape: 'wide', eyes: 2, horns: 0, fangs: false, extra: 'tusks' },
    prefix: { name: 'Der Trennbar-Troll', color: '#6aa84f', shape: 'tall', eyes: 2, horns: 1, fangs: true, extra: 'ears' },
    tenses: { name: 'Der Zeiten-Zauberer', color: '#5b6cff', shape: 'ghost', eyes: 2, horns: 0, fangs: false, extra: 'hat' },
    praet: { name: 'Die Präteritum-Mumie', color: '#c9b48a', shape: 'tall', eyes: 2, horns: 0, fangs: false, extra: 'bandages' },
    reflexive: { name: 'Der Spiegel-Geist', color: '#58b6e8', shape: 'ghost', eyes: 2, horns: 0, fangs: false, extra: 'mirror' },
    pastq: { name: 'Der Gestern-Vampir', color: '#5d4a8a', shape: 'tall', eyes: 2, horns: 0, fangs: true, extra: 'wings' },
    vocab: { name: 'Der Wortschatz-Wurm', color: '#e5007d', shape: 'worm', eyes: 2, horns: 0, fangs: false, extra: 'antennae' },
  };

  // --- generators (no DOM) ---------------------------------------------------------------------

  /** A Schere sentence split into parts: { before, verb, between, prefix, end, sep, glued, correct }. */
  function parseSchere(item) {
    const m = item.s.match(/^(.*?)\[([^\]]+)\](.*?)(?:\[([^\]]+)\])?([.?!]*)$/);
    if (!m) return null;
    const [, before, verb, between, prefix, end] = m;
    const sep = !!prefix;
    const glue = (p, v) => {
      // a sentence-initial verb keeps its capital on the glued word: "Aufpasst du …?"
      if (!before.trim() && /^[A-ZÄÖÜ]/.test(v)) return p.charAt(0).toUpperCase() + p.slice(1) + v.charAt(0).toLowerCase() + v.slice(1);
      return p + v;
    };
    return {
      inf: item.inf,
      before: before.trim(),
      verb,
      between: between.trim(),
      prefix: prefix || null,
      end: end || '',
      sep,
      glued: sep ? glue(prefix, verb) : verb,
      correct: item.s.replace(/[[\]]/g, ''),
    };
  }

  /** Is a word known from the user's material (it has a glossary translation)? */
  function meaningOf(word) {
    if (!B.gloss || !B.gloss.tokens) return null;
    const toks = B.gloss.tokens(word);
    return toks.length === 1 && toks[0].en ? toks[0].en : null;
  }

  /** Artikel-Regen nouns: [{ art, noun, en }], only nouns with a glossary meaning. */
  function regenNouns() {
    const out = [];
    for (const art of ['der', 'die', 'das']) {
      for (const noun of nouns[art]) {
        const en = meaningOf(noun);
        if (en) out.push({ art, noun, en });
      }
    }
    return out;
  }

  // Memory: German detection for speech (match cards mix German, English and Polish)
  let germanForms = null;
  function isGerman(text) {
    if (B.gloss && typeof B.gloss.isGerman === 'function') return B.gloss.isGerman(text); // the app's shared check
    if (B.audio && typeof B.audio.isGerman === 'function') return B.audio.isGerman(text);
    if (!germanForms) {
      germanForms = new Set();
      for (const v of Object.values(B.deck.verbs)) {
        for (const f of [v.inf, v.pp, ...(v.forms || []), ...(v.prt || [])]) if (f) f.split(' ').forEach((w) => germanForms.add(norm(w)));
      }
      for (const f of B.deck.families) f.forEach((w) => germanForms.add(norm(w)));
    }
    const toks = B.gloss.tokens(String(text));
    if (!toks.length) return false;
    const known = toks.filter((t) => t.en || t.name || germanForms.has(norm(t.text)) || /[äöüß]/i.test(t.text)).length;
    return known / toks.length >= 0.6;
  }

  const L = () => B.games.lib;
  const reflexiveInf = (x) => (x.reflexive ? 'sich ' + x.v.inf : x.v.inf);
  const TENSE_BY_LEVEL = { 1: 'present', 2: 'praet', 3: 'perfekt' };

  /** Pairs from the topic's match cards: [{ a, b, sayA, sayB }]. */
  function matchPairs(topic) {
    const cards = B.deck.cards.filter((c) => c.type === 'match' && !c.variantOf && (topic === 'all' || B.deck.inTopic(c, topic)));
    return cards.flatMap((c) => c.pairs.map(([a, b]) => ({ a, b, sayA: isGerman(a), sayB: isGerman(b) })));
  }

  /** Generated pairs for a topic and level, from the lexicon. */
  function generatedPairs(topic, level) {
    const lib = L();
    const pairs = [];
    const add = (a, b, sayA = true, sayB = true) => a && b && pairs.push({ a, b, sayA, sayB });
    if (topic === 'verblist') {
      const tense = TENSE_BY_LEVEL[level] || 'praet';
      for (const x of lib.verbsFor('verblist')) add(reflexiveInf(x), lib.form(x.v, tense, 2, { reflexive: x.reflexive }));
    } else if (topic === 'praet') {
      for (const x of lib.verbsFor('praet', { need: ['prt'] })) add(reflexiveInf(x), lib.form(x.v, 'praet', 2, { reflexive: x.reflexive }));
    } else if (topic === 'past' || topic === 'pastq') {
      for (const x of lib.verbsFor('past', { need: ['pp'] })) {
        if (x.v.inf === 'sein' || x.v.inf === 'haben') continue;
        add(reflexiveInf(x), lib.form(x.v, 'perfekt', 2, { reflexive: x.reflexive }));
      }
    } else if (topic === 'present') {
      // only verbs whose er-form is not regular (fahren → fährt, nehmen → nimmt, sein → ist)
      for (const x of lib.verbsFor('present')) {
        const er = x.v.forms && x.v.forms[2];
        if (!er) continue;
        const [head, prefix] = er.split(' ');
        const base = prefix && x.v.inf.startsWith(prefix) ? x.v.inf.slice(prefix.length) : x.v.inf;
        const stem = base.replace(/e?n$/, '');
        if (head !== stem + 't' && head !== stem + 'et') add(x.v.inf, 'er ' + er);
      }
    } else if (topic === 'gender') {
      for (const [m, f] of jobs) add(m, f);
    } else if (topic === 'reflexive') {
      for (const x of lib.verbsFor('reflexive')) add('sich ' + x.v.inf, lib.meaning(x.v), true, false);
    } else if (topic === 'prefix') {
      for (const x of lib.verbsFor('prefix')) add((lib.isReflexive(x.v) ? 'sich ' : '') + x.v.inf, lib.meaning(x.v), true, false);
    }
    return pairs;
  }

  /**
   * Pairs for a Memory game: generated ones first (they follow the level), then match-card pairs;
   * every text appears once, so each card has exactly one partner. null if fewer than 6 pairs.
   */
  function memoryPairs(topic, level, want) {
    const gen = generatedPairs(topic, level);
    const fromCards = matchPairs(topic);
    const seen = new Set();
    const pick = [];
    const take = (list) => {
      for (const p of B.util.shuffle(list)) {
        const ka = norm(p.a);
        const kb = norm(p.b);
        if (!ka || !kb || ka === kb || seen.has(ka) || seen.has(kb)) continue;
        if (String(p.a).length > 34 || String(p.b).length > 34) continue; // must fit on a small card
        seen.add(ka);
        seen.add(kb);
        pick.push(p);
      }
    };
    take(gen);
    take(fromCards);
    if (pick.length < 6) return null;
    // keep generated pairs in front so the level shows, then mix
    return B.util.shuffle(pick.slice(0, Math.max(6, Math.min(want || pick.length, pick.length))));
  }

  B.games.data.play = {
    schere,
    nouns,
    jobs,
    bosses,
    _gen: { parseSchere, regenNouns, meaningOf, isGerman, matchPairs, generatedPairs, memoryPairs },
  };
})();
