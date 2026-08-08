import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Tag } from '../components/ui/Tag';
import { Button } from '../components/ui/Button';
import { useTheme } from '../context/ThemeContext';
import { prepareStudySession } from '../services/studyService';
import { useStudyStore } from '../stores/studyStore';
import { addKanjiToDeck, getCustomDeck, removeKanjiFromDeck } from '../services/deckService';
import { searchKanji, getKanjiByIds } from '../services/kanjiService';
import {
  getCustomCardsForDeck,
  deleteCustomCard,
  importCustomCardsFromCSV,
} from '../services/customCardService';
import { Kanji, CustomDeck, CustomCard, CustomCardWithProgress } from '../types';
import { RootStackParamList } from '../navigation/types';
import { spacing, radius } from '../theme';

type Route = RouteProp<RootStackParamList, 'DeckDetail'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

type Tab = 'kanji' | 'custom';

export function DeckDetailScreen() {
  const { colors } = useTheme();
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const { deckId } = route.params;

  const [activeTab, setActiveTab] = useState<Tab>('custom');
  const [deck, setDeck] = useState<CustomDeck | null>(null);
  const [kanji, setKanji] = useState<Kanji[]>([]);
  const [customCards, setCustomCards] = useState<CustomCardWithProgress[]>([]);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Kanji[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [startingStudy, setStartingStudy] = useState(false);
  const startSession = useStudyStore((s) => s.startSession);

  const loadDeck = useCallback(async () => {
    setLoading(true);
    const d = await getCustomDeck(deckId);
    setDeck(d);
    if (d) {
      const [kanjiList, cards] = await Promise.all([
        getKanjiByIds(d.kanjiIds),
        getCustomCardsForDeck(deckId),
      ]);
      setKanji(kanjiList);
      setCustomCards(cards);
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

  const handleAddKanji = async (kanjiId: number) => {
    await addKanjiToDeck(deckId, [kanjiId]);
    await loadDeck();
    setSearchResults((prev) => prev.filter((k) => k.id !== kanjiId));
  };

  const handleRemoveKanji = async (kanjiId: number) => {
    await removeKanjiFromDeck(deckId, [kanjiId]);
    await loadDeck();
  };

  const handleDeleteCustomCard = (card: CustomCard) => {
    Alert.alert('Delete Card', `Remove "${card.front}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteCustomCard(card.id);
          await loadDeck();
        },
      },
    ]);
  };

  const handleStudy = async () => {
    setStartingStudy(true);
    try {
      const source = { type: 'custom' as const, deckId };
      const session = await prepareStudySession(source);
      if (!session) {
        Alert.alert('Nothing to study', 'Add some cards or kanji to this deck first.');
        return;
      }
      startSession(source, session.queue, session.startIndex);
      navigation.navigate('Study');
    } finally {
      setStartingStudy(false);
    }
  };

  const handleImportCSV = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/plain', 'text/comma-separated-values', '*/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      const uri = asset.uri;

      setImporting(true);
      const csvText = await FileSystem.readAsStringAsync(uri);
      const { imported, errors } = await importCustomCardsFromCSV(deckId, csvText);
      await loadDeck();

      if (errors.length > 0 && imported === 0) {
        Alert.alert('Import Failed', errors.join('\n'));
      } else if (errors.length > 0) {
        Alert.alert(
          'Partial Import',
          `Imported ${imported} card${imported !== 1 ? 's' : ''}.\n\nSkipped rows:\n${errors.join('\n')}`,
        );
      } else {
        Alert.alert('Import Complete', `Successfully imported ${imported} card${imported !== 1 ? 's' : ''}.`);
      }
    } catch (exception) {
      Alert.alert('Error', 'Could not read the file. ' + String(exception));
    } finally {
      setImporting(false);
    }
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
      {/* Study button */}
      <View style={[styles.studyBar, { borderBottomColor: colors.outlineVariant }]}>
        <Button
          title="Study Deck"
          onPress={handleStudy}
          loading={startingStudy}
          disabled={startingStudy || (customCards.length === 0 && kanji.length === 0)}
          fullWidth
        />
      </View>

      {/* Tab bar */}
      <View style={[styles.tabBar, { borderBottomColor: colors.outlineVariant }]}>
        <Pressable
          style={[
            styles.tab,
            activeTab === 'custom' && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
          ]}
          onPress={() => setActiveTab('custom')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'custom' ? colors.primary : colors.onSurfaceVariant },
            ]}
          >
            Custom Cards ({customCards.length})
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.tab,
            activeTab === 'kanji' && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
          ]}
          onPress={() => setActiveTab('kanji')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'kanji' ? colors.primary : colors.onSurfaceVariant },
            ]}
          >
            JLPT Kanji ({kanji.length})
          </Text>
        </Pressable>
      </View>

      {activeTab === 'custom' ? (
        <CustomCardsTab
          deckId={deckId}
          customCards={customCards}
          onAddCard={() => navigation.navigate('CustomCardEditor', { deckId })}
          onEditCard={(card) => navigation.navigate('CustomCardEditor', { deckId, card })}
          onDeleteCard={handleDeleteCustomCard}
          onImportCSV={handleImportCSV}
          importing={importing}
          colors={colors}
        />
      ) : (
        <KanjiTab
          kanji={kanji}
          query={query}
          searchResults={searchResults}
          searching={searching}
          deck={deck}
          onSearch={handleSearch}
          onAdd={handleAddKanji}
          onRemove={handleRemoveKanji}
          colors={colors}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Custom Cards Tab ────────────────────────────────────────────────────────

function CustomCardsTab({
  deckId,
  customCards,
  onAddCard,
  onEditCard,
  onDeleteCard,
  onImportCSV,
  importing,
  colors,
}: {
  deckId: number;
  customCards: CustomCardWithProgress[];
  onAddCard: () => void;
  onEditCard: (card: CustomCard) => void;
  onDeleteCard: (card: CustomCard) => void;
  onImportCSV: () => void;
  importing: boolean;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <View style={styles.flex}>
      {/* Action row */}
      <View style={[styles.actionRow, { borderBottomColor: colors.outlineVariant }]}>
        <Button
          title="+ Add Card"
          onPress={onAddCard}
          style={styles.actionBtn}
        />
        <Button
          title={importing ? 'Importing…' : 'Import CSV'}
          variant="outline"
          onPress={onImportCSV}
          disabled={importing}
          loading={importing}
          style={styles.actionBtn}
        />
      </View>

      <FlatList
        data={customCards}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyTitle, { color: colors.onSurface }]}>No cards yet</Text>
            <Text style={[styles.empty, { color: colors.onSurfaceVariant }]}>
              Tap "+ Add Card" to create your first flashcard, or import multiple at once with a CSV file.
            </Text>
            <View style={[styles.csvHintBox, { backgroundColor: colors.surfaceContainer, borderRadius: radius.md }]}>
              <Text style={[styles.csvHintTitle, { color: colors.onSurface }]}>CSV Format</Text>
              <Text style={[styles.csvHint, { color: colors.onSurfaceVariant }]}>
                {'front,reading,romaji,meaning,example,example_meaning,card_type\n食べる,たべる,taberu,to eat,毎日食べる,I eat every day,vocabulary'}
              </Text>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <CustomCardRow
            card={item}
            onEdit={() => onEditCard(item)}
            onDelete={() => onDeleteCard(item)}
            colors={colors}
          />
        )}
      />
    </View>
  );
}

function CustomCardRow({
  card,
  onEdit,
  onDelete,
  colors,
}: {
  card: CustomCardWithProgress;
  onEdit: () => void;
  onDelete: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  const status = card.progress?.status;
  const statusVariant: Record<string, 'default' | 'primary' | 'success' | 'warning'> = {
    new: 'default',
    studying: 'primary',
    mastered: 'success',
    difficult: 'warning',
  };

  return (
    <View
      style={[
        styles.cardRow,
        { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.outlineVariant },
      ]}
    >
      <Pressable style={styles.cardRowContent} onPress={onEdit}>
        <View style={styles.cardRowMain}>
          <Text style={[styles.cardFront, { color: colors.onSurface }]}>{card.front}</Text>
          <Text style={[styles.cardMeaning, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
            {card.meaning}
          </Text>
          {card.reading ? (
            <Text style={[styles.cardReading, { color: colors.primary }]}>{card.reading}</Text>
          ) : null}
        </View>
        <View style={styles.cardRowMeta}>
          <Tag label={card.cardType === 'kanji' ? 'Kanji' : 'Vocab'} />
          {status && status !== 'new' ? (
            <Tag
              label={status.charAt(0).toUpperCase() + status.slice(1)}
              variant={statusVariant[status] ?? 'default'}
            />
          ) : null}
        </View>
      </Pressable>
      <View style={styles.cardRowActions}>
        <Pressable onPress={onEdit} hitSlop={12} style={styles.iconBtn}>
          <Ionicons name="pencil-outline" size={18} color={colors.primary} />
        </Pressable>
        <Pressable onPress={onDelete} hitSlop={12} style={styles.iconBtn}>
          <Ionicons name="trash-outline" size={18} color={colors.error} />
        </Pressable>
      </View>
    </View>
  );
}

// ─── Kanji Tab ───────────────────────────────────────────────────────────────

function KanjiTab({
  kanji,
  query,
  searchResults,
  searching,
  deck,
  onSearch,
  onAdd,
  onRemove,
  colors,
}: {
  kanji: Kanji[];
  query: string;
  searchResults: Kanji[];
  searching: boolean;
  deck: CustomDeck | null;
  onSearch: (text: string) => void;
  onAdd: (kanjiId: number) => void;
  onRemove: (kanjiId: number) => void;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <View style={styles.flex}>
      <View style={styles.searchSection}>
        <TextInput
          value={query}
          onChangeText={onSearch}
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
                onPress={() => onAdd(item.id)}
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
            <Pressable onPress={() => onRemove(item.id)} hitSlop={12}>
              <Ionicons name="close-circle" size={22} color={colors.error} />
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  studyBar: {
    padding: spacing.containerPadding,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },

  // Tabs
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  tabText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },

  // Custom cards tab
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.containerPadding,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  actionBtn: {
    flex: 1,
    minWidth: 0,
  },
  list: {
    padding: spacing.containerPadding,
    paddingBottom: spacing.xl,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    gap: spacing.md,
  },
  emptyTitle: {
    fontFamily: 'BeVietnamPro_600SemiBold',
    fontSize: 18,
  },
  empty: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  csvHintBox: {
    padding: spacing.md,
    width: '100%',
    marginTop: spacing.sm,
  },
  csvHintTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    marginBottom: spacing.xs,
  },
  csvHint: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    lineHeight: 18,
  },

  // Custom card row
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  cardRowContent: {
    flex: 1,
    padding: spacing.md,
    gap: spacing.xs,
  },
  cardRowMain: {
    gap: 2,
  },
  cardFront: {
    fontFamily: 'NotoSerifJP_400Regular',
    fontSize: 22,
  },
  cardMeaning: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
  },
  cardReading: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
  },
  cardRowMeta: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  cardRowActions: {
    flexDirection: 'row',
    paddingHorizontal: spacing.sm,
    gap: spacing.xs,
  },
  iconBtn: {
    padding: spacing.sm,
  },

  // Kanji tab
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
})
