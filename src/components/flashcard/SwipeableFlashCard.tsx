import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { FlashCard } from './FlashCard';
import { KanjiWithProgress } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { spacing } from '../../theme';

const SWIPE_THRESHOLD = 120;

interface SwipeableFlashCardProps {
  kanji: KanjiWithProgress;
  isFlipped: boolean;
  onFlip: () => void;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
}

export function SwipeableFlashCard({
  kanji,
  isFlipped,
  onFlip,
  onSwipeLeft,
  onSwipeRight,
}: SwipeableFlashCardProps) {
  const { colors } = useTheme();
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const triggerHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleSwipeComplete = (direction: 'left' | 'right') => {
    triggerHaptic();
    if (direction === 'right') onSwipeRight();
    else onSwipeLeft();
  };

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY * 0.2;
    })
    .onEnd((e) => {
      if (e.translationX > SWIPE_THRESHOLD) {
        translateX.value = withTiming(400, { duration: 200 }, () => {
          runOnJS(handleSwipeComplete)('right');
          translateX.value = 0;
          translateY.value = 0;
        });
      } else if (e.translationX < -SWIPE_THRESHOLD) {
        translateX.value = withTiming(-400, { duration: 200 }, () => {
          runOnJS(handleSwipeComplete)('left');
          translateX.value = 0;
          translateY.value = 0;
        });
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    });

  const cardStyle = useAnimatedStyle(() => {
    const rotate = interpolate(translateX.value, [-200, 0, 200], [-12, 0, 12]);
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` },
      ],
    };
  });

  const leftOverlay = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-SWIPE_THRESHOLD, 0], [1, 0], 'clamp'),
  }));

  const rightOverlay = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0, 1], 'clamp'),
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.overlay, styles.leftOverlay, leftOverlay]}>
        <Text style={[styles.overlayText, { color: colors.error }]}>Difficult</Text>
      </Animated.View>
      <Animated.View style={[styles.overlay, styles.rightOverlay, rightOverlay]}>
        <Text style={[styles.overlayText, { color: colors.success }]}>Remembered</Text>
      </Animated.View>

      <GestureDetector gesture={pan}>
        <Animated.View style={cardStyle}>
          <FlashCard kanji={kanji} isFlipped={isFlipped} onFlip={onFlip} />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  overlay: {
    position: 'absolute',
    top: '40%',
    zIndex: -1,
  },
  leftOverlay: {
    left: spacing.lg,
  },
  rightOverlay: {
    right: spacing.lg,
  },
  overlayText: {
    fontFamily: 'BeVietnamPro_700Bold',
    fontSize: 20,
  },
});
