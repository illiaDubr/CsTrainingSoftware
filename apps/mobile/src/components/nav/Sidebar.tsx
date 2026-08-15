import { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator,
} from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { logout } from '../../store/slices/authSlice';
import { authService } from '../../services/authService';
import { groupsService } from '../../services/groupsService';
import { Group } from '../../types';
import { colors, radius } from '../../theme';

export const SIDEBAR_WIDTH = 250;
export const SIDEBAR_COLLAPSED_WIDTH = 64;

/** Разделы внутри команды. Тренировки и материалы временно скрыты — см. экран группы */
const GROUP_SECTIONS = [
  { key: 'matches', label: 'Матчи', icon: '📅' },
  { key: 'nades', label: 'Раскидки', icon: '💣' },
  { key: 'routines', label: 'Рутина', icon: '🔁' },
  { key: 'tasks', label: 'Задачи', icon: '📋' },
  { key: 'members', label: 'Игроки', icon: '👥' },
  // { key: 'trainings', label: 'Тренировки', icon: '🎯' },
  // { key: 'materials', label: 'Материалы', icon: '📚' },
];

interface Props {
  /** Свёрнутый режим — только иконки (десктоп) */
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  /** Вызывается после перехода — на мобиле закрывает шторку */
  onNavigate?: () => void;
  /** Показывать кнопку сворачивания (только на десктопе) */
  showCollapseButton?: boolean;
}

