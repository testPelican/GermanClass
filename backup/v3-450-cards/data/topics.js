/*
 * Topics (skill areas). The review screen groups results by these.
 * To add a topic: add an entry here and a card file in data/cards/ that calls
 * Brezel.deck.addCards('<id>', [...]), then add a <script> tag in index.html.
 */
Brezel.deck.addTopics([
  {
    id: 'order',
    name: 'Word order',
    de: 'Satzbau',
    icon: '🧩',
    tip:
      'The conjugated verb is always in **position 2**. If a sentence starts with something else (*Manchmal*, *2016*, *In meiner Freizeit*), the subject moves behind the verb: *Manchmal **gehe ich** ins Kino.* Participles (*gemacht*) and infinitives after modal verbs (*lesen*) go to the very **end**. Yes/no questions start with the verb.',
  },
  {
    id: 'present',
    name: 'Present tense',
    de: 'Präsens',
    icon: '⏱️',
    tip:
      'Endings: ich **-e**, du **-st**, er/sie/es **-t**, wir **-en**, ihr **-t**, sie/Sie **-en**. Stems ending in -t add an e (*arbeit**e**t, kost**e**t*). Some verbs change their vowel **only with du and er/sie/es**: **a → ä** (*fahren → fährt, schlafen → schläft*), **e → i** (*geben → gibt, essen → isst, helfen → hilft, sprechen → spricht*), **e → ie** (*lesen → liest, sehen → sieht*). **ihr** never changes: *ihr fahrt, ihr gebt*. Irregular: du **hast**, er **hat** · ihr **seid** (*seit* = since). **es gibt** = there is / there are.',
  },
  {
    id: 'past',
    name: 'Past tense',
    de: 'Perfekt',
    icon: '⏪',
    tip:
      'Perfekt = **Hilfsverb** (*haben/sein*) in position 2 + **Partizip II at the end**. Use **sein** for a change of place or state — *Wechsel von Ort oder Zustand* (*gegangen, gefahren, aufgestanden, umgezogen*) — and for *sein, bleiben, geboren*. **haben** for all other verbs. Regular: **ge…t** (*gefragt*); irregular: **ge…en**, often with a new vowel (*getrunken*). Verbs in **-ieren** and verbs starting with **be-/ver-/ent-** take no ge- (*studiert, besucht, vereinbart*). Separable verbs put ge in the middle (*ab**ge**schlossen*).',
  },
  {
    id: 'cases',
    name: 'Articles & cases',
    de: 'der, die, das',
    icon: '🎯',
    tip:
      '**mit** always takes the Dativ: der/das → **dem**, die → **der**, plural → **den** + n (*mit dem Zug, mit der Bahn, mit meinen Freunden*). The object of most verbs is Akkusativ: only masculine changes — *ein → **einen***, *kein → **keinen***. Nouns in **-ung** are *die*, nouns in **-um** are *das*.',
  },
  {
    id: 'prepositions',
    name: 'Prepositions',
    de: 'Präpositionen',
    icon: '📍',
    tip:
      '**im** (in dem) = where? *Ich bin im Kino.* **ins** (in das) = where to? *Ich gehe ins Kino.* Work at a company: **bei** Uniqa. From: **aus** Spanien. To a city: **nach** München. **zur** Schule (zu der). **am** Sonntag. **seit** + present tense. **No preposition** before a year: *2016 bin ich umgezogen.*',
  },
  {
    id: 'gender',
    name: 'Female & male forms',
    de: 'Berufe: er / sie',
    icon: '👩‍🏫',
    tip:
      'Most female forms add **-in** and always take **die**: *der Lehrer → die Lehrerin*. Some add an umlaut: *Arzt → Ärztin*, *Koch → Köchin*. **-mann → -frau**: *Kaufmann → Kauffrau*. Plural female: **-innen** (*Kolleginnen*).',
  },
  {
    id: 'possessive',
    name: 'Possessives',
    de: 'mein, meine …',
    icon: '🏠',
    tip:
      '**mein** for der/das words, **meine** for die words and plurals. After *in/mit* (Dativ): die → **meiner** (*in meiner Freizeit, mit meiner Frau*), plural → **meinen** (*mit meinen Freunden*). *his* = **sein**, *her* = **ihr**, formal *your* = **Ihr**.',
  },
  {
    id: 'questions',
    name: 'Questions & negation',
    de: 'W-Fragen, nicht / kein',
    icon: '❓',
    tip:
      '**Wo** = where, **Woher** = where from, **Wer** = who, **Wann** = when, **Wie** = how, **Was** = what. W-question: W-word + verb + subject. **nicht** negates verbs and adjectives (*nicht verheiratet*); **kein** negates nouns (*kein Auto, keine Kinder*).',
  },
  {
    id: 'verbs',
    name: 'Modal verbs & gern',
    de: 'müssen, können, gern',
    icon: '🔗',
    tip:
      'Modal verb (**muss, kann, möchte**) in position 2, second verb as infinitive at the **end**: *Pedro muss Patente **lesen**.* To like *doing* something: verb + **gern** (*Ich spiele gern Fußball*); to like a *thing*: **mögen** (*Ich mag Fußball*).',
  },
  {
    id: 'prefix',
    name: 'Separable & inseparable verbs',
    de: 'trennbar / nicht trennbar',
    icon: '✂️',
    tip:
      '**Separable**: the prefix is a real word (*an, auf, aus, ein, fern, um*). In the present it goes to the **end**: *Helga **steht** jeden Tag um sieben Uhr **auf**.* Perfekt: **ge** in the middle (*an**ge**rufen, auf**ge**standen*). **Inseparable**: the prefix can’t stand alone (*be-, er-, ver-, ge-*), so the verb stays one word (*Die Bluse **gefällt** mir*) and the participle has **no ge-** (*beantwortet*). **unter- / über-** are usually inseparable: *ich unterrichte, ich übersetze*.',
  },
  {
    id: 'tenses',
    name: 'Tenses & grammar terms',
    de: 'Präsens, Perfekt, Präteritum',
    icon: '🧠',
    tip:
      '**Präsens** = now, habits and plans (*Morgen fahre ich nach Wien*). With **seit** it means *have been … since*, exactly like Polish *od*: *Ich wohne seit 2016 hier* = *Mieszkam tu od 2016*. **Perfekt** = the past, mostly **spoken**: **Hilfsverb** (*haben/sein*) + **Partizip II**. **Präteritum** = the same past, mostly **written**, one word: *ich trank, ich ging*. German has no *-ing* form: *ich trinke* = I drink / I am drinking (Polish *piję*).',
  },
  {
    id: 'praet',
    name: 'Simple past',
    de: 'Präteritum',
    icon: '📜',
    tip:
      'The **written** past (stories, reports, news). When speaking, use the Perfekt — except **war** and **hatte**, which are normal in speech too. Regular verbs add **-te** (*kaufte, ärgerte sich*; after -t/-d: *arbeit**ete**, erkält**ete***). Irregular verbs change the vowel and add nothing: *stand, fing, aß, bot, blieb*. **ich = er/sie/es**: *ich war, er war*. Endings: –, -st, –, -en, -t, -en. A separable prefix goes to the end: *Der Unterricht **fing** um acht **an**.*',
  },
  {
    id: 'reflexive',
    name: 'Reflexive verbs',
    de: 'sich freuen, sich anziehen',
    icon: '🪞',
    tip:
      'The action goes back to the subject, like Polish **się**. But Polish says *się* for everyone; German changes it: ich **mich**, du **dich**, er/sie/es **sich**, wir **uns**, ihr **euch**, sie/Sie **sich**. It comes right after the conjugated verb (*Ich **ziehe mich** an*); after inversion it follows the pronoun (*Morgens dusche **ich mich***). Perfekt always with **haben**: *Ich **habe mich** umgezogen* (changed clothes) ≠ *Ich **bin** umgezogen* (moved house).',
  },
  {
    id: 'pastq',
    name: 'Talking about the past',
    de: 'Haben Sie schon einmal …?',
    icon: '💬',
    tip:
      'Yes/no question: **Hilfsverb first**, participle at the end: *Hast du schon einmal Brot gebacken?* W-question: W-word + Hilfsverb + subject … participle: *Wann **sind** Sie **aufgestanden**?* Answer with the same Hilfsverb: *Ja, ich habe schon einmal / oft …* · *Nein, ich habe **noch nie** …* Present → past: *Heute trinke ich Tee.* → *Was **hast** du gestern **getrunken**?* → *Gestern **habe** ich Kaffee **getrunken**.*',
  },
  {
    id: 'vocab',
    name: 'Vocabulary',
    de: 'Wortschatz',
    icon: '📚',
    tip:
      'Break long words into parts: *Fach + Zeitschriften*, *Geburt + s + Ort*, *Unter + stütz + ung*. Watch the false friend **bekommen** = to get (not *to become*), and **Freunde** (friends) vs **Freude** (joy).',
  },
]);
