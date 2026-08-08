import { getDatabase } from '../db/database';
import { CustomCard, CustomCardWithProgress, CustomCardProgress, KanjiStatus } from '../types';

interface CustomCardRow {
  id: number;
  deck_id: number;
  card_type: string;
  front: string;
  reading: string;
  romaji: string;
  meaning: string;
  example: string;
  example_meaning: string;
  created_at: string;
}

interface CustomCardProgressRow {
  custom_card_id: number;
  status: KanjiStatus;
  review_count: number;
  correct_count: number;
  last_reviewed_at: string | null;
}

function mapCard(row: CustomCardRow): CustomCard {
  return {
    id: row.id,
    deckId: row.deck_id,
    cardType: row.card_type as 'kanji' | 'vocabulary',
    front: row.front,
    reading: row.reading,
    romaji: row.romaji,
    meaning: row.meaning,
    example: row.example,
    exampleMeaning: row.example_meaning,
    createdAt: row.created_at,
  };
}

function mapProgress(row: CustomCardProgressRow): CustomCardProgress {
  return {
    customCardId: row.custom_card_id,
    status: row.status,
    reviewCount: row.review_count,
    correctCount: row.correct_count,
    lastReviewedAt: row.last_reviewed_at,
  };
}

export async function getCustomCardsForDeck(deckId: number): Promise<CustomCardWithProgress[]> {
  const db = getDatabase();
  const rows = await db.getAllAsync<CustomCardRow>(
    'SELECT * FROM custom_cards WHERE deck_id = ? ORDER BY created_at ASC',
    deckId,
  );
  const cards: CustomCardWithProgress[] = [];
  for (const row of rows) {
    const card = mapCard(row);
    const progressRow = await db.getFirstAsync<CustomCardProgressRow>(
      'SELECT * FROM custom_card_progress WHERE custom_card_id = ?',
      card.id,
    );
    cards.push({ ...card, progress: progressRow ? mapProgress(progressRow) : undefined });
  }
  return cards;
}

