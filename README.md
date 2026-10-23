# 🥨 Brezel — German grammar flashcards

A Duolingo-style flashcard app built from your class notes: 500 cards across
15 topics, plus a 📏 **Rules** topic, in 9 exercise types. It runs offline in
any modern browser; nothing to install.

## Open it

Double-click **`Brezel.html`**. It is the whole app in one file, so it opens
anywhere with no other files and no server needed. It is also the file to copy
to your phone.

`index.html` runs the same app straight from the source files. It needs the
browser to be able to read the other files in the folder. On a Mac, apps can't
read files in **Downloads**, Desktop or Documents without permission. In that
case, `index.html` shows a white screen and the console reports "Loading failed
for the <script>". To fix it, either use `Brezel.html`, or allow access under
System Settings → Privacy & Security → Files and Folders → Firefox → Downloads
Folder.

Progress is stored in the browser's local storage, so each browser or device
keeps its own progress.

## How a session works

- The start screen shows how far you are, e.g. **23/500**. A card only counts
  once you answer it correctly. Then it comes back for reviews (see below).
- **Start** first takes the reviews that are due, then new cards, up to the
  session size, and mixes them. Cards and answer options are shuffled every
  session.
- If you get a card wrong, the correct answer and the reason are shown, and the
  card goes back into the pile at a random later spot in the same session.
- **Practise mistakes** replays every card you have ever got wrong. It is extra
  training only and doesn't change your progress.
- When all 500 are done, **Review** shows your strong and weak topics, mastery
  per topic, first-try accuracy per exercise type and accuracy per session.
  Every chart can be switched to a table.

### Reviews (spaced repetition)

A mastered card comes back for a review, later and later each time you get
it right:

| Step | 1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|
| Comes back after | 1 day | 3 days | 7 days | 2 weeks | 1 month | 3 months |

- A right answer on its day moves the card one step up.
- A wrong answer moves it **two steps down** (never below step 1) and keeps it
  in today's pile. Once you get it right again, it comes back tomorrow and
  climbs from there.
- The start screen shows **🔁 N cards to review today**, and each topic shows
  how many of its cards are due. A review card is tagged **🔁 Review** with
  its step (●●○○○○), and after a right answer the app says when it comes back.
- When nothing is due and every card of a topic is mastered, the topic says
  **All caught up** and when the next review is.
- *Practise mistakes* doesn't change the review steps.
- The **Progress report** shows how many cards are *Learning* (steps 1–2),
  *Getting solid* (3–4) and *Solid* (5–6), and the reviews coming up in the
  next 7 days.
- Cards mastered before reviews existed got a schedule the first time the new
  version opened: step 2 if they were right on the first try, otherwise step 1.
  The ones already overdue were spread over the next days, at most 25 a day,
  oldest first.

### The Rule book

- **📖 Rule book** on the start screen lists all 53 grammar rules, grouped by
  topic, with their tables (e.g. the four cases). Tap a rule to open it.
- The search box finds rules by any word in them. Case and umlauts don't
  matter: *dativ* finds *Dativ*, *madchen* finds *Mädchen*.
- **All rules of this topic →** in a topic's 📖 Rule tip opens the Rule book
  at that topic.

### The Rules topic

- **📏 Rules** asks only about the grammar rules themselves, such as *What is a
  Hilfsverb?*, *Perfekt or Präteritum?*, *Where does the verb go?* and *Which
  case is dem?*. It never asks you to translate a word.
- Its 97 questions come from every topic, and every rule in the Glossary has
  at least one. That includes the four cases: Nominativ, Akkusativ, Dativ and
  Genitiv (*der, ein, mein · den, einen, meinen · dem, einem, meinem · des,
  eines, meines*).
- Each question also belongs to its own topic, e.g. the case questions are in
  *Articles & cases*. Mastering it in Rules counts there too, and the total
  stays 500.

### Word translations and the Glossary

- Words in the speech bubble (and in fill-the-gaps sentences) have **dots
  underneath**. Hover over a word, or tap it on a phone, and a small bubble
  shows its English meaning. Words that belong together light up together:
  *noch nie*, or a split verb such as *stehe … auf*.
- The **📖 Glossary** button, between *I don't know* and *Check*, lists every
  German word in the question with its meaning (and its dictionary form, e.g.
  *ist* → *sein*), followed by the rule the card practises.
- The Glossary can't give the answer away:
  - It only translates what the question shows, in the form it is written.
    Answer choices (options, chips, tiles, pairs, items to sort) are never
    translated.
  - Verb forms are translated without the person (*wohnt* = "live(s)").
  - Cards that ask what a word means (*What does glücklich mean?*) hide
    the translations.
  - When the rule itself is the answer (true/false statements about grammar,
    "Why is it *studiert*…?", a table of *sein*), the rule stays folded until
    you press **Show the rule anyway**.

### The typo rule (typed answers)

- **One wrong letter** (missing, extra, swapped or different) counts as correct,
  and the app shows you the right spelling.
- **Two or more** wrong letters count as wrong.
- `ae / oe / ue / ss` are accepted for `ä / ö / ü / ß`. Case and punctuation are
  ignored, though the app reminds you about capitals on nouns and *Sie*.

The typo allowance never lets wrong grammar through, so these are marked wrong:

- another real form of the same word: *wohne* for *wohnt*, *lest* for *liest*,
  *fahrt* for *fährt*, *den* for *dem*;
- a slip in an answer of 3 letters or fewer (*ist*, *dem*, *im*), including a
  short word inside a sentence.

