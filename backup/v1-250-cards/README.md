# 🥨 Brezel — German grammar flashcards

A Duolingo-style flashcard app built from your class notes: 250 cards across
10 topics, 9 exercise types. It runs offline in any modern browser; nothing to
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

- The start screen shows how far you are, e.g. **23/250**. A card only counts
  once you answer it correctly.
- Cards and answer options are shuffled every session.
- If you get a card wrong, the correct answer and the reason are shown, and the
  card goes back into the pile at a random later spot in the same session.
- **Practise mistakes** replays every card you have ever got wrong. It is extra
  training only and doesn't change your progress.
- When all 250 are done, **Review** shows your strong and weak topics, mastery
  per topic, first-try accuracy per exercise type and accuracy per session.
  Every chart can be switched to a table.

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
| `Esc` | Quit the session |

## Adding cards

Cards live in `data/cards/*.js`. Each file adds cards to one topic:

```js
Brezel.deck.addCards('present', [
  {
    id: 'pr-99', type: 'type',          // unique id + exercise type
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

- **A new topic:** add it to `data/topics.js`, then create a card file and add
  its `<script>` tag to `index.html` next to the others.
- **New verbs** go in `data/lexicon.js`. That powers conjugation tables and
  tells the typo rule which forms are "other real forms".
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
and per type, and runs the typo-rule tests.

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
js/core/              utilities, deck registry, answer checker, storage, stats, sound, drag & drop
js/exercises/         one file per exercise type
js/ui/                screens: home, session, summary, review, charts
data/topics.js        topics + the rule tip shown for each
data/lexicon.js       verb forms, word families, proper nouns
data/cards/           the cards, one file per topic
tools/validate.js     deck checker
tools/build.js        builds Brezel.html
```
