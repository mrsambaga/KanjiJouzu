import { getDatabase, todayDateString } from '../db/database';
import {
  DeckStats,
  JlptLevel,
  KanjiStatus,
  KanjiWithProgress,
} from '../types';
import {
  KanjiWithProgressRow,
  mapKanjiWithProgressRow,
  ProgressRow,
} from './kanjiService';

export type ReviewResult = 'remembered' | 'difficult';

const MASTERED_THRESHOLD = 3;

function mapDeckStatsRow(row: {
  total: number;
  studied: number;
  mastered: number;
  difficult: number;
}): DeckStats {
  const progressPercent =
    row.total === 0 ? 0 : Math.round((row.mastered / row.total) * 100);
  return {
    total: row.total,
    studied: row.studied,
    mastered: row.mastered,
    difficult: row.difficult,
    progressPercent,
  };
}

function nextStatus(current: KanjiStatus, result: ReviewResult, correctCount: number): KanjiStatus {
  if (result === 'difficult') return 'difficult';
  if (correctCount >= MASTERED_THRESHOLD) return 'mastered';
  if (current === 'new') return 'studying';
  return current === 'difficult' ? 'studying' : current === 'mastered' ? 'mastered' : 'studying';
}

async function ensureProgressRow(kanjiId: number): Promise<ProgressRow> {
  const db = getDatabase();
  const existing = await db.getFirstAsync<ProgressRow>(
    'SELECT * FROM progress WHERE kanji_id = ?',
    kanjiId,
  );
  if (existing) return existing;

  await db.runAsync(
    `INSERT INTO progress (kanji_id, status, review_count, correct_count)
     VALUES (?, 'new', 0, 0)`,
    kanjiId,
  );

  return {
    kanji_id: kanjiId,
    status: 'new',
    review_count: 0,
    correct_count: 0,
    last_reviewed_at: null,
    next_review_at: null,
  };
}

async function bumpDailyActivity(cardsStudied: number): Promise<void> {
  const db = getDatabase();
  const date = todayDateString();
  await db.runAsync(
    `INSERT INTO daily_activity (date, cards_studied, minutes_studied)
     VALUES (?, ?, 0)
     ON CONFLICT(date) DO UPDATE SET cards_studied = cards_studied + excluded.cards_studied`,
    date,
    cardsStudied,
  );
}

export async function recordReview(
  kanjiId: number,
  result: ReviewResult,
): Promise<void> {
  const db = getDatabase();
  const now = new Date().toISOString();
  const current = await ensureProgressRow(kanjiId);

  const reviewCount = current.review_count + 1;
  const correctCount =
    result === 'remembered' ? current.correct_count + 1 : current.correct_count;
  const status = nextStatus(current.status, result, correctCount);

  await db.runAsync(
    `UPDATE progress
     SET status = ?, review_count = ?, correct_count = ?, last_reviewed_at = ?, next_review_at = NULL
     WHERE kanji_id = ?`,
    status,
    reviewCount,
    correctCount,
    now,
    kanjiId,
  );

  await db.runAsync(
    'INSERT INTO review_history (kanji_id, result, reviewed_at) VALUES (?, ?, ?)',
    kanjiId,
    result,
    now,
  );

  await bumpDailyActivity(1);
}

export async function getDeckStats(
  filter:
    | { type: 'jlpt'; level: JlptLevel }
    | { type: 'custom'; deckId: number }
    | { type: 'all' },
): Promise<DeckStats> {
  const db = getDatabase();

  const statsQuery = `
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN COALESCE(p.review_count, 0) > 0 THEN 1 ELSE 0 END) AS studied,
      SUM(CASE WHEN p.status = 'mastered' THEN 1 ELSE 0 END) AS mastered,
      SUM(CASE WHEN p.status = 'difficult' THEN 1 ELSE 0 END) AS difficult
    FROM kanji k
    LEFT JOIN progress p ON p.kanji_id = k.id
  `;

  if (filter.type === 'jlpt') {
    const row = await db.getFirstAsync<{
      total: number;
      studied: number;
      mastered: number;
      difficult: number;
    }>(`${statsQuery} WHERE k.jlpt_level = ?`, filter.level);
    return mapDeckStatsRow(row ?? { total: 0, studied: 0, mastered: 0, difficult: 0 });
  }

  if (filter.type === 'custom') {
    const row = await db.getFirstAsync<{
      total: number;
      studied: number;
      mastered: number;
      difficult: number;
    }>(
      `${statsQuery}
       INNER JOIN deck_kanji dk ON dk.kanji_id = k.id
       WHERE dk.deck_id = ?`,
      filter.deckId,
    );
    return mapDeckStatsRow(row ?? { total: 0, studied: 0, mastered: 0, difficult: 0 });
  }

  const row = await db.getFirstAsync<{
    total: number;
    studied: number;
    mastered: number;
    difficult: number;
  }>(statsQuery);
  return mapDeckStatsRow(row ?? { total: 0, studied: 0, mastered: 0, difficult: 0 });
}

export async function getDifficultKanji(): Promise<KanjiWithProgress[]> {
  const db = getDatabase();
  const rows = await db.getAllAsync<KanjiWithProgressRow>(
    `SELECT k.*,
            p.status,
            p.review_count,
            p.correct_count,
            p.last_reviewed_at,
            p.next_review_at
     FROM kanji k
     INNER JOIN progress p ON p.kanji_id = k.id
     WHERE p.status = 'difficult'
     ORDER BY p.last_reviewed_at DESC`,
  );
  return rows.map(mapKanjiWithProgressRow);
}

export async function resetProgress(kanjiIds?: number[]): Promise<void> {
  const db = getDatabase();

  if (kanjiIds && kanjiIds.length === 0) return;

  if (kanjiIds) {
    const placeholders = kanjiIds.map(() => '?').join(', ');
    await db.runAsync(`DELETE FROM progress WHERE kanji_id IN (${placeholders})`, ...kanjiIds);
    await db.runAsync(
      `DELETE FROM review_history WHERE kanji_id IN (${placeholders})`,
      ...kanjiIds,
    );
    return;
  }

  await db.runAsync('DELETE FROM progress');
  await db.runAsync('DELETE FROM review_history');
}

export async function getRecentlyStudied(limit = 20): Promise<KanjiWithProgress[]> {
  const db = getDatabase();
  const rows = await db.getAllAsync<KanjiWithProgressRow>(
    `SELECT k.*,
            p.status,
            p.review_count,
            p.correct_count,
            p.last_reviewed_at,
            p.next_review_at
     FROM kanji k
     INNER JOIN progress p ON p.kanji_id = k.id
     WHERE p.last_reviewed_at IS NOT NULL
     ORDER BY p.last_reviewed_at DESC
     LIMIT ?`,
    limit,
  );
  return rows.map(mapKanjiWithProgressRow);
}
