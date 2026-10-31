/**
 * scripts/sync.js - Движок синхронизации и клиентского шифрования «КОНСПЕКТЫ ФПМ»
 * Сканирование Storage/HSE -> Auto-Chroma -> Категоризация -> Gzip -> AES-256-GCM -> Mirror-mode -> GitHub Pages
 * Zero-Knowledge, Zero-Leakage, Zero-CDN
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
  '#D4AF37', // Antique Gold
  '#1D4E89', // Sapphire / Cobalt (Линал и Аналит)
  '#2D6A4F', // Emerald (Дискретная математика)
  '#7209B7', // Amethyst / Deep Violet (Программирование)
  '#C87D20', // Venetian Amber
  '#0E7490', // Deep Aquamarine
  '#9E2A2B', // Terracotta
  '#4338CA', // Imperial Indigo
  '#374151'  // Titanium Slate
];

const DEFAULT_MODULES = [
  { name: "Модуль 1", startDate: "01.09.2026", endDate: "25.10.2026" },
  { name: "Модуль 2", startDate: "26.10.2026", endDate: "31.12.2026" },
  { name: "Модуль 3", startDate: "11.01.2027", endDate: "28.03.2027" },
  { name: "Модуль 4", startDate: "29.03.2027", endDate: "30.06.2027" }
];

function parseDateStrToTime(str) {
  if (!str) return 0;
  const parts = String(str).trim().split('.');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    return new Date(year, month, day).getTime();
  }
  return 0;
}

function normalizeModules(rawModules) {
  if (!rawModules || !Array.isArray(rawModules) || rawModules.length === 0) {
    return JSON.parse(JSON.stringify(DEFAULT_MODULES));
  }
  const defaultMap = {};
  for (const dm of DEFAULT_MODULES) {
    defaultMap[dm.name] = { start: dm.startDate, end: dm.endDate };
  }
  return rawModules.map(m => {
    if (typeof m === 'string') {
      const d = defaultMap[m] || { start: '', end: '' };
      return { name: m, startDate: d.start, endDate: d.end };
    }
    return {
      name: m.name || 'Модуль',
      startDate: m.startDate || '',
      endDate: m.endDate || ''
    };
  });
}

function detectModuleForDate(dateStr, modules) {
  if (!dateStr || !modules || !modules.length) return null;
  const t = parseDateStrToTime(dateStr);
  if (!t) return null;

  for (const m of modules) {
    if (m && m.startDate && m.endDate) {
      const start = parseDateStrToTime(m.startDate);
      const end = parseDateStrToTime(m.endDate);
      const endOfDay = end + 24 * 60 * 60 * 1000 - 1;
      if (t >= start && t <= endOfDay) {
        return m.name;
      }
    }
  }
  return null;
}

function checkPrerequisites() {
  const nodeVer = parseInt(process.versions.node.split('.')[0], 10);
  if (nodeVer < 18) {
    console.error('❌ Требуется Node.js версии 18 или выше (у вас ' + process.version + ')');
    process.exit(1);
  }
}

function loadConfig() {
  let config;
  if (!fs.existsSync(CONFIG_FILE)) {
    console.log('⚠️ Файл scripts/sync.json не найден. Создаём конфигурацию по умолчанию...');
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

const RUSSIAN_MONTH_MAP = {
  'янв': 1, 'января': 1, 'январь': 1,
  'фев': 2, 'февраля': 2, 'февраль': 2,
  'мар': 3, 'марта': 3, 'март': 3,
  'апр': 4, 'апреля': 4, 'апрель': 4,
  'май': 5, 'мая': 5,
  'июн': 6, 'июня': 6, 'июнь': 6,
  'июл': 7, 'июля': 7, 'июль': 7,
  'авг': 8, 'августа': 8, 'август': 8,
  'сен': 9, 'сент': 9, 'сентября': 9, 'сентябрь': 9,
  'окт': 10, 'октября': 10, 'октябрь': 10,
  'ноя': 11, 'нояб': 11, 'ноября': 11, 'ноябрь': 11,
  'дек': 12, 'декабря': 12, 'декабрь': 12
};

/**
 * Умный высокоточный парсер номеров пар, дат и названий из папок лекций.
 * Поддерживает любые студенческие паттерны:
 * - "1-2 4 и 7 сент" -> Пары [1, 2], Даты [04.09.2026, 07.09.2026]
 * - "3-4 11 и 14 сент" -> Пары [3, 4], Даты [11.09.2026, 14.09.2026]
 * - "5-7 18 21 25 сент" -> Пары [5, 6, 7], Даты [18.09.2026, 21.09.2026, 25.09.2026]
 * - "8-9 28 сент 2 окт" -> Пары [8, 9], Даты [28.09.2026, 02.10.2026]
 * - "10 5 окт" -> Пара [10], Дата [05.10.2026]
 * - "10-12 5 9 12 окт" -> Пары [10, 11, 12], Даты [05.10.2026, 09.10.2026, 12.10.2026]
 * - "01 02.09.2026 Введение" -> Пара [1], Дата [02.09.2026], Название "Введение"
 * - "Лекция 5 (18.09.2026) Ранг матрицы"
 */
