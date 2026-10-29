/**
 * app/search.js - Интеллектуальный сниппет-поиск и командная палитра (Ctrl+K или /)
 * Мгновенный полнотекстовый поиск по расшифрованным лекциям, темам, формулам и терминам
 * с извлечением точного контекста и подсветкой математических определений.
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

    this.initEvents();
  }

  setSelectCallback(cb) {
    this.onSelectCallback = cb;
  }

  initEvents() {
    window.addEventListener('keydown', (e) => {
      // Игнорируем нажатия, если фокус уже в поле ввода (кроме Esc)
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
   * Индексация метаданных и текстов лекций
   */
  buildIndex(metadata, decryptedTexts = new Map()) {
    this.index = [];
    for (const lec of metadata.lectures || []) {
      const plainContent = decryptedTexts.get(lec.id) || '';
      this.index.push({
        id: lec.id,
        subject: lec.subject || '',
        category: lec.category || 'лекции',
        title: lec.title || '',
        description: lec.description || '',
        tags: lec.tags || [],
        module: lec.module || '',
        sessions: lec.sessions || [],
        content: plainContent,
        hasPdf: (lec.originals && lec.originals.length > 0)
      });
    }
  }

  /**
   * Добавление полного текста расшифрованного конспекта в индекс на лету
   */
  updateLectureContent(lectureId, htmlContent) {
    const item = this.index.find(i => i.id === lectureId);
    if (item) {
      // Очистка HTML тегов для чистого текстового поиска
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      item.content = tempDiv.textContent || tempDiv.innerText || '';
    }
  }

  handleSearch() {
    const query = this.input.value.trim().toLowerCase();
    if (!query) {
      this.currentResults = this.index.slice(0, 8); // Показываем недавние лекции
      this.selectedIndex = 0;
      this.renderResults(query);
      return;
    }

    const tokens = query.split(/\s+/).filter(Boolean);
    const scored = [];

    for (const item of this.index) {
      let score = 0;
      const titleLower = item.title.toLowerCase();
      const descLower = item.description.toLowerCase();
      const subjLower = item.subject.toLowerCase();
      const contentLower = item.content.toLowerCase();

      for (const t of tokens) {
        if (titleLower.includes(t)) score += 50;
        if (subjLower.includes(t)) score += 30;
        if (item.tags.some(tag => tag.toLowerCase().includes(t))) score += 20;
        if (descLower.includes(t)) score += 15;
        if (contentLower.includes(t)) score += 5;
      }

      if (score > 0) {
        scored.push({ item, score, snippet: this.extractSnippet(item, tokens) });
      }
    }

    scored.sort((a, b) => b.score - a.score);
    this.currentResults = scored.map(s => ({ ...s.item, snippet: s.snippet }));
    this.selectedIndex = 0;
    this.renderResults(query);
  }

  extractSnippet(item, tokens) {
    const text = item.content || item.description || item.title;
    if (!text) return '';

    const lower = text.toLowerCase();
    let bestPos = -1;
    for (const t of tokens) {
      const idx = lower.indexOf(t);
      if (idx !== -1 && (bestPos === -1 || idx < bestPos)) {
        bestPos = idx;
      }
    }

    if (bestPos === -1) return text.slice(0, 120) + '...';

    const start = Math.max(0, bestPos - 45);
    const end = Math.min(text.length, bestPos + 95);
    let snippet = (start > 0 ? '…' : '') + text.slice(start, end) + (end < text.length ? '…' : '');
    return snippet;
  }

  highlightMatches(text, query) {
    if (!query || !text) return text;
    const tokens = query.split(/\s+/).filter(Boolean);
    let result = text;
    for (const t of tokens) {
      const regex = new RegExp(`(${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
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
        <div class="palette-empty">
          По запросу <span style="color: var(--accent-color);">«${query}»</span> ничего не найдено
        </div>
      `;
      return;
    }

    this.currentResults.forEach((item, index) => {
      const el = document.createElement('div');
      el.className = `palette-item ${index === this.selectedIndex ? 'selected' : ''}`;

      const titleHl = this.highlightMatches(item.title, query);
      const snippetHl = this.highlightMatches(item.snippet || item.description || '', query);
      const pdfBadge = item.hasPdf ? `<span class="pdf-tag-mini">📄 PDF</span>` : '';

      el.innerHTML = `
        <div class="palette-item-header">
          <div class="palette-item-title">${titleHl}</div>
          <div class="palette-item-badges">
            <span class="palette-item-subject">${item.subject}</span>
            ${pdfBadge}
          </div>
        </div>
        ${snippetHl ? `<div class="palette-item-snippet">${snippetHl}</div>` : ''}
      `;

      el.addEventListener('click', (e) => {
        this.close();
        if (this.onSelectCallback) this.onSelectCallback(item.id, e.ctrlKey || e.metaKey);
      });

      this.resultsContainer.appendChild(el);
    });
  }
}
