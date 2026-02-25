# Переговоры вслепую

Многопользовательская пошаговая игра, основанная на модели «дилемма заключённого».

## Быстрый старт

### Требования

- Node.js >= 18
- npm >= 9
- Docker и Docker Compose

### Установка

```bash
# Клонировать репозиторий
git clone https://github.com/iDim123/blind.git
cd blind
git checkout develop

# Запустить MySQL
docker compose up -d

# Установить зависимости
npm install

# Сгенерировать Prisma-клиент
npm run db:generate

# Применить миграции
npm run db:push

# Создать администратора
npm run create-admin -- --email admin@example.com --password admin123

# Запустить сервер (в одном терминале)
npm run dev:server

# Запустить клиент (в другом терминале)
npm run dev:client

URLs
Frontend: http://localhost:5173
Backend API: http://localhost:3000
Swagger: http://localhost:3000/api/docs

Переменные окружения
Скопируйте .env.example в .env в каждом пакете:

cp packages/server/.env.example packages/server/.env
cp packages/client/.env.example packages/client/.env

### packages/shared

**`packages/shared/package.json`**
```json
{
  "name": "@blind/shared",
  "version": "1.0.0",
  "private": true,
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  },
  "devDependencies": {
    "typescript": "^5.3.3"
  }
}
```