function parseFolderSessions(folderName, defaultCategory = 'лекции') {
  const norm = folderName.trim();
  let remaining = norm;

  // 1. Приоритетный официальный формат: пары (номер дата) в начале строки:
  // e.g. "01 02.09.2026 02 04.09.2026 Название" или "12 23.10.2026 Название"
  const pairRegex = /^(?:(?:лекци[яи]|пар[аы]|семинар[ы]?|заняти[ея]|коллоквиум)\s*)?(?:№\s*)?(\d{1,3})\s+(?:\(?(\d{1,2}\.\d{2}(?:\.\d{4})?)\)?)(?:\s+|$)/iu;
  const directSessions = [];
  let pairMatch;

  while ((pairMatch = remaining.match(pairRegex)) !== null) {
    const num = parseInt(pairMatch[1], 10);
    const dateRaw = pairMatch[2];
    const parts = dateRaw.split('.');
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2] || (parseInt(month, 10) >= 8 ? '2026' : '2027');
    directSessions.push({ number: num, date: `${day}.${month}.${year}` });
    remaining = remaining.slice(pairMatch[0].length).trim();
  }

  if (directSessions.length > 0) {
    let cleanTitle = remaining
      .replace(/^[\s,;:\-–—\.]+/g, '')
      .replace(/[\s,;:\-–—\.]+$/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanTitle) {
      const isPlural = directSessions.length > 1;
      const catLabel = isPlural ? 'Лекции' : 'Лекция';
      cleanTitle = isPlural
        ? `${catLabel} ${directSessions[0].number}–${directSessions[directSessions.length - 1].number}`
        : `${catLabel} ${directSessions[0].number}`;
    }

    return { sessions: directSessions, cleanTitle };
  }

  // 2. Универсальный фолбэк на старые форматы (диапазоны 1-2, русские месяцы "4 и 7 сент")
  const nums = [];
  const rangeMatch = remaining.match(/^(?:(?:лекци[яи]|пар[аы]|семинар[ы]?|заняти[ея]|коллоквиум)\s*)?(?:№\s*)?(\d{1,3})\s*[-–—]\s*(\d{1,3})(?!\d)/iu);
  if (rangeMatch) {
    const start = parseInt(rangeMatch[1], 10);
    const end = parseInt(rangeMatch[2], 10);
    if (start <= end && end - start <= 25) {
      for (let n = start; n <= end; n++) nums.push(n);
    } else {
      nums.push(start, end);
    }
    remaining = remaining.slice(rangeMatch[0].length).trim();
  } else {
    const singleMatch = remaining.match(/^(?:(?:лекци[яи]|пар[аы]|семинар[ы]?|заняти[ея]|коллоквиум)\s*)?(?:№\s*)?(\d{1,3})(?!\d)/iu);
    if (singleMatch) {
      nums.push(parseInt(singleMatch[1], 10));
      remaining = remaining.slice(singleMatch[0].length).trim();
    }
  }

  // 2. Поиск дат
  const dates = [];
  const matchedSlices = [];

  // А) Стандартные даты ДД.ММ.ГГГГ или ДД.ММ (например 02.09.2026 или 02.09)
  const stdDateRegex = /(?<!\d)(\d{1,2})\.(\d{2})(?:\.(\d{4}))?(?!\d)/g;
  let sMatch;
  while ((sMatch = stdDateRegex.exec(remaining)) !== null) {
    const day = sMatch[1].padStart(2, '0');
    const month = sMatch[2].padStart(2, '0');
    const year = sMatch[3] || (parseInt(month, 10) >= 8 ? '2026' : '2027');
    dates.push(`${day}.${month}.${year}`);
    matchedSlices.push({ start: sMatch.index, end: sMatch.index + sMatch[0].length });
  }

  // Б) Русские текстовые даты: "4 и 7 сент", "18 21 25 сент", "28 сент 2 окт", "5 окт"
  const monthNamesPattern = Object.keys(RUSSIAN_MONTH_MAP).sort((a,b) => b.length - a.length).join('|');
  const monthBlockRegex = new RegExp(`((?:\\b\\d{1,2}\\b[\\s,и\\-–—]*)+)\\s*(${monthNamesPattern})`, 'giu');

  let mbMatch;
  while ((mbMatch = monthBlockRegex.exec(remaining)) !== null) {
    const daysChunk = mbMatch[1];
    const monthWord = mbMatch[2].toLowerCase();
    const monthNum = RUSSIAN_MONTH_MAP[monthWord];
    if (!monthNum) continue;

    const monthStr = String(monthNum).padStart(2, '0');
    const yearStr = monthNum >= 8 ? '2026' : '2027';

    const dayRegex = /(?<!\d)(\d{1,2})(?!\d)/g;
    let dMatch;
    const chunkDays = [];
    while ((dMatch = dayRegex.exec(daysChunk)) !== null) {
      const d = parseInt(dMatch[1], 10);
      if (d >= 1 && d <= 31) {
        chunkDays.push(d);
      }
    }

    for (const d of chunkDays) {
      dates.push(`${String(d).padStart(2, '0')}.${monthStr}.${yearStr}`);
    }

    matchedSlices.push({ start: mbMatch.index, end: mbMatch.index + mbMatch[0].length });
  }

  // Удаляем распознанные куски дат из remaining, чтобы получить заголовок темы
  let titleCandidate = remaining;
  matchedSlices.sort((a, b) => b.start - a.start);
  for (const s of matchedSlices) {
    titleCandidate = titleCandidate.slice(0, s.start) + ' ' + titleCandidate.slice(s.end);
  }

  // Чистим заголовок: убираем пустые скобки, разделители по краям
  let cleanTitle = titleCandidate
    .replace(/[\(\)\[\]]/g, ' ')
    .replace(/^[\s,;:\-–—\.]+/g, '')
    .replace(/[\s,;:\-–—\.]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Если чистого названия темы в папке не было, формируем красивое читаемое название
  if (!cleanTitle) {
    const isPlural = nums.length > 1;
    let catLabel = 'Лекция';
    if (defaultCategory === 'семинары') {
      catLabel = isPlural ? 'Семинары' : 'Семинар';
    } else if (defaultCategory === 'коллоквиумы') {
      catLabel = isPlural ? 'Коллоквиумы' : 'Коллоквиум';
    } else if (defaultCategory === 'экзамены') {
      catLabel = isPlural ? 'Экзамены' : 'Экзамен';
    } else {
      catLabel = isPlural ? 'Лекции' : 'Лекция';
    }

    if (nums.length > 1) {
      cleanTitle = `${catLabel} ${nums[0]}–${nums[nums.length - 1]}`;
    } else if (nums.length === 1) {
      cleanTitle = `${catLabel} ${nums[0]}`;
    } else {
      cleanTitle = folderName;
    }
  }

  // 3. Формируем пары (номер, дата)
  const sessions = [];
  const count = Math.max(dates.length, nums.length);
  for (let i = 0; i < count; i++) {
    sessions.push({
      number: nums[i] || (nums.length > 0 ? nums[nums.length - 1] + (i - nums.length + 1) : (i + 1)),
      date: dates[i] || ''
    });
  }

  return { sessions, cleanTitle };
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

  console.log('⏳ Вычисление мастер-ключей (PBKDF2 600 000 итераций)...');
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
      console.warn('⚠️ Ошибка парсинга site-metadata.json, используются параметры по умолчанию');
    }
  }

  const normalizedModules = normalizeModules(existingMeta.modules);

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

  for (const s of existingMeta.subjects || []) {
    if (diskSubjectNames.includes(s.name)) {
      finalSubjects.push(s);
      handledSubjectNames.add(s.name);
    }
  }

  for (const name of diskSubjectNames) {
    if (!handledSubjectNames.has(name)) {
      const autoColor = getColorForSubject(name, existingMeta.subjects);
      console.log(` ✨ Обнаружен новый предмет: "${name}" (Auto-Chroma цвет: ${autoColor})`);
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

      const parsed = parseFolderSessions(cleanFolder, category);
      const prev = existingLecturesById.get(lecId);

      const hasPrevDates = prev && Array.isArray(prev.sessions) && prev.sessions.some(s => s.date);
      const chosenSessions = hasPrevDates ? prev.sessions : parsed.sessions;
      const chosenTitle = (prev && prev.title && prev.title !== cleanFolder) ? prev.title : parsed.cleanTitle;

      // Автоматическое определение модуля по датам лекции
      const firstDate = (chosenSessions && chosenSessions.length > 0 && chosenSessions[0].date)
        ? chosenSessions[0].date
        : (parsed.dates && parsed.dates.length > 0 ? parsed.dates[0] : null);
      const autoModule = detectModuleForDate(firstDate, normalizedModules);
      const chosenModule = autoModule || (prev ? (prev.module || "Модуль 1") : "Модуль 1");

      let lecData = {
        id: lecId,
        subject: subj.name,
        category: category,
        folder: cleanFolder,
        title: chosenTitle,
        description: prev ? (prev.description || "") : "",
        tags: prev ? (Array.isArray(prev.tags) ? prev.tags.map(t => String(t).trim().replace(/^#+/, '').toUpperCase()).filter(Boolean) : []) : [],
        module: chosenModule,
        hidden: prev ? !!prev.hidden : false,
        sessions: chosenSessions,
        files: [],
        originals: [],
        addedAt: prev ? (prev.addedAt || nowIso) : nowIso,
        updatedAt: nowIso
      };

      const folderFiles = fs.readdirSync(folderPath);

      // 1. Поиск HTML нейроконспектов
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

          // Извлечение полного чистого текста конспекта для мгновенного NLP-поиска
          try {
            const htmlStr = content.toString('utf8');
            let cleanText = htmlStr
              .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, ' ')
              .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
              .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
              .replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, '')
              .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '')
              .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
              .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
              .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
              .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '')
              .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '')
              .replace(/<[^>]+>/g, ' ')
              .replace(/&nbsp;/gi, ' ')
              .replace(/&lt;/gi, '<')
              .replace(/&gt;/gi, '>')
              .replace(/&amp;/gi, '&')
              .replace(/&#\d+;/g, '');

            // Очистка CSS, остатков стилей и служебных блоков
            cleanText = cleanText
              .replace(/\/\*[\s\S]*?\*\//g, ' ')
              .replace(/\{[^{}]*\}/g, ' ')
              .replace(/@[a-z-]+[^{]*\{[^{}]*\}/gi, ' ')
              .replace(/\.[a-zA-Z0-9_-]+\s*\{?[^}]*\}?/g, ' ')
              .replace(/var\(--[a-zA-Z0-9_-]+\)/gi, ' ')
              .replace(/--[a-zA-Z0-9_-]+\s*:[^;{}]+;?/g, ' ')
              .replace(/(?:margin|padding|color|background|border|font|display|flex|width|height|position|top|left|right|bottom|z-index|opacity|box-shadow|overflow)[a-z-]*\s*:[^;{}]+;?/gi, ' ');

            // Математическая очистка для чистоты текста и сниппетов
            cleanText = cleanText
              .replace(/\\mathbb\{R\}/g, 'ℝ')
              .replace(/\\mathbb\{C\}/g, 'ℂ')
              .replace(/\\mathbb\{N\}/g, 'ℕ')
              .replace(/\\mathbb\{Z\}/g, 'ℤ')
              .replace(/\\mathbb\{Q\}/g, 'ℚ')
              .replace(/\\mathbb\s*\{?[A-Za-z]*\}?/g, '')
              .replace(/\\(?:mathbf|mathit|text)\{([^}]+)\}/g, '$1')
              .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)')
              .replace(/\\dot\{([a-zA-Z])\}/g, '$1̇')
              .replace(/\\le\b/g, '≤')
              .replace(/\\ge\b/g, '≥')
              .replace(/\\ne\b/g, '≠')
              .replace(/\\approx\b/g, '≈')
              .replace(/\\equiv\b/g, '≡')
              .replace(/\\asymp\b/g, '≍')
              .replace(/\\sim\b/g, '∼')
              .replace(/\\to\b/g, '→')
              .replace(/\\pm\b/g, '±')
              .replace(/\\mp\b/g, '∓')
              .replace(/\\cdot\b/g, '·')
              .replace(/\\times\b/g, '×')
              .replace(/\\in\b/g, '∈')
              .replace(/\\notin\b/g, '∉')
              .replace(/\\subset\b/g, '⊂')
              .replace(/\\forall\b/g, '∀')
              .replace(/\\exists\b/g, '∃')
              .replace(/\\infty\b/g, '∞')
              .replace(/\\Longleftrightarrow|\\iff/g, '⟺')
              .replace(/\\Longrightarrow|\\implies/g, '⟹')
              .replace(/\\alpha\b/g, 'α')
              .replace(/\\beta\b/g, 'β')
              .replace(/\\gamma\b/g, 'γ')
              .replace(/\\pi\b/g, 'π')
              .replace(/\\varepsilon\b/g, 'ε')
              .replace(/\\lambda\b/g, 'λ')
              .replace(/\\delta\b/g, 'δ')
              .replace(/\\phi\b/g, 'φ')
              .replace(/\\varphi\b/g, 'φ')
              .replace(/\\sigma\b/g, 'σ')
              .replace(/\[cite:\s*\d+\]/gi, '')
              .replace(/\$+/g, '')
              .replace(/\\quad\b/g, ' ')
              .replace(/\\(?:left|right|big|Big)\b/g, '')
              .replace(/\\[a-zA-Z]+/g, ' ')
              .replace(/\\/g, '')
              .replace(/[\{\}\[\]]/g, ' ')
              .replace(/\.{2,}/g, '…')
              .replace(/§\s*(\d+)([А-ЯЁа-яё])/g, '§ $1 $2')
              .replace(/([а-яёa-z])([А-ЯЁ])/g, '$1 $2')
              .replace(/\s+/g, ' ')
              .trim();

            if (cleanText) {
              lecData.content = cleanText;
            }

            // Автоматическое распознавание темы лекции из HTML-конспекта
            const isGenericDesc = !lecData.description || 
              /^Лекци[яи]\s*[\d,\sи–-]+$/i.test(lecData.description.trim()) ||
              /^Лекция\s*\d+\.\d+/i.test(lecData.description.trim());

            if (isGenericDesc) {
              const tm = htmlStr.match(/<title>([^<]+)<\/title>/i);
              const h1m = htmlStr.match(/<h1[^>]*>([^<]+)<\/h1>/i);
              let rawTopic = tm ? tm[1] : (h1m ? h1m[1] : '');
              
              let clean = (rawTopic || '')
                .replace(/<[^>]+>/g, '')
                .replace(/^.*?(Высшая алгебра|Математический анализ|Дискретная математика|Аналитическая геометрия)\s*[:—–|]\s*/i, '')
                .replace(/\s*—\s*Полный.*?$/i, '')
                .replace(/\s*\|\s*ФПМ.*?$/i, '')
                .replace(/\s*\|\s*Конспект.*?$/i, '')
                .replace(/\s*\(Полный курс.*?$/i, '')
                .replace(/—\s*Лекци[яи]\s*[\d,\sи–-]+[:—–]\s*/i, '')
                .replace(/Лекци[яи]\s*[\d,\sи–-]+[:—–]\s*/i, '')
                .replace(/Лекция\s*\d+\.\d+\s*[:—–]\s*/i, '')
                .replace(/\s+/g, ' ')
                .trim();

              if (!clean || /^[\d,\sи–-]+$/.test(clean) || /^Лекци/i.test(clean)) {
                const h2m = htmlStr.match(/<h2[^>]*>([^<]+)<\/h2>/i);
                if (h2m) {
                  clean = h2m[1]
                    .replace(/<[^>]+>/g, '')
                    .replace(/^§\s*\d+\.\s*/, '')
                    .replace(/\$[^$]+\$/g, '')
                    .replace(/\s+/g, ' ')
                    .trim();
                }
              }

              if (clean && clean.length > 3) {
                lecData.description = clean;
              }
            }
          } catch (errTopic) {}
        }
      }

      // 2. Рекурсивный поиск ВСЕХ PDF оригиналов от лекторов (в корне папки и любых подпапках)
      function collectPdfs(dir) {
        let results = [];
        const entries = fs.readdirSync(dir);
        for (const entry of entries) {
          const full = path.join(dir, entry);
          const stat = fs.statSync(full);
          if (stat.isDirectory()) {
            results = results.concat(collectPdfs(full));
          } else if (stat.isFile() && path.extname(entry).toLowerCase() === '.pdf') {
            results.push({ name: entry, path: full });
          }
        }
        return results;
      }

      const allPdfs = collectPdfs(folderPath);
      allPdfs.sort((a, b) => a.name.localeCompare(b.name, 'ru'));

      for (const pdfItem of allPdfs) {
        const content = fs.readFileSync(pdfItem.path);
        const hash = getSha256Hex(content);
        const blobName = `${hash}.bin`;
        const blobPath = path.join(blobsDir, blobName);

        activeBlobHashes.add(blobName);
        console.log(` 🔒 Шифрование PDF оригинала: [${subj.name}] ${folder}/${pdfItem.name}`);
        const encrypted = encryptWithKey(content, sharedKey, vaultSalt);
        fs.writeFileSync(blobPath, encrypted);

        lecData.originals.push({
          name: pdfItem.name,
          type: 'pdf',
          blob: hash,
          size: content.length
        });
      }

      currentLectures.push(lecData);
    }
  }

  // ИСТИННЫЙ MIRROR-MODE:
  const finalLectures = currentLectures;

  const finalMeta = {
    schema: 1,
    subjects: finalSubjects,
    modules: normalizedModules,
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

  // Шифрование метаданных каталога студентов (metadata.bin)
  console.log('🔐 Шифрование каталога студентов metadata.bin (AES-256-GCM)...');
  const metaJsonBuf = Buffer.from(JSON.stringify(finalMeta), 'utf8');
  const encMeta = encryptWithKey(metaJsonBuf, sharedKey, vaultSalt);
  fs.writeFileSync(path.join(ROOT_DIR, 'metadata.bin'), encMeta);

  // Шифрование каталога администратора (admin.bin) с инъекцией sharedKeyHex
  console.log('🔐 Шифрование админ-каталога admin.bin (AES-256-GCM)...');
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
  console.log(`🏛️ «КОНСПЕКТЫ ФПМ» — СИНХРОНИЗАЦИЯ УСПЕШНО ЗАВЕРШЕНА!`);
  console.log(`📚 Предметов в архиве: ${finalSubjects.length}`);
  console.log(`📝 Всего материалов: ${finalLectures.length}`);
  console.log(`📦 Активных шифрованных blobs: ${activeBlobHashes.size}`);
  console.log(`🔑 Пароль студента: ${config.sharedPassword}`);
  console.log(`🔑 Пароль администратора: ${config.adminPassword}`);
  console.log(`==================================================\n`);

  if (!args.includes('--no-push')) {
    deployToGitHub(config);
  }
}

