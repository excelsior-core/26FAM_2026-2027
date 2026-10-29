/**
 * app/app.js - Основной модуль приложения «“конспекты” ФПМ»
 * Маршрутизация, управление состоянием, WebCrypto-авторизация,
 * рендеринг лекций, поиск, Split-View и администрирование
 */

import { VaultCrypto } from './crypto.js';
import { SearchEngine } from './search.js';
import { AdminManager } from './admin.js';

class App {
  constructor() {
    this.metadata = null;
    this.cryptoKey = null;
    this.isAdmin = false;
    this.blobCache = new Map(); // blobHash -> { url, textContent, mime }
    this.searchEngine = new SearchEngine();
    this.adminManager = null;

    // Чек-лист «Разобрано»
    const savedStudied = localStorage.getItem('fpm_studied');
    this.studiedSet = new Set(savedStudied ? JSON.parse(savedStudied) : []);

    // Дата прошлого визита для блока "Что нового"
    this.lastVisit = localStorage.getItem('fpm_last_visit') || new Date(0).toISOString();
    this.currentLecture = null;
    this.viewMode = 'grid'; // 'grid' | 'timeline'

    // Фильтры
    this.filters = {
      subject: '',
      module: '',
      tag: '',
      studiedOnly: false,
      sort: 'session-date-desc'
    };

    this.initElements();
    this.initThemes();
    this.bindEvents();
    this.checkAutoLogin();
    this.registerServiceWorker();
  }

  initElements() {
    this.authView = document.getElementById('auth-view');
    this.mainView = document.getElementById('main-view');
    this.authForm = document.getElementById('auth-form');
    this.authPassword = document.getElementById('auth-password');
    this.authRemember = document.getElementById('auth-remember-check');
    this.authError = document.getElementById('auth-error');
    this.capsWarning = document.getElementById('caps-warning');
    this.authSubmit = document.getElementById('auth-submit');

    this.adminToolbar = document.getElementById('admin-toolbar');
    this.adminIndicator = document.getElementById('admin-indicator');
    this.themeSelector = document.getElementById('theme-selector');
    this.logoutBtn = document.getElementById('logout-btn');

    this.lecturesContainer = document.getElementById('lectures-container');
    this.subjectsGrid = document.getElementById('subjects-grid');
    this.newLecturesSection = document.getElementById('new-lectures-section');
    this.newLecturesGrid = document.getElementById('new-lectures-grid');

    this.filterSubject = document.getElementById('filter-subject');
    this.filterModule = document.getElementById('filter-module');
    this.filterStudiedToggle = document.getElementById('filter-studied-toggle');
    this.sortSelector = document.getElementById('sort-selector');
    this.viewModeToggle = document.getElementById('view-mode-toggle');
    this.resetFiltersBtn = document.getElementById('reset-filters-btn');

    // Модалка чтения
    this.readerModal = document.getElementById('reader-modal');
    this.readerTitle = document.getElementById('reader-title');
    this.readerIframe = document.getElementById('reader-iframe');
    this.readerOrigIframe = document.getElementById('reader-orig-iframe');
    this.paneOrig = document.getElementById('pane-orig');
    this.splitDivider = document.getElementById('reader-split-divider');
    this.splitToggleBtn = document.getElementById('split-toggle-btn');
    this.readerNewTabBtn = document.getElementById('reader-new-tab-btn');
    this.readerPrintBtn = document.getElementById('reader-print-btn');
    this.readerCloseBtn = document.getElementById('reader-close-btn');
    this.noteDownloadsSpan = document.getElementById('note-downloads-span');
    this.origDownloadsSpan = document.getElementById('orig-downloads-span');

    // Палитра Ctrl+K
    this.paletteModal = document.getElementById('palette-modal');
    this.paletteOpenBtn = document.getElementById('palette-open-btn');
    this.paletteInput = document.getElementById('palette-search-input');
    this.paletteResults = document.getElementById('palette-results-list');
  }

  initThemes() {
    const savedTheme = localStorage.getItem('fpm_theme') || 
      (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'paper');
    this.setTheme(savedTheme);
    this.themeSelector.value = savedTheme;

    this.themeSelector.addEventListener('change', (e) => {
      this.setTheme(e.target.value);
    });
  }

  setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('fpm_theme', theme);
  }

  bindEvents() {
    // Детектор CapsLock
    this.authPassword.addEventListener('keyup', (e) => {
      if (e.getModifierState && e.getModifierState('CapsLock')) {
        this.capsWarning.classList.add('visible');
      } else {
        this.capsWarning.classList.remove('visible');
      }
    });

    // Авторизация
    this.authForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleLogin(this.authPassword.value.trim());
    });

    this.logoutBtn.addEventListener('click', () => this.handleLogout());

    // Фильтры и сортировки
    this.filterSubject.addEventListener('change', (e) => {
      this.filters.subject = e.target.value;
      this.renderLectures();
    });

    this.filterModule.addEventListener('change', (e) => {
      this.filters.module = e.target.value;
      this.renderLectures();
    });

    this.sortSelector.addEventListener('change', (e) => {
      this.filters.sort = e.target.value;
      this.renderLectures();
    });

    this.filterStudiedToggle.addEventListener('click', () => {
      this.filters.studiedOnly = !this.filters.studiedOnly;
      this.filterStudiedToggle.classList.toggle('active', this.filters.studiedOnly);
      this.renderLectures();
    });

    this.resetFiltersBtn.addEventListener('click', () => {
      this.filters.subject = '';
      this.filters.module = '';
      this.filters.tag = '';
      this.filters.studiedOnly = false;
      this.filterSubject.value = '';
      this.filterModule.value = '';
      this.filterStudiedToggle.classList.remove('active');
      this.renderLectures();
    });

    this.viewModeToggle.addEventListener('click', () => {
      this.viewMode = this.viewMode === 'grid' ? 'timeline' : 'grid';
      this.viewModeToggle.textContent = this.viewMode === 'grid' ? '📅 Таймлайн' : '📋 Список';
      this.renderLectures();
    });

    // Сворачиваемые секции
    document.querySelectorAll('[data-toggle]').forEach(el => {
      el.addEventListener('click', () => {
        el.parentElement.classList.toggle('collapsed');
      });
    });

    // Модалка чтения
    this.readerCloseBtn.addEventListener('click', () => this.closeReaderModal());
    this.splitToggleBtn.addEventListener('click', () => this.toggleSplitView());
    this.readerNewTabBtn.addEventListener('click', () => {
      if (this.currentActiveNoteUrl) {
        window.open(this.currentActiveNoteUrl, '_blank');
      }
    });
    this.readerPrintBtn.addEventListener('click', () => {
      if (this.readerIframe && this.readerIframe.contentWindow) {
        this.readerIframe.contentWindow.print();
      }
    });

    // Палитра Ctrl+K
    this.paletteOpenBtn.addEventListener('click', () => this.openPalette());
    this.paletteModal.addEventListener('click', (e) => {
      if (e.target === this.paletteModal) this.closePalette();
    });
    this.paletteInput.addEventListener('input', (e) => this.handlePaletteSearch(e.target.value));

    // Глобальные горячие клавиши
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        this.openPalette();
      } else if (e.key === 'Escape') {
        this.closeReaderModal();
        this.closePalette();
      } else if (!this.readerModal.classList.contains('open') && !this.paletteModal.classList.contains('open')) {
        if (e.key === 't' || e.key === 'е') { // смена темы
          const themes = ['paper', 'dark', 'sepia', 'midnight'];
          const cur = document.documentElement.getAttribute('data-theme') || 'paper';
          const next = themes[(themes.indexOf(cur) + 1) % themes.length];
          this.setTheme(next);
          this.themeSelector.value = next;
        } else if (e.key === '/' && document.activeElement.tagName !== 'INPUT') {
          e.preventDefault();
          this.openPalette();
        }
      }
    });

    // Deep-linking хэш роутер
    window.addEventListener('hashchange', () => this.handleHashChange());

    // Дисклеймер footer
    const discBtn = document.getElementById('footer-disclaimer-toggle');
    const discBox = document.getElementById('footer-disclaimer-box');
    if (discBtn && discBox) {
      discBtn.addEventListener('click', () => {
        discBox.style.display = discBox.style.display === 'none' ? 'block' : 'none';
      });
    }

    // AI баннер
    const aiClose = document.getElementById('ai-banner-close');
    if (aiClose) {
      aiClose.addEventListener('click', () => {
        document.getElementById('ai-banner').style.display = 'none';
      });
    }
  }

  async checkAutoLogin() {
    const storedKey = localStorage.getItem('fpm_key') || sessionStorage.getItem('fpm_key');
    const storedIsAdmin = localStorage.getItem('fpm_is_admin') === 'true' || sessionStorage.getItem('fpm_is_admin') === 'true';

    if (storedKey) {
      try {
        this.cryptoKey = await VaultCrypto.importKeyRaw(storedKey);
        this.isAdmin = storedIsAdmin;
        await this.loadMetadata();
        this.unlockApp();
        return;
      } catch (e) {
        console.warn('Auto-login failed:', e);
        this.handleLogout();
      }
    }
  }

  async handleLogin(password) {
    this.authError.classList.remove('visible');
    this.authSubmit.disabled = true;
    this.authSubmit.textContent = 'Расшифровка...';

    try {
      // 1. Сначала пробуем дешифровать metadata.bin (студенческий общий пароль)
      let metaResp = await fetch('metadata.bin');
      if (metaResp.ok) {
        const metaBuf = await metaResp.arrayBuffer();
        try {
          const decryptedBytes = await VaultCrypto.decryptBlob(metaBuf, password);
          const metaText = new TextDecoder().decode(decryptedBytes);
          this.metadata = JSON.parse(metaText);
          this.isAdmin = false;
          await this.completeLoginSuccess(password, metaBuf);
          return;
        } catch (errShared) {
          // Возможно, введен админ-пароль!
        }
      }

      // 2. Пробуем дешифровать admin.bin (пароль администратора)
      let adminResp = await fetch('admin.bin');
      if (adminResp.ok) {
        const adminBuf = await adminResp.arrayBuffer();
        try {
          const decryptedAdminBytes = await VaultCrypto.decryptBlob(adminBuf, password);
          const adminText = new TextDecoder().decode(decryptedAdminBytes);
          this.metadata = JSON.parse(adminText);
          this.isAdmin = true;
          await this.completeLoginSuccess(password, adminBuf);
          return;
        } catch (errAdmin) {
          // Оба пароля не подошли
        }
      }

      throw new Error('Неверный пароль');
    } catch (e) {
      this.authError.classList.add('visible');
    } finally {
      this.authSubmit.disabled = false;
      this.authSubmit.textContent = 'Войти в хранилище';
    }
  }

  async completeLoginSuccess(password, sampleBlobBuffer) {
    const bytes = new Uint8Array(sampleBlobBuffer);
    const salt = bytes.slice(6, 22);
    this.cryptoKey = await VaultCrypto.deriveKey(password, salt);

    if (this.authRemember.checked) {
      const rawKeyB64 = await VaultCrypto.exportKeyRaw(this.cryptoKey);
      localStorage.setItem('fpm_key', rawKeyB64);
      localStorage.setItem('fpm_is_admin', String(this.isAdmin));
    } else {
      const rawKeyB64 = await VaultCrypto.exportKeyRaw(this.cryptoKey);
      sessionStorage.setItem('fpm_key', rawKeyB64);
      sessionStorage.setItem('fpm_is_admin', String(this.isAdmin));
    }

    this.unlockApp();
  }

  async loadMetadata() {
    const filename = this.isAdmin ? 'admin.bin' : 'metadata.bin';
    const resp = await fetch(filename);
    if (!resp.ok) throw new Error('Не найден файл метаданных');
    const buf = await resp.arrayBuffer();
    const decryptedBytes = await VaultCrypto.decryptBlob(buf, this.cryptoKey);
    this.metadata = JSON.parse(new TextDecoder().decode(decryptedBytes));
  }

  unlockApp() {
    this.authView.style.display = 'none';
    this.mainView.style.display = 'block';

    if (this.isAdmin) {
      this.adminToolbar.classList.add('active');
      this.adminIndicator.classList.add('active');
      this.initAdmin();
    }

    this.populateFilterDropdowns();
    this.renderSubjects();
    this.renderNewLectures();
    this.renderLectures();

    // Фоновая индексация для быстрого поиска
    this.indexLecturesAsync();

    // Проверка deep link
    this.handleHashChange();

    // Запоминаем время визита
    localStorage.setItem('fpm_last_visit', new Date().toISOString());
  }

  handleLogout() {
    localStorage.removeItem('fpm_key');
    localStorage.removeItem('fpm_is_admin');
    sessionStorage.removeItem('fpm_key');
    sessionStorage.removeItem('fpm_is_admin');
    this.cryptoKey = null;
    this.metadata = null;
    this.isAdmin = false;
    window.location.hash = '';
    window.location.reload();
  }

  initAdmin() {
    this.adminManager = new AdminManager(this.metadata, (updatedMeta) => {
      this.metadata = updatedMeta;
      this.populateFilterDropdowns();
      this.renderSubjects();
      this.renderLectures();
    });

    document.getElementById('admin-export-btn').addEventListener('click', () => {
      this.adminManager.exportMetadataJson();
    });

    document.getElementById('admin-new-subject-btn').addEventListener('click', () => {
      const name = prompt('Название нового предмета:');
      if (name) this.adminManager.saveSubject(name, null);
    });

    document.getElementById('admin-new-module-btn').addEventListener('click', () => {
      const mod = prompt('Название нового модуля:');
      if (mod) this.adminManager.saveModule(mod);
    });

    // Модалка лекции
    const lecForm = document.getElementById('admin-lecture-form');
    const lecCancel = document.getElementById('admin-lec-cancel');
    lecCancel.addEventListener('click', () => {
      document.getElementById('admin-lecture-modal').classList.remove('open');
    });

    lecForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('admin-lec-id').value;
      const title = document.getElementById('admin-lec-title').value;
      const subject = document.getElementById('admin-lec-subject').value;
      const module = document.getElementById('admin-lec-module').value;
      const desc = document.getElementById('admin-lec-desc').value;
      const tags = document.getElementById('admin-lec-tags').value;
      const hidden = document.getElementById('admin-lec-hidden').checked;

      const sessionsStr = document.getElementById('admin-lec-sessions').value;
      const sessions = sessionsStr.split(',').map(s => {
        const parts = s.split(':').map(p => p.trim());
        return { number: parts[0] || '1', date: parts[1] || '' };
      }).filter(s => s.number);

      this.adminManager.updateLecture(id, {
        title, subject, module, description: desc, tags, hidden, sessions
      });
      document.getElementById('admin-lecture-modal').classList.remove('open');
    });
  }

  populateFilterDropdowns() {
    this.filterSubject.innerHTML = '<option value="">Все предметы</option>';
    for (const subj of this.metadata.subjects || []) {
      const opt = document.createElement('option');
      opt.value = subj.name;
      opt.textContent = subj.name;
      this.filterSubject.appendChild(opt);
    }

    this.filterModule.innerHTML = '<option value="">Все модули</option>';
    for (const mod of this.metadata.modules || []) {
      const opt = document.createElement('option');
      opt.value = mod;
      opt.textContent = mod;
      this.filterModule.appendChild(opt);
    }
  }

  renderSubjects() {
    this.subjectsGrid.innerHTML = '';
    const lectures = this.metadata.lectures || [];

    for (const subj of this.metadata.subjects || []) {
      const count = lectures.filter(l => l.subject === subj.name && (!l.hidden || this.isAdmin)).length;
      const card = document.createElement('div');
      card.className = `subject-card ${this.filters.subject === subj.name ? 'active' : ''}`;
      card.innerHTML = `
        <div class="subject-color-bar" style="background-color: ${subj.color || 'var(--accent-color)'};"></div>
        <div class="subject-card-title">${subj.name}</div>
        <div class="subject-card-meta">
          <span>${count} ${this.pluralizeLectures(count)}</span>
          ${subj.description ? `<span title="${subj.description}">ℹ</span>` : ''}
        </div>
      `;

      card.addEventListener('click', () => {
        if (this.filters.subject === subj.name) {
          this.filters.subject = '';
          this.filterSubject.value = '';
        } else {
          this.filters.subject = subj.name;
          this.filterSubject.value = subj.name;
        }
        this.renderSubjects();
        this.renderLectures();
      });

      this.subjectsGrid.appendChild(card);
    }
  }

  renderNewLectures() {
    const lectures = this.metadata.lectures || [];
    const newOnes = lectures.filter(l => (!l.hidden || this.isAdmin) && l.addedAt && new Date(l.addedAt) > new Date(this.lastVisit));

    if (newOnes.length > 0) {
      this.newLecturesSection.style.display = 'block';
      this.newLecturesGrid.innerHTML = '';
      for (const lec of newOnes) {
        const item = document.createElement('div');
        item.className = 'subject-card';
        item.innerHTML = `
          <div class="subject-card-title">${lec.title}</div>
          <div class="subject-card-meta"><span>${lec.subject}</span><span>${lec.module || ''}</span></div>
        `;
        item.addEventListener('click', () => this.openLecture(lec.id));
        this.newLecturesGrid.appendChild(item);
      }
    } else {
      this.newLecturesSection.style.display = 'none';
    }
  }

  renderLectures() {
    this.lecturesContainer.innerHTML = '';
    let list = (this.metadata.lectures || []).filter(l => !l.hidden || this.isAdmin);

    // Фильтрация
    if (this.filters.subject) {
      list = list.filter(l => l.subject === this.filters.subject);
    }
    if (this.filters.module) {
      list = list.filter(l => l.module === this.filters.module);
    }
    if (this.filters.tag) {
      list = list.filter(l => (l.tags || []).includes(this.filters.tag));
    }
    if (this.filters.studiedOnly) {
      list = list.filter(l => !this.studiedSet.has(l.id));
    }

    // Сортировка
    list.sort((a, b) => {
      if (this.filters.sort === 'session-num-asc') {
        const numA = (a.sessions && a.sessions[0]?.number) || 0;
        const numB = (b.sessions && b.sessions[0]?.number) || 0;
        return numA - numB;
      }
      if (this.filters.sort === 'title-asc') return a.title.localeCompare(b.title, 'ru');
      if (this.filters.sort === 'title-desc') return b.title.localeCompare(a.title, 'ru');
      if (this.filters.sort === 'added-desc') return new Date(b.addedAt || 0) - new Date(a.addedAt || 0);

      // session-date-desc (по умолчанию) или session-date-asc
      const dateA = this.parseDate(a.sessions && a.sessions[0]?.date);
      const dateB = this.parseDate(b.sessions && b.sessions[0]?.date);
      return this.filters.sort === 'session-date-asc' ? dateA - dateB : dateB - dateA;
    });

    if (list.length === 0) {
      this.lecturesContainer.innerHTML = `
        <div style="text-align: center; padding: 48px; color: var(--text-muted); background: var(--bg-card); border-radius: var(--radius-md); border: 1px dashed var(--border-color);">
          Ничего не найдено — возможно, лекция ещё не в Storage.
        </div>
      `;
      return;
    }

    for (const lec of list) {
      const card = this.createLectureCard(lec);
      this.lecturesContainer.appendChild(card);
    }
  }

  createLectureCard(lec) {
    const card = document.createElement('div');
    const isStudied = this.studiedSet.has(lec.id);
    card.className = `lecture-card ${isStudied ? 'studied' : ''}`;
    card.id = `card-${lec.id}`;

    const subj = (this.metadata.subjects || []).find(s => s.name === lec.subject);
    const subjColor = subj ? subj.color : 'var(--accent-color)';

    const sessionsHtml = (lec.sessions || []).map(s => `
      <span class="session-chip">№${s.number} · ${s.date || ''}</span>
    `).join('');

    const tagsHtml = (lec.tags || []).map(t => `
      <span class="lecture-tag" data-tag="${t}">#${t}</span>
    `).join('');

    card.innerHTML = `
      <div class="lecture-top-row">
        <div class="lecture-title-wrap">
          <div class="lecture-meta-badges">
            <span class="subject-badge" style="background-color: ${subjColor};">${lec.subject}</span>
            ${lec.module ? `<span class="module-badge">${lec.module}</span>` : ''}
            ${sessionsHtml}
            ${lec.hidden ? `<span class="module-badge" style="background: var(--accent-subtle); color: var(--accent-color);">Черновик</span>` : ''}
          </div>
          <h3 class="lecture-title">${lec.title}</h3>
          ${lec.description ? `<p class="lecture-description">${lec.description}</p>` : ''}
          <div class="lecture-tags">${tagsHtml}</div>
        </div>
      </div>

      <div class="lecture-actions">
        <button class="action-btn-primary btn-open-note">
          📖 Открыть конспект
        </button>
        ${(lec.originals && lec.originals.length > 0) ? `
          <button class="btn-secondary btn-open-orig">
            📄 Оригинал лектора
          </button>
        ` : ''}
        ${this.isAdmin ? `
          <button class="btn-secondary btn-admin-edit" style="color: var(--accent-color);">
            ✏️ Редактировать
          </button>
        ` : ''}
        <button class="studied-toggle-btn ${isStudied ? 'active' : ''}">
          ${isStudied ? '✓ Изучено' : '○ Отметить изученным'}
        </button>
      </div>
    `;

    // События клика
    card.querySelector('.lecture-title').addEventListener('click', () => this.openLecture(lec.id));
    card.querySelector('.btn-open-note').addEventListener('click', () => this.openLecture(lec.id, false));

    const origBtn = card.querySelector('.btn-open-orig');
    if (origBtn) {
      origBtn.addEventListener('click', () => this.openLecture(lec.id, true));
    }

    if (this.isAdmin) {
      const editBtn = card.querySelector('.btn-admin-edit');
      if (editBtn) {
        editBtn.addEventListener('click', () => this.openAdminLectureModal(lec));
      }
    }

    const studiedBtn = card.querySelector('.studied-toggle-btn');
    studiedBtn.addEventListener('click', () => {
      if (this.studiedSet.has(lec.id)) {
        this.studiedSet.delete(lec.id);
        studiedBtn.classList.remove('active');
        studiedBtn.textContent = '○ Отметить изученным';
        card.classList.remove('studied');
      } else {
        this.studiedSet.add(lec.id);
        studiedBtn.classList.add('active');
        studiedBtn.textContent = '✓ Изучено';
        card.classList.add('studied');
      }
      localStorage.setItem('fpm_studied', JSON.stringify([...this.studiedSet]));
    });

    card.querySelectorAll('.lecture-tag').forEach(tagEl => {
      tagEl.addEventListener('click', (e) => {
        this.filters.tag = e.target.dataset.tag;
        this.renderLectures();
      });
    });

    return card;
  }

  async openLecture(id, openWithOriginal = false) {
    const lec = (this.metadata.lectures || []).find(l => l.id === id);
    if (!lec) return;

    this.currentLecture = lec;
    this.readerTitle.textContent = `${lec.subject}: ${lec.title}`;
    this.readerModal.classList.add('open');
    window.location.hash = `#/lecture/${id}`;

    // Загрузка HTML конспекта
    const noteFile = (lec.files || []).find(f => f.type === 'html');
    if (noteFile && noteFile.blob) {
      const blobUrl = await this.getDecryptedBlobUrl(noteFile.blob, 'text/html');
      this.currentActiveNoteUrl = blobUrl;
      this.readerIframe.src = blobUrl;

      // Кнопка скачивания конспекта
      this.noteDownloadsSpan.innerHTML = `
        <a href="${blobUrl}" download="${this.sanitizeFileName(lec.title)} — ${noteFile.name}" class="btn-secondary" style="padding: 2px 8px; font-size: 0.72rem;">
          ↓ Скачать HTML
        </a>
      `;
    } else {
      this.readerIframe.srcdoc = '<p style="padding: 24px; font-family: sans-serif;">Конспект отсутствует.</p>';
      this.noteDownloadsSpan.innerHTML = '';
    }

    // Загрузка оригинала
    const origFile = (lec.originals || [])[0];
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    if (origFile && origFile.blob) {
      const mime = origFile.type === 'pdf' ? 'application/pdf' : 'image/jpeg';
      const origBlobUrl = await this.getDecryptedBlobUrl(origFile.blob, mime);
      
      if (isIOS && origFile.type === 'pdf') {
        // На iOS встроенный iframe не листает многостраничные PDF
        this.readerOrigIframe.srcdoc = `
          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; text-align: center; padding: 24px; font-family: -apple-system, sans-serif;">
            <p style="margin-bottom: 16px; color: #666; font-size: 15px;">На iOS PDF-оригиналы лекций открываются в нативном просмотрщике Safari:</p>
            <a href="${origBlobUrl}" target="_blank" style="background: #8C2518; color: #fff; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
              📄 Открыть оригинал лектора
            </a>
          </div>
        `;
      } else {
        this.readerOrigIframe.src = origBlobUrl;
      }

      this.splitToggleBtn.style.display = 'inline-flex';

      this.origDownloadsSpan.innerHTML = `
        <a href="${origBlobUrl}" download="${this.sanitizeFileName(lec.title)} — ${origFile.name}" class="btn-secondary" style="padding: 2px 8px; font-size: 0.72rem;">
          ↓ Скачать ${origFile.type.toUpperCase()}
        </a>
      `;

      if (openWithOriginal) {
        if (isIOS && origFile.type === 'pdf') {
          window.open(origBlobUrl, '_blank');
        } else {
          this.showSplitView(true);
        }
      }
    } else {
      this.splitToggleBtn.style.display = 'none';
      this.showSplitView(false);
      this.origDownloadsSpan.innerHTML = '';
    }
  }

  async getDecryptedBlobUrl(blobHash, mimeType) {
    if (this.blobCache.has(blobHash)) {
      return this.blobCache.get(blobHash).url;
    }

    try {
      const resp = await fetch(`blobs/${blobHash}.bin`);
      if (!resp.ok) throw new Error('Blob не найден');
      const buf = await resp.arrayBuffer();
      const decryptedBytes = await VaultCrypto.decryptBlob(buf, this.cryptoKey);

      const blob = new Blob([decryptedBytes], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const textContent = mimeType.includes('html') ? new TextDecoder().decode(decryptedBytes) : '';

      this.blobCache.set(blobHash, { url, textContent, mime: mimeType });
      return url;
    } catch (e) {
      console.error('Ошибка расшифровки blob:', e);
      return 'about:blank';
    }
  }

  toggleSplitView() {
    const isHidden = this.paneOrig.classList.contains('split-hidden');
    this.showSplitView(isHidden);
  }

  showSplitView(show) {
    if (show) {
      this.paneOrig.classList.remove('split-hidden');
      this.splitDivider.style.display = 'block';
      this.splitToggleBtn.textContent = '✕ Скрыть оригинал';
    } else {
      this.paneOrig.classList.add('split-hidden');
      this.splitDivider.style.display = 'none';
      this.splitToggleBtn.textContent = '⇄ Оригинал рядом';
    }
  }

  closeReaderModal() {
    this.readerModal.classList.remove('open');
    this.readerIframe.src = 'about:blank';
    this.readerOrigIframe.src = 'about:blank';
    if (window.location.hash.startsWith('#/lecture/')) {
      window.location.hash = '';
    }
  }

  openPalette() {
    this.paletteModal.classList.add('open');
    this.paletteInput.value = '';
    this.paletteInput.focus();
    this.handlePaletteSearch('');
  }

  closePalette() {
    this.paletteModal.classList.remove('open');
  }

  handlePaletteSearch(query) {
    this.paletteResults.innerHTML = '';
    if (!query.trim()) {
      // Подсказки команд
      this.paletteResults.innerHTML = `
        <div class="palette-item" data-action="theme">
          <div class="palette-item-title">🎨 Сменить тему оформления (Paper / Dark / Sepia / Midnight)</div>
        </div>
        <div class="palette-item" data-action="reset">
          <div class="palette-item-title">🔄 Сбросить все фильтры</div>
        </div>
        <div class="palette-item" data-action="studied">
          <div class="palette-item-title">📚 Показать только неразобранные лекции</div>
        </div>
      `;
      this.paletteResults.querySelectorAll('.palette-item').forEach(item => {
        item.addEventListener('click', () => {
          const action = item.dataset.action;
          if (action === 'theme') {
            const themes = ['paper', 'dark', 'sepia', 'midnight'];
            const cur = document.documentElement.getAttribute('data-theme') || 'paper';
            this.setTheme(themes[(themes.indexOf(cur) + 1) % themes.length]);
          } else if (action === 'reset') {
            this.resetFiltersBtn.click();
          } else if (action === 'studied') {
            this.filterStudiedToggle.click();
          }
          this.closePalette();
        });
      });
      return;
    }

    const matches = this.searchEngine.search(query);
    if (matches.length === 0) {
      this.paletteResults.innerHTML = `
        <div style="padding: 16px; color: var(--text-muted); font-size: 0.9rem;">
          Ничего не найдено по запросу «${query}».
        </div>
      `;
      return;
    }

    for (const match of matches.slice(0, 8)) {
      const item = document.createElement('div');
      item.className = 'palette-item';
      item.innerHTML = `
        <div class="palette-item-title">
          <span>${match.lecture.subject} · ${match.lecture.title}</span>
        </div>
        ${match.snippets.length ? `
          <div class="palette-snippets">${match.snippets.join('<br>')}</div>
        ` : ''}
      `;
      item.addEventListener('click', () => {
        this.closePalette();
        this.openLecture(match.lecture.id);
      });
      this.paletteResults.appendChild(item);
    }
  }

  async indexLecturesAsync() {
    const lectures = this.metadata.lectures || [];
    const htmlMap = new Map();

    for (const lec of lectures) {
      for (const file of lec.files || []) {
        if (file.type === 'html' && file.blob && !this.blobCache.has(file.blob)) {
          try {
            const resp = await fetch(`blobs/${file.blob}.bin`);
            if (resp.ok) {
              const buf = await resp.arrayBuffer();
              const dec = await VaultCrypto.decryptBlob(buf, this.cryptoKey);
              const text = new TextDecoder().decode(dec);
              const clean = SearchEngine.cleanHtml(text);
              htmlMap.set(file.blob, clean);
            }
          } catch (e) {
            // Файл не найден или повреждён
          }
        }
      }
    }

    this.searchEngine.buildIndex(lectures, htmlMap);
  }

  openAdminLectureModal(lec) {
    document.getElementById('admin-lec-id').value = lec.id;
    document.getElementById('admin-lec-title').value = lec.title;
    document.getElementById('admin-lec-desc').value = lec.description || '';
    document.getElementById('admin-lec-tags').value = (lec.tags || []).join(', ');
    document.getElementById('admin-lec-hidden').checked = !!lec.hidden;

    const subjSelect = document.getElementById('admin-lec-subject');
    subjSelect.innerHTML = '';
    for (const s of this.metadata.subjects || []) {
      const opt = document.createElement('option');
      opt.value = s.name;
      opt.textContent = s.name;
      if (s.name === lec.subject) opt.selected = true;
      subjSelect.appendChild(opt);
    }

    const modSelect = document.getElementById('admin-lec-module');
    modSelect.innerHTML = '<option value="">(Без модуля)</option>';
    for (const m of this.metadata.modules || []) {
      const opt = document.createElement('option');
      opt.value = m;
      opt.textContent = m;
      if (m === lec.module) opt.selected = true;
      modSelect.appendChild(opt);
    }

    const sessionsStr = (lec.sessions || []).map(s => `${s.number}:${s.date}`).join(', ');
    document.getElementById('admin-lec-sessions').value = sessionsStr;

    document.getElementById('admin-lecture-modal').classList.add('open');
  }

  handleHashChange() {
    const hash = window.location.hash;
    const match = hash.match(/^#\/lecture\/(.+)$/);
    if (match && this.metadata) {
      const lecId = match[1];
      if (!this.currentLecture || this.currentLecture.id !== lecId) {
        this.openLecture(lecId);
      }
    }
  }

  sanitizeFileName(str) {
    return str.replace(/[/\\?%*:|"<>]/g, '-').trim();
  }

  parseDate(str) {
    if (!str) return 0;
    const parts = str.split('.');
    if (parts.length === 3) {
      return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`).getTime();
    }
    return 0;
  }

  pluralizeLectures(n) {
    const abs = Math.abs(n) % 100;
    const rem = abs % 10;
    if (abs > 10 && abs < 20) return 'лекций';
    if (rem > 1 && rem < 5) return 'лекции';
    if (rem === 1) return 'лекция';
    return 'лекций';
  }

  registerServiceWorker() {
    if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
      navigator.serviceWorker.register('sw.js').catch(err => {
        console.warn('SW registration failed:', err);
      });
    }
  }
}

// Запуск приложения после загрузки DOM
window.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
