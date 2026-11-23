/*
 * Rule questions for the 📏 Rules topic: they ask about a rule itself, never what a word means.
 * Every card belongs to the topic its rule is about (so mastering it counts there too) and is
 * marked theory: true, like the rule questions in the other card files. Together they give
 * every rule in data/rules.js at least one question (tools/validate.js checks).
 */
Brezel.deck.addCards('order', [
  {
    id: 'ru-01', type: 'mc', rule: 'verb-2', asksRule: true, theory: true,
    prompt: 'In a German statement, where does the **conjugated verb** go?',
    correct: 'Position 2: it is always the second element',
    wrong: ['Position 1, before everything else', 'Always right after the subject', 'At the end of the sentence'],
    explain: '*Anna **arbeitet** in Graz. Heute **arbeitet** Anna in Graz.* Whatever stands in position 1, the verb comes next. Only a *second* verb part (participle, infinitive, prefix) goes to the end.',
  },
  {
    id: 'ru-02', type: 'tf', rule: 'verb-2', asksRule: true, theory: true,
    statement: '**Position 1** can only hold the subject of the sentence.',
    answer: false,
    explain: 'Position 1 holds **one element**, but it can be anything: the subject (*Tom*), a time (*Am Montag*), a place (*In Wien*) or a whole group of words (*Mein neuer Kollege*). The verb always comes next.',
  },
  {
    id: 'ru-03', type: 'mc', rule: 'inversion', asksRule: true, theory: true,
    prompt: 'A sentence starts with *Morgen*. What happens to the subject?',
    correct: 'It goes right behind the verb: *Morgen fahre ich …*',
    wrong: ['It stays before the verb: *Morgen ich fahre …*', 'It moves to the end of the sentence', 'It is left out'],
    explain: '*Morgen* takes position 1 and the verb stays in **position 2**, so the subject moves **behind** the verb: *Morgen **fahre ich** nach Graz.*',
  },
  {
    id: 'ru-04', type: 'tf', rule: 'inversion', asksRule: true, theory: true,
    statement: 'When a sentence starts with a time (*Heute, Am Abend*), the verb moves to the **end**.',
    answer: false,
    explain: 'The verb **stays in position 2**; only the subject moves behind it: *Am Abend **lese ich** ein Buch* — not *Am Abend ich ein Buch lese*.',
  },
  {
    id: 'ru-05', type: 'mc', rule: 'w-question', asksRule: true, theory: true,
    prompt: 'What is the word order of a **W-question**?',
    correct: 'W-word + verb + subject: *Wo wohnst du?*',
    wrong: ['W-word + subject + verb: *Wo du wohnst?*', 'Verb + W-word + subject: *Wohnst wo du?*', 'Subject + W-word + verb: *Du wo wohnst?*'],
    explain: 'The W-word takes **position 1**, the verb stays in **position 2**, then the subject: *Wann **beginnt** der Kurs? Was **machst** du heute?*',
  },
]);

