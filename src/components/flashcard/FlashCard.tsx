import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Button } from '../ui/Button';
import { useTheme } from '../../context/ThemeContext';
import { KanjiWithProgress } from '../../types';
import { radius, spacing } from '../../theme';
import { useSettingsStore } from '../../stores/settingsStore';

interface FlashCardProps {
  kanji: KanjiWithProgress;
  isFlipped: boolean;
  onFlip: () => void;
}

export function FlashCard({ kanji, isFlipped, onFlip }: FlashCardProps) {
  const { colors, typography, fontScale, scaledFontSize } = useTheme();
  const showRomaji = useSettingsStore((s) => s.showRomaji);
  const kanjiSize = scaledFontSize(typography.displayKanji.fontSize, fontScale);

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
        {!isFlipped ? (
          <Animated.View
            key="front"
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(150)}
            style={styles.face}
          >
            <Text
              style={[
                styles.kanji,
                {
                  fontFamily: typography.displayKanji.fontFamily,
                  fontSize: kanjiSize,
                  lineHeight: kanjiSize * 1.2,
                  color: colors.onSurface,
                  letterSpacing: typography.displayKanji.letterSpacing,
                },
              ]}
            >
              {kanji.character}
            </Text>
          </Animated.View>
        ) : (
          <Animated.View
            key="back"
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(150)}
            style={styles.face}
          >
            <Text style={[styles.meaning, { color: colors.onSurface }]}>{kanji.meaning}</Text>
            {showRomaji && (
              <Text style={[styles.romaji, { color: colors.primary }]}>{kanji.romaji}</Text>
            )}
            {kanji.onyomi ? (
              <Text style={[styles.reading, { color: colors.onSurfaceVariant }]}>
                On: {kanji.onyomi}
              </Text>
            ) : null}
            {kanji.kunyomi ? (
              <Text style={[styles.reading, { color: colors.onSurfaceVariant }]}>
                Kun: {kanji.kunyomi}
              </Text>
            ) : null}
            {kanji.example ? (
              <View style={[styles.exampleBox, { backgroundColor: colors.surfaceContainer }]}>
                <Text style={[styles.example, { color: colors.onSurface }]}>{kanji.example}</Text>
                {kanji.exampleMeaning ? (
                  <Text style={[styles.exampleMeaning, { color: colors.onSurfaceVariant }]}>
                    {kanji.exampleMeaning}
                  </Text>
                ) : null}
              </View>
            ) : null}
          </Animated.View>
        )}

        <View style={styles.footer}>
          <Button
            title={isFlipped ? 'Show Kanji' : 'Reveal Answer'}
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
    paddingBottom: spacing.sm,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  kanji: {
    textAlign: 'center',
  },
  meaning: {
    fontFamily: 'BeVietnamPro_700Bold',
    fontSize: 28,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  romaji: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    marginBottom: spacing.md,
  },
  reading: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    marginBottom: spacing.xs,
  },
  exampleBox: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    width: '100%',
  },
  example: {
    fontFamily: 'NotoSerifJP_400Regular',
    fontSize: 18,
    textAlign: 'center',
  },
  exampleMeaning: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});
