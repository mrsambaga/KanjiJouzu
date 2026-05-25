# Kanji Jouzu (日本)

Personal offline-first kanji learning app for JLPT N5 and N4.

## Architecture

**No backend.** This is a single-user app — all data lives on-device.

| Layer | Choice |
|-------|--------|
| Framework | Expo SDK 54 + React Native 0.81 |
| Database | **expo-sqlite** (kanji, vocabulary, progress, decks, activity) |
| State | **Zustand** (settings, study session) |
| Navigation | **React Navigation** (stack + tabs) |
| Animations | Reanimated + Gesture Handler (flip / swipe cards) |

### Project structure

```
src/
  components/     UI + flashcard (study & preview modes)
  context/        Theme provider
  data/           N5/N4 kanji + vocabulary seed (generated .ts)
  db/             SQLite init, schema, migrations
  navigation/     Stack + tabs
  screens/        Home, Levels, Level detail, Study, Preview, Decks, Stats, Settings
  services/       Kanji, vocabulary, progress, study, decks, stats
  stores/         Zustand (settings, study session)
  theme/          Zenith Kanji design tokens
  types/          TypeScript interfaces

scripts/          Generators for seed data (see below)
```

## Features

### Study

- **Flash cards** — tap to reveal; swipe or buttons for remembered / difficult
- **Session order** — for each kanji: one kanji card, then up to **5 vocabulary** cards (common N-level compounds)
- **JLPT N5 & N4** — full PDF-aligned lists (108 N5, 167 N4 kanji)
- **Level detail** (Levels tab → N5 / N4):
  - Progress ring and stats (mastered, studied, difficult, total)
  - **Study all** — full deck for that level
  - **Study difficult** — only cards marked difficult for that level
  - **Kanji list** — browse in PDF order; expand rows to see vocabulary; tap kanji or word to **preview** (flashcard UI without grading)
- **Custom decks** — create decks and add kanji from search
- **Continue** and global **difficult** review from Home

### Progress & stats

- Per-kanji SRS-style status: new → studying → mastered (or difficult)
- Resume position per study source (level, level-difficult, custom deck)
- Daily goal, streak, 7-day activity chart on Stats

### Settings

- Dark mode, romaji toggle, font size, reset progress, onboarding

## Data model

| Table | Purpose |
|-------|---------|
| `kanji` | Character, readings, meaning, JLPT level |
| `vocabulary` | Compound words linked to kanji (`kanji_id`, up to 5 per kanji in study) |
| `progress` | Review status and counts per kanji |
| `custom_decks` / `deck_kanji` | User-built collections |
| `daily_activity`, `review_history`, `study_position` | Stats and session resume |

On first launch, SQLite is seeded from `src/data/`. Later app starts **migrate** missing kanji and vocabulary for existing installs.

N4 study uses the official **character list** (not only `jlpt_level`), so kanji shared with N5 still appear in N4 sessions.

## Getting started

```bash
npm install
npm start
```

Press `a` for Android or `i` for iOS (requires Expo Go or a dev build).

## Design

UI follows the **Zenith Kanji** design system in `kanji-jouzu-deisgn/` — soft washi palette, pill buttons, Noto Serif kanji display. Logo uses **日本** (nihon).

## Seed data

| Source | Kanji | Vocabulary |
|--------|-------|------------|
| N5 (PDF list) | 108 in `n5Kanji.ts` | 5 per kanji in `n5Vocabulary.ts` |
| N4 (EJable PDF) | 167 in `n4Kanji.ts` | 5 per kanji in `n4Vocabulary.ts` |

**Regenerate** after editing generator scripts:

```bash
node scripts/build-n4-kanji.mjs      # → src/data/n4Kanji.ts
node scripts/build-n4-vocabulary.mjs # → src/data/n4Vocabulary.ts
node scripts/build-n5-vocabulary.mjs # → src/data/n5Vocabulary.ts
```

N5 kanji are maintained in `n5Kanji.ts` directly (no `build-n5-kanji.mjs` yet). Vocabulary for both levels is generated from the `ROWS` arrays in the scripts above.

Restart the app after seed changes so migrations pick up new kanji and vocabulary.
