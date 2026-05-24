import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Card } from '../components/ui/Card';
import { ProgressRing } from '../components/ui/ProgressRing';
import { useTheme } from '../context/ThemeContext';
import { getDailyActivity, getOverallStats, getStudyStreak } from '../services/statsService';
import { DailyActivity } from '../types';
import { spacing } from '../theme';

export function StatsScreen() {
  const { colors, typography } = useTheme();
  const [stats, setStats] = useState<Awaited<ReturnType<typeof getOverallStats>> | null>(null);
  const [streak, setStreak] = useState(0);
  const [activity, setActivity] = useState<DailyActivity[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const [overall, streakVal, daily] = await Promise.all([
      getOverallStats(),
      getStudyStreak(),
      getDailyActivity(7),
    ]);
    setStats(overall);
    setStreak(streakVal);
    setActivity(daily);
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

  const maxCards = Math.max(...activity.map((d) => d.cardsStudied), 1);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <Text style={[typography.headlineLg, { color: colors.onBackground }]}>Statistics</Text>

        <View style={styles.topRow}>
          <Card style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{streak}</Text>
            <Text style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>Day Streak</Text>
          </Card>
          {stats && (
            <Card style={styles.statCard}>
              <ProgressRing
                progress={stats.totalKanji > 0 ? stats.mastered / stats.totalKanji : 0}
                size={72}
              />
              <Text style={[styles.statLabel, { color: colors.onSurfaceVariant, marginTop: spacing.sm }]}>
                Mastered
              </Text>
            </Card>
          )}
        </View>

        {stats && (
          <Card style={styles.totalsCard}>
            <StatRow label="Total Kanji" value={stats.totalKanji} />
            <StatRow label="Studied" value={stats.studied} />
            <StatRow label="Mastered" value={stats.mastered} />
            <StatRow label="Difficult" value={stats.difficult} />
            <StatRow label="New" value={stats.newCount} />
            <StatRow label="Total Reviews" value={stats.totalReviews} />
          </Card>
        )}

        <Text style={[styles.chartTitle, { color: colors.onSurface }]}>Last 7 Days</Text>
        <Card style={styles.chartCard}>
          <View style={styles.chart}>
            {activity.map((day) => {
              const height = (day.cardsStudied / maxCards) * 120;
              const dayLabel = new Date(day.date + 'T12:00:00').toLocaleDateString(undefined, {
                weekday: 'short',
              });
              return (
                <View key={day.date} style={styles.barColumn}>
                  <View style={[styles.barTrack, { backgroundColor: colors.surfaceContainer }]}>
                    <View
                      style={[
                        styles.barFill,
                        { height: Math.max(height, day.cardsStudied > 0 ? 4 : 0), backgroundColor: colors.primary },
                      ]}
                    />
                  </View>
                  <Text style={[styles.barLabel, { color: colors.onSurfaceVariant }]}>{dayLabel}</Text>
                  <Text style={[styles.barCount, { color: colors.onSurface }]}>{day.cardsStudied}</Text>
                </View>
              );
            })}
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatRow({ label, value }: { label: string; value: number }) {
  const { colors } = useTheme();
  return (
    <View style={styles.statRow}>
      <Text style={[styles.rowLabel, { color: colors.onSurfaceVariant }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: colors.onSurface }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    padding: spacing.containerPadding,
    gap: spacing.lg,
    paddingBottom: spacing.xl,
  },
  topRow: {
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
    fontSize: 36,
  },
  statLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    textAlign: 'center',
  },
  totalsCard: {
    gap: spacing.sm,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
  },
  rowValue: {
    fontFamily: 'BeVietnamPro_600SemiBold',
    fontSize: 16,
  },
  chartTitle: {
    fontFamily: 'BeVietnamPro_600SemiBold',
    fontSize: 18,
  },
  chartCard: {
    paddingVertical: spacing.lg,
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 160,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  barTrack: {
    width: 24,
    height: 120,
    borderRadius: 12,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 12,
  },
  barLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
  },
  barCount: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
  },
});