Brezel.deck.addCards('present', [
  {
    id: 'ru-06', type: 'mc', rule: 'present-endings', asksRule: true, theory: true,
    prompt: 'Which ending does the **du** form take in the present tense?',
    correct: '-st', wrong: ['-t', '-e', '-en'],
    explain: '*du wohn**st**, du lern**st**, du komm**st***. All the endings: ich -e, du -st, er/sie/es -t, wir -en, ihr -t, sie/Sie -en.',
  },
  {
    id: 'ru-07', type: 'mc', rule: 'present-endings', asksRule: true, theory: true,
    prompt: 'Which persons take the ending **-en** in the present tense?',
    correct: 'wir, sie (they) and Sie (formal you)',
    wrong: ['ich, wir and sie', 'du, ihr and Sie', 'only wir'],
    explain: '*wir wohn**en**, sie wohn**en**, Sie wohn**en*** — the same form as the infinitive. *ihr* takes **-t**: *ihr wohnt*.',
  },
  {
    id: 'ru-08', type: 'mc', rule: 'present-stem', asksRule: true, theory: true,
    prompt: 'Why is it *er arbeitet* and not *er arbeitt*?',
    correct: 'The stem ends in -t, so an extra e makes the ending audible',
    wrong: ['arbeiten is an irregular verb', 'Every verb takes -et with er / sie / es', 'The e shows that it is the past tense'],
    explain: 'Stems ending in **-t** or **-d** add an **e** with du, er/sie/es and ihr: *du arbeit**e**st, er arbeit**e**t, ihr find**e**t*. Without it you couldn’t hear the ending.',
  },
  {
    id: 'ru-09', type: 'tf', rule: 'present-stem', asksRule: true, theory: true,
    statement: 'If the stem ends in **-s, -ß** or **-z**, the du form only adds **-t**: *du reist, du heißt, du tanzt*.',
    answer: true,
    explain: 'The stem already ends in an s sound, so *-st* would add nothing you can hear: *du hei**ßt*** (not *heißst*), *du tan**zt***, *du rei**st***.',
  },
  {
    id: 'ru-10', type: 'mc', rule: 'vowel-change', asksRule: true, theory: true,
    prompt: 'Verbs like *fahren → fährt* change their vowel. With which persons?',
    correct: 'Only du and er / sie / es',
    wrong: ['Every person except ich', 'ich, du and er / sie / es', 'Only er / sie / es'],
    explain: '*du f**ä**hrst, er f**ä**hrt* — but *ich fahre, wir fahren, **ihr fahrt**, sie fahren*. The same with e → i (*du gibst, er gibt*) and e → ie (*du siehst, er sieht*).',
  },
  {
    id: 'ru-11', type: 'tf', rule: 'sein-haben', asksRule: true, theory: true,
    statement: '*haben* is irregular only with **du** and **er / sie / es**: *du hast, er hat*.',
    answer: true,
    explain: 'The other forms are regular: *ich habe, wir haben, ihr habt, sie haben*. Only du and er/sie/es lose the **b**. *sein* is irregular everywhere: *bin, bist, ist, sind, seid, sind*.',
  },
  {
    id: 'ru-12', type: 'mc', rule: ['es-gibt', 'akkusativ'], asksRule: true, theory: true,
    prompt: 'Which case comes after **es gibt** (there is / there are)?',
    correct: 'Akkusativ: *Es gibt einen Park.*',
    wrong: ['Nominativ: *Es gibt ein Park.*', 'Dativ: *Es gibt einem Park.*', 'It depends on how many things there are'],
    explain: 'The thing after *es gibt* is its **object**, so it is Akkusativ: *der Park → Es gibt **einen** Park.* And it is always *gibt*, even for many things: *Es gibt drei Parks.*',
  },
]);

Brezel.deck.addCards('tenses', [
  {
    id: 'ru-13', type: 'mc', rule: 'tenses', asksRule: true, theory: true,
    prompt: 'What do you use the **Präsens** for?',
    correct: 'Now, habits — and the future, with a time word like *morgen*',
    wrong: ['Only for what is happening right now', 'For actions that are finished', 'Only for habits and routines'],
    explain: '*Ich **trinke** gerade Tee* (now). *Ich **trinke** jeden Tag Tee* (habit). *Morgen **trinke** ich Tee* (future). A finished action takes the **Perfekt**: *Ich **habe** Tee **getrunken***.',
  },
]);

Brezel.deck.addCards('past', [
  {
    id: 'ru-14', type: 'mc', rule: 'partizip-separable', asksRule: true, theory: true,
    prompt: 'Where does **ge** go in the Partizip II of a separable verb like *einkaufen*?',
    correct: 'Between the prefix and the verb: *eingekauft*',
    wrong: ['At the start: *geeinkauft*', 'Nowhere: *einkauft*', 'At the end: *einkaufge*'],
    explain: 'Separable prefix + **ge** + verb, written as one word: *ein**ge**kauft, auf**ge**standen, an**ge**rufen*.',
  },
  {
    id: 'ru-15', type: 'mc', rule: 'partizip', asksRule: true, theory: true,
    prompt: 'Which rule for the **Partizip II** is **wrong**?',
    correct: 'Separable verbs put ge- in front: *geaufmacht*',
    wrong: ['Regular verbs: ge…t — *gelernt*', 'Irregular verbs: ge…en — *gefunden*', 'Verbs in -ieren: no ge — *diskutiert*'],
    explain: 'With a separable verb, **ge goes in the middle**: *auf**ge**macht*. The other three are right — and inseparable prefixes (*be-, ver-, er-*) take no ge either: *verkauft*.',
  },
]);

