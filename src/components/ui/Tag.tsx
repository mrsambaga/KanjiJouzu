import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { radius, spacing } from '../../theme';

type TagVariant = 'default' | 'primary' | 'success' | 'warning';

interface TagProps {
  label: string;
  variant?: TagVariant;
}

export function Tag({ label, variant = 'default' }: TagProps) {
  const { colors } = useTheme();

  const variants: Record<TagVariant, { bg: string; text: string }> = {
    default: { bg: colors.surfaceContainer, text: colors.onSurfaceVariant },
    primary: { bg: colors.primaryContainer, text: colors.onPrimaryContainer },
    success: { bg: `${colors.success}22`, text: colors.success },
    warning: { bg: colors.surfaceContainerHigh, text: colors.primary },
  };

  const v = variants[variant];

  return (
    <View style={[styles.tag, { backgroundColor: v.bg }]}>
      <Text style={[styles.text, { color: v.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    letterSpacing: 0.24,
  },
});
