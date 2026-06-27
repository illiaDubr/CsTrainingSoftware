# CS Training App

Мобильное приложение для управления тренировками в CS2. Тренеры создают группы, назначают задачи и обучающие материалы игрокам, отслеживают прогресс выполнения.

---

## Стек

| Слой | Технология |
|---|---|
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL 16 + Knex (query builder + миграции) |
| Auth | JWT (access + refresh tokens) + bcrypt |
| Mobile | React Native + Expo (iOS / Android / Web) |
| Shared types | `@cs-training/shared` |

---

## Роли

| Роль | Возможности |
|---|---|
| `player` | Просмотр задач и материалов своей группы, обновление прогресса |
| `coach` | Создание групп, задач, тренировок, материалов; отслеживание прогресса игроков |
| `admin` | Управление пользователями, просмотр всех групп, назначение ролей |

> Регистрация через `/api/auth/register` создаёт только `player` и `coach`.  
> Роль `admin` назначается вручную через БД.

---

## Структура монорепо

```
cs-training/
├── apps/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── config/
│   │   │   │   ├── app.ts          # Конфиг приложения (порт, jwt, db)
│   │   │   │   └── database.ts     # Knex-подключение к PostgreSQL
│   │   │   ├── controllers/
│   │   │   │   └── auth/
│   │   │   │       └── auth.controller.ts
│   │   │   ├── middlewares/
│   │   │   │   ├── auth.ts         # authenticate + authorize(role)
│   │   │   │   ├── errorHandler.ts # AppError + глобальный обработчик
│   │   │   │   └── notFound.ts
│   │   │   ├── models/
│   │   │   │   ├── user.model.ts   # User, UserRole, CreateUserDto
│   │   │   │   └── task.model.ts   # Task, TaskProgress, TaskStatus
│   │   │   ├── routes/
│   │   │   │   └── auth/index.ts   # POST /register /login /refresh
│   │   │   └── services/
│   │   │       └── auth/
│   │   │           └── auth.service.ts
│   │   ├── migrations/
│   │   │   └── 001_initial_schema.ts
│   │   ├── uploads/
│   │   ├── .env
│   │   ├── knexfile.ts
│   │   └── tsconfig.json
│   │
│   └── mobile/
│       └── src/
│           ├── screens/
│           │   ├── auth/
│           │   ├── player/
│           │   ├── coach/
│           │   ├── admin/
│           │   └── shared/
│           ├── components/
│           │   ├── ui/
│           │   ├── forms/
│           │   ├── cards/
│           │   └── layout/
│           ├── navigation/
│           ├── hooks/
│           ├── store/
│           │   ├── slices/
│           │   └── api/
│           └── services/
│               └── apiClient.ts    # axios + JWT interceptors
│
├── packages/
│   └── shared/
│       └── src/index.ts            # UserRole, TaskStatus, ApiResponse...
│
└── docker-compose.yml              # PostgreSQL 16
```

---

## База данных

```
users          — id, email, username, password_hash, role, avatar_url, is_active
groups         — id, name, description, coach_id
group_members  — group_id, player_id, joined_at
tasks          — id, group_id, coach_id, title, description, priority, due_date
task_progress  — task_id, player_id, status, note, completed_at
trainings      — id, group_id, coach_id, title, description, scheduled_at, duration_minutes
materials      — id, group_id, coach_id, title, description, file_url, external_url, type
```

---

## API

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

### Планируется

```
GET/PATCH       /api/users/:id
GET/POST/PATCH  /api/groups
POST/DELETE     /api/groups/:id/members
GET/POST/PATCH  /api/tasks
PATCH           /api/tasks/:id/progress
GET/POST/PATCH  /api/trainings
GET/POST/PATCH  /api/materials
```

---

## Запуск локально

### 1. База данных
```bash
docker-compose up -d
```

### 2. Бэкенд
```bash
cd apps/backend
# Заполни .env (скопируй из .env.example)
npm install
knex migrate:latest --knexfile knexfile.ts
npm run dev
# → http://localhost:3000
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

Файл `apps/backend/.env`:

```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=cs_training
DB_USER=postgres
DB_PASSWORD=postgres

JWT_SECRET=<длинная случайная строка>
JWT_REFRESH_SECRET=<другая длинная случайная строка>
```

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
- [x] Инициализация проекта (Express + TypeScript)
- [x] Подключение к PostgreSQL через Knex
- [x] Миграции — полная схема БД
- [x] Auth — register, login, refresh
- [x] JWT middleware — authenticate + authorize
- [ ] Users — профиль, управление (admin)
- [ ] Groups — CRUD, управление участниками
- [ ] Tasks — CRUD, прогресс игроков
- [ ] Trainings — расписание тренировок
- [ ] Materials — обучающие материалы

### Мобильное приложение
- [x] Структура проекта (Expo)
- [x] API клиент с JWT interceptors
- [ ] Экраны авторизации
- [ ] Навигация по ролям
- [ ] Экраны игрока
- [ ] Экраны тренера
- [ ] Экраны администратора