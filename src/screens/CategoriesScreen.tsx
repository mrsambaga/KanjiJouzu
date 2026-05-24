import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../components/ui/Card';
import { ProgressRing } from '../components/ui/ProgressRing';
import { Tag } from '../components/ui/Tag';
import { useTheme } from '../context/ThemeContext';
import { getDeckStats } from '../services/progressService';
import { getCustomDecks } from '../services/deckService';
import { prepareStudySession } from '../services/studyService';
import { useStudyStore } from '../stores/studyStore';
import { DeckStats, CustomDeck, JlptLevel } from '../types';
import { RootStackParamList } from '../navigation/types';
import { spacing, radius } from '../theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface LevelCardProps {
  level: JlptLevel;
  stats: DeckStats;
  onStudy: () => void;
}

function LevelCard({ level, stats, onStudy }: LevelCardProps) {
  const { colors } = useTheme();

  return (
    <Card onPress={onStudy} style={styles.levelCard}>
      <View style={styles.levelHeader}>
        <Tag label={level} variant="primary" />
        <ProgressRing progress={stats.progressPercent / 100} size={56} strokeWidth={5} />
      </View>
      <Text style={[styles.levelTitle, { color: colors.onSurface }]}>JLPT {level}</Text>
      <Text style={[styles.levelMeta, { color: colors.onSurfaceVariant }]}>
        {stats.mastered} mastered · {stats.total} total
      </Text>
    </Card>
  );
}

export function CategoriesScreen() {
  const { colors, typography } = useTheme();
  const navigation = useNavigation<Nav>();
  const startSession = useStudyStore((s) => s.startSession);

  const [n5Stats, setN5Stats] = useState<DeckStats | null>(null);
  const [n4Stats, setN4Stats] = useState<DeckStats | null>(null);
  const [decks, setDecks] = useState<CustomDeck[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const [n5, n4, customDecks] = await Promise.all([
      getDeckStats({ type: 'jlpt', level: 'N5' }),
      getDeckStats({ type: 'jlpt', level: 'N4' }),
      getCustomDecks(),
    ]);
    setN5Stats(n5);
    setN4Stats(n4);
    setDecks(customDecks);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const startLevel = async (level: JlptLevel) => {
    const source = { type: 'jlpt' as const, level };
    const session = await prepareStudySession(source);
    if (!session) return;
    startSession(source, session.queue, session.startIndex);
    navigation.navigate('Study');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <Text style={[typography.headlineLg, { color: colors.onBackground }]}>Categories</Text>
        <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
          Choose a JLPT level or custom deck to study
        </Text>

        {n5Stats && <LevelCard level="N5" stats={n5Stats} onStudy={() => startLevel('N5')} />}
        {n4Stats && <LevelCard level="N4" stats={n4Stats} onStudy={() => startLevel('N4')} />}

        <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Custom Decks</Text>
        {decks.length === 0 ? (
          <Card style={styles.emptyDeck}>
            <Text style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
              No custom decks yet. Create one in the Decks tab.
            </Text>
          </Card>
        ) : (
          decks.map((deck) => (
            <DeckRow
              key={deck.id}
              deck={deck}
              onPress={async () => {
                const source = { type: 'custom' as const, deckId: deck.id };
                const session = await prepareStudySession(source);
                if (!session) return;
                startSession(source, session.queue, session.startIndex);
                navigation.navigate('Study');
              }}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function DeckRow({ deck, onPress }: { deck: CustomDeck; onPress: () => void }) {
  const { colors } = useTheme();
  const [stats, setStats] = useState<DeckStats | null>(null);

  React.useEffect(() => {
    getDeckStats({ type: 'custom', deckId: deck.id }).then(setStats);
  }, [deck.id]);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.deckRow,
        { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.outlineVariant },
        pressed && { opacity: 0.9 },
      ]}
    >
      <View style={styles.deckInfo}>
        <Text style={[styles.deckName, { color: colors.onSurface }]}>{deck.name}</Text>
        <Text style={[styles.deckMeta, { color: colors.onSurfaceVariant }]}>
          {deck.kanjiIds.length} kanji
          {stats ? ` · ${stats.progressPercent}% mastered` : ''}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.onSurfaceVariant} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    padding: spacing.containerPadding,
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    marginBottom: spacing.sm,
  },
  levelCard: {
    gap: spacing.sm,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  levelTitle: {
    fontFamily: 'BeVietnamPro_700Bold',
    fontSize: 22,
  },
  levelMeta: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
  },
  sectionTitle: {
    fontFamily: 'BeVietnamPro_600SemiBold',
    fontSize: 18,
    marginTop: spacing.md,
  },
  emptyDeck: {
    alignItems: 'center',
    padding: spacing.lg,
  },
  emptyText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    textAlign: 'center',
  },
  deckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  deckInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  deckName: {
    fontFamily: 'BeVietnamPro_600SemiBold',
    fontSize: 16,
  },
  deckMeta: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
  },
});
