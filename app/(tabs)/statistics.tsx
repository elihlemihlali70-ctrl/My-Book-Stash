
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import BooksBackground from '../../components/BooksBackground';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
    getBooks,
    type Book,
} from '../../services/books';

type BookWithInsights = Book & {
  isFavorite?: boolean;
  rating?: number;
};

const COLORS = {
  background: '#F3EBDD',
  purple: '#40533C',
  darkPurple: '#30362C',
  muted: '#777466',
  white: '#FFFCF4',
  border: '#E3DAC8',
  lightPurple: '#E6E5D7',
  track: '#E3DAC8',
  danger: '#B42318',
};

export default function StatisticsScreen() {
  const router = useRouter();

  const [books, setBooks] = useState<BookWithInsights[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadBooks = useCallback(async () => {
    try {
      setError('');

      const result = await getBooks();

      setBooks(Array.isArray(result) ? result : []);
    } catch (err) {
      console.error('Failed to load book statistics:', err);

      setError('Unable to load your books. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadBooks();
    }, [loadBooks]),
  );

  const refreshBooks = useCallback(async () => {
    setRefreshing(true);
    await loadBooks();
  }, [loadBooks]);

  const totalBooks = books.length;

  const wantToRead = books.filter(
    (book) => book.status === 'Want to Read',
  ).length;

  const currentlyReading = books.filter(
    (book) => book.status === 'Currently Reading',
  ).length;

  const completed = books.filter(
    (book) => book.status === 'Completed',
  ).length;

  const physicalBooks = books.filter(
    (book) => book.isPhysical === true,
  ).length;

  const digitalBooks = books.filter(
    (book) => book.isPhysical === false,
  ).length;

  const ratedBooks = books.filter(
    (book) => typeof book.rating === 'number' && Number.isFinite(book.rating),
  );
  const averageRating = ratedBooks.length
    ? ratedBooks.reduce((sum, book) => sum + (book.rating ?? 0), 0) /
      ratedBooks.length
    : null;
  const favouriteBooks = books.filter((book) => book.isFavorite).length;
  const genreCounts = Object.values(
    books.reduce<Record<string, { name: string; count: number }>>(
      (counts, book) => {
        const name = book.genre?.trim();
        if (!name) return counts;

        const key = name.toLocaleLowerCase();
        if (counts[key]) {
          counts[key].count += 1;
        } else {
          counts[key] = { name, count: 1 };
        }
        return counts;
      },
      {},
    ),
  ).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  const physicalPercent = totalBooks
    ? Math.round((physicalBooks / totalBooks) * 100)
    : 0;
  const digitalPercent = totalBooks
    ? Math.round((digitalBooks / totalBooks) * 100)
    : 0;

  const completionRate =
    totalBooks > 0
      ? Math.round((completed / totalBooks) * 100)
      : 0;

  function StatCard({
    title,
    value,
    description,
  }: {
    title: string;
    value: string | number;
    description: string;
  }) {
    return (
      <View style={styles.statCard}>
        <Text style={styles.statTitle}>{title}</Text>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statDescription}>{description}</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.centered} edges={['top']}>
        <BooksBackground />
        <ActivityIndicator size="large" color={COLORS.purple} />
        <Text style={styles.loadingText}>
          Loading statistics...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <BooksBackground />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshBooks}
            tintColor={COLORS.purple}
            colors={[COLORS.purple]}
          />
        }
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.replace('/(tabs)')}
            accessibilityRole="button"
            accessibilityLabel="Back to library"
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>

          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>MY BOOK STASH</Text>

            <Text style={styles.heading}>
              Reading Statistics
            </Text>

            <Text style={styles.subtitle}>
              Explore your collection at a glance.
            </Text>
          </View>

        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>

            <TouchableOpacity
              onPress={() => {
                void loadBooks();
              }}
              accessibilityRole="button"
            >
              <Text style={styles.retryText}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>TOTAL BOOKS</Text>

          <Text style={styles.heroNumber}>{totalBooks}</Text>

          <Text style={styles.heroDescription}>
            Books saved in your library
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Reading status</Text>

        <View style={styles.grid}>
          <StatCard
            title="Want to Read"
            value={wantToRead}
            description="Books on your list"
          />

          <StatCard
            title="Currently Reading"
            value={currentlyReading}
            description="Books in progress"
          />

          <StatCard
            title="Completed"
            value={completed}
            description="Books finished"
          />

          <StatCard
            title="Completion Rate"
            value={`${completionRate}%`}
            description="Of all saved books"
          />
        </View>

        <Text style={styles.sectionTitle}>Your collection</Text>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View>
              <Text style={styles.summaryLabel}>Physical books</Text>
              <Text style={styles.summaryHint}>{physicalPercent}% of collection</Text>
            </View>
            <Text style={styles.summaryValue}>{physicalBooks}</Text>
          </View>

          <View style={styles.separator} />

          <View style={styles.summaryRow}>
            <View>
              <Text style={styles.summaryLabel}>Digital books</Text>
              <Text style={styles.summaryHint}>{digitalPercent}% of collection</Text>
            </View>
            <Text style={styles.summaryValue}>{digitalBooks}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Reading insights</Text>

        <View style={styles.grid}>
          <StatCard
            title="Average rating"
            value={averageRating === null ? '—' : `${averageRating.toFixed(1)} / 5`}
            description={`${ratedBooks.length} rated ${ratedBooks.length === 1 ? 'book' : 'books'}`}
          />
          <StatCard
            title="Favourites"
            value={favouriteBooks}
            description="Books you marked as favourites"
          />
        </View>

        <Text style={styles.sectionTitle}>Books by genre</Text>

        <View style={styles.summaryCard}>
          {genreCounts.length ? (
            genreCounts.map((genre, index) => (
              <View key={genre.name.toLocaleLowerCase()}>
                {index > 0 ? <View style={styles.separator} /> : null}
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>{genre.name}</Text>
                  <Text style={styles.summaryValue}>{genre.count}</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.noGenresText}>
              Add genres to your books to see your collection breakdown.
            </Text>
          )}
        </View>

        <Text style={styles.sectionTitle}>Overall progress</Text>

        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>
              Books completed
            </Text>

            <Text style={styles.progressPercent}>
              {completionRate}%
            </Text>
          </View>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${completionRate}%` },
              ]}
            />
          </View>

          <Text style={styles.progressDescription}>
            You have completed {completed} of {totalBooks} books.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/add-book')}
          accessibilityRole="button"
        >
          <Text style={styles.addButtonText}>+ Add a Book</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>
          Your reading journey, one book at a time.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  centered: {
    flex: 1,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#6D6D60',
    fontSize: 14,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
    gap: 12,
  },
  headerCopy: {
    flex: 1,
  },
  eyebrow: {
    color: COLORS.purple,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 8,
  },
  heading: {
    color: COLORS.darkPurple,
    fontSize: 27,
    fontWeight: '800',
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 7,
    maxWidth: 270,
  },
  backButton: {
    backgroundColor: COLORS.lightPurple,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#40533C',
    fontWeight: '700',
  },
  heroCard: {
    backgroundColor: COLORS.purple,
    padding: 24,
    borderRadius: 22,
    marginBottom: 28,
  },
  heroLabel: {
    color: '#ECE6D5',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  heroNumber: {
    color: COLORS.white,
    fontSize: 48,
    fontWeight: '800',
    marginTop: 8,
  },
  heroDescription: {
    color: '#ECE6D5',
    fontSize: 14,
    marginTop: 4,
  },
  sectionTitle: {
    color: COLORS.darkPurple,
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 28,
  },
  statCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 16,
    width: '48%',
    flexGrow: 1,
    flexBasis: '40%',
    minHeight: 125,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statTitle: {
    color: '#777466',
    fontSize: 12,
    fontWeight: '600',
  },
  statValue: {
    color: '#30362C',
    fontSize: 28,
    fontWeight: '800',
    marginTop: 10,
  },
  statDescription: {
    color: '#898575',
    fontSize: 11,
    marginTop: 5,
  },
  summaryCard: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 28,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 17,
    gap: 12,
  },
  summaryLabel: {
    color: '#777466',
    fontSize: 14,
    flexShrink: 1,
  },
  summaryValue: {
    color: '#30362C',
    fontSize: 15,
    fontWeight: '800',
  },
  summaryHint: {
    color: '#898575',
    fontSize: 11,
    marginTop: 4,
  },
  noGenresText: {
    color: '#777466',
    fontSize: 13,
    lineHeight: 19,
    paddingVertical: 17,
  },
  separator: {
    height: 1,
    backgroundColor: '#F2ECDD',
  },
  progressCard: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 24,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  progressTitle: {
    color: '#30362C',
    fontSize: 14,
    fontWeight: '700',
  },
  progressPercent: {
    color: COLORS.purple,
    fontSize: 17,
    fontWeight: '800',
  },
  progressTrack: {
    height: 10,
    borderRadius: 10,
    backgroundColor: COLORS.track,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.purple,
    borderRadius: 10,
  },
  progressDescription: {
    color: '#898575',
    fontSize: 12,
    marginTop: 12,
  },
  addButton: {
    backgroundColor: COLORS.purple,
    borderRadius: 15,
    padding: 17,
    alignItems: 'center',
  },
  addButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '800',
  },
  footer: {
    color: '#898575',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 22,
  },
  errorBox: {
    backgroundColor: '#FFF0F0',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 14,
  },
  retryText: {
    color: COLORS.purple,
    fontWeight: '800',
    marginTop: 10,
  },
});
