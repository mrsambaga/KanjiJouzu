# Kanji Jouzu (日本)

Personal offline-first kanji learning app for JLPT N5 and N4.

## Architecture

**No backend.** This is a single-user app — all data lives on-device. A Go or REST backend would add deployment, auth, and sync complexity with no benefit for personal use.

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | Expo + React Native | Fast dev, cross-platform, great mobile APIs |
| Database | **expo-sqlite** | Structured queries, relational data, fully offline |
| State | **Zustand** | Minimal boilerplate for UI + session state |
| Navigation | **React Navigation** | Standard stack + tab patterns |
| Animations | Reanimated + Gesture Handler | Smooth flip/swipe cards |

### Why SQLite over AsyncStorage / Realm / WatermelonDB?

- **AsyncStorage** — key-value only; poor fit for kanji lists, progress joins, and search
- **Realm** — powerful but heavier setup; overkill for ~130 kanji + progress rows
- **WatermelonDB** — sync/reactive architecture you don't need for one user
- **SQLite** — simple SQL, easy to inspect, fast enough, ships with Expo

### Project structure

```
src/
  components/     Reusable UI + flashcard
  context/        Theme provider
  data/           N5/N4 seed kanji
  db/             SQLite init + schema
  navigation/     Stack + tabs
  screens/        App screens
  services/       Business logic (kanji, progress, decks, stats)
  stores/         Zustand (settings, study session)
  theme/          Zenith Kanji design tokens
  types/          TypeScript interfaces
```

## Features

- Flash cards with tap-to-reveal and swipe (right = remembered, left = difficult)
- JLPT N5 / N4 categories with progress
- Custom kanji decks
- Dashboard with streak, daily goal, quick actions
- Statistics and 7-day activity chart
- Settings: dark mode, romaji toggle, font size, reset progress

## Getting started

```bash
npm install
npm start
```

Press `a` for Android or `i` for iOS (requires Expo Go or a dev build).

## Design

UI follows the **Zenith Kanji** design system in `kanji-jouzu-deisgn/` — soft washi palette, pill buttons, Noto Serif kanji display. Logo uses **日本** (nihon).

## Seed data

~80 N5 and ~50 N4 kanji ship in `src/data/`. Expand by adding entries to `n5Kanji.ts` / `n4Kanji.ts`.
