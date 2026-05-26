import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ProgressRing } from '../components/ui/ProgressRing';
import { Tag } from '../components/ui/Tag';
import { useTheme } from '../context/ThemeContext';
import { getStudyStreak } from '../services/statsService';
import {
  getDailyGoalProgress,
  getDifficultStudyCardCount,
  prepareStudySession,
} from '../services/studyService';
import { getRecentlyStudied } from '../services/progressService';
import { getDeckStats } from '../services/progressService';
import { useStudyStore } from '../stores/studyStore';
import { DeckStats, KanjiWithProgress } from '../types';
import { RootStackParamList } from '../navigation/types';
import { spacing } from '../theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function HomeScreen() {
  const { colors, typography } = useTheme();
  const navigation = useNavigation<Nav>();
  const startSession = useStudyStore((s) => s.startSession);

  const [streak, setStreak] = useState(0);
  const [dailyStudied, setDailyStudied] = useState(0);
  const [dailyGoal] = useState(20);
  const [deckStats, setDeckStats] = useState<DeckStats | null>(null);
  const [difficultCardCount, setDifficultCardCount] = useState(0);
  const [recent, setRecent] = useState<KanjiWithProgress[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const [streakVal, daily, stats, recentKanji, difficultCount] = await Promise.all([
      getStudyStreak(),
      getDailyGoalProgress(),
      getDeckStats({ type: 'all' }),
      getRecentlyStudied(5),
      getDifficultStudyCardCount({ type: 'all' }),
    ]);
    setStreak(streakVal);
    setDailyStudied(daily.studied);
    setDeckStats(stats);
    setRecent(recentKanji);
    setDifficultCardCount(difficultCount);
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

  const launchStudy = async (source: Parameters<typeof prepareStudySession>[0]) => {
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
        <Text style={[typography.headlineLg, { color: colors.onBackground }]}>Kanji Jouzu</Text>

        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Ionicons name="flame" size={28} color={colors.primary} />
            <Text style={[styles.statValue, { color: colors.onSurface }]}>{streak}</Text>
            <Text style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>Day streak</Text>
          </Card>
          <Card style={styles.statCard}>
            <ProgressRing
              progress={dailyStudied / dailyGoal}
              size={72}
              label={`${dailyStudied}/${dailyGoal}`}
            />
            <Text style={[styles.statLabel, { color: colors.onSurfaceVariant, marginTop: spacing.sm }]}>
              Daily goal
            </Text>
          </Card>
          <Card style={styles.statCard}>
            <ProgressRing progress={(deckStats?.progressPercent ?? 0) / 100} size={72} />
            <Text style={[styles.statLabel, { color: colors.onSurfaceVariant, marginTop: spacing.sm }]}>
              Studied
            </Text>
            {deckStats ? (
              <Text style={[styles.statSubLabel, { color: colors.onSurfaceVariant }]}>
                {deckStats.studied}/{deckStats.total}
              </Text>
            ) : null}
          </Card>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Quick Actions</Text>
        <View style={styles.actions}>
          <Button title="Study N5" onPress={() => launchStudy({ type: 'jlpt', level: 'N5' })} fullWidth />
          <Button title="Study N4" onPress={() => launchStudy({ type: 'jlpt', level: 'N4' })} fullWidth />
          <Button
            title={`Review Difficult (${difficultCardCount})`}
            variant="warning"
            onPress={() => launchStudy({ type: 'difficult' })}
            disabled={difficultCardCount === 0}
            fullWidth
          />
          <Button
            title="Continue"
            variant="outline"
            onPress={() => launchStudy({ type: 'continue' })}
            fullWidth
          />
        </View>

        {recent.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Recently Studied</Text>
            <View style={styles.recentList}>
              {recent.map((k) => (
                <Card key={k.id} style={styles.recentItem}>
                  <Text style={[styles.recentKanji, { color: colors.onSurface }]}>{k.character}</Text>
                  <View style={styles.recentMeta}>
                    <Text style={[styles.recentMeaning, { color: colors.onSurfaceVariant }]}>
                      {k.meaning}
                    </Text>
                    {k.progress?.status && (
                      <Tag
                        label={k.progress.status}
                        variant={k.progress.status === 'mastered' ? 'success' : 'default'}
                      />
                    )}
                  </View>
                </Card>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    padding: spacing.containerPadding,
    gap: spacing.lg,
    paddingBottom: spacing.xl,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
  },
  statValue: {
    fontFamily: 'BeVietnamPro_700Bold',
    fontSize: 28,
    marginTop: spacing.xs,
  },
  statLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    textAlign: 'center',
  },
  statSubLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 2,
  },
  sectionTitle: {
    fontFamily: 'BeVietnamPro_600SemiBold',
    fontSize: 18,
  },
  actions: {
    gap: spacing.sm,
  },
  recentList: {
    gap: spacing.sm,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  recentKanji: {
    fontFamily: 'NotoSerifJP_400Regular',
    fontSize: 32,
    width: 48,
    textAlign: 'center',
  },
  recentMeta: {
    flex: 1,
    gap: spacing.xs,
  },
  recentMeaning: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
  },
});
