import React, { useCallback, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useRoute } from '@react-navigation/native';
import { FlashCard } from '../components/flashcard/FlashCard';
import { useTheme } from '../context/ThemeContext';
import { getKanjiWithProgress } from '../services/kanjiService';
import { getVocabularyForKanji } from '../services/vocabularyService';
import { RootStackParamList } from '../navigation/types';
import { StudyCard } from '../types';
import { spacing } from '../theme';

type Route = RouteProp<RootStackParamList, 'CardPreview'>;

export function CardPreviewScreen() {
  const { colors } = useTheme();
  const route = useRoute<Route>();
  const [card, setCard] = useState<StudyCard | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadCard = useCallback(async () => {
    setLoading(true);
    const params = route.params;

    if (params.type === 'kanji') {
      const rows = await getKanjiWithProgress([params.kanjiId]);
      const kanji = rows[0];
      if (kanji) setCard({ type: 'kanji', kanji });
      else setCard(null);
    } else {
      const rows = await getKanjiWithProgress([params.kanjiId]);
      const kanji = rows[0];
      const vocabList = await getVocabularyForKanji(params.kanjiId);
      const vocabulary = vocabList.find((v) => v.id === params.vocabularyId);
      if (kanji && vocabulary) {
        setCard({ type: 'vocabulary', kanji, vocabulary });
      } else {
        setCard(null);
      }
    }
    setIsFlipped(false);
    setLoading(false);
  }, [route.params]);

  React.useEffect(() => {
    loadCard();
  }, [loadCard]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : card ? (
        <View style={styles.cardArea}>
          <FlashCard
            card={card}
            isFlipped={isFlipped}
            onFlip={() => setIsFlipped((f) => !f)}
            mode="preview"
          />
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.containerPadding,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardArea: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: spacing.lg,
  },
});
