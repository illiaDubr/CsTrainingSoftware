import { NadeCategory, NadeSide, NadeType } from '../../types';

export const NADE_TYPE_META: Record<NadeType, { label: string; icon: string; color: string }> = {
  smoke: { label: 'Смоук', icon: '💨', color: '#94A3B8' },
  flash: { label: 'Флешка', icon: '⚡', color: '#FBBF24' },
  molotov: { label: 'Молотов', icon: '🔥', color: '#EF4444' },
  he: { label: 'HE', icon: '💥', color: '#22C55E' },
};

export const SIDE_META: Record<NadeSide, { label: string; color: string }> = {
  T: { label: 'T', color: '#F59E0B' },
  CT: { label: 'CT', color: '#3B82F6' },
};

export const CATEGORY_META: Record<NadeCategory, { label: string; hint: string; icon: string; color: string }> = {
  base: {
    label: 'Обязательные',
    hint: 'База — важные инсты и дефолты, которые знают все без исключений',
    icon: '🎯',
    color: '#EF4444',
  },
  default: {
    label: 'Дефолт LosEspada',
    hint: 'Наш дефолт — знает кэп и минимум 1-2 игрока на 1-2 карты',
    icon: '🛡️',
    color: '#F59E0B',
  },
  extra: {
    label: 'Имбовые (ситуативные)',
    hint: 'Крутые ситуативные гранаты — необязательны, но полезно знать',
    icon: '✨',
    color: '#A78BFA',
  },
};

export const CATEGORY_ORDER: NadeCategory[] = ['base', 'default', 'extra'];
export const NADE_TYPE_ORDER: NadeType[] = ['smoke', 'flash', 'molotov', 'he'];
