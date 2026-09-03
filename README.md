# Keytrail

An original typing adventure for kids. Rest your fingers on home row, light lanterns with Pip the fox, and grow into a proficient typist — with words-per-minute tracking and parent reports.

Keytrail is **not** a Mario game and does not use Nintendo characters, music, or art. The fox, world, writing, and UI were made for this project so you can take it to market without copying someone else’s work.

## Play

Live: [https://jlevins2011.github.io/typing-game/](https://jlevins2011.github.io/typing-game/)

Pushes to `main` build the game and publish that URL. GitHub Pages must serve the **`gh-pages`** branch (folder `/`), not the source on `main`.

```bash
npm install
npm run dev
```

Then open the local URL Vite prints (usually `http://localhost:5173`).

```bash
npm test
npm run build
```

Progress lives in this browser (`localStorage`). There is no account and no network requirement after the page loads.

## How kids learn

1. **Home Camp** — park both hands on `asdf` / `jkl;`, then one finger at a time (F, D, S, A, then the left hand; J, K, L, `;`, then the right hand), thumbs on space, both hands together, G/H, first trail run.
2. **High Ridge** — each top-row finger (R E W Q, then the left hand; U I O P, then the right hand), T/Y, then a speed-sensitive adventure.
3. **Riverbed** — each bottom-row finger (V C X Z, then the left hand; M , . then the right hand), B/N, the full alphabet.
4. **Campfire Stories** — words, sentences, Shift for capitals, punctuation.
5. **Night Summit** — speed, accuracy, numbers, stamina, and a proficiency exam (35 WPM at 95% accuracy).

Correct typing moves Pip. Higher WPM makes the run feel faster. Misses make Pip stumble and dim lanterns. Early lessons open the next trail on accuracy so kids are not stuck on speed. Stars still reward both smoothness and pace. The final exam is the proficiency gate.

WPM uses the usual five-character word.

## Parents

Set a 4-digit PIN on first visit. Reports show time practiced, average and best WPM, accuracy, weak keys, lesson stars, and a printable session history. Data stays on the device.

## License

All rights reserved unless you choose another license for commercialization.
