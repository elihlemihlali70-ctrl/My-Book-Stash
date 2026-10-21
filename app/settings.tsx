import { Palette } from '../constants/theme';
import { GlobalStyles } from '../constants/globalStyles';

import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import BooksBackground from '../components/BooksBackground';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getBooks, type Book } from '../services/books';

const PURPLE = Palette.brand;
const LIGHT_PURPLE = Palette.brandLight;
const BACKGROUND = Palette.page;
const TEXT = Palette.text;
const MUTED = Palette.muted;

export default function SettingsScreen() {
  const router = useRouter();

  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadBooks = useCallback(async () => {
    try {
      const savedBooks = await getBooks();
      setBooks(Array.isArray(savedBooks) ? savedBooks : []);
    } catch (error) {
      console.error('Error loading library settings:', error);

      Alert.alert(
        'Unable to load library',
        'Your book information could not be loaded. Please try again.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadBooks();
    }, [loadBooks]),
  );

  const totalBooks = books.length;

  const currentlyReading = books.filter(
    (book) => book.status === 'Currently Reading',
  ).length;

  const completedBooks = books.filter(
    (book) => book.status === 'Completed',
  ).length;

  const wantToRead = books.filter(
    (book) => book.status === 'Want to Read',
  ).length;

  const handleRefresh = async () => {
    if (refreshing) return;

    setRefreshing(true);
    await loadBooks();
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  return (
    <SafeAreaView style={[GlobalStyles.screen, styles.safeArea]} edges={['top']}>
      <BooksBackground />
      <StatusBar barStyle="dark-content" backgroundColor={BACKGROUND} />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={PURPLE}
            colors={[PURPLE]}
          />
        }
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text style={styles.backArrow}>‹</Text>
          </TouchableOpacity>

          <View style={styles.headerText}>
            <Text style={styles.title}>Settings</Text>
            <Text style={styles.subtitle}>
              Manage your personal library
            </Text>
          </View>
        </View>

        <View style={styles.welcomeCard}>
          <View style={styles.welcomeIcon}>
            <Text style={styles.bookEmoji}>📚</Text>
          </View>

          <View style={styles.welcomeText}>
            <Text style={styles.welcomeTitle}>My Book Stash</Text>
            <Text style={styles.welcomeSubtitle}>
              Your books, your reading journey.
            </Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Library Overview</Text>
          <Text style={styles.sectionCaption}>Your collection</Text>
        </View>

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={PURPLE} />
            <Text style={styles.loadingText}>
              Loading your library...
            </Text>
          </View>
        ) : (
          <View style={styles.statsCard}>
            <View style={styles.totalRow}>
              <View>
                <Text style={styles.totalLabel}>Total Books</Text>
                <Text style={styles.totalNumber}>{totalBooks}</Text>
              </View>

              <View style={styles.totalIcon}>
                <Text style={styles.statEmoji}>📖</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.statRow}>
              <View style={styles.statLeft}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: Palette.accent },
                  ]}
                />
                <Text style={styles.statLabel}>Want to Read</Text>
              </View>
              <Text style={styles.statValue}>{wantToRead}</Text>
            </View>

            <View style={styles.statRow}>
              <View style={styles.statLeft}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: PURPLE },
                  ]}
                />
                <Text style={styles.statLabel}>Currently Reading</Text>
              </View>
              <Text style={styles.statValue}>{currentlyReading}</Text>
            </View>

            <View style={styles.statRow}>
              <View style={styles.statLeft}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: Palette.oliveDark },
                  ]}
                />
                <Text style={styles.statLabel}>Completed</Text>
              </View>
              <Text style={styles.statValue}>{completedBooks}</Text>
            </View>
          </View>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Library Management</Text>
        </View>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={handleRefresh}
          disabled={refreshing || loading}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel="Refresh library"
        >
          <View style={styles.actionIcon}>
            <Text style={styles.actionEmoji}>🔄</Text>
          </View>

          <View style={styles.actionText}>
            <Text style={styles.actionTitle}>Refresh Library</Text>
            <Text style={styles.actionSubtitle}>
              Reload your saved book information
            </Text>
          </View>

          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Reading Preferences</Text>
        </View>

        <View style={styles.preferenceCard}>
          <View style={styles.actionIcon}>
            <Text style={styles.actionEmoji}>📕</Text>
          </View>

          <View style={styles.actionText}>
            <Text style={styles.actionTitle}>Reading Statuses</Text>
            <Text style={styles.actionSubtitle}>
              Track books you want to read, are reading, or have completed.
            </Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>About</Text>
        </View>

        <View style={styles.aboutCard}>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Application</Text>
            <Text style={styles.aboutValue}>My Book Stash</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Version</Text>
            <Text style={styles.aboutValue}>1.0.0</Text>
          </View>

          <View style={styles.divider} />

          <Text style={styles.aboutDescription}>
            A personal library app for keeping track of your physical books
            and managing your reading progress.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.homeButton}
          onPress={handleBack}
          activeOpacity={0.8}
          accessibilityRole="button"
        >
          <Text style={styles.homeButtonText}>Back to Library</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>
          Made for readers, one book at a time.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 36,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  backArrow: {
    color: PURPLE,
    fontSize: 34,
    lineHeight: 38,
    marginTop: -4,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 27,
    fontWeight: '800',
    color: TEXT,
  },
  subtitle: {
    fontSize: 13,
    color: MUTED,
    marginTop: 4,
  },
  welcomeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PURPLE,
    padding: 20,
    borderRadius: 22,
    marginBottom: 28,
  },
  welcomeIcon: {
    width: 54,
    height: 54,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  bookEmoji: {
    fontSize: 27,
  },
  welcomeText: {
    flex: 1,
  },
  welcomeTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: Palette.surface,
  },
  welcomeSubtitle: {
    fontSize: 12,
    color: Palette.textOnDark,
    marginTop: 5,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: TEXT,
  },
  sectionCaption: {
    fontSize: 12,
    color: MUTED,
  },
  statsCard: {
    backgroundColor: Palette.surface,
    borderRadius: 20,
    padding: 19,
    marginBottom: 26,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
  },
  totalLabel: {
    fontSize: 13,
    color: MUTED,
  },
  totalNumber: {
    fontSize: 34,
    fontWeight: '800',
    color: PURPLE,
    marginTop: 5,
  },
  totalIcon: {
    width: 54,
    height: 54,
    borderRadius: 17,
    backgroundColor: LIGHT_PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statEmoji: {
    fontSize: 25,
  },
  divider: {
    height: 1,
    backgroundColor: Palette.brandLight,
    marginVertical: 12,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9,
  },
  statLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    marginRight: 10,
  },
  statLabel: {
    fontSize: 14,
    color: TEXT,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '800',
    color: TEXT,
  },
  loadingCard: {
    backgroundColor: Palette.surface,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginBottom: 26,
  },
  loadingText: {
    color: MUTED,
    fontSize: 13,
    marginTop: 12,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 26,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  preferenceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 26,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  actionIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: LIGHT_PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },
  actionEmoji: {
    fontSize: 21,
  },
  actionText: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT,
  },
  actionSubtitle: {
    fontSize: 12,
    lineHeight: 18,
    color: MUTED,
    marginTop: 5,
  },
  chevron: {
    fontSize: 27,
    color: PURPLE,
    marginLeft: 8,
  },
  aboutCard: {
    backgroundColor: Palette.surface,
    borderRadius: 18,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  aboutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  aboutLabel: {
    fontSize: 13,
    color: MUTED,
  },
  aboutValue: {
    fontSize: 13,
    fontWeight: '700',
    color: TEXT,
  },
  aboutDescription: {
    fontSize: 13,
    color: MUTED,
    lineHeight: 21,
    marginTop: 5,
  },
  homeButton: {
    backgroundColor: PURPLE,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: Palette.surface,
  },
  footer: {
    fontSize: 12,
    color: MUTED,
    textAlign: 'center',
    marginTop: 20,
  },
});

