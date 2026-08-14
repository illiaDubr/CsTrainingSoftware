import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('nades', (t) => {
    t.string('video_url').nullable();
    t.float('pos_x').nullable(); // 0..1, позиция маркера на фоне карты
    t.float('pos_y').nullable();
  });

  await knex.schema.alterTable('nade_images', (t) => {
    t.string('image_type').notNullable().defaultTo('other'); // position | aim | result | other
  });

  await knex.schema.createTable('map_backgrounds', (t) => {
    t.increments('id').primary();
    t.integer('group_id').references('id').inTable('groups').onDelete('CASCADE').notNullable();
    t.string('map_name').notNullable();
    t.integer('coach_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
    t.string('image_url').notNullable();
    t.timestamps(true, true);
    t.unique(['group_id', 'map_name']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('map_backgrounds');
  await knex.schema.alterTable('nade_images', (t) => {
    t.dropColumn('image_type');
  });
  await knex.schema.alterTable('nades', (t) => {
    t.dropColumn('video_url');
    t.dropColumn('pos_x');
    t.dropColumn('pos_y');
  });
}
