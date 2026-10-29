/**
 * scripts/sync.js - Движок синхронизации и клиентского шифрования «КОНСПЕКТЫ ФПМ»
 * Сканирование Storage/HSE -> Auto-Chroma -> Категоризация -> Gzip -> AES-256-GCM -> Mirror-mode -> GitHub Pages
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

const ROYAL_PALETTE = [
  '#B5341F', // Ruby / Crimson (Матанализ)
  '#1D4E89', // Sapphire / Cobalt (Линал и Аналит)
  '#2D6A4F', // Emerald (Дискретная математика)
  '#7209B7', // Amethyst / Deep Violet (Программирование)
  '#C87D20', // Venetian Amber
  '#0E7490', // Deep Aquamarine
  '#9E2A2B', // Terracotta
  '#4338CA', // Imperial Indigo
  '#374151'  // Titanium Slate
];

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
    console.log('⚠️ Файл scripts/sync.json не найден. Создаём конфигурацию...');
    config = {
      storagePath: "./Storage",
      repoUrl: "",
      sharedPassword: "famlovesmath",
      adminPassword: "excelsiorcatharsis",
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

function getLectureId(subject, category, folder) {
  return crypto.createHash('sha256').update(`${subject}::${category}::${folder}`).digest('hex').slice(0, 12);
}

function getColorForSubject(subjectName, existingSubjects = []) {
  const existing = existingSubjects.find(s => s.name.toLowerCase() === subjectName.toLowerCase());
  if (existing && existing.color) return existing.color;

  let hash = 0;
  for (let i = 0; i < subjectName.length; i++) {
    hash = (hash << 5) - hash + subjectName.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % ROYAL_PALETTE.length;
  return ROYAL_PALETTE[index];
}

/**
 * Умный парсер номеров пар и дат из названия папки лекции:
 * Примеры:
 * "10 10.09.2026 11 14.09.2026 Пределы и непрерывность"
 * "Лекция 5 (18.09.2026) Ранг матрицы"
 * "Коллоквиум 1 (25.10.2026) Вопросы к билетам"
 */
