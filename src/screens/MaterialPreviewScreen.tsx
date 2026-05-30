import React, { useCallback, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, ScrollView, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useRoute } from '@react-navigation/native';
import { ReviewFlashCard } from '../components/flashcard/ReviewFlashCard';
import { Tag } from '../components/ui/Tag';
import { useTheme } from '../context/ThemeContext';
import { getGrammarById, getMainVocabularyById, partOfSpeechLabel } from '../services/materialService';
import { RootStackParamList } from '../navigation/types';
import { StudyCard } from '../types';
import { spacing } from '../theme';

type Route = RouteProp<RootStackParamList, 'MaterialPreview'>;

export function MaterialPreviewScreen() {
  const { colors } = useTheme();
  const route = useRoute<Route>();
  const [card, setCard] = useState<Extract<StudyCard, { type: 'main-vocabulary' } | { type: 'grammar' }> | null>(
    null,
  );
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = route.params;
    if (params.type === 'main-vocabulary') {
      const item = await getMainVocabularyById(params.id);
      setCard(item ? { type: 'main-vocabulary', item } : null);
    } else {
      const item = await getGrammarById(params.id);
      setCard(item ? { type: 'grammar', item } : null);
    }
    setIsFlipped(false);
    setLoading(false);
  }, [route.params]);

  React.useEffect(() => {
    load();
  }, [load]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : card ? (
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.detailCard}>
            {card.type === 'main-vocabulary' ? (
              <>
                <Tag label={partOfSpeechLabel(card.item.partOfSpeech)} variant="primary" />
                <Text style={[styles.word, { color: colors.onSurface }]}>{card.item.word}</Text>
                <Text style={[styles.meta, { color: colors.primary }]}>{card.item.reading}</Text>
                <Text style={[styles.meta, { color: colors.onSurface }]}>{card.item.meaning}</Text>
              </>
            ) : (
              <>
                <Tag label={partOfSpeechLabel(card.item.category)} variant="primary" />
                <Text style={[styles.pattern, { color: colors.onSurface }]}>{card.item.pattern}</Text>
                <Text style={[styles.meta, { color: colors.onSurfaceVariant }]}>{card.item.summary}</Text>
              </>
            )}
            <Text style={[styles.exampleHeading, { color: colors.onSurfaceVariant }]}>Example</Text>
            <Text style={[styles.example, { color: colors.onSurface }]}>
              {card.type === 'main-vocabulary' ? card.item.example : card.item.example}
            </Text>
            <Text style={[styles.exampleMeaning, { color: colors.primary }]}>
              {card.type === 'main-vocabulary' ? card.item.exampleMeaning : card.item.exampleMeaning}
            </Text>
          </View>

          <ReviewFlashCard
            card={card}
            isFlipped={isFlipped}
            onFlip={() => setIsFlipped((f) => !f)}
          />
        </ScrollView>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: spacing.containerPadding },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: {
    paddingVertical: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xl,
  },
  detailCard: {
    gap: spacing.sm,
    alignItems: 'center',
  },
  word: {
    fontFamily: 'NotoSerifJP_400Regular',
    fontSize: 36,
    textAlign: 'center',
  },
  pattern: {
    fontFamily: 'BeVietnamPro_700Bold',
    fontSize: 24,
    textAlign: 'center',
  },
  meta: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    textAlign: 'center',
  },
  exampleHeading: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    letterSpacing: 0.24,
    textTransform: 'uppercase',
    marginTop: spacing.sm,
  },
  example: {
    fontFamily: 'NotoSerifJP_400Regular',
    fontSize: 20,
    textAlign: 'center',
  },
  exampleMeaning: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    textAlign: 'center',
  },
});
