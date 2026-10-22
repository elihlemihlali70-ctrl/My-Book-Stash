import { GlobalStyles } from '../../constants/globalStyles';
import { Palette } from '../../constants/theme';


import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BooksBackground from '../../components/BooksBackground';

import React from 'react';
import {
  deleteBook,
  getBookCover,
  getBooks,
  updateBook,
  type Book,
  type ReadingStatus,
} from '../../services/books';

type BookWithMeta = Book & {
  isFavorite?: boolean;
  rating?: number;
};

type BookUpdate = Partial<Omit<Book, 'id'>> & {
  isFavorite?: boolean;
  rating?: number;
};

const updateBookMeta = async (id: string, updates: BookUpdate) => {
  await updateBook(id, updates as Partial<Omit<Book, 'id'>>);
};

const PURPLE = Palette.brand;
const LIGHT_PURPLE = Palette.brandLight;

const FILTERS: Array<'All' | ReadingStatus | 'Favourites'> = [
  'All',
  'Want to Read',
  'Currently Reading',
  'Completed',
  'Favourites',
];

export default function HomeScreen() {
  const router = useRouter();
  const { addedBookId } = useLocalSearchParams<{ addedBookId?: string }>();

  const [books, setBooks] = useState<BookWithMeta[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] =
    useState<'All' | ReadingStatus | 'Favourites'>('All');
  const [refreshing, setRefreshing] = useState(false);
  const [statusBook, setStatusBook] = useState<Book | null>(null);
  const [savingStatus, setSavingStatus] = useState(false);
  const listRef = useRef<FlatList<BookWithMeta>>(null);
  const pendingAddedBookId = useRef<string | null>(null);
  const handledAddedBookId = useRef<string | null>(null);

  const loadBooks = useCallback(async () => {
    try {
      const result = await getBooks();
      setBooks(result);
    } catch {
      Alert.alert('Error', 'Could not load your books.');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (addedBookId && handledAddedBookId.current !== addedBookId) {
        pendingAddedBookId.current = addedBookId;
        handledAddedBookId.current = addedBookId;
      }
      loadBooks();
    }, [addedBookId, loadBooks])
  );

  const refresh = async () => {
    setRefreshing(true);
    await loadBooks();
    setRefreshing(false);
  };

  const totalBooks = books.length;
  const wantToReadBooks = books.filter(
    (book) => book.status === 'Want to Read'
  ).length;
  const readingBooks = books.filter(
    (book) => book.status === 'Currently Reading'
  ).length;
  const completedBooks = books.filter(
    (book) => book.status === 'Completed'
  ).length;

  const filteredBooks = books.filter((book) => {
    const term = search.trim().toLowerCase();

    const matchesSearch =
      !term ||
      book.title.toLowerCase().includes(term) ||
      book.author.toLowerCase().includes(term) ||
      (book.genre || '').toLowerCase().includes(term);

    const matchesFilter =
      filter === 'All' ||
      (filter === 'Favourites'
        ? Boolean(book.isFavorite)
        : book.status === filter);

    return matchesSearch && matchesFilter;
  });

  useEffect(() => {
    const bookId = pendingAddedBookId.current;
    if (!bookId) return;

    if (!filteredBooks.some((book) => book.id === bookId)) return;

    pendingAddedBookId.current = null;
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: true });
    });
  }, [filteredBooks]);

  const toggleFavorite = async (book: BookWithMeta) => {
    try {
      await updateBookMeta(book.id, {
        isFavorite: !book.isFavorite,
      });
      await loadBooks();
    } catch {
      Alert.alert('Error', 'Could not update favourite.');
    }
  };

  const changeRating = async (book: BookWithMeta, rating: number) => {
    try {
      await updateBookMeta(book.id, {
        rating: book.rating === rating ? undefined : rating,
      });
      await loadBooks();
    } catch {
      Alert.alert('Error', 'Could not update rating.');
    }
  };

  const readOnline = async (book: Book) => {
    if (!book.readingUrl) return;
    try {
      await WebBrowser.openBrowserAsync(book.readingUrl);
    } catch {
      if (Platform.OS === 'web') window.open(book.readingUrl, '_blank', 'noopener,noreferrer');
      else Alert.alert('Could not open book', 'Please try again.');
    }
  };

  const changeStatus = async (status: ReadingStatus) => {
    if (!statusBook || savingStatus) return;

    setSavingStatus(true);
    try {
      await updateBook(statusBook.id, { status });
      setStatusBook(null);
      await loadBooks();
    } catch {
      if (Platform.OS === 'web') {
        window.alert('Could not update book status.');
      } else {
        Alert.alert('Error', 'Could not update book status.');
      }
    } finally {
      setSavingStatus(false);
    }
  };

  const confirmDelete = (book: Book) => {
    const title = 'Delete book';
    const message = `Are you sure you want to delete "${book.title}"?`;

    const removeBook = async () => {
      try {
        await deleteBook(book.id);
        await loadBooks();
      } catch {
        if (Platform.OS === 'web') {
          window.alert('Could not delete this book.');
        } else {
          Alert.alert('Error', 'Could not delete this book.');
        }
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`${title}\n\n${message}`)) {
        void removeBook();
      }
      return;
    }

    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await removeBook();
        },
      },
    ]);
  };

  const renderBook = ({ item }: { item: BookWithMeta }) => {
    const coverImage = getBookCover(item);

    return (
      <View style={styles.bookCard}>
        <View style={styles.bookTop}>
          <View style={styles.cover}>
            {coverImage ? (
              <Image
                source={{ uri: coverImage }}
                style={styles.coverImage}
                resizeMode="cover"
                accessibilityLabel={`Cover of ${item.title}`}
              />
            ) : (
              <Ionicons name="book" size={34} color={PURPLE} />
            )}
          </View>

          <View style={styles.bookInfo}>
            <Text style={styles.bookTitle}>{item.title}</Text>
            <Text style={styles.author}>by {item.author}</Text>

            {!!item.genre && (
              <Text style={styles.genre}>{item.genre}</Text>
            )}

            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{item.status}</Text>
            </View>

            <Text style={styles.bookType}>
              {item.isPhysical ? 'Physical book' : 'Digital book'}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => toggleFavorite(item)}
            style={styles.favoriteButton}
            accessibilityLabel={
              item.isFavorite
                ? 'Remove from favourites'
                : 'Add to favourites'
            }
          >
            <Ionicons
              name={item.isFavorite ? 'heart' : 'heart-outline'}
              size={24}
              color={item.isFavorite ? Palette.favorite : Palette.icon}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.ratingRow}>
          <Text style={styles.ratingLabel}>My rating</Text>
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => changeRating(item, star)}
                accessibilityLabel={`Rate ${star} stars`}
              >
                <Ionicons
                  name={
                    (Number(item.rating) || 0) >= star
                      ? 'star'
                      : 'star-outline'
                  }
                  size={22}
                  color={Palette.brand}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {!!item.notes && (
          <Text style={styles.notes} numberOfLines={2}>
            {item.notes}
          </Text>
        )}

        <View style={styles.bookActions}>
          {!!item.readingUrl && (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => void readOnline(item)}
              accessibilityRole="button"
              accessibilityLabel={`Read ${item.title} online`}
            >
              <Ionicons name="book-outline" size={17} color={PURPLE} />
              <Text style={styles.secondaryButtonText}>Read online</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setStatusBook(item)}
            accessibilityRole="button"
            accessibilityLabel={`Change status for ${item.title}`}
          >
            <Ionicons name="swap-horizontal" size={17} color={PURPLE} />
            <Text style={styles.secondaryButtonText}>Change status</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() =>
              router.push({
                pathname: '/add-book',
                params: { id: item.id },
              })
            }
          >
            <Ionicons name="create-outline" size={17} color={PURPLE} />
            <Text style={styles.secondaryButtonText}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => confirmDelete(item)}
            accessibilityRole="button"
            accessibilityLabel={`Delete ${item.title}`}
          >
            <Ionicons name="trash-outline" size={18} color={Palette.favorite} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[GlobalStyles.screen, styles.container]} edges={['top']}>
      <BooksBackground />
      <FlatList
        ref={listRef}
        data={filteredBooks}
        keyExtractor={(item) => item.id}
        renderItem={renderBook}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={PURPLE}
          />
        }
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <View style={styles.headerCopy}>
                <Text style={styles.greeting}>MY PERSONAL LIBRARY</Text>
                <Text style={styles.heading}>My Book Stash</Text>
                <Text style={styles.subtitle}>
                  Every book has a story.
                </Text>
              </View>

              <View style={styles.headerIcon}>
                <Image
                  source={require('../../assets/images/bookstash-logo.jpg')}
                  style={styles.headerLogo}
                  resizeMode="cover"
                  accessibilityLabel="Book Stash logo"
                />
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Ionicons name="library-outline" size={23} color={PURPLE} />
                <Text style={styles.statNumber}>{totalBooks}</Text>
                <Text style={styles.statLabel}>Total books</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="bookmark-outline" size={23} color={Palette.accentWarm} />
                <Text style={styles.statNumber}>{wantToReadBooks}</Text>
                <Text style={styles.statLabel}>Want to Read</Text>
              </View>

              <View style={styles.statCard}>
                <Ionicons name="book-outline" size={23} color={PURPLE} />
                <Text style={styles.statNumber}>{readingBooks}</Text>
                <Text style={styles.statLabel}>Currently Reading</Text>
              </View>

              <View style={styles.statCard}>
                <Ionicons name="checkmark-circle-outline" size={23} color={Palette.oliveDark} />
                <Text style={styles.statNumber}>{completedBooks}</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
            </View>

            <View style={styles.bookCreationActions}>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => router.push('/add-book')}
                accessibilityRole="button"
              >
                <Ionicons name="book-outline" size={23} color={PURPLE} />
                <Text style={styles.addButtonText}>Add book</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.scanBookButton}
                onPress={() => router.push('/scan-book')}
                accessibilityRole="button"
                accessibilityLabel="Scan a book ISBN"
              >
                <Ionicons name="camera-outline" size={21} color={PURPLE} />
                <Text style={styles.scanBookButtonText}>
                  Scan book
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.quickLinks}>
              <TouchableOpacity
                style={styles.quickLink}
                onPress={() => router.push('/online-books')}
                accessibilityRole="button"
              >
                <Ionicons name="globe-outline" size={22} color={PURPLE} />
                <Text style={styles.quickLinkText}>E-book</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickLink}
                onPress={() => router.push('/(tabs)/statistics')}
              >
                <Ionicons name="stats-chart-outline" size={22} color={PURPLE} />
                <Text style={styles.quickLinkText}>Statistics</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Your collection</Text>

            <View style={styles.searchBox}>
              <Ionicons name="search-outline" size={21} color={Palette.icon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search title, author or genre..."
                placeholderTextColor={Palette.placeholder}
                value={search}
                onChangeText={setSearch}
                autoCapitalize="none"
              />
              {!!search && (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <Ionicons name="close-circle" size={20} color={Palette.icon} />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filters}
            >
              {FILTERS.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.filterChip,
                    filter === option && styles.filterChipActive,
                  ]}
                  onPress={() => setFilter(option)}
                >
                  <Text
                    style={[
                      styles.filterText,
                      filter === option && styles.filterTextActive,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.resultCount}>
              {filteredBooks.length}{' '}
              {filteredBooks.length === 1 ? 'book' : 'books'}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="book-outline" size={52} color={Palette.olive} />
            <Text style={styles.emptyTitle}>No books found</Text>
            <Text style={styles.emptyText}>
              {books.length === 0
                ? 'Add your first book to start building your collection.'
                : 'Try another search or select a different filter.'}
            </Text>
            {books.length === 0 && (
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => router.push('/add-book')}
              >
                <Text style={styles.emptyButtonText}>Add your first book</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      <Modal
        visible={statusBook !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setStatusBook(null)}
      >
        <View style={styles.statusModalOverlay}>
          <View style={styles.statusModal}>
            <Text style={styles.statusModalTitle}>Change reading status</Text>
            <Text style={styles.statusModalSubtitle}>
              {statusBook?.title}
            </Text>

            {(['Want to Read', 'Currently Reading', 'Completed'] as ReadingStatus[]).map((status) => {
              const selected = statusBook?.status === status;
              return (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.statusChoice,
                    selected && styles.statusChoiceSelected,
                  ]}
                  onPress={() => void changeStatus(status)}
                  disabled={savingStatus}
                  accessibilityRole="radio"
                  accessibilityState={{ selected, disabled: savingStatus }}
                >
                  <Text
                    style={[
                      styles.statusChoiceText,
                      selected && styles.statusChoiceTextSelected,
                    ]}
                  >
                    {status}
                  </Text>
                  {selected ? (
                    <Ionicons name="checkmark-circle" size={20} color={PURPLE} />
                  ) : null}
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              style={styles.statusModalCancel}
              onPress={() => setStatusBook(null)}
              disabled={savingStatus}
              accessibilityRole="button"
            >
              <Text style={styles.statusModalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  listContent: {
    padding: 16,
    paddingBottom: 35,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    marginTop: 10,
  },
  headerCopy: {
    flex: 1,
    padding: 14,
    marginRight: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Palette.borderStrong,
    backgroundColor: Palette.surface,
  },
  greeting: {
    color: PURPLE,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  heading: {
    color: Palette.text,
    fontSize: 29,
    fontWeight: '800',
    marginTop: 5,
  },
  subtitle: {
    color: Palette.brandDark,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },
  headerIcon: {
    width: 58,
    height: 58,
    borderRadius: 19,
    overflow: 'hidden',
    backgroundColor: Palette.surfaceWarm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLogo: {
    width: '100%',
    height: '100%',
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: Palette.surface,
    borderRadius: 16,
    paddingVertical: 15,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Palette.border,
  },
  statNumber: {
    color: Palette.text,
    fontSize: 23,
    fontWeight: '800',
    marginTop: 7,
  },
  statLabel: {
    color: Palette.muted,
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
  },
  addButton: {
    flex: 1,
    backgroundColor: LIGHT_PURPLE,
    borderRadius: 14,
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    marginBottom: 13,
    paddingHorizontal: 8,
  },
  bookCreationActions: {
    flexDirection: 'row',
    gap: 10,
  },
  scanBookButton: {
    flex: 1,
    backgroundColor: LIGHT_PURPLE,
    borderRadius: 14,
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginBottom: 13,
    paddingHorizontal: 8,
  },
  scanBookButtonText: {
    color: PURPLE,
    fontSize: 14,
    fontWeight: '700',
  },
  addButtonText: {
    color: PURPLE,
    fontSize: 16,
    fontWeight: '700',
  },
  quickLinks: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 25,
  },
  quickLink: {
    flex: 1,
    backgroundColor: LIGHT_PURPLE,
    borderRadius: 13,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  quickLinkText: {
    color: PURPLE,
    fontSize: 14,
    fontWeight: '700',
  },
  sectionTitle: {
    color: Palette.text,
    fontSize: 21,
    fontWeight: '800',
    marginBottom: 13,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.surface,
    borderRadius: 13,
    paddingHorizontal: 13,
    minHeight: 49,
    borderWidth: 1,
    borderColor: Palette.borderStrong,
    gap: 9,
  },
  searchInput: {
    flex: 1,
    color: Palette.text,
    fontSize: 14,
    paddingVertical: 11,
    outlineStyle: 'none',
  } as any,
  filters: {
    gap: 8,
    paddingTop: 14,
    paddingBottom: 10,
  },
  filterChip: {
    backgroundColor: Palette.surface,
    borderColor: Palette.borderStrong,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 22,
  },
  filterChipActive: {
    backgroundColor: PURPLE,
    borderColor: PURPLE,
  },
  filterText: {
    color: Palette.mutedDark,
    fontSize: 12,
    fontWeight: '600',
  },
  filterTextActive: {
    color: Palette.surface,
  },
  resultCount: {
    color: Palette.brandDark,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10,
    marginTop: 2,
  },
  bookCard: {
    backgroundColor: Palette.surface,
    borderRadius: 18,
    padding: 15,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  bookTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  cover: {
    width: 65,
    height: 88,
    borderRadius: 9,
    backgroundColor: LIGHT_PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverImage: {
    width: '100%',
    height: '100%',
    borderRadius: 9,
  },
  bookInfo: {
    flex: 1,
  },
  bookTitle: {
    color: Palette.text,
    fontSize: 17,
    fontWeight: '800',
  },
  author: {
    color: Palette.muted,
    fontSize: 13,
    marginTop: 4,
  },
  genre: {
    color: Palette.oliveDark,
    fontSize: 12,
    marginTop: 5,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: LIGHT_PURPLE,
    borderRadius: 7,
    paddingHorizontal: 9,
    paddingVertical: 5,
    marginTop: 8,
  },
  statusText: {
    color: PURPLE,
    fontSize: 11,
    fontWeight: '700',
  },
  bookType: {
    color: Palette.mutedLight,
    fontSize: 11,
    marginTop: 6,
  },
  favoriteButton: {
    padding: 3,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  ratingLabel: {
    color: Palette.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  stars: {
    flexDirection: 'row',
    gap: 3,
  },
  notes: {
    color: Palette.mutedLight,
    fontSize: 12,
    marginTop: 12,
    lineHeight: 18,
  },
  bookActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: Palette.border,
    paddingTop: 12,
    marginTop: 14,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 38,
    borderRadius: 9,
    backgroundColor: Palette.surfaceWarm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 6,
  },
  secondaryButtonText: {
    color: PURPLE,
    fontSize: 11,
    fontWeight: '700',
  },
  statusModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(35, 48, 38, 0.42)',
    justifyContent: 'center',
    padding: 24,
  },
  statusModal: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    backgroundColor: Palette.surface,
    borderRadius: 20,
    padding: 20,
  },
  statusModalTitle: {
    color: Palette.text,
    fontSize: 19,
    fontWeight: '800',
  },
  statusModalSubtitle: {
    color: Palette.muted,
    fontSize: 13,
    marginTop: 5,
    marginBottom: 15,
  },
  statusChoice: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: Palette.borderStrong,
    borderRadius: 12,
    paddingHorizontal: 14,
    marginTop: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Palette.surface,
  },
  statusChoiceSelected: {
    borderColor: PURPLE,
    backgroundColor: Palette.surfaceWarm,
  },
  statusChoiceText: {
    color: Palette.mutedDark,
    fontSize: 14,
    fontWeight: '600',
  },
  statusChoiceTextSelected: {
    color: PURPLE,
    fontWeight: '800',
  },
  statusModalCancel: {
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  statusModalCancelText: {
    color: Palette.muted,
    fontSize: 14,
    fontWeight: '700',
  },
  deleteButton: {
    width: 38,
    height: 38,
    borderRadius: 9,
    backgroundColor: Palette.dangerSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingVertical: 35,
    backgroundColor: Palette.surface,
    borderRadius: 16,
    marginTop: 10,
  },
  emptyTitle: {
    color: Palette.text,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 12,
  },
  emptyText: {
    color: Palette.muted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 7,
  },
  emptyButton: {
    backgroundColor: PURPLE,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 16,
  },
  emptyButtonText: {
    color: Palette.surface,
    fontSize: 13,
    fontWeight: '700',
  },
});
