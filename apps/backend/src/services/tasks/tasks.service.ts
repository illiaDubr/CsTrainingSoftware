import { db } from '../../config/database';
import { AppError } from '../../middlewares/errorHandler';
import { assertCoachAccess } from '../groups/groupAccess';

export const getTasksByGroup = async (groupId: number, userId: number, role: string) => {
  const tasks = await db('tasks')
    .where({ group_id: groupId })
    .select('*')
    .orderBy('created_at', 'desc');

  if (role === 'player') {
    const progress = await db('task_progress').where({ player_id: userId });
    return tasks.map(task => ({
      ...task,
      progress: progress.find(p => p.task_id === task.id) || { status: 'pending' },
    }));
  }


  

  if (role === 'coach') {
    const progress = await db('task_progress')
      .join('users', 'task_progress.player_id', 'users.id')
      .whereIn('task_id', tasks.map(t => t.id))
      .select('task_progress.*', 'users.username');

    return tasks.map(task => ({
      ...task,
      progress: progress.filter(p => p.task_id === task.id),
    }));
  }

  return tasks;
};

export const getTaskById = async (taskId: number, userId: number, role: string) => {
  const task = await db('tasks').where({ id: taskId }).first();
  if (!task) throw new AppError('Task not found', 404);

  if (role === 'player') {
    const progress = await db('task_progress').where({ task_id: taskId, player_id: userId }).first();
    return { ...task, progress: progress || { status: 'pending' } };
  }

  if (role === 'coach') {
    const progress = await db('task_progress')
      .join('users', 'task_progress.player_id', 'users.id')
      .where({ task_id: taskId })
      .select('task_progress.*', 'users.username');
    return { ...task, progress };
  }

  return task;
};

export const createTask = async (userId: number, role: string, dto: {
  group_id: number;
  title: string;
  description?: string;
  priority?: string;
  due_date?: string;
}) => {
  await assertCoachAccess(dto.group_id, userId, role);
  const group = await db('groups').where({ id: dto.group_id }).first();
  if (!group) throw new AppError('Group not found', 404);

  const [task] = await db('tasks')
    .insert({
      group_id: dto.group_id,
      coach_id: group.coach_id,
      title: dto.title,
      description: dto.description,
      priority: dto.priority || 'medium',
      due_date: dto.due_date || null,
    })
    .returning('*');

  // Создаём запись прогресса для каждого игрока в группе
  const members = await db('group_members').where({ group_id: dto.group_id });
  if (members.length > 0) {
    await db('task_progress').insert(
      members.map(m => ({ task_id: task.id, player_id: m.player_id, status: 'pending' }))
    );
  }

  return task;
};

export const updateTask = async (id: number, userId: number, role: string, dto: {
  title?: string;
  description?: string;
  priority?: string;
  due_date?: string;
}) => {
  const task = await db('tasks').where({ id }).first();
  if (!task) throw new AppError('Task not found', 404);
  await assertCoachAccess(task.group_id, userId, role);

  const [updated] = await db('tasks')
    .where({ id })
    .update({ ...dto, updated_at: db.fn.now() })
    .returning('*');
  return updated;
};

export const deleteTask = async (id: number, userId: number, role: string) => {
  const task = await db('tasks').where({ id }).first();
  if (!task) throw new AppError('Task not found', 404);
  await assertCoachAccess(task.group_id, userId, role);

  await db('tasks').where({ id }).delete();
  return { message: 'Task deleted' };
};

export const updateProgress = async (taskId: number, playerId: number, dto: {
  status: string;
  note?: string;
}) => {
  const progress = await db('task_progress').where({ task_id: taskId, player_id: playerId }).first();
  if (!progress) throw new AppError('Task not assigned to you', 404);

  const completed_at = dto.status === 'completed' ? db.fn.now() : null;

  const [updated] = await db('task_progress')
    .where({ task_id: taskId, player_id: playerId })
    .update({ status: dto.status, note: dto.note, completed_at, updated_at: db.fn.now() })
    .returning('*');
  return updated;
};