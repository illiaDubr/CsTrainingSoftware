import { db } from '../../config/database';
import { AppError } from '../../middlewares/errorHandler';

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

export const createTask = async (coachId: number, dto: {
  group_id: number;
  title: string;
  description?: string;
  priority?: string;
  due_date?: string;
}) => {
  // Проверяем что группа принадлежит тренеру
  const group = await db('groups').where({ id: dto.group_id, coach_id: coachId }).first();
  if (!group) throw new AppError('Group not found or access denied', 404);

  const [task] = await db('tasks')
    .insert({
      group_id: dto.group_id,
      coach_id: coachId,
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

export const updateTask = async (id: number, coachId: number, dto: {
  title?: string;
  description?: string;
  priority?: string;
  due_date?: string;
}) => {
  const task = await db('tasks').where({ id, coach_id: coachId }).first();
  if (!task) throw new AppError('Task not found or access denied', 404);

  const [updated] = await db('tasks')
    .where({ id })
    .update({ ...dto, updated_at: db.fn.now() })
    .returning('*');
  return updated;
};

export const deleteTask = async (id: number, coachId: number) => {
  const task = await db('tasks').where({ id, coach_id: coachId }).first();
  if (!task) throw new AppError('Task not found or access denied', 404);

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