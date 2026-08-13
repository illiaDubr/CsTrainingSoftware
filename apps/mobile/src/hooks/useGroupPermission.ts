import { useEffect, useState } from 'react';
import { useAppSelector } from './useAppDispatch';
import { groupsService } from '../services/groupsService';

/**
 * Определяет, есть ли у текущего пользователя тренерские права в конкретной группе:
 * либо он реальный тренер группы, либо назначен помощником тренера.
 * Помощник — это игрок (role: 'player'), которому тренер выдал права в рамках одной группы.
 */
export function useGroupPermission(groupId: number | undefined) {
  const user = useAppSelector((s) => s.auth.user);
  const [isAssistant, setIsAssistant] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!groupId || !user) {
      setLoaded(true);
      return;
    }

    if (user.role === 'coach' || user.role === 'admin') {
      setLoaded(true);
      return;
    }

    setLoaded(false);
    groupsService.getGroupById(groupId)
      .then((group) => {
        if (cancelled) return;
        const me = group.members?.find((m: any) => m.id === user.id);
        setIsAssistant(!!me?.is_assistant_coach);
      })
      .catch(() => {
        // тихо — считаем, что прав нет
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });

    return () => { cancelled = true; };
  }, [groupId, user?.id, user?.role]);

  const isRealCoach = user?.role === 'coach' || user?.role === 'admin';
  const canManage = isRealCoach || isAssistant;
  const pathPrefix = isRealCoach ? '/(coach)' : '/(player)';

  return { canManage, isAssistant, isRealCoach, loaded, pathPrefix };
}
