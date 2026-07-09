import { db } from '../../config/database';
import { AppError } from '../../middlewares/errorHandler';

const todayDate = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const toDateStr = (date: any) => {
  const d = date instanceof Date ? date : new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const shapeMap = (m: any) => ({
  id: m.id,
  coach_id: m.coach_id,
  coach_username: m.coach_username ?? undefined,
  map_name: m.map_name,
  start_date: toDateStr(m.start_date),
  end_date: toDateStr(m.end_date),
});

// Активные карты дня для пользователя:
// тренер — свои; игрок — карты тренеров его групп; admin — все
export const getActiveMaps = async (userId: number, role: string) => {
  const today = todayDate();

  const base = db('map_of_day')
    .join('users', 'map_of_day.coach_id', 'users.id')
    .where('map_of_day.is_active', true)
    .where('map_of_day.start_date', '<=', today)
    .where('map_of_day.end_date', '>=', today)
    .select('map_of_day.*', 'users.username as coach_username')
    .orderBy('map_of_day.created_at', 'desc');

  if (role === 'coach') {
    const maps = await base.andWhere('map_of_day.coach_id', userId);
    return maps.map(shapeMap);
  }

  if (role === 'player') {
    const coachIds = db('group_members')
      .join('groups', 'group_members.group_id', 'groups.id')
      .where('group_members.player_id', userId)
      .select('groups.coach_id');

    const maps = await base.whereIn('map_of_day.coach_id', coachIds);
    return maps.map(shapeMap);
  }

  const maps = await base;
  return maps.map(shapeMap);
};

export const createMap = async (coachId: number, dto: {
  map_name: string;
  start_date: string;
  end_date: string;
}) => {
  if (dto.end_date < dto.start_date) {
    throw new AppError('end_date must be after start_date', 400);
  }

  // Одна активная карта на тренера — старые деактивируем
  await db('map_of_day')
    .where({ coach_id: coachId, is_active: true })
    .update({ is_active: false, updated_at: db.fn.now() });

  const [map] = await db('map_of_day')
    .insert({
      coach_id: coachId,
      map_name: dto.map_name,
      start_date: dto.start_date,
      end_date: dto.end_date,
    })
    .returning('*');

  return shapeMap(map);
};

export const deleteMap = async (id: number, coachId: number) => {
  const map = await db('map_of_day').where({ id, coach_id: coachId }).first();
  if (!map) throw new AppError('Map not found or access denied', 404);

  await db('map_of_day').where({ id }).update({ is_active: false, updated_at: db.fn.now() });
  return { message: 'Map deactivated' };
};
