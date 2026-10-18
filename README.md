# CS Training App

Мобильное приложение для управления тренировками в CS2. Тренеры создают группы, назначают задачи и обучающие материалы игрокам, отслеживают прогресс выполнения.

Проект написан целиком мной (full-stack: API, база данных, мобильный клиент, деплой) для CS-команды и знакомых — это рабочий инструмент для реальных тренировок, а не коммерческий продукт.

---

## Возможности

- Три роли (`player`, `coach`, `admin`) с разграничением доступа на уровне API и экранов
- Группы игроков, задачи с личным прогрессом каждого игрока, расписание тренировок, обучающие материалы
- Ежедневные routine-задачи с автогенерацией прогресса на день и heatmap активности за год
- Календарь матчей, карта дня, библиотека гранат (nades) и раздел тактик
- Панель администратора: пользователи, группы, контент
- Восстановление пароля по e-mail (Gmail API)
- Деплой бэкенда на Railway, сборка мобильного клиента через EAS

---

## Стек

| Слой | Технология |
|---|---|
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL 16 + Knex (query builder + миграции) |
| Auth | JWT (access + refresh tokens) + bcrypt |
| Mobile | React Native + Expo (iOS / Android / Web) |
| Deploy | Railway (backend + PostgreSQL), EAS Build (mobile) |

---

## Роли

| Роль | Возможности |
|---|---|
| `player` | Просмотр задач и материалов своей группы, обновление прогресса |
| `coach` | Создание групп, задач, тренировок, материалов; отслеживание прогресса игроков |
| `admin` | Управление пользователями, просмотр всех групп, назначение ролей |

> Регистрация через `/api/auth/register` создаёт только `player` и `coach`.  
> Роль `admin` создаётся скриптом `npm run seed:admin` (см. ниже).

---

## Структура монорепо

```
cs-training/
├── apps/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── config/        # конфиг приложения и подключение к БД
│   │   │   ├── controllers/
│   │   │   ├── middlewares/   # authenticate + authorize(role), обработчик ошибок
│   │   │   ├── models/
│   │   │   ├── routes/        # auth, users, groups, tasks, routines, trainings,
│   │   │   │                  # materials, stats, maps, matches, nades, tactics, admin
│   │   │   ├── services/
│   │   │   └── scripts/       # seedAdmin
│   │   ├── migrations/        # 14 миграций Knex
│   │   └── knexfile.ts
│   │
│   └── mobile/                # Expo + expo-router
│       ├── app/               # экраны по ролям: (auth), (player), (coach), (admin)
│       └── src/               # компоненты, хуки, store, API-клиент (axios + JWT interceptors)
│
└── docker-compose.yml         # PostgreSQL 16 для локальной разработки
```

---

## База данных

Основные таблицы (полная схема — в `apps/backend/migrations/`):

```
users          — id, email, username, password_hash, role, avatar_url, is_active
groups         — id, name, description, coach_id
group_members  — group_id, player_id, joined_at
tasks          — id, group_id, coach_id, title, description, priority, due_date
task_progress  — task_id, player_id, status, note, completed_at
trainings      — id, group_id, coach_id, title, description, scheduled_at, duration_minutes
materials      — id, group_id, coach_id, title, description, file_url, external_url, type
```

Поверх них миграциями добавлены routines, профиль игрока, карта дня, nades, матчи, тактики и токены сброса пароля.

---

## API

Ниже описаны основные группы эндпоинтов. Остальные (`/api/maps`, `/api/matches`, `/api/nades`, `/api/tactics`, `/api/admin`) находятся в `apps/backend/src/routes/`.

### Auth — `/api/auth`

| Метод | Путь | Доступ | Описание |
|---|---|---|---|
| POST | `/register` | публичный | Регистрация (player / coach) |
| POST | `/login` | публичный | Вход, возвращает токены |
| POST | `/refresh` | публичный | Обновление access token |

Пример запроса `POST /api/auth/login`:
```json
{
  "email": "coach@example.com",
  "password": "secret"
}
```

