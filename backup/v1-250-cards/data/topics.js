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
      'Endings: ich **-e**, du **-st**, er/sie/es **-t**, wir **-en**, ihr **-t**, sie/Sie **-en**. Stems ending in -t add an e (*arbeit**e**t*). Some verbs change their vowel with du and er/sie/es: *lesen → liest*, *fahren → fährt*, *sprechen → spricht*.',
  },
  {
    id: 'past',
    name: 'Past tense',
    de: 'Perfekt',
    icon: '⏪',
    tip:
      'Perfekt = **haben/sein** in position 2 + **participle at the end**. Use **sein** for movement or change of place (*gegangen, gefahren, umgezogen*) and for *geboren*. Verbs in **-ieren** and verbs starting with **be-/ver-/ent-** take no ge- (*studiert, bekommen, vereinbart*). Separable verbs put ge in the middle (*ab**ge**schlossen*).',
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
    name: 'Modals, separable verbs & gern',
    de: 'müssen, einkaufen, gern',
    icon: '🔗',
    tip:
      'Modal verb (**muss, kann, möchte**) in position 2, second verb as infinitive at the **end**: *Pedro muss Patente **lesen**.* Separable verbs split in the present: *Ich **kaufe** allein **ein**.* To like *doing* something: verb + **gern** (*Ich spiele gern Fußball*); to like a *thing*: **mögen** (*Ich mag Fußball*).',
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
