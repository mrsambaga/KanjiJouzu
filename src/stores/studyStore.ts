import { create } from 'zustand';
import { KanjiWithProgress, StudySource } from '../types';
import { resetStudyPosition, saveStudyPosition } from '../services/studyPositionService';

interface StudyState {
  isActive: boolean;
  source: StudySource | null;
  queue: KanjiWithProgress[];
  currentIndex: number;
  showAnswer: boolean;
  sessionCorrect: number;
  sessionTotal: number;
  startedAt: string | null;
  startSession: (source: StudySource, kanji: KanjiWithProgress[], startIndex?: number) => void;
  flipCard: () => void;
  recordSessionResult: (correct: boolean) => void;
  nextCard: () => void;
  navigateNext: () => void;
  navigatePrevious: () => void;
  endSession: () => void;
}

function persistIndex(source: StudySource | null, index: number) {
  if (!source) return;
  saveStudyPosition(source, index).catch(console.warn);
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

  startSession: (source, kanji, startIndex = 0) => {
    const index = Math.min(Math.max(0, startIndex), Math.max(0, kanji.length - 1));
    set({
      isActive: true,
      source,
      queue: kanji,
      currentIndex: index,
      showAnswer: false,
      sessionCorrect: 0,
      sessionTotal: 0,
      startedAt: new Date().toISOString(),
    });
    persistIndex(source, index);
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
    const { currentIndex, queue, source } = get();
    if (currentIndex >= queue.length - 1) {
      if (source) resetStudyPosition(source).catch(console.warn);
      set({ isActive: false, showAnswer: false });
      return;
    }
    const newIndex = currentIndex + 1;
    set({ currentIndex: newIndex, showAnswer: false });
    persistIndex(source, newIndex);
  },

  navigateNext: () => {
    const { currentIndex, queue, source } = get();
    if (currentIndex >= queue.length - 1) return;
    const newIndex = currentIndex + 1;
    set({ currentIndex: newIndex, showAnswer: false });
    persistIndex(source, newIndex);
  },

  navigatePrevious: () => {
    const { currentIndex, source } = get();
    if (currentIndex <= 0) return;
    const newIndex = currentIndex - 1;
    set({ currentIndex: newIndex, showAnswer: false });
    persistIndex(source, newIndex);
  },

  endSession: () => {
    const { source, currentIndex } = get();
    persistIndex(source, currentIndex);
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