Пример ответа:
```json
{
  "success": true,
  "data": {
    "user": { "id": 1, "email": "...", "username": "...", "role": "coach" },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

### Users — `/api/users`

| Метод | Путь | Доступ | Описание |
|---|---|---|---|
| GET | `/me` | любая роль | Свой профиль |
| GET | `/search/players?q=` | coach | Поиск игроков по нику (для добавления в группу) |
| GET | `/` | admin | Список всех пользователей |
| GET | `/:id` | admin | Пользователь по id |
| PATCH | `/:id` | admin | Обновить пользователя |

### Groups — `/api/groups`

| Метод | Путь | Доступ | Описание |
|---|---|---|---|
| GET | `/` | любая роль | Свои группы (по роли) |
| GET | `/:id` | любая роль | Группа с участниками |
| POST | `/` | coach | Создать группу |
| PATCH | `/:id` | coach | Обновить группу |
| POST | `/:id/members` | coach | Добавить игрока (`{ playerId }`) |
| DELETE | `/:id/members/:playerId` | coach | Удалить игрока |

### Tasks — `/api/tasks`

| Метод | Путь | Доступ | Описание |
|---|---|---|---|
| GET | `/?groupId=` | любая роль | Задачи группы (+ прогресс) |
| GET | `/:id` | любая роль | Задача по id (+ прогресс: свой для player, всех для coach) |
| POST | `/` | coach | Создать задачу (авто-создаёт прогресс для всех игроков группы) |
| PATCH | `/:id` | coach | Обновить задачу |
| DELETE | `/:id` | coach | Удалить задачу |
| PATCH | `/:id/progress` | player | Обновить свой статус (`{ status, note }`) |

### Routines — `/api/routines`

| Метод | Путь | Доступ | Описание |
|---|---|---|---|
| GET | `/?groupId=` | любая роль | Активные routine группы (+ прогресс на сегодня, автогенерируется при запросе) |
| POST | `/` | coach | Создать routine-шаблон |
| DELETE | `/:id` | coach | Деактивировать routine (мягкое удаление) |
| PATCH | `/:id/progress` | player | Обновить статус на сегодня (`{ status, note }`) |

### Trainings — `/api/trainings`

| Метод | Путь | Доступ | Описание |
|---|---|---|---|
| GET | `/?groupId=` | любая роль | Тренировки группы |
| POST | `/` | coach | Создать тренировку |
| PATCH | `/:id` | coach | Обновить |
| DELETE | `/:id` | coach | Удалить |

### Materials — `/api/materials`

| Метод | Путь | Доступ | Описание |
|---|---|---|---|
| GET | `/?groupId=` | любая роль | Материалы группы |
| POST | `/` | coach | Добавить материал (`type`: video / document / link / image) |
| PATCH | `/:id` | coach | Обновить |
| DELETE | `/:id` | coach | Удалить |

### Stats — `/api/stats`

| Метод | Путь | Доступ | Описание |
|---|---|---|---|
| GET | `/player/:playerId/activity` | player (себя) / coach (игроков своих групп) | Активность за год: `{ total, activity: [{ date, count }] }` — объединяет completed из tasks и routines |

---

## Запуск локально

### 1. База данных
```bash
docker-compose up -d
```

### 2. Бэкенд
```bash
cd apps/backend
cp .env.example .env     # и заполни JWT_SECRET, JWT_REFRESH_SECRET
npm install
npm run migrate
npm run dev
# → http://localhost:3000
```

Первого администратора можно создать так:
```bash
ADMIN_PASSWORD=<свой пароль> npm run seed:admin
```

### 3. Мобильное приложение
```bash
cd apps/mobile
npm install
npm start
# Сканируй QR в приложении Expo Go
```

---

## Переменные окружения

Полный список с комментариями — в `apps/backend/.env.example`. Обязательные переменные: `JWT_SECRET` и `JWT_REFRESH_SECRET` (длинные случайные строки, например `openssl rand -hex 48`); без них сервер не стартует. Для `seed:admin` нужен `ADMIN_PASSWORD`, для писем о сбросе пароля — ключи Gmail API.

---

## Распространение (без App Store / Google Play)

| Платформа | Способ |
|---|---|
| Android | EAS Build → `.apk` → установка напрямую |
| iOS | TestFlight (Apple Developer $99/год) или Expo Go для команды |
| PC / Web | `expo start --web` или статический деплой через `expo export` |

---

## Прогресс разработки

### Бэкенд
- [x] Express + TypeScript, PostgreSQL через Knex, 14 миграций
- [x] Auth — register, login, refresh, восстановление пароля по e-mail
- [x] JWT middleware — authenticate + authorize
- [x] Users, Groups, Tasks, Trainings, Materials
- [x] Routines — daily routine с автогенерацией прогресса на день
- [x] Stats — годовая активность (heatmap-данные из tasks + routines)
- [x] Матчи, карта дня, nades, тактики
- [x] Админ-эндпоинты, seed администратора
- [x] Деплой на Railway

### Мобильное приложение
- [x] Expo SDK 54 + expo-router, API клиент с JWT interceptors
- [x] Авторизация: вход, регистрация, сброс пароля
- [x] Навигация по ролям (auto-redirect через `/users/me`)
- [x] Экраны игрока: группы, задачи с прогрессом и заметкой, тренировки, материалы, личные routines, профиль
- [x] Экраны тренера: группы, задачи, тренировки, материалы, поиск и добавление игроков
- [x] Календарь матчей, nades, тактики
- [x] Экраны администратора: пользователи, группы, контент
