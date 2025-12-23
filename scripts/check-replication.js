import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const { Pool } = pg;

async function checkReplication() {
  const replicaPool = new Pool({
    connectionString: process.env.DATABASE_REPLICA_URL || 
      'postgresql://postgres:password@localhost:5433/orders',
  });

  try {
    console.log('Проверка статуса репликации...\n');

    const isReplica = await replicaPool.query('SELECT pg_is_in_recovery();');
    console.log(`Реплика в режиме recovery: ${isReplica.rows[0].pg_is_in_recovery}`);

    const lag = await replicaPool.query(
      'SELECT now() - pg_last_xact_replay_timestamp() AS replication_lag;'
    );
    const lagSeconds = lag.rows[0].replication_lag?.seconds || 0;
    console.log(`Лаг репликации: ${lagSeconds} секунд`);

    if (lagSeconds > 1) {
      console.warn('⚠️  Внимание: лаг репликации превышает 1 секунду!');
    } else {
      console.log('✅ Лаг репликации в норме (<1s)');
    }

    const stats = await replicaPool.query(`
      SELECT 
        application_name,
        state,
        sync_state,
        sync_priority
      FROM pg_stat_replication;
    `);

    if (stats.rows.length > 0) {
      console.log('\nСтатистика репликации:');
      stats.rows.forEach((row, index) => {
        console.log(`  ${index + 1}. Application: ${row.application_name}`);
        console.log(`     State: ${row.state}`);
        console.log(`     Sync State: ${row.sync_state}`);
      });
    } else {
      console.log('\n⚠️  Нет активных подключений репликации');
    }

    await replicaPool.end();
  } catch (error) {
    console.error('Ошибка при проверке репликации:', error.message);
    await replicaPool.end();
    process.exit(1);
  }
}

checkReplication();