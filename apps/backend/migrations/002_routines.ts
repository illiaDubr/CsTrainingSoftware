import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('routines', (t) => {
    t.increments('id').primary();
    t.integer('group_id').references('id').inTable('groups').onDelete('CASCADE');
    t.integer('coach_id').references('id').inTable('users').onDelete('SET NULL').nullable();
    t.string('title').notNullable();
    t.text('description').nullable();
    t.enum('priority', ['low', 'medium', 'high']).defaultTo('medium');
    t.boolean('is_active').defaultTo(true);
    t.timestamps(true, true);
  });

  await knex.schema.createTable('routine_progress', (t) => {
    t.increments('id').primary();
    t.integer('routine_id').references('id').inTable('routines').onDelete('CASCADE');
    t.integer('player_id').references('id').inTable('users').onDelete('CASCADE');
    t.date('date').notNullable();
    t.enum('status', ['pending', 'in_progress', 'completed']).defaultTo('pending');
    t.text('note').nullable();
    t.timestamp('completed_at').nullable();
    t.timestamp('updated_at').defaultTo(knex.fn.now());
    t.unique(['routine_id', 'player_id', 'date']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('routine_progress');
  await knex.schema.dropTableIfExists('routines');
}