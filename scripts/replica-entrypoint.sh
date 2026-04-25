#!/bin/sh
set -eu

PGDATA="${PGDATA:-/var/lib/postgresql/data}"
MASTER_HOST="${POSTGRES_MASTER_SERVICE_HOST:-postgres-master}"
MASTER_USER="${POSTGRES_USER:-postgres}"
export PGPASSWORD="${POSTGRES_PASSWORD:-password}"

# Fail-fast настройки ожидания мастера
REPLICA_WAIT_TIMEOUT_SEC="${REPLICA_WAIT_TIMEOUT_SEC:-120}"
REPLICA_WAIT_INTERVAL_SEC="${REPLICA_WAIT_INTERVAL_SEC:-2}"

echo "Replica entrypoint: PGDATA=${PGDATA}, master=${MASTER_HOST}"

if [ ! -s "${PGDATA}/PG_VERSION" ]; then
  echo "PGDATA empty, waiting for master..."

  elapsed=0
  while ! pg_isready -h "${MASTER_HOST}" -U "${MASTER_USER}" -d postgres >/dev/null 2>&1; do
    if [ "${elapsed}" -ge "${REPLICA_WAIT_TIMEOUT_SEC}" ]; then
      echo "ERROR: master ${MASTER_HOST} is not ready after ${REPLICA_WAIT_TIMEOUT_SEC}s" >&2
      exit 1
    fi

    sleep "${REPLICA_WAIT_INTERVAL_SEC}"
    elapsed=$((elapsed + REPLICA_WAIT_INTERVAL_SEC))
  done

  echo "Running pg_basebackup..."
  rm -rf "${PGDATA:?}/"*
  pg_basebackup \
    -h "${MASTER_HOST}" \
    -U "${MASTER_USER}" \
    -D "${PGDATA}" \
    -P \
    -v \
    -R
  echo "Basebackup completed."
else
  echo "PGDATA already initialized, skipping basebackup."
fi

exec /usr/local/bin/docker-entrypoint.sh "$@"