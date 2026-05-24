import * as SQLite from 'expo-sqlite';
import { N4_KANJI, N5_KANJI } from '../data/seedKanji';
import { AppSettings } from '../types';

const DB_NAME = 'kanji-jouzu.db';

let db: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<void> | null = null;

const SCHEMA = `
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS kanji (
    id INTEGER PRIMARY KEY NOT NULL,
    character TEXT NOT NULL UNIQUE,
    romaji TEXT NOT NULL,
    meaning TEXT NOT NULL,
    jlpt_level TEXT NOT NULL,
    onyomi TEXT,
    kunyomi TEXT,
    example TEXT,
    example_meaning TEXT
  );

  CREATE TABLE IF NOT EXISTS progress (
    kanji_id INTEGER PRIMARY KEY REFERENCES kanji(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'new',
    review_count INTEGER NOT NULL DEFAULT 0,
    correct_count INTEGER NOT NULL DEFAULT 0,
    last_reviewed_at TEXT,
    next_review_at TEXT
  );

  CREATE TABLE IF NOT EXISTS custom_decks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS deck_kanji (
    deck_id INTEGER NOT NULL REFERENCES custom_decks(id) ON DELETE CASCADE,
    kanji_id INTEGER NOT NULL REFERENCES kanji(id) ON DELETE CASCADE,
    PRIMARY KEY (deck_id, kanji_id)
  );

  CREATE TABLE IF NOT EXISTS daily_activity (
    date TEXT PRIMARY KEY,
    cards_studied INTEGER NOT NULL DEFAULT 0,
    minutes_studied REAL NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS review_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kanji_id INTEGER NOT NULL REFERENCES kanji(id) ON DELETE CASCADE,
    result TEXT NOT NULL,
    reviewed_at TEXT NOT NULL
  );
`;

const DEFAULT_SETTINGS: AppSettings = {
  darkMode: false,
  showRomaji: true,
  fontSize: 'medium',
  onboardingComplete: false,
};

async function seedKanji(database: SQLite.SQLiteDatabase): Promise<void> {
  const row = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) AS count FROM kanji',
  );
  if ((row?.count ?? 0) > 0) return;

  const allKanji = [...N5_KANJI, ...N4_KANJI];
  const seen = new Set<string>();
  let id = 1;

  for (const kanji of allKanji) {
    if (seen.has(kanji.character)) continue;
    seen.add(kanji.character);
    await database.runAsync(
      `INSERT INTO kanji (id, character, romaji, meaning, jlpt_level, onyomi, kunyomi, example, example_meaning)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      kanji.character,
      kanji.romaji,
      kanji.meaning,
      kanji.jlptLevel,
      kanji.onyomi ?? null,
      kanji.kunyomi ?? null,
      kanji.example ?? null,
      kanji.exampleMeaning ?? null,
    );
    id += 1;
  }
}

async function seedSettings(database: SQLite.SQLiteDatabase): Promise<void> {
  const row = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) AS count FROM settings',
  );
  if ((row?.count ?? 0) > 0) return;

  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    await database.runAsync(
      'INSERT INTO settings (key, value) VALUES (?, ?)',
      key,
      JSON.stringify(value),
    );
  }
}

export async function initDatabase(): Promise<void> {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    db = await SQLite.openDatabaseAsync(DB_NAME);
    await db.execAsync(SCHEMA);
    await seedKanji(db);
    await seedSettings(db);
  })();

  return initPromise;
}

export function getDatabase(): SQLite.SQLiteDatabase {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

export async function getSetting<K extends keyof AppSettings>(
  key: K,
): Promise<AppSettings[K]> {
  const database = getDatabase();
  const row = await database.getFirstAsync<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?',
    key,
  );
  if (!row) return DEFAULT_SETTINGS[key];
  return JSON.parse(row.value) as AppSettings[K];
}

export async function setSetting<K extends keyof AppSettings>(
  key: K,
  value: AppSettings[K],
): Promise<void> {
  const database = getDatabase();
  await database.runAsync(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    key,
    JSON.stringify(value),
  );
}

export async function loadAllSettings(): Promise<AppSettings> {
  const database = getDatabase();
  const rows = await database.getAllAsync<{ key: string; value: string }>(
    'SELECT key, value FROM settings',
  );

  const settings = { ...DEFAULT_SETTINGS };
  for (const row of rows) {
    const key = row.key as keyof AppSettings;
    if (key in settings) {
      settings[key] = JSON.parse(row.value) as AppSettings[typeof key];
    }
  }
  return settings;
}

export function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}
