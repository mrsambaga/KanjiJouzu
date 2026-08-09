import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Button } from '../ui/Button';
import { useTheme } from '../../context/ThemeContext';
import { CustomCardWithProgress } from '../../types';
import { radius, spacing } from '../../theme';
import { useSettingsStore } from '../../stores/settingsStore';

interface CustomFlashCardProps {
  card: CustomCardWithProgress;
  isFlipped: boolean;
  onFlip: () => void;
}

export function CustomFlashCard({ card, isFlipped, onFlip }: CustomFlashCardProps) {
  const { colors } = useTheme();
  const showRomaji = useSettingsStore((s) => s.showRomaji);

  const face = !isFlipped ? (
    <Animated.View
      key="front"
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(150)}
      style={styles.face}
    >
      <Text selectable style={[styles.front, { color: colors.onSurface }]}>{card.front}</Text>
      {card.reading ? (
        <Text selectable style={[styles.reading, { color: colors.primary }]}>{card.reading}</Text>
      ) : null}
      {showRomaji && card.romaji ? (
        <Text selectable style={[styles.romaji, { color: colors.onSurfaceVariant }]}>{card.romaji}</Text>
      ) : null}
    </Animated.View>
  ) : (
    <Animated.View
      key="back"
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(150)}
      style={styles.face}
    >
      <Text selectable style={[styles.meaning, { color: colors.onSurface }]}>{card.meaning}</Text>
      {card.example ? (
        <View style={[styles.exampleBox, { backgroundColor: colors.surfaceContainer }]}>
          <Text style={[styles.exampleLabel, { color: colors.onSurfaceVariant }]}>Example</Text>
          <Text selectable style={[styles.example, { color: colors.onSurface }]}>{card.example}</Text>
          {card.exampleMeaning ? (
            <Text selectable style={[styles.exampleMeaning, { color: colors.primary }]}>
              {card.exampleMeaning}
            </Text>
          ) : null}
        </View>
      ) : null}
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
            title={isFlipped ? 'Show Front' : 'Reveal Answer'}
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
  front: {
    fontFamily: 'NotoSerifJP_400Regular',
    fontSize: 52,
    textAlign: 'center',
    lineHeight: 64,
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
  meaning: {
    fontFamily: 'BeVietnamPro_700Bold',
    fontSize: 28,
    textAlign: 'center',
    lineHeight: 36,
  },
  exampleBox: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    width: '100%',
    alignItems: 'center',
    gap: spacing.xs,
  },
  exampleLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  example: {
    fontFamily: 'NotoSerifJP_400Regular',
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 28,
  },
  exampleMeaning: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
