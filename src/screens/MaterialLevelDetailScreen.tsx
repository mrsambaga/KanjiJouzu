import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ProgressRing } from '../components/ui/ProgressRing';
import { Tag } from '../components/ui/Tag';
import { useTheme } from '../context/ThemeContext';
import { ensureMaterialSeeded } from '../db/database';
import {
  getGrammarForLevel,
  getGrammarStats,
  getMainVocabularyForLevel,
  getMainVocabularyStats,
  partOfSpeechLabel,
} from '../services/materialService';
import { prepareStudySession } from '../services/studyService';
import { useStudyStore } from '../stores/studyStore';
import { DeckStats, GrammarWithProgress, JlptLevel, LevelContentType, MainVocabularyWithProgress } from '../types';
import { RootStackParamList } from '../navigation/types';
import { spacing, radius } from '../theme';

type Route = RouteProp<RootStackParamList, 'MaterialLevelDetail'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

function contentTitle(level: JlptLevel, contentType: LevelContentType): string {
  if (contentType === 'vocabulary') return `JLPT ${level} Vocabulary`;
  return `JLPT ${level} Grammar`;
}

export function MaterialLevelDetailScreen() {
  const { colors, typography } = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { level, contentType } = route.params;
  const startSession = useStudyStore((s) => s.startSession);

  const [stats, setStats] = useState<DeckStats | null>(null);
  const [items, setItems] = useState<(MainVocabularyWithProgress | GrammarWithProgress)[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    await ensureMaterialSeeded();
    if (contentType === 'vocabulary') {
      const [deckStats, list] = await Promise.all([
        getMainVocabularyStats(level),
        getMainVocabularyForLevel(level),
      ]);
      setStats(deckStats);
      setItems(list);
    } else {
      const [deckStats, list] = await Promise.all([
        getGrammarStats(level),
        getGrammarForLevel(level),
      ]);
      setStats(deckStats);
      setItems(list);
    }
    setLoading(false);
  }, [level, contentType]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadData();
    }, [loadData]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const launchStudy = async () => {
    const source =
      contentType === 'vocabulary'
        ? ({ type: 'jlpt-vocab', level } as const)
        : ({ type: 'jlpt-grammar', level } as const);
    const session = await prepareStudySession(source);
    if (!session) return;
    startSession(source, session.queue, session.startIndex);
    navigation.navigate('Study');
  };

  const openPreview = (id: number) => {
    navigation.navigate('MaterialPreview', {
      type: contentType === 'vocabulary' ? 'main-vocabulary' : 'grammar',
      id,
    });
  };

  if (loading && !stats) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {stats && (
          <Card style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <View>
                <Tag label={level} variant="primary" />
                <Text style={[typography.headlineLg, { color: colors.onSurface, marginTop: spacing.sm }]}>
                  {contentTitle(level, contentType)}
                </Text>
              </View>
              <ProgressRing progress={stats.progressPercent / 100} size={72} strokeWidth={6} />
            </View>
            <Text style={[styles.progressMeta, { color: colors.onSurfaceVariant }]}>
              {stats.studied} studied · {stats.total} total · {stats.progressPercent}%
            </Text>
          </Card>
        )}

        <Button title="Study all" onPress={launchStudy} fullWidth />

        <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>List</Text>
        <Text style={[styles.sectionHint, { color: colors.onSurfaceVariant }]}>
          Tap an item to preview. Front shows the prompt; back shows an example.
        </Text>

        {items.map((item) => {
          const status = item.progress?.status ?? 'new';
          const isVocab = contentType === 'vocabulary';
          const vocab = isVocab ? (item as MainVocabularyWithProgress) : null;
          const grammar = !isVocab ? (item as GrammarWithProgress) : null;

          return (
            <Pressable
              key={item.id}
              onPress={() => openPreview(item.id)}
              style={({ pressed }) => [
                styles.row,
                {
                  backgroundColor: colors.surfaceContainerLowest,
                  borderColor: colors.outlineVariant,
                },
                pressed && { opacity: 0.9 },
              ]}
            >
              <View style={styles.rowMain}>
                <Text
                  style={[
                    styles.rowTitle,
                    {
                      color: colors.onSurface,
                      fontFamily: isVocab ? typography.displayKanji.fontFamily : undefined,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {isVocab ? vocab!.word : grammar!.pattern}
                </Text>
                <Text style={[styles.rowSub, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
                  {isVocab ? `${vocab!.reading} · ${vocab!.meaning}` : grammar!.summary}
                </Text>
                <View style={styles.rowTags}>
                  <Tag
                    label={partOfSpeechLabel(isVocab ? vocab!.partOfSpeech : grammar!.category)}
                  />
                  <Tag label={status} variant={status === 'difficult' ? 'warning' : 'default'} />
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.onSurfaceVariant} />
            </Pressable>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: {
    padding: spacing.containerPadding,
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  progressCard: { gap: spacing.sm },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressMeta: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
  },
  sectionTitle: {
    fontFamily: 'BeVietnamPro_600SemiBold',
    fontSize: 18,
    marginTop: spacing.sm,
  },
  sectionHint: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
  },
  rowMain: { flex: 1, gap: 4 },
  rowTitle: {
    fontFamily: 'BeVietnamPro_600SemiBold',
    fontSize: 18,
  },
  rowSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
  },
  rowTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: 4,
  },
});
