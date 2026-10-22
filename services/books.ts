
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { supabase } from '../libnotepad/supabase';

const LEGACY_STORAGE_KEY = 'my-book-stash-books';

// Reading status options used throughout the app.
export type ReadingStatus =
  | 'Want to Read'
  | 'Currently Reading'
  | 'Completed';

// Book structure used by Home, Add Book, Edit Book and Statistics screens.
export type Book = {
  id: string;
  title: string;
  author: string;
  genre?: string;
  status: ReadingStatus;
  isbn?: string;
  notes?: string;
  coverImage?: string;
  readingUrl?: string;
  isPhysical?: boolean;
  isFavorite?: boolean;
  rating?: number;
  dateAdded?: string;
};

// Data required when adding a new book.
export type NewBook = Omit<Book, 'id'>;

type DatabaseBook = {
  id: string;
  user_id: string;
  title: string;
  author: string;
  genre: string | null;
  status: ReadingStatus;
  isbn: string | null;
  notes: string | null;
  cover_image: string | null;
  reading_url: string | null;
  is_physical: boolean;
  is_favorite: boolean;
  rating: number | null;
  date_added: string;
};

async function getRequiredUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  const userId = data.session?.user.id;

  if (!userId) {
    throw new Error('Please sign in to use your cloud library.');
  }

  await migrateLegacyBooks(userId);

  return userId;
}

function fromDatabaseBook(row: DatabaseBook): Book {
  return {
    id: row.id,
    title: row.title,
    author: row.author,
    genre: row.genre ?? undefined,
    status: row.status,
    isbn: row.isbn ?? undefined,
    notes: row.notes ?? undefined,
    coverImage: row.cover_image ?? undefined,
    readingUrl: row.reading_url ?? undefined,
    isPhysical: row.is_physical,
    isFavorite: row.is_favorite,
    rating: row.rating ?? undefined,
    dateAdded: row.date_added,
  };
}

function toDatabaseBookUpdates(updates: Partial<Omit<Book, 'id'>>) {
  const databaseUpdates: Record<string, unknown> = {};

  if ('title' in updates) databaseUpdates.title = updates.title;
  if ('author' in updates) databaseUpdates.author = updates.author;
  if ('genre' in updates) databaseUpdates.genre = updates.genre ?? null;
  if ('status' in updates) databaseUpdates.status = updates.status;
  if ('isbn' in updates) databaseUpdates.isbn = updates.isbn ?? null;
  if ('notes' in updates) databaseUpdates.notes = updates.notes ?? null;
  if ('coverImage' in updates) databaseUpdates.cover_image = updates.coverImage ?? null;
  if ('readingUrl' in updates) databaseUpdates.reading_url = updates.readingUrl ?? null;
  if ('isPhysical' in updates) databaseUpdates.is_physical = updates.isPhysical ?? true;
  if ('isFavorite' in updates) databaseUpdates.is_favorite = updates.isFavorite ?? false;
  if ('rating' in updates) databaseUpdates.rating = updates.rating ?? null;
  if ('dateAdded' in updates) databaseUpdates.date_added = updates.dateAdded ?? new Date().toISOString();

  return databaseUpdates;
}

const BOOK_COVER_OVERRIDES: Record<string, string> = {
  'to the lighthouse|virginia woolf':
    'https://th.bing.com/th/id/R.7725a158c683bc74c733c4e798f0cf2d?rik=c%2bQCWAHxxNCmZA&pid=ImgRaw&r=0',
};

export function getBookCover(
  book: Pick<Book, 'title' | 'author' | 'coverImage'>,
): string | undefined {
  if (book.coverImage?.trim()) {
    return book.coverImage.trim();
  }

  const key = `${book.title.trim().toLocaleLowerCase()}|${book.author
    .trim()
    .toLocaleLowerCase()}`;

  return BOOK_COVER_OVERRIDES[key];
}

