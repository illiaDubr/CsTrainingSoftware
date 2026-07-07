export const API_URL = 'https://melodious-blessing-production.up.railway.app/api';

export type InGameRole = 'captain' | 'entry' | 'anchor' | 'rifler' | 'support';

export const PLAYER_ROLES: { value: InGameRole; label: string }[] = [
  { value: 'captain', label: 'Капитан' },
  { value: 'entry', label: 'Энтри' },
  { value: 'anchor', label: 'Опорник' },
  { value: 'rifler', label: 'Рифлер' },
  { value: 'support', label: 'Сапорт' },
];

export const ROLE_LABELS: Record<string, string> = Object.fromEntries(
  PLAYER_ROLES.map((r) => [r.value, r.label])
);
