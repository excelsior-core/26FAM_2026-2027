/**
 * scripts/sync.js - Движок синхронизации и клиентского шифрования «“конспекты” ФПМ»
 * Сканирование Storage -> Умный парсер номеров/дат -> Gzip -> AES-256-GCM -> Mirror-mode -> GitHub Pages
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

function encryptWithKey(buffer, key, salt) {
  const gzipped = zlib.gzipSync(buffer, { level: 9 });
  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(gzipped), cipher.final()]);
  const tag = cipher.getAuthTag();

  return Buffer.concat([
    MAGIC_HEADER,
    Buffer.from([FORMAT_VERSION]),
    salt,
    iv,
    encrypted,
    tag
  ]);
}

function getSha256Hex(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex').slice(0, 16);
}

function getLectureId(subject, folder) {
  return crypto.createHash('sha256').update(`${subject}::${folder}`).digest('hex').slice(0, 12);
}

/**
 * Умный парсер номеров пар и дат из названия папки лекции:
 * Примеры:
 * "10 10.09.2026 11 14.09.2026 Пределы и непрерывность"
 * "Лекция 5 (18.09.2026) Ранг матрицы"
 * "№12, 13 (20.09.2026, 24.09.2026) Теорема Коши"
 */
function parseFolderSessions(folderName) {
  const dates = [];
  const dateRegex = /\b(\d{2}\.\d{2}\.\d{4})\b/g;
  let dMatch;
  while ((dMatch = dateRegex.exec(folderName)) !== null) {
    dates.push(dMatch[1]);
  }

  // Очищаем от дат, чтобы цифры годов не распознались как номера лекций
  const cleanForNums = folderName.replace(/\b\d{2}\.\d{2}\.\d{4}\b/g, ' ');
  const nums = [];
  const numRegex = /\b(?:№|лекци[яи]\s*|пар[аы]\s*)?(\d{1,3})\b/gi;
  let nMatch;
  while ((nMatch = numRegex.exec(cleanForNums)) !== null) {
    const val = parseInt(nMatch[1], 10);
    if (!isNaN(val) && val > 0 && val < 500) {
      nums.push(val);
    }
  }

  const sessions = [];
  const count = Math.max(dates.length, nums.length);
  for (let i = 0; i < count; i++) {
    sessions.push({
      number: nums[i] || (i + 1),
      date: dates[i] || ''
    });
  }

  // Очищенный эстетичный заголовок
  let cleanTitle = folderName
    .replace(/\b\d{2}\.\d{2}\.\d{4}\b/g, '')
    .replace(/\b(?:№|лекци[яи]\s*|пар[аы]\s*)?\d{1,3}\b/gi, '')
    .replace(/[\(\)\[\]\-—_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return { sessions, cleanTitle: cleanTitle || folderName };
}

async function runSync() {
  checkPrerequisites();
  const config = loadConfig();

  const args = process.argv.slice(2);
  if (args.includes('--rotate-shared')) {
    const newPass = args[args.indexOf('--rotate-shared') + 1];
    if (!newPass) process.exit(1);
    config.sharedPassword = newPass;
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
    console.log('🔑 Общий пароль обновлен в scripts/sync.json.');
  }

  if (args.includes('--rotate-admin')) {
    const newPass = args[args.indexOf('--rotate-admin') + 1];
    if (!newPass) process.exit(1);
    config.adminPassword = newPass;
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
    console.log('🔑 Админ-пароль обновлен в scripts/sync.json.');
  }

  const vaultSalt = Buffer.from(config.vaultSalt, 'hex');
  const sharedKey = crypto.pbkdf2Sync(config.sharedPassword, vaultSalt, PBKDF2_ITERATIONS, KEY_LEN, 'sha256');
  const adminKey = crypto.pbkdf2Sync(config.adminPassword, vaultSalt, PBKDF2_ITERATIONS, KEY_LEN, 'sha256');

  const storageBase = path.resolve(ROOT_DIR, config.storagePath || './Storage');
  const hseDir = path.join(storageBase, 'HSE');
  const blobsDir = path.join(ROOT_DIR, 'blobs');

  if (!fs.existsSync(blobsDir)) {
    fs.mkdirSync(blobsDir, { recursive: true });
  }

  if (!fs.existsSync(hseDir)) {
    fs.mkdirSync(hseDir, { recursive: true });
  }

  const exportMetaPath = path.join(hseDir, 'site-metadata.json');
  let existingMeta = {
    schema: 1,
    subjects: [
      { name: "Матанализ", color: "#B5341F", description: "Дифференциальное и интегральное исчисление" },
      { name: "Линал и Аналит", color: "#1D4E89", description: "Векторные пространства, матрицы, аналитическая геометрия" },
      { name: "Дискретная математика", color: "#2D6A4F", description: "Комбинаторика, теория графов и булевы функции" },
      { name: "Программирование", color: "#7209B7", description: "Алгоритмы и структуры данных на C++" }
    ],
    modules: ["Модуль 1", "Модуль 2", "Модуль 3", "Модуль 4"],
    announcements: [],
    lectures: []
  };

  if (fs.existsSync(exportMetaPath)) {
    try {
      existingMeta = JSON.parse(fs.readFileSync(exportMetaPath, 'utf8'));
    } catch (e) {
      console.warn('⚠️ Ошибка парсинга site-metadata.json');
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

  // Словарь предыдущих лекций для сохранения ручных правок админа
  const existingLecturesById = new Map();
  for (const lec of existingMeta.lectures || []) {
    existingLecturesById.set(lec.id, lec);
  }

  const subjects = fs.readdirSync(hseDir).filter(f => {
    return fs.statSync(path.join(hseDir, f)).isDirectory() && f !== 'site-metadata.json';
  });

  const nowIso = new Date().toISOString();
  const currentLectures = [];

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

      // Извлекаем сессии и заголовок из названия папки
      const parsed = parseFolderSessions(cleanFolder);

      const prev = existingLecturesById.get(lecId);
      let lecData = {
        id: lecId,
        subject: subjName,
        folder: cleanFolder,
        title: (prev && prev.title && prev.title !== cleanFolder) ? prev.title : parsed.cleanTitle,
        description: prev ? (prev.description || "") : "",
        tags: prev ? (prev.tags || []) : [],
        module: prev ? (prev.module || "Модуль 1") : "Модуль 1",
        hidden: prev ? !!prev.hidden : false,
        sessions: (prev && prev.sessions && prev.sessions.length > 0) ? prev.sessions : parsed.sessions,
        files: [],
        originals: [],
        addedAt: prev ? (prev.addedAt || nowIso) : nowIso,
        updatedAt: nowIso
      };

      // 1. Поиск HTML нейроконспектов в папке лекции
      const folderFiles = fs.readdirSync(folderPath);
      for (const file of folderFiles) {
        const filePath = path.join(folderPath, file);
        if (fs.statSync(filePath).isFile() && file.endsWith('.html')) {
          const content = fs.readFileSync(filePath);
          const hash = getSha256Hex(content);
          const blobName = `${hash}.bin`;
          const blobPath = path.join(blobsDir, blobName);

          activeBlobHashes.add(blobName);

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

      // 2. Поиск оригиналов (orig, оригинал, оригиналы, originals)
      const origPossibleNames = ['orig', 'origs', 'original', 'originals', 'оригинал', 'оригиналы'];
      const origDirs = [];

      for (const item of folderFiles) {
        const fullItem = path.join(folderPath, item);
        if (fs.statSync(fullItem).isDirectory() && origPossibleNames.includes(item.toLowerCase())) {
          origDirs.push(fullItem);
        } else if (fs.statSync(fullItem).isFile()) {
          // Если PDF бросили прямо в папку лекции
          const ext = path.extname(item).toLowerCase();
          if (ext === '.pdf') {
            const content = fs.readFileSync(fullItem);
            const hash = getSha256Hex(content);
            const blobName = `${hash}.bin`;
            const blobPath = path.join(blobsDir, blobName);

            activeBlobHashes.add(blobName);
            const encrypted = encryptWithKey(content, sharedKey, vaultSalt);
            fs.writeFileSync(blobPath, encrypted);

            lecData.originals.push({
              name: item,
              type: 'pdf',
              blob: hash
            });
          }
        }
      }

      for (const od of origDirs) {
        const origFiles = fs.readdirSync(od);
        for (const file of origFiles) {
          const filePath = path.join(od, file);
          const ext = path.extname(file).toLowerCase();
          if (fs.statSync(filePath).isFile() && ['.pdf', '.jpg', '.jpeg', '.png'].includes(ext)) {
            const content = fs.readFileSync(filePath);
            const hash = getSha256Hex(content);
            const blobName = `${hash}.bin`;
            const blobPath = path.join(blobsDir, blobName);

            activeBlobHashes.add(blobName);

            console.log(` 🔒 Шифрование оригинала: [${subjName}] ${folder}/${path.basename(od)}/${file}`);
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

      currentLectures.push(lecData);
    }
  }

  // ИСТИННЫЙ MIRROR-MODE:
  // finalLectures содержит ТОЛЬКО те лекции, папки которых физически существуют сейчас в Storage!
  const finalLectures = currentLectures;

  const finalMeta = {
    schema: 1,
    subjects: existingMeta.subjects,
    modules: existingMeta.modules,
    announcements: existingMeta.announcements || [],
    lectures: finalLectures
  };

  // Удаление устаревших/удаленных blobs
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

  // Обновление manifest.json
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

  // Шифрование метаданных
  console.log('🔐 Шифрование метаданных каталога...');
  const metaJsonBuf = Buffer.from(JSON.stringify(finalMeta), 'utf8');

  const encMeta = encryptWithKey(metaJsonBuf, sharedKey, vaultSalt);
  fs.writeFileSync(path.join(ROOT_DIR, 'metadata.bin'), encMeta);

  const adminMeta = {
    ...finalMeta,
    sharedKeyHex: sharedKey.toString('hex')
  };
  const adminJsonBuf = Buffer.from(JSON.stringify(adminMeta), 'utf8');
  const encAdmin = encryptWithKey(adminJsonBuf, adminKey, vaultSalt);
  fs.writeFileSync(path.join(ROOT_DIR, 'admin.bin'), encAdmin);

  console.log(`✅ Синхронизация завершена: ${finalLectures.length} лекций на сайте, ${activeBlobHashes.size} blobs.`);

  if (!args.includes('--no-push')) {
    deployToGitHub(config);
  }
}

function deployToGitHub(config) {
  if (!config.repoUrl) {
    console.log('ℹ️ repoUrl не указан в scripts/sync.json. Деплой пропущен.');
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
