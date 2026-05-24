import { getDatabase } from '../db/database';
import {
  JlptLevel,
  Kanji,
  KanjiProgress,
  KanjiStatus,
  KanjiWithProgress,
} from '../types';

export interface KanjiRow {
  id: number;
  character: string;
  romaji: string;
  meaning: string;
  jlpt_level: JlptLevel;
  onyomi: string | null;
  kunyomi: string | null;
  example: string | null;
  example_meaning: string | null;
}

export interface ProgressRow {
  kanji_id: number;
  status: KanjiStatus;
  review_count: number;
  correct_count: number;
  last_reviewed_at: string | null;
  next_review_at: string | null;
}

export interface KanjiWithProgressRow extends KanjiRow {
  status: KanjiStatus | null;
  review_count: number | null;
  correct_count: number | null;
  last_reviewed_at: string | null;
  next_review_at: string | null;
}

export function mapKanjiRow(row: KanjiRow): Kanji {
  return {
    id: row.id,
    character: row.character,
    romaji: row.romaji,
    meaning: row.meaning,
    jlptLevel: row.jlpt_level,
    onyomi: row.onyomi ?? undefined,
    kunyomi: row.kunyomi ?? undefined,
    example: row.example ?? undefined,
    exampleMeaning: row.example_meaning ?? undefined,
  };
}

export function mapProgressRow(row: ProgressRow): KanjiProgress {
  return {
    kanjiId: row.kanji_id,
    status: row.status,
    reviewCount: row.review_count,
    correctCount: row.correct_count,
    lastReviewedAt: row.last_reviewed_at,
    nextReviewAt: row.next_review_at,
  };
}

export function mapKanjiWithProgressRow(row: KanjiWithProgressRow): KanjiWithProgress {
  const kanji = mapKanjiRow(row);
  if (row.status == null) return kanji;

  return {
    ...kanji,
    progress: {
      kanjiId: row.id,
      status: row.status,
      reviewCount: row.review_count ?? 0,
      correctCount: row.correct_count ?? 0,
      lastReviewedAt: row.last_reviewed_at,
      nextReviewAt: row.next_review_at,
    },
  };
}

export async function getKanjiByLevel(level: JlptLevel): Promise<Kanji[]> {
  const db = getDatabase();
  const rows = await db.getAllAsync<KanjiRow>(
    'SELECT * FROM kanji WHERE jlpt_level = ? ORDER BY id',
    level,
  );
  return rows.map(mapKanjiRow);
}

export async function searchKanji(query: string): Promise<Kanji[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const db = getDatabase();
  const pattern = `%${trimmed}%`;
  const rows = await db.getAllAsync<KanjiRow>(
    `SELECT * FROM kanji
     WHERE character LIKE ? OR romaji LIKE ? OR meaning LIKE ?
     ORDER BY jlpt_level, id`,
    pattern,
    pattern,
    pattern,
  );
  return rows.map(mapKanjiRow);
}

export async function getKanjiByIds(ids: number[]): Promise<Kanji[]> {
  if (ids.length === 0) return [];

  const db = getDatabase();
  const placeholders = ids.map(() => '?').join(', ');
  const rows = await db.getAllAsync<KanjiRow>(
    `SELECT * FROM kanji WHERE id IN (${placeholders}) ORDER BY id`,
    ...ids,
  );
  return rows.map(mapKanjiRow);
}

export async function getKanjiWithProgress(ids?: number[]): Promise<KanjiWithProgress[]> {
  const db = getDatabase();

  if (ids && ids.length === 0) return [];

  const baseQuery = `
    SELECT k.*,
           p.status,
           p.review_count,
           p.correct_count,
           p.last_reviewed_at,
           p.next_review_at
    FROM kanji k
    LEFT JOIN progress p ON p.kanji_id = k.id
  `;

  const rows =
    ids && ids.length > 0
      ? await db.getAllAsync<KanjiWithProgressRow>(
          `${baseQuery} WHERE k.id IN (${ids.map(() => '?').join(', ')}) ORDER BY k.id`,
          ...ids,
        )
      : await db.getAllAsync<KanjiWithProgressRow>(`${baseQuery} ORDER BY k.id`);

  return rows.map(mapKanjiWithProgressRow);
}
