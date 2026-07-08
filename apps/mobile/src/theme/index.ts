/**
 * Дизайн-токены CS Training — тёмная тема с янтарным акцентом.
 * Единственный источник правды для цветов, отступов, радиусов и типографики.
 */

export const colors = {
  // Фоновые слои (от глубокого к приподнятому)
  bg: '#0B0D14',
  bgElevated: '#11141F',
  surface: '#151827',
  surfaceHigh: '#1C2135',
  input: '#10131E',

  // Бордеры
  border: '#242A40',
  borderStrong: '#303752',
  borderAccent: 'rgba(245, 158, 11, 0.35)',

  // Акцент (янтарь)
  primary: '#F59E0B',
  primaryBright: '#FBBF24',
  primaryDeep: '#D97706',
  primarySoft: 'rgba(245, 158, 11, 0.14)',
  onPrimary: '#171000',

  // Текст
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#748099',
  textFaint: '#5B677D',

  // Семантика
  success: '#22C55E',
  successSoft: 'rgba(34, 197, 94, 0.14)',
  info: '#3B82F6',
  infoSoft: 'rgba(59, 130, 246, 0.14)',
  danger: '#EF4444',
  dangerSoft: 'rgba(239, 68, 68, 0.14)',

  // Статусы прогресса
  statusPending: '#748099',
  statusInProgress: '#3B82F6',
  statusCompleted: '#22C55E',
  statusOverdue: '#EF4444',
} as const;

export const gradients = {
  primary: ['#FBBF24', '#F59E0B'] as const,
  primaryDeep: ['#F59E0B', '#D97706'] as const,
  surface: ['#1C2135', '#151827'] as const,
  hero: ['#1A1505', '#0B0D14'] as const,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
} as const;

export const typography = {
  h1: { fontSize: 26, fontWeight: '800' as const, color: colors.text, letterSpacing: -0.5 },
  h2: { fontSize: 20, fontWeight: '700' as const, color: colors.text, letterSpacing: -0.3 },
  h3: { fontSize: 16, fontWeight: '700' as const, color: colors.text },
  body: { fontSize: 15, fontWeight: '400' as const, color: colors.text },
  bodySecondary: { fontSize: 14, fontWeight: '400' as const, color: colors.textSecondary },
  caption: { fontSize: 13, fontWeight: '400' as const, color: colors.textSecondary },
  small: { fontSize: 11, fontWeight: '500' as const, color: colors.textMuted },
  label: { fontSize: 12, fontWeight: '600' as const, color: colors.textSecondary, letterSpacing: 0.4, textTransform: 'uppercase' as const },
} as const;

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  glow: {
    shadowColor: '#F59E0B',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  subtle: {
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
} as const;

/** Базовые пресеты для переиспользования в StyleSheet */
export const presets = {
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...shadows.subtle,
  },
  input: {
    backgroundColor: colors.input,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    color: colors.text,
    fontSize: 15,
  },
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
} as const;
