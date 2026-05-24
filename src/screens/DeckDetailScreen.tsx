import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Tag } from '../components/ui/Tag';
import { useTheme } from '../context/ThemeContext';
import { addKanjiToDeck, getCustomDeck, removeKanjiFromDeck } from '../services/deckService';
import { searchKanji, getKanjiByIds } from '../services/kanjiService';
import { Kanji, CustomDeck } from '../types';
import { RootStackParamList } from '../navigation/types';
import { spacing, radius } from '../theme';

type Route = RouteProp<RootStackParamList, 'DeckDetail'>;

export function DeckDetailScreen() {
  const { colors } = useTheme();
  const route = useRoute<Route>();
  const { deckId } = route.params;

  const [deck, setDeck] = useState<CustomDeck | null>(null);
  const [kanji, setKanji] = useState<Kanji[]>([]);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Kanji[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadDeck = useCallback(async () => {
    setLoading(true);
    const d = await getCustomDeck(deckId);
    setDeck(d);
    if (d) {
      setKanji(await getKanjiByIds(d.kanjiIds));
    }
    setLoading(false);
  }, [deckId]);

  useFocusEffect(
    useCallback(() => {
      loadDeck();
    }, [loadDeck]),
  );

  const handleSearch = async (text: string) => {
    setQuery(text);
    if (text.trim().length < 1) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    const results = await searchKanji(text);
    const inDeck = new Set(deck?.kanjiIds ?? []);
    setSearchResults(results.filter((k) => !inDeck.has(k.id)));
    setSearching(false);
  };

  const handleAdd = async (kanjiId: number) => {
    await addKanjiToDeck(deckId, [kanjiId]);
    await loadDeck();
    setSearchResults((prev) => prev.filter((k) => k.id !== kanjiId));
  };

  const handleRemove = async (kanjiId: number) => {
    await removeKanjiFromDeck(deckId, [kanjiId]);
    await loadDeck();
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <View style={styles.searchSection}>
        <TextInput
          value={query}
          onChangeText={handleSearch}
          placeholder="Search kanji to add..."
          placeholderTextColor={colors.outline}
          style={[
            styles.input,
            { backgroundColor: colors.surfaceContainer, color: colors.onSurface },
          ]}
        />
        {searching && <ActivityIndicator color={colors.primary} style={styles.searchSpinner} />}
        {searchResults.length > 0 && (
          <FlatList
            data={searchResults.slice(0, 8)}
            keyExtractor={(item) => String(item.id)}
            style={[styles.searchList, { backgroundColor: colors.surfaceContainerLowest }]}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => handleAdd(item.id)}
                style={[styles.searchRow, { borderBottomColor: colors.outlineVariant }]}
              >
                <Text style={[styles.kanjiChar, { color: colors.onSurface }]}>{item.character}</Text>
                <View style={styles.searchMeta}>
                  <Text style={[styles.meaning, { color: colors.onSurfaceVariant }]}>{item.meaning}</Text>
                  <Tag label={item.jlptLevel} />
                </View>
                <Ionicons name="add-circle" size={24} color={colors.primary} />
              </Pressable>
            )}
          />
        )}
      </View>

      <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
        In Deck ({kanji.length})
      </Text>
      <FlatList
        data={kanji}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: colors.onSurfaceVariant }]}>
            No kanji in this deck. Search above to add some.
          </Text>
        }
        renderItem={({ item }) => (
          <View
            style={[
              styles.deckRow,
              { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.outlineVariant },
            ]}
          >
            <Text style={[styles.kanjiChar, { color: colors.onSurface }]}>{item.character}</Text>
            <View style={styles.deckMeta}>
              <Text style={[styles.meaning, { color: colors.onSurface }]}>{item.meaning}</Text>
              <Text style={[styles.romaji, { color: colors.onSurfaceVariant }]}>{item.romaji}</Text>
            </View>
            <Pressable onPress={() => handleRemove(item.id)} hitSlop={12}>
              <Ionicons name="close-circle" size={22} color={colors.error} />
            </Pressable>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  searchSection: {
    padding: spacing.containerPadding,
    paddingBottom: spacing.sm,
  },
  input: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  searchSpinner: { marginTop: spacing.sm },
  searchList: {
    marginTop: spacing.sm,
    borderRadius: radius.md,
    maxHeight: 240,
    overflow: 'hidden',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    gap: spacing.md,
  },
  sectionTitle: {
    fontFamily: 'BeVietnamPro_600SemiBold',
    fontSize: 16,
    paddingHorizontal: spacing.containerPadding,
    marginBottom: spacing.sm,
  },
  list: {
    paddingHorizontal: spacing.containerPadding,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  empty: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  deckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  kanjiChar: {
    fontFamily: 'NotoSerifJP_400Regular',
    fontSize: 28,
    width: 40,
    textAlign: 'center',
  },
  deckMeta: { flex: 1 },
  searchMeta: { flex: 1, gap: spacing.xs },
  meaning: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
  },
  romaji: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
  },
});
