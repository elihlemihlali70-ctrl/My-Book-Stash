import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  Image,
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
import { GlobalStyles } from './constants/globalStyles';
import { Palette, Radii } from './constants/theme';

type AuthMode = 'signup' | 'signin';

export default function BookstashAuthScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>('signin');
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

    setMessage('Authentication is not connected yet. You can browse your library as a guest.');
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
              <Image
                source={require('./assets/images/bookstash-logo.jpg')}
                style={styles.brandLogo}
                resizeMode="contain"
                accessibilityLabel="Book Stash logo"
              />
          <Text style={styles.brandName}>My Book Stash</Text>
              <View style={styles.brandDots}>
                <View style={[styles.dot, { backgroundColor: Palette.accentWarm }]} />
                <View style={[styles.dot, { backgroundColor: Palette.accentSoft }]} />
                <View style={[styles.dot, { backgroundColor: Palette.accentPale }]} />
              </View>
            </View>

            <Text style={styles.heroTitle}>
              A little space{ '\n' }for your next <Text style={styles.heroTitleAccent}>big story.</Text>
            </Text>
            <Text style={styles.heroSubtitle}>
              Keep the books you love close, and make room for the ones you haven’t met yet.
            </Text>

            <Image
              accessible={false}
              source={require('./assets/images/bookshelf-background.jpg')}
              style={styles.booksIllustration}
              resizeMode="cover"
            />
            <Text style={styles.illustrationCaption}>YOUR SHELF, YOUR STORIES</Text>
          </View>

          <View style={styles.formPanel}>
            <View style={styles.panelTopRow}>
              <View style={styles.panelDots}>
                <View style={[styles.dot, { backgroundColor: Palette.brandLight }]} />
                <View style={[styles.dot, { backgroundColor: Palette.accent }]} />
                <View style={[styles.dot, { backgroundColor: Palette.mutedStrong }]} />
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
                placeholderTextColor={Palette.accent}
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
                {isSignUp ? 'Already have an account?' : 'New to My Book Stash?'}
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => switchMode(isSignUp ? 'signin' : 'signup')}
                hitSlop={8}>
                <Text style={styles.modeSwitchLink}>{isSignUp ? 'Sign in' : 'Sign up'}</Text>
              </Pressable>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.replace('/(tabs)')}
              style={styles.guestButton}>
              <Text style={styles.guestButtonText}>Continue as a guest</Text>
            </Pressable>
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
        placeholderTextColor={Palette.accent}
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
    ...GlobalStyles.screen,
    flex: 1,
    backgroundColor: Palette.page,
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
    backgroundColor: Palette.page,
  },
  brandRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  brandLogo: {
    width: 42,
    height: 42,
    borderRadius: 10,
  },
  brandName: {
    color: Palette.text,
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
    color: Palette.text,
    textAlign: 'center',
    fontSize: 30,
    lineHeight: 35,
    fontWeight: '700',
    letterSpacing: -0.8,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
  },
  heroTitleAccent: {
    color: Palette.accent,
    fontStyle: 'italic',
  },
  heroSubtitle: {
    maxWidth: 300,
    marginTop: 8,
    color: Palette.muted,
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 19,
  },
  booksIllustration: {
    width: 284,
    height: 142,
    marginTop: 13,
    borderRadius: 16,
    overflow: 'hidden',
  },
  illustrationCaption: {
    marginTop: 5,
    color: Palette.accent,
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
    backgroundColor: Palette.brand,
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
    color: Palette.brandLight,
    fontSize: 27,
    lineHeight: 25,
  },
  formTitle: {
    marginTop: 1,
    color: Palette.surface,
    fontSize: 35,
    lineHeight: 42,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  formSubtitle: {
    marginTop: 1,
    marginBottom: 17,
    color: Palette.textOnDark,
    fontSize: 13,
    lineHeight: 19,
  },
  fieldGroup: {
    marginBottom: 13,
  },
  fieldLabel: {
    marginBottom: 7,
    color: Palette.surface,
    fontSize: 14,
    fontWeight: '600',
  },
  textInput: {
    ...GlobalStyles.textInput,
    minHeight: 49,
    paddingHorizontal: 17,
    borderRadius: Radii.pill,
    backgroundColor: Palette.surfaceWarm,
    color: Palette.text,
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
    color: Palette.textOnDark,
    fontSize: 12,
    fontWeight: '600',
  },
  passwordInputWrap: {
    minHeight: 49,
    paddingLeft: 17,
    paddingRight: 15,
    borderRadius: Radii.pill,
    backgroundColor: Palette.surfaceWarm,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
  },
  passwordInput: {
    flex: 1,
    minHeight: 47,
    paddingVertical: 0,
    color: Palette.text,
    fontSize: 14,
  },
  showPasswordText: {
    paddingVertical: 8,
    paddingLeft: 8,
    color: Palette.brown,
    fontSize: 12,
    fontWeight: '700',
  },
  message: {
    marginTop: 11,
    color: Palette.surface,
    fontSize: 12,
    lineHeight: 18,
  },
  submitButton: {
    ...GlobalStyles.primaryButton,
    minHeight: 52,
    marginTop: 20,
    paddingHorizontal: 22,
    borderRadius: Radii.pill,
    borderWidth: 2,
    borderColor: Palette.surface,
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
    ...GlobalStyles.primaryButtonText,
    color: Palette.surface,
    fontSize: 16,
    fontWeight: '700',
  },
  submitArrow: {
    color: Palette.surface,
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
    color: Palette.textOnDark,
    fontSize: 12,
  },
  modeSwitchLink: {
    color: Palette.surface,
    fontSize: 12,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
  guestButton: {
    alignSelf: 'center',
    marginTop: 17,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  guestButtonText: {
    color: Palette.surface,
    fontSize: 13,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  footerNote: {
    marginTop: 25,
    color: Palette.textOnDark,
    textAlign: 'center',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1.7,
  },
});



