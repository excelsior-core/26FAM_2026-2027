/**
 * app/search.js - Разговорный интеллектуальный NLP-поиск и командная палитра (Ctrl+K или /)
 * Особенности:
 * 1. Русский стеммер Портера (поиск по корням слов и морфологическим основам)
 * 2. Распознавание студенческого сленга («матан», «линал», «дискретка», «аг», «коллок», «первая пара»)
 * 3. Поиск по оригинальным темам PDF лекторов («метод Гаусса», «комплексные числа», «кольцо вычетов»)
 * 4. Поиск по датам и месяцам («02.09», «2 сентября», «октябрь», «4 сент»)
 * 5. Поиск по дедлайнам и коллоквиумам
 * 6. Фоновый полнотекстовый поиск по содержимому расшифрованных конспектов
 * 100% Zero-Knowledge & Zero-CDN: локально, в памяти, 0 мс задержки.
 */

export class SearchEngine {
  constructor() {
    this.index = [];
    this.announcements = [];
    this.modal = document.getElementById('palette-modal');
    this.input = document.getElementById('palette-search-input');
    this.closeBtn = document.getElementById('palette-close-btn');
    this.resultsContainer = document.getElementById('palette-results-list');
    this.selectedIndex = 0;
    this.currentResults = [];
    this.onSelectCallback = null;

    this.stopWords = new Set([
      'где', 'там', 'было', 'про', 'как', 'что', 'че', 'чё', 'на', 'в', 'во',
      'к', 'ко', 'по', 'мне', 'для', 'ли', 'же', 'да', 'ну', 'у', 'из', 'изо',
      'от', 'ото', 'о', 'об', 'обо', 'и', 'а', 'но', 'или', 'когда', 'если',
      'то', 'бы', 'этот', 'эта', 'это', 'эти', 'будет', 'учить', 'есть', 'какой',
      'какая', 'какие', 'найти', 'подскажи', 'покажи', 'хочу', 'надо', 'нужно',
      'материал', 'материалы'
    ]);

    // Канонические предметы ФПМ и их разговорные студенческие синонимы
    this.intentAliases = {
      // Математический Анализ
      'матан': { subject: 'Математический Анализ' },
      'анализ': { subject: 'Математический Анализ' },
      'матанализ': { subject: 'Математический Анализ' },
      'математический': { subject: 'Математический Анализ' },
      'вышмат': { subject: 'Математический Анализ' },

      // Алгебра
      'линал': { subject: 'Алгебра' },
      'алгебра': { subject: 'Алгебра' },
      'алгебре': { subject: 'Алгебра' },
      'вышка': { subject: 'Алгебра' },

      // Аналитическая Геометрия
      'аг': { subject: 'Аналитическая Геометрия' },
      'ангем': { subject: 'Аналитическая Геометрия' },
      'аналит': { subject: 'Аналитическая Геометрия' },
      'геометрия': { subject: 'Аналитическая Геометрия' },
      'геом': { subject: 'Аналитическая Геометрия' },

      // Дискретная Математика
      'дискретка': { subject: 'Дискретная Математика' },
      'дикра': { subject: 'Дискретная Математика' },
      'дискретная': { subject: 'Дискретная Математика' },
      'дм': { subject: 'Дискретная Математика' },

      // Категории
      'коллок': { category: 'коллоквиумы' },
      'коллоквиум': { category: 'коллоквиумы' },
      'билет': { category: 'коллоквиумы' },
      'билеты': { category: 'коллоквиумы' },
      'вопросы': { category: 'коллоквиумы' },
      'экз': { category: 'экзамены' },
      'экзамен': { category: 'экзамены' },
      'сессия': { category: 'экзамены' },
      'сем': { category: 'семинары' },
      'семинар': { category: 'семинары' },
      'практика': { category: 'семинары' },
      'лекция': { category: 'лекции' },
      'лекции': { category: 'лекции' }
    };

    // Парсер номеров пар в разговорной речи
    this.sessionWords = {
      'первая': 1, 'первой': 1, 'первую': 1, '1-я': 1, '1-й': 1, 'первое': 1, 'первом': 1,
      'вторая': 2, 'второй': 2, 'вторую': 2, '2-я': 2, '2-й': 2, 'второе': 2, 'втором': 2,
      'третья': 3, 'третьей': 3, 'третью': 3, '3-я': 3, '3-й': 3, 'третье': 3, 'третьем': 3,
      'четвертая': 4, 'четвертой': 4, '4-я': 4, '4-й': 4,
      'пятая': 5, 'пятой': 5, '5-я': 5, '5-й': 5,
      'шестая': 6, 'шестой': 6, '6-я': 6, '6-й': 6,
      'седьмая': 7, 'седьмой': 7, '7-я': 7, '7-й': 7,
      'восьмая': 8, 'восьмой': 8, '8-я': 8, '8-й': 8,
      'девятая': 9, 'девятой': 9, '9-я': 9, '9-й': 9,
      'десятая': 10, 'десятой': 10, '10-я': 10, '10-й': 10
    };

    this.monthNames = {
      '01': ['январь', 'января', 'янв'],
      '02': ['февраль', 'февраля', 'фев'],
      '03': ['март', 'марта', 'мар'],
      '04': ['апрель', 'апреля', 'апр'],
      '05': ['май', 'мая'],
      '06': ['июнь', 'июня', 'июн'],
      '07': ['июль', 'июля', 'июл'],
      '08': ['август', 'августа', 'авг'],
      '09': ['сентябрь', 'сентября', 'сент'],
      '10': ['октябрь', 'октября', 'окт'],
      '11': ['ноябрь', 'ноября', 'нояб'],
      '12': ['декабрь', 'декабря', 'дек']
    };

    this.initEvents();
  }