### Keyboard (desktop)

| Key | Action |
|---|---|
| `Enter` | Check / Continue |
| `1`–`4` | Pick a multiple-choice option |
| `1`/`T`, `2`/`F` | True / False |
| `Backspace` | Sentence builder: take back the last word |
| `G` | Open the Glossary (`Enter` or `Esc` closes it) |
| `/` | Rule book: search |
| `Esc` | Close a word bubble, or quit the session |

## Adding cards

Cards live in `data/cards/*.js`. Each file adds cards to one topic (`16-rules.js` adds rule questions to several):

```js
Brezel.deck.addCards('present', [
  {
    id: 'pr-99', type: 'type',          // unique id + exercise type
    rule: 'vowel-change',               // the rule shown in the Glossary (data/rules.js)
    prompt: 'Conjugate the verb',
    q: 'Er ___ Deutsch.', hint: 'sprechen',
    answer: 'spricht',
    explain: '*sprechen* changes **e → i**: er **spricht**.',   // shown after answering
  },
]);
```

The `**bold**` and `*italic*` markers work in every text field. `___` marks a
blank in `q`.

Each exercise type takes these fields:

| type | fields |
|---|---|
| `mc` | `prompt`, `q?`, `correct`, `wrong: [...]` |
| `tf` | `q` (German) and/or `statement` (English), `answer: true/false`, `fix?`, `labels?` |
| `type` | `prompt`, `q`, `answer` (string or list of accepted answers), `reject?`, `hint?` |
| `table` | `verb: 'lesen'` (rows come from `data/lexicon.js`) or `head` + `rows`; `blanks?` |
| `order` | `en`, `answer` (German sentence), `start?`, `extra?` (distractor tiles), `answers?` |
| `gap` | `q: 'Ich {bin} 1990 in Polen {geboren}.'`, `options` (wrong chips); `{a\|b}` accepts either |
| `sort` | `prompt`, `buckets: [{ label, sub?, items: [...] }]` |
| `spot` | `q` (sentence with one mistake), `wrong`, `correct`, `at?`, `fixed?` |
| `match` | `prompt`, `pairs: [['wohnen', 'to live'], ...]` (up to 6) |

Each file in `js/exercises/` starts with a comment documenting its fields.

- **Glossary fields** (on any card):
  - `rule`: the id of a rule in `data/rules.js`, or a list of up to two ids.
    Write a new rule there if none fits, in the `addRules('<topic>', …)` list
    of its topic (the Rule book groups rules that way). Its examples must not be a card's
    answer, which the deck check verifies. A rule can have a small `table`
    (`{ head, rows }`), like the article tables of the four cases.
  - `asksRule: true`: the rule gives this card's answer away, so the Glossary
    keeps it folded.
  - `gloss: false`: the card asks what words mean, so their translations are
    hidden.
  - `gloss: { Sie: 'she' }`: a meaning for this card only, e.g. when *Sie* at
    the start of a sentence means *she*.
- **`theory: true`**: the card asks about a rule itself, so it is in the Rules
  topic too. Don't use it on cards that ask what a word means (`gloss: false`),
  conjugation tables or sentence building. A new rule needs at least one
  theory card; `data/cards/16-rules.js` has one for each rule that had none.
- **New words** in a question go in `data/glossary.js`. The deck check lists
  any question word that has no translation yet.
- **A new topic:** add it to `data/topics.js`, then create a card file and add
  its `<script>` tag to `index.html` next to the others.
- **New verbs** go in `data/lexicon.js`. That powers conjugation tables and
  tells the typo rule which forms are "other real forms". Add `prt` (the six
  Präteritum forms) when a card asks for them, so *freut* isn't accepted as a
  typo for *freute*.
- **A new exercise type:** add a file to `js/exercises/` that calls
  `Brezel.ex.register(name, { label, validate, describe, render })`, and add
  its script tag. The contract is documented at the top of
  `js/exercises/base.js`.

A card with a mistake (such as a missing field or duplicate id) is skipped with
a console warning, so it never breaks a session.

### Check the deck

With Node.js installed:

```sh
node tools/validate.js
```

This lists any invalid cards and duplicate ids, prints the counts per topic
and per type, and runs the typo-rule and review-schedule tests. It also checks
the Glossary:

- every card has a known rule;
- every question word has a translation;
- no translation or unfolded rule gives an answer away;
- every rule has at least one Rules question, and no meaning card is in Rules.

### Rebuild Brezel.html

After changing cards or code, regenerate the single-file version:

```sh
node tools/build.js
```

`Brezel.html` is generated from the source files, so don't edit it by hand.

## Files

```
Brezel.html           the whole app in one file (generated: node tools/build.js)
index.html            entry point for the source files (script order matters)
css/app.css           all styles, light + dark theme
js/core/              utilities, deck registry, answer checker, review schedule (srs.js), storage,
                      stats, sound, drag & drop, word translations (gloss.js)
js/exercises/         one file per exercise type
js/ui/                screens: home, session, summary, review, Rule book, charts; the Glossary dialog
data/topics.js        topics + the rule tip shown for each
data/lexicon.js       verb forms, word families, proper nouns
data/glossary.js      English meanings of the words in the questions
data/rules.js         the grammar rules, by topic: shown in the Glossary and the Rule book
data/cards/           the cards, one file per topic; 16-rules.js has rule questions for several topics
tools/validate.js     deck checker
tools/build.js        builds Brezel.html
backup/               earlier versions, complete and working (see backup/README.md)
```
