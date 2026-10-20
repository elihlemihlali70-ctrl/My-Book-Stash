import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type AuthMode = 'signup' | 'signin';

export default function BookstashAuthScreen() {
  const [mode, setMode] = useState<AuthMode>('signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const isSignUp = mode === 'signup';

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setMessage('');
  }

  function handleSubmit() {
    if (isSignUp && name.trim().length < 2) {
      setMessage('Add your name so we know what to call you.');
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setMessage('Enter a valid email address to continue.');
      return;
    }

    if (password.length < 8) {
      setMessage('Your password needs at least 8 characters.');
      return;
    }

    setMessage(
      isSignUp
        ? 'Your details look good. Connect an auth provider to create your account.'
        : 'Your details look good. Connect an auth provider to sign in.',
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <View style={styles.brandRow}>
              <View style={styles.brandMark}>
                <Text style={styles.brandMarkText}>b</Text>
              </View>
              <Text style={styles.brandName}>bookstash</Text>
              <View style={styles.brandDots}>
                <View style={[styles.dot, { backgroundColor: '#B56E24' }]} />
                <View style={[styles.dot, { backgroundColor: '#D38B55' }]} />
                <View style={[styles.dot, { backgroundColor: '#E7B99A' }]} />
              </View>
            </View>

            <Text style={styles.heroTitle}>
              A little space{ '\n' }for your next <Text style={styles.heroTitleAccent}>big story.</Text>
            </Text>
            <Text style={styles.heroSubtitle}>
              Keep the books you love close, and make room for the ones you haven’t met yet.
            </Text>

            <View accessible={false} style={styles.booksIllustration}>
              <Text style={styles.sparkle}>✳</Text>
              <View style={[styles.book, styles.bookOne]}>
                <View style={[styles.bookSpine, { backgroundColor: '#6B3424' }]} />
                <Text style={styles.bookTitleLight}>THE{ '\n' }GARDEN</Text>
                <View style={styles.bookRuleLight} />
              </View>
              <View style={[styles.book, styles.bookTwo]}>
                <View style={[styles.bookSpine, { backgroundColor: '#D19643' }]} />
                <Text style={styles.bookTitleDark}>FIELD{ '\n' }NOTES</Text>
                <View style={styles.bookRuleDark} />
              </View>
              <View style={[styles.book, styles.bookThree]}>
                <View style={[styles.bookSpine, { backgroundColor: '#5b7e5e' }]} />
                <Text style={styles.bookTitleLight}>CHAPTER{ '\n' }ONE</Text>
                <View style={styles.bookRuleLight} />
              </View>
              <View style={styles.openBook}>
                <Text style={styles.openBookEmoji}>📖</Text>
              </View>
              <Text style={styles.tinyStar}>✦</Text>
            </View>
            <Text style={styles.illustrationCaption}>YOUR SHELF, YOUR STORIES</Text>
          </View>

          <View style={styles.formPanel}>
            <View style={styles.panelTopRow}>
              <View style={styles.panelDots}>
                <View style={[styles.dot, { backgroundColor: '#F6C79F' }]} />
                <View style={[styles.dot, { backgroundColor: '#E9AA7D' }]} />
                <View style={[styles.dot, { backgroundColor: '#a89e97' }]} />
              </View>
              <Text style={styles.panelDoodle}>✧</Text>
            </View>

            <Text style={styles.formTitle}>{isSignUp ? 'Sign up' : 'Welcome back'}</Text>
            <Text style={styles.formSubtitle}>
              {isSignUp ? 'Start building your own little library.' : 'Your next chapter starts here.'}
            </Text>

            {isSignUp ? (
              <AuthField
                label="Name"
                value={name}
                onChangeText={(value) => {
                  setName(value);
                  setMessage('');
                }}
                placeholder="What should we call you?"
                autoComplete="name"
                textContentType="name"
                returnKeyType="next"
              />
            ) : null}

            <AuthField
              label="Email"
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                setMessage('');
              }}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
            />

            <View style={styles.passwordHeading}>
              <Text style={styles.fieldLabel}>Password</Text>
              {!isSignUp ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setMessage('Password reset will be available when authentication is connected.')}
                  hitSlop={8}>
                  <Text style={styles.forgotText}>Forgot password?</Text>
                </Pressable>
              ) : null}
            </View>
            <View style={styles.passwordInputWrap}>
              <TextInput
                value={password}
                onChangeText={(value) => {
                  setPassword(value);
                  setMessage('');
                }}
                placeholder="At least 8 characters"
                placeholderTextColor="#B87556"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                textContentType={isSignUp ? 'newPassword' : 'password'}
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
                style={styles.passwordInput}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                onPress={() => setShowPassword((current) => !current)}
                hitSlop={8}>
                <Text style={styles.showPasswordText}>{showPassword ? 'Hide' : 'Show'}</Text>
              </Pressable>
            </View>

            {message ? (
              <Text accessibilityLiveRegion="polite" style={styles.message}>
                {message}
              </Text>
            ) : null}

            <Pressable
              accessibilityRole="button"
              onPress={handleSubmit}
              style={({ pressed }) => [styles.submitButton, pressed && styles.submitButtonPressed]}>
              <Text style={styles.submitButtonText}>{isSignUp ? 'Create my account' : 'Sign in'}</Text>
              <Text style={styles.submitArrow}>→</Text>
            </Pressable>

            <View style={styles.modeSwitchRow}>
              <Text style={styles.modeSwitchText}>
                {isSignUp ? 'Already have an account?' : 'New to Bookstash?'}
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => switchMode(isSignUp ? 'signin' : 'signup')}
                hitSlop={8}>
                <Text style={styles.modeSwitchLink}>{isSignUp ? 'Sign in' : 'Sign up'}</Text>
              </Pressable>
            </View>
            <Text style={styles.footerNote}>MADE FOR THE LOVE OF A GOOD BOOK</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type AuthFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'email-address';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?: 'name' | 'email' | 'new-password' | 'current-password';
  textContentType?: 'name' | 'emailAddress';
  returnKeyType?: 'next' | 'done';
};

