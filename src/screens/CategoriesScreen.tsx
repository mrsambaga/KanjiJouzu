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
import { ensureMaterialSeeded } from '../db/database';
import { getDeckStats } from '../services/progressService';
import { getCustomDecks } from '../services/deckService';
import { getGrammarStats } from '../services/materialService';
import { DeckStats, CustomDeck, JlptLevel } from '../types';
import { RootStackParamList } from '../navigation/types';
import { spacing, radius } from '../theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface MaterialCardProps {
  level: JlptLevel;
  label: string;
  stats: DeckStats;
  onPress: () => void;
}

function MaterialCard({ level, label, stats, onPress }: MaterialCardProps) {
  const { colors } = useTheme();

  return (
    <Card onPress={onPress} style={styles.materialCard}>
      <View style={styles.materialHeader}>
        <View style={styles.materialTags}>
          <Tag label={level} variant="primary" />
          <Text style={[styles.materialLabel, { color: colors.onSurface }]}>{label}</Text>
        </View>
        <View style={styles.progressRing}>
          <ProgressRing progress={stats.progressPercent / 100} size={48} strokeWidth={4} />
        </View>
      </View>
      <Text style={[styles.materialMeta, { color: colors.onSurfaceVariant }]}>
        {stats.studied} studied · {stats.total} total
      </Text>
    </Card>
  );
}

export function CategoriesScreen() {
  const { colors, typography } = useTheme();
  const navigation = useNavigation<Nav>();

  const [n5Kanji, setN5Kanji] = useState<DeckStats | null>(null);
  const [n4Kanji, setN4Kanji] = useState<DeckStats | null>(null);
  const [n5Grammar, setN5Grammar] = useState<DeckStats | null>(null);
  const [n4Grammar, setN4Grammar] = useState<DeckStats | null>(null);
  const [decks, setDecks] = useState<CustomDeck[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    await ensureMaterialSeeded();
    const [n5k, n4k, n5g, n4g, customDecks] = await Promise.all([
      getDeckStats({ type: 'jlpt', level: 'N5' }),
      getDeckStats({ type: 'jlpt', level: 'N4' }),
      getGrammarStats('N5'),
      getGrammarStats('N4'),
      getCustomDecks(),
    ]);
    setN5Kanji(n5k);
    setN4Kanji(n4k);
    setN5Grammar(n5g);
    setN4Grammar(n4g);
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <Text style={[typography.headlineLg, { color: colors.onBackground }]}>Levels</Text>
        <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
          Kanji and grammar by JLPT level
        </Text>

        <Text style={[styles.groupTitle, { color: colors.onSurface }]}>N5</Text>
        {n5Kanji && (
          <MaterialCard
            level="N5"
            label="Kanji"
            stats={n5Kanji}
            onPress={() => navigation.navigate('LevelDetail', { level: 'N5' })}
          />
        )}
        {n5Grammar && (
          <MaterialCard
            level="N5"
            label="Grammar"
            stats={n5Grammar}
            onPress={() =>
              navigation.navigate('MaterialLevelDetail', { level: 'N5', contentType: 'grammar' })
            }
          />
        )}

        <Text style={[styles.groupTitle, { color: colors.onSurface }]}>N4</Text>
        {n4Kanji && (
          <MaterialCard
            level="N4"
            label="Kanji"
            stats={n4Kanji}
            onPress={() => navigation.navigate('LevelDetail', { level: 'N4' })}
          />
        )}
        {n4Grammar && (
          <MaterialCard
            level="N4"
            label="Grammar"
            stats={n4Grammar}
            onPress={() =>
              navigation.navigate('MaterialLevelDetail', { level: 'N4', contentType: 'grammar' })
            }
          />
        )}

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
              onPress={() => navigation.navigate('DeckDetail', { deckId: deck.id })}
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
          {stats ? ` · ${stats.progressPercent}% studied` : ''}
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
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    marginBottom: spacing.sm,
  },
  groupTitle: {
    fontFamily: 'BeVietnamPro_600SemiBold',
    fontSize: 16,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  materialCard: { gap: spacing.xs },
  materialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  materialTags: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  progressRing: {
    flexShrink: 0,
  },
  materialLabel: {
    fontFamily: 'BeVietnamPro_700Bold',
    fontSize: 20,
  },
  materialMeta: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
  },
  sectionTitle: {
    fontFamily: 'BeVietnamPro_600SemiBold',
    fontSize: 18,
    marginTop: spacing.lg,
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