Brezel.deck.addCards('cases', [
  {
    id: 'ru-16', type: 'match', rule: 'cases', asksRule: true, theory: true,
    prompt: 'Each case answers its own question. Match them.',
    pairs: [['Wer?', 'Nominativ'], ['Wen?', 'Akkusativ'], ['Wem?', 'Dativ'], ['Wessen?', 'Genitiv']],
    explain: '***Wer** kommt?* → Nominativ (*der Mann*). ***Wen** siehst du?* → Akkusativ (*den Mann*). ***Wem** hilfst du?* → Dativ (*dem Mann*). ***Wessen** Auto ist das?* → Genitiv (*des Mannes*).',
  },
  {
    id: 'ru-17', type: 'mc', rule: 'nominativ', asksRule: true, theory: true,
    prompt: 'Which case is the **subject** of the sentence — the one who does something?',
    correct: 'Nominativ', wrong: ['Akkusativ', 'Dativ', 'Genitiv'],
    explain: '***Der Hund** schläft. **Mein Bruder** wohnt in Graz.* The Nominativ is also the form in the dictionary: *der, ein, mein*.',
  },
  {
    id: 'ru-18', type: 'match', rule: 'cases', asksRule: true, theory: true,
    prompt: 'A masculine noun (*der Hund*): match each article with its case',
    pairs: [['der', 'Nominativ'], ['den', 'Akkusativ'], ['dem', 'Dativ'], ['des', 'Genitiv']],
    explain: '***Der** Hund schläft. Ich sehe **den** Hund. Ich gebe **dem** Hund Wasser. Der Ball **des** Hundes.* In the Genitiv the noun gets **-s / -es** too: *des Hund**es***.',
  },
  {
    id: 'ru-19', type: 'match', rule: 'cases', asksRule: true, theory: true,
    prompt: '*ein* with a masculine noun: match each form with its case',
    pairs: [['ein', 'Nominativ'], ['einen', 'Akkusativ'], ['einem', 'Dativ'], ['eines', 'Genitiv']],
    explain: '***Ein** Mann kommt. Ich kenne **einen** Mann. Ich helfe **einem** Mann. Das Auto **eines** Mannes.* *kein* and *mein* work the same: *meinen, meinem, meines*.',
  },
  {
    id: 'ru-20', type: 'mc', rule: 'genitiv', asksRule: true, theory: true,
    prompt: 'What is the **Genitiv** of *mein Bruder* (the car of my brother)?',
    correct: 'das Auto meines Bruders',
    wrong: ['das Auto meinem Bruder', 'das Auto meinen Bruders', 'das Auto meines Bruder'],
    explain: 'Masculine Genitiv: **meines** + noun + **-s**: *meines Bruder**s***. When speaking, people often say *das Auto **von meinem** Bruder* instead.',
  },
  {
    id: 'ru-21', type: 'mc', rule: 'akkusativ', asksRule: true, theory: true,
    prompt: 'In the **Akkusativ**, which articles change?',
    correct: 'Only the masculine ones: der → den, ein → einen',
    wrong: ['Only the feminine ones: die → der', 'All of them: der → den, die → der, das → dem', 'None — only the noun changes'],
    explain: '*Ich habe **einen** Hund* (der Hund) — but *eine Katze, ein Fahrrad, keine Kinder* look the same as in the Nominativ.',
  },
  {
    id: 'ru-22', type: 'mc', rule: 'akkusativ', asksRule: true, theory: true,
    prompt: 'Which part of the sentence is in the **Akkusativ**?',
    correct: 'The object: what you have, see, need …',
    wrong: ['The subject: who does it', 'Everything after the verb', 'Only the words after a preposition'],
    explain: '*Der Hund sieht **den Mann**.* Who sees? the dog (subject, Nominativ). Whom does it see? the man (object, **Akkusativ**). Ask *Wen?* or *Was?*.',
  },
  {
    id: 'ru-23', type: 'mc', rule: 'dativ', asksRule: true, theory: true,
    prompt: 'In *Ich gebe dem Kind ein Buch*, which case is *dem Kind*?',
    correct: 'Dativ: the person who gets something',
    wrong: ['Akkusativ: the thing you give', 'Nominativ: the subject', 'Genitiv: whose it is'],
    explain: '*Wem* gebe ich das Buch? → **dem Kind** (Dativ). *Was* gebe ich? → **ein Buch** (Akkusativ). *Wer* gibt? → **ich** (Nominativ).',
  },
  {
    id: 'ru-24', type: 'mc', rule: ['mit-dativ', 'dativ'], asksRule: true, theory: true,
    prompt: 'Which prepositions always take the **Dativ**?',
    correct: 'mit, bei, nach, aus, zu, seit, von',
    wrong: ['für, ohne, durch, gegen, um', 'in, an, auf, unter, über', 'und, aber, oder, denn'],
    explain: '*mit dem Zug, bei meiner Oma, nach dem Kurs, aus der Schweiz, zum Arzt, seit einem Jahr, von meinem Bruder.* **für, ohne, durch, gegen, um** take the Akkusativ. *in, an, auf* take both: Dativ for *Wo?* (*im Kino*), Akkusativ for *Wohin?* (*ins Kino*).',
  },
  {
    id: 'ru-25', type: 'mc', rule: 'mit-dativ', asksRule: true, theory: true,
    prompt: 'After *mit*, what happens to a **die** word (*die Bahn*)?',
    correct: 'die → der: *mit der Bahn*',
    wrong: ['die → den: *mit den Bahn*', 'die → dem: *mit dem Bahn*', 'It stays: *mit die Bahn*'],
    explain: 'Dativ: der / das → **dem**, die → **der**, plural → **den** + n: *mit **dem** Zug, mit **der** Bahn, mit **den** Kindern*.',
  },
  {
    id: 'ru-26', type: 'tf', rule: 'dativ', asksRule: true, theory: true,
    statement: 'Some verbs always take the **Dativ**, for example *helfen, danken* and *gefallen*: *Ich helfe meiner Mutter.*',
    answer: true,
    explain: 'Ask **Wem?**: *Wem hilfst du?* → *Ich helfe **dir**.* Also: *Ich danke **Ihnen**. Das Bild gefällt **mir**.*',
  },
  {
    id: 'ru-27', type: 'mc', rule: 'genitiv', asksRule: true, theory: true,
    prompt: 'Which case says **whose** something is?',
    correct: 'Genitiv', wrong: ['Dativ', 'Akkusativ', 'Nominativ'],
    explain: '*Wessen Auto ist das?* → *das Auto **des Lehrers**, die Tasche **meiner Schwester***. With names just add -s: *Annas Auto*.',
  },
  {
    id: 'ru-28', type: 'tf', rule: 'genitiv', asksRule: true, theory: true,
    statement: 'In the Genitiv, masculine and neuter nouns get an extra **-s** or **-es**: *das Auto des Mannes*.',
    answer: true,
    explain: '*des Vater**s**, des Auto**s**, des Mann**es**, des Kind**es***. Feminine and plural nouns get nothing: *die Tasche der Frau, die Zimmer der Kinder*.',
  },
  {
    id: 'ru-29', type: 'tf', rule: 'genitiv', asksRule: true, theory: true,
    statement: 'When speaking, Germans often use **von + Dativ** instead of the Genitiv: *das Auto von meinem Bruder*.',
    answer: true,
    explain: '*das Auto **meines Bruders*** (written, formal) = *das Auto **von meinem Bruder*** (everyday speech). Both are correct.',
  },
  {
    id: 'ru-30', type: 'mc', rule: 'gender', asksRule: true, theory: true,
    prompt: 'Nouns with which endings are always **die**?',
    correct: '-ung, -heit, -keit', wrong: ['-um, -chen', '-er, -ling', '-en, -el'],
    explain: '*die Zeit**ung**, die Frei**heit**, die Möglich**keit***. And **-um, -chen** are *das*: *das Muse**um**, das Mäd**chen***.',
  },
]);

