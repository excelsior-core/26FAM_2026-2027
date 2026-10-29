/**
 * app/search.js - Полнотекстовый поиск и командная палитра (Ctrl+K)
 * Быстрый поиск в памяти по заголовкам, тегам, датам, номерам пар и содержимому HTML-конспектов
 */

export class SearchEngine {
  constructor() {
    this.index = []; // { lecture, textContent: string }
    this.isIndexed = false;
  }

  /**
   * Очистка HTML от тегов, скриптов и стилей для чистого текстового поиска
   * @param {string} html 
   * @returns {string}
   */
  static cleanHtml(html) {
    if (!html) return '';
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&[a-z]+;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Построение поискового индекса по лекциям
   * @param {Array} lectures 
   * @param {Map<string, string>} htmlCache Map: blobHash -> cleanText
   */
  buildIndex(lectures, htmlCache = new Map()) {
    this.index = lectures.map(lecture => {
      let fullContent = '';
      if (lecture.files) {
        for (const file of lecture.files) {
          if (file.type === 'html' && file.blob && htmlCache.has(file.blob)) {
            fullContent += ' ' + htmlCache.get(file.blob);
          }
        }
      }

      const sessionsText = (lecture.sessions || [])
        .map(s => `№${s.number} ${s.number} пара занятие ${s.date || ''}`)
        .join(' ');

      const searchableMeta = [
        lecture.title,
        lecture.subject,
        lecture.module || '',
        (lecture.tags || []).join(' '),
        lecture.description || '',
        sessionsText
      ].join(' ');

      return {
        lecture,
        searchableMeta: searchableMeta.toLowerCase(),
        fullContent: fullContent.toLowerCase(),
        rawContent: fullContent
      };
    });
    this.isIndexed = true;
  }

  /**
   * Поиск по запросу
   * @param {string} query 
   * @returns {Array<{ lecture: Object, snippets: Array<string>, score: number }>}
   */
  search(query) {
    if (!query || !query.trim()) return [];
    const q = query.trim().toLowerCase();
    const terms = q.split(/\s+/).filter(Boolean);

    const results = [];

    for (const item of this.index) {
      let score = 0;
      let matchedMeta = true;

      // Проверка совпадения терминов в метаданных (заголовок, теги, модуль, даты)
      for (const term of terms) {
        if (item.searchableMeta.includes(term)) {
          if (item.lecture.title.toLowerCase().includes(term)) {
            score += 100; // Высокий приоритет за совпадение в заголовке
          } else {
            score += 40;
          }
        } else if (item.fullContent.includes(term)) {
          score += 10;
        } else {
          matchedMeta = false;
          break;
        }
      }

      if (matchedMeta && score > 0) {
        const snippets = this.extractSnippets(item.rawContent, terms);
        results.push({
          lecture: item.lecture,
          snippets,
          score
        });
      }
    }

    // Сортировка по релевантности
    results.sort((a, b) => b.score - a.score);
    return results;
  }

  /**
   * Извлечение сниппетов (±60 символов вокруг вхождения) с подсветкой совпадений
   * @param {string} content 
   * @param {Array<string>} terms 
   * @param {number} maxSnippets 
   * @returns {Array<string>}
   */
  extractSnippets(content, terms, maxSnippets = 3) {
    if (!content || !terms.length) return [];
    const snippets = [];
    const lowerContent = content.toLowerCase();

    for (const term of terms) {
      if (snippets.length >= maxSnippets) break;
      let pos = 0;
      while ((pos = lowerContent.indexOf(term, pos)) !== -1) {
        const start = Math.max(0, pos - 60);
        const end = Math.min(content.length, pos + term.length + 60);
        let snippet = content.slice(start, end).trim();

        // Многоточия
        if (start > 0) snippet = '…' + snippet;
        if (end < content.length) snippet = snippet + '…';

        // Экранирование и подсветка
        const highlighted = this.highlightMatches(snippet, terms);
        if (!snippets.some(s => s.replace(/<[^>]+>/g, '') === snippet)) {
          snippets.push(highlighted);
        }

        if (snippets.length >= maxSnippets) break;
        pos += term.length + 50; // сдвиг вперед
      }
    }

    return snippets;
  }

  /**
   * Подсветка совпадений тегом <mark>
   */
  highlightMatches(text, terms) {
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    let result = escaped;
    for (const term of terms) {
      const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      result = result.replace(regex, '<mark>$1</mark>');
    }
    return result;
  }
}
