import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../context/ThemeContext';
import { getKanjiWithProgress } from '../services/kanjiService';
import { getVocabularyForKanji } from '../services/vocabularyService';
import { RootStackParamList } from '../navigation/types';
import { Vocabulary } from '../types';
import { Card } from '../components/ui/Card';
import { spacing } from '../theme';

type Route = RouteProp<RootStackParamList, 'KanjiVocabulary'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

export function KanjiVocabularyScreen() {
  const { colors, typography } = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { kanjiId } = route.params;

  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState<string>('');
  const [vocabulary, setVocabulary] = useState<Vocabulary[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    const [kanjiRows, vocab] = await Promise.all([
      getKanjiWithProgress([kanjiId]),
      getVocabularyForKanji(kanjiId),
    ]);
    const k = kanjiRows[0];
    setTitle(k ? `${k.character} · ${k.meaning}` : 'Vocabulary');
    setVocabulary(vocab);
    setLoading(false);
  }, [kanjiId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <Text style={[typography.headlineLg, { color: colors.onSurface }]}>{title}</Text>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={vocabulary}
          keyExtractor={(v) => String(v.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable
              onPress={() =>
                navigation.navigate('CardPreview', {
                  type: 'vocabulary',
                  kanjiId,
                  vocabularyId: item.id,
                })
              }
            >
              <Card style={styles.row}>
                <Text style={[styles.word, { color: colors.onSurface }]}>{item.word}</Text>
                <Text style={[styles.meta, { color: colors.primary }]}>{item.reading}</Text>
                <Text style={[styles.meta, { color: colors.onSurfaceVariant }]}>{item.meaning}</Text>
              </Card>
            </Pressable>
          )}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: colors.onSurfaceVariant }]}>
              No vocabulary examples for this kanji yet.
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.containerPadding,
    gap: spacing.lg,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },
  row: {
    padding: spacing.md,
    gap: 4,
  },
  word: {
    fontFamily: 'NotoSerifJP_400Regular',
    fontSize: 24,
  },
  meta: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
  },
  empty: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});

