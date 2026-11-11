# 🥨 Brezel — German grammar flashcards

A Duolingo-style flashcard app built from your class notes: 698 cards across
16 topics, plus a 📏 **Rules** topic, in 9 exercise types, and 106 easier copies
of typed cards (804 in all). Three difficulty levels, 💡 hints, German speech,
achievements and minigames. It runs offline in any modern browser; nothing to
install.

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

- The start screen shows how far you are, e.g. **23/804**. A card only counts
  once you answer it correctly. Then it comes back for reviews (see below).
- Choose the **cards** per session (5, 10, 20, 50 or all), the **topic** and
  the **difficulty**, then press **▶ Start Learning**, or **🎮 Start Gaming**
  for minigames (see below).
- **Start Learning** first takes the reviews that are due, then new cards, up
  to the session size, and mixes them. Cards and answer options are shuffled
  every session.
- If you get a card wrong, the correct answer and the reason are shown, and the
  card goes back into the pile at a random later spot in the same session.
- **Practise mistakes** replays every card you have ever got wrong. It is extra
  training only and doesn't change your progress.
- When all 804 are done, **Review** shows your strong and weak topics, mastery
  per topic, first-try accuracy per exercise type and accuracy per session.
  Every chart can be switched to a table.

### 🎮 Minigames

**🎮 Start Gaming** plays minigames for the topic you picked (*All topics* = every
game). Each one starts with a short how-to and a 3-2-1 countdown. At the end
you see your score, your best, your mistakes with the right answers, and the
question **Noch ein Spiel?** — play the next game, the same one again, or stop.
Topics with games show **💻** and how many; a topic without games says so.
The difficulty slider sets the game level too (*Mixed* picks one per game).
Games earn XP but never change your card progress or reviews.

| Game | What you do | Topics |
|---|---|---|
| ⚖️ Haben oder sein? | swipe each verb to its Perfekt helper (*sich umziehen* → haben!) | Past, Talking about the past, Tenses, Verb list, Reflexive, Separable |
| 🚪 Der Türsteher | be the bouncer: let in only sentences with the right word order | Word order and every topic with enough sentences |
| 🚫 Nicht oder kein? | swipe to *nicht* or *kein…* | Questions & negation |
| 🏠 Im oder ins? | Wo? → *im*, Wohin? → *ins* | Prepositions |
| ⚡ Partizip-Blitz | infinitive → Partizip II, against the clock | Past, Separable, Verb list, Tenses … |
| 🪞 Spiegel | the right reflexive pronoun: *mich, dich, sich, uns, euch* | Reflexive, Verb list |
| 🕰️ Zeitmaschine | Präsens, Präteritum or Perfekt? | Tenses, Simple past, Past, Verb list |
| 👂 Hör genau | listen and tap the word you heard (*schon / schön*, *fährt / fahrt*) | Present, Simple past, Cases, Possessives, Reflexive, Verb list |
| 🎰 Verb-Automat | pull the lever: person + verb + tense, then give the form | Present, Simple past, Modal verbs, Verb list, Reflexive, Tenses |
| 🃏 Memory | flip cards to find pairs (*gehen · ging*, *Lehrer · Lehrerin* …) | most topics |
| ✂️ Die Schere | cut a separable verb (*steht … auf*) or keep it together (*beantwortet*) | Separable, Verb list, Word order |
| 🐉 Bossfight | beat the topic's monster with real cards (*Der Spiegel-Geist* …) | every topic |
| 🌧️ Artikel-Regen | nouns rain down: *der, die* or *das* before they land | Cases, Female & male forms, Vocabulary |

Level changes the game: more time and fewer options on Low; typing instead of
choosing, more traps and a clock per card on High. Game time pauses when you
switch apps.

### Difficulty

The slider on the start screen has four stops: **Low**, **Medium**, **High**
and the purple **Mixed** (every level, shuffled). Drag it, tap a stop, or use
the arrow keys. Each card shows its level next to its topic.

| Level | What you do | Cards |
|---|---|---|
| 🌱 Low | Recognise: true/false, multiple choice, small match | 270 |
| ⛰️ Medium | Build: fill gaps, sort, spot the mistake, short sentences | 288 |
| 🏔️ High | Produce: type answers, tables, long sentences | 246 |

- A card's level comes from what it asks you to do, unless the card sets
  `level` itself. The 📒 Verb list does: Präsens = Low, Präteritum = Medium,
  Perfekt = High.
- Many typed cards also have an **easier copy**, so the same question exists
  at more than one level:
  - a typed one-word answer gets a Low multiple-choice copy. Its wrong options
    are other real forms of the same word: *liest* → *lese, lest, lesen*;
  - a typed full sentence gets a Medium sentence-builder copy.
- A copy is a card of its own, with its own progress and reviews. A session
  never shows a card and its copy together.
- The topic and the difficulty filter both the reviews and the new cards.
- **Practise mistakes** ignores the difficulty.

### 💡 Help me

**Help me** (or `H`), next to *I don't know*, gives a hint in steps. Each hint
costs 3 XP of the card's 10 (it never drops below 2); a right answer still
counts in full for your progress.

| Card | Hints |
|---|---|
| Multiple choice | wrong options disappear until two are left |
| Typed answer | the first letter and length (*l _ _ _ _*), then half of the word |
| Table | the first letter of every blank, then one blank at a time |
| Sentence builder | the extra tiles disappear, then the words are placed from the start |
| Fill the gaps | half of the wrong chips disappear, then the gaps are filled one by one |
| Match pairs | one right pair at a time (two always stay open) |
| Sort | one word into its right group at a time (up to half) |
| Spot the mistake | words that are right are greyed out |
| True / false | none: the hint would be the answer |

The dots on the button show how many hints are left. A hint never gives away
the whole answer.

### 🔊 Speech

- The **🔊** in the speech bubble (and in fill-the-gaps cards) reads the German
  question; a blank is read as a short pause. True/false and spot-the-mistake
  sentences may be wrong, so they get no 🔊 before you answer.
- A **German answer option is read aloud the moment you pick it**: multiple
  choice, gap chips, sentence tiles, match pairs, sort chips and words in
  spot the mistake. English and Polish options are not read. Turn the sound
  off (🔇) to stop this.
- Tap a dotted word: its bubble has a 🔊 too.
- After you answer, the 🔊 next to *Richtig!* reads the whole correct sentence.
- Speech uses your device's German voice. For a nicer one on a Mac: System
  Settings → Accessibility → Spoken Content → System voice → Manage Voices →
  German (Enhanced or Premium).

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

- **📖 Rule book** on the start screen lists all 59 grammar rules, grouped by
  topic, with their tables (e.g. the four cases). Tap a rule to open it.
- The search box finds rules by any word in them. Case and umlauts don't
  matter: *dativ* finds *Dativ*, *madchen* finds *Mädchen*.
- **All rules of this topic →** in a topic's 📖 Rule tip opens the Rule book
  at that topic.

### 📒 The Verb list

- **📒 Verb list** (*Kleines Wörterbuch der Verben*, Begegnungen A2+ Kapitel 1,
  p. 32–33) has the whole list from the book: 31 irregular verbs and 20
  reflexive or partly reflexive verbs, in the three columns Präsens,
  Präteritum and Perfekt (*er fährt · er fuhr · er ist gefahren*).
- Every verb has a card for every column, 168 cards in all. The columns are
  the difficulty: Präsens = Low, Präteritum = Medium, Perfekt = High.
- You don't need to type *er*: *fuhr* is right, and so is *er fuhr*.
- The whole list is also in the 📖 Rule book, as three tables.
- The cards are generated from one table in `data/cards/17-verb-list.js`, which
  also makes the Rule book tables, so the two always match.

### 🏅 Achievements