Brezel.deck.addCards('prepositions', [
  {
    id: 'ru-31', type: 'mc', rule: 'im-ins', asksRule: true, theory: true,
    prompt: 'When do you say **ins** instead of **im**?',
    correct: 'For *Wohin?* (where to): *Ich gehe ins Kino.*',
    wrong: ['For *Wo?* (where): *Ich bin ins Kino.*', 'With die words: *ins Stadt*', 'With plurals: *ins Kinos*'],
    explain: '**ins** = in das, a movement → *Wohin?* (Akkusativ). **im** = in dem, a place → *Wo?* (Dativ): *Ich bin **im** Kino.*',
  },
  {
    id: 'ru-32', type: 'mc', rule: 'prep-place', asksRule: true, theory: true,
    prompt: 'Which preposition goes with the **company** you work for?',
    correct: 'bei: *Er arbeitet bei Siemens.*',
    wrong: ['in: *Er arbeitet in Siemens.*', 'aus: *Er arbeitet aus Siemens.*', 'zu: *Er arbeitet zu Siemens.*'],
    explain: '**bei** + a company or a person = at: *bei Siemens, bei Uniqa, bei meiner Oma*. For the job itself use **als**: *Er arbeitet **als** Ingenieur.*',
  },
  {
    id: 'ru-33', type: 'mc', rule: 'prep-time', asksRule: true, theory: true,
    prompt: 'How does a **year** go into a German sentence?',
    correct: 'On its own (*2019 bin ich …*) or with *im Jahr*',
    wrong: ['With *in*: *in 2019*', 'With *am*: *am 2019*', 'With *um*: *um 2019*'],
    explain: '*2019 bin ich nach Wien umgezogen* — or *Im Jahr 2019 …*. Never *in 2019*: that is English.',
  },
  {
    id: 'ru-34', type: 'match', rule: 'prep-time', asksRule: true, theory: true,
    prompt: 'Which preposition goes with which time?',
    pairs: [['a day: Montag', 'am'], ['a clock time: acht Uhr', 'um'], ['still going on: drei Wochen', 'seit'], ['a month: Juli', 'im']],
    explain: '***am** Montag, **um** acht Uhr, **seit** drei Wochen* (+ Präsens), ***im** Juli*. A year stands alone: *2019 …*',
  },
  {
    id: 'ru-35', type: 'tf', rule: 'seit', asksRule: true, theory: true,
    statement: 'For something that started in the past and is **still true**, German uses *seit* + **Perfekt**: *Ich habe seit 2016 hier gewohnt.*',
    answer: false,
    explain: 'Still true → **seit + Präsens**: *Ich **wohne** seit 2016 hier* — exactly like Polish *Mieszkam tu od 2016*. The Perfekt would mean it is over.',
  },
]);

