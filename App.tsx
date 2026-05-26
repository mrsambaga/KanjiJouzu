import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Inter_400Regular,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';
import {
  BeVietnamPro_600SemiBold,
  BeVietnamPro_700Bold,
} from '@expo-google-fonts/be-vietnam-pro';
import { NotoSerifJP_400Regular } from '@expo-google-fonts/noto-serif-jp';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { useSettingsStore } from './src/stores/settingsStore';

SplashScreen.preventAutoHideAsync().catch(() => {});

function AppContent() {
  const { colors, isDark } = useTheme();
  const hydrated = useSettingsStore((s) => s.hydrated);

  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      primary: colors.primary,
      background: colors.background,
      card: colors.surfaceContainerLowest,
      text: colors.onSurface,
      border: colors.outlineVariant,
    },
  };

  if (!hydrated) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <NavigationContainer theme={navTheme}>
        <RootNavigator />
      </NavigationContainer>
    </>
  );
}

export default function App() {
  const hydrate = useSettingsStore((s) => s.hydrate);
  const [appReady, setAppReady] = useState(false);

  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    BeVietnamPro_600SemiBold,
    BeVietnamPro_700Bold,
    NotoSerifJP_400Regular,
  });

  const fontsReady = fontsLoaded || fontError != null;

  useEffect(() => {
    async function prepare() {
      try {
        await hydrate();
      } catch (e) {
        console.warn('Failed to hydrate settings:', e);
      } finally {
        setAppReady(true);
      }
    }
    prepare();
  }, [hydrate]);

  useEffect(() => {
    if (appReady && fontsReady) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [appReady, fontsReady]);

  if (!appReady || !fontsReady) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator size="large" color="#9c4143" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  boot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff8f7',
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
