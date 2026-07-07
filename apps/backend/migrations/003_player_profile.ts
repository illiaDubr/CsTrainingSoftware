import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (t) => {
    // Игровая роль: captain | entry | anchor | rifler | support
    t.string('in_game_role').nullable();
    // Короткое описание "о себе"
    t.text('bio').nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (t) => {
    t.dropColumn('in_game_role');
    t.dropColumn('bio');
  });
}