function parseFolderSessions(folderName) {
  const dates = [];
  const dateRegex = /\b(\d{2}\.\d{2}\.\d{4})\b/g;
  let dMatch;
  while ((dMatch = dateRegex.exec(folderName)) !== null) {
    dates.push(dMatch[1]);
  }

  const cleanForNums = folderName.replace(/\b\d{2}\.\d{2}\.\d{4}\b/g, ' ');
  const nums = [];
  const numRegex = /\b(?:№|лекци[яи]\s*|пар[аы]\s*|билет\s*)?(\d{1,3})\b/gi;
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

  let cleanTitle = folderName
    .replace(/\b\d{2}\.\d{2}\.\d{4}\b/g, '')
    .replace(/\b(?:№|лекци[яи]\s*|пар[аы]\s*|билет\s*)?\d{1,3}\b/gi, '')
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
    if (!newPass) {
      console.error('❌ Укажите новый студенческий пароль: --rotate-shared <новый_пароль>');
      process.exit(1);
    }
    config.sharedPassword = newPass;
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
    console.log(`🔑 Студенческий пароль обновлен на: "${newPass}" в scripts/sync.json`);
  }

  if (args.includes('--rotate-admin')) {
    const newPass = args[args.indexOf('--rotate-admin') + 1];
    if (!newPass) {
      console.error('❌ Укажите новый админ-пароль: --rotate-admin <новый_пароль>');
      process.exit(1);
    }
    config.adminPassword = newPass;
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
    console.log(`🔑 Админ-пароль обновлен на: "${newPass}" в scripts/sync.json`);
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
      { name: "Программирование", color: "#7209B7", description: "Алгоритмы, структуры данных и архитектура C++" }
    ],
    modules: ["Модуль 1", "Модуль 2", "Модуль 3", "Модуль 4"],
    announcements: [],
    lectures: []
  };

  if (fs.existsSync(exportMetaPath)) {
    try {
      existingMeta = JSON.parse(fs.readFileSync(exportMetaPath, 'utf8'));
    } catch (e) {
      console.warn('⚠️ Ошибка парсинга site-metadata.json, используются дефолтные настройки');
    }
  }

  console.log('🔍 Сканирование папок Storage/HSE...');
  const activeBlobHashes = new Set();

  const existingLecturesById = new Map();
  for (const lec of existingMeta.lectures || []) {
    existingLecturesById.set(lec.id, lec);
  }

  // 1. ДИНАМИЧЕСКИЙ ПОИСК ПРЕДМЕТОВ (Auto-Discovery & Auto-Chroma)
  const diskSubjectNames = fs.readdirSync(hseDir).filter(f => {
    return fs.statSync(path.join(hseDir, f)).isDirectory() && f !== 'site-metadata.json';
  });

  const finalSubjects = [];
  const handledSubjectNames = new Set();

  // Сначала сохраняем существующие предметы с их настройками, если папка на диске есть
  for (const s of existingMeta.subjects || []) {
    if (diskSubjectNames.includes(s.name)) {
      finalSubjects.push(s);
      handledSubjectNames.add(s.name);
    }
  }

  // Добавляем новые обнаруженные папки предметов с автоматическим цветом Auto-Chroma
  for (const name of diskSubjectNames) {
    if (!handledSubjectNames.has(name)) {
      const autoColor = getColorForSubject(name, existingMeta.subjects);
      console.log(` ✨ Обнаружен новый предмет: "${name}" (назначен цвет: ${autoColor})`);
      finalSubjects.push({
        name,
        color: autoColor,
        description: `Материалы и конспекты курса «${name}»`
      });
      handledSubjectNames.add(name);
    }
  }

  const nowIso = new Date().toISOString();
  const currentLectures = [];

  const KNOWN_CATEGORIES = ['лекции', 'коллоквиумы', 'экзамены', 'семинары', 'практика'];

  for (const subj of finalSubjects) {
    const subjDir = path.join(hseDir, subj.name);
    if (!fs.existsSync(subjDir)) continue;

    const subEntries = fs.readdirSync(subjDir).filter(f => {
      return fs.statSync(path.join(subjDir, f)).isDirectory();
    });

    // Определяем: разбиты ли папки по категориям (лекции, коллоквиумы...) или лежат напрямую
    const scanTargets = [];
    const hasCategoryDirs = subEntries.some(e => KNOWN_CATEGORIES.includes(e.toLowerCase()));

    if (hasCategoryDirs) {
      for (const entry of subEntries) {
        const full = path.join(subjDir, entry);
        const lower = entry.toLowerCase();
        const category = KNOWN_CATEGORIES.includes(lower) ? lower : 'лекции';
        const innerFolders = fs.readdirSync(full).filter(f => fs.statSync(path.join(full, f)).isDirectory());
        for (const f of innerFolders) {
          scanTargets.push({
            category,
            folder: f,
            folderPath: path.join(full, f)
          });
        }
      }
    } else {
      // Прямые папки лекций внутри предмета
      for (const f of subEntries) {
        scanTargets.push({
          category: 'лекции',
          folder: f,
          folderPath: path.join(subjDir, f)
        });
      }
    }

    for (const target of scanTargets) {
      const { category, folder, folderPath } = target;
      const cleanFolder = folder.trim();
      const lecId = getLectureId(subj.name, category, cleanFolder);

      const parsed = parseFolderSessions(cleanFolder);
      const prev = existingLecturesById.get(lecId);

      let lecData = {
        id: lecId,
        subject: subj.name,
        category: category,
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
          console.log(` 🔒 Шифрование конспекта: [${subj.name}/${category}] ${folder}/${file}`);
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
          const ext = path.extname(item).toLowerCase();
          if (['.pdf', '.jpg', '.jpeg', '.png'].includes(ext)) {
            const content = fs.readFileSync(fullItem);
            const hash = getSha256Hex(content);
            const blobName = `${hash}.bin`;
            const blobPath = path.join(blobsDir, blobName);

            activeBlobHashes.add(blobName);
            const encrypted = encryptWithKey(content, sharedKey, vaultSalt);
            fs.writeFileSync(blobPath, encrypted);

            lecData.originals.push({
              name: item,
              type: ext === '.pdf' ? 'pdf' : 'image',
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
            console.log(` 🔒 Шифрование оригинала: [${subj.name}] ${folder}/${path.basename(od)}/${file}`);
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
  const finalLectures = currentLectures;

  const finalMeta = {
    schema: 1,
    subjects: finalSubjects,
    modules: existingMeta.modules || ["Модуль 1", "Модуль 2", "Модуль 3", "Модуль 4"],
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
  console.log('🔐 Шифрование метаданных каталога (AES-256-GCM)...');
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

  // Экспорт site-metadata.json в Storage/HSE/
  fs.writeFileSync(exportMetaPath, JSON.stringify(finalMeta, null, 2), 'utf8');

  console.log(`\n==================================================`);
  console.log(`✅ СИНХРОНИЗАЦИЯ УСПЕШНО ЗАВЕРШЕНА!`);
  console.log(`📚 Предметов: ${finalSubjects.length}`);
  console.log(`📝 Всего материалов: ${finalLectures.length}`);
  console.log(`📦 Активных шифрованных blobs: ${activeBlobHashes.size}`);
  console.log(`🔑 Пароль студента: ${config.sharedPassword}`);
  console.log(`🔑 Пароль админа: ${config.adminPassword}`);
  console.log(`==================================================\n`);

  if (!args.includes('--no-push')) {
    deployToGitHub(config);
  }
}

function deployToGitHub(config) {
  if (!config.repoUrl) {
    console.log('ℹ️ repoUrl не указан в scripts/sync.json. Публикация на GitHub Pages пропущена.');
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
