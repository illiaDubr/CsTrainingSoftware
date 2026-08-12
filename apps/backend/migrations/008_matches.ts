import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('matches', (t) => {
    t.increments('id').primary();
    t.integer('group_id').references('id').inTable('groups').onDelete('CASCADE').notNullable();
    t.integer('created_by').references('id').inTable('users').onDelete('CASCADE').notNullable();
    t.enum('match_class', ['esea', 'other']).notNullable();
    t.string('opponent').notNullable();
    t.timestamp('scheduled_at').notNullable();
    t.text('note').nullable();
    t.timestamps(true, true);

    t.index(['group_id', 'scheduled_at']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('matches');
}