export function Sidebar({ collapsed, onToggleCollapse, onNavigate, showCollapseButton }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);

  const isCoach = user?.role === 'coach' || user?.role === 'admin';
  const prefix = isCoach ? '/(coach)' : '/(player)';

  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedGroup, setExpandedGroup] = useState<number | null>(null);

  // Список команд: грузим один раз и обновляем при возврате на дашборд
  useEffect(() => {
    let cancelled = false;
    groupsService.getMyGroups()
      .then((list) => { if (!cancelled) setGroups(list); })
      .catch(() => { /* тихо — сайдбар не должен ломать экран */ })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [pathname.endsWith('/dashboard')]);

  // Команда, внутри которой находимся сейчас
  const activeGroupId = useMemo(() => {
    const match = pathname.match(/\/group\/(\d+)/);
    return match ? Number(match[1]) : null;
  }, [pathname]);

  // Автоматически раскрываем активную команду
  useEffect(() => {
    if (activeGroupId) setExpandedGroup(activeGroupId);
  }, [activeGroupId]);

  const go = (route: string) => {
    router.push(route as any);
    onNavigate?.();
  };

  const handleLogout = async () => {
    await authService.logout();
    dispatch(logout());
    onNavigate?.();
    router.replace('/(auth)/login');
  };

  const isActive = (route: string) => {
    const clean = route.replace(/^\/\((coach|player)\)/, '');
    return pathname === clean || pathname.endsWith(clean);
  };

  /** Пункт верхнего уровня */
  const NavRow = ({ icon, label, route, onPress, danger }: {
    icon: string; label: string; route?: string; onPress?: () => void; danger?: boolean;
  }) => {
    const active = route ? isActive(route) : false;
    return (
      <TouchableOpacity
        style={[styles.row, active && styles.rowActive, collapsed && styles.rowCollapsed]}
        onPress={onPress ?? (route ? () => go(route) : undefined)}
        activeOpacity={0.7}
      >
        <Text style={styles.rowIcon}>{icon}</Text>
        {!collapsed ? (
          <Text
            style={[styles.rowLabel, active && styles.rowLabelActive, danger && styles.rowLabelDanger]}
            numberOfLines={1}
          >
            {label}
          </Text>
        ) : null}
        {active && !collapsed ? <View style={styles.activeBar} /> : null}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { width: collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH }]}>
      {/* Шапка */}
      <View style={[styles.header, collapsed && styles.headerCollapsed]}>
        {!collapsed ? (
          <View style={{ flex: 1 }}>
            <Text style={styles.brand}>Los Espada</Text>
            <Text style={styles.brandSub}>{isCoach ? 'Тренер' : 'Игрок'}</Text>
          </View>
        ) : null}
        {showCollapseButton ? (
          <TouchableOpacity onPress={onToggleCollapse} style={styles.collapseBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.collapseIcon}>{collapsed ? '»' : '«'}</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollInner} showsVerticalScrollIndicator={false}>
        <NavRow icon="🏠" label="Главная" route={`${prefix}/dashboard`} />
        {!isCoach ? <NavRow icon="🔁" label="Моя рутина" route={`${prefix}/my-routines`} /> : null}

        {/* Команды */}
        {!collapsed ? <Text style={styles.sectionLabel}>КОМАНДЫ</Text> : <View style={styles.divider} />}

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 12 }} />
        ) : groups.length === 0 ? (
          !collapsed ? <Text style={styles.emptyText}>Команд пока нет</Text> : null
        ) : (
          groups.map((g) => {
            const isExpanded = expandedGroup === g.id;
            const isCurrent = activeGroupId === g.id;
            return (
              <View key={g.id}>
                <TouchableOpacity
                  style={[styles.row, isCurrent && styles.rowActive, collapsed && styles.rowCollapsed]}
                  onPress={() => {
                    if (collapsed) {
                      go(`${prefix}/group/${g.id}`);
                      return;
                    }
                    setExpandedGroup(isExpanded ? null : g.id);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.rowIcon}>👥</Text>
                  {!collapsed ? (
                    <>
                      <Text style={[styles.rowLabel, isCurrent && styles.rowLabelActive]} numberOfLines={1}>
                        {g.name}
                      </Text>
                      <Text style={styles.chevron}>{isExpanded ? '⌄' : '›'}</Text>
                    </>
                  ) : null}
                </TouchableOpacity>

                {/* Разделы команды */}
                {isExpanded && !collapsed ? (
                  <View style={styles.subList}>
                    <TouchableOpacity
                      style={[styles.subRow, isCurrent && pathname.endsWith(`/group/${g.id}`) && styles.subRowActive]}
                      onPress={() => go(`${prefix}/group/${g.id}`)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.subIcon}>🧭</Text>
                      <Text style={styles.subLabel}>Обзор</Text>
                    </TouchableOpacity>

                    {GROUP_SECTIONS.map((s) => {
                      const route = `${prefix}/group/${g.id}/${s.key}`;
                      const active = pathname.includes(`/group/${g.id}/${s.key}`);
                      return (
                        <TouchableOpacity
                          key={s.key}
                          style={[styles.subRow, active && styles.subRowActive]}
                          onPress={() => go(route)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.subIcon}>{s.icon}</Text>
                          <Text style={[styles.subLabel, active && styles.subLabelActive]}>{s.label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : null}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Низ: профиль и выход */}
      <View style={styles.footer}>
        {!isCoach ? <NavRow icon="👤" label="Профиль" route={`${prefix}/profile`} /> : null}
        <NavRow icon="🚪" label="Выйти" onPress={handleLogout} danger />
        {!collapsed && user ? (
          <View style={styles.userChip}>
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>{user.username?.[0]?.toUpperCase()}</Text>
            </View>
            <Text style={styles.userName} numberOfLines={1}>{user.username}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: '100%',
    backgroundColor: '#0E111C',
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 22, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  headerCollapsed: { justifyContent: 'center', paddingHorizontal: 8 },
  brand: { color: colors.primary, fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
  brandSub: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  collapseBtn: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    justifyContent: 'center', alignItems: 'center',
  },
  collapseIcon: { color: colors.textSecondary, fontSize: 13, fontWeight: '700' },

  scroll: { flex: 1 },
  scrollInner: { paddingVertical: 10, paddingHorizontal: 8 },

  sectionLabel: {
    color: colors.textFaint, fontSize: 10, fontWeight: '800', letterSpacing: 0.8,
    paddingHorizontal: 10, marginTop: 16, marginBottom: 6,
  },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 10, marginHorizontal: 8 },
  emptyText: { color: colors.textFaint, fontSize: 12, paddingHorizontal: 10, paddingVertical: 6 },

  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 10,
    borderRadius: radius.md, marginBottom: 2, gap: 10,
  },
  rowCollapsed: { justifyContent: 'center', paddingHorizontal: 0, gap: 0 },
  rowActive: { backgroundColor: colors.primarySoft },
  rowIcon: { fontSize: 16 },
  rowLabel: { color: colors.textSecondary, fontSize: 14, fontWeight: '600', flex: 1 },
  rowLabelActive: { color: colors.primary },
  rowLabelDanger: { color: colors.textMuted },
  activeBar: {
    position: 'absolute', left: 0, top: 8, bottom: 8,
    width: 3, borderRadius: 2, backgroundColor: colors.primary,
  },
  chevron: { color: colors.textFaint, fontSize: 14 },

  subList: { marginLeft: 14, borderLeftWidth: 1, borderLeftColor: colors.border, paddingLeft: 8, marginBottom: 4 },
  subRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 8, paddingHorizontal: 8, borderRadius: radius.sm,
  },
  subRowActive: { backgroundColor: colors.surface },
  subIcon: { fontSize: 13 },
  subLabel: { color: colors.textMuted, fontSize: 13, fontWeight: '500' },
  subLabelActive: { color: colors.text, fontWeight: '700' },

  footer: {
    borderTopWidth: 1, borderTopColor: colors.border,
    padding: 8, paddingBottom: 14,
  },
  userChip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 10, paddingTop: 10, marginTop: 4,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  userAvatar: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primarySoft,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: colors.borderAccent,
  },
  userAvatarText: { color: colors.primary, fontSize: 12, fontWeight: '800' },
  userName: { color: colors.textSecondary, fontSize: 12, flex: 1 },
});
