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


Один инстанс: до ~100–150 VU / ~700–900 RPS — p95 \< 300ms.
При 2000 VU: ~1150 RPS, p95 ≈ 1.5s, http_req_failed ≈ 0%.

# Тест с 100 VU для проверки работоспособности
k6 run --vus 100 --duration 1m backend/tests/load/k6/orders_test.js

--------------------------------------------

# Тест с 10000 VU для проверки работоспособности

Запуск стека (шаг 2):
cd /home/sedov.dmitriy19/Desktop/Обучение/Backend/test-backenddocker-compose up -d --builddocker-compose ps
Подождите, пока все контейнеры станут Up (backend может стартовать 20–30 с). Проверка через Nginx (порт 3000):
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/orderscurl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/health
Нагрузочный тест — в k6 укажите порт 3000 (Nginx):
API_URL=http://localhost:3000 k6 run --vus 100 --duration 1m backend/tests/load/k6/orders_test.js
Для полного сценария до 2000 VU:
API_URL=http://localhost:3000 k6 run backend/tests/load/k6/orders_test.js

----------------------------------

Нагрузочный тест — в k6 укажите порт 3000 (Nginx):
API_URL=http://localhost:3000 k6 run --vus 100 --duration 1m backend/tests/load/k6/orders_test.js
Для полного сценария до 2000 VU:
API_URL=http://localhost:3000 k6 run backend/tests/load/k6/orders_test.js

6. Миграции и сиды при первом запуске
(при поднятых postgres-master/replica и созданной БД):
cd backend && npm run migrate:deploy && npm run seed
После этого поднимать полный стек с pgbouncer/backend/nginx.


==========================================
Поднять все сервисы (если ещё не подняты):
cd /home/sedov.dmitriy19/Desktop/Обучение/Backend/test-backenddocker compose up -ddocker compose ps
Убедитесь, что в статусе Up (и при необходимости healthy): postgres-master, postgres-replica, redis, pgbouncer, backend (4 реплики), nginx.
2. Проверка API через Nginx (порт 3000):
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/healthcurl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/orders
Ожидаемо: 200 на оба запроса.
3. Короткий прогон k6 (100 VU, 1 мин):
cd /home/sedov.dmitriy19/Desktop/Обучение/Backend/test-backendAPI_URL=http://localhost:3000 k6 run --vus 100 --duration 1m backend/tests/load/k6/orders_test.js
4. Полный сценарий (до 2000 VU, ~5 мин):
API_URL=http://localhost:3000 k6 run backend/tests/load/k6/orders_test.js
Важно: в обоих случаях используется API_URL=http://localhost:3000, чтобы нагрузка шла через Nginx на несколько реплик backend. После прогона посмотрите в отчёте k6 RPS и прохождение порогов (p95 &lt; 300 ms, ошибки &lt; 5%).
