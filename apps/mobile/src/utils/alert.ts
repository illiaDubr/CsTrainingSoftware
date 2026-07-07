import { Alert, Platform } from 'react-native';

/**
 * Кросс-платформенный alert: Alert.alert на native, window.alert на web
 * (Alert.alert на react-native-web — no-op, сообщения молча теряются).
 */
export function showAlert(title: string, message?: string) {
  if (Platform.OS === 'web') {
    window.alert(message ? `${title}\n\n${message}` : title);
  } else {
    Alert.alert(title, message);
  }
}

/**
 * Кросс-платформенный confirm с деструктивным действием.
 */
export function showConfirm(
  title: string,
  message: string | undefined,
  onConfirm: () => void,
  confirmText = 'Удалить'
) {
  if (Platform.OS === 'web') {
    const ok = window.confirm(message ? `${title}\n\n${message}` : title);
    if (ok) onConfirm();
  } else {
    Alert.alert(title, message, [
      { text: 'Отмена', style: 'cancel' },
      { text: confirmText, style: 'destructive', onPress: onConfirm },
    ]);
  }
}
