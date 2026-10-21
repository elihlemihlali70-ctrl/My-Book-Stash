import { StyleSheet } from 'react-native';
import { Palette, Radii, Spacing, TypeScale } from './theme';

/** Shared layout and component styles for consistent screens and forms. */
export const GlobalStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Palette.page,
  },
  pageContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  card: {
    backgroundColor: Palette.surface,
    borderColor: Palette.border,
    borderWidth: 1,
    borderRadius: Radii.lg,
  },
  sectionTitle: {
    color: Palette.text,
    fontSize: TypeScale.section,
    fontWeight: '800',
  },
  bodyText: {
    color: Palette.muted,
    fontSize: TypeScale.body,
    lineHeight: 21,
  },
  fieldLabel: {
    color: Palette.text,
    fontSize: TypeScale.caption,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  textInput: {
    minHeight: 50,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Palette.borderStrong,
    backgroundColor: Palette.surfaceRaised,
    color: Palette.text,
    fontSize: TypeScale.body,
  },
  primaryButton: {
    minHeight: 52,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radii.md,
    backgroundColor: Palette.brand,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  primaryButtonText: {
    color: Palette.surface,
    fontSize: TypeScale.body,
    fontWeight: '800',
  },
});
