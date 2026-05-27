import React, { useCallback, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Tag } from '../components/ui/Tag';
import { useTheme } from '../context/ThemeContext';
import { getKanjiWithProgress } from '../services/kanjiService';
import { getVocabularyForKanji } from '../services/vocabularyService';
import { RootStackParamList } from '../navigation/types';
import { StudyCard } from '../types';
import { spacing } from '../theme';
import { useSettingsStore } from '../stores/settingsStore';

type Route = RouteProp<RootStackParamList, 'CardPreview'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

export function CardPreviewScreen() {
  const { colors, typography } = useTheme();
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const showRomaji = useSettingsStore((s) => s.showRomaji);
  const [card, setCard] = useState<StudyCard | null>(null);
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
        card.type === 'kanji' ? (
          <ScrollView contentContainerStyle={styles.detailScroll}>
            <Card style={styles.detailCard} elevated={false}>
              <View style={styles.detailHeader}>
                <Tag label={card.kanji.jlptLevel} variant="primary" />
                {card.kanji.progress?.status ? (
                  <Tag
                    label={card.kanji.progress.status}
                    variant={card.kanji.progress.status === 'difficult' ? 'warning' : 'default'}
                  />
                ) : null}
              </View>

              <Text
                style={[
                  styles.detailKanji,
                  {
                    fontFamily: typography.displayKanji.fontFamily,
                    color: colors.onSurface,
                    letterSpacing: typography.displayKanji.letterSpacing,
                  },
                ]}
              >
                {card.kanji.character}
              </Text>
              <Text style={[styles.detailMeaning, { color: colors.onSurface }]}>
                {card.kanji.meaning}
              </Text>

              {showRomaji ? (
                <Text style={[styles.detailRomaji, { color: colors.primary }]}>{card.kanji.romaji}</Text>
              ) : null}

              <View style={styles.readings}>
                {card.kanji.onyomi ? (
                  <Text style={[styles.readingLine, { color: colors.onSurfaceVariant }]}>
                    On: {card.kanji.onyomi}
                  </Text>
                ) : null}
                {card.kanji.kunyomi ? (
                  <Text style={[styles.readingLine, { color: colors.onSurfaceVariant }]}>
                    Kun: {card.kanji.kunyomi}
                  </Text>
                ) : null}
              </View>

              {card.kanji.example ? (
                <View style={[styles.exampleBox, { backgroundColor: colors.surfaceContainer }]}>
                  <Text style={[styles.example, { color: colors.onSurface }]}>{card.kanji.example}</Text>
                  {card.kanji.exampleMeaning ? (
                    <Text style={[styles.exampleMeaning, { color: colors.onSurfaceVariant }]}>
                      {card.kanji.exampleMeaning}
                    </Text>
                  ) : null}
                </View>
              ) : null}
            </Card>

            <Button
              title="Vocabulary examples"
              variant="outline"
              onPress={() => navigation.navigate('KanjiVocabulary', { kanjiId: card.kanji.id })}
              fullWidth
            />
          </ScrollView>
        ) : (
          <ScrollView contentContainerStyle={styles.detailScroll}>
            <Card style={styles.detailCard} elevated={false}>
              <View style={styles.detailHeader}>
                <Tag label="Vocabulary" variant="primary" />
                <Tag label={card.kanji.jlptLevel} />
              </View>

              <Text
                style={[
                  styles.detailVocabWord,
                  {
                    fontFamily: typography.displayKanji.fontFamily,
                    color: colors.onSurface,
                  },
                ]}
              >
                {card.vocabulary.word}
              </Text>

              <Text style={[styles.detailMeaning, { color: colors.onSurface }]}>
                {card.vocabulary.meaning}
              </Text>

              <Text style={[styles.detailReading, { color: colors.primary }]}>
                {card.vocabulary.reading}
              </Text>

              {showRomaji ? (
                <Text style={[styles.detailRomaji, { color: colors.onSurfaceVariant }]}>
                  {card.vocabulary.romaji}
                </Text>
              ) : null}

              <View style={styles.parentKanjiBox}>
                <Text style={[styles.parentKanjiLabel, { color: colors.onSurfaceVariant }]}>
                  Uses kanji
                </Text>
                <Button
                  title={`${card.kanji.character} · ${card.kanji.meaning}`}
                  variant="outline"
                  onPress={() =>
                    navigation.navigate('CardPreview', { type: 'kanji', kanjiId: card.kanji.id })
                  }
                  fullWidth
                />
              </View>
            </Card>
          </ScrollView>
        )
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
    gap: spacing.md,
  },
  detailScroll: {
    paddingVertical: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  detailCard: {
    gap: spacing.md,
  },
  detailHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  detailKanji: {
    fontSize: 96,
    lineHeight: 110,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  detailMeaning: {
    fontFamily: 'BeVietnamPro_700Bold',
    fontSize: 28,
    textAlign: 'center',
  },
  detailRomaji: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    textAlign: 'center',
  },
  detailVocabWord: {
    fontSize: 52,
    lineHeight: 64,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  detailReading: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    textAlign: 'center',
  },
  parentKanjiBox: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  parentKanjiLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    letterSpacing: 0.24,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  readings: {
    gap: 6,
  },
  readingLine: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    textAlign: 'center',
  },
  exampleBox: {
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: 12,
    width: '100%',
    gap: 6,
  },
  example: {
    fontFamily: 'NotoSerifJP_400Regular',
    fontSize: 18,
    textAlign: 'center',
  },
  exampleMeaning: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    textAlign: 'center',
  },
});
