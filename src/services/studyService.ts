import { getCustomDeck } from './deckService';
import {
  getDifficultKanji,
  getDifficultVocabulary,
  getRecentlyStudied,
} from './progressService';
import { getKanjiWithProgress } from './kanjiService';
import { getStudyPosition, resetStudyPosition } from './studyPositionService';
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

export type DifficultStudyFilter = { type: 'all' } | { type: 'jlpt'; level: JlptLevel };

function shouldResumeSavedPosition(source: StudySource): boolean {
  return source.type === 'jlpt' || source.type === 'custom';
}

function toDifficultFilter(source: StudySource): DifficultStudyFilter | null {
  if (source.type === 'difficult') return { type: 'all' };
  if (source.type === 'jlpt-difficult') return { type: 'jlpt', level: source.level };
  return null;
}

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

/** Cards for difficult review: difficult kanji + their vocab, plus individually difficult vocabulary. */
export async function buildDifficultStudyCards(
  filter: DifficultStudyFilter,
): Promise<StudyCard[]> {
  await ensureVocabularySeeded();

  const [allDifficultKanji, allDifficultVocab] = await Promise.all([
    getDifficultKanji(),
    getDifficultVocabulary(),
  ]);

  const difficultKanji =
    filter.type === 'jlpt'
      ? orderKanjiByLevel(filterKanjiByLevel(allDifficultKanji, filter.level), filter.level)
      : allDifficultKanji;

  const levelKanjiIds =
    filter.type === 'jlpt'
      ? new Set((await getKanjiForLevel(filter.level)).map((k) => k.id))
      : null;

  const difficultVocab = levelKanjiIds
    ? allDifficultVocab.filter((v) => levelKanjiIds.has(v.kanjiId))
    : allDifficultVocab;

  const difficultKanjiIds = new Set(difficultKanji.map((k) => k.id));
  const difficultVocabIds = new Set(difficultVocab.map((v) => v.id));

  const extraParentIds = [
    ...new Set(
      difficultVocab.map((v) => v.kanjiId).filter((id) => !difficultKanjiIds.has(id)),
    ),
  ];
  const extraKanji =
    extraParentIds.length > 0 ? await getKanjiWithProgress(extraParentIds) : [];

  const orderedKanji: KanjiWithProgress[] = [];
  const seenKanji = new Set<number>();
  for (const kanji of prioritizeQueue(difficultKanji)) {
    if (seenKanji.has(kanji.id)) continue;
    seenKanji.add(kanji.id);
    orderedKanji.push(kanji);
  }

  const orderedExtra =
    filter.type === 'jlpt' ? orderKanjiByLevel(extraKanji, filter.level) : extraKanji;
  for (const kanji of orderedExtra) {
    if (seenKanji.has(kanji.id)) continue;
    seenKanji.add(kanji.id);
    orderedKanji.push(kanji);
  }

  if (orderedKanji.length === 0) return [];

  const vocabByKanji = await getVocabularyByKanjiIds(orderedKanji.map((k) => k.id));
  const cards: StudyCard[] = [];

  for (const kanji of orderedKanji) {
    const vocabs = (vocabByKanji.get(kanji.id) ?? []).slice(0, VOCAB_PER_KANJI);
    const isKanjiDifficult = difficultKanjiIds.has(kanji.id);

    if (isKanjiDifficult) {
      cards.push({ type: 'kanji', kanji });
      for (const entry of vocabs) {
        cards.push({ type: 'vocabulary', kanji, vocabulary: entry });
      }
      continue;
    }

    const difficultOnly = vocabs.filter((v) => difficultVocabIds.has(v.id));
    if (difficultOnly.length === 0) continue;

    cards.push({ type: 'kanji', kanji });
    for (const entry of difficultOnly) {
      cards.push({ type: 'vocabulary', kanji, vocabulary: entry });
    }
  }

  return cards;
}

export async function getDifficultStudyCardCount(
  filter: DifficultStudyFilter,
): Promise<number> {
  const cards = await buildDifficultStudyCards(filter);
  return cards.length;
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
  const difficultFilter = toDifficultFilter(source);
  if (difficultFilter) {
    const queue = await buildDifficultStudyCards(difficultFilter);
    if (queue.length === 0) return null;
    await resetStudyPosition(source);
    return { queue, startIndex: 0 };
  }

  const kanjiQueue = await buildStudyQueue(source);
  if (kanjiQueue.length === 0) return null;

  await ensureVocabularySeeded();
  const queue = await expandQueueWithVocabulary(kanjiQueue);

  let startIndex = 0;
  if (shouldResumeSavedPosition(source)) {
    const savedIndex = await getStudyPosition(source);
    startIndex = Math.min(Math.max(0, savedIndex), Math.max(0, queue.length - 1));
  } else {
    await resetStudyPosition(source);
  }

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
