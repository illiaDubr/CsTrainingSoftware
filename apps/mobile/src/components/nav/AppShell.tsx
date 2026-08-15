import { useState } from 'react';
import {
  View, StyleSheet, TouchableOpacity, Text, Modal, useWindowDimensions,
} from 'react-native';
import { Sidebar, SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH } from './Sidebar';
import { colors } from '../../theme';

/** С этой ширины показываем постоянный сайдбар слева (десктоп) */
export const DESKTOP_BREAKPOINT = 1024;

interface Props {
  children: React.ReactNode;
}

/**
 * Оболочка приложения: на ПК — постоянный сайдбар слева (сворачивается в полоску с иконками),
 * на узком экране — кнопка ☰ и выезжающая шторка поверх контента.
 */
export function AppShell({ children }: Props) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= DESKTOP_BREAKPOINT;

  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (isDesktop) {
    return (
      <View style={styles.desktopRow}>
        <Sidebar
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((v) => !v)}
          showCollapseButton
        />
        <View style={styles.content}>{children}</View>
      </View>
    );
  }

  return (
    <View style={styles.mobileRoot}>
      {children}

      {/* Кнопка меню — справа сверху, чтобы не перекрывать «‹ Назад» на экранах */}
      <TouchableOpacity
        style={styles.menuBtn}
        onPress={() => setDrawerOpen(true)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        activeOpacity={0.8}
      >
        <Text style={styles.menuIcon}>☰</Text>
      </TouchableOpacity>

      <Modal visible={drawerOpen} transparent animationType="fade" onRequestClose={() => setDrawerOpen(false)}>
        <View style={styles.drawerOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setDrawerOpen(false)} />
          <View style={styles.drawer}>
            <Sidebar onNavigate={() => setDrawerOpen(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  desktopRow: { flex: 1, flexDirection: 'row', backgroundColor: colors.bg },
  content: { flex: 1, minWidth: 0 },

  mobileRoot: { flex: 1, backgroundColor: colors.bg },
  menuBtn: {
    position: 'absolute', top: 52, right: 16,
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(21,24,39,0.94)',
    borderWidth: 1, borderColor: colors.border,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 5,
  },
  menuIcon: { color: colors.text, fontSize: 18, marginTop: -2 },

  drawerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', flexDirection: 'row' },
  drawer: { width: SIDEBAR_WIDTH, height: '100%' },
});

export { SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH };
