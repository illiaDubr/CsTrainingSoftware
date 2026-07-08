import { Text, TouchableOpacity, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, radius, shadows } from '../../theme';

interface Props {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'ghost' | 'danger';
  style?: ViewStyle;
}

export function GradientButton({ title, onPress, loading, disabled, variant = 'primary', style }: Props) {
  const inactive = disabled || loading;

  if (variant === 'ghost' || variant === 'danger') {
    const color = variant === 'danger' ? colors.danger : colors.textSecondary;
    const borderColor = variant === 'danger' ? colors.danger : colors.border;
    return (
      <TouchableOpacity
        style={[styles.base, styles.ghost, { borderColor }, inactive && styles.disabled, style]}
        onPress={onPress}
        disabled={inactive}
        activeOpacity={0.7}
      >
        {loading
          ? <ActivityIndicator color={color} />
          : <Text style={[styles.ghostText, { color }]}>{title}</Text>
        }
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={onPress} disabled={inactive} activeOpacity={0.85} style={[inactive && styles.disabled, style]}>
      <LinearGradient
        colors={gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.base, styles.gradient]}
      >
        {loading
          ? <ActivityIndicator color={colors.onPrimary} />
          : <Text style={styles.primaryText}>{title}</Text>
        }
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  gradient: {
    ...shadows.glow,
  },
  primaryText: { color: colors.onPrimary, fontWeight: '800', fontSize: 16, letterSpacing: 0.2 },
  ghost: {
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  ghostText: { fontWeight: '700', fontSize: 15 },
  disabled: { opacity: 0.6 },
});
