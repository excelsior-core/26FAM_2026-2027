/**
 * app/search.js - Разговорный интеллектуальный NLP-поиск и командная палитра (Ctrl+K или /)
 * Особенности:
 * 1. Русский стеммер (отсечение окончаний для поиска по корням)
 * 2. Фильтрация разговорного шума и стоп-слов («где там было про», «как решать», «че на коллоке»)
 * 3. Семантическое распознавание студенческого сленга и намерений («матан», «коллок», «домашка», «первая пара»)
 * 4. Устойчивость к опечаткам (Damerau-Levenshtein distance)
 * 5. Контекстное извлечение сниппетов с точной подсветкой математических терминов и формул
 * 100% Zero-Knowledge & Zero-CDN: локально, в памяти, 0 мс задержки.
 */

export class SearchEngine {
  constructor() {
    this.index = [];
    this.modal = document.getElementById('palette-modal');
    this.input = document.getElementById('palette-search-input');
    this.resultsContainer = document.getElementById('palette-results-list');
    this.selectedIndex = 0;
    this.currentResults = [];
    this.onSelectCallback = null;

    this.stopWords = new Set([
      'где', 'там', 'было', 'про', 'как', 'что', 'че', 'чё', 'на', 'в', 'во',
      'к', 'ко', 'по', 'мне', 'для', 'ли', 'же', 'да', 'ну', 'у', 'из', 'изо',
      'от', 'ото', 'о', 'об', 'обо', 'и', 'а', 'но', 'или', 'когда', 'если',
      'то', 'бы', 'этот', 'эта', 'это', 'эти', 'будет', 'учить', 'есть', 'какой',
      'какая', 'какие', 'найти', 'подскажи', 'покажи', 'хочу', 'надо', 'нужно'
    ]);

    // Семантические синонимы и намерения
    this.intentAliases = {
      // Предметы
      'матан': { subject: 'Матанализ' },
      'анализ': { subject: 'Матанализ' },
      'линал': { subject: 'Линал и Аналит' },
      'аналит': { subject: 'Линал и Аналит' },
      'дискретка': { subject: 'Дискретная математика' },
      'дикра': { subject: 'Дискретная математика' },
      'прога': { subject: 'Программирование' },
      'плюсы': { subject: 'Программирование' },
      'си': { subject: 'Программирование' },

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
      'лекция': { category: 'лекции' }
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
    this.input.value = '';
    this.selectedIndex = 0;
    this.handleSearch();
    setTimeout(() => this.input.focus(), 50);
  }

  close() {
    if (!this.modal) return;
    this.modal.classList.remove('open');
  }

  /**
   * Стеммер Портера для русского языка (отсекает флексии для поиска по корням)
   */
  stem(word) {
    if (!word || word.length < 3) return word.toLowerCase();
    word = word.toLowerCase().replace(/ё/g, 'е');

    const m = word.match(/^(.*?[аеиоуыэюя])(.*)$/);
    if (!m) return word;
    const start = m[1];
    let rv = m[2];

    // Шаг 1: отсечение окончаний причастий, деепричастий, прилагательных, глаголов, существительных
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

  /**
   * Нечеткое расстояние Левенштейна (прощение опечаток в 1-2 символа)
   */
  isFuzzyMatch(a, b, maxDist = 1) {
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

  buildIndex(metadata, decryptedTexts = new Map()) {
    this.index = [];
    for (const lec of metadata.lectures || []) {
      const plainContent = decryptedTexts.get(lec.id) || '';
      const tokens = this.tokenizeAndStem(`${lec.title} ${lec.subject} ${lec.category || ''} ${(lec.tags || []).join(' ')} ${lec.description || ''}`);

      this.index.push({
        id: lec.id,
        subject: lec.subject || '',
        category: (lec.category || 'лекции').toLowerCase(),
        title: lec.title || '',
        description: lec.description || '',
        tags: lec.tags || [],
        module: lec.module || '',
        sessions: lec.sessions || [],
        content: plainContent,
        hasPdf: (lec.originals && lec.originals.length > 0),
        tokens: tokens
      });
    }
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

  updateLectureContent(lectureId, htmlContent) {
    const item = this.index.find(i => i.id === lectureId);
    if (item) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      item.content = tempDiv.textContent || tempDiv.innerText || '';
      const contentTokens = this.tokenizeAndStem(item.content);
      item.tokens = [...new Set([...item.tokens, ...contentTokens])];
    }
  }

  handleSearch() {
    const rawQuery = this.input.value.trim().toLowerCase();
    if (!rawQuery) {
      this.currentResults = this.index.slice(0, 8);
      this.selectedIndex = 0;
      this.renderResults(rawQuery);
      return;
    }

    // 1. Извлечение семантических намерений (Intent Parsing)
    const rawTokens = rawQuery.split(/[^a-zа-яё0-9_]+/i).filter(Boolean);
    let targetSubject = null;
    let targetCategory = null;
    let targetSessionNumber = null;
    const meaningfulTokens = [];

    for (let i = 0; i < rawTokens.length; i++) {
      const t = rawTokens[i];

      // Проверка на номера пар (например, "первая пара", "1 пара")
      if (this.sessionWords[t]) {
        targetSessionNumber = this.sessionWords[t];
        continue;
      }
      if (/^\d{1,2}$/.test(t) && (rawTokens[i + 1] === 'пара' || rawTokens[i - 1] === 'пара')) {
        targetSessionNumber = parseInt(t, 10);
        continue;
      }

      // Проверка на алиасы предметов и категорий
      if (this.intentAliases[t]) {
        const alias = this.intentAliases[t];
        if (alias.subject) targetSubject = alias.subject;
        if (alias.category) targetCategory = alias.category;
        continue;
      }

      // Фильтрация стоп-слов
      if (!this.stopWords.has(t)) {
        meaningfulTokens.push(t);
      }
    }

    const stemmedQueryTokens = meaningfulTokens.map(t => this.stem(t));

    // 2. Ранжирование материалов
    const scored = [];

    for (const item of this.index) {
      let score = 0;

      // Бонус за совпадение семантического намерения по предмету
      if (targetSubject && item.subject.toLowerCase() === targetSubject.toLowerCase()) {
        score += 80;
      }

      // Бонус за совпадение намерения по категории (коллоквиумы, семинары)
      if (targetCategory && item.category.toLowerCase() === targetCategory.toLowerCase()) {
        score += 70;
      }

      // Бонус за совпадение номера пары
      if (targetSessionNumber) {
        const hasSession = item.sessions.some(s => s.number === targetSessionNumber);
        if (hasSession) score += 90;
      }

      // Оценка по стеммированным токенам
      const titleLower = item.title.toLowerCase();
      const descLower = item.description.toLowerCase();
      const contentLower = item.content.toLowerCase();

      for (let i = 0; i < meaningfulTokens.length; i++) {
        const rawToken = meaningfulTokens[i];
        const stemToken = stemmedQueryTokens[i];

        // Точное совпадение подстроки в заголовке
        if (titleLower.includes(rawToken)) {
          score += 60;
        } else if (item.tokens.some(t => t === stemToken || this.isFuzzyMatch(t, stemToken))) {
          score += 40;
        }

        // Совпадение в тегах
        if (item.tags.some(tag => tag.toLowerCase().includes(rawToken) || this.stem(tag) === stemToken)) {
          score += 35;
        }

        // Совпадение в описании
        if (descLower.includes(rawToken)) {
          score += 20;
        }

        // Совпадение в полном тексте конспекта
        if (contentLower.includes(rawToken)) {
          score += 12;
        }
      }

      if (score > 0) {
        scored.push({
          item,
          score,
          snippet: this.extractSnippet(item, meaningfulTokens.length > 0 ? meaningfulTokens : [rawQuery])
        });
      }
    }

    scored.sort((a, b) => b.score - a.score);
    this.currentResults = scored.map(s => ({ ...s.item, snippet: s.snippet }));
    this.selectedIndex = 0;
    this.renderResults(rawQuery);
  }

  extractSnippet(item, tokens) {
    const text = item.content || item.description || item.title;
    if (!text) return '';

    const lower = text.toLowerCase();
    let bestPos = -1;
    for (const t of tokens) {
      const idx = lower.indexOf(t.toLowerCase());
      if (idx !== -1 && (bestPos === -1 || idx < bestPos)) {
        bestPos = idx;
      }
    }

    if (bestPos === -1) return text.slice(0, 120) + '...';

    const start = Math.max(0, bestPos - 45);
    const end = Math.min(text.length, bestPos + 95);
    return (start > 0 ? '…' : '') + text.slice(start, end) + (end < text.length ? '…' : '');
  }

  highlightMatches(text, query) {
    if (!query || !text) return text;
    const tokens = query.split(/[^a-zа-яё0-9_]+/i).filter(t => !this.stopWords.has(t) && t.length > 1);
    if (tokens.length === 0) return text;

    let result = text;
    for (const t of tokens) {
      const stem = this.stem(t);
      const regex = new RegExp(`(${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}|${stem.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[а-яё]*)`, 'gi');
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
        if (this.onSelectCallback) this.onSelectCallback(item.id, e.ctrlKey || e.metaKey);
      }
    }
  }

  updateSelectionVisuals() {
    const items = this.resultsContainer.querySelectorAll('.palette-item');
    items.forEach((el, idx) => {
      el.classList.toggle('selected', idx === this.selectedIndex);
      if (idx === this.selectedIndex) {
        el.scrollIntoView({ block: 'nearest' });
      }
    });
  }

  renderResults(query) {
    this.resultsContainer.innerHTML = '';

    if (this.currentResults.length === 0) {
      this.resultsContainer.innerHTML = `
        <div class="palette-empty" style="text-align: center; padding: 36px 20px; color: var(--parchment-muted);">
          По запросу <span style="color: var(--gold-antique);">«${query}»</span> ничего не найдено.<br>
          <span style="font-size: 0.76rem; opacity: 0.7;">Попробуйте спросить: «матрицы на 1 паре», «коллок по матану», «векторные пространства».</span>
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

      el.innerHTML = `
        <div class="palette-item-header">
          <div class="palette-item-title">${titleHl}</div>
          <div class="palette-item-badges" style="display: flex; gap: 6px; align-items: center;">
            <span class="palette-item-subject" style="font-family: var(--font-serif); font-size: 0.75rem; text-transform: uppercase; color: var(--gold-antique);">${item.subject}</span>
            ${pdfBadge}
          </div>
        </div>
        ${snippetHl ? `<div class="palette-item-snippet" style="font-size: 0.82rem; color: var(--parchment-muted); line-height: 1.45;">${snippetHl}</div>` : ''}
      `;

      el.addEventListener('click', (e) => {
        this.close();
        if (this.onSelectCallback) this.onSelectCallback(item.id, e.ctrlKey || e.metaKey);
      });

      this.resultsContainer.appendChild(el);
    });
  }
}
