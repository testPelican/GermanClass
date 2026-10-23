/*
 * The grammar rules behind the cards, shown in the 📖 Glossary. Each card names its rule:
 *   { id: 'pr-01', type: 'type', rule: 'present-endings', … }   (or rule: ['a', 'b'])
 * A card without a rule shows its topic tip instead. If the rule itself gives the answer away
 * (a card that asks about the rule, a table of exactly these forms), add asksRule: true and the
 * Glossary keeps the rule folded until the learner asks for it.
 *
 *   { id, title, text?, table?: { head?: [...], rows: [[...], …] }, points?: [...] }
 * **bold** and *italic* work as in card text, also in table cells. A table row starts with its label.
 * Examples here are deliberately not the sentences from the cards (tools/validate.js checks).
 */
Brezel.deck.addRules([
  // --- word order ---------------------------------------------------------------------
  {
    id: 'verb-2',
    title: 'The verb comes second',
    text: 'In a German statement the **conjugated verb** (the one with the personal ending) is always the **second element**. Position 1 holds exactly one thing — the subject or something else.',
    points: [
      '*Anna* (1) **arbeitet** (2) in Graz.',
      'Position 1 can be a whole group of words: *Mein neuer Kollege* (1) **kommt** (2) aus Italien.',
      'Age: *sein* + number + *Jahre alt*: *Tom ist 40 Jahre alt.*',
    ],
  },
  {
    id: 'inversion',
    title: 'Something else first → verb, then subject',
    text: 'When a sentence starts with a time, a place or another phrase, that phrase is position 1. The verb stays in **position 2**, so the subject moves **behind the verb**.',
    points: [
      '*Morgen* **fahre ich** nach Graz. — never *Morgen ich fahre*.',
      '*Am Wochenende* **spielt Tom** Tennis.',
      'Only the order changes, not the verb form: *ich fahre → fahre ich*.',
    ],
  },
  {
    id: 'verb-end',
    title: 'Two verb parts: the second one goes to the end',
    text: 'If a sentence has two verb parts, the conjugated one stands in position 2 and the other goes to the **very end**. Everything else sits in between, like in a bracket.',
    points: [
      'Perfekt: *Ich **habe** gestern lange **gearbeitet**.*',
      'Modal verb: *Du **kannst** sehr gut **kochen**.*',
      'Separable verb: *Der Bus **kommt** um acht **an**.*',
    ],
  },
  {
    id: 'yes-no',
    title: 'Yes/no questions start with the verb',
    text: 'A question you answer with *ja* or *nein* starts with the **conjugated verb**, then the subject. German needs no helper like English *do*.',
    points: [
      '*Kommst du heute?* = Are you coming today?',
      '*Hat Tom einen Hund?* = Does Tom have a dog?',
      'A second verb part still goes to the end: *Kannst du morgen **helfen**?*',
    ],
  },
  {
    id: 'w-question',
    title: 'W-questions: W-word, verb, subject',
    text: 'A question with a question word: **W-word (1) + verb (2) + subject**, then the rest. A second verb part still goes to the end.',
    points: ['*Wo **arbeitet** dein Bruder?*', '*Wann **hast** du das Auto **gekauft**?*'],
  },

  // --- present tense ---------------------------------------------------------------------
  {
    id: 'present-endings',
    title: 'Present tense endings',
    text: 'Take the stem (the infinitive without *-en*: *wohn-en*) and add the ending for the person:',
    points: [
      'ich **-e** · du **-st** · er / sie / es **-t**',
      'wir **-en** · ihr **-t** · sie / Sie **-en**',
      'A name or a noun is *er / sie / es*: *Tom tanzt, die Firma sucht*. Two people are *sie* (they): *Tom und Lisa tanzen*.',
      'Formal **Sie** always takes the *-en* form, like *wir*: *Tanzen Sie gern?*',
      'The subject decides the ending — it isn’t always the first word: *Gefällt **dir** das Bild?* → the subject is *das Bild*.',
    ],
  },
  {
    id: 'present-stem',
    title: 'Stems that need care',
    text: 'Some stems change how the ending is added:',
    points: [
      'Stem ends in **-t** or **-d**: add an extra **e** with du, er/sie/es and ihr, so you can hear the ending: *du redest, er wartet, ihr findet*.',
      'Stem ends in **-s, -ß** or **-z**: du only adds **-t**: *du reist, du sitzt*.',
      'Verbs in **-eln** lose an e with ich: *ich sammle*, but *er sammelt*.',
      'Verbs in **-ieren** are regular in the present: *er diskutiert*.',
    ],
  },
  {
    id: 'vowel-change',
    title: 'Vowel change with du and er / sie / es',
    text: 'Some irregular verbs change their stem vowel — but **only with du and er / sie / es**. ich, wir, ihr and sie / Sie keep the vowel of the infinitive.',
    points: [
      '**a → ä**: *tragen → du trägst, er trägt*',
      '**e → i**: *nehmen → du nimmst, er nimmt*',
      '**e → ie**: *empfehlen → du empfiehlst, sie empfiehlt*',
      '**ihr** never changes: *ihr tragt, ihr nehmt, ihr empfehlt*',
    ],
  },
  {
    id: 'sein-haben',
    title: 'sein and haben',
    text: 'The two most important verbs are irregular — learn them by heart.',
    points: [
      '**sein**: ich bin, du bist, er ist, wir sind, ihr **seid**, sie sind',
      '**haben**: ich habe, du **hast**, er **hat**, wir haben, ihr habt, sie haben',
      '*seid* (you are, with **d**) ≠ *seit* (since, with **t**) · *ist* (is) ≠ *isst* (eats)',
    ],
  },
  {
    id: 'es-gibt',
    title: 'es gibt = there is / there are',
    text: '**es gibt** means *there is* or *there are*. It is always *gibt*, even for many things, and the thing after it is in the **Akkusativ**.',
    points: ['*Hier gibt es einen Park.* (der Park → einen)', 'Question: *Gibt es hier ein Kino?*'],
  },

  // --- Perfekt ------------------------------------------------------------------------------
  {
    id: 'perfekt-form',
    title: 'Perfekt = Hilfsverb + Partizip II',
    text: 'The Perfekt (the past you speak) has two parts: the **Hilfsverb** *haben* or *sein*, conjugated in position 2, and the **Partizip II** at the very end. The participle never changes.',
    points: [
      '*Ich **habe** einen Kuchen **gebacken**.*',
      '*Gestern **sind** wir ins Museum **gegangen**.*',
      'Only the Hilfsverb changes with the person: *ich habe getanzt, du hast getanzt, sie hat getanzt*.',
    ],
  },
  {
    id: 'perfekt-aux',
    title: 'Perfekt: haben or sein?',
    text: 'Most verbs take **haben**. **sein** is for verbs that describe a **change of place or state** (*Wechsel von Ort oder Zustand*) — plus *sein* and *bleiben* themselves.',
    points: [
      '**sein** — moving from A to B: *gehen, fahren, fliegen, laufen, kommen, umziehen*',
      '**sein** — a change of state or position: *aufstehen, einschlafen, aufwachen*, and *geboren*',
      '**sein** — the two special ones: *ich bin gewesen, ich bin geblieben*',
      '**haben** — everything else, also irregular verbs and long activities: *ich habe geschlafen, gegessen, gearbeitet*',
      'Reflexive verbs always take **haben**: *ich habe mich gewaschen*.',
    ],
  },
  {
    id: 'partizip-regular',
    title: 'Partizip II of regular verbs: ge…t',
    text: 'Regular verbs keep their stem: **ge + stem + t**.',
    points: [
      '*lernen → gelernt*, *tanzen → getanzt*',
      'Stem ends in -t, -d or a consonant + n: **ge…et**, so you can hear it: *warten → gewartet*, *regnen → geregnet*',
      'The ending is **-t**, never -en: not *getanzen*.',
    ],
  },
  {
    id: 'partizip-irregular',
    title: 'Partizip II of irregular verbs: ge…en',
    text: 'Irregular verbs end in **-en**, and the vowel often changes — like English *drink – drunk*. There is no rule for the vowel, so learn the participle together with the verb.',
    points: [
      '*finden → gefunden*, *werfen → geworfen*, *sitzen → gesessen*',
      'A regular -t ending never mixes in: not *gefindet*.',
    ],
  },
  {
    id: 'partizip-no-ge',
    title: 'No ge-: -ieren verbs and inseparable prefixes',
    text: 'Some verbs get **no ge-** in the Partizip II:',
    points: [
      'Verbs in **-ieren**: *diskutieren → diskutiert*, *passieren → passiert*',
      'Verbs with an inseparable prefix — **be-, ge-, er-, ver-, ent-, zer-**, and usually **über-, unter-**: *verkaufen → verkauft*, *erzählen → erzählt*',
      'The ending is still -t (regular) or -en (irregular): *verstehen → verstanden*',
    ],
  },
  {
    id: 'partizip-separable',
    title: 'Separable verbs: ge in the middle',
    text: 'With a separable verb, **ge** goes between the prefix and the verb, and the participle is one word at the end.',
    points: ['*aufmachen → auf**ge**macht*', '*mitbringen → mit**ge**bracht*', '*zurückkommen → zurück**ge**kommen*'],
  },
  {
    id: 'partizip',
    title: 'How to build the Partizip II',
    points: [
      'Regular: **ge…t** — *lernen → gelernt*',
      'Irregular: **ge…en**, often with a new vowel — *finden → gefunden*',
      '**-ieren** and inseparable prefixes (be-, ver-, er-, ent-, ge-): **no ge** — *diskutiert, verkauft*',
      'Separable: **prefix + ge + verb** — *aufgemacht, mitgebracht*',
    ],
  },

  // --- cases, articles -----------------------------------------------------------------------
  {
    id: 'cases',
    title: 'The four cases',
    text: 'The **article** shows what a noun does in the sentence. The table shows a **masculine** noun (*der Hund*); the rule of each case has all the forms.',
    table: {
      head: ['', 'the', 'a', 'my'],
      rows: [
        ['Nominativ', 'der', 'ein', 'mein'],
        ['Akkusativ', 'den', 'einen', 'meinen'],
        ['Dativ', 'dem', 'einem', 'meinem'],
        ['Genitiv', 'des', 'eines', 'meines'],
      ],
    },
    points: [
      '**Nominativ** (*Wer? Was?*) — the subject, who does it: ***Der Hund** schläft.*',
      '**Akkusativ** (*Wen? Was?*) — the object of most verbs: *Ich sehe **den Hund**.*',
      '**Dativ** (*Wem?*) — the person who gets something, and after *mit, bei, zu …*: *Ich gebe **dem Hund** Wasser.*',
      '**Genitiv** (*Wessen?*) — whose? The noun adds **-s**: *der Ball **des Hundes***',
      '*kein, dein, sein, ihr, unser …* take the same endings as *ein* and *mein*.',
    ],
  },
  {
    id: 'nominativ',
    title: 'Nominativ: der, ein, mein',
    text: 'The **Nominativ** is the **subject**: the person or thing that does something (*Wer? Was?*). It is the form in the dictionary.',
    table: {
      head: ['', 'masc.', 'fem.', 'neut.', 'plural'],
      rows: [
        ['the', 'der', 'die', 'das', 'die'],
        ['a', 'ein', 'eine', 'ein', '—'],
        ['no', 'kein', 'keine', 'kein', 'keine'],
        ['my', 'mein', 'meine', 'mein', 'meine'],
      ],
    },
    points: [
      '***Mein Bruder** wohnt in Graz.* Who lives in Graz? → my brother = the subject.',
      'The subject isn’t always first: *Heute kommt **mein Bruder**.*',
      'After **sein** the noun is Nominativ too: *Tom ist **mein Freund**.*',
    ],
  },
  {
    id: 'mit-dativ',
    title: 'mit + Dativ',
    text: 'After **mit** (and *bei, nach, aus, zu, seit*) comes the **Dativ**. The article changes:',
    points: [
      'der → **dem**: *mit dem Hund*',
      'das → **dem**: *mit dem Fahrrad*',
      'die → **der**: *mit der Katze*',
      'plural → **den**, and the noun gets an extra **-n**: *mit den Kindern*',
      '*ein, mein, kein* work the same way: *mit einem, mit meiner, mit meinen*',
    ],
  },
  {
    id: 'akkusativ',
    title: 'Akkusativ: den, einen, meinen',
    text: 'The **object** of most verbs (what you have, read, need, see …) is in the Akkusativ (*Wen? Was?*). Only **masculine** words change:',
    table: {
      head: ['', 'masc.', 'fem.', 'neut.', 'plural'],
      rows: [
        ['the', '**den**', 'die', 'das', 'die'],
        ['a', '**einen**', 'eine', 'ein', '—'],
        ['no', '**keinen**', 'keine', 'kein', 'keine'],
        ['my', '**meinen**', 'meine', 'mein', 'meine'],
      ],
    },
    points: [
      'der → **den**, ein → **einen**, kein → **keinen**, mein → **meinen**',
      'die, das and plural stay the same: *eine Katze, ein Fahrrad, keine Zeit*',
      'The subject (who does it) stays in the Nominativ: ***Der** Hund sieht **den** Mann.*',
      'Always Akkusativ after **für, ohne, durch, gegen, um**: *ein Geschenk für meinen Vater*',
    ],
  },
  {
    id: 'dativ',
    title: 'Dativ: dem, einem, meinem',
    text: 'The **Dativ** is usually the **person** who gets something or is helped (*Wem?* = to whom?). It also comes after **mit, bei, nach, aus, zu, seit, von**.',
    table: {
      head: ['', 'masc.', 'fem.', 'neut.', 'plural'],
      rows: [
        ['the', 'dem', 'der', 'dem', 'den'],
        ['a', 'einem', 'einer', 'einem', '—'],
        ['no', 'keinem', 'keiner', 'keinem', 'keinen'],
        ['my', 'meinem', 'meiner', 'meinem', 'meinen'],
        ['noun', '—', '—', '—', '**+ -n**'],
      ],
    },
    points: [
      '*Ich gebe **dem Kind** einen Apfel.* Who gets the apple? → the child = Dativ (the apple = Akkusativ).',
      'Some verbs always take the Dativ: **helfen, danken, gefallen, gehören**: *Das Buch gehört **meinem** Bruder.*',
      'Pronouns: mir, dir, ihm, ihr, uns, euch, ihnen / Ihnen',
      'Plural: **den**, and the noun gets an extra **-n**: *mit den Kindern*',
    ],
  },
  {
    id: 'genitiv',
    title: 'Genitiv: des, eines, meines',
    text: 'The **Genitiv** says **whose** something is (*Wessen?* = whose?). It comes **after** the thing: *das Auto des Lehrers*. Masculine and neuter nouns add **-s**, short ones often **-es**.',
    table: {
      head: ['', 'masc.', 'fem.', 'neut.', 'plural'],
      rows: [
        ['the', 'des', 'der', 'des', 'der'],
        ['a', 'eines', 'einer', 'eines', '—'],
        ['no', 'keines', 'keiner', 'keines', 'keiner'],
        ['my', 'meines', 'meiner', 'meines', 'meiner'],
        ['noun', '**+ -(e)s**', '—', '**+ -(e)s**', '—'],
      ],
    },
    points: [
      '*das Zimmer **des** Kind**es***, *die Tasche **meiner** Schwester*, *die Spielsachen **der** Kinder*',
      'Names just add **-s**, with no apostrophe: *Annas Auto, Toms Hund*',
      'When **speaking**, people often say **von + Dativ** instead: *das Auto von meinem Vater*',
      'Some prepositions take the Genitiv in writing, e.g. **wegen** (because of): *wegen des Wetters*',
    ],
  },
  {
    id: 'gender',
    title: 'der, die or das?',
    text: 'Learn every noun **with its article**. Some endings help:',
    points: [
      '**-ung, -heit, -keit, -in** → *die*: *die Zeitung, die Freiheit*',
      '**-um, -chen** → *das*: *das Museum, das Mädchen*',
      'In a compound noun the **last part** decides: *das Haus + die Tür → die Haustür*',
      'The indefinite article follows the gender: der / das → **ein**, die → **eine**',
    ],
  },

  // --- prepositions ---------------------------------------------------------------------------
  {
    id: 'im-ins',
    title: 'im (where?) or ins (where to?)',
    text: '**in** answers two questions. *Wo?* (where is it?) takes the Dativ, *Wohin?* (where to?) takes the Akkusativ. With der / das words you use the short forms:',
    points: [
      '**im** = in dem → *Wo?*: *Ich bin im Büro.*',
      '**ins** = in das → *Wohin?*: *Ich gehe ins Büro.*',
      'With die words: *in der Stadt* (where) · *in die Stadt* (where to)',
    ],
  },
  {
    id: 'prep-place',
    title: 'aus, nach, in, bei, zu, als',
    points: [
      '**aus** = from (where you come from): *Ich komme aus Italien.*',
      '**nach** + city or country = to: *Wir fliegen nach Rom.*',
      '**in** = in (being there): *Sie wohnt in Graz.*',
      '**bei** + a company or a person = at: *Er arbeitet bei Siemens. Ich bin bei meiner Oma.*',
      '**zu** = to a person or place; **zur** = zu der, **zum** = zu dem: *zur Arbeit, zum Arzt*',
      '**als** + job = as: *Sie arbeitet als Ingenieurin.*',
    ],
  },
  {
    id: 'prep-time',
    title: 'Time: am, um, seit — and no preposition before a year',
    points: [
      '**am** (= an dem) + day or part of the day: *am Montag, am Abend*',
      '**um** + clock time: *um acht Uhr*',
      '**seit** + present tense = since / for: *seit drei Wochen*',
      'A year stands **alone**: *2019 habe ich …* — or *im Jahr 2019*, but never *in 2019*.',
    ],
  },
  {
    id: 'seit',
    title: 'seit + Präsens',
    text: 'If something started in the past and is **still true now**, German uses **seit + Präsens** — exactly like Polish *od*. English needs *have been / have …ed*.',
    points: [
      '*Tom spielt seit fünf Jahren Tennis.* = Tom has been playing tennis for five years.',
      'Not the Perfekt: *Tom hat … gespielt* would mean it is over.',
      '*seit* (since) ≠ *seid* (the ihr form of sein).',
    ],
  },

  // --- female forms -------------------------------------------------------------------------------
  {
    id: 'female-forms',
    title: 'Female and male job titles',
    points: [
      'Most female forms add **-in** and take *die*: *der Bäcker → die Bäckerin*',
      'Some add an **umlaut** too: *der Anwalt → die Anwältin*',
      '**-mann → -frau**: *der Fachmann → die Fachfrau*',
      'Plural female: **-innen** (double n): *die Bäckerinnen*',
      'Male form: drop the -in: *die Malerin → der Maler*',
      'After *sein*, jobs usually have no article: *Sie ist Bäckerin.*',
    ],
  },

  // --- possessives --------------------------------------------------------------------------------
  {
    id: 'possessive',
    title: 'mein, dein, sein, ihr …',
    points: [
      '**mein** for der and das words: *mein Vater, mein Fahrrad*',
      '**meine** for die words and plurals: *meine Oma, meine Kinder*',
      'dein (your), **sein** (his), **ihr** (her), unser (our), euer (your, plural), ihr (their) and **Ihr** (formal your, with a capital I) take the same endings.',
      'Whose? A man → **sein**, a woman → **ihr**: *Tom und sein Hund, Lisa und ihr Hund*.',
    ],
  },
  {
    id: 'possessive-dativ',
    title: 'After mit / in: meinem, meiner, meinen',
    text: 'In the Dativ, possessives take the endings of *dem / der / den*:',
    points: [
      'der / das → **meinem** (like *dem*): *mit meinem Bruder*',
      'die → **meiner** (like *der*): *in meiner Wohnung*',
      'plural → **meinen**, noun + -n (like *den*): *mit meinen Eltern*',
      'The same for dein, sein, ihr …: *mit seiner Oma, in ihrer Stadt*',
    ],
  },

  // --- questions, negation ------------------------------------------------------------------------
  {
    id: 'w-words',
    title: 'Question words',
    points: [
      '**Wo?** where · **Woher?** where from · **Wohin?** where to',
      '**Wer?** who · **Was?** what · **Wann?** when',
      '**Wie?** how — *Wie alt …?* how old · *Wie lange …?* how long',
      '**Welcher / welche / welches?** which — with the endings of der / die / das: *in welchem Haus?*',
    ],
  },
  {
    id: 'nicht-kein',
    title: 'nicht or kein?',
    points: [
      '**kein / keine** negates a **noun** that would have *ein* or no article: *Ich habe kein Fahrrad. Wir haben keine Kinder.*',
      '**nicht** negates everything else — verbs, adjectives, names: *Das ist nicht teuer. Ich komme nicht.*',
      '*kein* takes the endings of *ein*: **keinen** for a masculine object.',
      '*nicht* goes after the object, or just before the second verb part: *Ich kenne ihn nicht. Ich habe gestern nicht gekocht.*',
    ],
  },

  // --- modal verbs, gern --------------------------------------------------------------------------
  {
    id: 'modal',
    title: 'Modal verbs: muss, kann, möchte',
    points: [
      'The modal verb is in **position 2**; the second verb goes to the **end**, unchanged (infinitive): *Ich muss heute lange arbeiten.*',
      'ich and er / sie / es have **no ending** and the same form: *ich muss, er muss · ich kann, sie kann*',
      '*müssen* and *können* lose the umlaut in the singular: *du musst, du kannst*',
      'Question: the modal verb first: *Kannst du schwimmen?*',
    ],
  },
  {
    id: 'gern',
    title: 'gern or mögen?',
    points: [
      'To like **doing** something: verb + **gern**: *Ich tanze gern.* (*lieber* = rather)',
      'To like a **thing or a person**: **mögen**: *Ich mag Pizza.*',
      '*gern* comes right after the verb and its subject: *Tanzt du gern?*',
    ],
  },

  // --- separable / inseparable verbs ---------------------------------------------------------------
  {
    id: 'separable',
    title: 'Separable verbs split',
    text: 'A separable prefix is a real little word (*an, auf, aus, ein, fern, mit, um, vor, zurück*). In the **present** and the **Präteritum** the verb goes to position 2 and the prefix to the **very end**.',
    points: [
      '*aufmachen*: *Ich **mache** das Fenster **auf**.*',
      'Präteritum: *Er **machte** das Fenster **auf**.*',
      'With a modal verb it stays together at the end: *Ich will das Fenster aufmachen.*',
      'A command starts with the verb; the prefix still goes last: *Mach das Fenster auf!*',
    ],
  },
  {
    id: 'inseparable',
    title: 'Inseparable verbs stay together',
    text: 'Prefixes that are not words on their own — **be-, er-, ver-, ent-, ge-, zer-** — never split. **über-** and **unter-** are usually inseparable too.',
    points: [
      '*verstehen*: *Ich **verstehe** dich.* — never *stehe … ver*',
      '*übernachten*: *Wir **übernachten** im Hotel.*',
      'No ge- in the Partizip II: *verstanden, erzählt, übernachtet*',
      'How to tell: can the prefix stand alone? *auf* yes → separable; *ver* no → inseparable.',
    ],
  },
  {
    id: 'gefallen',
    title: 'gefallen: the thing you like is the subject',
    text: '**gefallen** (to please) works the other way round: what you like is the **subject**, and the person is in the Dativ (*mir, dir, ihm …*).',
    points: [
      '*Der Film gefällt mir.* = I like the film (the film pleases me).',
      'Plural thing → plural verb: *Die Schuhe gefallen mir.*',
      'It changes a → ä with er / sie / es (*es gefällt*), and it never splits: *ge-* is inseparable.',
    ],
  },

  // --- tenses ---------------------------------------------------------------------------------------
  {
    id: 'tenses',
    title: 'Präsens, Perfekt, Präteritum',
    points: [
      '**Präsens** = now, habits, and the future with a time word: *Am Montag gehe ich schwimmen.*',
      '**Perfekt** = the past when **speaking**, two parts: *ich habe gekocht*',
      '**Präteritum** = the same past in **writing** (stories, news), one word: *ich kochte*',
      'German has no *-ing* form: *ich koche* = I cook / I am cooking (Polish *gotuję*).',
      'The past is the same for men and women — only the person changes the verb.',
    ],
  },
  {
    id: 'regular-irregular',
    title: 'Regular or irregular?',
    points: [
      '**Regular** verbs keep their stem: *lernen – lernte – gelernt*',
      '**Irregular** verbs change it: *rufen – rief – gerufen*',
      'You can’t tell from the infinitive — learn the three forms: Infinitiv – Präteritum – Perfekt.',
      'Many verbs are irregular in English too, often with similar vowels: *swim – swam – swum / schwimmen – schwamm – geschwommen*.',
    ],
  },

  // --- Präteritum -------------------------------------------------------------------------------------
  {
    id: 'praet-sein-haben',
    title: 'Präteritum of sein and haben',
    points: [
      '**sein**: ich war, du warst, er war, wir waren, ihr wart, sie waren',
      '**haben**: ich hatte, du hattest, er hatte, wir hatten, ihr hattet, sie hatten',
      'These two are normal in **speech** as well: *Ich war müde* sounds more natural than *Ich bin müde gewesen*.',
    ],
  },
  {
    id: 'praet-regular',
    title: 'Präteritum of regular verbs: -te',
    points: [
      'stem + **-te** + ending: *ich spielte, du spieltest, er spielte, wir spielten, ihr spieltet, sie spielten*',
      'Stem ends in -t or -d: **-ete**: *er wartete, sie redete*',
      '**ich = er / sie / es**, with no extra ending: *ich spielte = sie spielte*',
    ],
  },
  {
    id: 'praet-irregular',
    title: 'Präteritum of irregular verbs: a new stem, no -te',
    points: [
      'The stem changes and there is **no -te**: *finden → fand*, *schreiben → schrieb*',
      'ich and er / sie / es have **no ending**: *ich fand, er fand* — not *er fandt*',
      'The other endings: du **-st**, wir **-en**, ihr **-t**, sie **-en**: *du fandst, wir fanden*',
    ],
  },

  // --- reflexive verbs ---------------------------------------------------------------------------------
  {
    id: 'reflexive-pronouns',
    title: 'Reflexive pronouns',
    text: 'A reflexive verb needs a pronoun that points back to the subject. Polish says *się* for everyone; German changes it with the person:',
    points: [
      'ich **mich** · du **dich** · er / sie / es **sich**',
      'wir **uns** · ihr **euch** · sie / Sie **sich**',
      'Formal *Sie* → **sich**, with a small s.',
    ],
  },
  {
    id: 'reflexive-position',
    title: 'Where the reflexive pronoun goes',
    points: [
      'Right after the conjugated verb: *Ich **wasche mich**.*',
      'After inversion it follows the subject pronoun: *Morgen **treffe ich mich** mit Tom.*',
      'A separable prefix still goes last: *Ich ziehe mich schnell um.*',
      'If the subject is a noun after the verb, *sich* may come before it: *Heute hat sich Tom verspätet.*',
    ],
  },
  {
    id: 'reflexive-perfekt',
    title: 'Reflexive verbs in the Perfekt: always haben',
    points: [
      'Always **haben** + pronoun + … + Partizip II at the end: *Er hat sich nicht rasiert.*',
      'Even a verb that takes *sein* on its own takes **haben** once it has *sich* — and it usually means something else then.',
    ],
  },
  {
    id: 'reflexive',
    title: 'What is a reflexive verb?',
    points: [
      'The action goes back to the subject: *Ich wasche mich* = I wash myself (Polish *myję się*).',
      '**echt reflexiv** — always with *sich*: *sich schämen, sich verspäten*',
      '**teilreflexiv** — *sich* or another object: *Ich wasche mich. / Ich wasche das Auto.*',
      'German and Polish don’t always match: *sich erholen* (to rest) is reflexive, *odpoczywać* isn’t.',
    ],
  },

  // --- talking about the past ----------------------------------------------------------------------------
  {
    id: 'perfekt-question',
    title: 'Questions in the Perfekt',
    points: [
      'Yes/no question: **Hilfsverb first**, participle last: *Hast du schon gegessen?*',
      'W-question: **W-word + Hilfsverb + subject** … participle: *Was hast du gekauft?*',
      '*schon einmal* = ever: *Hast du schon einmal Tango getanzt?*',
    ],
  },
  {
    id: 'perfekt-answer',
    title: 'Answering about the past',
    points: [
      'Keep the Hilfsverb and change the person: *Haben Sie …? / Hast du …?* → *Ja, ich habe …*',
      '*schon einmal* in the question → **noch nie** (never) in a no-answer, in the same place: *Nein, ich habe noch nie Tango getanzt.*',
      'Present → past: *Heute tanze ich.* → *Gestern habe ich getanzt.* (time word, Hilfsverb, subject … participle)',
    ],
  },

  // --- vocabulary ---------------------------------------------------------------------------------------
  {
    id: 'vocab-nouns',
    title: 'Nouns: capital letter and article',
    points: [
      'Every noun starts with a **capital letter**, also in the middle of a sentence: *Ich habe einen Hund.*',
      'Learn each noun with its **article** and **plural**: *der Tisch, die Tische*.',
      'Adjectives and adverbs stay small: *schön, oft, heute*.',
    ],
  },
  {
    id: 'compounds',
    title: 'Long words are built from short ones',
    points: [
      'Split them into parts: *Kranken + haus* (sick + house = hospital), *Wörter + buch* (dictionary)',
      'Sometimes an **s** joins the parts: *Arbeit + s + platz*',
      'The **last part** decides the article and the meaning: *der Küchenschrank* is a kind of *Schrank*.',
    ],
  },
  {
    id: 'false-friends',
    title: 'Words to watch',
    text: 'Some words look like English words, or like each other, but mean something else:',
    points: [
      '*bekommen* = to get (to become = *werden*)',
      '*Freunde* = friends · *Freude* = joy',
      '*Bedienung* = service · *Bedingung* = condition',
      '*alle* = all (people / things) · *alles* = everything',
      '*die Brille* = glasses — one thing in German, so it’s singular: *Die Brille ist neu.*',
    ],
  },
  {
    id: 'vocab',
    title: 'Learning new words',
    points: [
      'Learn words together with the words they go with: *Zähne putzen, einen Fehler machen, Rad fahren*.',
      'A person who does something often ends in **-er** (male) / **-erin** (female): *backen → der Bäcker, die Bäckerin*.',
      'Many verbs have a noun in **-ung** (always *die*): *zahlen → die Zahlung*, *üben → die Übung*.',
    ],
  },
]);
