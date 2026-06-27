import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('users', (t) => {
    t.increments('id').primary();
    t.string('email').unique().notNullable();
    t.string('username').notNullable();
    t.string('password_hash').notNullable();
    t.enum('role', ['admin', 'coach', 'player']).notNullable().defaultTo('player');
    t.string('avatar_url').nullable();
    t.boolean('is_active').defaultTo(true);
    t.timestamps(true, true);
  });

  await knex.schema.createTable('groups', (t) => {
    t.increments('id').primary();
    t.string('name').notNullable();
    t.text('description').nullable();
    t.integer('coach_id').references('id').inTable('users').onDelete('CASCADE');
    t.timestamps(true, true);
  });

  await knex.schema.createTable('group_members', (t) => {
    t.increments('id').primary();
    t.integer('group_id').references('id').inTable('groups').onDelete('CASCADE');
    t.integer('player_id').references('id').inTable('users').onDelete('CASCADE');
    t.timestamp('joined_at').defaultTo(knex.fn.now());
    t.unique(['group_id', 'player_id']);
  });

  await knex.schema.createTable('tasks', (t) => {
    t.increments('id').primary();
    t.integer('group_id').references('id').inTable('groups').onDelete('CASCADE');
    t.integer('coach_id').references('id').inTable('users').onDelete('SET NULL').nullable();
    t.string('title').notNullable();
    t.text('description').nullable();
    t.enum('priority', ['low', 'medium', 'high']).defaultTo('medium');
    t.timestamp('due_date').nullable();
    t.timestamps(true, true);
  });

  await knex.schema.createTable('task_progress', (t) => {
    t.increments('id').primary();
    t.integer('task_id').references('id').inTable('tasks').onDelete('CASCADE');
    t.integer('player_id').references('id').inTable('users').onDelete('CASCADE');
    t.enum('status', ['pending', 'in_progress', 'completed', 'overdue']).defaultTo('pending');
    t.text('note').nullable();
    t.timestamp('completed_at').nullable();
    t.timestamp('updated_at').defaultTo(knex.fn.now());
    t.unique(['task_id', 'player_id']);
  });

  await knex.schema.createTable('trainings', (t) => {
    t.increments('id').primary();
    t.integer('group_id').references('id').inTable('groups').onDelete('CASCADE');
    t.integer('coach_id').references('id').inTable('users').onDelete('SET NULL').nullable();
    t.string('title').notNullable();
    t.text('description').nullable();
    t.timestamp('scheduled_at').notNullable();
    t.integer('duration_minutes').nullable();
    t.timestamps(true, true);
  });

  await knex.schema.createTable('materials', (t) => {
    t.increments('id').primary();
    t.integer('group_id').references('id').inTable('groups').onDelete('CASCADE');
    t.integer('coach_id').references('id').inTable('users').onDelete('SET NULL').nullable();
    t.string('title').notNullable();
    t.text('description').nullable();
    t.string('file_url').nullable();
    t.string('external_url').nullable();
    t.enum('type', ['video', 'document', 'link', 'image']).defaultTo('link');
    t.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('materials');
  await knex.schema.dropTableIfExists('trainings');
  await knex.schema.dropTableIfExists('task_progress');
  await knex.schema.dropTableIfExists('tasks');
  await knex.schema.dropTableIfExists('group_members');
  await knex.schema.dropTableIfExists('groups');
  await knex.schema.dropTableIfExists('users');
}