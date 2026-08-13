import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('nades', (t) => {
    t.integer('group_id').references('id').inTable('groups').onDelete('CASCADE').nullable();
  });
  await knex.schema.alterTable('map_of_day', (t) => {
    t.integer('group_id').references('id').inTable('groups').onDelete('CASCADE').nullable();
  });

  // Бэкфилл: если у тренера ровно одна группа — переносим все его гранаты и карты дня в неё.
  // Если групп 0 или несколько — оставляем group_id пустым (записи станут невидимы, пока
  // их не пересоздадут/не привяжут к группе вручную — это редкий edge case для тренеров
  // с несколькими командами на момент миграции).
  const nadeCoaches: { coach_id: number }[] = await knex('nades').distinct('coach_id');
  for (const { coach_id } of nadeCoaches) {
    const groups = await knex('groups').where({ coach_id }).select('id');
    if (groups.length === 1) {
      await knex('nades').where({ coach_id }).update({ group_id: groups[0].id });
    }
  }

  const mapCoaches: { coach_id: number }[] = await knex('map_of_day').distinct('coach_id');
  for (const { coach_id } of mapCoaches) {
    const groups = await knex('groups').where({ coach_id }).select('id');
    if (groups.length === 1) {
      await knex('map_of_day').where({ coach_id }).update({ group_id: groups[0].id });
    }
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('nades', (t) => {
    t.dropColumn('group_id');
  });
  await knex.schema.alterTable('map_of_day', (t) => {
    t.dropColumn('group_id');
  });
}
