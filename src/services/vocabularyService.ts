import { getDatabase } from '../db/database';
import { Vocabulary } from '../types';

export interface VocabularyRow {
  id: number;
  kanji_id: number;
  word: string;
  reading: string;
  romaji: string;
  meaning: string;
  sort_order: number;
}

export function mapVocabularyRow(row: VocabularyRow): Vocabulary {
  return {
    id: row.id,
    kanjiId: row.kanji_id,
    word: row.word,
    reading: row.reading,
    romaji: row.romaji ?? '',
    meaning: row.meaning,
    sortOrder: row.sort_order,
  };
}

export async function getVocabularyByKanjiIds(kanjiIds: number[]): Promise<Map<number, Vocabulary[]>> {
  const result = new Map<number, Vocabulary[]>();
  if (kanjiIds.length === 0) return result;

  const db = getDatabase();
  const placeholders = kanjiIds.map(() => '?').join(', ');
  const rows = await db.getAllAsync<VocabularyRow>(
    `SELECT * FROM vocabulary
     WHERE kanji_id IN (${placeholders})
     ORDER BY kanji_id, sort_order`,
    ...kanjiIds,
  );

  for (const row of rows) {
    const list = result.get(row.kanji_id) ?? [];
    list.push(mapVocabularyRow(row));
    result.set(row.kanji_id, list);
  }

  return result;
}

export async function getVocabularyForKanji(kanjiId: number): Promise<Vocabulary[]> {
  const map = await getVocabularyByKanjiIds([kanjiId]);
  return map.get(kanjiId) ?? [];
}
