import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

console.log('Запуск миграций Prisma...');

try {
  process.chdir(join(rootDir, 'backend'));
  
  console.log('Генерация Prisma Client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  console.log('Применение миграций...');
  execSync('npx prisma migrate dev --name init', { stdio: 'inherit' });
  
  console.log('Миграции успешно применены!');
} catch (error) {
  console.error('Ошибка при выполнении миграций:', error.message);
  process.exit(1);
}