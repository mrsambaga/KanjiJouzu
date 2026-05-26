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
import { ensureVocabularySeeded } from '../db/database';
import { getDeckStats } from '../services/progressService';
import { getKanjiForLevel, prepareStudySession } from '../services/studyService';
import { getVocabularyByKanjiIds } from '../services/vocabularyService';
import { useStudyStore } from '../stores/studyStore';
import {
  DeckStats,
  JlptLevel,
  KanjiStatus,
  KanjiWithProgress,
  Vocabulary,
} from '../types';
import { RootStackParamList } from '../navigation/types';
import { spacing, radius } from '../theme';

type Route = RouteProp<RootStackParamList, 'LevelDetail'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

function statusTagVariant(status: KanjiStatus | undefined): 'default' | 'primary' | 'success' | 'warning' {
  switch (status) {
    case 'mastered':
      return 'success';
    case 'difficult':
      return 'warning';
    case 'studying':
      return 'primary';
    default:
      return 'default';
  }
}

function statusLabel(status: KanjiStatus | undefined): string {
  return status ?? 'new';
}

interface KanjiRowProps {
  kanji: KanjiWithProgress;
  vocabulary: Vocabulary[];
  expanded: boolean;
  onToggleExpand: () => void;
  onOpenKanji: () => void;
  onOpenVocabulary: (vocab: Vocabulary) => void;
}

function KanjiRow({
  kanji,
  vocabulary,
  expanded,
  onToggleExpand,
  onOpenKanji,
  onOpenVocabulary,
}: KanjiRowProps) {
  const { colors, typography } = useTheme();
  const status = kanji.progress?.status;

  return (
    <View
      style={[
        styles.kanjiRowWrap,
        { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.outlineVariant },
      ]}
    >
      <Pressable onPress={onOpenKanji} style={({ pressed }) => [styles.kanjiMain, pressed && { opacity: 0.85 }]}>
        <Text style={[styles.kanjiChar, { color: colors.onSurface, fontFamily: typography.displayKanji.fontFamily }]}>
          {kanji.character}
        </Text>
        <View style={styles.kanjiMeta}>
          <Text style={[styles.kanjiMeaning, { color: colors.onSurface }]} numberOfLines={1}>
            {kanji.meaning}
          </Text>
          <Tag label={statusLabel(status)} variant={statusTagVariant(status)} />
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.onSurfaceVariant} />
      </Pressable>

      {vocabulary.length > 0 ? (
        <Pressable
          onPress={onToggleExpand}
          style={({ pressed }) => [
            styles.vocabToggle,
            { borderTopColor: colors.outlineVariant },
            pressed && { opacity: 0.85 },
          ]}
        >
          <Text style={[styles.vocabToggleText, { color: colors.onSurfaceVariant }]}>
            {vocabulary.length} vocabulary
          </Text>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={colors.onSurfaceVariant}
          />
        </Pressable>
      ) : null}

      {expanded &&
        vocabulary.map((v) => (
          <Pressable
            key={v.id}
            onPress={() => onOpenVocabulary(v)}
            style={({ pressed }) => [
              styles.vocabRow,
              { borderTopColor: colors.outlineVariant },
              pressed && { backgroundColor: colors.surfaceContainer },
            ]}
          >
            <Text style={[styles.vocabWord, { color: colors.onSurface, fontFamily: typography.displayKanji.fontFamily }]}>
              {v.word}
            </Text>
            <Text style={[styles.vocabReading, { color: colors.primary }]}>{v.reading}</Text>
            <Text style={[styles.vocabMeaning, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
              {v.meaning}
            </Text>
          </Pressable>
        ))}
    </View>
  );
}

export function LevelDetailScreen() {
  const { colors, typography } = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { level } = route.params;
  const startSession = useStudyStore((s) => s.startSession);

  const [stats, setStats] = useState<DeckStats | null>(null);
  const [kanjiList, setKanjiList] = useState<KanjiWithProgress[]>([]);
  const [vocabByKanji, setVocabByKanji] = useState<Map<number, Vocabulary[]>>(new Map());
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    const [deckStats, kanji] = await Promise.all([
      getDeckStats({ type: 'jlpt', level }),
      getKanjiForLevel(level),
    ]);
    setStats(deckStats);
    setKanjiList(kanji);
    setLoading(false);
    const kanjiIds = kanji.map((k) => k.id);
    setVocabByKanji(await getVocabularyByKanjiIds(kanjiIds));
    ensureVocabularySeeded()
      .then(() => getVocabularyByKanjiIds(kanjiIds))
      .then(setVocabByKanji)
      .catch(() => {});
  }, [level]);

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

  const launchStudy = async (source: { type: 'jlpt'; level: JlptLevel } | { type: 'jlpt-difficult'; level: JlptLevel }) => {
    const session = await prepareStudySession(source);
    if (!session) return;
    startSession(source, session.queue, session.startIndex);
    navigation.navigate('Study');
  };

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (loading && !stats) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const difficultCount = stats?.difficult ?? 0;

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
                  JLPT {level}
                </Text>
              </View>
              <ProgressRing progress={stats.progressPercent / 100} size={72} strokeWidth={6} />
            </View>
            <Text style={[styles.progressMeta, { color: colors.onSurfaceVariant }]}>
              {stats.studied} studied · {stats.difficult} difficult · {stats.total} total ·{' '}
              {stats.progressPercent}%
            </Text>
          </Card>
        )}

        <View style={styles.actions}>
          <Button title="Study all" onPress={() => launchStudy({ type: 'jlpt', level })} fullWidth />
          <Button
            title={`Study difficult (${difficultCount} kanji)`}
            variant="outline"
            onPress={() => launchStudy({ type: 'jlpt-difficult', level })}
            disabled={difficultCount === 0}
            fullWidth
          />
        </View>

        <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Kanji list</Text>
        <Text style={[styles.sectionHint, { color: colors.onSurfaceVariant }]}>
          Tap a kanji or word to preview. Expand to see vocabulary.
        </Text>

        {kanjiList.map((kanji) => (
          <KanjiRow
            key={kanji.id}
            kanji={kanji}
            vocabulary={vocabByKanji.get(kanji.id) ?? []}
            expanded={expandedIds.has(kanji.id)}
            onToggleExpand={() => toggleExpand(kanji.id)}
            onOpenKanji={() => navigation.navigate('CardPreview', { type: 'kanji', kanjiId: kanji.id })}
            onOpenVocabulary={(v) =>
              navigation.navigate('CardPreview', {
                type: 'vocabulary',
                kanjiId: kanji.id,
                vocabularyId: v.id,
              })
            }
          />
        ))}
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
    alignItems: 'flex-start',
  },
  progressMeta: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
  },
  actions: { gap: spacing.sm },
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
  kanjiRowWrap: {
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  kanjiMain: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  kanjiChar: {
    fontSize: 32,
    width: 44,
    textAlign: 'center',
  },
  kanjiMeta: {
    flex: 1,
    gap: spacing.xs,
  },
  kanjiMeaning: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
  },
  vocabToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
  },
  vocabToggleText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
  },
  vocabRow: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    gap: 2,
  },
  vocabWord: {
    fontSize: 20,
  },
  vocabReading: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  vocabMeaning: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
  },
});
