import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { TabNavigator } from './TabNavigator';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { StudyScreen } from '../screens/StudyScreen';
import { LevelDetailScreen } from '../screens/LevelDetailScreen';
import { CardPreviewScreen } from '../screens/CardPreviewScreen';
import { MaterialLevelDetailScreen } from '../screens/MaterialLevelDetailScreen';
import { MaterialPreviewScreen } from '../screens/MaterialPreviewScreen';
import { KanjiVocabularyScreen } from '../screens/KanjiVocabularyScreen';
import { DeckDetailScreen } from '../screens/DeckDetailScreen';
import { useSettingsStore } from '../stores/settingsStore';
import { useTheme } from '../context/ThemeContext';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const onboardingComplete = useSettingsStore((s) => s.onboardingComplete);
  const hydrated = useSettingsStore((s) => s.hydrated);
  const { colors } = useTheme();

  if (!hydrated) return null;

  return (
    <Stack.Navigator
      initialRouteName={onboardingComplete ? 'Main' : 'Onboarding'}
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.onSurface,
        headerTitleStyle: { fontFamily: 'BeVietnamPro_600SemiBold' },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen
        name="Onboarding"
        component={OnboardingScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="Main" component={TabNavigator} options={{ headerShown: false }} />
      <Stack.Screen
        name="Study"
        component={StudyScreen}
        options={{
          presentation: 'modal',
          title: 'Study Session',
          headerBackTitle: 'Close',
        }}
      />
      <Stack.Screen
        name="LevelDetail"
        component={LevelDetailScreen}
        options={({ route }) => ({ title: `JLPT ${route.params.level} Kanji` })}
      />
      <Stack.Screen
        name="MaterialLevelDetail"
        component={MaterialLevelDetailScreen}
        options={({ route }) => ({
          title:
            route.params.contentType === 'vocabulary'
              ? `JLPT ${route.params.level} Vocabulary`
              : `JLPT ${route.params.level} Grammar`,
        })}
      />
      <Stack.Screen
        name="MaterialPreview"
        component={MaterialPreviewScreen}
        options={{ title: 'Preview', presentation: 'modal' }}
      />
      <Stack.Screen
        name="CardPreview"
        component={CardPreviewScreen}
        options={{ title: 'Preview', presentation: 'modal' }}
      />
      <Stack.Screen
        name="KanjiVocabulary"
        component={KanjiVocabularyScreen}
        options={{ title: 'Vocabulary Examples' }}
      />
      <Stack.Screen
        name="DeckDetail"
        component={DeckDetailScreen}
        options={{ title: 'Deck Details' }}
      />
    </Stack.Navigator>
  );
}
