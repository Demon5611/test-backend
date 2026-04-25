# test-backend — быстрый запуск

## 1) Поднять стек

```bash
cd /Users/dmitrijsedov/Desktop/test-backend
docker compose up -d --build
docker compose ps

--------------------------------------------

# Тест с 10000 VU для проверки работоспособности

Запуск стека (шаг 2):
cd /Backend/test-backenddocker-compose up -d --builddocker-compose ps
Подождите, пока все контейнеры станут Up (backend может стартовать 20–30 с). Проверка через Nginx (порт 3000):
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/orderscurl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/health
Нагрузочный тест — в k6 укажите порт 3000 (Nginx):
API_URL=http://localhost:3000 k6 run --vus 100 --duration 1m backend/tests/load/k6/orders_test.js
Для полного сценария до 2000 VU:
API_URL=http://localhost:3000 k6 run backend/tests/load/k6/orders_test.js

----------------------------------

Нагрузочный тест — в k6 укажите порт 3000 (Nginx):
cd /Users/dmitrijsedov/Desktop/test-backend

docker run --rm -i \
  -e API_URL=http://host.docker.internal:3000 \
  -v "$PWD:/work" -w /work \
  grafana/k6 run --vus 100 --duration 1m backend/tests/load/k6/orders_test.js


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
