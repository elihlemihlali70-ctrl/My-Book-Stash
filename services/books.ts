
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const STORAGE_KEY = 'my-book-stash-books';

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
  dateAdded?: string;
};

// Data required when adding a new book.
export type NewBook = Omit<Book, 'id'>;

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

// Read the saved books from device storage or browser storage.
async function readStoredBooks(): Promise<Book[]> {
  try {
    let storedData: string | null = null;

    if (Platform.OS === 'web') {
      if (typeof localStorage === 'undefined') {
        return [];
      }

      storedData = localStorage.getItem(STORAGE_KEY);
    } else {
      storedData = await AsyncStorage.getItem(STORAGE_KEY);
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

// Save books to device storage or browser storage.
async function writeStoredBooks(books: Book[]): Promise<void> {
  const data = JSON.stringify(books);

  try {
    if (Platform.OS === 'web') {
      if (typeof localStorage === 'undefined') {
        throw new Error('Browser storage is unavailable.');
      }

      localStorage.setItem(STORAGE_KEY, data);
    } else {
      await AsyncStorage.setItem(STORAGE_KEY, data);
    }
  } catch (error) {
    console.error('Failed to save books:', error);
    throw error;
  }
}

// Get every saved book.
export async function getBooks(): Promise<Book[]> {
  return readStoredBooks();
}

// Get one book using its ID.
export async function getBookById(
  id: string,
): Promise<Book | undefined> {
  const books = await readStoredBooks();

  return books.find((book) => book.id === id);
}

// Add a new book.
export async function addBook(
  bookData: NewBook,
): Promise<Book> {
  const books = await readStoredBooks();

  const newBook: Book = {
    ...bookData,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    dateAdded: bookData.dateAdded ?? new Date().toISOString(),
  };

  await writeStoredBooks([...books, newBook]);

  return newBook;
}


export async function updateBook(
  id: string,
  updates: Partial<Omit<Book, 'id'>>,
): Promise<Book | null> {
  const books = await readStoredBooks();
  const index = books.findIndex((book) => book.id === id);

  if (index === -1) {
    return null;
  }

  const updatedBook: Book = {
    ...books[index],
    ...updates,
    id: books[index].id,
  };

  const updatedBooks = [...books];
  updatedBooks[index] = updatedBook;

  await writeStoredBooks(updatedBooks);

  return updatedBook;
}

// Delete a book using its ID.
export async function deleteBook(
  id: string,
): Promise<boolean> {
  const books = await readStoredBooks();
  const updatedBooks = books.filter((book) => book.id !== id);

  if (updatedBooks.length === books.length) {
    return false;
  }

  await writeStoredBooks(updatedBooks);

  return true;
}