export async function createCustomCard(
  deckId: number,
  data: {
    cardType: 'kanji' | 'vocabulary';
    front: string;
    reading: string;
    romaji: string;
    meaning: string;
    example: string;
    exampleMeaning: string;
  },
): Promise<CustomCard> {
  const db = getDatabase();
  const createdAt = new Date().toISOString();
  const result = await db.runAsync(
    `INSERT INTO custom_cards (deck_id, card_type, front, reading, romaji, meaning, example, example_meaning, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    deckId,
    data.cardType,
    data.front.trim(),
    data.reading.trim(),
    data.romaji.trim(),
    data.meaning.trim(),
    data.example.trim(),
    data.exampleMeaning.trim(),
    createdAt,
  );
  return {
    id: result.lastInsertRowId,
    deckId,
    cardType: data.cardType,
    front: data.front.trim(),
    reading: data.reading.trim(),
    romaji: data.romaji.trim(),
    meaning: data.meaning.trim(),
    example: data.example.trim(),
    exampleMeaning: data.exampleMeaning.trim(),
    createdAt,
  };
}

export async function updateCustomCard(
  cardId: number,
  data: Partial<{
    cardType: 'kanji' | 'vocabulary';
    front: string;
    reading: string;
    romaji: string;
    meaning: string;
    example: string;
    exampleMeaning: string;
  }>,
): Promise<void> {
  const db = getDatabase();
  const fields: string[] = [];
  const values: (string | number)[] = [];

  if (data.cardType !== undefined) { fields.push('card_type = ?'); values.push(data.cardType); }
  if (data.front !== undefined) { fields.push('front = ?'); values.push(data.front.trim()); }
  if (data.reading !== undefined) { fields.push('reading = ?'); values.push(data.reading.trim()); }
  if (data.romaji !== undefined) { fields.push('romaji = ?'); values.push(data.romaji.trim()); }
  if (data.meaning !== undefined) { fields.push('meaning = ?'); values.push(data.meaning.trim()); }
  if (data.example !== undefined) { fields.push('example = ?'); values.push(data.example.trim()); }
  if (data.exampleMeaning !== undefined) { fields.push('example_meaning = ?'); values.push(data.exampleMeaning.trim()); }

  if (fields.length === 0) return;
  values.push(cardId);
  await db.runAsync(`UPDATE custom_cards SET ${fields.join(', ')} WHERE id = ?`, ...values);
}

export async function deleteCustomCard(cardId: number): Promise<void> {
  const db = getDatabase();
  await db.runAsync('DELETE FROM custom_cards WHERE id = ?', cardId);
}

export async function recordCustomCardReview(
  cardId: number,
  result: 'remembered' | 'difficult',
): Promise<void> {
  const db = getDatabase();
  const now = new Date().toISOString();

  const existing = await db.getFirstAsync<CustomCardProgressRow>(
    'SELECT * FROM custom_card_progress WHERE custom_card_id = ?',
    cardId,
  );

  if (!existing) {
    const status: KanjiStatus = result === 'difficult' ? 'difficult' : 'studying';
    const correctCount = result === 'remembered' ? 1 : 0;
    await db.runAsync(
      `INSERT INTO custom_card_progress (custom_card_id, status, review_count, correct_count, last_reviewed_at)
       VALUES (?, ?, 1, ?, ?)`,
      cardId,
      status,
      correctCount,
      now,
    );
    return;
  }

  const reviewCount = existing.review_count + 1;
  const correctCount = result === 'remembered' ? existing.correct_count + 1 : existing.correct_count;
  let status: KanjiStatus;
  if (result === 'difficult') {
    status = 'difficult';
  } else if (correctCount >= 3) {
    status = 'mastered';
  } else {
    status = existing.status === 'new' || existing.status === 'difficult' ? 'studying' : existing.status;
  }

  await db.runAsync(
    `UPDATE custom_card_progress
     SET status = ?, review_count = ?, correct_count = ?, last_reviewed_at = ?
     WHERE custom_card_id = ?`,
    status,
    reviewCount,
    correctCount,
    now,
    cardId,
  );
}

/**
 * Import cards from parsed CSV rows.
 * Expected columns (case-insensitive): front, reading, romaji, meaning, example, example_meaning, card_type
 * Returns number of cards successfully inserted.
 */
export async function importCustomCardsFromCSV(
  deckId: number,
  csvText: string,
): Promise<{ imported: number; errors: string[] }> {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return { imported: 0, errors: ['CSV must have a header row and at least one data row.'] };

  const header = parseCSVLine(lines[0]).map((h) => h.toLowerCase().trim().replace(/\s+/g, '_'));
  const colIndex = (name: string) => header.indexOf(name);

  const frontIdx = colIndex('front');
  const meaningIdx = colIndex('meaning');
  if (frontIdx === -1 || meaningIdx === -1) {
    return { imported: 0, errors: ['CSV must have at least "front" and "meaning" columns.'] };
  }

  const readingIdx = colIndex('reading');
  const romajiIdx = colIndex('romaji');
  const exampleIdx = colIndex('example');
  const exampleMeaningIdx = colIndex('example_meaning');
  const cardTypeIdx = colIndex('card_type');

  let imported = 0;
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    try {
      const cols = parseCSVLine(lines[i]);
      const front = (cols[frontIdx] ?? '').trim();
      const meaning = (cols[meaningIdx] ?? '').trim();
      if (!front || !meaning) {
        errors.push(`Row ${i + 1}: "front" and "meaning" are required.`);
        continue;
      }

      const rawCardType = cardTypeIdx !== -1 ? (cols[cardTypeIdx] ?? '').trim().toLowerCase() : '';
      const cardType: 'kanji' | 'vocabulary' = rawCardType === 'kanji' ? 'kanji' : 'vocabulary';

      await createCustomCard(deckId, {
        cardType,
        front,
        reading: readingIdx !== -1 ? (cols[readingIdx] ?? '').trim() : '',
        romaji: romajiIdx !== -1 ? (cols[romajiIdx] ?? '').trim() : '',
        meaning,
        example: exampleIdx !== -1 ? (cols[exampleIdx] ?? '').trim() : '',
        exampleMeaning: exampleMeaningIdx !== -1 ? (cols[exampleMeaningIdx] ?? '').trim() : '',
      });
      imported++;
    } catch (e) {
      errors.push(`Row ${i + 1}: ${String(e)}`);
    }
  }

  return { imported, errors };
}

/** Minimal RFC-4180 CSV line parser (handles quoted fields). */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') { current += '"'; i++; }
        else inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') { inQuotes = true; }
      else if (ch === ',') { result.push(current); current = ''; }
      else { current += ch; }
    }
  }
  result.push(current);
  return result;
}
