# E-commerce Backend - PostgreSQL Master-Replica

Масштабируемый backend для e-commerce системы с асинхронной репликацией PostgreSQL.

## Технологический стек

- **Backend**: Fastify + TypeScript + Prisma ORM
- **Frontend**: Next.js 14 + React 18 + TypeScript + Zustand
- **База данных**: PostgreSQL 15 (Master-Replica)
- **Кэширование**: Redis
- **Хранилище**: MinIO (S3-совместимое)
- **Контейнеризация**: Docker & Docker Compose

## Быстрый старт

# Клонировать репозиторий
git clone https://github.com/Demon5611/test-backend.git
cd test-backend

# Запустить через Docker Compose
docker-compose up -d

# Настроить репликацию
./scripts/setup-replication.sh

# Запустить миграции
cd backend
npm run migrate

## Структура проекта

- `backend/` - Fastify API сервер
- `frontend/` - Next.js приложение
- `shared/` - Общие типы и утилиты
- `docker/` - Конфигурации Docker
- `scripts/` - Вспомогательные скрипты
- `tests/` - Тесты (unit, integration, load)

## Документация

Подробная документация находится в папке `docs/`.

## Лицензия

MIT

# Тест с 100 VU для проверки работоспособности
k6 run --vus 100 --duration 1m backend/tests/load/k6/orders_test.js