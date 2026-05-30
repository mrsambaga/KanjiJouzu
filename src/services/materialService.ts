import { getDatabase } from '../db/database';
import {
  DeckStats,
  Grammar,
  GrammarWithProgress,
  JlptLevel,
  KanjiStatus,
  MainVocabulary,
  MainVocabularyWithProgress,
  MaterialProgress,
} from '../types';

export interface MainVocabularyRow {
  id: number;
  jlpt_level: JlptLevel;
  word: string;
  reading: string;
  romaji: string;
  meaning: string;
  part_of_speech: string;
  example: string;
  example_meaning: string;
  sort_order: number;
  status: KanjiStatus | null;
  review_count: number | null;
  correct_count: number | null;
  last_reviewed_at: string | null;
}

export interface GrammarRow {
  id: number;
  jlpt_level: JlptLevel;
  pattern: string;
  summary: string;
  category: string;
  example: string;
  example_meaning: string;
  sort_order: number;
  status: KanjiStatus | null;
  review_count: number | null;
  correct_count: number | null;
  last_reviewed_at: string | null;
}

function mapProgress(row: {
  status: KanjiStatus | null;
  review_count: number | null;
  correct_count: number | null;
  last_reviewed_at: string | null;
}): MaterialProgress | undefined {
  if (row.status == null) return undefined;
  return {
    status: row.status,
    reviewCount: row.review_count ?? 0,
    correctCount: row.correct_count ?? 0,
    lastReviewedAt: row.last_reviewed_at,
  };
}

function mapMainVocabularyRow(row: MainVocabularyRow): MainVocabularyWithProgress {
  return {
    id: row.id,
    jlptLevel: row.jlpt_level,
    word: row.word,
    reading: row.reading,
    romaji: row.romaji,
    meaning: row.meaning,
    partOfSpeech: row.part_of_speech as MainVocabulary['partOfSpeech'],
    example: row.example,
    exampleMeaning: row.example_meaning,
    sortOrder: row.sort_order,
    progress: mapProgress(row),
  };
}

function mapGrammarRow(row: GrammarRow): GrammarWithProgress {
  return {
    id: row.id,
    jlptLevel: row.jlpt_level,
    pattern: row.pattern,
    summary: row.summary,
    category: row.category as Grammar['category'],
    example: row.example,
    exampleMeaning: row.example_meaning,
    sortOrder: row.sort_order,
    progress: mapProgress(row),
  };
}

const MAIN_VOCAB_SELECT = `
  SELECT m.*,
         p.status,
         p.review_count,
         p.correct_count,
         p.last_reviewed_at
  FROM main_vocabulary m
  LEFT JOIN main_vocabulary_progress p ON p.main_vocabulary_id = m.id
`;

const GRAMMAR_SELECT = `
  SELECT g.*,
         p.status,
         p.review_count,
         p.correct_count,
         p.last_reviewed_at
  FROM grammar g
  LEFT JOIN grammar_progress p ON p.grammar_id = g.id
`;

export async function getMainVocabularyForLevel(
  level: JlptLevel,
): Promise<MainVocabularyWithProgress[]> {
  const db = getDatabase();
  const rows = await db.getAllAsync<MainVocabularyRow>(
    `${MAIN_VOCAB_SELECT} WHERE m.jlpt_level = ? ORDER BY m.sort_order`,
    level,
  );
  return rows.map(mapMainVocabularyRow);
}

export async function getMainVocabularyById(id: number): Promise<MainVocabularyWithProgress | null> {
  const db = getDatabase();
  const row = await db.getFirstAsync<MainVocabularyRow>(
    `${MAIN_VOCAB_SELECT} WHERE m.id = ?`,
    id,
  );
  return row ? mapMainVocabularyRow(row) : null;
}

export async function getGrammarForLevel(level: JlptLevel): Promise<GrammarWithProgress[]> {
  const db = getDatabase();
  const rows = await db.getAllAsync<GrammarRow>(
    `${GRAMMAR_SELECT} WHERE g.jlpt_level = ? ORDER BY g.sort_order`,
    level,
  );
  return rows.map(mapGrammarRow);
}

export async function getGrammarById(id: number): Promise<GrammarWithProgress | null> {
  const db = getDatabase();
  const row = await db.getFirstAsync<GrammarRow>(`${GRAMMAR_SELECT} WHERE g.id = ?`, id);
  return row ? mapGrammarRow(row) : null;
}

async function materialStats(
  table: 'main_vocabulary' | 'grammar',
  progressTable: 'main_vocabulary_progress' | 'grammar_progress',
  idColumn: 'main_vocabulary_id' | 'grammar_id',
  level: JlptLevel,
): Promise<DeckStats> {
  const db = getDatabase();
  const row = await db.getFirstAsync<{
    total: number;
    studied: number;
    mastered: number;
    difficult: number;
  }>(
    `SELECT
       COUNT(*) AS total,
       SUM(CASE WHEN COALESCE(p.review_count, 0) > 0 THEN 1 ELSE 0 END) AS studied,
       SUM(CASE WHEN p.status = 'mastered' THEN 1 ELSE 0 END) AS mastered,
       SUM(CASE WHEN p.status = 'difficult' THEN 1 ELSE 0 END) AS difficult
     FROM ${table} t
     LEFT JOIN ${progressTable} p ON p.${idColumn} = t.id
     WHERE t.jlpt_level = ?`,
    level,
  );
  const total = row?.total ?? 0;
  const studied = row?.studied ?? 0;
  return {
    total,
    studied,
    mastered: row?.mastered ?? 0,
    difficult: row?.difficult ?? 0,
    progressPercent: total === 0 ? 0 : Math.round((studied / total) * 100),
  };
}

export async function getMainVocabularyStats(level: JlptLevel): Promise<DeckStats> {
  return materialStats('main_vocabulary', 'main_vocabulary_progress', 'main_vocabulary_id', level);
}

export async function getGrammarStats(level: JlptLevel): Promise<DeckStats> {
  return materialStats('grammar', 'grammar_progress', 'grammar_id', level);
}

export function partOfSpeechLabel(pos: string): string {
  switch (pos) {
    case 'adj-i':
      return 'i-adj';
    case 'adj-na':
      return 'na-adj';
    case 'particle':
      return 'particle';
    case 'expression':
      return 'expression';
    default:
      return pos;
  }
}