function deployToGitHub(config) {
  if (!config.repoUrl) {
    console.log('ℹ️ repoUrl не указан в scripts/sync.json. Деплой на GitHub Pages пропущен.');
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
    execSync('git config user.name "HSE Conspects Deployer"', { cwd: distDir, stdio: 'ignore' });
    execSync('git config user.email "deploy@hse-storage.local"', { cwd: distDir, stdio: 'ignore' });
    execSync('git checkout -b gh-pages', { cwd: distDir, stdio: 'ignore' });

    // .nojekyll отключает обработчик Jekyll на GitHub Pages и гарантирует чистую отдачу файлов и шрифтов
    fs.writeFileSync(path.join(distDir, '.nojekyll'), '');

    execSync('git add -A', { cwd: distDir, stdio: 'ignore' });
    execSync(`git commit -m "Deploy: ${new Date().toISOString()}"`, { cwd: distDir, stdio: 'pipe' });
    execSync(`git remote add origin ${config.repoUrl}`, { cwd: distDir, stdio: 'ignore' });

    console.log(' ⬆️ Выполняется orphan force-push в ветку gh-pages...');
    execSync('git push -f origin gh-pages', { cwd: distDir, stdio: 'inherit' });

    fs.rmSync(distDir, { recursive: true, force: true });
    console.log('🎉 Успешно опубликовано на GitHub Pages!');
  } catch (err) {
    const errorDetails = err.stderr ? err.stderr.toString() : err.message;
    console.error('❌ Ошибка при отправке на GitHub Pages:\n', errorDetails);
  }
}

runSync().catch(err => {
  console.error('❌ Фатальная ошибка sync.js:', err);
  process.exit(1);
});
