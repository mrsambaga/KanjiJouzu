import { create } from 'zustand';
import { KanjiWithProgress, StudySource } from '../types';

interface StudyState {
  isActive: boolean;
  source: StudySource | null;
  queue: KanjiWithProgress[];
  currentIndex: number;
  showAnswer: boolean;
  sessionCorrect: number;
  sessionTotal: number;
  startedAt: string | null;
  startSession: (source: StudySource, kanji: KanjiWithProgress[]) => void;
  flipCard: () => void;
  recordSessionResult: (correct: boolean) => void;
  nextCard: () => void;
  endSession: () => void;
}

export const useStudyStore = create<StudyState>((set, get) => ({
  isActive: false,
  source: null,
  queue: [],
  currentIndex: 0,
  showAnswer: false,
  sessionCorrect: 0,
  sessionTotal: 0,
  startedAt: null,

  startSession: (source, kanji) => {
    set({
      isActive: true,
      source,
      queue: kanji,
      currentIndex: 0,
      showAnswer: false,
      sessionCorrect: 0,
      sessionTotal: 0,
      startedAt: new Date().toISOString(),
    });
  },

  flipCard: () => {
    set({ showAnswer: !get().showAnswer });
  },

  recordSessionResult: (correct) => {
    const { sessionCorrect, sessionTotal } = get();
    set({
      sessionCorrect: correct ? sessionCorrect + 1 : sessionCorrect,
      sessionTotal: sessionTotal + 1,
    });
  },

  nextCard: () => {
    const { currentIndex, queue } = get();
    if (currentIndex >= queue.length - 1) {
      set({ isActive: false, showAnswer: false });
      return;
    }
    set({ currentIndex: currentIndex + 1, showAnswer: false });
  },

  endSession: () => {
    set({
      isActive: false,
      source: null,
      queue: [],
      currentIndex: 0,
      showAnswer: false,
      startedAt: null,
    });
  },
}));
