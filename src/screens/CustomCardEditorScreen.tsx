import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../context/ThemeContext';
import { Button } from '../components/ui/Button';
import { createCustomCard, updateCustomCard } from '../services/customCardService';
import { RootStackParamList } from '../navigation/types';
import { spacing, radius } from '../theme';
import { CustomCardType } from '../types';

type Route = RouteProp<RootStackParamList, 'CustomCardEditor'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

export function CustomCardEditorScreen() {
  const { colors, typography } = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { deckId, card } = route.params;

  const isEditing = !!card;

  const [cardType, setCardType] = useState<CustomCardType>(card?.cardType ?? 'vocabulary');
  const [front, setFront] = useState(card?.front ?? '');
  const [reading, setReading] = useState(card?.reading ?? '');
  const [romaji, setRomaji] = useState(card?.romaji ?? '');
  const [meaning, setMeaning] = useState(card?.meaning ?? '');
  const [example, setExample] = useState(card?.example ?? '');
  const [exampleMeaning, setExampleMeaning] = useState(card?.exampleMeaning ?? '');
  const [saving, setSaving] = useState(false);

  const canSave = front.trim().length > 0 && meaning.trim().length > 0;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      if (isEditing && card) {
        await updateCustomCard(card.id, {
          cardType,
          front,
          reading,
          romaji,
          meaning,
          example,
          exampleMeaning,
        });
      } else {
        await createCustomCard(deckId, {
          cardType,
          front,
          reading,
          romaji,
          meaning,
          example,
          exampleMeaning,
        });
      }
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', 'Failed to save card. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = [
    styles.input,
    { backgroundColor: colors.surfaceContainer, color: colors.onSurface },
  ];
  const labelStyle = [styles.label, { color: colors.onSurfaceVariant }];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Card type toggle */}
          <Text style={labelStyle}>Card Type</Text>
          <View style={[styles.toggle, { backgroundColor: colors.surfaceContainer, borderRadius: radius.full }]}>
            {(['vocabulary', 'kanji'] as CustomCardType[]).map((t) => (
              <Pressable
                key={t}
                onPress={() => setCardType(t)}
                style={[
                  styles.toggleOption,
                  { borderRadius: radius.full },
                  cardType === t && { backgroundColor: colors.primary },
                ]}
              >
                <Text
                  style={[
                    styles.toggleText,
                    { color: cardType === t ? colors.onPrimary : colors.onSurfaceVariant },
                  ]}
                >
                  {t === 'vocabulary' ? 'Vocabulary' : 'Kanji'}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Front */}
          <Text style={labelStyle}>Front (Japanese) *</Text>
          <TextInput
            value={front}
            onChangeText={setFront}
            placeholder={cardType === 'kanji' ? 'e.g. 日' : 'e.g. 食べる'}
            placeholderTextColor={colors.outline}
            style={[inputStyle, styles.frontInput]}
          />

          {/* Reading */}
          <Text style={labelStyle}>Reading (Hiragana/Katakana)</Text>
          <TextInput
            value={reading}
            onChangeText={setReading}
            placeholder="e.g. たべる"
            placeholderTextColor={colors.outline}
            style={inputStyle}
          />

          {/* Romaji */}
          <Text style={labelStyle}>Romaji</Text>
          <TextInput
            value={romaji}
            onChangeText={setRomaji}
            placeholder="e.g. taberu"
            placeholderTextColor={colors.outline}
            style={inputStyle}
            autoCapitalize="none"
          />

          {/* Meaning */}
          <Text style={labelStyle}>Meaning (English) *</Text>
          <TextInput
            value={meaning}
            onChangeText={setMeaning}
            placeholder="e.g. to eat"
            placeholderTextColor={colors.outline}
            style={inputStyle}
          />

          {/* Example */}
          <Text style={labelStyle}>Example Sentence</Text>
          <TextInput
            value={example}
            onChangeText={setExample}
            placeholder="e.g. 私は寿司を食べる"
            placeholderTextColor={colors.outline}
            style={inputStyle}
            multiline
          />

          {/* Example Meaning */}
          <Text style={labelStyle}>Example Translation</Text>
          <TextInput
            value={exampleMeaning}
            onChangeText={setExampleMeaning}
            placeholder="e.g. I eat sushi"
            placeholderTextColor={colors.outline}
            style={inputStyle}
            multiline
          />

          <Text style={[styles.required, { color: colors.onSurfaceVariant }]}>
            * Required fields
          </Text>
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: colors.outlineVariant }]}>
          <Button
            title={isEditing ? 'Save Changes' : 'Add Card'}
            onPress={handleSave}
            loading={saving}
            disabled={!canSave}
            fullWidth
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  scroll: {
    padding: spacing.containerPadding,
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    letterSpacing: 0.2,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  input: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    padding: spacing.md,
    borderRadius: radius.md,
    minHeight: 48,
  },
  frontInput: {
    fontFamily: 'NotoSerifJP_400Regular',
    fontSize: 28,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  toggle: {
    flexDirection: 'row',
    padding: 4,
    gap: 4,
  },
  toggleOption: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  toggleText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  required: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    marginTop: spacing.sm,
  },
  footer: {
    padding: spacing.containerPadding,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
  },
});
