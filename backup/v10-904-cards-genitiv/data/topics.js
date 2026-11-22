/*
 * Topics (skill areas). The review screen groups results by these.
 * To add a topic: add an entry here and a card file in data/cards/ that calls
 * Brezel.deck.addCards('<id>', [...]), then add a <script> tag in index.html.
 * short: the name on the small topic tiles of the start screen.
 * learn: what the topic teaches, in plain words with examples: shown under the Start buttons.
 * tip: the rule reminder behind 📖 Rule on the topic card.
 * A topic with collects: 'theory' has no cards of its own: it gathers every card marked
 * theory: true, from all topics (the card still counts in its own topic too).
 */
Brezel.deck.addTopics([
  {
    id: 'rules',
    short: 'Rules',
    name: 'Rules',
    de: 'Grammatikregeln',
    icon: '📏',
    collects: 'theory',
    learn: 'Here you will learn the **grammar words themselves**: what a *Hilfsverb* or a *Partizip II* is, *Perfekt* or *Präteritum*, where the verb goes, and the four cases — *der, den, dem, des*.',
    tip:
      'Only questions **about the rules**: what the Perfekt is, Präsens or past, when to use *sein*, where the verb goes, the four cases — no translations. They come from every topic, so a rule you master here also counts in its own topic. The 📖 Glossary on each card has the full rule.',
  },
  {
    id: 'verblist',
    short: 'Verb list',
    name: 'Verb list',
    de: 'Kleines Wörterbuch der Verben',
    icon: '📒',
    learn: 'Here you will learn the **51 verbs of the book’s list** in three forms: Präsens *er fährt* · Präteritum *er fuhr* · Perfekt *er ist gefahren*.',
    tip:
      'The 51 verbs of the list (Begegnungen A2+, p. 32–33), learnt by heart in three columns — leave out *er*: **Präsens** *fährt* (easy) · **Präteritum** *fuhr*, the written past (medium) · **Perfekt** *ist gefahren*, the spoken past (hard). Watch the vowel change in the Präsens (*fährt, nimmt, liest*), the new vowel and no -te in the irregular Präteritum (*fuhr, nahm, las*), **ist** for a change of place or state (*ist gefahren, ist aufgestanden*, also *ist gewesen, ist geblieben*), and **hat sich** for every reflexive verb (*hat sich umgezogen* ≠ *ist umgezogen*).',
  },
  {
    id: 'order',
    short: 'Word order',
    name: 'Word order',
    de: 'Satzbau',
    icon: '🧩',
    learn: 'Here you will learn **where the words go**: the verb is always **second** (*Heute **gehe** ich ins Kino*), and a participle or a second verb goes to the **end** (*Ich habe Tee **getrunken***).',
    tip:
      'The conjugated verb is always in **position 2**. If a sentence starts with something else (*Manchmal*, *2016*, *In meiner Freizeit*), the subject moves behind the verb: *Manchmal **gehe ich** ins Kino.* Participles (*gemacht*) and infinitives after modal verbs (*lesen*) go to the very **end**. Yes/no questions start with the verb.',
  },
  {
    id: 'present',
    short: 'Present',
    name: 'Present tense',
    de: 'Präsens',
    icon: '⏱️',
    learn: 'Here you will learn the **present tense** (now, habits, plans): *ich wohn**e**, du wohn**st**, er wohn**t*** — and verbs that change their vowel: *fahren → er **fährt***, *lesen → er **liest***.',
    tip:
      'Endings: ich **-e**, du **-st**, er/sie/es **-t**, wir **-en**, ihr **-t**, sie/Sie **-en**. Stems ending in -t add an e (*arbeit**e**t, kost**e**t*). Some verbs change their vowel **only with du and er/sie/es**: **a → ä** (*fahren → fährt, schlafen → schläft*), **e → i** (*geben → gibt, essen → isst, helfen → hilft, sprechen → spricht*), **e → ie** (*lesen → liest, sehen → sieht*). **ihr** never changes: *ihr fahrt, ihr gebt*. Irregular: du **hast**, er **hat** · ihr **seid** (*seit* = since). **es gibt** = there is / there are.',
  },
  {
    id: 'past',
    short: 'Perfekt',
    name: 'Past tense',
    de: 'Perfekt',
    icon: '⏪',
    learn: 'Here you will learn the **Perfekt**, the spoken past: *haben* or *sein* + the participle at the end — *Ich **habe** Kaffee **getrunken***, *Ich **bin** nach Wien **gefahren***.',
    tip:
      'Perfekt = **Hilfsverb** (*haben/sein*) in position 2 + **Partizip II at the end**. Use **sein** for a change of place or state — *Wechsel von Ort oder Zustand* (*gegangen, gefahren, aufgestanden, umgezogen*) — and for *sein, bleiben, geboren*. **haben** for all other verbs. Regular: **ge…t** (*gefragt*); irregular: **ge…en**, often with a new vowel (*getrunken*). Verbs in **-ieren** and verbs starting with **be-/ver-/ent-** take no ge- (*studiert, besucht, vereinbart*). Separable verbs put ge in the middle (*ab**ge**schlossen*).',
  },
  {
    id: 'cases',
    short: 'Cases',
    name: 'Articles & cases',
    de: 'der, die, das',
    icon: '🎯',
    learn: 'Here you will learn **der, die or das** (*-ung → die, -um → das*) and the four **cases**, the article’s form for its job in the sentence: *der* Mann (who?) · *den* Mann (whom?) · *dem* Mann (to whom? *mit dem*) · *des* Mann**es** (whose? *das Büro **des** Chefs*).',
    tip:
      'Four cases, shown by the article: **Nominativ** = the subject (*der, ein, mein*), **Akkusativ** = the object (*den, einen, meinen*), **Dativ** = to whom? and after *mit* (*dem, einem, meinem*), **Genitiv** = whose? (*des, eines, meines* + -s). **mit** always takes the Dativ: der/das → **dem**, die → **der**, plural → **den** + n (*mit dem Zug, mit der Bahn, mit meinen Freunden*). The object of most verbs is Akkusativ: only masculine changes — *ein → **einen***, *kein → **keinen***. The Genitiv comes **after** the noun (*das Büro **des** Chefs*), except names (*Kathrins Tag*). **der**: people and devices in -er · **die**: -in, -ung, -e (often), -tät, -ion, -ie, -ik · **das**: -um, international words, verbs used as nouns (*das Lesen*).',
  },
  {
    id: 'prepositions',
    short: 'Prepositions',
    name: 'Prepositions',
    de: 'Präpositionen',
    icon: '📍',
    learn: 'Here you will learn **prepositions**, the little words for where, where to and when: **Wo?** *im Kino, in der Kantine* (Dativ) · **Wohin?** *ins Kino, in die Kantine* (Akkusativ) · *am Sonntag, nach Wien, seit 2016*.',
    tip:
      '**im** (in dem) = where? *Ich bin im Kino.* **ins** (in das) = where to? *Ich gehe ins Kino.* Work at a company: **bei** Uniqa. From: **aus** Spanien. To a city: **nach** München. **zur** Schule (zu der). **am** Sonntag. **seit** + present tense. **No preposition** before a year: *2016 bin ich umgezogen.*',
  },
  {
    id: 'gender',
    short: 'Jobs m / f',
    name: 'Female & male forms',
    de: 'Berufe: er / sie',
    icon: '👩‍🏫',
    learn: 'Here you will learn the **female form of a job**: *der Lehrer → **die** Lehrer**in***, *der Arzt → die **Ä**rzt**in***, *der Kaufmann → die Kauf**frau***.',
    tip:
      'Most female forms add **-in** and always take **die**: *der Lehrer → die Lehrerin*. Some add an umlaut: *Arzt → Ärztin*, *Koch → Köchin*. **-mann → -frau**: *Kaufmann → Kauffrau*. Plural female: **-innen** (*Kolleginnen*).',
  },
  {
    id: 'possessive',
    short: 'Possessives',
    name: 'Possessives',
    de: 'mein, meine …',
    icon: '🏠',
    learn: 'Here you will learn **mein, dein, sein, ihr …** (my, your, his, her): ***mein** Bruder, **meine** Schwester* — and after *mit* or *in*: *mit **meiner** Frau, mit **meinen** Freunden*.',
    tip:
      '**mein** for der/das words, **meine** for die words and plurals. After *in/mit* (Dativ): die → **meiner** (*in meiner Freizeit, mit meiner Frau*), plural → **meinen** (*mit meinen Freunden*). *his* = **sein**, *her* = **ihr**, formal *your* = **Ihr**.',
  },
  {
    id: 'questions',
    short: 'Questions',
    name: 'Questions & negation',
    de: 'W-Fragen, nicht / kein',
    icon: '❓',
    learn: 'Here you will learn **questions and saying no**: the W-words (*wo, wer, wann, wie, was*), and **nicht** or **kein** — *Ich bin **nicht** verheiratet* · *Ich habe **kein** Auto*.',
    tip:
      '**Wo** = where, **Woher** = where from, **Wer** = who, **Wann** = when, **Wie** = how, **Was** = what. W-question: W-word + verb + subject. **nicht** negates verbs and adjectives (*nicht verheiratet*); **kein** negates nouns (*kein Auto, keine Kinder*).',
  },
  {
    id: 'verbs',
    short: 'Modal verbs',
    name: 'Modal verbs & gern',
    de: 'müssen, können, gern',
    icon: '🔗',
    learn: 'Here you will learn **modal verbs** with the second verb at the end — *Ich **muss** heute **arbeiten***, *Ich **kann** gut **kochen*** — and **gern** for things you like doing: *Ich spiele **gern** Tennis*.',
    tip:
      'Modal verb (**muss, kann, möchte**) in position 2, second verb as infinitive at the **end**: *Pedro muss Patente **lesen**.* To like *doing* something: verb + **gern** (*Ich spiele gern Fußball*); to like a *thing*: **mögen** (*Ich mag Fußball*).',
  },
  {
    id: 'prefix',
    short: 'Separable',
    name: 'Separable & inseparable verbs',
    de: 'trennbar / nicht trennbar',
    icon: '✂️',
    learn: 'Here you will learn **verbs with a prefix**: separable ones split up (*aufstehen → Ich **stehe** um 7 Uhr **auf***), inseparable ones never do (*be-, ver-, er-: Ich **beantworte** die E-Mail*).',
    tip:
      '**Separable**: the prefix is a real word (*an, auf, aus, ein, fern, um*). In the present it goes to the **end**: *Helga **steht** jeden Tag um sieben Uhr **auf**.* Perfekt: **ge** in the middle (*an**ge**rufen, auf**ge**standen*). **Inseparable**: the prefix can’t stand alone (*be-, er-, ver-, ge-*), so the verb stays one word (*Die Bluse **gefällt** mir*) and the participle has **no ge-** (*beantwortet*). **unter- / über-** are usually inseparable: *ich unterrichte, ich übersetze*.',
  },
  {
    id: 'tenses',
    short: 'Tenses',
    name: 'Tenses & grammar terms',
    de: 'Präsens, Perfekt, Präteritum',
    icon: '🧠',
    learn: 'Here you will learn the **tenses** and when to use each: Präsens *ich trinke* (now) · Perfekt *ich habe getrunken* (the spoken past) · Präteritum *ich trank* (the written past).',
    tip:
      '**Präsens** = now, habits and plans (*Morgen fahre ich nach Wien*). With **seit** it means *have been … since*, exactly like Polish *od*: *Ich wohne seit 2016 hier* = *Mieszkam tu od 2016*. **Perfekt** = the past, mostly **spoken**: **Hilfsverb** (*haben/sein*) + **Partizip II**. **Präteritum** = the same past, mostly **written**, one word: *ich trank, ich ging*. German has no *-ing* form: *ich trinke* = I drink / I am drinking (Polish *piję*).',
  },
  {
    id: 'praet',
    short: 'Präteritum',
    name: 'Simple past',
    de: 'Präteritum',
    icon: '📜',
    learn: 'Here you will learn the **Präteritum**, the written past of stories and reports: *ich **war**, ich **hatte**, er **kaufte**, sie **ging**, der Kurs **fing** um acht **an***.',
    tip:
      'The **written** past (stories, reports, news). When speaking, use the Perfekt — except **war** and **hatte**, which are normal in speech too. Regular verbs add **-te** (*kaufte, ärgerte sich*; after -t/-d: *arbeit**ete**, erkält**ete***). Irregular verbs change the vowel and add nothing: *stand, fing, aß, bot, blieb*. **ich = er/sie/es**: *ich war, er war*. Endings: –, -st, –, -en, -t, -en. A separable prefix goes to the end: *Der Unterricht **fing** um acht **an**.*',
  },
  {
    id: 'reflexive',
    short: 'Reflexive',
    name: 'Reflexive verbs',
    de: 'sich freuen, sich anziehen',
    icon: '🪞',
    learn: 'Here you will learn **reflexive verbs**: the action goes back to the person, like Polish *się* — *ich freue **mich**, du ziehst **dich** um, er erinnert **sich**, wir treffen **uns**, ihr beeilt **euch***.',
    tip:
      'The action goes back to the subject, like Polish **się**. But Polish says *się* for everyone; German changes it: ich **mich**, du **dich**, er/sie/es **sich**, wir **uns**, ihr **euch**, sie/Sie **sich**. It comes right after the conjugated verb (*Ich **ziehe mich** an*); after inversion it follows the pronoun (*Morgens dusche **ich mich***). Perfekt always with **haben**: *Ich **habe mich** umgezogen* (changed clothes) ≠ *Ich **bin** umgezogen* (moved house).',
  },
  {
    id: 'pastq',
    short: 'Past talk',
    name: 'Talking about the past',
    de: 'Haben Sie schon einmal …?',
    icon: '💬',
    learn: 'Here you will learn to **ask and answer about the past**: *Hast du schon einmal Brot gebacken?* — *Ja, schon oft.* / *Nein, **noch nie**.* · *Wann **bist** du **aufgestanden**?*',
    tip:
      'Yes/no question: **Hilfsverb first**, participle at the end: *Hast du schon einmal Brot gebacken?* W-question: W-word + Hilfsverb + subject … participle: *Wann **sind** Sie **aufgestanden**?* Answer with the same Hilfsverb: *Ja, ich habe schon einmal / oft …* · *Nein, ich habe **noch nie** …* Present → past: *Heute trinke ich Tee.* → *Was **hast** du gestern **getrunken**?* → *Gestern **habe** ich Kaffee **getrunken**.*',
  },
  {
    id: 'vocab',
    short: 'Vocabulary',
    name: 'Vocabulary',
    de: 'Wortschatz',
    icon: '📚',
    learn: 'Here you will learn **words from the book**: Kathrin’s day (*der Tagesablauf, danach, meistens, der Feierabend*), work words, long words split into parts, and false friends (*bekommen* = to get).',
    tip:
      'Break long words into parts: *Fach + Zeitschriften*, *Geburt + s + Ort*, *Unter + stütz + ung*. Watch the false friend **bekommen** = to get (not *to become*), and **Freunde** (friends) vs **Freude** (joy). Your day in order: *normalerweise, danach, gegen 8 Uhr, mittags, nachmittags, abends* — and the verb stays second: *Danach **frühstücke** ich.*',
  },
]);