Brezel.deck.addCards('gender', [
  {
    id: 'ru-36', type: 'mc', rule: 'female-forms', asksRule: true, theory: true,
    prompt: 'How do you make most **female** job titles?',
    correct: 'Add -in and use die: *der Lehrer → die Lehrerin*',
    wrong: ['Add -e: *die Lehrere*', 'Add -frau: *die Lehrerfrau*', 'Only change the article: *die Lehrer*'],
    explain: '**-in**, always with **die**: *die Lehrerin, die Ärztin, die Köchin* (some add an umlaut). **-mann** becomes **-frau**: *Kaufmann → Kauffrau*. Plural: **-innen**.',
  },
]);

Brezel.deck.addCards('possessive', [
  {
    id: 'ru-37', type: 'mc', rule: 'possessive-dativ', asksRule: true, theory: true,
    prompt: 'After *mit* (Dativ), what does *meine* become with a **die** word?',
    correct: 'meiner: *mit meiner Frau*',
    wrong: ['meine: *mit meine Frau*', 'meinem: *mit meinem Frau*', 'meinen: *mit meinen Frau*'],
    explain: 'Possessives take the endings of the article: die → d**er** → mein**er**. der / das → d**em** → mein**em**. Plural → d**en** → mein**en** + n: *mit meinen Freunden*.',
  },
  {
    id: 'ru-38', type: 'mc', rule: 'possessive', asksRule: true, theory: true,
    prompt: '**sein** or **ihr** (his / her) — what decides it?',
    correct: 'The owner: a man → sein, a woman → ihr',
    wrong: ['The thing owned: a der word → sein, a die word → ihr', 'sein for people, ihr for things', 'Nothing: they mean the same'],
    explain: '*Tom und **sein** Hund, Lisa und **ihr** Hund.* The thing owned only decides the **ending**: *Lisa und ihr**e** Katze*.',
  },
]);

