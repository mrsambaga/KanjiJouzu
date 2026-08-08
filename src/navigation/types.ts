import type { NavigatorScreenParams } from '@react-navigation/native';
import type { CardPreviewParams, CustomCard, JlptLevel, LevelContentType, MaterialPreviewParams } from '../types';

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
  MaterialLevelDetail: { level: JlptLevel; contentType: Exclude<LevelContentType, 'kanji'> };
  MaterialPreview: MaterialPreviewParams;
  CardPreview: CardPreviewParams;
  KanjiVocabulary: { kanjiId: number };
  DeckDetail: { deckId: number };
  CustomCardEditor: { deckId: number; card?: CustomCard };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
