import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Button } from '../ui/Button';
import { Tag } from '../ui/Tag';
import { useTheme } from '../../context/ThemeContext';
import { StudyCard } from '../../types';
import { partOfSpeechLabel } from '../../services/materialService';
import { radius, spacing } from '../../theme';
import { useSettingsStore } from '../../stores/settingsStore';

interface ReviewFlashCardProps {
  card: Extract<StudyCard, { type: 'main-vocabulary' } | { type: 'grammar' }>;
  isFlipped: boolean;
  onFlip: () => void;
}

export function ReviewFlashCard({ card, isFlipped, onFlip }: ReviewFlashCardProps) {
  const { colors, typography } = useTheme();
  const showRomaji = useSettingsStore((s) => s.showRomaji);

  const face = !isFlipped ? (
    <Animated.View
      key="front"
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(150)}
      style={styles.face}
    >
      {card.type === 'main-vocabulary' ? (
        <>
          <Tag label={partOfSpeechLabel(card.item.partOfSpeech)} variant="primary" />
          <Text
            style={[
              styles.word,
              { fontFamily: typography.displayKanji.fontFamily, color: colors.onSurface },
            ]}
          >
            {card.item.word}
          </Text>
          <Text style={[styles.reading, { color: colors.primary }]}>{card.item.reading}</Text>
          {showRomaji ? (
            <Text style={[styles.romaji, { color: colors.onSurfaceVariant }]}>
              {card.item.romaji}
            </Text>
          ) : null}
          <Text style={[styles.summary, { color: colors.onSurface }]}>{card.item.meaning}</Text>
        </>
      ) : (
        <>
          <Tag label={partOfSpeechLabel(card.item.category)} variant="primary" />
          <Text style={[styles.pattern, { color: colors.onSurface }]}>{card.item.pattern}</Text>
          <Text style={[styles.summary, { color: colors.onSurfaceVariant }]}>
            {card.item.summary}
          </Text>
        </>
      )}
    </Animated.View>
  ) : (
    <Animated.View
      key="back"
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(150)}
      style={styles.face}
    >
      <Text style={[styles.exampleLabel, { color: colors.onSurfaceVariant }]}>Example</Text>
      <Text style={[styles.example, { color: colors.onSurface }]}>
        {card.type === 'main-vocabulary' ? card.item.example : card.item.example}
      </Text>
      <Text style={[styles.exampleMeaning, { color: colors.primary }]}>
        {card.type === 'main-vocabulary' ? card.item.exampleMeaning : card.item.exampleMeaning}
      </Text>
    </Animated.View>
  );

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.card,
          {
            borderColor: colors.outlineVariant,
            backgroundColor: colors.surfaceContainerLowest,
          },
        ]}
      >
        {face}
        <View style={styles.footer}>
          <Button
            title={isFlipped ? 'Show prompt' : 'Show example'}
            variant={isFlipped ? 'outline' : 'primary'}
            onPress={onFlip}
            fullWidth
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    maxWidth: 340,
    alignSelf: 'center',
  },
  card: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  face: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  word: {
    fontSize: 42,
    textAlign: 'center',
  },
  reading: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 20,
    textAlign: 'center',
  },
  romaji: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    textAlign: 'center',
  },
  pattern: {
    fontFamily: 'BeVietnamPro_700Bold',
    fontSize: 26,
    textAlign: 'center',
    lineHeight: 34,
  },
  summary: {
    fontFamily: 'Inter_400Regular',
    fontSize: 17,
    textAlign: 'center',
    lineHeight: 24,
    marginTop: spacing.sm,
  },
  exampleLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    letterSpacing: 0.24,
    textTransform: 'uppercase',
  },
  example: {
    fontFamily: 'NotoSerifJP_400Regular',
    fontSize: 22,
    textAlign: 'center',
    lineHeight: 32,
  },
  exampleMeaning: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});