  setSelectCallback(cb) {
    this.onSelectCallback = cb;
  }

  initEvents() {
    window.addEventListener('keydown', (e) => {
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName);

      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'k' || e.code === 'KeyK')) {
        e.preventDefault();
        this.open();
      } else if (e.key === '/' && !isInput) {
        e.preventDefault();
        this.open();
      } else if (e.key === 'Escape' && this.isOpen()) {
        this.close();
      }
    });

    if (this.modal) {
      this.modal.addEventListener('click', (e) => {
        if (e.target === this.modal) this.close();
      });
    }

    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.close());
    }

    if (this.input) {
      this.input.addEventListener('input', () => this.handleSearch());
      this.input.addEventListener('keydown', (e) => this.handleKeyNavigation(e));
    }
  }

  isOpen() {
    return this.modal && this.modal.classList.contains('open');
  }

  open() {
    if (!this.modal) return;
    this.modal.classList.add('open');
    if (this.input) {
      this.input.value = '';
      setTimeout(() => this.input.focus(), 50);
    }
    this.selectedIndex = 0;
    this.handleSearch();
  }

  close() {
    if (!this.modal) return;
    this.modal.classList.remove('open');
  }

  /**
   * Стеммер Портера для русского языка (отсекает флексии для поиска по корням)
   */
  stem(word) {
    if (!word || word.length < 3) return (word || '').toLowerCase();
    word = word.toLowerCase().replace(/ё/g, 'е');

    const m = word.match(/^(.*?[аеиоуыэюя])(.*)$/);
    if (!m) return word;
    const start = m[1];
    let rv = m[2];

    let match = rv.match(/((ив|ивши|ившись|ыв|ывши|ывшись)|((?<=[ая])(в|вши|вшись)))$/);
    if (match) {
      rv = rv.slice(0, -match[0].length);
    } else {
      match = rv.match(/(с[яь])$/);
      if (match) rv = rv.slice(0, -match[0].length);

      match = rv.match(/(ее|ие|ые|ое|ими|ыми|ей|ий|ый|ой|ем|им|ым|ом|его|ого|ему|ому|их|ых|ую|юю|ая|яя|ою|ею)$/);
      if (match) {
        rv = rv.slice(0, -match[0].length);
        const p = rv.match(/((ивш|ывш|ующ)|((?<=[ая])(ем|нн|вш|ющ|щ)))$/);
        if (p) rv = rv.slice(0, -p[0].length);
      } else {
        match = rv.match(/((ила|ыла|ена|ейте|уйте|ите|или|ыли|ей|уй|ил|ыл|им|ым|ен|ило|ыло|ено|ят|ует|уют|ит|ыт|ены|ить|ыть|ишь|ую|ю)|((?<=[ая])(ла|на|ете|йте|ли|й|л|ем|н|ло|но|ет|ют|ны|ть|ешь|нно)))$/);
        if (match) {
          rv = rv.slice(0, -match[0].length);
        } else {
          match = rv.match(/(ами|ями|иях|ием|ией|иям|иях|ях|ия|ья|ах|ев|ов|ие|ье|е|я|у|ю|ии|и|ы|ь|ей|ой|ем|ам|ом|о|а)$/);
          if (match) rv = rv.slice(0, -match[0].length);
        }
      }
    }

    if (rv.endsWith('и')) rv = rv.slice(0, -1);
    if (rv.endsWith('ь')) rv = rv.slice(0, -1);
    if (rv.endsWith('нн')) rv = rv.slice(0, -1);

    return start + rv;
  }

  isFuzzyMatch(a, b, maxDist = 1) {
    if (!a || !b) return false;
    if (Math.abs(a.length - b.length) > maxDist) return false;
    if (a === b) return true;
    if (a.length < 4 || b.length < 4) return a === b;

    const lenA = a.length;
    const lenB = b.length;
    const dp = Array.from({ length: lenA + 1 }, () => new Array(lenB + 1).fill(0));

    for (let i = 0; i <= lenA; i++) dp[i][0] = i;
    for (let j = 0; j <= lenB; j++) dp[0][j] = j;

    for (let i = 1; i <= lenA; i++) {
      for (let j = 1; j <= lenB; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + cost
        );
      }
    }
    return dp[lenA][lenB] <= maxDist;
  }

  tokenizeAndStem(text) {
    if (!text) return [];
    const rawTokens = text.toLowerCase().split(/[^a-zа-яё0-9_]+/i).filter(Boolean);
    const result = [];
    for (const t of rawTokens) {
      if (!this.stopWords.has(t)) {
        result.push(this.stem(t));
      }
    }
    return result;
  }

  /**
   * Построение поискового индекса каталога
   */
  buildIndex(metadataOrLectures, decryptedTexts = new Map()) {
    this.index = [];
    const lectures = Array.isArray(metadataOrLectures)
      ? metadataOrLectures
      : (metadataOrLectures?.lectures || []);

    const announcements = (!Array.isArray(metadataOrLectures) && metadataOrLectures?.announcements)
      ? metadataOrLectures.announcements
      : [];

    this.announcements = announcements;

    // 1. Индексация объявлений / дедлайнов (коллоквиумы, домашние задания)
    for (const ann of announcements) {
      const annText = `${ann.title || ''} ${ann.subject || ''} ${ann.text || ''}`.trim();
      const tokens = this.tokenizeAndStem(annText);
      const isColloq = (ann.title || '').toLowerCase().includes('коллок') || (ann.text || '').toLowerCase().includes('коллок');

      this.index.push({
        id: ann.id,
        type: 'announcement',
        subject: ann.subject || 'Дедлайн',
        category: isColloq ? 'коллоквиумы' : 'дедлайны',
        title: ann.title || '',
        description: ann.text || '',
        folder: '',
        tags: [],
        module: '',
        sessions: [],
        sessionNumbers: [],
        origTitles: '',
        dateStrings: ann.datetime ? [new Date(ann.datetime).toLocaleDateString('ru-RU')] : [],
        content: ann.text || '',
        hasPdf: false,
        tokens: [...new Set(tokens)],
        rawTextLower: annText.toLowerCase(),
        firstSessionNumber: 0
      });
    }

    // 2. Индексация учебных материалов
    for (const lec of lectures) {
      const plainContent = decryptedTexts.get(lec.id) || '';

      const origTitles = (lec.originals || []).map(o => (o.name || '').replace(/\.pdf$/i, '').replace(/[()_]/g, ' ')).join(' ');
      const fileTitles = (lec.files || []).map(f => (f.name || '').replace(/\.[a-z0-9]+$/i, '').replace(/[()_]/g, ' ')).join(' ');

      const dateStrings = [];
      const sessionNumbers = (lec.sessions || []).map(s => s.number).filter(n => typeof n === 'number');

      for (const s of lec.sessions || []) {
        if (s.date) {
          dateStrings.push(s.date);
          const parts = s.date.split('.');
          if (parts.length >= 2) {
            const day = parseInt(parts[0], 10);
            const month = parts[1];
            dateStrings.push(`${day}.${parts[1]}`, `${parts[0]}.${parts[1]}`);
            const mNames = this.monthNames[month] || [];
            dateStrings.push(...mNames);
            if (mNames[1]) {
              dateStrings.push(`${day} ${mNames[1]}`);
              dateStrings.push(`${day} ${mNames[2] || mNames[0]}`);
            }
          }
        }
      }

      const allSearchableText = [
        lec.title || '',
        lec.subject || '',
        lec.category || '',
        lec.folder || '',
        (lec.tags || []).join(' '),
        lec.description || '',
        origTitles,
        fileTitles,
        dateStrings.join(' '),
        plainContent
      ].join(' ');

      const tokens = this.tokenizeAndStem(allSearchableText);

      this.index.push({
        id: lec.id,
        type: 'lecture',
        subject: lec.subject || '',
        category: (lec.category || 'лекции').toLowerCase(),
        title: lec.title || '',
        description: lec.description || '',
        folder: lec.folder || '',
        tags: lec.tags || [],
        module: lec.module || '',
        sessions: lec.sessions || [],
        sessionNumbers: sessionNumbers,
        origTitles: origTitles,
        dateStrings: dateStrings,
        content: plainContent,
        hasPdf: (lec.originals && lec.originals.length > 0),
        tokens: [...new Set(tokens)],
        rawTextLower: allSearchableText.toLowerCase(),
        firstSessionNumber: sessionNumbers.length > 0 ? Math.min(...sessionNumbers) : 999
      });
    }
  }

  /**
   * Обновление текста лекции после фоновой расшифровки HTML-конспекта
   */
  updateLectureContent(lectureId, htmlContent) {
    const item = this.index.find(i => i.id === lectureId && i.type === 'lecture');
    if (item) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      const cleanText = (tempDiv.textContent || tempDiv.innerText || '').replace(/\s+/g, ' ');
      item.content = cleanText;
      item.rawTextLower += ' ' + cleanText.toLowerCase();
      const contentTokens = this.tokenizeAndStem(cleanText);
      item.tokens = [...new Set([...item.tokens, ...contentTokens])];
    }
  }

  /**
   * Извлечение семантических намерений студента из запроса
   */
  parseIntent(rawQuery) {
    if (!rawQuery) return { targetSubject: null, targetCategory: null, targetSessionNumber: null, wantsAnnouncement: false, meaningfulTokens: [] };
    const q = rawQuery.trim().toLowerCase();
    const rawTokens = q.split(/[^a-zа-яё0-9_.-]+/i).filter(Boolean);

    let targetSubject = null;
    let targetCategory = null;
    let targetSessionNumber = null;
    let wantsAnnouncement = false;
    const meaningfulTokens = [];

    for (let i = 0; i < rawTokens.length; i++) {
      const t = rawTokens[i];

      // Номера пар словами («первая пара», «вторая»)
      if (this.sessionWords[t]) {
        targetSessionNumber = this.sessionWords[t];
        continue;
      }

      // Номера пар цифрами («1 пара», «пара 2», «лекция 3», «№ 4», или одиночная цифра)
      if (/^\d{1,3}$/.test(t)) {
        const prev = rawTokens[i - 1] || '';
        const next = rawTokens[i + 1] || '';
        const isSessionMarker = ['пара', 'пары', 'лекция', 'лекции', 'зан', 'занятие', '№', 'ном'].some(m => prev.includes(m) || next.includes(m));
        if (isSessionMarker || rawTokens.length <= 2) {
          targetSessionNumber = parseInt(t, 10);
          continue;
        }
      }

      // Алиасы предметов («матан», «линал», «дискретка», «аг»)
      if (this.intentAliases[t] && this.intentAliases[t].subject) {
        targetSubject = this.intentAliases[t].subject;
        continue;
      }

      // Алиасы категорий («коллок», «билеты», «экзамен»)
      if (this.intentAliases[t] && this.intentAliases[t].category) {
        targetCategory = this.intentAliases[t].category;
        if (targetCategory === 'коллоквиумы' || targetCategory === 'экзамены') {
          wantsAnnouncement = true;
        }
        continue;
      }

      if (['дедлайн', 'дедлайны', 'дз', 'коллок', 'коллоквиум'].includes(t)) {
        wantsAnnouncement = true;
      }

      if (!this.stopWords.has(t) && !['пара', 'пары', 'лекция', 'лекции', 'занятие'].includes(t)) {
        meaningfulTokens.push(t);
      }
    }

    return { targetSubject, targetCategory, targetSessionNumber, wantsAnnouncement, meaningfulTokens };
  }

  /**
   * Чистый полнотекстовый и семантический поиск
   */
  search(rawQuery) {
    if (!rawQuery) {
      return this.index.filter(i => i.type === 'lecture').slice(0, 10);
    }
    const q = rawQuery.trim().toLowerCase();
    const intent = this.parseIntent(q);
    const { targetSubject, targetCategory, targetSessionNumber, wantsAnnouncement, meaningfulTokens } = intent;

    const stemmedQueryTokens = meaningfulTokens.map(t => this.stem(t));
    const scored = [];

    for (const item of this.index) {
      // ПРАВИЛО 1: Строгая изоляция предмета, если пользователь явно указал его
      if (targetSubject && item.type === 'lecture') {
        if (item.subject.toLowerCase() !== targetSubject.toLowerCase()) {
          continue;
        }
      }

      // ПРАВИЛО 2: Строгая проверка номера занятия (исключаем подстроки вроде "1" в "10" или "13")
      if (targetSessionNumber !== null && item.type === 'lecture') {
        const hasSession = item.sessionNumbers.includes(targetSessionNumber);
        const titleHasExact = new RegExp(`(?<!\\d)${targetSessionNumber}(?!\\d)`).test(item.title);
        if (!hasSession && !titleHasExact) {
          continue;
        }
      }

      let score = 0;

      // Объявления ранжируются высоко только если студент искал дедлайны/коллоквиумы
      if (item.type === 'announcement') {
        if (!wantsAnnouncement && !targetCategory) {
          score = 10;
        } else {
          score = 90;
        }
      } else {
        score = 25;
      }

      // Точное совпадение всей фразы
      if (item.rawTextLower.includes(q)) {
        score += 85;
      }

      // Бонус за предмет
      if (targetSubject && item.subject.toLowerCase() === targetSubject.toLowerCase()) {
        score += 80;
      }

      // Бонус за категорию
      if (targetCategory && item.category === targetCategory) {
        score += 50;
      }

      // Бонус за номер пары
      if (targetSessionNumber !== null) {
        if (item.sessionNumbers.includes(targetSessionNumber)) {
          score += 100;
        } else if (new RegExp(`(?<!\\d)${targetSessionNumber}(?!\\d)`).test(item.title)) {
          score += 60;
        }
      }

      const titleLower = item.title.toLowerCase();
      const descLower = item.description.toLowerCase();
      const contentLower = item.content.toLowerCase();
      const origTitlesLower = item.origTitles.toLowerCase();

      for (let i = 0; i < meaningfulTokens.length; i++) {
        const rawToken = meaningfulTokens[i];
        const stemToken = stemmedQueryTokens[i];

        if (titleLower.includes(rawToken)) {
          score += 55;
        } else if (item.tokens.some(t => t === stemToken || this.isFuzzyMatch(t, stemToken))) {
          score += 35;
        }

        if (origTitlesLower.includes(rawToken)) {
          score += 65;
        }

        if (descLower.includes(rawToken)) {
          score += 50;
        }

        if (item.dateStrings.some(d => d.toLowerCase().includes(rawToken))) {
          score += 45;
        }

        if (item.folder.toLowerCase().includes(rawToken)) {
          score += 25;
        }

        if (contentLower.includes(rawToken)) {
          score += 25;
        }
      }

      if (score > 15) {
        scored.push({
          item,
          score,
          snippet: this.extractSnippet(item, meaningfulTokens.length > 0 ? meaningfulTokens : [q])
        });
      }
    }

    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (a.item.firstSessionNumber || 0) - (b.item.firstSessionNumber || 0);
    });

    const maxScore = scored.length > 0 ? scored[0].score : 0;
    const relevant = scored.filter(s => s.score >= Math.max(25, maxScore * 0.35));

    return relevant.map(s => ({ ...s.item, snippet: s.snippet }));
  }

  handleSearch() {
    if (!this.input) return;
    const rawQuery = this.input.value;
    this.currentResults = this.search(rawQuery);
    this.selectedIndex = 0;
    this.renderResults(rawQuery);
  }

  extractSnippet(item, tokens) {
    if (item.type === 'announcement') {
      const text = item.description || item.title;
      return text.length > 130 ? text.slice(0, 130) + '…' : text;
    }

    const topicHint = item.origTitles ? `Тема из PDF: ${item.origTitles}` : '';
    const text = item.content || item.description || topicHint || item.folder || '';
    if (!text) return '';

    const lower = text.toLowerCase();
    let bestPos = -1;
    for (const t of tokens) {
      if (!t || t.length < 2) continue;
      const idx = lower.indexOf(t.toLowerCase());
      if (idx !== -1 && (bestPos === -1 || idx < bestPos)) {
        bestPos = idx;
      }
    }

    if (bestPos === -1) {
      if (topicHint && topicHint !== text) {
        return `📌 ${topicHint}` + (text ? ` · ${text.slice(0, 90)}…` : '');
      }
      return text.slice(0, 120) + (text.length > 120 ? '…' : '');
    }

    const start = Math.max(0, bestPos - 40);
    const end = Math.min(text.length, bestPos + 100);
    return (start > 0 ? '…' : '') + text.slice(start, end) + (end < text.length ? '…' : '');
  }

  highlightMatches(text, query) {
    if (!query || !text) return text;
    const tokens = query.split(/[^a-zа-яё0-9_.-]+/i).filter(t => !this.stopWords.has(t) && t.length > 1);
    if (tokens.length === 0) return text;

    let result = text;
    for (const t of tokens) {
      const stem = this.stem(t);
      const safeT = t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const safeStem = stem.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${safeT}|${safeStem}[а-яё]*)`, 'gi');
      result = result.replace(regex, '<mark class="search-highlight">$1</mark>');
    }
    return result;
  }

  handleKeyNavigation(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.selectedIndex = (this.selectedIndex + 1) % Math.max(1, this.currentResults.length);
      this.updateSelectionVisuals();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.selectedIndex = (this.selectedIndex - 1 + this.currentResults.length) % Math.max(1, this.currentResults.length);
      this.updateSelectionVisuals();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (this.currentResults[this.selectedIndex]) {
        const item = this.currentResults[this.selectedIndex];
        this.close();
        if (this.onSelectCallback) this.onSelectCallback(item, e.ctrlKey || e.metaKey);
      }
    }
  }

  updateSelectionVisuals() {
    if (!this.resultsContainer) return;
    const items = this.resultsContainer.querySelectorAll('.palette-item');
    items.forEach((el, idx) => {
      el.classList.toggle('selected', idx === this.selectedIndex);
      if (idx === this.selectedIndex) {
        el.scrollIntoView({ block: 'nearest' });
      }
    });
  }

  renderResults(query) {
    if (!this.resultsContainer) return;
    this.resultsContainer.innerHTML = '';

    if (this.currentResults.length === 0) {
      this.resultsContainer.innerHTML = `
        <div class="palette-empty" style="text-align: center; padding: 36px 20px; color: var(--parchment-muted);">
          По запросу <span style="color: var(--gold-antique);">«${query}»</span> ничего не найдено.<br>
          <span style="font-size: 0.78rem; opacity: 0.7; display: inline-block; margin-top: 8px;">
            Попробуйте спросить: «матан 1», «метод Гаусса», «комплексные числа», «2 сентября», «коллок».
          </span>
        </div>
      `;
      return;
    }

    this.currentResults.forEach((item, index) => {
      const el = document.createElement('div');
      el.className = `palette-item ${index === this.selectedIndex ? 'selected' : ''}`;

      const titleHl = this.highlightMatches(item.title, query);
      const snippetHl = this.highlightMatches(item.snippet || item.description || '', query);
      const pdfBadge = item.hasPdf ? `<span class="pdf-tag-mini" style="font-family: var(--font-mono); font-size: 0.68rem; color: var(--gold-light); background: rgba(212, 175, 55, 0.1); border: 1px solid var(--border-subtle); padding: 1px 6px; border-radius: 3px;">📄 PDF</span>` : '';
      const actionBadge = item.type === 'announcement' ? `<span style="font-family: var(--font-mono); font-size: 0.68rem; background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); padding: 1px 6px; border-radius: 3px;">ДЕЙСТВИЕ</span>` : '';

      el.innerHTML = `
        <div class="palette-item-header">
          <div class="palette-item-title">${titleHl}</div>
          <div class="palette-item-badges" style="display: flex; gap: 6px; align-items: center;">
            <span class="palette-item-subject" style="font-family: var(--font-serif); font-size: 0.75rem; text-transform: uppercase; color: var(--gold-antique);">${item.subject}</span>
            ${actionBadge}
            ${pdfBadge}
          </div>
        </div>
        ${snippetHl ? `<div class="palette-item-snippet" style="font-size: 0.82rem; color: var(--parchment-muted); line-height: 1.45;">${snippetHl}</div>` : ''}
      `;

      el.addEventListener('click', (e) => {
        this.close();
        if (this.onSelectCallback) this.onSelectCallback(item, e.ctrlKey || e.metaKey);
      });

      this.resultsContainer.appendChild(el);
    });
  }
}
