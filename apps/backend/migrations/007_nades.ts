import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('nades', (t) => {
    t.increments('id').primary();
    t.integer('coach_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
    t.string('map_name').notNullable();
    t.enum('side', ['T', 'CT']).notNullable();
    t.enum('category', ['base', 'default', 'extra']).notNullable();
    t.enum('nade_type', ['smoke', 'flash', 'molotov', 'he']).notNullable();
    t.string('title').notNullable();
    t.text('description').nullable();
    t.timestamps(true, true);
  });

  await knex.schema.createTable('nade_images', (t) => {
    t.increments('id').primary();
    t.integer('nade_id').references('id').inTable('nades').onDelete('CASCADE').notNullable();
    t.string('image_url').notNullable();
    t.integer('sort_order').defaultTo(0);
    t.timestamp('created_at').defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('nade_images');
  await knex.schema.dropTableIfExists('nades');
}