The start screen ends with 32 badges. They stay grey with a 🔒 until you earn
them, then they turn colourful and show the date. Tap one to see how to get it
and how far you are (e.g. *37 / 100*). They cover learning (first card, 25,
100, 250, half, everything), streaks (3, 7 and 30 days), skill (10 and 25 in a
row, a session without a mistake, a session without help, High difficulty, a
5-card snack, before 8 am, after 10 pm, 50 reviews, a card reaching step 6,
fixing mistakes), topics (a whole topic, the Verb list, reflexive verbs,
Rules, 1,000 XP) and the minigames. *Reset progress* resets them too.

### The Rules topic

- **📏 Rules** asks only about the grammar rules themselves, such as *What is a
  Hilfsverb?*, *Perfekt or Präteritum?*, *Where does the verb go?* and *Which
  case is dem?*. It never asks you to translate a word.
- Its 104 questions come from every topic, and every rule in the Glossary has
  at least one. That includes the four cases: Nominativ, Akkusativ, Dativ and
  Genitiv (*der, ein, mein · den, einen, meinen · dem, einem, meinem · des,
  eines, meines*).
- Each question also belongs to its own topic, e.g. the case questions are in
  *Articles & cases*. Mastering it in Rules counts there too, and the total
  stays 804.

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
| `H` | 💡 Help me (the next hint) |
| `←` `→` | Home: move the difficulty slider (when it has focus) |
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

- **Difficulty fields** (on any card):
  - `level: 1 | 2 | 3`: Low, Medium or High. Without it, the level comes from
    the exercise type and size (see `js/core/level.js`).
  - `split: false`: never make an easier copy of this typed card.
- **Speech fields** (on any card):
  - `say`: what the bubble's 🔊 reads (default: the German question).
  - `sayChoices: true | false`: read the options aloud when picked (default:
    when they are German).
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
  `js/exercises/base.js`; give the controller `hints` + `hint(step)` for
  💡 Help me, and call `api.say(word)` when the learner picks a German word.
- **A new minigame:** add a file to `js/games/` that calls
  `Brezel.games.register(id, { name, icon, art, color, blurb, how, topics,
  ready, time, lives, play })`, and add its script tag. The contract is at the
  top of `js/games/engine.js`.

A card with a mistake (such as a missing field or duplicate id) is skipped with
a console warning, so it never breaks a session.

### Check the deck

With Node.js installed:

```sh
node tools/validate.js
```

This lists any invalid cards and duplicate ids, prints the counts per topic,
type and difficulty, lists the minigames of each topic, and runs the typo-rule
and review-schedule tests. It checks that no wrong option of an easier copy
would be accepted by the typed card it comes from. It also checks the
Glossary:

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
css/app.css           all styles, light + dark theme (incl. the difficulty slider and Help me)
css/achievements.css  the badges
css/games*.css        the game screen (games.css) and the minigames (games-quick, games-play)
js/core/              utilities, deck registry, answer checker, review schedule (srs.js),
                      difficulty + easier copies (level.js), storage, stats, achievements,
                      sound + speech, drag & drop, word translations (gloss.js)
js/exercises/         one file per exercise type (each with its Help me hints)
js/games/             minigames: engine.js (registry + contract) and one file per game family
js/ui/                screens: home, session, summary, review, Rule book, charts, achievements,
                      the game screen (arcade.js); the Glossary dialog
data/topics.js        topics + the rule tip shown for each
data/lexicon.js       verb forms, word families, proper nouns
data/glossary.js      English meanings of the words in the questions
data/rules.js         the grammar rules, by topic: shown in the Glossary and the Rule book
data/cards/           the cards, one file per topic; 16-rules.js has rule questions for several topics,
                      17-verb-list.js builds the Verb list from one table
data/games-*.js       content of the minigames (sentences, nouns with articles, monsters …)
tools/validate.js     deck checker
tools/build.js        builds Brezel.html
backup/               earlier versions, complete and working (see backup/README.md)
```
