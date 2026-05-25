export type JlptLevel = 'N5' | 'N4';

export type KanjiStatus = 'new' | 'studying' | 'difficult' | 'mastered';

export interface Kanji {
  id: number;
  character: string;
  romaji: string;
  meaning: string;
  jlptLevel: JlptLevel;
  onyomi?: string;
  kunyomi?: string;
  example?: string;
  exampleMeaning?: string;
}

export interface KanjiProgress {
  kanjiId: number;
  status: KanjiStatus;
  reviewCount: number;
  correctCount: number;
  lastReviewedAt: string | null;
  nextReviewAt: string | null;
}

export interface CustomDeck {
  id: number;
  name: string;
  createdAt: string;
  kanjiIds: number[];
}

export interface StudySession {
  id: number;
  deckType: 'N5' | 'N4' | 'custom' | 'difficult';
  deckId?: number;
  startedAt: string;
  completedAt: string | null;
  cardsStudied: number;
  cardsCorrect: number;
}

export interface DailyActivity {
  date: string;
  cardsStudied: number;
  minutesStudied: number;
}

export interface AppSettings {
  darkMode: boolean;
  showRomaji: boolean;
  fontSize: 'small' | 'medium' | 'large';
  onboardingComplete: boolean;
}

export interface DeckStats {
  total: number;
  studied: number;
  mastered: number;
  difficult: number;
  progressPercent: number;
}

export type StudySource =
  | { type: 'jlpt'; level: JlptLevel }
  | { type: 'jlpt-difficult'; level: JlptLevel }
  | { type: 'custom'; deckId: number }
  | { type: 'difficult' }
  | { type: 'continue' };

export type CardPreviewParams =
  | { type: 'kanji'; kanjiId: number }
  | { type: 'vocabulary'; kanjiId: number; vocabularyId: number };

export interface KanjiWithProgress extends Kanji {
  progress?: KanjiProgress;
}

export interface Vocabulary {
  id: number;
  kanjiId: number;
  word: string;
  reading: string;
  meaning: string;
  sortOrder: number;
}

export type VocabularySeed = Pick<Vocabulary, 'word' | 'reading' | 'meaning'>;

export type StudyCard =
  | { type: 'kanji'; kanji: KanjiWithProgress }
  | { type: 'vocabulary'; kanji: KanjiWithProgress; vocabulary: Vocabulary };
