/**
 * scripts/sync.js - Движок синхронизации и клиентского шифрования «“конспекты” ФПМ»
 * Без сборщиков, без npm-зависимостей (чистый Node.js LTS).
 * Сканирование Storage -> Gzip -> PBKDF2-SHA256 (600k) + AES-256-GCM -> Blobs -> Git gh-pages
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');
const { execSync } = require('child_process');

const MAGIC_HEADER = Buffer.from([0x46, 0x41, 0x4d, 0x42, 0x31]); // "FAMB1"
const FORMAT_VERSION = 0x01;
const PBKDF2_ITERATIONS = 600000;
const KEY_LEN = 32;

const ROOT_DIR = path.resolve(__dirname, '..');
const CONFIG_FILE = path.join(__dirname, 'sync.json');

// Проверка окружения
function checkPrerequisites() {
  const nodeVer = parseInt(process.versions.node.split('.')[0], 10);
  if (nodeVer < 18) {
    console.error('❌ Требуется Node.js версии 18 или выше (у вас ' + process.version + ')');
    process.exit(1);
  }

  try {
    execSync('git --version', { stdio: 'ignore' });
  } catch (e) {
    console.error('❌ Git не найден в PATH. Установите git: https://git-scm.com/');
    process.exit(1);
  }
}

// Загрузка или создание начального конфига
function loadConfig() {
  let config;
  if (!fs.existsSync(CONFIG_FILE)) {
    console.log('⚠️ Файл scripts/sync.json не найден. Создаём из шаблона...');
    config = {
      storagePath: "./Storage",
      repoUrl: "",
      sharedPassword: "fpm2026",
      adminPassword: "admin2026",
      vaultSalt: crypto.randomBytes(16).toString('hex'),
      branchDeploy: "gh-pages",
      branchSource: "main"
    };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
    return config;
  }

  try {
    config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    if (!config.vaultSalt) {
      config.vaultSalt = crypto.randomBytes(16).toString('hex');
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
    }
    return config;
  } catch (e) {
    console.error('❌ Ошибка чтения scripts/sync.json:', e.message);
    process.exit(1);
  }
}

// Шифрование буфера: Gzip -> AES-GCM (с единой солью хранилища и уникальным IV на каждый файл)
function encryptWithKey(buffer, key, salt) {
  const gzipped = zlib.gzipSync(buffer, { level: 9 });
  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(gzipped), cipher.final()]);
  const tag = cipher.getAuthTag(); // 16 байт

  // Собираем: FAMB1 (5) + version (1) + salt (16) + iv (12) + ciphertext + authTag
  return Buffer.concat([
    MAGIC_HEADER,
    Buffer.from([FORMAT_VERSION]),
    salt,
    iv,
    encrypted,
    tag
  ]);
}

// Вычисление стабильного SHA-256 хеша для контента
function getSha256Hex(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex').slice(0, 16);
}

// Хеш для ID лекции: subject + folderName
function getLectureId(subject, folder) {
  return crypto.createHash('sha256').update(`${subject}::${folder}`).digest('hex').slice(0, 12);
}

// Основной процесс синхронизации
async function runSync() {
  checkPrerequisites();
  const config = loadConfig();

  // Обработка флагов ротации паролей
  const args = process.argv.slice(2);
  if (args.includes('--rotate-shared')) {
    const newPass = args[args.indexOf('--rotate-shared') + 1];
    if (!newPass) {
      console.error('Укажите новый пароль: --rotate-shared <новый_пароль>');
      process.exit(1);
    }
    config.sharedPassword = newPass;
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
    console.log('🔑 Общий пароль обновлен в scripts/sync.json. Перешифровываем всё...');
  }

  if (args.includes('--rotate-admin')) {
    const newPass = args[args.indexOf('--rotate-admin') + 1];
    if (!newPass) {
      console.error('Укажите новый пароль: --rotate-admin <новый_пароль>');
      process.exit(1);
    }
    config.adminPassword = newPass;
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
    console.log('🔑 Админ-пароль обновлен в scripts/sync.json. Перешифровываем admin.bin...');
  }

  const vaultSalt = Buffer.from(config.vaultSalt, 'hex');
  console.log('⚡ Генерация мастер-ключей через PBKDF2 (600 000 итераций)...');
  const sharedKey = crypto.pbkdf2Sync(config.sharedPassword, vaultSalt, PBKDF2_ITERATIONS, KEY_LEN, 'sha256');
  const adminKey = crypto.pbkdf2Sync(config.adminPassword, vaultSalt, PBKDF2_ITERATIONS, KEY_LEN, 'sha256');

  const storageBase = path.resolve(ROOT_DIR, config.storagePath || './Storage');
  const hseDir = path.join(storageBase, 'HSE');
  const blobsDir = path.join(ROOT_DIR, 'blobs');

  if (!fs.existsSync(blobsDir)) {
    fs.mkdirSync(blobsDir, { recursive: true });
  }

  if (!fs.existsSync(hseDir)) {
    console.log(`📁 Создание базовой структуры папок в ${hseDir}...`);
    fs.mkdirSync(hseDir, { recursive: true });
  }

  const exportMetaPath = path.join(hseDir, 'site-metadata.json');
  let existingMeta = {
    schema: 1,
    subjects: [
      { name: "Матанализ", color: "#B5341F", description: "Лекции и семинары по матанализу" },
      { name: "Линал и Аналит", color: "#1D4E89", description: "Линейная алгебра и аналитическая геометрия" },
      { name: "Дискретная математика", color: "#2D6A4F", description: "Комбинаторика, графы, логика" }
    ],
    modules: ["Модуль 1", "Модуль 2"],
    lectures: []
  };

  if (fs.existsSync(exportMetaPath)) {
    try {
      existingMeta = JSON.parse(fs.readFileSync(exportMetaPath, 'utf8'));
      console.log('📋 Загружен файл экспорта site-metadata.json');
    } catch (e) {
      console.warn('⚠️ Ошибка парсинга site-metadata.json, используем текущие данные');
    }
  }

  for (const subj of existingMeta.subjects || []) {
    const subjPath = path.join(hseDir, subj.name, 'лекции');
    if (!fs.existsSync(subjPath)) {
      fs.mkdirSync(subjPath, { recursive: true });
    }
  }

  console.log('🔍 Сканирование папок Storage/HSE...');
  const activeBlobHashes = new Set();
  const lecturesMap = new Map();

  for (const lec of existingMeta.lectures || []) {
    lecturesMap.set(lec.id, lec);
  }

  const subjects = fs.readdirSync(hseDir).filter(f => {
    return fs.statSync(path.join(hseDir, f)).isDirectory() && f !== 'site-metadata.json';
  });

  const nowIso = new Date().toISOString();

  for (const subjName of subjects) {
    const subjLecDir = path.join(hseDir, subjName, 'лекции');
    if (!fs.existsSync(subjLecDir)) continue;

    const lectureFolders = fs.readdirSync(subjLecDir).filter(f => {
      const full = path.join(subjLecDir, f);
      return fs.statSync(full).isDirectory();
    });

    for (const folder of lectureFolders) {
      const cleanFolder = folder.trim();
      const folderPath = path.join(subjLecDir, folder);
      const lecId = getLectureId(subjName, cleanFolder);

      let lecData = lecturesMap.get(lecId) || {
        id: lecId,
        subject: subjName,
        folder: cleanFolder,
        title: cleanFolder,
        description: "",
        tags: [],
        module: existingMeta.modules && existingMeta.modules[0] ? existingMeta.modules[0] : "Модуль 1",
        hidden: false,
        sessions: [],
        files: [],
        originals: [],
        addedAt: nowIso
      };

      lecData.updatedAt = nowIso;
      lecData.files = [];
      lecData.originals = [];

      // 1. Поиск HTML нейроконспектов
      const folderFiles = fs.readdirSync(folderPath);
      for (const file of folderFiles) {
        const filePath = path.join(folderPath, file);
        if (fs.statSync(filePath).isFile() && file.endsWith('.html')) {
          const content = fs.readFileSync(filePath);
          const hash = getSha256Hex(content);
          const blobName = `${hash}.bin`;
          const blobPath = path.join(blobsDir, blobName);

          activeBlobHashes.add(blobName);

          // Всегда шифруем актуальным ключом
          console.log(` 🔒 Шифрование конспекта: [${subjName}] ${folder}/${file}`);
          const encrypted = encryptWithKey(content, sharedKey, vaultSalt);
          fs.writeFileSync(blobPath, encrypted);

          lecData.files.push({
            name: file,
            type: 'html',
            blob: hash
          });
        }
      }

      // 2. Поиск оригиналов (orig/*.pdf|*.jpg|*.png)
      const origDir = path.join(folderPath, 'orig');
      if (fs.existsSync(origDir) && fs.statSync(origDir).isDirectory()) {
        const origFiles = fs.readdirSync(origDir);
        for (const file of origFiles) {
          const filePath = path.join(origDir, file);
          const ext = path.extname(file).toLowerCase();
          if (fs.statSync(filePath).isFile() && ['.pdf', '.jpg', '.jpeg', '.png'].includes(ext)) {
            const content = fs.readFileSync(filePath);
            const hash = getSha256Hex(content);
            const blobName = `${hash}.bin`;
            const blobPath = path.join(blobsDir, blobName);

            activeBlobHashes.add(blobName);

            console.log(` 🔒 Шифрование оригинала: [${subjName}] ${folder}/orig/${file}`);
            const encrypted = encryptWithKey(content, sharedKey, vaultSalt);
            fs.writeFileSync(blobPath, encrypted);

            lecData.originals.push({
              name: file,
              type: ext === '.pdf' ? 'pdf' : 'image',
              blob: hash
            });
          }
        }
      }

      lecturesMap.set(lecId, lecData);
    }
  }

  const finalLectures = Array.from(lecturesMap.values());
  const finalMeta = {
    schema: 1,
    subjects: existingMeta.subjects,
    modules: existingMeta.modules,
    announcements: existingMeta.announcements || [],
    lectures: finalLectures
  };

  // 3. Mirror-Mode
  const allBlobsOnDisk = fs.readdirSync(blobsDir);
  let removedCount = 0;
  for (const b of allBlobsOnDisk) {
    if (!activeBlobHashes.has(b)) {
      fs.unlinkSync(path.join(blobsDir, b));
      removedCount++;
    }
  }
  if (removedCount > 0) {
    console.log(` 🧹 Очистка зеркала: удалено ${removedCount} устаревших blobs`);
  }

  // 4. Manifest
  const manifestList = fs.readdirSync(blobsDir).map(file => {
    const stat = fs.statSync(path.join(blobsDir, file));
    return { name: file, size: stat.size };
  });

  const manifestData = {
    version: 1,
    generatedAt: nowIso,
    blobs: manifestList
  };
  fs.writeFileSync(path.join(ROOT_DIR, 'manifest.json'), JSON.stringify(manifestData, null, 2), 'utf8');

  // 5. Шифрование метаданных
  console.log('🔐 Шифрование метаданных каталога...');
  const metaJsonBuf = Buffer.from(JSON.stringify(finalMeta), 'utf8');

  // metadata.bin (общий пароль студентов)
  const encMeta = encryptWithKey(metaJsonBuf, sharedKey, vaultSalt);
  fs.writeFileSync(path.join(ROOT_DIR, 'metadata.bin'), encMeta);

  // admin.bin (пароль администратора, содержит sharedKeyHex для доступа к blobs)
  const adminMeta = {
    ...finalMeta,
    sharedKeyHex: sharedKey.toString('hex')
  };
  const adminJsonBuf = Buffer.from(JSON.stringify(adminMeta), 'utf8');
  const encAdmin = encryptWithKey(adminJsonBuf, adminKey, vaultSalt);
  fs.writeFileSync(path.join(ROOT_DIR, 'admin.bin'), encAdmin);

  console.log(`✅ Синхронизация завершена: ${finalLectures.length} лекций, ${activeBlobHashes.size} blobs.`);

  // 6. Git Push
  if (!args.includes('--no-push')) {
    deployToGitHub(config);
  }
}

function deployToGitHub(config) {
  if (!config.repoUrl) {
    console.log('ℹ️ Параметр repoUrl не указан в scripts/sync.json. Публикация на GitHub пропущена.');
    return;
  }

  console.log('🚀 Развертывание на GitHub Pages (ветка ' + (config.branchDeploy || 'gh-pages') + ')...');

  try {
    const distDir = path.join(ROOT_DIR, '.gh-dist');
    if (fs.existsSync(distDir)) {
      fs.rmSync(distDir, { recursive: true, force: true });
    }
    fs.mkdirSync(distDir, { recursive: true });

    const copyList = [
      'index.html', 'manifest.json', 'metadata.bin', 'admin.bin', 'sw.js',
      'styles', 'app', 'fonts', 'blobs'
    ];

    for (const item of copyList) {
      const src = path.join(ROOT_DIR, item);
      const dst = path.join(distDir, item);
      if (fs.existsSync(src)) {
        fs.cpSync(src, dst, { recursive: true });
      }
    }

    execSync('git init', { cwd: distDir, stdio: 'ignore' });
    execSync('git checkout -b gh-pages', { cwd: distDir, stdio: 'ignore' });
    execSync('git add -A', { cwd: distDir, stdio: 'ignore' });
    execSync(`git commit -m "Deploy: ${new Date().toISOString()}"`, { cwd: distDir, stdio: 'ignore' });
    execSync(`git remote add origin ${config.repoUrl}`, { cwd: distDir, stdio: 'ignore' });

    console.log(' ⬆️ Выполняется force-push в ветку gh-pages...');
    execSync('git push -f origin gh-pages', { cwd: distDir, stdio: 'inherit' });

    fs.rmSync(distDir, { recursive: true, force: true });
    console.log('🎉 Успешно опубликовано на GitHub Pages!');
  } catch (err) {
    console.error('❌ Ошибка при отправке на GitHub:', err.message);
  }
}

runSync().catch(err => {
  console.error('❌ Фатальная ошибка sync.js:', err);
  process.exit(1);
});
