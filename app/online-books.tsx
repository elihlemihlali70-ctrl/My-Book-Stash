import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BooksBackground from '../components/BooksBackground';
import { GlobalStyles } from '../constants/globalStyles';
import { Palette } from '../constants/theme';
import { addBook, getBooks } from '../services/books';

type GoogleVolume = {
  id: string;
  source?: 'Google Books' | 'Open Library';
  volumeInfo?: {
    title?: string;
    authors?: string[];
    categories?: string[];
    description?: string;
    imageLinks?: { thumbnail?: string; smallThumbnail?: string };
    previewLink?: string;
    industryIdentifiers?: { type?: string; identifier?: string }[];
  };
  accessInfo?: { viewability?: string; epub?: { isAvailable?: boolean }; pdf?: { isAvailable?: boolean } };
};

const GREEN = Palette.brand;
const GOOGLE_BOOKS = 'https://www.googleapis.com/books/v1/volumes';
const OPEN_LIBRARY = 'https://openlibrary.org/search.json';

async function searchOpenLibrary(term: string): Promise<GoogleVolume[]> {
  const params = new URLSearchParams({
    q: term,
    fields: 'key,title,author_name,subject,cover_i,isbn,number_of_pages_median',
    limit: '20',
  });
  const response = await fetch(`${OPEN_LIBRARY}?${params.toString()}`);
  if (!response.ok) throw new Error(`Open Library returned ${response.status}.`);
  const data = await response.json() as {
    docs?: {
      key?: string;
      title?: string;
      author_name?: string[];
      subject?: string[];
      cover_i?: number;
      isbn?: string[];
    }[];
  };
  return (data.docs ?? []).filter((item) => item.title).map((item) => ({
    id: `openlibrary:${item.key ?? item.title}`,
    source: 'Open Library',
    volumeInfo: {
      title: item.title,
      authors: item.author_name,
      categories: item.subject?.slice(0, 1),
      imageLinks: item.cover_i
        ? { thumbnail: `https://covers.openlibrary.org/b/id/${item.cover_i}-M.jpg` }
        : undefined,
      previewLink: item.key ? `https://openlibrary.org${item.key}` : undefined,
      industryIdentifiers: item.isbn?.[0]
        ? [{ type: 'ISBN_13', identifier: item.isbn[0] }]
        : undefined,
    },
  }));
}

function coverUrl(volume: GoogleVolume): string | undefined {
  const url = volume.volumeInfo?.imageLinks?.thumbnail ?? volume.volumeInfo?.imageLinks?.smallThumbnail;
  return url?.replace(/^http:/i, 'https:');
}

