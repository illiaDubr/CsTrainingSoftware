import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('group_members', (t) => {
    t.boolean('is_assistant_coach').notNullable().defaultTo(false);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('group_members', (t) => {
    t.dropColumn('is_assistant_coach');
  });
}
