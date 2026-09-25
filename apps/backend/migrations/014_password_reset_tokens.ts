import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('password_reset_tokens', (table) => {
    table.increments('id').primary();

    table
      .integer('user_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');

    table.string('token_hash', 64).notNullable().unique();

    table.timestamp('expires_at').notNullable();
    table.timestamp('used_at').nullable();

    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index('user_id');
    table.index('expires_at');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('password_reset_tokens');
}