import React from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
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
  const rotation = useSharedValue(0);

  React.useEffect(() => {
    rotation.value = withTiming(isFlipped ? 180 : 0, { duration: 400 });
  }, [isFlipped, rotation]);

  const frontStyle = useAnimatedStyle(() => ({
    transform: [{ rotateY: `${rotation.value}deg` }],
    opacity: interpolate(rotation.value, [0, 90, 180], [1, 0, 0]),
  }));

  const backStyle = useAnimatedStyle(() => ({
    transform: [{ rotateY: `${rotation.value - 180}deg` }],
    opacity: interpolate(rotation.value, [0, 90, 180], [0, 0, 1]),
  }));

  const kanjiSize = scaledFontSize(typography.displayKanji.fontSize, fontScale);

  return (
    <Pressable onPress={onFlip} style={styles.wrapper}>
      <View style={[styles.card, { borderColor: colors.outlineVariant, backgroundColor: colors.surfaceContainerLowest }]}>
        <Animated.View style={[styles.face, frontStyle]}>
          <Text
            style={[
              styles.kanji,
              {
                fontFamily: typography.displayKanji.fontFamily,
                fontSize: kanjiSize,
                color: colors.onSurface,
                letterSpacing: typography.displayKanji.letterSpacing,
              },
            ]}
          >
            {kanji.character}
          </Text>
          <Text style={[styles.hint, { color: colors.onSurfaceVariant }]}>
            Tap to reveal
          </Text>
        </Animated.View>

        <Animated.View style={[styles.face, styles.back, backStyle]}>
          <Text style={[styles.meaning, { color: colors.onSurface }]}>{kanji.meaning}</Text>
          {showRomaji && (
            <Text style={[styles.romaji, { color: colors.primary }]}>{kanji.romaji}</Text>
          )}
          {kanji.onyomi && (
            <Text style={[styles.reading, { color: colors.onSurfaceVariant }]}>
              On: {kanji.onyomi}
            </Text>
          )}
          {kanji.kunyomi && (
            <Text style={[styles.reading, { color: colors.onSurfaceVariant }]}>
              Kun: {kanji.kunyomi}
            </Text>
          )}
          {kanji.example && (
            <View style={[styles.exampleBox, { backgroundColor: colors.surfaceContainer }]}>
              <Text style={[styles.example, { color: colors.onSurface }]}>{kanji.example}</Text>
              {kanji.exampleMeaning && (
                <Text style={[styles.exampleMeaning, { color: colors.onSurfaceVariant }]}>
                  {kanji.exampleMeaning}
                </Text>
              )}
            </View>
          )}
        </Animated.View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    maxWidth: 340,
    alignSelf: 'center',
  },
  card: {
    minHeight: 320,
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    overflow: 'hidden',
  },
  face: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    backfaceVisibility: 'hidden',
  },
  back: {
    transform: [{ rotateY: '180deg' }],
  },
  kanji: {
    textAlign: 'center',
  },
  hint: {
    position: 'absolute',
    bottom: spacing.lg,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
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
