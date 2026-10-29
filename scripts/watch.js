/**
 * scripts/watch.js - Автоматическое отслеживание изменений в Storage
 * Debounce 2 секунды, запуск sync.js при добавлении или удалении конспектов
 */

const fs = require('fs');
const path = require('path');
const { fork } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const CONFIG_FILE = path.join(__dirname, 'sync.json');

let config = { storagePath: "./Storage" };
if (fs.existsSync(CONFIG_FILE)) {
  try {
    config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  } catch (e) {}
}

const storageDir = path.resolve(ROOT_DIR, config.storagePath || './Storage');

if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir, { recursive: true });
}

console.log('👀 Запущен режим автоотслеживания папки: ' + storageDir);
console.log('⏳ Любые изменения лекций будут синхронизированы через 2 секунды после сохранения...');

let debounceTimer = null;
let isSyncing = false;

function triggerSync() {
  if (isSyncing) return;
  isSyncing = true;
  console.log('\n⚡ Обнаружены изменения файлов. Запуск sync.js...');

  const child = fork(path.join(__dirname, 'sync.js'), ['--no-push']);
  child.on('exit', () => {
    isSyncing = false;
    console.log('👀 Ожидание следующих изменений...\n');
  });
}

try {
  fs.watch(storageDir, { recursive: true }, (eventType, filename) => {
    if (!filename) return;
    // Игнорируем временные файлы ОС и редакторов
    if (filename.includes('.tmp') || filename.includes('~') || filename.endsWith('.DS_Store')) return;

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      triggerSync();
    }, 2000);
  });
} catch (e) {
  console.error('❌ Ошибка fs.watch:', e.message);
}
