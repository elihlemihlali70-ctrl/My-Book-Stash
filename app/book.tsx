import { Palette } from '../constants/theme';
import { GlobalStyles } from '../constants/globalStyles';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BooksBackground from '../components/BooksBackground';
import {
  getBookById,
  getBookCover,
  type Book,
} from '../services/books';

const COLORS = {
  green: Palette.brand,
  lightGreen: Palette.brandLight,
  text: Palette.text,
  muted: Palette.muted,
  border: Palette.border,
  white: Palette.surface,
  danger: Palette.danger,
};

export default function BookScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const bookId = Array.isArray(id) ? id[0] : id;
  const [loadResult, setLoadResult] = useState<{
    id: string;
    book?: Book;
    error?: string;
  } | null>(null);

  useEffect(() => {
    let active = true;

    if (!bookId) return () => { active = false; };

    getBookById(bookId)
      .then((foundBook) => {
        if (!active) return;
        setLoadResult(foundBook
          ? { id: bookId, book: foundBook }
          : { id: bookId, error: 'This book could not be found in your library.' });
      })
      .catch(() => {
        if (active) {
          setLoadResult({ id: bookId, error: 'Could not load this book. Please try again.' });
        }
      });

    return () => {
      active = false;
    };
  }, [bookId]);

  const loading = Boolean(bookId) && loadResult?.id !== bookId;
  const currentResult = loadResult?.id === bookId ? loadResult : null;
  const book = currentResult?.book ?? null;
  const error = !bookId
    ? 'No book was selected.'
    : currentResult?.error ?? '';

  const goBackToLibrary = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  const coverImage = book ? getBookCover(book) : undefined;

  return (
    <SafeAreaView style={[GlobalStyles.screen, styles.screen]} edges={['top']}>
      <BooksBackground />
      <StatusBar barStyle="dark-content" />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={goBackToLibrary}
            accessibilityRole="button"
            accessibilityLabel="Back to library"
          >
            <Ionicons name="arrow-back" size={21} color={COLORS.green} />
            <Text style={styles.backText}>Library</Text>
          </TouchableOpacity>

          {loading ? (
            <View style={styles.messageCard}>
              <ActivityIndicator size="large" color={COLORS.green} />
              <Text style={styles.mutedText}>Loading book details…</Text>
            </View>
          ) : error ? (
            <View style={styles.messageCard}>
              <Ionicons name="alert-circle-outline" size={34} color={COLORS.danger} />
              <Text style={styles.errorTitle}>Book unavailable</Text>
              <Text style={styles.mutedText}>{error}</Text>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => router.replace('/(tabs)')}
                accessibilityRole="button"
              >
                <Text style={styles.primaryButtonText}>Return to library</Text>
              </TouchableOpacity>
            </View>
          ) : book ? (
            <>
              <View style={styles.bookCard}>
                {coverImage ? (
                  <Image
                    source={{ uri: coverImage }}
                    style={styles.cover}
                    resizeMode="cover"
                    accessibilityLabel={`Cover of ${book.title}`}
                  />
                ) : (
                  <View style={[styles.cover, styles.coverPlaceholder]}>
                    <Ionicons name="book-outline" size={42} color={COLORS.green} />
                  </View>
                )}

                <Text style={styles.title}>{book.title}</Text>
                <Text style={styles.author}>by {book.author}</Text>

                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>{book.status}</Text>
                </View>
              </View>

              <View style={styles.detailsCard}>
                <Text style={styles.sectionTitle}>Book details</Text>
                <DetailRow label="Genre" value={book.genre} />
                <DetailRow
                  label="Format"
                  value={book.isPhysical === false ? 'Digital book' : 'Physical book'}
                />
                <DetailRow label="ISBN" value={book.isbn} />
              </View>

              {book.notes ? (
                <View style={styles.detailsCard}>
                  <Text style={styles.sectionTitle}>Personal notes</Text>
                  <Text style={styles.notes}>{book.notes}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() =>
                  router.push({ pathname: '/add-book', params: { id: book.id } })
                }
                accessibilityRole="button"
              >
                <Ionicons name="create-outline" size={19} color={COLORS.white} />
                <Text style={styles.primaryButtonText}>Edit book</Text>
              </TouchableOpacity>
            </>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;

  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
  },
  container: {
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
  },
  backButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
    paddingHorizontal: 14,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  backText: {
    color: COLORS.green,
    fontSize: 13,
    fontWeight: '700',
  },
  bookCard: {
    alignItems: 'center',
    padding: 22,
    marginBottom: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  cover: {
    width: 150,
    height: 220,
    borderRadius: 12,
    marginBottom: 17,
    backgroundColor: COLORS.lightGreen,
  },
  coverPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: COLORS.text,
    fontSize: 23,
    fontWeight: '800',
    textAlign: 'center',
  },
  author: {
    color: COLORS.muted,
    fontSize: 14,
    marginTop: 6,
    textAlign: 'center',
  },
  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginTop: 14,
    borderRadius: 20,
    backgroundColor: COLORS.lightGreen,
  },
  statusText: {
    color: COLORS.green,
    fontSize: 12,
    fontWeight: '700',
  },
  detailsCard: {
    padding: 19,
    marginBottom: 15,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 14,
    paddingVertical: 9,
    borderTopWidth: 1,
    borderTopColor: Palette.border,
  },
  detailLabel: {
    color: COLORS.muted,
    fontSize: 13,
  },
  detailValue: {
    flexShrink: 1,
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
  },
  notes: {
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 21,
  },
  mutedText: {
    color: COLORS.muted,
    fontSize: 13,
    marginTop: 9,
    textAlign: 'center',
  },
  messageCard: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 18,
    backgroundColor: COLORS.white,
  },
  errorTitle: {
    marginTop: 10,
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
  },
  primaryButton: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    paddingHorizontal: 18,
    marginTop: 6,
    borderRadius: 13,
    backgroundColor: COLORS.green,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
  },
});
