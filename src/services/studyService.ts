import { getCustomDeck } from './deckService';
import { getDifficultKanji, getRecentlyStudied } from './progressService';
import { getKanjiWithProgress } from './kanjiService';
import { getDatabase, todayDateString } from '../db/database';
import { KanjiWithProgress, JlptLevel, StudySource } from '../types';

const STATUS_ORDER: Record<string, number> = {
  difficult: 0,
  new: 1,
  studying: 2,
  mastered: 3,
};

function prioritizeQueue(kanji: KanjiWithProgress[]): KanjiWithProgress[] {
  return [...kanji].sort((a, b) => {
    const sa = a.progress?.status ?? 'new';
    const sb = b.progress?.status ?? 'new';
    return (STATUS_ORDER[sa] ?? 1) - (STATUS_ORDER[sb] ?? 1);
  });
}

export async function buildStudyQueue(source: StudySource): Promise<KanjiWithProgress[]> {
  switch (source.type) {
    case 'jlpt': {
      const all = await getKanjiWithProgress();
      return prioritizeQueue(all.filter((k) => k.jlptLevel === source.level));
    }
    case 'custom': {
      const deck = await getCustomDeck(source.deckId);
      if (!deck || deck.kanjiIds.length === 0) return [];
      return getKanjiWithProgress(deck.kanjiIds);
    }
    case 'difficult':
      return getDifficultKanji();
    case 'continue':
      return getRecentlyStudied(20);
    default:
      return [];
  }
}

export async function getDailyGoalProgress(): Promise<{ studied: number; goal: number }> {
  const db = getDatabase();
  const today = todayDateString();
  const row = await db.getFirstAsync<{ cards_studied: number }>(
    'SELECT cards_studied FROM daily_activity WHERE date = ?',
    today,
  );
  return { studied: row?.cards_studied ?? 0, goal: 20 };
}

export function filterByLevel(kanji: KanjiWithProgress[], level: JlptLevel): KanjiWithProgress[] {
  return kanji.filter((k) => k.jlptLevel === level);
}
