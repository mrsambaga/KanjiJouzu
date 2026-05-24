import { getDatabase, todayDateString } from '../db/database';
import { DailyActivity } from '../types';

export interface OverallStats {
  totalKanji: number;
  studied: number;
  mastered: number;
  difficult: number;
  newCount: number;
  totalReviews: number;
}

function dateDaysAgo(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}

export async function getOverallStats(): Promise<OverallStats> {
  const db = getDatabase();

  const kanjiRow = await db.getFirstAsync<{ total: number }>(
    'SELECT COUNT(*) AS total FROM kanji',
  );

  const progressRow = await db.getFirstAsync<{
    studied: number;
    mastered: number;
    difficult: number;
    totalReviews: number;
  }>(
    `SELECT
       SUM(CASE WHEN review_count > 0 THEN 1 ELSE 0 END) AS studied,
       SUM(CASE WHEN status = 'mastered' THEN 1 ELSE 0 END) AS mastered,
       SUM(CASE WHEN status = 'difficult' THEN 1 ELSE 0 END) AS difficult,
       COALESCE(SUM(review_count), 0) AS totalReviews
     FROM (
       SELECT COALESCE(p.status, 'new') AS status,
              COALESCE(p.review_count, 0) AS review_count
       FROM kanji k
       LEFT JOIN progress p ON p.kanji_id = k.id
     )`,
  );

  const totalKanji = kanjiRow?.total ?? 0;
  const studied = progressRow?.studied ?? 0;
  const mastered = progressRow?.mastered ?? 0;
  const difficult = progressRow?.difficult ?? 0;
  const newCount = totalKanji - studied;

  return {
    totalKanji,
    studied,
    mastered,
    difficult,
    newCount,
    totalReviews: progressRow?.totalReviews ?? 0,
  };
}

export async function getDailyActivity(days = 7): Promise<DailyActivity[]> {
  const db = getDatabase();
  const startDate = dateDaysAgo(days - 1);

  const rows = await db.getAllAsync<{
    date: string;
    cards_studied: number;
    minutes_studied: number;
  }>(
    `SELECT date, cards_studied, minutes_studied
     FROM daily_activity
     WHERE date >= ?
     ORDER BY date ASC`,
    startDate,
  );

  const byDate = new Map(
    rows.map((row) => [
      row.date,
      {
        date: row.date,
        cardsStudied: row.cards_studied,
        minutesStudied: row.minutes_studied,
      },
    ]),
  );

  const activity: DailyActivity[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const date = dateDaysAgo(i);
    activity.push(
      byDate.get(date) ?? {
        date,
        cardsStudied: 0,
        minutesStudied: 0,
      },
    );
  }

  return activity;
}

export async function getStudyStreak(): Promise<number> {
  const db = getDatabase();
  const rows = await db.getAllAsync<{ date: string; cards_studied: number }>(
    `SELECT date, cards_studied
     FROM daily_activity
     WHERE cards_studied > 0
     ORDER BY date DESC`,
  );

  if (rows.length === 0) return 0;

  const activeDates = new Set(rows.map((row) => row.date));
  let streak = 0;
  let offset = 0;

  const today = todayDateString();
  if (!activeDates.has(today)) {
    const yesterday = dateDaysAgo(1);
    if (!activeDates.has(yesterday)) return 0;
    offset = 1;
  }

  while (activeDates.has(dateDaysAgo(offset + streak))) {
    streak += 1;
  }

  return streak;
}
