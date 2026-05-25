import * as SQLite from 'expo-sqlite';
import { N4_KANJI, N5_KANJI } from '../data/seedKanji';
import { N5_VOCABULARY_BY_CHARACTER } from '../data/n5Vocabulary';
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

  CREATE TABLE IF NOT EXISTS study_position (
    source_key TEXT PRIMARY KEY,
    current_index INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS vocabulary (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kanji_id INTEGER NOT NULL REFERENCES kanji(id) ON DELETE CASCADE,
    word TEXT NOT NULL,
    reading TEXT NOT NULL,
    meaning TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    UNIQUE (kanji_id, word)
  );
`;

const DEFAULT_SETTINGS: AppSettings = {
  darkMode: false,
  showRomaji: true,
  fontSize: 'medium',
  onboardingComplete: false,
};

type SettingKey = 'darkMode' | 'showRomaji' | 'fontSize' | 'onboardingComplete';

const SETTING_KEYS: SettingKey[] = [
  'darkMode',
  'showRomaji',
  'fontSize',
  'onboardingComplete',
];

function isSettingKey(key: string): key is SettingKey {
  return (SETTING_KEYS as readonly string[]).includes(key);
}

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

async function migrateMissingKanji(database: SQLite.SQLiteDatabase): Promise<void> {
  const maxRow = await database.getFirstAsync<{ maxId: number | null }>(
    'SELECT MAX(id) AS maxId FROM kanji',
  );
  let nextId = (maxRow?.maxId ?? 0) + 1;

  for (const kanji of N5_KANJI) {
    const existing = await database.getFirstAsync<{ id: number }>(
      'SELECT id FROM kanji WHERE character = ?',
      kanji.character,
    );
    if (existing) continue;

    await database.runAsync(
      `INSERT INTO kanji (id, character, romaji, meaning, jlpt_level, onyomi, kunyomi, example, example_meaning)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      nextId,
      kanji.character,
      kanji.romaji,
      kanji.meaning,
      kanji.jlptLevel,
      kanji.onyomi ?? null,
      kanji.kunyomi ?? null,
      kanji.example ?? null,
      kanji.exampleMeaning ?? null,
    );
    nextId += 1;
  }
}

async function seedVocabulary(database: SQLite.SQLiteDatabase): Promise<void> {
  for (const [character, entries] of Object.entries(N5_VOCABULARY_BY_CHARACTER)) {
    const kanjiRow = await database.getFirstAsync<{ id: number }>(
      'SELECT id FROM kanji WHERE character = ?',
      character,
    );
    if (!kanjiRow) continue;

    const existing = await database.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) AS count FROM vocabulary WHERE kanji_id = ?',
      kanjiRow.id,
    );
    if ((existing?.count ?? 0) > 0) continue;

    let sortOrder = 0;
    for (const entry of entries) {
      await database.runAsync(
        `INSERT INTO vocabulary (kanji_id, word, reading, meaning, sort_order)
         VALUES (?, ?, ?, ?, ?)`,
        kanjiRow.id,
        entry.word,
        entry.reading,
        entry.meaning,
        sortOrder,
      );
      sortOrder += 1;
    }
  }
}

async function seedSettings(database: SQLite.SQLiteDatabase): Promise<void> {
  const row = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) AS count FROM settings',
  );
  if ((row?.count ?? 0) > 0) return;

  for (const key of SETTING_KEYS) {
    await database.runAsync(
      'INSERT INTO settings (key, value) VALUES (?, ?)',
      key,
      JSON.stringify(DEFAULT_SETTINGS[key]),
    );
  }
}

export async function initDatabase(): Promise<void> {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    db = await SQLite.openDatabaseAsync(DB_NAME);
    await db.execAsync(SCHEMA);
    await seedKanji(db);
    await migrateMissingKanji(db);
    await seedVocabulary(db);
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

  const settings: AppSettings = { ...DEFAULT_SETTINGS };
  for (const row of rows) {
    if (!isSettingKey(row.key)) continue;
    const parsed: unknown = JSON.parse(row.value);
    switch (row.key) {
      case 'darkMode':
        settings.darkMode = parsed as AppSettings['darkMode'];
        break;
      case 'showRomaji':
        settings.showRomaji = parsed as AppSettings['showRomaji'];
        break;
      case 'fontSize':
        settings.fontSize = parsed as AppSettings['fontSize'];
        break;
      case 'onboardingComplete':
        settings.onboardingComplete = parsed as AppSettings['onboardingComplete'];
        break;
    }
  }
  return settings;
}

export function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}
