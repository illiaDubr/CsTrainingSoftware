import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { db } from '../config/database';

/**
 * Создаёт (или обновляет до admin + новый пароль) пользователя-администратора.
 * Запуск: npm run seed:admin
 * Параметры — через переменные окружения, с дефолтами для локальной разработки:
 *   ADMIN_EMAIL, ADMIN_USERNAME, ADMIN_PASSWORD
 *
 * На Railway: railway run npm run seed:admin --service <backend>
 * (переменные окружения подхватятся из окружения сервиса — там же лежит DATABASE_URL).
 */
const main = async () => {
  const email = process.env.ADMIN_EMAIL || 'admin@losespada.gg';
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'admin12345';

  if (password.length < 6) {
    console.error('❌ ADMIN_PASSWORD должен быть не короче 6 символов');
    process.exit(1);
  }

  const password_hash = await bcrypt.hash(password, 10);
  const existing = await db('users').where({ email }).first();

  if (existing) {
    await db('users')
      .where({ id: existing.id })
      .update({ role: 'admin', is_active: true, password_hash, updated_at: db.fn.now() });
    console.log(`✅ Пользователь ${email} (id ${existing.id}) обновлён до admin, пароль сброшен`);
  } else {
    const [user] = await db('users')
      .insert({ email, username, password_hash, role: 'admin', is_active: true })
      .returning(['id', 'email', 'username']);
    console.log(`✅ Создан admin: ${user.email} (id ${user.id})`);
  }

  console.log(`   Логин: ${email}`);
  console.log(`   Пароль: ${password}`);
  process.exit(0);
};

main().catch((err) => {
  console.error('❌ Ошибка сидинга admin:', err);
  process.exit(1);
});
