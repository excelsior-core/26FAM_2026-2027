/**
 * app/marginalia.js - Личные зашифрованные маргиналии и заметки на полях
 * Выделение фрагментов текста 3 музейными маркерами (Золотой пергамент, Охра, Мыслитель)
 * + добавление заметок на полях, шифруемых мастер-ключом студента и хранимых локально.
 */

import { VaultCrypto } from './crypto.js';

export class MarginaliaManager {
  constructor(app) {
    this.app = app;
    this.currentLectureId = null;
    this.marginalia = [];
    this.popover = null;

    this.initPopover();
  }

  initPopover() {
    this.popover = document.createElement('div');
    this.popover.className = 'marginalia-popover';
    this.popover.style.display = 'none';

    this.popover.innerHTML = `
      <div class="popover-colors">
        <button class="color-btn hl-gold" title="Золотой пергамент" data-color="gold"></button>
        <button class="color-btn hl-ochre" title="Охра / Внимание" data-color="ochre"></button>
        <button class="color-btn hl-thinker" title="Мыслитель / Сапфир" data-color="thinker"></button>
      </div>
      <button class="add-note-btn">✦ Заметка на полях</button>
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
      this.promptAddNote();
    });
  }

  attachToIframe(iframe, lectureId) {
    this.currentLectureId = lectureId;
    this.loadMarginalia(lectureId);

    try {
      const doc = iframe.contentDocument || iframe.contentWindow.document;
      if (!doc) return;

      doc.addEventListener('mouseup', () => {
        const selection = doc.getSelection();
        const selectedText = selection.toString().trim();
        if (selectedText.length > 0) {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          const iframeRect = iframe.getBoundingClientRect();

          const top = iframeRect.top + rect.top - 44;
          const left = iframeRect.left + rect.left + rect.width / 2;

          this.showPopover(top, left, selectedText);
        } else {
          this.hidePopover();
        }
      });

      doc.addEventListener('mousedown', () => {
        this.hidePopover();
      });
    } catch (e) {
      // Кросс-доменные ограничения в случае sandbox
    }
  }

  showPopover(top, left, selectedText) {
    this.currentSelectedText = selectedText;
    this.popover.style.top = `${Math.max(10, top)}px`;
    this.popover.style.left = `${Math.max(10, left - 100)}px`;
    this.popover.style.display = 'flex';
  }

  hidePopover() {
    this.popover.style.display = 'none';
  }

  async applyHighlight(color) {
    if (!this.currentSelectedText) return;
    const item = {
      id: 'hl_' + Date.now(),
      type: 'highlight',
      color: color,
      quote: this.currentSelectedText,
      comment: '',
      createdAt: new Date().toISOString()
    };
    this.marginalia.push(item);
    await this.saveMarginalia();
    this.hidePopover();
    this.renderMarginaliaSidebar();
  }

  async promptAddNote() {
    const quote = this.currentSelectedText || '';
    this.hidePopover();
    const comment = prompt('Заметка на полях к фрагменту:\n\n«' + quote.slice(0, 80) + '...»');
    if (!comment || !comment.trim()) return;

    const item = {
      id: 'note_' + Date.now(),
      type: 'note',
      color: 'gold',
      quote: quote,
      comment: comment.trim(),
      createdAt: new Date().toISOString()
    };
    this.marginalia.push(item);
    await this.saveMarginalia();
    this.renderMarginaliaSidebar();
  }

  async deleteItem(id) {
    this.marginalia = this.marginalia.filter(m => m.id !== id);
    await this.saveMarginalia();
    this.renderMarginaliaSidebar();
  }

  async loadMarginalia(lectureId) {
    this.marginalia = [];
    if (!this.app.cryptoKey || !lectureId) return;

    const key = `fpm_mrg_${lectureId}`;
    const encrypted = localStorage.getItem(key);
    if (!encrypted) {
      this.renderMarginaliaSidebar();
      return;
    }

    try {
      const json = await VaultCrypto.decryptLocalData(this.app.cryptoKey, encrypted);
      if (json) {
        this.marginalia = JSON.parse(json);
      }
    } catch (e) {
      console.warn('Failed to decrypt marginalia:', e);
    }
    this.renderMarginaliaSidebar();
  }

  async saveMarginalia() {
    if (!this.app.cryptoKey || !this.currentLectureId) return;
    const key = `fpm_mrg_${this.currentLectureId}`;
    const json = JSON.stringify(this.marginalia);
    const encrypted = await VaultCrypto.encryptLocalData(this.app.cryptoKey, json);
    localStorage.setItem(key, encrypted);
  }

  renderMarginaliaSidebar() {
    const list = document.getElementById('reader-marginalia-list');
    if (!list) return;

    list.innerHTML = '';
    if (this.marginalia.length === 0) {
      list.innerHTML = `
        <div class="marginalia-empty">
          Выделите текст конспекта, чтобы оставить пометку или записать личный комментарий на полях.<br><br>
          <span style="font-size: 0.72rem; opacity: 0.7;">Все маргиналии шифруются вашим мастер-ключом.</span>
        </div>
      `;
      return;
    }

    for (const item of this.marginalia) {
      const card = document.createElement('div');
      card.className = `marginalia-card card-${item.color || 'gold'}`;

      const dateStr = new Date(item.createdAt).toLocaleDateString('ru-RU', {
        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
      });

      card.innerHTML = `
        ${item.quote ? `<div class="marginalia-quote">«${item.quote}»</div>` : ''}
        ${item.comment ? `<div class="marginalia-text">${item.comment}</div>` : ''}
        <div class="marginalia-meta">
          <span>${dateStr}</span>
          <span class="marginalia-del-btn" title="Удалить">✕</span>
        </div>
      `;

      card.querySelector('.marginalia-del-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        this.deleteItem(item.id);
      });

      list.appendChild(card);
    }
  }
}
