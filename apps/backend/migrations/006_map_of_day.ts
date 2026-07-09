import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('map_of_day', (t) => {
    t.increments('id').primary();
    t.integer('coach_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
    t.string('map_name').notNullable();
    t.date('start_date').notNullable();
    t.date('end_date').notNullable();
    t.boolean('is_active').defaultTo(true);
    t.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('map_of_day');
}
