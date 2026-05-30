import { getDatabase, todayDateString } from '../db/database';
import { KanjiStatus } from '../types';
import { ReviewResult } from './progressService';

const MASTERED_THRESHOLD = 3;

function nextStatus(current: KanjiStatus, result: ReviewResult, correctCount: number): KanjiStatus {
  if (result === 'difficult') return 'difficult';
  if (correctCount >= MASTERED_THRESHOLD) return 'mastered';
  if (current === 'new') return 'studying';
  return current === 'difficult' ? 'studying' : current === 'mastered' ? 'mastered' : 'studying';
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

async function recordMaterialReview(
  table: 'main_vocabulary_progress' | 'grammar_progress',
  idColumn: 'main_vocabulary_id' | 'grammar_id',
  itemId: number,
  result: ReviewResult,
): Promise<void> {
  const db = getDatabase();
  const now = new Date().toISOString();

  const existing = await db.getFirstAsync<{
    status: KanjiStatus;
    review_count: number;
    correct_count: number;
  }>(`SELECT status, review_count, correct_count FROM ${table} WHERE ${idColumn} = ?`, itemId);

  const currentStatus = existing?.status ?? 'new';
  const reviewCount = (existing?.review_count ?? 0) + 1;
  const correctCount =
    result === 'remembered' ? (existing?.correct_count ?? 0) + 1 : (existing?.correct_count ?? 0);
  const status = nextStatus(currentStatus, result, correctCount);

  if (existing) {
    await db.runAsync(
      `UPDATE ${table}
       SET status = ?, review_count = ?, correct_count = ?, last_reviewed_at = ?
       WHERE ${idColumn} = ?`,
      status,
      reviewCount,
      correctCount,
      now,
      itemId,
    );
  } else {
    await db.runAsync(
      `INSERT INTO ${table} (${idColumn}, status, review_count, correct_count, last_reviewed_at)
       VALUES (?, ?, ?, ?, ?)`,
      itemId,
      status,
      reviewCount,
      correctCount,
      now,
    );
  }

  await bumpDailyActivity(1);
}

export async function recordMainVocabularyReview(
  id: number,
  result: ReviewResult,
): Promise<void> {
  await recordMaterialReview('main_vocabulary_progress', 'main_vocabulary_id', id, result);
}

export async function recordGrammarReview(id: number, result: ReviewResult): Promise<void> {
  await recordMaterialReview('grammar_progress', 'grammar_id', id, result);
}
