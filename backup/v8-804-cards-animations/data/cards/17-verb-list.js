/*
 * Verb list — "Kleines Wörterbuch der Verben" (Begegnungen A2+, Kapitel 1, D2, p. 32–33).
 * Every verb of the list in all three columns, as in class (the form without "er"; "er …" is accepted too):
 *   level 1 = Präsens (easy) · level 2 = Präteritum (medium) · level 3 = Perfekt (hard)
 * The cards are built from the table V below, which also fills the three list tables of the Rule book
 * (rules vl-list-1 … vl-list-3; the general rule vl-columns is in data/rules.js).
 * The exercise type rotates (typed, multiple choice, gaps), and a few overview cards (match, sort,
 * table) follow the list, so the topic is not one long drill.
 * To add a verb: add a row to V (and the verb to data/lexicon.js, its forms to data/glossary.js).
 */
(function () {
  'use strict';
  const { norm } = Brezel.util;

  // inf = as in the list ("sich …" for reflexive verbs), obj = the book's example object,
  // pr / prt / pf = er-form of Präsens, Präteritum, Perfekt (pr may be a list: backt / bäckt),
  // sep = separable prefix, vc = vowel change in the Präsens, why = reason for "ist" in the Perfekt,
  // gap = a Perfekt sentence for a fill-the-gaps card ({…} = gap), chips = its wrong chips.
  const V = [
    // --- irregular verbs ------------------------------------------------------------------------
    { inf: 'abschließen', obj: 'ein Studium', pr: 'schließt ab', prt: 'schloss ab', pf: 'hat abgeschlossen', sep: 'ab',
      gap: 'Er {hat} sein Studium {abgeschlossen}.', chips: ['ist', 'abgeschließt'] },
    { inf: 'anfangen', pr: 'fängt an', prt: 'fing an', pf: 'hat angefangen', sep: 'an', vc: 'a → ä' },
    { inf: 'aufstehen', pr: 'steht auf', prt: 'stand auf', pf: 'ist aufgestanden', sep: 'auf', why: 'a change of state (from lying in bed to standing)',
      gap: 'Er {ist} heute um sechs Uhr {aufgestanden}.', chips: ['hat', 'aufgesteht'] },
    { inf: 'backen', obj: 'ein Brot', pr: ['backt', 'bäckt'], prt: 'backte', pf: 'hat gebacken' },
    { inf: 'beginnen', pr: 'beginnt', prt: 'begann', pf: 'hat begonnen' },
    { inf: 'bekommen', obj: 'eine Stelle', pr: 'bekommt', prt: 'bekam', pf: 'hat bekommen',
      gap: 'Sie {hat} eine Stelle bei Uniqa {bekommen}.', chips: ['ist', 'gebekommen'] },
    { inf: 'bieten', obj: 'eine Chance', pr: 'bietet', prt: 'bot', pf: 'hat geboten' },
    { inf: 'bleiben', pr: 'bleibt', prt: 'blieb', pf: 'ist geblieben', why: 'bleiben always takes ist, like sein',
      gap: 'Am Sonntag {ist} er zu Hause {geblieben}.', chips: ['hat', 'gebleibt'] },
    { inf: 'essen', pr: 'isst', prt: 'aß', pf: 'hat gegessen', vc: 'e → i' },
    { inf: 'fahren', pr: 'fährt', prt: 'fuhr', pf: 'ist gefahren', vc: 'a → ä', why: 'a change of place' },
    { inf: 'fliegen', pr: 'fliegt', prt: 'flog', pf: 'ist geflogen', why: 'a change of place',
      gap: 'Er {ist} nach Madrid {geflogen}.', chips: ['hat', 'gefliegt'] },
    { inf: 'geben', pr: 'gibt', prt: 'gab', pf: 'hat gegeben', vc: 'e → i' },
    { inf: 'gehen', pr: 'geht', prt: 'ging', pf: 'ist gegangen', why: 'a change of place',
      gap: 'Er {ist} gestern ins Kino {gegangen}.', chips: ['hat', 'gegeht'] },
    { inf: 'gewinnen', pr: 'gewinnt', prt: 'gewann', pf: 'hat gewonnen',
      gap: 'Österreich {hat} das Spiel {gewonnen}.', chips: ['ist', 'gewinnt'] },
    { inf: 'halten', obj: 'eine Vorlesung', pr: 'hält', prt: 'hielt', pf: 'hat gehalten', vc: 'a → ä',
      gap: 'Der Professor {hat} eine Vorlesung {gehalten}.', chips: ['ist', 'gehaltet'] },
    { inf: 'heißen', pr: 'heißt', prt: 'hieß', pf: 'hat geheißen' },
    { inf: 'helfen', pr: 'hilft', prt: 'half', pf: 'hat geholfen', vc: 'e → i' },
    { inf: 'kommen', pr: 'kommt', prt: 'kam', pf: 'ist gekommen', why: 'a change of place' },
    { inf: 'lesen', pr: 'liest', prt: 'las', pf: 'hat gelesen', vc: 'e → ie' },
    { inf: 'nehmen', pr: 'nimmt', prt: 'nahm', pf: 'hat genommen', vc: 'e → i' },
    { inf: 'einnehmen', obj: 'eine Tablette', pr: 'nimmt ein', prt: 'nahm ein', pf: 'hat eingenommen', sep: 'ein', vc: 'e → i',
      gap: 'Sie {hat} eine Tablette {eingenommen}.', chips: ['ist', 'eingenehmt'] },
    { inf: 'schießen', obj: 'ein Tor', pr: 'schießt', prt: 'schoss', pf: 'hat geschossen',
      gap: 'Er {hat} ein Tor {geschossen}.', chips: ['ist', 'geschießt'] },
    { inf: 'schlafen', pr: 'schläft', prt: 'schlief', pf: 'hat geschlafen', vc: 'a → ä' },
    { inf: 'schreiben', pr: 'schreibt', prt: 'schrieb', pf: 'hat geschrieben' },
    { inf: 'sein', pr: 'ist', prt: 'war', pf: 'ist gewesen', why: 'sein always takes ist',
      gap: 'Er {ist} schon einmal in Berlin {gewesen}.', chips: ['hat', 'geseint'] },
    { inf: 'singen', pr: 'singt', prt: 'sang', pf: 'hat gesungen' },
    { inf: 'stehen', pr: 'steht', prt: 'stand', pf: 'hat gestanden' },
    { inf: 'sprechen', pr: 'spricht', prt: 'sprach', pf: 'hat gesprochen', vc: 'e → i' },
    { inf: 'trinken', pr: 'trinkt', prt: 'trank', pf: 'hat getrunken' },
    { inf: 'umziehen', obj: 'in eine Stadt', pr: 'zieht um', prt: 'zog um', pf: 'ist umgezogen', sep: 'um', why: 'a change of place (moving house)',
      gap: 'Sie {ist} 2016 nach Wien {umgezogen}.', chips: ['hat', 'umgezieht'] },
    { inf: 'vergessen', pr: 'vergisst', prt: 'vergaß', pf: 'hat vergessen', vc: 'e → i',
      gap: 'Ich {habe} den Termin {vergessen}.', chips: ['bin', 'gevergessen'] },

    // --- reflexive and partly reflexive verbs -----------------------------------------------------
    { inf: 'sich anziehen', pr: 'zieht sich an', prt: 'zog sich an', pf: 'hat sich angezogen', sep: 'an' },
    { inf: 'sich ärgern', pr: 'ärgert sich', prt: 'ärgerte sich', pf: 'hat sich geärgert' },
    { inf: 'sich bedanken', pr: 'bedankt sich', prt: 'bedankte sich', pf: 'hat sich bedankt' },
    { inf: 'sich befinden', pr: 'befindet sich', prt: 'befand sich', pf: 'hat sich befunden' },
    { inf: 'sich beschweren', pr: 'beschwert sich', prt: 'beschwerte sich', pf: 'hat sich beschwert' },
    { inf: 'sich beeilen', pr: 'beeilt sich', prt: 'beeilte sich', pf: 'hat sich beeilt' },
    { inf: 'sich duschen', pr: 'duscht sich', prt: 'duschte sich', pf: 'hat sich geduscht' },
    { inf: 'sich erinnern', pr: 'erinnert sich', prt: 'erinnerte sich', pf: 'hat sich erinnert' },
    { inf: 'sich erkälten', pr: 'erkältet sich', prt: 'erkältete sich', pf: 'hat sich erkältet',
      gap: 'Anna {hat} {sich} im Winter {erkältet}.', chips: ['ist', 'mich', 'geerkältet'] },
    { inf: 'sich freuen', pr: 'freut sich', prt: 'freute sich', pf: 'hat sich gefreut' },
    { inf: 'sich föhnen', pr: 'föhnt sich', prt: 'föhnte sich', pf: 'hat sich geföhnt' },
    { inf: 'sich interessieren', pr: 'interessiert sich', prt: 'interessierte sich', pf: 'hat sich interessiert' },
    { inf: 'sich kämmen', pr: 'kämmt sich', prt: 'kämmte sich', pf: 'hat sich gekämmt' },
    { inf: 'sich schminken', pr: 'schminkt sich', prt: 'schminkte sich', pf: 'hat sich geschminkt' },
    { inf: 'sich streiten', pr: 'streitet sich', prt: 'stritt sich', pf: 'hat sich gestritten' },
    { inf: 'sich treffen', pr: 'trifft sich', prt: 'traf sich', pf: 'hat sich getroffen', vc: 'e → i',
      gap: 'Er {hat} {sich} mit Freunden {getroffen}.', chips: ['ist', 'mich', 'getrefft'] },
    { inf: 'sich umziehen', pr: 'zieht sich um', prt: 'zog sich um', pf: 'hat sich umgezogen', sep: 'um',
      gap: 'Nach dem Sport {hat} er {sich} {umgezogen}.', chips: ['ist', 'umgezieht'] },
    { inf: 'sich unterhalten', pr: 'unterhält sich', prt: 'unterhielt sich', pf: 'hat sich unterhalten', vc: 'a → ä' },
    { inf: 'sich verlieben', pr: 'verliebt sich', prt: 'verliebte sich', pf: 'hat sich verliebt' },
    { inf: 'sich vorstellen', pr: 'stellt sich vor', prt: 'stellte sich vor', pf: 'hat sich vorgestellt', sep: 'vor' },
  ];

  const list = (x) => (Array.isArray(x) ? x : [x]);
  const refl = (v) => v.inf.startsWith('sich ');
  const bare = (v) => v.inf.replace(/^sich /, ''); // the lexicon key
  const word1 = (s) => s.split(' ')[0]; // "zieht sich an" → "zieht"
  const slug = (v) => norm(v.inf).replace(/^sich /, 's-').replace(/ /g, '-');
  const withEr = (forms) => forms.flatMap((f) => [f, 'er ' + f]);
  const label = (v) => (v.obj ? `${v.inf} (${v.obj})` : v.inf);
  // the verb without its separable prefix: "anfangen" → "fangen"
  const simple = (v) => (v.sep ? bare(v).slice(v.sep.length) : bare(v));
  const stem = (v) => simple(v).replace(/e?n$/, '');
  // put "sich" and a separable prefix around a conjugated verb, like the list does
  const build = (v, verb) => [verb, refl(v) ? 'sich' : null, v.sep || null].filter(Boolean).join(' ');
  const strongPrt = (v) => !/te$/.test(word1(v.prt));
  const lex = (v) => Brezel.deck.verbs[bare(v)];

  // --- the rules a card points to, and whether they give the answer away -----------------------
  function ruleWords(ids) {
    return ' ' + ids.map((id) => {
      const r = Brezel.deck.ruleMap[id];
      return r ? norm([r.title, r.text, ...(r.points || []), ...(r.table ? r.table.rows.flat() : [])].join(' . ').replace(/\*+/g, '')) : '';
    }).join(' ') + ' ';
  }
  const givesAway = (ids, answers) => answers.some((a) => ruleWords(ids).includes(' ' + norm(a) + ' '));

  function card(c) {
    const answers = c.type === 'mc' ? [c.correct] : c.type === 'type' ? list(c.answer) : [];
    if (!c.asksRule && givesAway(list(c.rule), answers)) c.asksRule = true;
    return c;
  }

  // --- explanations ---------------------------------------------------------------------------------
  function prWhy(v) {
    const f = list(v.pr)[0];
    const parts = [];
    if (v.inf === 'sein') return 'Irregular: er **ist** (ich bin, du bist). Don’t mix it up with *isst* (eats).';
    if (v.inf === 'backen') return 'Both are correct: er **backt** and er **bäckt** (the old form with a → ä).';
    if (v.vc) {
      const ihr = lex(v) && lex(v).forms[4];
      parts.push(`*${simple(v)}* changes **${v.vc}** with du and er/sie/es: er **${word1(f)}**${ihr ? ` (but ihr ${word1(ihr)})` : ''}.`);
      if (/t$/.test(stem(v))) parts.push(`With the vowel change there is no extra e: *${word1(f)}*, not *${word1(f)}et*.`);
    } else if (/[td]$/.test(stem(v))) parts.push(`The stem ends in **-${stem(v).slice(-1)}**, so add **-et**: er ${word1(f).slice(0, -2)}**et**.`);
    else if (/(ß|ss|s)$/.test(stem(v))) parts.push(`The stem ends in **-${stem(v).slice(-1)}**, so only **-t** is added: er **${word1(f)}**.`);
    else parts.push(`er/sie/es → **-t**: er ${word1(f).slice(0, -1)}**t**.`);
    if (refl(v)) parts.push('**sich** comes right after the verb.');
    if (v.sep) parts.push(`Separable: **${v.sep}** goes to the very end.`);
    return parts.join(' ');
  }

  function prtWhy(v) {
    const w = word1(v.prt);
    const parts = [];
    if (v.inf === 'sein') parts.push('Irregular: **war** — and you also use it when speaking (*Ich war in Wien*).');
    else if (v.inf === 'backen') parts.push('Regular in the Präteritum: back + **-te** = **backte** (but the Partizip is irregular: *gebacken*).');
    else if (strongPrt(v)) parts.push(`Irregular: a new stem, **${w}**, with no -te — and no ending for er (ich ${w} = er ${w}).`);
    else if (/[td]ete$/.test(w)) parts.push(`Regular, and the stem ends in -t / -d: **-ete**: ${w.slice(0, -3)}**ete**.`);
    else parts.push(`Regular: stem + **-te**: ${w.slice(0, -2)}**te**.`);
    if (refl(v)) parts.push('*sich* right after the verb.');
    if (v.sep) parts.push(`The prefix **${v.sep}** still goes to the end.`);
    return parts.join(' ');
  }

  function ppKind(v) {
    const pp = v.pf.split(' ').pop();
    if (v.sep) return 'sep';
    if (v.inf === 'gewinnen') return 'gewinnen';
    if (!pp.startsWith('ge')) return 'noge';
    return pp.endsWith('en') ? 'irr' : 'reg';
  }

  function pfWhy(v) {
    const pp = v.pf.split(' ').pop();
    const parts = [];
    if (refl(v)) parts.push('Reflexive → always **hat sich**.' + (v.inf === 'sich umziehen' ? ' (*Er ist umgezogen* = he moved house.)' : ''));
    else if (v.why) parts.push(`**ist**: ${v.why}.`);
    else if (v.inf === 'stehen') parts.push('**hat**: standing still is no change of place (but *aufstehen* → **ist** aufgestanden).');
    else parts.push('**hat**, like most verbs.');
    const kind = ppKind(v);
    if (kind === 'sep') parts.push(`Separable: **ge** in the middle — ${v.sep}**ge**${pp.slice(v.sep.length + 2)}.`);
    else if (kind === 'gewinnen') parts.push('*gewinnen* already starts with ge-, so no extra ge-: **gewonnen**.');
    else if (kind === 'noge') {
      const pre = (simple(v).match(/^(be|ver|ent|er|unter)/) || [])[0];
      parts.push(pre ? `No ge- after **${pre}-**: **${pp}**${pp === simple(v) ? ' (looks like the infinitive)' : ''}.` : `-ieren → no ge-: **${pp}**.`);
    } else if (kind === 'irr') {
      const vowels = (w) => w.replace(/[^aeiouäöü]/g, '');
      const core = pp.slice(2, -2); // gefahren → fahr
      const note = v.inf === 'sein' ? ' — nothing like *sein*, so learn it by heart'
        : v.inf === 'essen' ? ' — with an extra g: ge-**g**-essen'
        : vowels(core) !== vowels(stem(v)) ? ', with a new vowel' : '';
      parts.push(`Irregular Partizip: ge…**en**${note}: **${pp}**.`);
    }
    else parts.push(`Regular Partizip: ge…**t**: **${pp}**.`);
    return parts.join(' ');
  }

  // --- rules ----------------------------------------------------------------------------------------
  function prRules(v) {
    if (v.inf === 'sein') return ['sein-haben'];
    const main = v.vc || v.inf === 'backen' ? 'vowel-change' : /[td]$/.test(stem(v)) ? 'present-stem' : 'present-endings';
    return [main, refl(v) ? 'reflexive-position' : v.sep ? 'separable' : null].filter(Boolean);
  }
  function prtRules(v) {
    if (v.inf === 'sein') return ['praet-sein-haben'];
    return [strongPrt(v) ? 'praet-irregular' : 'praet-regular', v.sep ? 'separable' : refl(v) ? 'reflexive-position' : null].filter(Boolean);
  }
  function pfRules(v) {
    const pp = { sep: 'partizip-separable', noge: 'partizip-no-ge', gewinnen: 'partizip-no-ge', irr: 'partizip-irregular', reg: 'partizip-regular' }[ppKind(v)];
    return [refl(v) ? 'reflexive-perfekt' : 'perfekt-aux', pp];
  }

  // --- wrong options for multiple choice -------------------------------------------------------------
  // Wrong options are forms that can't follow "er" in a statement: another person, the wrong
  // pronoun, or another tense (the card says Präsens). A joined "aufsteht" is left out, because
  // it is right in a subordinate clause (… dass er aufsteht).
  function prWrong(v) {
    const L = lex(v);
    const f = list(v.pr)[0];
    const forms = L.forms; // [ich, du, er, wir, ihr, sie]
    const form = (i) => build(v, word1(forms[i]));
    const out = refl(v)
      ? [form(1), form(3), form(1).replace(' sich', ' dich')]
      : [form(1), form(3), form(4), build(v, word1(v.prt)), form(0)];
    return [...new Set(out)].filter((x) => !list(v.pr).includes(x) && x !== f).slice(0, 3);
  }
  function prtWrong(v) {
    const w = word1(v.prt);
    if (v.inf === 'sein') return ['ist', 'wart', 'wurde'];
    if (!strongPrt(v)) return [list(v.pr)[0], build(v, w + 'n'), v.pf];
    const regular = stem(v) + (/[td]$/.test(stem(v)) ? 'ete' : 'te');
    const plusT = w + (/[td]$/.test(w) ? 'et' : 't');
    return [...new Set([build(v, regular), build(v, plusT), list(v.pr)[0]])].filter((x) => x !== v.prt);
  }

  // --- the cards ---------------------------------------------------------------------------------------
  const cards = [];
  V.forEach((v, i) => {
    const id = 'vl-' + slug(v);
    const hint = label(v);
    const pr = list(v.pr);

    // Präsens (level 1): multiple choice and typed answers take turns
    const prBase = { id: id + '-pr', level: 1, rule: prRules(v), explain: prWhy(v) };
    if (i % 2 === 0) cards.push(card(Object.assign(prBase, { type: 'mc', prompt: 'Präsens — er / sie / es', q: 'er ___', hint, correct: pr[0], wrong: prWrong(v) })));
    else cards.push(card(Object.assign(prBase, { type: 'type', prompt: 'Präsens — er / sie / es', q: 'er ___', hint, answer: withEr(pr) })));

    // Präteritum (level 2): mostly typed, every third one multiple choice
    const prtBase = { id: id + '-prt', level: 2, rule: prtRules(v), explain: prtWhy(v) };
    if (i % 3 === 1) cards.push(card(Object.assign(prtBase, { type: 'mc', prompt: 'Präteritum — the written past', q: 'er ___', hint, correct: v.prt, wrong: prtWrong(v) })));
    else cards.push(card(Object.assign(prtBase, { type: 'type', prompt: 'Präteritum — the written past', q: 'er ___', hint, answer: withEr([v.prt]) })));

    // Perfekt (level 3): a sentence with gaps where the list has one, otherwise typed
    const pfBase = { id: id + '-pf', level: 3, rule: pfRules(v), explain: pfWhy(v) };
    if (v.gap) cards.push(card(Object.assign(pfBase, { type: 'gap', prompt: `Perfekt of **${v.inf}**`, q: v.gap, options: v.chips })));
    else cards.push(card(Object.assign(pfBase, { type: 'type', prompt: 'Perfekt — the spoken past', q: 'er ___', hint, answer: withEr([v.pf]) })));
  });

  // --- overview cards ----------------------------------------------------------------------------------
  const by = (inf) => V.find((v) => v.inf === inf);
  const pairs = (infs, col) => infs.map((inf) => [inf, list(by(inf)[col])[0]]);

  cards.push(
    {
      id: 'vl-tab-pr-1', type: 'table', level: 1, rule: 'vowel-change', asksRule: true,
      prompt: 'Write the **Präsens** (er / sie / es) — careful, the vowel changes!',
      head: ['Infinitiv', 'Präsens (er)'],
      rows: pairs(['fahren', 'schlafen', 'halten', 'geben', 'helfen', 'nehmen'], 'pr'),
      blanks: 4,
      explain: '**a → ä**: fährt, schläft, hält · **e → i**: gibt, hilft, nimmt. Only du and er/sie/es change; ihr keeps the vowel (*ihr fahrt, ihr gebt*).',
    },
    {
      id: 'vl-tab-pr-2', type: 'table', level: 1, rule: ['vowel-change', 'present-stem'], asksRule: true,
      prompt: 'Write the **Präsens** (er / sie / es)',
      head: ['Infinitiv', 'Präsens (er)'],
      rows: pairs(['essen', 'lesen', 'sprechen', 'vergessen', 'bieten', 'heißen'], 'pr'),
      blanks: 4,
      explain: '**e → i / ie**: isst, liest, spricht, vergisst. Stem in -t: **-et** (bietet). Stem in -ß: only **-t** (heißt).',
    },
    {
      id: 'vl-match-prt-1', type: 'match', level: 2, rule: 'praet-irregular',
      prompt: 'Match the **Präteritum** (er / sie / es)',
      pairs: pairs(['gehen', 'kommen', 'fahren', 'fliegen', 'bleiben', 'sein'], 'prt'),
      explain: 'Verbs of moving and *sein / bleiben*: ging, kam, fuhr, flog, blieb, war — all irregular, no -te.',
    },
    {
      id: 'vl-match-prt-2', type: 'match', level: 2, rule: 'praet-irregular',
      prompt: 'Match the **Präteritum** (er / sie / es)',
      pairs: pairs(['essen', 'trinken', 'lesen', 'schreiben', 'sprechen', 'singen'], 'prt'),
      explain: 'aß, trank, las, schrieb, sprach, sang: a new vowel and no ending for er.',
    },
    {
      id: 'vl-match-prt-3', type: 'match', level: 2, rule: 'praet-irregular',
      prompt: 'Match the **Präteritum** (er / sie / es)',
      pairs: pairs(['geben', 'nehmen', 'helfen', 'bieten', 'halten', 'heißen'], 'prt'),
      explain: 'gab, nahm, half, bot, hielt, hieß. *hielt* and *hieß* get **ie**.',
    },
    {
      id: 'vl-match-prt-4', type: 'match', level: 2, rule: 'praet-irregular',
      prompt: 'Match the **Präteritum** (er / sie / es)',
      pairs: pairs(['beginnen', 'gewinnen', 'bekommen', 'vergessen', 'schlafen', 'schießen'], 'prt'),
      explain: 'begann, gewann, bekam, vergaß, schlief, schoss. The prefixes be-, ge-, ver- stay: *bekam*, not *kam*.',
    },
    {
      id: 'vl-tab-prt-1', type: 'table', level: 2, rule: ['praet-irregular', 'separable'], asksRule: true,
      prompt: 'Write the **Präteritum** (er / sie / es) of the separable verbs',
      head: ['Infinitiv', 'Präteritum (er)'],
      rows: pairs(['abschließen', 'anfangen', 'aufstehen', 'einnehmen', 'umziehen'], 'prt'),
      blanks: 4,
      explain: 'A new stem and the prefix at the end: schloss **ab**, fing **an**, stand **auf**, nahm **ein**, zog **um**.',
    },
    {
      id: 'vl-tab-pf-1', type: 'table', level: 3, rule: ['perfekt-aux', 'partizip-irregular'], asksRule: true,
      prompt: 'Write the **Perfekt** (er / sie / es) — **hat** or **ist**?',
      head: ['Infinitiv', 'Perfekt (er)'],
      rows: pairs(['fahren', 'essen', 'fliegen', 'trinken', 'kommen', 'schlafen'], 'pf'),
      blanks: 4,
      explain: '**ist** for moving from A to B: ist gefahren, ist geflogen, ist gekommen. **hat** for the rest: hat gegessen, hat getrunken, hat geschlafen.',
    },
    {
      id: 'vl-tab-pf-2', type: 'table', level: 3, rule: ['perfekt-aux', 'partizip-no-ge'], asksRule: true,
      prompt: 'Write the **Perfekt** (er / sie / es)',
      head: ['Infinitiv', 'Perfekt (er)'],
      rows: pairs(['beginnen', 'bekommen', 'vergessen', 'bleiben', 'sein', 'gehen'], 'pf'),
      blanks: 4,
      explain: 'No ge- after be- / ver-: hat begonnen, hat bekommen, hat vergessen. *sein* and *bleiben* take **ist**: ist gewesen, ist geblieben. Moving: ist gegangen.',
    },
    {
      id: 'vl-tab-pf-3', type: 'table', level: 3, rule: ['reflexive-perfekt', 'partizip'], asksRule: true,
      prompt: 'Write the **Perfekt** (er / sie / es) of the reflexive verbs',
      head: ['Infinitiv', 'Perfekt (er)'],
      rows: pairs(['sich ärgern', 'sich erinnern', 'sich freuen', 'sich streiten', 'sich unterhalten', 'sich vorstellen'], 'pf'),
      blanks: 4,
      explain: 'Always **hat sich**. Regular: geärgert, gefreut · no ge- after er-/unter-: erinnert, unterhalten · irregular: gestritten · separable: vor**ge**stellt.',
    },
    {
      id: 'vl-sort-pf-1', type: 'sort', level: 3, rule: ['vl-list-1', 'perfekt-aux'], asksRule: true, theory: true,
      prompt: 'Perfekt: **hat** or **ist**? (verb list, part 1)',
      buckets: [
        { label: 'hat', items: ['abschließen', 'anfangen', 'backen', 'bekommen', 'essen', 'gewinnen'] },
        { label: 'ist', items: ['aufstehen', 'bleiben', 'fahren', 'fliegen', 'gehen'] },
      ],
      explain: '**ist** = a change of place (fahren, fliegen, gehen) or state (aufstehen), and *bleiben*. Everything else takes **hat** — even *anfangen*, *abschließen* and *gewinnen*.',
    },
    {
      id: 'vl-sort-pf-2', type: 'sort', level: 3, rule: ['vl-list-2', 'perfekt-aux'], asksRule: true, theory: true,
      prompt: 'Perfekt: **hat** or **ist**? (verb list, part 2)',
      buckets: [
        { label: 'hat', items: ['schlafen', 'schreiben', 'singen', 'stehen', 'trinken', 'vergessen', 'nehmen'] },
        { label: 'ist', items: ['kommen', 'sein', 'umziehen'] },
      ],
      explain: '**ist**: kommen and umziehen (a change of place) and *sein* itself. *stehen* → **hat** gestanden: standing still is no change.',
    },
    {
      id: 'vl-tf-umziehen', type: 'tf', level: 1, rule: ['vl-list-3', 'reflexive-perfekt'], asksRule: true, theory: true,
      statement: 'In the verb list, *sich umziehen* (to change clothes) takes **ist** in the Perfekt, just like *umziehen* (to move house).',
      answer: false,
      explain: 'Reflexive → **hat sich**: *er hat sich umgezogen* (changed clothes). *er ist umgezogen* = he moved house (a change of place).',
    },
    {
      id: 'vl-columns-1', type: 'mc', level: 1, rule: 'vl-columns', asksRule: true, theory: true,
      prompt: 'Which column of the verb list do you use when you **talk** about the past?',
      correct: 'Perfekt', wrong: ['Präteritum', 'Präsens', 'Infinitiv'],
      explain: 'Perfekt (*er ist gefahren*) is the spoken past. Präteritum (*er fuhr*) is mostly for writing — except *war* and *hatte*.',
    },
    {
      id: 'vl-columns-2', type: 'tf', level: 2, rule: 'vl-columns', asksRule: true, theory: true,
      statement: 'In the Präteritum, the **ich**-form is the same as the **er**-form, so the list also tells you *ich fuhr, ich nahm, ich war*.',
      answer: true,
      explain: 'Right: ich = er / sie / es in the Präteritum, with no ending: *ich fuhr, er fuhr*. Only the other persons add one: *du fuhrst, wir fuhren*.',
    },
  );

  Brezel.deck.addCards('verblist', cards);

  // --- the list itself, for the Rule book (one table per part) -------------------------------------
  const row = (v) => [label(v), list(v.pr).join(' / '), v.prt, v.pf].map((x, i) => (i ? 'er ' + x : x));
  const irregular = V.filter((v) => !refl(v));
  const half = irregular.findIndex((v) => v.inf === 'kommen');
  const head = ['Infinitiv', 'Präsens', 'Präteritum', 'Perfekt'];
  Brezel.deck.addRules('verblist', [
    { id: 'vl-list-1', title: 'Verb list 1: abschließen – helfen', text: 'Irregular verbs (Begegnungen A2+, p. 32). Learn the three forms without *er*.', table: { head, rows: irregular.slice(0, half).map(row) } },
    { id: 'vl-list-2', title: 'Verb list 2: kommen – vergessen', text: 'Irregular verbs (Begegnungen A2+, p. 33). **ist** in the Perfekt: a change of place or state, *sein* and *bleiben*.', table: { head, rows: irregular.slice(half).map(row) } },
    { id: 'vl-list-3', title: 'Verb list 3: reflexive verbs', text: 'Reflexive and partly reflexive verbs (p. 33): *sich* right after the verb, and **hat sich** in the Perfekt — every one of them.', table: { head, rows: V.filter(refl).map(row) } },
  ]);
})();