function AuthField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  autoCapitalize = 'words',
  autoComplete,
  textContentType,
  returnKeyType,
}: AuthFieldProps) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#B87556"
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete}
        textContentType={textContentType}
        returnKeyType={returnKeyType}
        style={styles.textInput}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F6F1E8',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  hero: {
    minHeight: 400,
    paddingHorizontal: 28,
    paddingTop: 16,
    paddingBottom: 26,
    alignItems: 'center',
    backgroundColor: '#F6F1E8',
  },
  brandRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  brandMark: {
    width: 32,
    height: 32,
    borderWidth: 1.5,
    borderColor: '#6B3F25',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-7deg' }],
  },
  brandMarkText: {
    color: '#6B3F25',
    fontSize: 23,
    lineHeight: 25,
    fontWeight: '700',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
  },
  brandName: {
    color: '#3A281C',
    fontSize: 21,
    letterSpacing: -0.8,
    fontWeight: '700',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
  },
  brandDots: {
    flexDirection: 'row',
    gap: 5,
    marginLeft: 'auto',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  heroTitle: {
    marginTop: 18,
    color: '#35261C',
    textAlign: 'center',
    fontSize: 30,
    lineHeight: 35,
    fontWeight: '700',
    letterSpacing: -0.8,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
  },
  heroTitleAccent: {
    color: '#A5641F',
    fontStyle: 'italic',
  },
  heroSubtitle: {
    maxWidth: 300,
    marginTop: 8,
    color: '#78685B',
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 19,
  },
  booksIllustration: {
    width: 284,
    height: 142,
    marginTop: 13,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  book: {
    position: 'absolute',
    width: 172,
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3B261A',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#54381F',
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 1, height: 3 },
    elevation: 3,
  },
  bookOne: {
    bottom: 7,
    left: 54,
    backgroundColor: '#B86643',
    transform: [{ rotate: '7deg' }],
  },
  bookTwo: {
    bottom: 43,
    left: 57,
    backgroundColor: '#E6C184',
    transform: [{ rotate: '-5deg' }],
  },
  bookThree: {
    bottom: 78,
    left: 62,
    backgroundColor: '#586B54',
    transform: [{ rotate: '2deg' }],
  },
  bookSpine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 17,
  },
  bookTitleLight: {
    color: '#FFF4DB',
    textAlign: 'center',
    fontSize: 8,
    lineHeight: 9,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginLeft: 13,
  },
  bookTitleDark: {
    color: '#533820',
    textAlign: 'center',
    fontSize: 8,
    lineHeight: 9,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginLeft: 13,
  },
  bookRuleLight: {
    position: 'absolute',
    width: 22,
    height: 1,
    bottom: 7,
    backgroundColor: '#E8C99B',
    marginLeft: 13,
  },
  bookRuleDark: {
    position: 'absolute',
    width: 22,
    height: 1,
    bottom: 7,
    backgroundColor: '#7E6040',
    marginLeft: 13,
  },
  sparkle: {
    position: 'absolute',
    top: 14,
    left: 41,
    color: '#B56E24',
    fontSize: 25,
  },
  tinyStar: {
    position: 'absolute',
    right: 27,
    top: 39,
    color: '#B56E24',
    fontSize: 19,
  },
  openBook: {
    position: 'absolute',
    right: 8,
    bottom: 5,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1D6B7',
    borderWidth: 1,
    borderColor: '#DFC19F',
    transform: [{ rotate: '9deg' }],
  },
  openBookEmoji: {
    fontSize: 23,
  },
  illustrationCaption: {
    marginTop: 5,
    color: '#A77B57',
    fontSize: 9,
    letterSpacing: 2.2,
    fontWeight: '700',
  },
  formPanel: {
    flexGrow: 1,
    paddingHorizontal: 27,
    paddingTop: 21,
    paddingBottom: 28,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: '#A56520',
  },
  panelTopRow: {
    height: 23,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  panelDots: {
    flexDirection: 'row',
    gap: 6,
  },
  panelDoodle: {
    color: '#F4C798',
    fontSize: 27,
    lineHeight: 25,
  },
  formTitle: {
    marginTop: 1,
    color: '#FFF9F0',
    fontSize: 35,
    lineHeight: 42,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  formSubtitle: {
    marginTop: 1,
    marginBottom: 17,
    color: '#F9E2CC',
    fontSize: 13,
    lineHeight: 19,
  },
  fieldGroup: {
    marginBottom: 13,
  },
  fieldLabel: {
    marginBottom: 7,
    color: '#FFF5E8',
    fontSize: 14,
    fontWeight: '600',
  },
  textInput: {
    minHeight: 49,
    paddingHorizontal: 17,
    borderRadius: 25,
    backgroundColor: '#F4C2A6',
    color: '#482E20',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
  },
  passwordHeading: {
    marginBottom: 7,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  forgotText: {
    color: '#FFE4C7',
    fontSize: 12,
    fontWeight: '600',
  },
  passwordInputWrap: {
    minHeight: 49,
    paddingLeft: 17,
    paddingRight: 15,
    borderRadius: 25,
    backgroundColor: '#a0d194',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
  },
  passwordInput: {
    flex: 1,
    minHeight: 47,
    paddingVertical: 0,
    color: '#482E20',
    fontSize: 14,
  },
  showPasswordText: {
    paddingVertical: 8,
    paddingLeft: 8,
    color: '#7E4827',
    fontSize: 12,
    fontWeight: '700',
  },
  message: {
    marginTop: 11,
    color: '#FFF0D9',
    fontSize: 12,
    lineHeight: 18,
  },
  submitButton: {
    minHeight: 52,
    marginTop: 20,
    paddingHorizontal: 22,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#FFF7ED',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  submitButtonPressed: {
    backgroundColor: 'rgba(255,247,237,0.14)',
    transform: [{ scale: 0.99 }],
  },
  submitButtonText: {
    color: '#FFF9F0',
    fontSize: 16,
    fontWeight: '700',
  },
  submitArrow: {
    color: '#FFF9F0',
    fontSize: 20,
    lineHeight: 22,
  },
  modeSwitchRow: {
    marginTop: 17,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
  },
  modeSwitchText: {
    color: '#F6DFC9',
    fontSize: 12,
  },
  modeSwitchLink: {
    color: '#FFF9F0',
    fontSize: 12,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
  footerNote: {
    marginTop: 25,
    color: '#F0D0AE',
    textAlign: 'center',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1.7,
  },
});



