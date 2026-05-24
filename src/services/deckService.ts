import { getDatabase } from '../db/database';
import { CustomDeck } from '../types';

interface DeckRow {
  id: number;
  name: string;
  created_at: string;
}

interface DeckKanjiRow {
  kanji_id: number;
}

async function getKanjiIdsForDeck(deckId: number): Promise<number[]> {
  const db = getDatabase();
  const rows = await db.getAllAsync<DeckKanjiRow>(
    'SELECT kanji_id FROM deck_kanji WHERE deck_id = ? ORDER BY kanji_id',
    deckId,
  );
  return rows.map((row) => row.kanji_id);
}

function mapDeckRow(row: DeckRow, kanjiIds: number[]): CustomDeck {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    kanjiIds,
  };
}

export async function getCustomDecks(): Promise<CustomDeck[]> {
  const db = getDatabase();
  const rows = await db.getAllAsync<DeckRow>(
    'SELECT * FROM custom_decks ORDER BY created_at DESC',
  );

  const decks: CustomDeck[] = [];
  for (const row of rows) {
    const kanjiIds = await getKanjiIdsForDeck(row.id);
    decks.push(mapDeckRow(row, kanjiIds));
  }
  return decks;
}

export async function getCustomDeck(deckId: number): Promise<CustomDeck | null> {
  const db = getDatabase();
  const row = await db.getFirstAsync<DeckRow>(
    'SELECT * FROM custom_decks WHERE id = ?',
    deckId,
  );
  if (!row) return null;

  const kanjiIds = await getKanjiIdsForDeck(deckId);
  return mapDeckRow(row, kanjiIds);
}

export async function createCustomDeck(name: string, kanjiIds: number[] = []): Promise<CustomDeck> {
  const db = getDatabase();
  const createdAt = new Date().toISOString();

  const result = await db.runAsync(
    'INSERT INTO custom_decks (name, created_at) VALUES (?, ?)',
    name.trim(),
    createdAt,
  );

  const deckId = result.lastInsertRowId;
  for (const kanjiId of kanjiIds) {
    await db.runAsync(
      'INSERT OR IGNORE INTO deck_kanji (deck_id, kanji_id) VALUES (?, ?)',
      deckId,
      kanjiId,
    );
  }

  return {
    id: deckId,
    name: name.trim(),
    createdAt,
    kanjiIds: [...new Set(kanjiIds)],
  };
}

export async function updateCustomDeck(
  deckId: number,
  updates: { name?: string },
): Promise<CustomDeck | null> {
  const existing = await getCustomDeck(deckId);
  if (!existing) return null;

  if (updates.name !== undefined) {
    const db = getDatabase();
    await db.runAsync('UPDATE custom_decks SET name = ? WHERE id = ?', updates.name.trim(), deckId);
    return { ...existing, name: updates.name.trim() };
  }

  return existing;
}

export async function deleteCustomDeck(deckId: number): Promise<boolean> {
  const db = getDatabase();
  const result = await db.runAsync('DELETE FROM custom_decks WHERE id = ?', deckId);
  return result.changes > 0;
}

export async function addKanjiToDeck(deckId: number, kanjiIds: number[]): Promise<CustomDeck | null> {
  const deck = await getCustomDeck(deckId);
  if (!deck) return null;

  const db = getDatabase();
  for (const kanjiId of kanjiIds) {
    await db.runAsync(
      'INSERT OR IGNORE INTO deck_kanji (deck_id, kanji_id) VALUES (?, ?)',
      deckId,
      kanjiId,
    );
  }

  return getCustomDeck(deckId);
}

export async function removeKanjiFromDeck(
  deckId: number,
  kanjiIds: number[],
): Promise<CustomDeck | null> {
  const deck = await getCustomDeck(deckId);
  if (!deck) return null;

  if (kanjiIds.length === 0) return deck;

  const db = getDatabase();
  const placeholders = kanjiIds.map(() => '?').join(', ');
  await db.runAsync(
    `DELETE FROM deck_kanji WHERE deck_id = ? AND kanji_id IN (${placeholders})`,
    deckId,
    ...kanjiIds,
  );

  return getCustomDeck(deckId);
}
