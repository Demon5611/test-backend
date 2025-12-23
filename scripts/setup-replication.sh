#!/bin/bash

set -e

echo "Настройка PostgreSQL Master-Replica репликации..."

MASTER_HOST="${DB_MASTER_HOST:-postgres-master}"
MASTER_PORT="${DB_MASTER_PORT:-5432}"
MASTER_USER="${DB_MASTER_USER:-postgres}"
MASTER_PASSWORD="${DB_MASTER_PASSWORD:-password}"

REPLICA_HOST="${DB_REPLICA_HOST:-postgres-replica}"
REPLICA_PORT="${DB_REPLICA_PORT:-5432}"
REPLICA_USER="${DB_REPLICA_USER:-postgres}"
REPLICA_PASSWORD="${DB_REPLICA_PASSWORD:-password}"

REPL_USER="${REPL_USER:-repl_user}"
REPL_PASSWORD="${REPL_PASSWORD:-repl_pass}"

echo "Ожидание готовности Master PostgreSQL..."
until PGPASSWORD=$MASTER_PASSWORD psql -h $MASTER_HOST -p $MASTER_PORT -U $MASTER_USER -d postgres -c '\q' 2>/dev/null; do
  echo "Master еще не готов, ожидание..."
  sleep 2
done

echo "Создание пользователя репликации на Master..."
PGPASSWORD=$MASTER_PASSWORD psql -h $MASTER_HOST -p $MASTER_PORT -U $MASTER_USER -d postgres <<EOF
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '$REPL_USER') THEN
    CREATE ROLE $REPL_USER LOGIN REPLICATION ENCRYPTED PASSWORD '$REPL_PASSWORD';
  END IF;
END
\$\$;
EOF

echo "Проверка статуса репликации на Master..."
PGPASSWORD=$MASTER_PASSWORD psql -h $MASTER_HOST -p $MASTER_PORT -U $MASTER_USER -d postgres -c "SELECT * FROM pg_stat_replication;"

echo "Настройка репликации завершена!"
echo "Для проверки используйте: npm run check-replication"