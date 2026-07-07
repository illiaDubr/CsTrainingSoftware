import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (t) => {
    // Настоящее имя (опционально, в дополнение к нику)
    t.string('full_name').nullable();
  });

  await knex.schema.alterTable('routines', (t) => {
    // Владелец индивидуальной рутины (group_id для неё NULL)
    t.integer('player_id').references('id').inTable('users').onDelete('CASCADE').nullable();
  });

  // group_id теперь может быть NULL (индивидуальные рутины без группы)
  await knex.raw('ALTER TABLE routines ALTER COLUMN group_id DROP NOT NULL');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (t) => {
    t.dropColumn('full_name');
  });

  await knex('routines').whereNull('group_id').delete();
  await knex.schema.alterTable('routines', (t) => {
    t.dropColumn('player_id');
  });
}