Brezel.deck.addCards('questions', [
  {
    id: 'ru-39', type: 'mc', rule: 'nicht-kein', asksRule: true, theory: true,
    prompt: 'When do you use **kein** instead of **nicht**?',
    correct: 'To negate a noun that would have ein or no article: *kein Auto*',
    wrong: ['To negate a verb: *Ich kein komme.*', 'To negate an adjective: *Das ist kein teuer.*', 'Only in questions'],
    explain: '*Ich habe **ein** Auto → Ich habe **kein** Auto. Wir haben Kinder → Wir haben **keine** Kinder.* Everything else takes **nicht**: *Ich komme **nicht**. Das ist **nicht** teuer.*',
  },
  {
    id: 'ru-40', type: 'tf', rule: 'nicht-kein', asksRule: true, theory: true,
    statement: '**kein** takes the same endings as **ein**: *Ich habe einen Hund → Ich habe keinen Hund*.',
    answer: true,
    explain: '*kein* is the negative of *ein*, so it changes the same way: *kein**en** Hund* (Akkusativ), *kein**e** Zeit*, *mit kein**em** Auto*. In the plural: *keine Kinder*.',
  },
  {
    id: 'ru-41', type: 'mc', rule: ['w-words', 'prep-place'], asksRule: true, theory: true,
    prompt: 'The answer is *aus* + a country (*aus Polen*). Which question word was asked?',
    correct: 'Woher?', wrong: ['Wo?', 'Wohin?', 'Wann?'],
    explain: '**Woher?** (where from) → *aus*: *Woher kommst du? — Aus Polen.* **Wo?** (where) → *in*: *in Wien*. **Wohin?** (where to) → *nach*: *nach Wien*.',
  },
]);

Brezel.deck.addCards('verbs', [
  {
    id: 'ru-42', type: 'mc', rule: 'gern', asksRule: true, theory: true,
    prompt: 'Which word turns *Ich tanze* into “I like dancing”?',
    correct: 'gern', wrong: ['mag', 'gefällt', 'lieber'],
    explain: 'To like **doing** something: verb + **gern** — *Ich tanze **gern**.* To like a **thing**: *mögen* — *Ich **mag** Musik.* (*lieber* = rather: *Ich tanze lieber.*)',
  },
  {
    id: 'ru-43', type: 'mc', rule: 'modal', asksRule: true, theory: true,
    prompt: 'Which forms of a **modal verb** (*müssen, können*) have no ending?',
    correct: 'ich and er / sie / es: *ich muss, er muss*',
    wrong: ['du and ihr: *du muss, ihr müss*', 'wir and sie: *wir muss, sie muss*', 'None — modal verbs are regular'],
    explain: '*ich **kann**, du kann**st**, er **kann***: ich and er/sie/es are the same, with no ending. *müssen* and *können* also lose the umlaut in the singular: *ich muss, du musst*.',
  },
]);

