import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BooksBackground from '../components/BooksBackground';
import { addBook, getBooks, type Book } from '../services/books';

type BookDetails = Omit<Book, 'id' | 'dateAdded'>;
type OpenLibraryBook = {
  title?: string;
  authors?: { name?: string }[];
  subjects?: { name?: string }[];
  cover?: { large?: string; medium?: string };
};
type GoogleBooksVolume = {
  volumeInfo?: {
    title?: string;
    authors?: string[];
    categories?: string[];
    imageLinks?: { thumbnail?: string; smallThumbnail?: string };
    industryIdentifiers?: { type?: string; identifier?: string }[];
  };
};

function isIsbn13(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  if (!/^97[89]\d{10}$/.test(digits)) return false;

  const sum = digits
    .slice(0, 12)
    .split('')
    .reduce((total, digit, index) => total + Number(digit) * (index % 2 ? 3 : 1), 0);

  return String((10 - (sum % 10)) % 10) === digits[12];
}

function secureImageUrl(url?: string): string | undefined {
  return url?.replace(/^http:/i, 'https:');
}

async function lookupBook(isbn: string): Promise<BookDetails> {
  try {
    const googleResponse = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=isbn%3A${isbn}&maxResults=5`,
    );
    if (googleResponse.ok) {
      const result = (await googleResponse.json()) as {
        items?: GoogleBooksVolume[];
      };
      const exactMatch = result.items?.find((item) =>
        item.volumeInfo?.industryIdentifiers?.some(
          (identifier) => identifier.identifier?.replace(/\D/g, '') === isbn,
        ),
      )?.volumeInfo;

      if (exactMatch?.title) {
        return {
          isbn,
          title: exactMatch.title,
          author: exactMatch.authors?.join(', ') || 'Unknown author',
          genre: exactMatch.categories?.[0],
          coverImage: secureImageUrl(
            exactMatch.imageLinks?.thumbnail ?? exactMatch.imageLinks?.smallThumbnail,
          ),
          isPhysical: true,
          status: 'Want to Read',
        };
      }
    }
  } catch {
    // Try Open Library if Google Books is unavailable.
  }

  const response = await fetch(
    `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&jscmd=data&format=json`,
  );
  if (!response.ok) {
    throw new Error('Book lookup failed. Check your connection and try again.');
  }

  const result = (await response.json()) as Record<string, OpenLibraryBook>;
  const details = result[`ISBN:${isbn}`];
  if (!details?.title) {
    throw new Error('No book details were found for this ISBN. Try adding the book manually.');
  }

  return {
    isbn,
    title: details.title,
    author: details.authors?.map((author) => author.name).filter(Boolean).join(', ') || 'Unknown author',
    genre: details.subjects?.[0]?.name,
    coverImage: secureImageUrl(details.cover?.large ?? details.cover?.medium),
    isPhysical: true,
    status: 'Want to Read',
  };
}

export default function ScanBookScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [processing, setProcessing] = useState(false);
  const [hint, setHint] = useState('Place the ISBN barcode inside the frame.');
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ title: string; duplicate: boolean } | null>(null);
  const handlingScan = useRef(false);

  const handleBarcodeScanned = async ({ data }: BarcodeScanningResult) => {
    if (handlingScan.current || result) return;

    const isbn = data.replace(/\D/g, '');
    if (!isIsbn13(isbn)) {
      setHint('That barcode is not a valid ISBN-13. Try the barcode on the back cover.');
      return;
    }

    handlingScan.current = true;
    setProcessing(true);
    setError('');

    try {
      const existingBook = (await getBooks()).find((book) => book.isbn === isbn);
      if (existingBook) {
        setResult({ title: existingBook.title, duplicate: true });
        return;
      }

      const book = await lookupBook(isbn);
      await addBook(book);
      setResult({ title: book.title, duplicate: false });
    } catch (lookupError) {
      const message = lookupError instanceof Error
        ? lookupError.message
        : 'Could not add this book. Please try again.';
      setError(message);
      handlingScan.current = false;
    } finally {
      setProcessing(false);
    }
  };

  const retryScan = () => {
    setError('');
    setHint('Place the ISBN barcode inside the frame.');
    handlingScan.current = false;
  };

  if (!permission) {
    return (
      <SafeAreaView style={styles.permissionScreen} edges={['top']}>
        <ActivityIndicator size="large" color="#FFFCF4" />
        <Text style={styles.permissionText}>Checking camera permission…</Text>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionScreen} edges={['top']}>
        <Text style={styles.permissionTitle}>Camera access needed</Text>
        <Text style={styles.permissionText}>
          Allow camera access to scan a book’s ISBN barcode.
        </Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => void requestPermission()}>
          <Text style={styles.primaryButtonText}>Allow camera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => router.back()}>
          <Text style={styles.secondaryButtonText}>Cancel</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      {!result ? (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['ean13'] }}
          onBarcodeScanned={processing || error ? undefined : handleBarcodeScanned}
          onMountError={() => setError('Could not start the camera. Check camera access and try again.')}
        />
      ) : <BooksBackground />}

      <SafeAreaView style={styles.overlay} edges={['top']}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.heading}>Scan ISBN barcode</Text>
        </View>

        {result ? (
          <View style={styles.messageCard}>
            <Text style={styles.successTitle}>
              {result.duplicate ? 'Already in your library' : 'Book added'}
            </Text>
            <Text style={styles.messageText}>{result.title}</Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.replace('/(tabs)')}
            >
              <Text style={styles.primaryButtonText}>Back to library</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => {
                setResult(null);
                retryScan();
              }}
            >
              <Text style={styles.secondaryButtonText}>Scan another book</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.scanFrame} />
            <View style={styles.bottomCard}>
              {processing ? (
                <ActivityIndicator color="#FFFCF4" />
              ) : null}
              <Text style={styles.hintText}>
                {processing ? 'Looking up and adding the book…' : error || hint}
              </Text>
              {error ? (
                <View style={styles.errorActions}>
                  <TouchableOpacity style={styles.primaryButton} onPress={retryScan}>
                    <Text style={styles.primaryButtonText}>Try scanning again</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => router.replace('/add-book')}
                  >
                    <Text style={styles.secondaryButtonText}>Add manually</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
          </>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#20291F' },
  permissionScreen: {
    flex: 1,
    backgroundColor: '#334631',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  permissionTitle: { color: '#FFFCF4', fontSize: 22, fontWeight: '800', textAlign: 'center' },
  permissionText: { color: '#ECE6D5', fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: 12 },
  overlay: { flex: 1, justifyContent: 'space-between', padding: 20 },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 8 },
  backButton: { backgroundColor: 'rgba(27, 37, 27, 0.78)', borderRadius: 11, paddingHorizontal: 14, paddingVertical: 10 },
  backButtonText: { color: '#FFFCF4', fontWeight: '700' },
  heading: { color: '#FFFCF4', fontSize: 18, fontWeight: '800', textShadowColor: '#000000', textShadowRadius: 5 },
  scanFrame: {
    width: '86%',
    height: 150,
    alignSelf: 'center',
    borderWidth: 3,
    borderColor: '#FFFCF4',
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  bottomCard: { backgroundColor: 'rgba(27, 37, 27, 0.86)', borderRadius: 18, padding: 18, alignItems: 'center', marginBottom: 12 },
  hintText: { color: '#FFFCF4', fontSize: 15, fontWeight: '600', lineHeight: 22, textAlign: 'center', marginTop: 6 },
  messageCard: { backgroundColor: '#FFFCF4', borderRadius: 20, padding: 22, marginTop: 'auto', marginBottom: 'auto' },
  successTitle: { color: '#30362C', fontSize: 22, fontWeight: '800', textAlign: 'center' },
  messageText: { color: '#55584B', fontSize: 16, textAlign: 'center', marginTop: 10, marginBottom: 18 },
  primaryButton: { minHeight: 48, backgroundColor: '#40533C', borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, marginTop: 12 },
  primaryButtonText: { color: '#FFFCF4', fontSize: 14, fontWeight: '800' },
  secondaryButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, marginTop: 7 },
  secondaryButtonText: { color: '#5F6154', fontSize: 14, fontWeight: '700' },
  errorActions: { width: '100%', marginTop: 5 },
});
