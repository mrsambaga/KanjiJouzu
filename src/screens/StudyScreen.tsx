import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SwipeableFlashCard } from '../components/flashcard/SwipeableFlashCard';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Button } from '../components/ui/Button';
import { useTheme } from '../context/ThemeContext';
import { useStudyStore } from '../stores/studyStore';
import { recordReview, recordVocabularyReview } from '../services/progressService';
import {
  recordGrammarReview,
  recordMainVocabularyReview,
} from '../services/materialProgressService';
import { recordCustomCardReview } from '../services/customCardService';
import { RootStackParamList } from '../navigation/types';
import { spacing, radius } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { useSettingsStore } from '../stores/settingsStore';

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

  const showRomaji = useSettingsStore((s) => s.showRomaji);
  const showFurigana = useSettingsStore((s) => s.showFurigana);
  const setShowRomaji = useSettingsStore((s) => s.setShowRomaji);
  const setShowFurigana = useSettingsStore((s) => s.setShowFurigana);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const current = queue[currentIndex];
  const deckProgress = queue.length > 0 ? (currentIndex + 1) / queue.length : 0;
  const sessionComplete = !isActive && sessionTotal > 0 && queue.length > 0;
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
      if (current.type === 'kanji') {
        await recordReview(current.kanji.id, remembered ? 'remembered' : 'difficult');
      } else if (current.type === 'vocabulary') {
        await recordVocabularyReview(
          current.vocabulary.id,
          remembered ? 'remembered' : 'difficult',
        );
      } else if (current.type === 'main-vocabulary') {
        await recordMainVocabularyReview(
          current.item.id,
          remembered ? 'remembered' : 'difficult',
        );
      } else if (current.type === 'custom-card') {
        await recordCustomCardReview(current.card.id, remembered ? 'remembered' : 'difficult');
      } else {
        await recordGrammarReview(current.item.id, remembered ? 'remembered' : 'difficult');
      }
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
        <View style={styles.headerRow}>
          <Text style={[styles.counter, { color: colors.onSurfaceVariant }]}>
            {currentIndex + 1} / {queue.length}
          </Text>
          <Pressable onPress={() => setSettingsOpen(true)} hitSlop={12} style={styles.gearBtn}>
            <Ionicons name="settings-outline" size={20} color={colors.onSurfaceVariant} />
          </Pressable>
        </View>
        <ProgressBar progress={deckProgress} height={6} />
      </View>

      <Modal
        visible={settingsOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setSettingsOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setSettingsOpen(false)}>
          <Pressable
            style={[styles.popover, { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.outlineVariant }]}
            onPress={() => {}}
          >
            <Text style={[styles.popoverTitle, { color: colors.onSurface }]}>Card Display</Text>

            <Pressable style={styles.toggleRow} onPress={() => setShowFurigana(!showFurigana)}>
              <View style={styles.toggleLabel}>
                <Ionicons name="text-outline" size={18} color={colors.onSurfaceVariant} />
                <Text style={[styles.toggleText, { color: colors.onSurface }]}>Show Furigana</Text>
              </View>
              <View style={[
                styles.pill,
                { backgroundColor: showFurigana ? colors.primary : colors.surfaceContainerHigh },
              ]}>
                <View style={[
                  styles.pillThumb,
                  { backgroundColor: colors.onPrimary },
                  showFurigana ? styles.pillThumbOn : styles.pillThumbOff,
                ]} />
              </View>
            </Pressable>

            <View style={[styles.divider, { backgroundColor: colors.outlineVariant }]} />

            <Pressable style={styles.toggleRow} onPress={() => setShowRomaji(!showRomaji)}>
              <View style={styles.toggleLabel}>
                <Ionicons name="language-outline" size={18} color={colors.onSurfaceVariant} />
                <Text style={[styles.toggleText, { color: colors.onSurface }]}>Show Romaji</Text>
              </View>
              <View style={[
                styles.pill,
                { backgroundColor: showRomaji ? colors.primary : colors.surfaceContainerHigh },
              ]}>
                <View style={[
                  styles.pillThumb,
                  { backgroundColor: colors.onPrimary },
                  showRomaji ? styles.pillThumbOn : styles.pillThumbOff,
                ]} />
              </View>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <View style={styles.cardArea}>
        {current && (
          <SwipeableFlashCard
            key={
              current.type === 'kanji'
                ? `k-${current.kanji.id}`
                : current.type === 'vocabulary'
                  ? `v-${current.vocabulary.id}`
                  : current.type === 'main-vocabulary'
                    ? `mv-${current.item.id}`
                    : current.type === 'custom-card'
                      ? `cc-${current.card.id}`
                      : `g-${current.item.id}`
            }
            card={current}
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counter: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    textAlign: 'center',
    flex: 1,
  },
  gearBtn: {
    position: 'absolute',
    right: 0,
  },
  // Modal / popover
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 80,
    paddingRight: spacing.containerPadding,
  },
  popover: {
    width: 240,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  popoverTitle: {
    fontFamily: 'BeVietnamPro_600SemiBold',
    fontSize: 14,
    marginBottom: spacing.xs,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  toggleLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  toggleText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
  },
  divider: {
    height: 1,
    marginVertical: spacing.xs,
  },
  pill: {
    width: 44,
    height: 26,
    borderRadius: radius.full,
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  pillThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  pillThumbOn: {
    alignSelf: 'flex-end',
  },
  pillThumbOff: {
    alignSelf: 'flex-start',
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
