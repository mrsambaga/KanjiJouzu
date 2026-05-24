import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { Logo } from '../components/ui/Logo';
import { Button } from '../components/ui/Button';
import { useTheme } from '../context/ThemeContext';
import { useSettingsStore } from '../stores/settingsStore';
import { RootStackParamList } from '../navigation/types';
import { spacing } from '../theme';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;

export function OnboardingScreen() {
  const { colors, typography } = useTheme();
  const navigation = useNavigation<Nav>();
  const setOnboardingComplete = useSettingsStore((s) => s.setOnboardingComplete);

  const handleStart = async () => {
    await setOnboardingComplete(true);
    navigation.replace('Main');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Logo size={140} />
        <Text style={[styles.title, typography.headlineLg, { color: colors.onBackground }]}>
          Master Kanji with Flow
        </Text>
        <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
          Learn Japanese characters through calm, focused study sessions designed for steady progress.
        </Text>
      </View>
      <View style={styles.footer}>
        <Button title="Start Learning" onPress={handleStart} fullWidth />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.containerPadding,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  title: {
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  footer: {
    paddingBottom: spacing.xl,
  },
});
