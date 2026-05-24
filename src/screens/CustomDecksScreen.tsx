import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Alert,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Tag } from '../components/ui/Tag';
import { useTheme } from '../context/ThemeContext';
import { createCustomDeck, deleteCustomDeck, getCustomDecks } from '../services/deckService';
import { getDeckStats } from '../services/progressService';
import { CustomDeck } from '../types';
import { RootStackParamList } from '../navigation/types';
import { spacing, radius } from '../theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function CustomDecksScreen() {
  const { colors, typography } = useTheme();
  const navigation = useNavigation<Nav>();
  const [decks, setDecks] = useState<CustomDeck[]>([]);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  const loadDecks = useCallback(async () => {
    setDecks(await getCustomDecks());
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDecks();
    }, [loadDecks]),
  );

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    try {
      await createCustomDeck(name);
      setNewName('');
      await loadDecks();
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = (deck: CustomDeck) => {
    Alert.alert('Delete Deck', `Remove "${deck.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteCustomDeck(deck.id);
          await loadDecks();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[typography.headlineLg, { color: colors.onBackground }]}>Custom Decks</Text>
        <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
          Build your own study collections
        </Text>
      </View>

      <Card style={styles.createCard}>
        <TextInput
          value={newName}
          onChangeText={setNewName}
          placeholder="New deck name"
          placeholderTextColor={colors.outline}
          style={[
            styles.input,
            { backgroundColor: colors.surfaceContainer, color: colors.onSurface },
          ]}
        />
        <Button title="Create Deck" onPress={handleCreate} loading={creating} disabled={!newName.trim()} />
      </Card>

      <FlatList
        data={decks}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: colors.onSurfaceVariant }]}>
            No decks yet. Create one above.
          </Text>
        }
        renderItem={({ item }) => (
          <DeckListItem
            deck={item}
            onOpen={() => navigation.navigate('DeckDetail', { deckId: item.id })}
            onDelete={() => handleDelete(item)}
          />
        )}
      />
    </SafeAreaView>
  );
}

function DeckListItem({
  deck,
  onOpen,
  onDelete,
}: {
  deck: CustomDeck;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const { colors } = useTheme();
  const [progress, setProgress] = useState(0);

  React.useEffect(() => {
    getDeckStats({ type: 'custom', deckId: deck.id }).then((s) => setProgress(s.progressPercent));
  }, [deck.id]);

  return (
    <Pressable
      onPress={onOpen}
      style={({ pressed }) => [
        styles.deckItem,
        { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.outlineVariant },
        pressed && { opacity: 0.92 },
      ]}
    >
      <View style={styles.deckContent}>
        <Text style={[styles.deckName, { color: colors.onSurface }]}>{deck.name}</Text>
        <View style={styles.deckMeta}>
          <Tag label={`${deck.kanjiIds.length} kanji`} />
          <Tag label={`${progress}%`} variant="primary" />
        </View>
      </View>
      <Pressable onPress={onDelete} hitSlop={12}>
        <Ionicons name="trash-outline" size={20} color={colors.error} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: spacing.containerPadding,
    paddingTop: spacing.md,
    gap: spacing.xs,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    marginBottom: spacing.md,
  },
  createCard: {
    marginHorizontal: spacing.containerPadding,
    gap: spacing.md,
  },
  input: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  list: {
    padding: spacing.containerPadding,
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },
  empty: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  deckItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  deckContent: {
    flex: 1,
    gap: spacing.sm,
  },
  deckName: {
    fontFamily: 'BeVietnamPro_600SemiBold',
    fontSize: 17,
  },
  deckMeta: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
