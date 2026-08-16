import { db } from '../../config/database';
import { AppError } from '../../middlewares/errorHandler';
import { assertGroupMember, assertCoachAccess } from '../groups/groupAccess';

interface MovementArrow {
  id?: string | number;
  from: { x: number; y: number };
  to: { x: number; y: number };
  color?: string;
  label?: string;
}

const attachNades = async (tactics: any[]) => {
  if (tactics.length === 0) return tactics;
  const links = await db('tactic_nades')
    .whereIn('tactic_id', tactics.map(t => t.id))
    .orderBy('sort_order', 'asc');

  const nadeIds = [...new Set(links.map(l => l.nade_id))];
  const nades = nadeIds.length > 0 ? await db('nades').whereIn('id', nadeIds) : [];
  const images = nadeIds.length > 0
    ? await db('nade_images').whereIn('nade_id', nadeIds).orderBy('sort_order', 'asc')
    : [];
  const nadesWithImages = nades.map(n => ({ ...n, images: images.filter(i => i.nade_id === n.id) }));

  return tactics.map(t => ({
    ...t,
    nades: links
      .filter(l => l.tactic_id === t.id)
      .map(l => nadesWithImages.find(n => n.id === l.nade_id))
      .filter(Boolean),
  }));
};

export const getTactics = async (groupId: number, userId: number, role: string) => {
  await assertGroupMember(groupId, userId, role);
  const tactics = await db('tactics').where({ group_id: groupId }).orderBy('created_at', 'desc');
  const withNades = await attachNades(tactics);
  return withNades.map(t => ({ ...t, nade_count: t.nades.length }));
};

export const getTacticById = async (id: number, userId: number, role: string) => {
  const tactic = await db('tactics').where({ id }).first();
  if (!tactic) throw new AppError('Tactic not found', 404);
  await assertGroupMember(tactic.group_id, userId, role);
  const [withNades] = await attachNades([tactic]);
  return withNades;
};

const syncNades = async (tacticId: number, nadeIds: number[]) => {
  await db('tactic_nades').where({ tactic_id: tacticId }).delete();
  if (nadeIds.length > 0) {
    await db('tactic_nades').insert(
      nadeIds.map((nadeId, i) => ({ tactic_id: tacticId, nade_id: nadeId, sort_order: i })),
    );
  }
};

export const createTactic = async (groupId: number, userId: number, role: string, dto: {
  title: string; map_name: string; side: string; description?: string;
  movement_arrows?: MovementArrow[]; nade_ids?: number[];
}) => {
  await assertCoachAccess(groupId, userId, role);

  const [tactic] = await db('tactics').insert({
    group_id: groupId,
    coach_id: userId,
    title: dto.title.trim(),
    map_name: dto.map_name.trim(),
    side: dto.side,
    description: dto.description || null,
    movement_arrows: JSON.stringify(dto.movement_arrows || []),
  }).returning('*');

  if (dto.nade_ids && dto.nade_ids.length > 0) {
    await syncNades(tactic.id, dto.nade_ids);
  }
  const [withNades] = await attachNades([tactic]);
  return withNades;
};

export const updateTactic = async (id: number, userId: number, role: string, dto: {
  title?: string; map_name?: string; side?: string; description?: string;
  movement_arrows?: MovementArrow[]; nade_ids?: number[];
}) => {
  const tactic = await db('tactics').where({ id }).first();
  if (!tactic) throw new AppError('Tactic not found', 404);
  await assertCoachAccess(tactic.group_id, userId, role);

  const updates: Record<string, any> = {};
  for (const key of ['title', 'map_name', 'side', 'description'] as const) {
    if (dto[key] !== undefined) updates[key] = dto[key];
  }
  if (dto.movement_arrows !== undefined) {
    updates.movement_arrows = JSON.stringify(dto.movement_arrows);
  }
  const [updated] = await db('tactics').where({ id }).update({ ...updates, updated_at: db.fn.now() }).returning('*');

  if (dto.nade_ids !== undefined) {
    await syncNades(id, dto.nade_ids);
  }
  const [withNades] = await attachNades([updated]);
  return withNades;
};

export const deleteTactic = async (id: number, userId: number, role: string) => {
  const tactic = await db('tactics').where({ id }).first();
  if (!tactic) throw new AppError('Tactic not found', 404);
  await assertCoachAccess(tactic.group_id, userId, role);
  await db('tactics').where({ id }).delete();
  return { message: 'Tactic deleted' };
};
