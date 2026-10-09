/* Modal verbs and "gern". (Separable verbs live in 11-prefix-verbs.js.) */
Brezel.deck.addCards('verbs', [
  {
    id: 'mv-02', type: 'type',
    prompt: 'Type the correct form of **müssen**',
    q: 'Pedro ___ Patente lesen.', hint: 'müssen',
    answer: 'muss',
    explain: 'er/sie/es **muss** — no -t ending for modal verbs! (ich muss, er muss)',
  },
  {
    id: 'mv-03', type: 'type',
    prompt: 'Type the correct form of **müssen**',
    q: 'Was ___ du bei der Arbeit machen?', hint: 'müssen',
    answer: 'musst',
    explain: 'du **musst** (no umlaut in the singular).',
  },
  {
    id: 'mv-04', type: 'mc',
    prompt: 'Which sentence is correct?',
    correct: 'Martina muss mit Kunden telefonieren.',
    wrong: ['Martina muss mit Kunden telefoniert.', 'Martina muss telefonieren mit Kunden.', 'Martina müssen mit Kunden telefonieren.'],
    explain: '**muss** (sie-form) in position 2 + **telefonieren** (infinitive) at the end.',
  },
  {
    id: 'mv-05', type: 'spot',
    q: 'Pedro muss Briefe an Patentanwälte schreibt.',
    wrong: 'schreibt', correct: 'schreiben',
    explain: 'After a modal verb the second verb stays in the **infinitive**: muss … **schreiben**.',
  },
  {
    id: 'mv-06', type: 'order',
    en: 'I don’t want to spend a lot of money.',
    answer: 'Ich möchte nicht viel Geld ausgeben.',
    explain: '**möchte** in position 2, **ausgeben** at the end.',
  },
  {
    id: 'mv-14', type: 'mc',
    prompt: 'How do you say *I like playing football*?',
    correct: 'Ich spiele gern Fußball.', wrong: ['Ich mag Fußball spielen gern.', 'Ich lieb Fußball spiele.', 'Ich gern spiele Fußball.'],
    explain: 'verb + **gern**: *Ich spiele gern Fußball.*',
  },
  {
    id: 'mv-15', type: 'mc',
    prompt: 'How do you say *I like football* (the thing itself)?',
    correct: 'Ich mag Fußball.', wrong: ['Ich gern Fußball.', 'Ich mage Fußball.', 'Ich bin gern Fußball.'],
    explain: '**mögen** + a noun: *Ich mag Fußball.* **gern** + a verb: *Ich spiele gern Fußball.*',
  },
  {
    id: 'mv-16', type: 'order',
    en: 'Can you cook? (formal)',
    answer: 'Können Sie kochen?',
    explain: 'Question: **Können** first, **kochen** at the end.',
  },
]);
