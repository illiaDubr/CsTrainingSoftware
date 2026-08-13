import { db } from '../../config/database';
import { AppError } from '../../middlewares/errorHandler';
import { assertGroupMember, assertCoachAccess } from '../groups/groupAccess';

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
  group_id: m.group_id,
  coach_id: m.coach_id,
  coach_username: m.coach_username ?? undefined,
  map_name: m.map_name,
  start_date: toDateStr(m.start_date),
  end_date: toDateStr(m.end_date),
});

// Активная карта дня конкретной группы (одна на группу)
export const getActiveMap = async (groupId: number, userId: number, role: string) => {
  await assertGroupMember(groupId, userId, role);
  const today = todayDate();

  const map = await db('map_of_day')
    .join('users', 'map_of_day.coach_id', 'users.id')
    .where({ 'map_of_day.group_id': groupId, 'map_of_day.is_active': true })
    .where('map_of_day.start_date', '<=', today)
    .where('map_of_day.end_date', '>=', today)
    .select('map_of_day.*', 'users.username as coach_username')
    .orderBy('map_of_day.created_at', 'desc')
    .first();

  return map ? shapeMap(map) : null;
};

export const createMap = async (groupId: number, userId: number, role: string, dto: {
  map_name: string;
  start_date: string;
  end_date: string;
}) => {
  await assertCoachAccess(groupId, userId, role);

  if (dto.end_date < dto.start_date) {
    throw new AppError('end_date must be after start_date', 400);
  }

  // Одна активная карта на группу — старые деактивируем
  await db('map_of_day')
    .where({ group_id: groupId, is_active: true })
    .update({ is_active: false, updated_at: db.fn.now() });

  const [map] = await db('map_of_day')
    .insert({
      group_id: groupId,
      coach_id: userId,
      map_name: dto.map_name,
      start_date: dto.start_date,
      end_date: dto.end_date,
    })
    .returning('*');

  return shapeMap(map);
};

export const deleteMap = async (id: number, userId: number, role: string) => {
  const map = await db('map_of_day').where({ id }).first();
  if (!map) throw new AppError('Map not found', 404);
  await assertCoachAccess(map.group_id, userId, role);

  await db('map_of_day').where({ id }).update({ is_active: false, updated_at: db.fn.now() });
  return { message: 'Map deactivated' };
};
