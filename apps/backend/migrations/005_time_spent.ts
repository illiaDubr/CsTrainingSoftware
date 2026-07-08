import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('routine_progress', (t) => {
    t.integer('time_spent_minutes').nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('routine_progress', (t) => {
    t.dropColumn('time_spent_minutes');
  });
}