export default function OnlineBooksScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'partial' | 'free-ebooks'>('partial');
  const [results, setResults] = useState<GoogleVolume[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);

  const searchBooks = async (selectedFilter = filter) => {
    const term = query.trim();
    if (!term) return;
    setLoading(true);
    setSearched(true);
    setUsingFallback(false);
    try {
      const params = new URLSearchParams({ q: term, filter: selectedFilter, printType: 'books', maxResults: '20', orderBy: 'relevance' });
      const response = await fetch(`${GOOGLE_BOOKS}?${params.toString()}`);
      if (!response.ok) throw new Error(`Google Books returned ${response.status}.`);
      const data = await response.json() as { items?: GoogleVolume[] };
      setResults((data.items ?? []).map((item) => ({ ...item, source: 'Google Books' })));
    } catch (googleError) {
      try {
        const fallbackResults = await searchOpenLibrary(term);
        setResults(fallbackResults);
        setUsingFallback(true);
      } catch (openLibraryError) {
        setResults([]);
        const googleMessage = googleError instanceof Error ? googleError.message : 'Google Books could not be reached.';
        const libraryMessage = openLibraryError instanceof Error ? openLibraryError.message : 'Open Library could not be reached.';
        const message = `Book search failed. ${googleMessage} ${libraryMessage} Check your connection and try again.`;
        if (Platform.OS === 'web') window.alert(message);
        else Alert.alert('Search unavailable', message);
      }
    } finally {
      setLoading(false);
    }
  };

  const saveBook = async (volume: GoogleVolume) => {
    const info = volume.volumeInfo;
    if (!info?.title) return;
    setSavingId(volume.id);
    try {
      const existing = await getBooks();
      const isbn = info.industryIdentifiers?.find((item) => item.type === 'ISBN_13')?.identifier
        ?? info.industryIdentifiers?.find((item) => item.type === 'ISBN_10')?.identifier;
      const author = info.authors?.join(', ') ?? 'Unknown author';
      const duplicate = existing.some((book) => (isbn && book.isbn === isbn)
        || (book.title.toLocaleLowerCase() === info.title!.toLocaleLowerCase()
          && book.author.toLocaleLowerCase() === author.toLocaleLowerCase()));
      if (duplicate) {
        if (Platform.OS === 'web') window.alert('This book is already in your library.');
        else Alert.alert('Already in your library', 'This book is already in your library.');
        return;
      }
      await addBook({
        title: info.title,
        author,
        genre: info.categories?.[0],
        status: 'Want to Read',
        isbn,
        coverImage: coverUrl(volume),
        readingUrl: info.previewLink,
        isPhysical: false,
      });
      if (Platform.OS === 'web') window.alert('Added to your library as a digital book.');
      else Alert.alert('Book added', 'Added to your library as a digital book.');
    } catch {
      if (Platform.OS === 'web') window.alert('Could not add this book. Please try again.');
      else Alert.alert('Could not add book', 'Please try again.');
    } finally {
      setSavingId(null);
    }
  };

  const readBook = async (volume: GoogleVolume) => {
    const url = volume.volumeInfo?.previewLink;
    if (!url) return;
    try {
      await WebBrowser.openBrowserAsync(url);
    } catch {
      if (Platform.OS === 'web') window.open(url, '_blank', 'noopener,noreferrer');
      else Alert.alert('Could not open book', 'Please try again.');
    }
  };

  return (
    <SafeAreaView style={[GlobalStyles.screen, styles.safeArea]} edges={['top']}>
      <View style={styles.container}>
        <BooksBackground />
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()} accessibilityRole="button">
            <Ionicons name="arrow-back" size={20} color={GREEN} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          <View style={styles.headingCard}>
            <View style={styles.headingIcon}><Ionicons name="globe-outline" size={25} color={GREEN} /></View>
            <Text style={styles.title}>E-book</Text>
            <Text style={styles.subtitle}>Search books online and read available previews.</Text>
          </View>

          <View style={styles.searchCard}>
            <Text style={styles.label}>Find a book</Text>
            <View style={styles.searchRow}>
              <Ionicons name="search-outline" size={20} color={Palette.muted} />
              <TextInput
                style={styles.input}
                value={query}
                onChangeText={setQuery}
                placeholder="Title, author, or topic..."
                placeholderTextColor={Palette.mutedStrong}
                returnKeyType="search"
                onSubmitEditing={() => void searchBooks()}
                accessibilityLabel="Search online books"
              />
              <TouchableOpacity style={styles.searchButton} onPress={() => void searchBooks()} disabled={loading || !query.trim()} accessibilityRole="button">
                <Ionicons name="arrow-forward" size={19} color={Palette.surface} />
              </TouchableOpacity>
            </View>
            <View style={styles.filterRow}>
              {(['partial', 'free-ebooks'] as const).map((option) => {
                const selected = filter === option;
                return (
                  <TouchableOpacity
                    key={option}
                    style={[styles.filterChip, selected && styles.filterChipSelected]}
                    onPress={() => { setFilter(option); if (searched && query.trim()) void searchBooks(option); }}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                  >
                    <Text style={[styles.filterText, selected && styles.filterTextSelected]}>
                      {option === 'partial' ? 'Preview books' : 'Free to read'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {loading ? (
            <View style={styles.messageCard}><ActivityIndicator color={GREEN} /><Text style={styles.messageText}>Looking for books…</Text></View>
          ) : !searched ? (
            <View style={styles.messageCard}>
              <Ionicons name="book-outline" size={36} color={GREEN} />
              <Text style={styles.messageTitle}>Find your next read</Text>
              <Text style={styles.messageText}>Search by book title, author, or a subject you love.</Text>
            </View>
          ) : results.length === 0 ? (
            <View style={styles.messageCard}>
              <Ionicons name="search-outline" size={34} color={GREEN} />
              <Text style={styles.messageTitle}>No books found</Text>
              <Text style={styles.messageText}>Try a different title, author, or topic.</Text>
            </View>
          ) : (
            <View>
              {usingFallback && (
                <View style={styles.fallbackNotice}>
                  <Ionicons name="information-circle-outline" size={18} color={GREEN} />
                  <Text style={styles.fallbackText}>
                    Showing Open Library results. Reading access varies; open a book page to check availability.
                  </Text>
                </View>
              )}
              <Text style={styles.resultsHeading}>{results.length} books to explore</Text>
              {results.map((volume) => {
                const info = volume.volumeInfo;
                if (!info?.title) return null;
                const image = coverUrl(volume);
                const canPreview = Boolean(info.previewLink);
                const fullText = volume.accessInfo?.viewability === 'ALL_PAGES';
                return (
                  <View key={volume.id} style={styles.bookCard}>
                    <View style={styles.bookTop}>
                      <View style={styles.cover}>
                        {image ? <Image source={{ uri: image }} style={styles.coverImage} resizeMode="cover" /> : <Ionicons name="book" size={29} color={GREEN} />}
                      </View>
                      <View style={styles.bookInfo}>
                        <Text style={styles.bookTitle}>{info.title}</Text>
                        <Text style={styles.author}>{info.authors?.join(', ') ?? 'Unknown author'}</Text>
                        {!!info.categories?.[0] && <Text style={styles.genre}>{info.categories[0]}</Text>}
                        <Text style={styles.availability}>{volume.source === 'Open Library' ? 'Open Library' : fullText ? 'Free full book' : canPreview ? 'Preview available' : 'Book details'}</Text>
                      </View>
                    </View>
                    {!!info.description && <Text numberOfLines={3} style={styles.description}>{info.description.replace(/<[^>]*>/g, '')}</Text>}
                    <View style={styles.actions}>
                      <TouchableOpacity style={[styles.readButton, !canPreview && styles.disabledButton]} onPress={() => void readBook(volume)} disabled={!canPreview} accessibilityRole="button">
                        <Ionicons name="book-outline" size={17} color={Palette.surface} />
                        <Text style={styles.readButtonText}>{volume.source === 'Open Library' ? 'Reading options' : fullText ? 'Read online' : 'Google Preview'}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.saveButton} onPress={() => void saveBook(volume)} disabled={savingId === volume.id} accessibilityRole="button">
                        {savingId === volume.id ? <ActivityIndicator size="small" color={GREEN} /> : <Ionicons name="add" size={19} color={GREEN} />}
                        <Text style={styles.saveButtonText}>Add to library</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
              <Text style={styles.attribution}>Book information and reading previews provided by Google Books.</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Palette.page },
  container: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: 16, paddingBottom: 36, gap: 14 },
  backButton: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 7, paddingVertical: 8, paddingHorizontal: 2 },
  backText: { color: GREEN, fontSize: 14, fontWeight: '700' },
  headingCard: { backgroundColor: Palette.surface, borderRadius: 17, borderWidth: 1, borderColor: Palette.border, padding: 17 },
  headingIcon: { width: 43, height: 43, borderRadius: 13, backgroundColor: Palette.brandLight, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  title: { color: Palette.text, fontSize: 25, fontWeight: '800' },
  subtitle: { color: Palette.muted, fontSize: 13, lineHeight: 19, marginTop: 5 },
  searchCard: { backgroundColor: Palette.surface, borderRadius: 16, borderWidth: 1, borderColor: Palette.border, padding: 14 },
  label: { color: Palette.text, fontSize: 14, fontWeight: '800', marginBottom: 9 },
  searchRow: { minHeight: 49, borderRadius: 12, borderWidth: 1, borderColor: Palette.borderStrong, backgroundColor: Palette.surfaceRaised, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 11, gap: 8 },
  input: { flex: 1, color: Palette.text, fontSize: 14, paddingVertical: 10, outlineStyle: 'none' } as any,
  searchButton: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: GREEN },
  filterRow: { flexDirection: 'row', gap: 8, marginTop: 11 },
  filterChip: { borderRadius: 18, borderWidth: 1, borderColor: Palette.borderStrong, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: Palette.surfaceRaised },
  filterChipSelected: { backgroundColor: GREEN, borderColor: GREEN },
  filterText: { color: Palette.mutedDeep, fontSize: 12, fontWeight: '700' },
  filterTextSelected: { color: Palette.surface },
  messageCard: { minHeight: 185, alignItems: 'center', justifyContent: 'center', padding: 22, gap: 8, backgroundColor: Palette.surface, borderRadius: 16, borderWidth: 1, borderColor: Palette.border },
  messageTitle: { color: Palette.text, fontSize: 17, fontWeight: '800', marginTop: 3 },
  messageText: { color: Palette.muted, fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 4 },
  resultsHeading: { color: Palette.text, fontSize: 16, fontWeight: '800', marginBottom: 10 },
  bookCard: { backgroundColor: Palette.surface, borderRadius: 16, borderWidth: 1, borderColor: Palette.border, padding: 13, marginBottom: 11 },
  bookTop: { flexDirection: 'row', gap: 12 },
  cover: { width: 62, height: 84, borderRadius: 8, backgroundColor: Palette.brandLight, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  coverImage: { width: '100%', height: '100%' },
  bookInfo: { flex: 1, paddingTop: 2 },
  bookTitle: { color: Palette.text, fontSize: 15, fontWeight: '800' },
  author: { color: Palette.muted, fontSize: 12, marginTop: 4 },
  genre: { color: Palette.oliveDark, fontSize: 11, marginTop: 4 },
  availability: { alignSelf: 'flex-start', color: GREEN, fontSize: 10, fontWeight: '800', marginTop: 7, backgroundColor: Palette.brandLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 7 },
  description: { color: Palette.muted, fontSize: 12, lineHeight: 17, marginTop: 10 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  readButton: { flex: 1, minHeight: 41, borderRadius: 10, backgroundColor: GREEN, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 5 },
  disabledButton: { opacity: 0.45 },
  readButtonText: { color: Palette.surface, fontSize: 11, fontWeight: '800' },
  saveButton: { flex: 1, minHeight: 41, borderRadius: 10, backgroundColor: Palette.brandLight, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingHorizontal: 5 },
  saveButtonText: { color: GREEN, fontSize: 11, fontWeight: '800' },
  attribution: { textAlign: 'center', color: Palette.muted, fontSize: 10, marginTop: 2 },
  fallbackNotice: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: Palette.surface, borderColor: Palette.border, borderWidth: 1, borderRadius: 11, padding: 10, marginBottom: 11 },
  fallbackText: { flex: 1, color: Palette.mutedDark, fontSize: 11, lineHeight: 16 },
});
