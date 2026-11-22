/*
 * Content for the quick-fire minigames (js/games/swipe.js, rush.js, automat.js).
 * Everything here uses words from the cards and data/glossary.js; verb forms come from
 * data/lexicon.js at run time, so new verbs show up in the games by themselves.
 *
 *   nichtKein   "Nicht oder kein?": s = sentence with ___, a = the word that fills it
 *   imIns       "Im oder ins?": cue = Wo? (where: im) or Wohin? (where to: ins); neuter nouns only,
 *               because im = in dem and ins = in das (masculine "where to" would be "in den")
 *   spiegel     "Spiegel": what comes after the reflexive pronoun for each verb, so the sentences
 *               sound natural. tails = present tense, perfekt = Perfekt (default: tails);
 *               plural: the verb needs two people (sich streiten, sich begrüßen); present: no Perfekt
 *   reflMeaning English for verbs used reflexively whose lexicon entry is not reflexive
 *   homophones  pairs that sound the same: "Hör genau" never offers both
 */
Brezel.games.data.quick = {
  nichtKein: [
    // kein + noun
    { s: 'Ich habe ___ Auto.', a: 'kein' },
    { s: 'Pedro hat ___ Kinder.', a: 'keine' },
    { s: 'Wir haben heute ___ Zeit.', a: 'keine' },
    { s: 'Das ist ___ Problem.', a: 'kein' },
    { s: 'Ich trinke ___ Kaffee.', a: 'keinen' },
    { s: 'Martina hat ___ Hund.', a: 'keinen' },
    { s: 'Ich habe ___ Idee.', a: 'keine' },
    { s: 'Er hat ___ Bruder.', a: 'keinen' },
    { s: 'Ich habe heute ___ Unterricht.', a: 'keinen' },
    { s: 'Wir haben ___ Fernseher.', a: 'keinen' },
    { s: 'Das ist ___ Roman, das ist ein Gedicht.', a: 'kein' },
    { s: 'Ich esse ___ Fleisch.', a: 'kein' },
    { s: 'Sie hat morgen ___ Termin.', a: 'keinen' },
    // nicht + verb, adjective, adverb or a noun with mein/der …
    { s: 'Pedro ist ___ verheiratet.', a: 'nicht' },
    { s: 'Ich bin heute ___ müde.', a: 'nicht' },
    { s: 'Anna ist ___ krank.', a: 'nicht' },
    { s: 'Ich arbeite am Sonntag ___.', a: 'nicht' },
    { s: 'Er kommt heute ___.', a: 'nicht' },
    { s: 'Das Auto ist ___ teuer.', a: 'nicht' },
    { s: 'Ich spiele ___ gern Fußball.', a: 'nicht' },
    { s: 'Wir wohnen ___ in Wien.', a: 'nicht' },
    { s: 'Julian hat sich noch ___ angezogen.', a: 'nicht' },
    { s: 'Ich habe den Roman ___ gelesen.', a: 'nicht' },
    { s: 'Das ist ___ mein Auto.', a: 'nicht' },
    { s: 'Ich bin ___ glücklich.', a: 'nicht' },
  ],

  imIns: [
    // Wo? → im
    { s: 'Ich bin heute Abend ___ Kino.', a: 'im', cue: 'Wo?' },
    { s: 'Martina arbeitet ___ Restaurant.', a: 'im', cue: 'Wo?' },
    { s: 'Wir essen am Samstag ___ Restaurant.', a: 'im', cue: 'Wo?' },
    { s: 'Die Kinder schlafen schon ___ Bett.', a: 'im', cue: 'Wo?' },
    { s: 'Ich lese abends ___ Bett.', a: 'im', cue: 'Wo?' },
    { s: 'Wir sehen ___ Wohnzimmer fern.', a: 'im', cue: 'Wo?' },
    { s: 'Pedro wohnt ___ Zentrum.', a: 'im', cue: 'Wo?' },
    { s: 'Der Fernseher ist ___ Wohnzimmer.', a: 'im', cue: 'Wo?' },
    { s: 'Anna ist ___ Schwimmbad.', a: 'im', cue: 'Wo?' },
    { s: 'Wir treffen uns ___ Café.', a: 'im', cue: 'Wo?' },
    { s: 'Ich lese die Nachrichten ___ Internet.', a: 'im', cue: 'Wo?' },
    { s: 'Der Schreibtisch steht ___ Zimmer.', a: 'im', cue: 'Wo?' },
    { s: 'Ich war gestern ___ Theater.', a: 'im', cue: 'Wo?' },
    // Wohin? → ins
    { s: 'Ich gehe heute Abend ___ Kino.', a: 'ins', cue: 'Wohin?' },
    { s: 'Wir gehen am Samstag ___ Restaurant.', a: 'ins', cue: 'Wohin?' },
    { s: 'Die Kinder gehen um acht ___ Bett.', a: 'ins', cue: 'Wohin?' },
    { s: 'Kommst du ___ Wohnzimmer?', a: 'ins', cue: 'Wohin?' },
    { s: 'Wir fahren am Sonntag ___ Zentrum.', a: 'ins', cue: 'Wohin?' },
    { s: 'Ich gehe ___ Schwimmbad.', a: 'ins', cue: 'Wohin?' },
    { s: 'Gehst du mit mir ___ Theater?', a: 'ins', cue: 'Wohin?' },
    { s: 'Pedro geht ___ Geschäft.', a: 'ins', cue: 'Wohin?' },
    { s: 'Kommen Sie bitte ___ Zimmer.', a: 'ins', cue: 'Wohin?' },
    { s: 'Wir gehen ___ Café.', a: 'ins', cue: 'Wohin?' },
    { s: 'Am Abend geht Martina ___ Kino.', a: 'ins', cue: 'Wohin?' },
  ],

  spiegel: {
    anziehen: { tails: ['schnell', ''] },
    ärgern: { tails: ['über das Computerprogramm', 'über die Chefin'] },
    bedanken: { tails: ['für die Blumen'] },
    befinden: { tails: ['in Wien', 'im Zentrum'], present: true },
    beschweren: { tails: ['über das Zimmer'] },
    beeilen: { tails: [''] },
    duschen: { tails: ['jeden Morgen'], perfekt: ['schon'] },
    erinnern: { tails: ['gern an die Schulzeit'] },
    erkälten: { tails: ['oft'], perfekt: ['gestern'] },
    freuen: { tails: ['auf das Wochenende', 'über die Blumen'], perfekt: ['über die Grüße', 'über die Blumen'] },
    föhnen: { tails: [''] },
    interessieren: { tails: ['für Kunst', 'für Fußball'] },
    kämmen: { tails: [''] },
    schminken: { tails: ['jeden Morgen'], perfekt: ['schon'] },
    streiten: { tails: ['schon wieder'], plural: true },
    treffen: { tails: ['mit Freunden', 'am Samstag mit Freunden'], perfekt: ['am Samstag mit Freunden'] },
    umziehen: { tails: ['schnell'] },
    unterhalten: { tails: ['über die Arbeitszeiten'] },
    verlieben: { tails: ['schnell'] },
    vorstellen: { tails: [''] },
    vorbereiten: { tails: ['auf die Prüfung'] },
    rasieren: { tails: ['jeden Morgen'], perfekt: ['schon'] },
    entspannen: { tails: ['am Wochenende'] },
    begrüßen: { tails: [''], plural: true },
  },

  reflMeaning: { umziehen: 'change (clothes)', treffen: 'meet' },

  homophones: [
    ['ist', 'isst'], ['seid', 'seit'], ['das', 'dass'], ['hast', 'hasst'], ['Stadt', 'statt'], ['wieder', 'wider'],
    ['Rad', 'Rat'], ['malen', 'mahlen'], ['war', 'wahr'], ['mehr', 'Meer'], ['viel', 'fiel'], ['Wal', 'Wahl'],
    ['Tod', 'tot'], ['bunt', 'Bund'], ['Lied', 'Lid'], ['Mohr', 'Moor'], ['Seite', 'Saite'], ['wird', 'Wirt'],
    ['End', 'Ent'], ['Rede', 'Reede'], ['Leib', 'Laib'], ['Stiel', 'Stil'], ['Uhr', 'ur'], ['Feld', 'fällt'],
  ],
};
