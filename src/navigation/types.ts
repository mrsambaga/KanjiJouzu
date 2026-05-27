import type { NavigatorScreenParams } from '@react-navigation/native';
import type { CardPreviewParams, JlptLevel } from '../types';

export type TabParamList = {
  Home: undefined;
  Categories: undefined;
  Decks: undefined;
  Stats: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Onboarding: undefined;
  Main: NavigatorScreenParams<TabParamList>;
  Study: undefined;
  LevelDetail: { level: JlptLevel };
  CardPreview: CardPreviewParams;
  KanjiVocabulary: { kanjiId: number };
  DeckDetail: { deckId: number };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
