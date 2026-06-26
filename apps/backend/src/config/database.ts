import knex from 'knex';
import { config  } from './app';


export const db = knex({
    client: 'pg',
    connection: {
        host: config.db.host,
        port: config.db.port,
        database: config.db.name,
        user: config.db.user,
        password: config.db.password,
    },
    pool: { min: 2, max: 10 },
});

export const testConnection = async () => {
    try {
        await db.raw('SELECT 1');
        console.log('Databese connected!');
    } catch (err) {
    console.error('❌ Database connection failed:', err);
    process.exit(1);
  }
};