Brezel.deck.addCards('prefix', [
  {
    id: 'ru-44', type: 'mc', rule: 'gefallen', asksRule: true, theory: true,
    prompt: 'In *Der Film gefällt mir* (I like the film), what is the **subject**?',
    correct: 'der Film', wrong: ['mir', 'gefällt', 'There is no subject'],
    explain: '*gefallen* works the other way round: the thing you like is the **subject** (*der Film gefällt*), the person is in the **Dativ** (*mir*). Plural thing → plural verb: *Die Schuhe gefallen mir.*',
  },
]);

Brezel.deck.addCards('reflexive', [
  {
    id: 'ru-45', type: 'mc', rule: 'reflexive-position', asksRule: true, theory: true,
    prompt: 'Where does the reflexive pronoun go in *Ich ziehe mich an*?',
    correct: 'Right after the conjugated verb',
    wrong: ['At the very end, after the prefix', 'Before the verb', 'In position 1'],
    explain: '*Ich **ziehe mich** an. Er **wäscht sich**.* After inversion it follows the subject pronoun: *Morgens **dusche ich mich***. A separable prefix still goes last.',
  },
]);

Brezel.deck.addCards('pastq', [
  {
    id: 'ru-46', type: 'mc', rule: 'perfekt-answer', asksRule: true, theory: true,
    prompt: 'The question has *schon einmal* (ever). How does a **no** answer go?',
    correct: 'Nein, ich habe noch nie …',
    wrong: ['Nein, ich habe schon nie …', 'Nein, ich habe kein einmal …', 'Nein, ich habe nicht schon …'],
    explain: '*Hast du **schon einmal** Tango getanzt? — Nein, ich habe **noch nie** Tango getanzt.* **noch nie** (never) goes where *schon einmal* was.',
  },
]);

Brezel.deck.addCards('vocab', [
  {
    id: 'ru-47', type: 'mc', rule: 'vocab-nouns', asksRule: true, theory: true,
    prompt: 'Which words start with a **capital letter** in German?',
    correct: 'Every noun, also in the middle of a sentence',
    wrong: ['Only names of people and places', 'Nouns and adjectives', 'Only the first word of a sentence'],
    explain: '*Ich habe einen **H**und und eine **K**atze.* Names, the first word and formal **Sie** have one too — but adjectives stay small: *schön, groß*.',
  },
  {
    id: 'ru-48', type: 'mc', rule: 'compounds', asksRule: true, theory: true,
    prompt: 'In a compound noun like *Küchenschrank*, which part decides the article?',
    correct: 'The last part: der Schrank → der Küchenschrank',
    wrong: ['The first part: die Küche → die Küchenschrank', 'The longer part', 'None — compounds are always das'],
    explain: 'The last part is the main word; the first one describes it. A *Küchenschrank* is a kind of *Schrank*, so it is **der**. *das Haus + die Tür → **die** Haustür*.',
  },
  {
    id: 'ru-49', type: 'mc', rule: 'vocab', asksRule: true, theory: true,
    prompt: 'Which ending makes a **person** out of a verb (*backen* → someone who bakes)?',
    correct: '-er / -erin: *der Bäcker, die Bäckerin*',
    wrong: ['-ung: *die Backung*', '-heit: *die Backheit*', '-chen: *das Bäckchen*'],
    explain: '*backen → der Bäck**er** / die Bäck**erin***, *spielen → der Spiel**er***. **-ung** makes a thing or an action, always *die*: *üben → die Übung*.',
  },
  {
    id: 'ru-50', type: 'mc', rule: 'false-friends', asksRule: true, theory: true,
    prompt: 'What is a **false friend**?',
    correct: 'A word that looks like an English word but means something else',
    wrong: ['A word with two genders', 'A verb that is irregular in German but regular in English', 'A word that only exists in Austria'],
    explain: '*bekommen* = to **get**, not *to become* (that is *werden*). Some German words also look like each other: *Freunde* (friends) ≠ *Freude* (joy).',
  },
]);
