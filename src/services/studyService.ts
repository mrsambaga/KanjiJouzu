import { getCustomDeck } from './deckService';
import { getDifficultKanji, getRecentlyStudied } from './progressService';
import { getKanjiWithProgress } from './kanjiService';
import { getStudyPosition } from './studyPositionService';
import { getVocabularyByKanjiIds } from './vocabularyService';
import { N4_KANJI_CHARACTERS, N4_KANJI_CHARACTER_SET } from '../data/n4Kanji';
import { N5_KANJI_CHARACTERS, N5_KANJI_CHARACTER_SET } from '../data/n5Kanji';
import { ensureVocabularySeeded, getDatabase, todayDateString } from '../db/database';
import { KanjiWithProgress, JlptLevel, StudyCard, StudySource } from '../types';

const N4_ORDER = new Map(N4_KANJI_CHARACTERS.map((character, index) => [character, index]));
const N5_ORDER = new Map(N5_KANJI_CHARACTERS.map((character, index) => [character, index]));

function filterKanjiByLevel(all: KanjiWithProgress[], level: JlptLevel): KanjiWithProgress[] {
  if (level === 'N4') {
    return all.filter((k) => N4_KANJI_CHARACTER_SET.has(k.character));
  }
  return all.filter((k) => N5_KANJI_CHARACTER_SET.has(k.character));
}

function orderKanjiByLevel(kanji: KanjiWithProgress[], level: JlptLevel): KanjiWithProgress[] {
  const order = level === 'N4' ? N4_ORDER : N5_ORDER;
  return [...kanji].sort((a, b) => (order.get(a.character) ?? 0) - (order.get(b.character) ?? 0));
}

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

const VOCAB_PER_KANJI = 5;

export async function expandQueueWithVocabulary(
  kanjiList: KanjiWithProgress[],
): Promise<StudyCard[]> {
  const vocabByKanji = await getVocabularyByKanjiIds(kanjiList.map((k) => k.id));
  const cards: StudyCard[] = [];

  for (const kanji of kanjiList) {
    cards.push({ type: 'kanji', kanji });
    const vocab = (vocabByKanji.get(kanji.id) ?? []).slice(0, VOCAB_PER_KANJI);
    for (const entry of vocab) {
      cards.push({ type: 'vocabulary', kanji, vocabulary: entry });
    }
  }

  return cards;
}

export async function getKanjiForLevel(level: JlptLevel): Promise<KanjiWithProgress[]> {
  const all = await getKanjiWithProgress();
  return orderKanjiByLevel(filterKanjiByLevel(all, level), level);
}

export async function buildStudyQueue(source: StudySource): Promise<KanjiWithProgress[]> {
  switch (source.type) {
    case 'jlpt': {
      const ordered = await getKanjiForLevel(source.level);
      return prioritizeQueue(ordered);
    }
    case 'jlpt-difficult': {
      const difficult = await getDifficultKanji();
      const filtered = orderKanjiByLevel(
        filterKanjiByLevel(difficult, source.level),
        source.level,
      );
      return prioritizeQueue(filtered);
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

export async function prepareStudySession(
  source: StudySource,
): Promise<{ queue: StudyCard[]; startIndex: number } | null> {
  const kanjiQueue = await buildStudyQueue(source);
  if (kanjiQueue.length === 0) return null;

  await ensureVocabularySeeded();
  const queue = await expandQueueWithVocabulary(kanjiQueue);
  const savedIndex = await getStudyPosition(source);
  const startIndex = Math.min(Math.max(0, savedIndex), queue.length - 1);
  return { queue, startIndex };
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
