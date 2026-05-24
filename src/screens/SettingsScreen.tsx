import React from 'react';
import { View, Text, StyleSheet, Switch, Alert, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useTheme } from '../context/ThemeContext';
import { useSettingsStore } from '../stores/settingsStore';
import { resetProgress } from '../services/progressService';
import { spacing, radius } from '../theme';

const FONT_OPTIONS = ['small', 'medium', 'large'] as const;

export function SettingsScreen() {
  const { colors, typography } = useTheme();
  const darkMode = useSettingsStore((s) => s.darkMode);
  const showRomaji = useSettingsStore((s) => s.showRomaji);
  const fontSize = useSettingsStore((s) => s.fontSize);
  const setDarkMode = useSettingsStore((s) => s.setDarkMode);
  const setShowRomaji = useSettingsStore((s) => s.setShowRomaji);
  const setFontSize = useSettingsStore((s) => s.setFontSize);

  const handleReset = () => {
    Alert.alert(
      'Reset Progress',
      'This will clear all study progress. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => resetProgress(),
        },
      ],
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.content}>
        <Text style={[typography.headlineLg, { color: colors.onBackground }]}>Settings</Text>

        <Card style={styles.section}>
          <SettingRow label="Dark Mode">
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: colors.outlineVariant, true: colors.primaryContainer }}
              thumbColor={darkMode ? colors.primary : colors.surfaceContainerLowest}
            />
          </SettingRow>

          <SettingRow label="Show Romaji">
            <Switch
              value={showRomaji}
              onValueChange={setShowRomaji}
              trackColor={{ false: colors.outlineVariant, true: colors.primaryContainer }}
              thumbColor={showRomaji ? colors.primary : colors.surfaceContainerLowest}
            />
          </SettingRow>
        </Card>

        <Card style={styles.section}>
          <Text style={[styles.groupLabel, { color: colors.onSurfaceVariant }]}>Font Size</Text>
          <View style={styles.fontRow}>
            {FONT_OPTIONS.map((option) => (
              <Pressable
                key={option}
                onPress={() => setFontSize(option)}
                style={[
                  styles.fontOption,
                  {
                    backgroundColor:
                      fontSize === option ? colors.primary : colors.surfaceContainer,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.fontOptionText,
                    { color: fontSize === option ? colors.onPrimary : colors.onSurface },
                  ]}
                >
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>
        </Card>

        <Card style={styles.section}>
          <Text style={[styles.dangerLabel, { color: colors.error }]}>Danger Zone</Text>
          <Button title="Reset All Progress" variant="outline" onPress={handleReset} fullWidth />
        </Card>

        <Text style={[styles.version, { color: colors.onSurfaceVariant }]}>
          Kanji Jouzu v1.0.0
        </Text>
      </View>
    </SafeAreaView>
  );
}

function SettingRow({ label, children }: { label: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={styles.settingRow}>
      <Text style={[styles.settingLabel, { color: colors.onSurface }]}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: spacing.containerPadding,
    gap: spacing.lg,
  },
  section: {
    gap: spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: spacing.touchTarget,
  },
  settingLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
  },
  groupLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    letterSpacing: 0.24,
    textTransform: 'uppercase',
  },
  fontRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  fontOption: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
    alignItems: 'center',
  },
  fontOptionText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  dangerLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  version: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
