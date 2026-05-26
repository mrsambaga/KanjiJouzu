import React from 'react';
import { Pressable, Text, View, StyleSheet, StyleProp, TextStyle } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Button } from '../ui/Button';
import { useTheme } from '../../context/ThemeContext';
import { KanjiWithProgress, StudyCard } from '../../types';
import { radius, spacing } from '../../theme';
import { useSettingsStore } from '../../stores/settingsStore';

interface FlashCardProps {
  card: StudyCard;
  isFlipped: boolean;
  onFlip: () => void;
  mode?: 'study' | 'preview';
}

function RomajiText({
  romaji,
  style,
}: {
  romaji: string | undefined;
  style: StyleProp<TextStyle>;
}) {
  const trimmed = romaji?.trim();
  if (!trimmed) return null;
  return <Text style={style}>{trimmed}</Text>;
}

export function FlashCard({ card, isFlipped, onFlip, mode = 'study' }: FlashCardProps) {
  const { colors, typography, fontScale, scaledFontSize } = useTheme();
  const showRomaji = useSettingsStore((s) => s.showRomaji);
  const kanjiSize = scaledFontSize(typography.displayKanji.fontSize, fontScale);
  const isPreview = mode === 'preview';
  const romajiStyle = [styles.romaji, { color: colors.primary }];
  const romajiMutedStyle = [styles.romaji, { color: colors.onSurfaceVariant }];

  const cardShell = (face: React.ReactNode) => (
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
      {isPreview ? (
        <Text style={[styles.previewHint, { color: colors.onSurfaceVariant }]}>
          {isFlipped ? 'Tap to show front' : 'Tap to reveal answer'}
        </Text>
      ) : null}
      {!isPreview ? (
        <View style={styles.footer}>
          <Button
            title={
              card.type === 'vocabulary'
                ? isFlipped
                  ? 'Show Word'
                  : 'Reveal Answer'
                : isFlipped
                  ? 'Show Kanji'
                  : 'Reveal Answer'
            }
            variant={isFlipped ? 'outline' : 'primary'}
            onPress={onFlip}
            fullWidth
          />
        </View>
      ) : null}
    </View>
  );

  const wrapPreview = (content: React.ReactNode) => {
    if (!isPreview) return content;
    return (
      <Pressable onPress={onFlip} style={styles.previewPressable}>
        {content}
      </Pressable>
    );
  };

  if (card.type === 'vocabulary') {
    const { vocabulary } = card;
    const face = !isFlipped ? (
      <Animated.View
        key="vocab-front"
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(150)}
        style={styles.face}
      >
        <Text style={[styles.vocabLabel, { color: colors.onSurfaceVariant }]}>
          Vocabulary · {card.kanji.character}
        </Text>
        <Text
          style={[
            styles.vocabWord,
            {
              fontFamily: typography.displayKanji.fontFamily,
              color: colors.onSurface,
            },
          ]}
        >
          {vocabulary.word}
        </Text>
      </Animated.View>
    ) : (
      <Animated.View
        key="vocab-back"
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(150)}
        style={styles.face}
      >
        <Text style={[styles.meaning, { color: colors.onSurface }]}>{vocabulary.meaning}</Text>
        <Text style={[styles.reading, { color: colors.primary }]}>{vocabulary.reading}</Text>
        {showRomaji ? (
          <RomajiText romaji={vocabulary.romaji} style={romajiMutedStyle} />
        ) : null}
      </Animated.View>
    );

    return (
      <View style={styles.wrapper}>
        {wrapPreview(cardShell(face))}
      </View>
    );
  }

  const kanji: KanjiWithProgress = card.kanji;
  const face = !isFlipped ? (
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
      {showRomaji ? <RomajiText romaji={kanji.romaji} style={romajiStyle} /> : null}
      {kanji.onyomi ? (
        <Text style={[styles.reading, { color: colors.onSurfaceVariant }]}>On: {kanji.onyomi}</Text>
      ) : null}
      {kanji.kunyomi ? (
        <Text style={[styles.reading, { color: colors.onSurfaceVariant }]}>Kun: {kanji.kunyomi}</Text>
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
  );

  return (
    <View style={styles.wrapper}>
      {wrapPreview(cardShell(face))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    maxWidth: 340,
    alignSelf: 'center',
  },
  previewPressable: {
    width: '100%',
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
  previewHint: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    textAlign: 'center',
    paddingBottom: spacing.md,
  },
  kanji: {
    textAlign: 'center',
  },
  vocabLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    marginBottom: spacing.sm,
  },
  vocabWord: {
    fontSize: 42,
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
