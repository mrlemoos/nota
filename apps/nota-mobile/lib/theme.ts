import { StyleSheet } from 'react-native';

/** Calm Nota mobile palette (aligned with web neutrals). */
export const colors = {
  background: '#fafafa',
  surface: '#ffffff',
  foreground: '#111111',
  muted: '#6b6b6b',
  mutedForeground: '#888888',
  border: '#e8e8e8',
  primary: '#111111',
  primaryForeground: '#ffffff',
  destructive: '#b42318',
  link: '#0066cc',
  success: '#2a9d4e',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const typography = StyleSheet.create({
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.foreground,
    letterSpacing: -0.5,
  },
  heading: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.foreground,
  },
  body: {
    fontSize: 16,
    lineHeight: 22,
    color: colors.foreground,
  },
  caption: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.muted,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.foreground,
  },
});

export const sharedStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  surface: {
    backgroundColor: colors.surface,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  primaryButtonText: {
    color: colors.primaryForeground,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    minHeight: 48,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: colors.surface,
    color: colors.foreground,
  },
  disabled: {
    opacity: 0.55,
  },
});