// Read the previous local library only for the one-time move into Supabase.
async function readStoredBooks(): Promise<Book[]> {
  try {
    let storedData: string | null = null;

    if (Platform.OS === 'web') {
      if (typeof localStorage === 'undefined') {
        return [];
      }

      storedData = localStorage.getItem(LEGACY_STORAGE_KEY);
    } else {
      storedData = await AsyncStorage.getItem(LEGACY_STORAGE_KEY);
    }

    if (!storedData) {
      return [];
    }

    const parsedData: unknown = JSON.parse(storedData);

    if (!Array.isArray(parsedData)) {
      return [];
    }

    return parsedData.filter((item): item is Book => {
      if (typeof item !== 'object' || item === null) {
        return false;
      }

      const book = item as Record<string, unknown>;

      return (
        typeof book.id === 'string' &&
        typeof book.title === 'string' &&
        typeof book.author === 'string' &&
        (
          book.status === 'Want to Read' ||
          book.status === 'Currently Reading' ||
          book.status === 'Completed'
        )
      );
    });
  } catch (error) {
    console.error('Failed to read books:', error);
    throw error;
  }
}

async function clearLegacyBooks(): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    }
    return;
  }

  await AsyncStorage.removeItem(LEGACY_STORAGE_KEY);
}

const migrationsInProgress = new Map<string, Promise<void>>();

async function migrateLegacyBooks(userId: string): Promise<void> {
  const existingMigration = migrationsInProgress.get(userId);
  if (existingMigration) {
    await existingMigration;
    return;
  }

  const migration = (async () => {
    const localBooks = await readStoredBooks();

    if (localBooks.length === 0) {
      return;
    }

    const rows = localBooks.map((book) => ({
      user_id: userId,
      legacy_id: book.id,
      title: book.title,
      author: book.author,
      genre: book.genre ?? null,
      status: book.status,
      isbn: book.isbn ?? null,
      notes: book.notes ?? null,
      cover_image: book.coverImage ?? null,
      reading_url: book.readingUrl ?? null,
      is_physical: book.isPhysical ?? true,
      is_favorite: book.isFavorite ?? false,
      rating: book.rating ?? null,
      date_added: book.dateAdded ?? new Date().toISOString(),
    }));

    const { error } = await supabase
      .from('books')
      .upsert(rows, {
        onConflict: 'user_id,legacy_id',
        ignoreDuplicates: true,
      });

    if (error) throw error;

    await clearLegacyBooks();
  })();

  migrationsInProgress.set(userId, migration);

  try {
    await migration;
  } finally {
    migrationsInProgress.delete(userId);
  }
}

// Get every saved book.
export async function getBooks(): Promise<Book[]> {
  const userId = await getRequiredUserId();
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('user_id', userId)
    .order('date_added', { ascending: false });

  if (error) throw error;

  return (data as DatabaseBook[] | null ?? []).map(fromDatabaseBook);
}

// Get one book using its ID.
export async function getBookById(
  id: string,
): Promise<Book | undefined> {
  const userId = await getRequiredUserId();
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;

  return data ? fromDatabaseBook(data as DatabaseBook) : undefined;
}

// Add a new book.
export async function addBook(
  bookData: NewBook,
): Promise<Book> {
  const userId = await getRequiredUserId();
  const { data, error } = await supabase
    .from('books')
    .insert({
      user_id: userId,
      title: bookData.title,
      author: bookData.author,
      genre: bookData.genre ?? null,
      status: bookData.status,
      isbn: bookData.isbn ?? null,
      notes: bookData.notes ?? null,
      cover_image: bookData.coverImage ?? null,
      reading_url: bookData.readingUrl ?? null,
      is_physical: bookData.isPhysical ?? true,
      is_favorite: bookData.isFavorite ?? false,
      rating: bookData.rating ?? null,
      date_added: bookData.dateAdded ?? new Date().toISOString(),
    })
    .select('*')
    .single();

  if (error) throw error;

  return fromDatabaseBook(data as DatabaseBook);
}


export async function updateBook(
  id: string,
  updates: Partial<Omit<Book, 'id'>>,
): Promise<Book | null> {
  const userId = await getRequiredUserId();
  const { data, error } = await supabase
    .from('books')
    .update(toDatabaseBookUpdates(updates))
    .eq('id', id)
    .eq('user_id', userId)
    .select('*')
    .maybeSingle();

  if (error) throw error;

  return data ? fromDatabaseBook(data as DatabaseBook) : null;
}

// Delete a book using its ID.
export async function deleteBook(
  id: string,
): Promise<boolean> {
  const userId = await getRequiredUserId();
  const { data, error } = await supabase
    .from('books')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
    .select('id');

  if (error) throw error;

  return (data?.length ?? 0) > 0;
}

