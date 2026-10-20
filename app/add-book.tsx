
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BooksBackground from '../components/BooksBackground';

import {
  addBook,
  getBookById,
  getBookCover,
  updateBook,
  type ReadingStatus,
} from '../services/books';

const COLORS = {
  background: '#F3EBDD',
  green: '#40533C',
  lightGreen: '#E6E5D7',
  text: '#30362C',
  muted: '#777466',
  border: '#DDD7C9',
  white: '#FFFCF4',
  cardSurface: '#F3EBDD',
  danger: '#A65F52',
  input: '#FFFEFA',
  placeholder: '#898575',
  accent: '#92784C',
};

const STATUSES: ReadingStatus[] = [
  'Want to Read',
  'Currently Reading',
  'Completed',
];

const GENRES = [
  'Fiction',
  'Fantasy',
  'Romance',
  'Mystery',
  'Thriller',
  'Sci-Fi',
  'Nonfiction',
  'Biography',
  'History',
  'Personal Growth',
];

export default function AddBookScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const cardsSideBySide = width >= 680;
  const { id: bookId } = useLocalSearchParams<{ id?: string }>();

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [genre, setGenre] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] =
    useState<ReadingStatus>('Want to Read');
  const [isPhysical, setIsPhysical] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    if (!bookId) return;

    getBookById(bookId)
      .then((book) => {
        if (!active || !book) return;

        setTitle(book.title);
        setAuthor(book.author);
        setGenre(book.genre ?? '');
        setCoverImage(getBookCover(book) ?? '');
        setNotes(book.notes ?? '');
        setStatus(book.status);
        setIsPhysical(book.isPhysical ?? true);
      })
      .catch(() => {
        if (active) setError('Could not load this book for editing.');
      });

    return () => {
      active = false;
    };
  }, [bookId]);

  function showMessage(message: string) {
    if (Platform.OS === 'web') {
      window.alert(message);
    } else {
      Alert.alert('My Book Stash', message);
    }
  }

  async function handleSave() {
    if (saving) return;

    if (!title.trim()) {
      setError('Please enter the book title.');
      return;
    }

    if (!author.trim()) {
      setError('Please enter the author’s name.');
      return;
    }

    setError('');
    setSaving(true);

    try {
      const bookData = {
        title: title.trim(),
        author: author.trim(),
        genre: genre.trim(),
        coverImage: coverImage.trim(),
        notes: notes.trim(),
        status,
        isPhysical,
      };

      if (bookId) {
        await updateBook(bookId, bookData);
      } else {
        await addBook({
          ...bookData,
        });
      }

      router.replace('/');
    } catch (saveError) {
      console.error('Could not save book:', saveError);

      showMessage(
        'The book could not be saved. Please try again.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <BooksBackground />
      <StatusBar barStyle="dark-content" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Text style={styles.backText}>←</Text>
            </TouchableOpacity>

            <View style={styles.headerCopy}>
              <Text style={styles.eyebrow}>
                YOUR PERSONAL LIBRARY
              </Text>

              <Text style={styles.heading}>
                {bookId ? 'Edit book' : 'Add a new book'}
              </Text>

              <Text style={styles.subtitle}>
                Every great collection starts with one book.
              </Text>
            </View>
          </View>

          <View style={cardsSideBySide ? styles.cardsRow : undefined}>
          <View style={[styles.card, cardsSideBySide && styles.cardInRow]}>
            <Text style={styles.sectionTitle}>
              Book details
            </Text>

            <Text style={styles.helper}>
              Fields marked with * are required.
            </Text>

            <Text style={styles.label}>Book title *</Text>

            <TextInput
              style={styles.input}
              value={title}
              onChangeText={(value) => {
                setTitle(value);
                setError('');
              }}
              placeholder="e.g. Atomic Habits"
              placeholderTextColor={COLORS.placeholder}
              autoCapitalize="words"
              returnKeyType="next"
              accessibilityLabel="Book title"
            />

            <Text style={styles.label}>Author *</Text>

            <TextInput
              style={styles.input}
              value={author}
              onChangeText={(value) => {
                setAuthor(value);
                setError('');
              }}
              placeholder="e.g. James Clear"
              placeholderTextColor={COLORS.placeholder}
              autoCapitalize="words"
              returnKeyType="next"
              accessibilityLabel="Book author"
            />

            <Text style={styles.label}>Genre (optional)</Text>
            <Text style={styles.helper}>
              Choose a genre or type your own below.
            </Text>
            <View style={styles.genreOptions}>
              {GENRES.map((item) => {
                const selected = genre.toLocaleLowerCase() === item.toLocaleLowerCase();

                return (
                  <TouchableOpacity
                    key={item}
                    style={[
                      styles.genreOption,
                      selected && styles.genreOptionSelected,
                    ]}
                    onPress={() => setGenre(selected ? '' : item)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                  >
                    <Text
                      style={[
                        styles.genreOptionText,
                        selected && styles.genreOptionTextSelected,
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TextInput
              style={styles.input}
              value={genre}
              onChangeText={setGenre}
              placeholder="Or enter a different genre"
              placeholderTextColor={COLORS.placeholder}
              autoCapitalize="words"
              accessibilityLabel="Book genre"
            />

            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : null}

            {coverImage ? (
              <View style={styles.scannedCoverPreview}>
                <Image
                  source={{ uri: coverImage }}
                  style={styles.coverPreview}
                  resizeMode="cover"
                  accessibilityLabel={`Cover of ${title || 'new book'}`}
                />
                <Text style={styles.helper}>Book cover attached</Text>
              </View>
            ) : null}

            <Text style={styles.label}>
              Personal notes (optional)
            </Text>

            <TextInput
              style={[styles.input, styles.notesInput]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add your thoughts or reminders..."
              placeholderTextColor={COLORS.placeholder}
              multiline
              textAlignVertical="top"
              accessibilityLabel="Personal notes"
            />
          </View>

          <View style={[styles.card, cardsSideBySide && styles.cardInRow]}>
            <Text style={styles.sectionTitle}>
              Reading status
            </Text>

            <Text style={styles.helper}>
              Choose the status that best describes this book.
            </Text>

            <View style={styles.statusList}>
              {STATUSES.map((item) => {
                const selected = status === item;

                return (
                  <TouchableOpacity
                    key={item}
                    style={[
                      styles.statusOption,
                      selected && styles.statusOptionSelected,
                    ]}
                    onPress={() => setStatus(item)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                  >
                    <View
                      style={[
                        styles.radio,
                        selected && styles.radioSelected,
                      ]}
                    >
                      {selected ? (
                        <View style={styles.radioDot} />
                      ) : null}
                    </View>

                    <Text
                      style={[
                        styles.statusText,
                        selected && styles.statusTextSelected,
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.physicalRow}>
              <View style={styles.physicalCopy}>
                <Text style={styles.labelNoMargin}>
                  Physical book
                </Text>

                <Text style={styles.helper}>
                  Is this a printed copy that you own?
                </Text>
              </View>

              <Switch
                value={isPhysical}
                onValueChange={setIsPhysical}
                trackColor={{
                  false: '#D5D8D0',
                  true: '#A9B594',
                }}
                thumbColor={
                  isPhysical ? COLORS.green : '#B9B7AC'
                }
                accessibilityLabel="Physical book"
              />
            </View>
          </View>
          </View>

          <TouchableOpacity
            style={[
              styles.saveButton,
              saving && styles.saveButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.8}
            accessibilityRole="button"
          >
            <Text style={styles.saveButtonText}>
              {saving
                ? 'Saving book...'
                : bookId
                  ? 'Save changes  →'
                  : 'Save book  →'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
            disabled={saving}
            accessibilityRole="button"
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>

          <Text style={styles.footer}>
            YOUR LIBRARY, YOUR STORIES
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  container: {
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 13,
    marginBottom: 25,
    marginTop: 8,
  },
  backButton: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    fontSize: 24,
    color: COLORS.green,
  },
  headerCopy: {
    flex: 1,
  },
  eyebrow: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 7,
  },
  heading: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  subtitle: {
    color: '#263329',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 19,
    marginTop: 6,
  },
  card: {
    backgroundColor: COLORS.cardSurface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 19,
    padding: 19,
    marginBottom: 17,
  },
  cardsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 17,
  },
  cardInRow: {
    flex: 1,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
  },
  helper: {
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 5,
  },
  label: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 17,
    marginBottom: 8,
  },
  labelNoMargin: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '700',
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 12,
    color: COLORS.text,
    backgroundColor: COLORS.input,
    fontSize: 13,
  },
  genreOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
    marginBottom: 10,
  },
  genreOption: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: COLORS.input,
  },
  genreOptionSelected: {
    borderColor: COLORS.green,
    backgroundColor: COLORS.lightGreen,
  },
  genreOptionText: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: '600',
  },
  genreOptionTextSelected: {
    color: COLORS.green,
    fontWeight: '800',
  },
  coverPreview: {
    width: 112,
    height: 168,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginTop: 10,
    backgroundColor: COLORS.lightGreen,
  },
  scannedCoverPreview: {
    alignSelf: 'flex-start',
    marginTop: 17,
  },
  notesInput: {
    minHeight: 100,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 12,
    marginTop: 8,
  },
  statusList: {
    gap: 9,
    marginTop: 16,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    padding: 13,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: COLORS.input,
  },
  statusOptionSelected: {
    borderColor: '#DED8C8',
    backgroundColor: COLORS.lightGreen,
  },
  radio: {
    width: 19,
    height: 19,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#C7C9B9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: COLORS.green,
  },
  radioDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: COLORS.green,
  },
  statusText: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  statusTextSelected: {
    color: COLORS.green,
    fontWeight: '800',
  },
  physicalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 22,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  physicalCopy: {
    flex: 1,
  },
  saveButton: {
    minHeight: 53,
    borderRadius: 14,
    backgroundColor: COLORS.green,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 3,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
  },
  cancelButton: {
    minHeight: 47,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: '700',
  },
  footer: {
    color: COLORS.accent,
    textAlign: 'center',
    fontSize: 9,
    letterSpacing: 1.5,
    marginTop: 17,
  },
});
