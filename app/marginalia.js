/**
 * app/marginalia.js - Система личных шифрованных маргиналий и текстовых маркеров
 * Студент может выделять текст конспекта маркерами 3 благородных цветов,
 * оставлять личные заметки на полях. Данные шифруются AES-GCM и сохраняются локально.
 */

export class MarginaliaManager {
  constructor(app) {
    this.app = app;
    this.currentLectureId = null;
    this.notes = []; // { id, text, color, quote, rangeInfo, createdAt }
    this.popover = null;
    this.initPopover();
  }

  initPopover() {
    this.popover = document.createElement('div');
    this.popover.className = 'marginalia-popover';
    this.popover.style.display = 'none';
    this.popover.innerHTML = `
      <div class="popover-colors">
        <button type="button" class="color-btn hl-gold" title="Золотой пергамент" data-color="gold"></button>
        <button type="button" class="color-btn hl-crimson" title="Охра / Внимание" data-color="crimson"></button>
        <button type="button" class="color-btn hl-sapphire" title="Мыслитель" data-color="sapphire"></button>
      </div>
      <button type="button" class="add-note-btn" title="Добавить заметку на полях">
        <span>📝 На поля</span>
      </button>
    `;
    document.body.appendChild(this.popover);

    this.popover.querySelectorAll('.color-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.applyHighlight(btn.dataset.color);
      });
    });

    this.popover.querySelector('.add-note-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      this.promptMarginNote();
    });
  }

  async attachToIframe(iframeEl, lectureId) {
    this.currentLectureId = lectureId;
    this.iframe = iframeEl;
    await this.loadNotes();

    try {
      const doc = iframeEl.contentDocument || iframeEl.contentWindow?.document;
      if (!doc) return;

      this.injectStyles(doc);
      this.restoreHighlights(doc);

      doc.addEventListener('mouseup', (e) => this.handleSelection(doc, e));
      doc.addEventListener('keyup', (e) => this.handleSelection(doc, e));
    } catch (e) {
      console.warn('Marginalia attach warning:', e);
    }
  }

  injectStyles(doc) {
    if (doc.getElementById('marginalia-styles')) return;
    const style = doc.createElement('style');
    style.id = 'marginalia-styles';
    style.textContent = `
      mark.user-hl {
        border-radius: 3px;
        padding: 1px 3px;
        cursor: pointer;
        transition: filter 0.2s;
      }
      mark.user-hl:hover {
        filter: brightness(1.2);
      }
      mark.user-hl.hl-gold {
        background-color: rgba(212, 163, 115, 0.35);
        color: inherit;
        border-bottom: 2px solid #D4A373;
      }
      mark.user-hl.hl-crimson {
        background-color: rgba(181, 52, 31, 0.35);
        color: inherit;
        border-bottom: 2px solid #B5341F;
      }
      mark.user-hl.hl-sapphire {
        background-color: rgba(29, 78, 137, 0.35);
        color: inherit;
        border-bottom: 2px solid #1D4E89;
      }
    `;
    doc.head.appendChild(style);
  }

  handleSelection(doc, e) {
    const sel = doc.getSelection();
    if (!sel || sel.isCollapsed || !sel.toString().trim()) {
      this.hidePopover();
      return;
    }

    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const iframeRect = this.iframe.getBoundingClientRect();

    const top = iframeRect.top + rect.top - 46;
    const left = iframeRect.left + rect.left + (rect.width / 2) - 80;

    this.popover.style.top = `${Math.max(10, top)}px`;
    this.popover.style.left = `${Math.max(10, left)}px`;
    this.popover.style.display = 'flex';

    this.pendingRange = range;
    this.pendingQuote = sel.toString().trim();
  }

  hidePopover() {
    if (this.popover) this.popover.style.display = 'none';
  }

  applyHighlight(color, noteText = "") {
    if (!this.pendingRange || !this.currentLectureId) return;

    const id = 'note_' + Math.random().toString(36).slice(2, 9);
    const mark = this.iframe.contentDocument.createElement('mark');
    mark.className = `user-hl hl-${color}`;
    mark.dataset.noteId = id;
    if (noteText) mark.title = noteText;

    try {
      this.pendingRange.surroundContents(mark);
    } catch (e) {
      // Если выделение пересекает узлы
      const span = this.iframe.contentDocument.createElement('span');
      span.innerHTML = this.pendingQuote;
      span.className = `user-hl hl-${color}`;
      span.dataset.noteId = id;
      this.pendingRange.deleteContents();
      this.pendingRange.insertNode(span);
    }

    const newNote = {
      id,
      color,
      quote: this.pendingQuote,
      text: noteText,
      createdAt: new Date().toISOString()
    };

    this.notes.push(newNote);
    this.saveNotes();
    this.hidePopover();
    this.renderNotesSidebar();
  }

  promptMarginNote() {
    const text = prompt('Введите заметку на полях для выделенного фрагмента:');
    if (text) {
      this.applyHighlight('gold', text);
    }
  }

  restoreHighlights(doc) {
    // Восстановление существующих заметок
    for (const note of this.notes) {
      // Ищем совпадения цитаты в тексте документа
      const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) {
        const idx = node.nodeValue.indexOf(note.quote);
        if (idx !== -1) {
          const range = doc.createRange();
          range.setStart(node, idx);
          range.setEnd(node, idx + note.quote.length);
          const mark = doc.createElement('mark');
          mark.className = `user-hl hl-${note.color}`;
          mark.dataset.noteId = note.id;
          if (note.text) mark.title = note.text;
          try {
            range.surroundContents(mark);
          } catch (e) {}
          break;
        }
      }
    }
    this.renderNotesSidebar();
  }

  renderNotesSidebar() {
    const container = document.getElementById('reader-marginalia-list');
    if (!container) return;

    container.innerHTML = '';
    if (this.notes.length === 0) {
      container.innerHTML = '<div class="marginalia-empty">✦ Заметок пока нет. Выделите текст в конспекте, чтобы добавить маркер или комментарий на поля.</div>';
      return;
    }

    for (const note of this.notes) {
      const item = document.createElement('div');
      item.className = `marginalia-card card-${note.color}`;
      item.innerHTML = `
        <div class="marginalia-quote">«${note.quote.slice(0, 70)}${note.quote.length > 70 ? '...' : ''}»</div>
        ${note.text ? `<div class="marginalia-text">${note.text}</div>` : ''}
        <div class="marginalia-meta">
          <span>${new Date(note.createdAt).toLocaleDateString('ru-RU')}</span>
          <button type="button" class="marginalia-del-btn" title="Удалить">✕</button>
        </div>
      `;

      item.querySelector('.marginalia-del-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        this.deleteNote(note.id);
      });

      container.appendChild(item);
    }
  }

  deleteNote(id) {
    this.notes = this.notes.filter(n => n.id !== id);
    this.saveNotes();
    try {
      const doc = this.iframe.contentDocument;
      const el = doc.querySelector(`mark[data-note-id="${id}"]`);
      if (el) {
        const textNode = doc.createTextNode(el.textContent);
        el.parentNode.replaceChild(textNode, el);
      }
    } catch (e) {}
    this.renderNotesSidebar();
  }

  async loadNotes() {
    if (!this.currentLectureId) return;
    const raw = localStorage.getItem(`fpm_notes_${this.currentLectureId}`);
    if (!raw) {
      this.notes = [];
      return;
    }
    try {
      this.notes = JSON.parse(raw);
    } catch (e) {
      this.notes = [];
    }
  }

  async saveNotes() {
    if (!this.currentLectureId) return;
    localStorage.setItem(`fpm_notes_${this.currentLectureId}`, JSON.stringify(this.notes));
  }
}
