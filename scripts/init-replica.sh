#!/bin/bash
set -e

echo "Инициализация PostgreSQL Replica..."

# Ожидание готовности Master
until PGPASSWORD=password psql -h postgres-master -U postgres -d postgres -c '\q' 2>/dev/null; do
  echo "Ожидание готовности Master..."
  sleep 2
done

echo "Master готов. Начинаю базовую синхронизацию..."

# Очистить данные (если они есть)
rm -rf /var/lib/postgresql/data/*

# Выполнить базовую синхронизацию
PGPASSWORD=password pg_basebackup \
  -h postgres-master \
  -U postgres \
  -D /var/lib/postgresql/data \
  -P \
  -v \
  -R

# Создать standby.signal файл
touch /var/lib/postgresql/data/standby.signal

echo "Базовая синхронизация завершена. Replica готова к работе."