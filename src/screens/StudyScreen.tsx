import React, { useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SwipeableFlashCard } from '../components/flashcard/SwipeableFlashCard';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Button } from '../components/ui/Button';
import { useTheme } from '../context/ThemeContext';
import { useStudyStore } from '../stores/studyStore';
import { recordReview } from '../services/progressService';
import { RootStackParamList } from '../navigation/types';
import { spacing } from '../theme';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Study'>;

export function StudyScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();

  const queue = useStudyStore((s) => s.queue);
  const currentIndex = useStudyStore((s) => s.currentIndex);
  const isActive = useStudyStore((s) => s.isActive);
  const showAnswer = useStudyStore((s) => s.showAnswer);
  const sessionCorrect = useStudyStore((s) => s.sessionCorrect);
  const sessionTotal = useStudyStore((s) => s.sessionTotal);
  const flipCard = useStudyStore((s) => s.flipCard);
  const recordSessionResult = useStudyStore((s) => s.recordSessionResult);
  const nextCard = useStudyStore((s) => s.nextCard);
  const navigateNext = useStudyStore((s) => s.navigateNext);
  const navigatePrevious = useStudyStore((s) => s.navigatePrevious);
  const endSession = useStudyStore((s) => s.endSession);

  const current = queue[currentIndex];
  const deckProgress = queue.length > 0 ? (currentIndex + 1) / queue.length : 0;
  const sessionComplete = !isActive && sessionTotal > 0;
  const canGoNext = currentIndex < queue.length - 1;
  const canGoPrevious = currentIndex > 0;

  React.useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', () => {
      endSession();
    });
    return unsubscribe;
  }, [navigation, endSession]);

  const handleResult = useCallback(
    async (remembered: boolean) => {
      if (!current) return;
      await recordReview(current.id, remembered ? 'remembered' : 'difficult');
      recordSessionResult(remembered);
      nextCard();
    },
    [current, recordSessionResult, nextCard],
  );

  const handleClose = () => {
    endSession();
    navigation.goBack();
  };

  if (queue.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.empty}>
          <Text style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
            No cards in this session.
          </Text>
          <Button title="Go Back" onPress={handleClose} />
        </View>
      </SafeAreaView>
    );
  }

  if (sessionComplete) {
    const accuracy = sessionTotal > 0 ? Math.round((sessionCorrect / sessionTotal) * 100) : 0;
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.summary}>
          <Text style={[styles.summaryTitle, { color: colors.onSurface }]}>Session Complete</Text>
          <Text style={[styles.summaryStat, { color: colors.primary }]}>
            {sessionTotal} cards reviewed
          </Text>
          <Text style={[styles.summaryStat, { color: colors.onSurfaceVariant }]}>
            {accuracy}% remembered
          </Text>
          <Button title="Done" onPress={handleClose} fullWidth />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.counter, { color: colors.onSurfaceVariant }]}>
          {currentIndex + 1} / {queue.length}
        </Text>
        <ProgressBar progress={deckProgress} height={6} />
      </View>

      <View style={styles.cardArea}>
        {current && (
          <SwipeableFlashCard
            key={current.id}
            kanji={current}
            isFlipped={showAnswer}
            onFlip={flipCard}
            onSwipeNext={navigateNext}
            onSwipePrevious={navigatePrevious}
            canGoNext={canGoNext}
            canGoPrevious={canGoPrevious}
          />
        )}
      </View>

      <Text style={[styles.swipeHint, { color: colors.onSurfaceVariant }]}>
        Swipe to browse · Use buttons to mark progress
      </Text>

      <View style={styles.actions}>
        <Button
          title="Difficult"
          variant="warning"
          onPress={() => handleResult(false)}
          style={styles.actionBtn}
        />
        <Button
          title="Remembered"
          onPress={() => handleResult(true)}
          style={styles.actionBtn}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.containerPadding,
  },
  header: {
    gap: spacing.sm,
    paddingTop: spacing.md,
  },
  counter: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    textAlign: 'center',
  },
  cardArea: {
    flex: 1,
    justifyContent: 'center',
  },
  swipeHint: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingBottom: spacing.lg,
  },
  actionBtn: {
    flex: 1,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  emptyText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
  },
  summary: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  summaryTitle: {
    fontFamily: 'BeVietnamPro_700Bold',
    fontSize: 28,
  },
  summaryStat: {
    fontFamily: 'Inter_400Regular',
    fontSize: 18,
  },
});
