import { Knex } from 'knex';

// «Коллы» / тактики раунда: карта из наших раскидок, набор выбранных гранат,
// описание раунда и произвольные векторы движения по мини-карте.
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('tactics', (t) => {
    t.increments('id').primary();
    t.integer('group_id').references('id').inTable('groups').onDelete('CASCADE').notNullable();
    t.integer('coach_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
    t.string('title').notNullable();
    t.string('map_name').notNullable();
    t.enum('side', ['T', 'CT']).notNullable();
    t.text('description').nullable();
    t.jsonb('movement_arrows').notNullable().defaultTo('[]');
    t.timestamps(true, true);
  });

  await knex.schema.createTable('tactic_nades', (t) => {
    t.increments('id').primary();
    t.integer('tactic_id').references('id').inTable('tactics').onDelete('CASCADE').notNullable();
    t.integer('nade_id').references('id').inTable('nades').onDelete('CASCADE').notNullable();
    t.integer('sort_order').defaultTo(0);
    t.unique(['tactic_id', 'nade_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('tactic_nades');
  await knex.schema.dropTableIfExists('tactics');
}
