import { Knex } from 'knex';

// Заменяем одну точку (pos_x/pos_y) на пару точек: откуда кидают (throw) и куда прилетает (land) —
// как на референсном сервисе: маркер броска + маркер приземления, соединённые линией.
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('nades', (t) => {
    t.float('throw_x').nullable();
    t.float('throw_y').nullable();
    t.float('land_x').nullable();
    t.float('land_y').nullable();
  });

  // Старые точки, расставленные в прошлой версии фичи, трактуем как точку приземления
  const hasPos = await knex.schema.hasColumn('nades', 'pos_x');
  if (hasPos) {
    await knex('nades')
      .whereNotNull('pos_x')
      .whereNotNull('pos_y')
      .update({ land_x: knex.ref('pos_x'), land_y: knex.ref('pos_y') });

    await knex.schema.alterTable('nades', (t) => {
      t.dropColumn('pos_x');
      t.dropColumn('pos_y');
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('nades', (t) => {
    t.float('pos_x').nullable();
    t.float('pos_y').nullable();
  });

  await knex('nades')
    .whereNotNull('land_x')
    .whereNotNull('land_y')
    .update({ pos_x: knex.ref('land_x'), pos_y: knex.ref('land_y') });

  await knex.schema.alterTable('nades', (t) => {
    t.dropColumn('throw_x');
    t.dropColumn('throw_y');
    t.dropColumn('land_x');
    t.dropColumn('land_y');
  });
}
