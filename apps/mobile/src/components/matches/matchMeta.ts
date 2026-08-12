import { MatchClass } from '../../types';

export const CLASS_META: Record<MatchClass, { label: string; icon: string; color: string; softColor: string }> = {
  esea: { label: 'ESEA', icon: '🏆', color: '#F59E0B', softColor: 'rgba(245,158,11,0.14)' },
  other: { label: 'Другое', icon: '🎮', color: '#3B82F6', softColor: 'rgba(59,130,246,0.14)' },
};
