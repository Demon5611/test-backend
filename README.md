# Frontend — Next.js

Фронтенд e-commerce приложения в составе проекта [test-backend](../README.md). Работает с API бэкенда (Fastify) для отображения заказов и взаимодействия с данными.

## Стек

- **Next.js 16** (App Router)
- **React 19** + TypeScript
- **Tailwind CSS 4**
- **TanStack React Query** — запросы к API и кэш
- **Axios** — HTTP-клиент
- **Zustand** — состояние приложения (при необходимости)
- **Zod** — валидация данных

## Требования

- Node.js 18+

## Установка

cd frontend
npm install

Запустить реплику и проверить контейнеры

cd /home/sedov.dmitriy19/Desktop/Обучение/Backend/test-backend
docker-compose up -d redis
docker-compose ps

cd backend && npm run dev


# Тест с 100 VU для проверки работоспособности
k6 run --vus 100 --duration 1m backend/tests/load/k6/orders_test.js

# Тест с 10000 VU для проверки работоспособности
cd /home/sedov.dmitriy19/Desktop/Обучение/Backend/test-backend
k6 run backend/tests/load/k6/orders_test.js