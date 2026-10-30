/**
 * app/app.js - Главное ядро портала «КОНСПЕКТЫ ФПМ»
 * Философия: Haute Couture Museum × Neoclassical Baroque & Sculptural Chiaroscuro
 * First-Class PDF Sovereignty, Side-by-Side Split Reader, Zero-Knowledge Crypto,
 * интерактивный 3D Vault Gate и режим конспирации (Esc × 2).
 */

import { VaultCrypto } from './crypto.js';
import { SearchEngine } from './search.js';
import { AdminManager } from './admin.js';
import { Vault3D } from './vault-3d.js';
import { MarginaliaManager } from './marginalia.js';

class App {
  constructor() {
    this.metadata = null;
    this.cryptoKey = null;
    this.isAdmin = false;
    this.blobCache = new Map();
    this.activeObjectUrls = []; // Управление памятью blob URLs
    this.searchEngine = new SearchEngine();
    this.adminManager = null;

    const savedStudied = localStorage.getItem('fpm_studied');
    this.studiedSet = new Set(savedStudied ? JSON.parse(savedStudied) : []);

    this.currentLecture = null;
    this.lastEscTime = 0;
    this.layoutMode = 'exhibition'; // 'exhibition' или 'registry'

    // Календарь учебного года 2026–2027 (по умолчанию сентябрь 2026)
    this.calCurrentDate = new Date(2026, 8, 1);

    this.filters = {
      subject: '',
      category: '',
      module: '',
      tag: '',
      studiedOnly: false,
      sort: 'session-date-desc',
      searchQuery: ''
    };

    this.initElements();
    this.initThemes();
    this.vault3d = new Vault3D('vault-3d-box');
    this.marginalia = new MarginaliaManager(this);
    this.initCircadianLighting();
    this.initSplitDivider();

    this.bindEvents();
    this.checkAutoLogin();
    this.registerServiceWorker();

    setInterval(() => this.updateDeadlineCountdowns(), 1000);
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
    this.themeSelector = document.getElementById('theme-selector');
    this.logoutBtn = document.getElementById('logout-btn');

    this.lecturesContainer = document.getElementById('lectures-container');
    this.subjectsTabsContainer = document.getElementById('subjects-tabs-container');
    this.categoryTabsContainer = document.getElementById('category-tabs-container');
    this.layoutToggleBtn = document.getElementById('layout-toggle-btn');

    // Кнопки шапки
    // Статистика в Hero
    this.statTotalLectures = document.getElementById('stat-total-lectures');
    this.statStudiedPercent = document.getElementById('stat-studied-percent');
    this.statStudiedRatio = document.getElementById('stat-studied-ratio');
    this.statProgressBar = document.getElementById('stat-progress-bar');
    this.statActiveDeadlines = document.getElementById('stat-active-deadlines');

    this.filterModule = document.getElementById('filter-module');
    this.filterStudiedToggle = document.getElementById('filter-studied-toggle');
    this.sortSelector = document.getElementById('sort-selector');
    this.resetFiltersBtn = document.getElementById('reset-filters-btn');
    this.inlineSearchInput = document.getElementById('inline-search-input');
    this.inlineSearchClear = document.getElementById('inline-search-clear');

    this.announcementsOpenBtn = document.getElementById('announcements-open-btn');
    this.announcementsCountBadge = document.getElementById('announcements-count-badge');
    this.calendarOpenBtn = document.getElementById('calendar-open-btn');
    this.paletteOpenBtn = document.getElementById('palette-open-btn');

    // Календарь
    this.calendarModal = document.getElementById('calendar-modal');
    this.calCloseBtn = document.getElementById('cal-close-btn');
    this.calPrevMonth = document.getElementById('cal-prev-month');
    this.calNextMonth = document.getElementById('cal-next-month');
    this.calMonthTitle = document.getElementById('cal-month-title');
    this.calDaysGrid = document.getElementById('cal-days-grid');
    this.calSelectedDaySchedule = document.getElementById('cal-selected-day-schedule');

    // Дедлайны
    this.announcementsModal = document.getElementById('announcements-modal');
    this.annCloseBtn = document.getElementById('ann-close-btn');
    this.announcementsList = document.getElementById('announcements-list');
    this.annAdminAddBtn = document.getElementById('ann-admin-add-btn');

    // Полноэкранный Ридер & Сплит
    this.readerModal = document.getElementById('reader-modal');
    this.readerCloseBtn = document.getElementById('reader-close-btn');
    this.readerTitle = document.getElementById('reader-lecture-title');
    this.readerSubjectDot = document.getElementById('reader-subject-dot');
    this.readerMarkStudiedBtn = document.getElementById('reader-mark-studied-btn');
    this.readerMarginaliaToggle = document.getElementById('reader-marginalia-toggle');
    this.readerMarginaliaPane = document.getElementById('reader-marginalia-pane');
    this.splitToggleBtn = document.getElementById('split-toggle-btn');
    this.readerNewTabBtn = document.getElementById('reader-new-tab-btn');
    this.readerDownloadPdfBtn = document.getElementById('reader-download-pdf-btn');

    this.paneNote = document.getElementById('pane-note');
    this.paneOrig = document.getElementById('pane-orig');
    this.readerIframe = document.getElementById('reader-iframe');
    this.readerOrigIframe = document.getElementById('reader-orig-iframe');
    this.readerPdfSelect = document.getElementById('reader-pdf-select');
    this.noteDownloadHtmlBtn = document.getElementById('note-download-html-btn');
    this.origDownloadPdfBtn = document.getElementById('orig-download-pdf-btn');
    this.splitDivider = document.getElementById('reader-split-divider');
    this.currentPdfIndex = 0;
    this.currentReaderMode = null;
    this.isProgrammaticHashChange = false;

    this.segBtnNote = document.getElementById('seg-btn-note');
    this.segBtnOrig = document.getElementById('seg-btn-orig');

    // Админка
    this.adminLecModal = document.getElementById('admin-lecture-modal');
    this.adminLecForm = document.getElementById('admin-lecture-form');
    this.adminLecCancel = document.getElementById('admin-lecture-cancel');
    this.adminLecClose = document.getElementById('admin-lec-close');
    this.adminExportBtn = document.getElementById('admin-export-btn');
    this.adminNewSubjectBtn = document.getElementById('admin-new-subject-btn');
    this.adminNewModuleBtn = document.getElementById('admin-new-module-btn');
    this.adminNewAnnouncementBtn = document.getElementById('admin-new-announcement-btn');
  }

  bindEvents() {
    // Ввод пароля с анимацией криптекса
    this.authPassword.addEventListener('input', () => {
      if (this.vault3d) this.vault3d.onKeyPress();
    });

    this.authPassword.addEventListener('keyup', (e) => {
      const caps = e.getModifierState && e.getModifierState('CapsLock');
      this.capsWarning.classList.toggle('visible', !!caps);
    });

    this.authForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleLogin(this.authPassword.value.trim());
    });

    this.logoutBtn.addEventListener('click', () => this.handleLogout());

    // Режим конспирации (Panic Key - Двойной Esc)
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const now = Date.now();
        if (now - this.lastEscTime < 450) {
          this.triggerPanicKey();
        }
        this.lastEscTime = now;
      }
    });

    // Ридер и заметки на полях
    this.readerCloseBtn.addEventListener('click', () => this.closeReader());
    this.readerMarginaliaToggle.addEventListener('click', () => {
      this.readerMarginaliaPane.classList.toggle('open');
    });

    this.segBtnNote?.addEventListener('click', () => this.setReaderMode('html'));
    this.segBtnOrig?.addEventListener('click', () => this.setReaderMode('pdf'));
    this.splitToggleBtn?.addEventListener('click', () => this.toggleSplitView());

    this.readerPdfSelect?.addEventListener('change', (e) => {
      const idx = parseInt(e.target.value, 10) || 0;
      this.loadOriginalPdf(idx);
    });

    // Скачивание файлов
    this.readerDownloadPdfBtn?.addEventListener('click', () => this.downloadOriginalPdf());
    this.origDownloadPdfBtn?.addEventListener('click', () => this.downloadOriginalPdf());
    this.noteDownloadHtmlBtn?.addEventListener('click', () => this.downloadHtmlNote());

    // Открытие строго текущего отображаемого документа в новой вкладке
    this.readerNewTabBtn?.addEventListener('click', () => this.openActiveInNewTab());

    this.readerMarkStudiedBtn.addEventListener('click', () => {
      if (!this.currentLecture) return;
      this.toggleStudied(this.currentLecture.id);
      this.updateReaderStudiedBtn();
    });

    // Категории
    if (this.categoryTabsContainer) {
      this.categoryTabsContainer.querySelectorAll('.category-tab').forEach(tab => {
        tab.addEventListener('click', () => {
          this.categoryTabsContainer.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          this.filters.category = tab.dataset.category || '';
          this.renderLectures();
        });
      });
    }

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

    this.layoutToggleBtn.addEventListener('click', () => {
      this.layoutMode = this.layoutMode === 'exhibition' ? 'registry' : 'exhibition';
      this.layoutToggleBtn.textContent = this.layoutMode === 'exhibition' ? '🏛️ Экспозиция' : '📜 Реестр';
      this.renderLectures();
    });

    this.resetFiltersBtn.addEventListener('click', () => {
      this.filters.subject = '';
      this.filters.category = '';
      this.filters.module = '';
      this.filters.tag = '';
      this.filters.studiedOnly = false;
      this.filters.searchQuery = '';
      if (this.inlineSearchInput) this.inlineSearchInput.value = '';
      if (this.inlineSearchClear) this.inlineSearchClear.style.display = 'none';
      this.filterModule.value = '';
      this.filterStudiedToggle.classList.remove('active');
      if (this.categoryTabsContainer) {
        this.categoryTabsContainer.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
        this.categoryTabsContainer.querySelector('.category-tab[data-category=""]')?.classList.add('active');
      }
      this.renderSubjectsTabs();
      this.renderLectures();
    });

    if (this.inlineSearchInput) {
      this.inlineSearchInput.addEventListener('input', (e) => {
        const val = e.target.value.trim().toLowerCase();
        this.filters.searchQuery = val;
        if (this.inlineSearchClear) {
          this.inlineSearchClear.style.display = val ? 'inline-block' : 'none';
        }
        this.renderLectures();
      });
    }

    if (this.inlineSearchClear) {
      this.inlineSearchClear.addEventListener('click', () => {
        if (this.inlineSearchInput) this.inlineSearchInput.value = '';
        this.filters.searchQuery = '';
        this.inlineSearchClear.style.display = 'none';
        this.renderLectures();
      });
    }

    // Модалки
    this.calendarOpenBtn.addEventListener('click', () => {
      this.calendarModal.classList.add('open');
      this.renderCalendarMonth();
    });
    this.calCloseBtn.addEventListener('click', () => this.calendarModal.classList.remove('open'));
    this.calPrevMonth.addEventListener('click', () => {
      this.calCurrentDate.setMonth(this.calCurrentDate.getMonth() - 1);
      this.renderCalendarMonth();
    });
    this.calNextMonth.addEventListener('click', () => {
      this.calCurrentDate.setMonth(this.calCurrentDate.getMonth() + 1);
      this.renderCalendarMonth();
    });

    this.announcementsOpenBtn.addEventListener('click', () => {
      this.announcementsModal.classList.add('open');
      this.renderAnnouncements();
    });
    this.annCloseBtn.addEventListener('click', () => this.announcementsModal.classList.remove('open'));

    this.paletteOpenBtn.addEventListener('click', () => this.searchEngine.open());
    this.searchEngine.setSelectCallback((item, openInNewTab) => {
      const lecId = typeof item === 'object' ? item.id : item;
      const type = typeof item === 'object' ? item.type : 'lecture';

      if (type === 'announcement') {
        if (this.announcementsModal) {
          this.announcementsModal.classList.add('open');
          this.renderAnnouncements();
        }
        return;
      }

      if (openInNewTab) {
        this.openLectureInNewTab(lecId);
      } else {
        this.openLecture(lecId);
      }
    });

    // Админка
    this.adminLecCancel?.addEventListener('click', () => this.adminLecModal.classList.remove('open'));
    this.adminLecClose?.addEventListener('click', () => this.adminLecModal.classList.remove('open'));
    this.adminLecForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveLectureForm();
    });

    if (this.adminExportBtn) {
      this.adminExportBtn.addEventListener('click', () => {
        if (this.adminManager) this.adminManager.exportMetadataJson();
      });
    }

    if (this.adminNewSubjectBtn) {
      this.adminNewSubjectBtn.addEventListener('click', () => {
        const name = prompt('Название нового предмета:');
        if (name && this.adminManager) {
          this.adminManager.saveSubject(name);
          this.renderSubjectsTabs();
          this.renderLectures();
        }
      });
    }

    if (this.adminNewModuleBtn) {
      this.adminNewModuleBtn.addEventListener('click', () => {
        const name = prompt('Название нового модуля (пример: Модуль 5):');
        if (name && this.adminManager) {
          this.adminManager.saveModule(name);
          this.populateFilterDropdowns();
        }
      });
    }

    if (this.adminNewAnnouncementBtn) {
      this.adminNewAnnouncementBtn.addEventListener('click', () => {
        const title = prompt('Название дедлайна или объявления:');
        if (!title) return;
        const dt = prompt('Дата и время дедлайна (ГГГГ-ММ-ДД ЧЧ:ММ):', new Date().toISOString().slice(0, 16).replace('T', ' '));
        if (this.adminManager) {
          this.adminManager.saveAnnouncement({
            title,
            type: 'deadline',
            datetime: dt ? new Date(dt).toISOString() : '',
            urgent: true
          });
          this.updateHeroStats();
          this.updateAnnouncementsBadge();
        }
      });
    }

    window.addEventListener('hashchange', () => this.handleHashChange());
  }

  // ==========================================
  // АВТОРИЗАЦИЯ И РАЗДЕЛЕНИЕ РОЛЕЙ (Zero-Knowledge)
  // ==========================================
  async checkAutoLogin() {
    const storedKey = sessionStorage.getItem('fpm_key') || localStorage.getItem('fpm_key');
    if (!storedKey) return;

    try {
      const importedKey = await VaultCrypto.importKeyRaw(storedKey);
      this.cryptoKey = importedKey;

      let adminUnlocked = false;
      try {
        const adminResp = await fetch(`admin.bin?t=${Date.now()}`);
        if (adminResp.ok) {
          const adminBuf = await adminResp.arrayBuffer();
          const dec = await VaultCrypto.decryptBlob(adminBuf, importedKey);
          this.metadata = JSON.parse(new TextDecoder().decode(dec));
          adminUnlocked = true;
        }
      } catch (errAdminTest) {
        adminUnlocked = false;
      }

      this.isAdmin = adminUnlocked;

      if (!this.isAdmin) {
        await this.loadMetadata();
      } else if (this.metadata && this.metadata.sharedKeyHex) {
        // Администратор дешифровал admin.bin ключом администратора,
        // но все blobs (HTML конспекты и PDF оригиналы) зашифрованы ключом sharedKey!
        const hex = this.metadata.sharedKeyHex;
        const raw = new Uint8Array(hex.length / 2);
        for (let i = 0; i < hex.length; i += 2) {
          raw[i / 2] = parseInt(hex.substr(i, 2), 16);
        }
        this.cryptoKey = await crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, true, ['encrypt', 'decrypt']);
      }

      this.unlockApp();
    } catch (e) {
      this.handleLogout();
    }
  }

  async handleLogin(password) {
    this.authError.classList.remove('visible');
    this.authSubmit.disabled = true;
    this.authSubmit.textContent = 'Расшифровка архива...';

    try {
      // 1. Попытка дешифрования студенческого каталога metadata.bin
      let metaResp = await fetch(`metadata.bin?t=${Date.now()}`, { cache: 'no-store' });
      if (metaResp.ok) {
        const metaBuf = await metaResp.arrayBuffer();
        try {
          const decryptedBytes = await VaultCrypto.decryptBlob(metaBuf, password);
          const metaText = new TextDecoder().decode(decryptedBytes);
          this.metadata = JSON.parse(metaText);
          this.isAdmin = false;
          await this.completeLoginSuccess(password, metaBuf);
          return;
        } catch (errShared) {}
      }

      // 2. Попытка дешифрования каталога администратора admin.bin
      let adminResp = await fetch(`admin.bin?t=${Date.now()}`, { cache: 'no-store' });
      if (adminResp.ok) {
        const adminBuf = await adminResp.arrayBuffer();
        try {
          const decryptedAdminBytes = await VaultCrypto.decryptBlob(adminBuf, password);
          const adminText = new TextDecoder().decode(decryptedAdminBytes);
          this.metadata = JSON.parse(adminText);
          this.isAdmin = true;
          await this.completeLoginSuccess(password, adminBuf);
          return;
        } catch (errAdmin) {}
      }

      throw new Error('Неверный пароль доступа');
    } catch (e) {
      this.authError.classList.add('visible');
      if (this.vault3d) this.vault3d.onError();
    } finally {
      this.authSubmit.disabled = false;
      this.authSubmit.textContent = 'ОТКРЫТЬ АРХИВ →';
    }
  }

  async completeLoginSuccess(password, sampleBlobBuffer) {
    const bytes = new Uint8Array(sampleBlobBuffer);
    const salt = bytes.slice(6, 22);

    let keyToStore;
    if (this.isAdmin) {
      const adminKey = await VaultCrypto.deriveKey(password, salt);
      keyToStore = adminKey;

      if (this.metadata && this.metadata.sharedKeyHex) {
        const hex = this.metadata.sharedKeyHex;
        const raw = new Uint8Array(hex.length / 2);
        for (let i = 0; i < hex.length; i += 2) {
          raw[i / 2] = parseInt(hex.substr(i, 2), 16);
        }
        this.cryptoKey = await crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, true, ['encrypt', 'decrypt']);
      } else {
        this.cryptoKey = adminKey;
      }
    } else {
      this.cryptoKey = await VaultCrypto.deriveKey(password, salt);
      keyToStore = this.cryptoKey;
    }

    localStorage.removeItem('fpm_key');
    localStorage.removeItem('fpm_is_admin');
    sessionStorage.removeItem('fpm_key');
    sessionStorage.removeItem('fpm_is_admin');

    const rawKeyB64 = await VaultCrypto.exportKeyRaw(keyToStore);
    const targetStorage = this.authRemember.checked ? localStorage : sessionStorage;
    targetStorage.setItem('fpm_key', rawKeyB64);
    targetStorage.setItem('fpm_is_admin', this.isAdmin ? 'true' : 'false');

    this.unlockApp();
  }

  async loadMetadata() {
    const filename = this.isAdmin ? 'admin.bin' : 'metadata.bin';
    const resp = await fetch(`${filename}?t=${Date.now()}`, { cache: 'no-store' });
    if (!resp.ok) throw new Error('Не найден файл каталога');
    const buf = await resp.arrayBuffer();
    const decryptedBytes = await VaultCrypto.decryptBlob(buf, this.cryptoKey);
    this.metadata = JSON.parse(new TextDecoder().decode(decryptedBytes));

    if (this.isAdmin && this.metadata && this.metadata.sharedKeyHex) {
      const hex = this.metadata.sharedKeyHex;
      const raw = new Uint8Array(hex.length / 2);
      for (let i = 0; i < hex.length; i += 2) {
        raw[i / 2] = parseInt(hex.substr(i, 2), 16);
      }
      this.cryptoKey = await crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, true, ['encrypt', 'decrypt']);
    }
  }

  unlockApp() {
    if (this.vault3d) this.vault3d.pause();
    this.authView.style.display = 'none';
    this.mainView.style.display = 'block';

    if (this.isAdmin) {
      this.adminToolbar.classList.add('active');
      this.adminToolbar.style.setProperty('display', 'block', 'important');
      if (this.annAdminAddBtn) this.annAdminAddBtn.style.display = 'inline-flex';
      this.initAdmin();
    } else {
      this.adminToolbar.classList.remove('active');
      this.adminToolbar.style.setProperty('display', 'none', 'important');
      if (this.annAdminAddBtn) this.annAdminAddBtn.style.display = 'none';
    }

    this.populateFilterDropdowns();
    this.renderSubjectsTabs();
    this.renderLectures();
    this.updateHeroStats();
    this.updateAnnouncementsBadge();

    this.indexLecturesAsync();
    this.handleHashChange();
  }

  // Режим конспирации (Panic Key - Двойной Esc)
  triggerPanicKey() {
    const overlay = document.getElementById('panic-overlay');
    if (overlay) overlay.classList.add('active');

    localStorage.removeItem('fpm_key');
    localStorage.removeItem('fpm_is_admin');
    sessionStorage.clear();
    this.cryptoKey = null;
    this.metadata = null;
    this.isAdmin = false;
    window.location.hash = '';

    setTimeout(() => {
      window.location.reload();
    }, 150);
  }

  handleLogout() {
    this.triggerPanicKey();
  }

  initAdmin() {
    this.adminManager = new AdminManager(this.metadata, (updatedMeta) => {
      this.metadata = updatedMeta;
      this.populateFilterDropdowns();
      this.renderSubjectsTabs();
      this.renderLectures();
      this.updateHeroStats();
      this.updateAnnouncementsBadge();
    });
  }

  openAdminLectureModal(lecId) {
    if (!this.isAdmin || !this.adminManager) return;
    const lecture = (this.metadata.lectures || []).find(l => l.id === lecId);
    if (!lecture) return;

    const idInput = document.getElementById('admin-lec-id');
    const titleInput = document.getElementById('admin-lec-title');
    const subjSelect = document.getElementById('admin-lec-subject');
    const modSelect = document.getElementById('admin-lec-module');
    const sessionsInput = document.getElementById('admin-lec-sessions');
    const tagsInput = document.getElementById('admin-lec-tags');
    const descInput = document.getElementById('admin-lec-desc');
    const hiddenCheckbox = document.getElementById('admin-lec-hidden');

    if (idInput) idInput.value = lecture.id;
    if (titleInput) titleInput.value = lecture.title || '';

    if (subjSelect) {
      subjSelect.innerHTML = (this.metadata.subjects || []).map(s => 
        `<option value="${s.name}" ${s.name === lecture.subject ? 'selected' : ''}>${s.name}</option>`
      ).join('');
    }

    if (modSelect) {
      const allModules = this.metadata.modules && this.metadata.modules.length > 0
        ? this.metadata.modules
        : ['Модуль 1', 'Модуль 2', 'Модуль 3', 'Модуль 4'];
      modSelect.innerHTML = allModules.map(m => 
        `<option value="${m}" ${m === lecture.module ? 'selected' : ''}>${m}</option>`
      ).join('');
    }

    if (sessionsInput) {
      if (Array.isArray(lecture.sessions) && lecture.sessions.length > 0) {
        sessionsInput.value = lecture.sessions.map(s => `${s.number || 1}:${s.date || ''}`).join(', ');
      } else {
        sessionsInput.value = '';
      }
    }

    if (tagsInput) {
      tagsInput.style.textTransform = 'uppercase';
      const cleanTags = Array.isArray(lecture.tags)
        ? lecture.tags.map(t => String(t).trim().replace(/^#+/, '').toUpperCase()).filter(Boolean)
        : (lecture.tags ? String(lecture.tags).split(/[,;\s]+/).map(t => t.trim().replace(/^#+/, '').toUpperCase()).filter(Boolean) : []);
      tagsInput.value = cleanTags.join(', ');
      tagsInput.oninput = () => {
        tagsInput.value = tagsInput.value.toUpperCase();
      };
    }

    if (descInput) {
      descInput.value = lecture.description || '';
    }

    if (hiddenCheckbox) {
      hiddenCheckbox.checked = !!lecture.hidden;
    }

    this.adminLecModal.classList.add('open');
  }

  saveLectureForm() {
    if (!this.isAdmin || !this.adminManager) return;
    const id = document.getElementById('admin-lec-id')?.value;
    if (!id) return;

    const title = document.getElementById('admin-lec-title')?.value || '';
    const subject = document.getElementById('admin-lec-subject')?.value || '';
    const module = document.getElementById('admin-lec-module')?.value || '';
    const rawSessions = document.getElementById('admin-lec-sessions')?.value || '';
    const rawTags = document.getElementById('admin-lec-tags')?.value || '';
    const tags = rawTags.split(/[,;\s]+/).map(t => t.trim().replace(/^#+/, '').toUpperCase()).filter(Boolean);
    const description = document.getElementById('admin-lec-desc')?.value || '';
    const hidden = document.getElementById('admin-lec-hidden')?.checked || false;

    // Парсим sessions: "1:02.09.2026, 2:05.09.2026"
    const sessions = [];
    if (rawSessions.trim()) {
      const parts = rawSessions.split(',').map(p => p.trim()).filter(Boolean);
      for (const part of parts) {
        if (part.includes(':')) {
          const [numStr, dateStr] = part.split(':').map(s => s.trim());
          sessions.push({
            number: parseInt(numStr, 10) || 1,
            date: dateStr || ''
          });
        } else if (/^\d{2}\.\d{2}\.\d{4}$/.test(part)) {
          sessions.push({ number: sessions.length + 1, date: part });
        } else {
          sessions.push({ number: parseInt(part, 10) || 1, date: '' });
        }
      }
    }

    this.adminManager.updateLecture(id, {
      title,
      subject,
      module,
      sessions,
      tags,
      description,
      hidden
    });

    this.adminLecModal.classList.remove('open');
    this.renderSubjectsTabs();
    this.renderLectures();
    this.updateHeroStats();
    if (this.searchEngine) {
      this.searchEngine.buildIndex(this.metadata);
    }
  }

  // ==========================================
  // ГЛАВНАЯ ЭКСПОЗИЦИЯ (HAUTE COUTURE EDITORIAL)
  // ==========================================
  renderSubjectsTabs() {
    this.subjectsTabsContainer.innerHTML = '';
    const lectures = (this.metadata.lectures || []).filter(l => !l.hidden || this.isAdmin);
    const totalCount = lectures.length;

    const allTab = document.createElement('button');
    allTab.className = `subject-tab-pill ${!this.filters.subject ? 'active' : ''}`;
    allTab.innerHTML = `<span>ВСЕ ПРЕДМЕТЫ</span><span style="opacity: 0.65; font-size: 0.78rem;">(${totalCount})</span>`;
    allTab.addEventListener('click', () => {
      this.filters.subject = '';
      this.renderSubjectsTabs();
      this.renderLectures();
    });
    this.subjectsTabsContainer.appendChild(allTab);

    for (const subj of this.metadata.subjects || []) {
      const count = lectures.filter(l => l.subject === subj.name).length;
      const tab = document.createElement('button');
      tab.className = `subject-tab-pill ${this.filters.subject === subj.name ? 'active' : ''}`;
      tab.innerHTML = `
        <span style="color: ${subj.color || 'var(--gold-antique)'}; font-size: 0.85rem;">●</span>
        <span>${subj.name}</span>
        <span style="opacity: 0.65; font-size: 0.78rem;">(${count})</span>
      `;

      tab.addEventListener('click', () => {
        this.filters.subject = this.filters.subject === subj.name ? '' : subj.name;
        this.renderSubjectsTabs();
        this.renderLectures();
      });

      this.subjectsTabsContainer.appendChild(tab);
    }
  }

  populateFilterDropdowns() {
    this.filterModule.innerHTML = '<option value="">Все модули</option>';
    for (const mod of this.metadata.modules || []) {
      const opt = document.createElement('option');
      opt.value = mod;
      opt.textContent = mod;
      this.filterModule.appendChild(opt);
    }
  }

  renderLectures() {
    this.lecturesContainer.innerHTML = '';
    let list = (this.metadata.lectures || []).filter(l => !l.hidden || this.isAdmin);

    let hasExplicitSearchSubject = false;
    if (this.filters.searchQuery && this.searchEngine) {
      const intent = this.searchEngine.parseIntent(this.filters.searchQuery);
      if (intent.targetSubject) hasExplicitSearchSubject = true;
    }

    if (this.filters.subject && !hasExplicitSearchSubject) {
      list = list.filter(l => l.subject === this.filters.subject);
    }
    if (this.filters.category) list = list.filter(l => (l.category || 'лекции').toLowerCase() === this.filters.category.toLowerCase());
    if (this.filters.module) list = list.filter(l => l.module === this.filters.module);
    if (this.filters.tag) list = list.filter(l => (l.tags || []).includes(this.filters.tag));
    if (this.filters.studiedOnly) list = list.filter(l => !this.studiedSet.has(l.id));

    if (this.filters.searchQuery && this.searchEngine) {
      const searchResults = this.searchEngine.search(this.filters.searchQuery);
      const matchingIds = new Set(
        searchResults
          .filter(item => item.type === 'lecture' || !item.type)
          .map(item => item.id)
      );
      list = list.filter(l => matchingIds.has(l.id));
    }

    list.sort((a, b) => {
      if (this.filters.sort === 'session-num-asc') {
        const numA = (a.sessions && a.sessions[0]?.number) || 0;
        const numB = (b.sessions && b.sessions[0]?.number) || 0;
        return numA - numB;
      }
      if (this.filters.sort === 'title-asc') return a.title.localeCompare(b.title, 'ru');
      if (this.filters.sort === 'added-desc') return new Date(b.addedAt || 0) - new Date(a.addedAt || 0);

      const dateA = this.parseDate(a.sessions && a.sessions[0]?.date);
      const dateB = this.parseDate(b.sessions && b.sessions[0]?.date);
      return this.filters.sort === 'session-date-asc' ? dateA - dateB : dateB - dateA;
    });

    if (list.length === 0) {
      this.lecturesContainer.innerHTML = `
        <div style="text-align: center; padding: 60px 20px; color: var(--parchment-muted); border: 1px dashed var(--border-subtle); border-radius: var(--radius-md);">
          По выбранным фильтрам материалы не найдены.
        </div>
      `;
      return;
    }

    if (this.layoutMode === 'registry') {
      this.renderRegistryTable(list);
      return;
    }

    // 1. МОНУМЕНТАЛЬНЫЙ HERO FOLIO (Центральный актуальный экспонат)
    const featuredLecture = list[0];
    const heroCard = this.createHeroFolioCard(featuredLecture);
    this.lecturesContainer.appendChild(heroCard);

    // 2. АСИММЕТРИЧНЫЕ ДИПТИХИ (Остальные экспонаты)
    if (list.length > 1) {
      const grid = document.createElement('div');
      grid.className = 'editorial-diptych-grid';
      for (let i = 1; i < list.length; i++) {
        const card = this.createExhibitFolioCard(list[i]);
        grid.appendChild(card);
      }
      this.lecturesContainer.appendChild(grid);
    }
  }

  // Создание монументального Hero Folio
  createHeroFolioCard(lec) {
    const el = document.createElement('article');
    el.className = 'hero-folio-card';

    const hasPdf = lec.originals && lec.originals.length > 0;
    const isStudied = this.studiedSet.has(lec.id);
    const subjColor = this.getSubjectColor(lec.subject);
    const dateStr = lec.sessions?.[0]?.date || '';
    const numStr = lec.sessions?.[0]?.number ? `Пара №${lec.sessions[0].number}` : '';

    el.innerHTML = `
      <div>
        <div class="hero-folio-badge">
          <span style="color: ${subjColor}; font-size: 1rem;">●</span>
          <span>${lec.subject} · ${lec.category || 'Лекция'}</span>
          ${numStr ? `<span>· ${numStr}</span>` : ''}
          ${dateStr ? `<span>· ${dateStr}</span>` : ''}
        </div>
        <h3 class="hero-folio-title">${lec.title}</h3>
        <p class="hero-folio-desc">${lec.description || 'Фундаментальный академический материал курса с разбором теорем, определений и математических выводов.'}</p>
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          ${(lec.tags || []).map(t => `<span style="font-size: 0.75rem; color: var(--gold-dim); background: rgba(212, 175, 55, 0.08); padding: 2px 8px; border-radius: 4px; font-weight: 500; letter-spacing: 0.03em;">#${String(t).trim().replace(/^#+/, '').toUpperCase()}</span>`).join('')}
        </div>
      </div>

      <div class="folio-pdf-spotlight">
        <div class="pdf-spotlight-header">
          <span>МАТЕРИАЛЫ И ОРИГИНАЛ ЛЕКТОРА</span>
          <span style="font-family: var(--font-mono); font-size: 0.72rem;">${hasPdf ? 'В АРХИВЕ' : 'ОЖИДАЕТСЯ'}</span>
        </div>

        <div class="pdf-spotlight-actions">
          ${hasPdf ? `
            <button class="btn-open-pdf-primary js-open-pdf">
              📄 ${lec.originals.length > 1 ? `ОТКРЫТЬ PDF ЛЕКТОРОВ (${lec.originals.length}) →` : 'ОТКРЫТЬ PDF ЛЕКТОРА →'}
            </button>
            <button class="btn-open-split-secondary js-open-split">
              ⚖️ СПЛИТ-РИДЕР (БОК О БОК)
            </button>
          ` : `
            <div style="font-size: 0.8rem; color: var(--parchment-muted); text-align: center; padding: 8px;">
              Оригинальный PDF лектора подготавливается и скоро появится в архиве.
            </div>
          `}
          <button class="btn-open-html-tertiary js-open-html">
            📝 Читать нейроконспект (HTML)
          </button>
        </div>
      </div>
    `;

    el.querySelector('.js-open-pdf')?.addEventListener('click', () => this.openLecture(lec.id, { mode: 'pdf' }));
    el.querySelector('.js-open-split')?.addEventListener('click', () => this.openLecture(lec.id, { mode: 'split' }));
    el.querySelector('.js-open-html')?.addEventListener('click', () => this.openLecture(lec.id, { mode: 'html' }));

    return el;
  }

  // Создание карточки асимметричного диптиха
  createExhibitFolioCard(lec) {
    const el = document.createElement('article');
    el.className = 'exhibit-folio-card';

    const hasPdf = lec.originals && lec.originals.length > 0;
    const isStudied = this.studiedSet.has(lec.id);
    const subjColor = this.getSubjectColor(lec.subject);
    const dateStr = lec.sessions?.[0]?.date || '';
    const numStr = lec.sessions?.[0]?.number ? `№${lec.sessions[0].number}` : '';

    el.innerHTML = `
      <!-- Чертежные оси и циркульная дуга архива -->
      <svg class="folio-draft-decor" viewBox="0 0 100 100" fill="none" stroke="currentColor">
        <circle cx="100" cy="0" r="90" stroke="var(--gold-antique)" stroke-width="0.8"/>
        <circle cx="100" cy="0" r="50" stroke="var(--gold-antique)" stroke-width="0.6" stroke-dasharray="2 3"/>
        <line x1="0" y1="0" x2="100" y2="100" stroke="var(--gold-antique)" stroke-width="0.5"/>
      </svg>

      <div>
        <div class="folio-meta-bar">
          <span class="folio-subject-tag" style="color: ${subjColor};">
            ● ${lec.subject}
          </span>
          <div style="display: flex; gap: 6px; align-items: center;">
            ${dateStr ? `<span class="folio-session-badge">${dateStr}</span>` : ''}
            ${numStr ? `<span class="folio-session-badge">${numStr}</span>` : ''}
          </div>
        </div>

        <h4 class="folio-card-title">${lec.title}</h4>
        <p class="folio-card-desc">${lec.description || 'Конспект занятия с аналитическими выкладками и теоремами.'}</p>
      </div>

      <div class="folio-card-actions">
        ${hasPdf ? `
          <button class="pdf-quick-badge js-quick-pdf" title="${lec.originals.length > 1 ? `Материал содержит ${lec.originals.length} PDF от лекторов. Нажмите для открытия` : 'Открыть оригинальный PDF лектора в 1 клик'}">
            📄 ${lec.originals.length > 1 ? `PDF (${lec.originals.length})` : 'PDF ЛЕКТОРА'}
          </button>
        ` : `
          <span style="font-size: 0.75rem; color: var(--parchment-muted);">PDF готовится</span>
        `}

        <div style="display: flex; align-items: center; gap: 10px;">
          <button class="btn-open-conspect js-open-note">
            Конспект →
          </button>
          ${this.isAdmin ? `<button class="js-admin-edit" style="color: var(--urgent-color); font-size: 0.8rem; cursor: pointer;">✏️</button>` : ''}
        </div>
      </div>
    `;

    el.querySelector('.js-quick-pdf')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.openLecture(lec.id, { mode: 'pdf' });
    });

    el.querySelector('.js-open-note')?.addEventListener('click', () => {
      this.openLecture(lec.id, { mode: 'html' });
    });

    el.querySelector('.js-admin-edit')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.openAdminLectureModal(lec.id);
    });

    return el;
  }

  // Режим архивного реестра (Таблица)
  renderRegistryTable(list) {
    const table = document.createElement('table');
    table.className = 'archival-registry-table';

    table.innerHTML = `
      <thead>
        <tr>
          <th>Статус</th>
          <th>Предмет</th>
          <th>Дата / №</th>
          <th>Материал</th>
          <th>Оригинал</th>
          <th>Действия</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;

    const tbody = table.querySelector('tbody');

    for (const lec of list) {
      const tr = document.createElement('tr');
      const hasPdf = lec.originals && lec.originals.length > 0;
      const isStudied = this.studiedSet.has(lec.id);
      const subjColor = this.getSubjectColor(lec.subject);
      const dateStr = lec.sessions?.[0]?.date || '—';
      const numStr = lec.sessions?.[0]?.number ? `№${lec.sessions[0].number}` : '';

      tr.innerHTML = `
        <td style="width: 40px; text-align: center; cursor: pointer;" class="js-toggle-studied">
          <span style="color: ${isStudied ? 'var(--gold-antique)' : 'var(--border-strong)'}; font-size: 1.1rem;">
            ${isStudied ? '☑' : '☐'}
          </span>
        </td>
        <td style="color: ${subjColor}; font-weight: 600;">${lec.subject}</td>
        <td style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--parchment-muted);">${dateStr} ${numStr}</td>
        <td style="font-weight: 600; color: var(--ivory-parchment); cursor: pointer;" class="js-open-title">${lec.title}</td>
        <td>
          ${hasPdf ? `
            <button class="pdf-quick-badge js-quick-pdf" style="padding: 4px 8px; font-size: 0.74rem;" title="${lec.originals.length > 1 ? `Материал содержит ${lec.originals.length} PDF от лекторов` : 'Открыть оригинальный PDF'}">
              📄 ${lec.originals.length > 1 ? `PDF (${lec.originals.length})` : 'PDF'}
            </button>
          ` : `<span style="font-size: 0.75rem; color: var(--parchment-muted);">—</span>`}
        </td>
        <td>
          <button class="btn-secondary js-open-split" style="padding: 4px 8px; font-size: 0.74rem;">
            ⚖️ Сплит
          </button>
          ${this.isAdmin ? `<button class="js-admin-edit" style="color: var(--urgent-color); font-size: 0.8rem; cursor: pointer; margin-left: 6px;" title="Редактировать материал">✏️</button>` : ''}
        </td>
      `;

      tr.querySelector('.js-toggle-studied').addEventListener('click', () => {
        this.toggleStudied(lec.id);
        this.renderLectures();
      });
      tr.querySelector('.js-open-title').addEventListener('click', () => this.openLecture(lec.id, { mode: 'html' }));
      tr.querySelector('.js-quick-pdf')?.addEventListener('click', () => this.openLecture(lec.id, { mode: 'pdf' }));
      tr.querySelector('.js-open-split')?.addEventListener('click', () => this.openLecture(lec.id, { mode: 'split' }));
      tr.querySelector('.js-admin-edit')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openAdminLectureModal(lec.id);
      });

      tbody.appendChild(tr);
    }

    this.lecturesContainer.appendChild(table);
  }

  // ==========================================
  // ПОЛНОЭКРАННЫЙ РИДЕР И СПЛИТ-РЕЖИМ (PDF Sovereign)
  // ==========================================
  async openLecture(lectureId, options = {}) {
    const lecture = (this.metadata.lectures || []).find(l => l.id === lectureId);
    if (!lecture) return;

    this.currentLecture = lecture;
    let requestedMode = options.mode || 'html';
    this.currentPdfIndex = options.pdfIndex || 0;

    const hasHtml = lecture.files && lecture.files.length > 0;
    const hasOriginal = lecture.originals && lecture.originals.length > 0;

    // Автоматическая корректировка: если у материала нет HTML, но есть PDF, переключаем на PDF!
    if (requestedMode === 'html' && !hasHtml && hasOriginal) {
      requestedMode = 'pdf';
    } else if (requestedMode === 'pdf' && !hasOriginal && hasHtml) {
      requestedMode = 'html';
    }

    this.readerTitle.textContent = lecture.title;
    this.readerSubjectDot.style.backgroundColor = this.getSubjectColor(lecture.subject);
    this.updateReaderStudiedBtn();

    this.readerModal.classList.add('open');
    this.cleanupBlobUrls();

    // 1. Активируем целевой режим ДО подстановки blob в iframe,
    // чтобы целевая панель уже имела display: flex (не display: none) в Chromium
    this.setReaderMode(requestedMode);

    // 2. Селектор оригиналов PDF
    if (this.readerPdfSelect) {
      if (hasOriginal && lecture.originals.length > 1) {
        this.readerPdfSelect.style.display = 'inline-block';
        this.readerPdfSelect.innerHTML = lecture.originals.map((orig, idx) => 
          `<option value="${idx}" ${idx === this.currentPdfIndex ? 'selected' : ''}>📄 ${orig.name} (${(orig.size / 1024).toFixed(0)} КБ)</option>`
        ).join('');
      } else {
        this.readerPdfSelect.style.display = 'none';
      }
    }

    // 3. Загрузка конспекта (HTML)
    if (hasHtml) {
      const htmlFile = lecture.files[0];
      try {
        const htmlBytes = await this.fetchAndDecryptBlob(htmlFile.blob);
        const htmlText = (typeof htmlBytes === 'string') ? htmlBytes : new TextDecoder().decode(htmlBytes);
        const htmlBlob = new Blob([htmlText], { type: 'text/html; charset=utf-8' });
        const htmlUrl = URL.createObjectURL(htmlBlob);
        this.activeObjectUrls.push(htmlUrl);
        lecture.currentHtmlBlobUrl = htmlUrl;

        this.readerIframe.srcdoc = htmlText;
        this.readerIframe.onload = () => {
          this.marginalia.attachToIframe(this.readerIframe, lecture.id);
          this.searchEngine.updateLectureContent(lecture.id, htmlText);
        };
        setTimeout(() => {
          this.marginalia.attachToIframe(this.readerIframe, lecture.id);
        }, 150);
      } catch (err) {
        console.error('Ошибка расшифровки конспекта:', err);
        this.readerIframe.srcdoc = `
          <body style="background:#110e17;color:#e8d8b8;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
            <div style="text-align:center;padding:24px;max-width:500px;">
              <p style="font-size:1.15rem;color:#e57373;margin-bottom:8px;">⚠️ Не удалось расшифровать конспект</p>
              <p style="font-size:0.85rem;color:#a89f91;line-height:1.5;">${err.message || 'Ошибка криптографического ключа'}. Пожалуйста, обновите страницу (Ctrl+F5) и авторизуйтесь заново.</p>
            </div>
          </body>
        `;
      }
    } else {
      this.readerIframe.srcdoc = `
        <body style="background:#110e17;color:#e8d8b8;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
          <div style="text-align:center;padding:24px;">
            <p style="font-size:1.1rem;color:#d4af37;">📝 Нейроконспект (HTML) отсутствует</p>
            <p style="font-size:0.85rem;color:#a89f91;">Для этого занятия доступен оригинал в формате PDF.</p>
          </div>
        </body>
      `;
    }

    // 4. Загрузка оригинала (PDF)
    if (hasOriginal) {
      await this.loadOriginalPdf(this.currentPdfIndex);
    } else {
      this.readerOrigIframe.src = 'about:blank';
    }

    // Управление видимостью кнопки "Скачать PDF" в шапке
    if (this.readerDownloadPdfBtn) {
      this.readerDownloadPdfBtn.style.display = hasOriginal ? 'inline-flex' : 'none';
    }
  }

  setReaderMode(mode) {
    if (!this.currentLecture) return;
    const hasHtml = this.currentLecture.files && this.currentLecture.files.length > 0;
    const hasOriginal = this.currentLecture.originals && this.currentLecture.originals.length > 0;

    if (mode === 'pdf' && !hasOriginal && hasHtml) {
      mode = 'html';
    } else if (mode === 'html' && !hasHtml && hasOriginal) {
      mode = 'pdf';
    } else if (mode === 'split' && (!hasHtml || !hasOriginal)) {
      mode = hasOriginal ? 'pdf' : 'html';
    }

    this.currentReaderMode = mode;

    this.segBtnNote?.classList.remove('active');
    this.segBtnOrig?.classList.remove('active');
    this.splitToggleBtn?.classList.remove('active');

    if (mode === 'pdf') {
      this.paneNote.style.display = 'none';
      this.paneOrig.style.display = 'flex';
      this.paneOrig.classList.remove('split-hidden');
      this.splitDivider.style.display = 'none';
      this.paneNote.style.width = '';
      this.paneNote.style.flex = '1';

      this.segBtnOrig?.classList.add('active');
      if (this.readerNewTabBtn) {
        this.readerNewTabBtn.title = 'Открыть оригинальный PDF в новой вкладке';
      }

      if (hasOriginal && (!this.readerOrigIframe.src || this.readerOrigIframe.src === 'about:blank' || this.readerOrigIframe.src === window.location.href)) {
        this.loadOriginalPdf(this.currentPdfIndex || 0);
      }
    } else if (mode === 'split') {
      this.paneNote.style.display = 'flex';
      this.paneOrig.style.display = 'flex';
      this.paneOrig.classList.remove('split-hidden');
      this.splitDivider.style.display = 'block';

      this.splitToggleBtn?.classList.add('active');
      if (this.readerNewTabBtn) {
        this.readerNewTabBtn.title = 'Открыть оригинальный PDF в новой вкладке';
      }

      if (hasOriginal && (!this.readerOrigIframe.src || this.readerOrigIframe.src === 'about:blank' || this.readerOrigIframe.src === window.location.href)) {
        this.loadOriginalPdf(this.currentPdfIndex || 0);
      }
    } else {
      // mode === 'html'
      this.paneNote.style.display = 'flex';
      this.paneOrig.style.display = 'none';
      this.splitDivider.style.display = 'none';
      this.paneNote.style.width = '';
      this.paneNote.style.flex = '1';

      this.segBtnNote?.classList.add('active');
      if (this.readerNewTabBtn) {
        this.readerNewTabBtn.title = 'Открыть HTML-конспект в новой вкладке';
      }
    }

    this.updateReaderHash();
  }

  updateReaderHash() {
    if (!this.currentLecture) return;
    this.isProgrammaticHashChange = true;
    window.location.hash = `lecture-${this.currentLecture.id}:${this.currentReaderMode}`;
    setTimeout(() => {
      this.isProgrammaticHashChange = false;
    }, 150);
  }

  toggleSplitView() {
    if (!this.currentLecture) return;
    const hasOriginal = this.currentLecture.originals && this.currentLecture.originals.length > 0;
    const hasHtml = this.currentLecture.files && this.currentLecture.files.length > 0;

    if (!hasOriginal) {
      alert('Оригинальный PDF лектора для этого материала пока не загружен.');
      return;
    }
    if (!hasHtml) {
      alert('Нейроконспект (HTML) для этого материала отсутствует, доступен только оригинал PDF.');
      return;
    }

    if (this.currentReaderMode === 'split') {
      this.setReaderMode('html');
    } else {
      this.setReaderMode('split');
    }
  }

  openActiveInNewTab() {
    if (!this.currentLecture) return;

    if (this.currentReaderMode === 'pdf') {
      if (this.currentLecture.currentPdfBlobUrl) {
        window.open(this.currentLecture.currentPdfBlobUrl, '_blank');
      } else {
        alert('PDF файл еще не расшифрован.');
      }
    } else if (this.currentReaderMode === 'html') {
      if (this.currentLecture.currentHtmlBlobUrl) {
        window.open(this.currentLecture.currentHtmlBlobUrl, '_blank');
      } else if (this.currentLecture.currentPdfBlobUrl) {
        window.open(this.currentLecture.currentPdfBlobUrl, '_blank');
      }
    } else if (this.currentReaderMode === 'split') {
      if (this.currentLecture.currentPdfBlobUrl) {
        window.open(this.currentLecture.currentPdfBlobUrl, '_blank');
      } else if (this.currentLecture.currentHtmlBlobUrl) {
        window.open(this.currentLecture.currentHtmlBlobUrl, '_blank');
      }
    }
  }

  async openLectureInNewTab(lecId, mode = 'html') {
    const lecture = (this.metadata.lectures || []).find(l => l.id === lecId);
    if (!lecture) return;

    if (mode === 'pdf' || (!lecture.files?.length && lecture.originals?.length)) {
      if (lecture.originals?.[0]) {
        try {
          let bytes = await this.fetchAndDecryptBlob(lecture.originals[0].blob);
          if (typeof bytes === 'string') bytes = new TextEncoder().encode(bytes);
          const blob = new Blob([bytes], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          window.open(url, '_blank');
        } catch (e) {
          console.error('Ошибка открытия PDF в новой вкладке:', e);
        }
      }
    } else if (lecture.files?.[0]) {
      try {
        const bytes = await this.fetchAndDecryptBlob(lecture.files[0].blob);
        const text = typeof bytes === 'string' ? bytes : new TextDecoder().decode(bytes);
        const blob = new Blob([text], { type: 'text/html; charset=utf-8' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
      } catch (e) {
        console.error('Ошибка открытия HTML в новой вкладке:', e);
      }
    }
  }

  downloadHtmlNote(lecture) {
    if (!lecture) lecture = this.currentLecture;
    if (!lecture) return;

    if (!lecture.currentHtmlBlobUrl) {
      alert('HTML-конспект отсутствует для этой лекции.');
      return;
    }
    const a = document.createElement('a');
    a.href = lecture.currentHtmlBlobUrl;
    const cleanSubj = (lecture.subject || '').replace(/[\/\\?%*:|"<>]/g, '');
    const cleanTitle = (lecture.title || '').replace(/[\/\\?%*:|"<>]/g, '');
    a.download = `[ФПМ ВШЭ] ${cleanSubj} · ${cleanTitle} (Конспект).html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  initSplitDivider() {
    if (!this.splitDivider) return;
    let isDragging = false;

    this.splitDivider.addEventListener('mousedown', () => {
      isDragging = true;
      this.splitDivider.classList.add('dragging');
      document.body.style.cursor = 'col-resize';
      this.readerIframe.style.pointerEvents = 'none';
      this.readerOrigIframe.style.pointerEvents = 'none';
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const totalWidth = window.innerWidth;
      const leftWidth = Math.max(280, Math.min(e.clientX, totalWidth - 280));
      this.paneNote.style.flex = 'none';
      this.paneNote.style.width = `${leftWidth}px`;
    });

    window.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        this.splitDivider.classList.remove('dragging');
        document.body.style.cursor = '';
        this.readerIframe.style.pointerEvents = '';
        this.readerOrigIframe.style.pointerEvents = '';
      }
    });
  }

  async loadOriginalPdf(pdfIndex = 0) {
    if (!this.currentLecture?.originals?.length) return;
    const origList = this.currentLecture.originals;
    if (pdfIndex < 0 || pdfIndex >= origList.length) pdfIndex = 0;
    this.currentPdfIndex = pdfIndex;

    const origFile = origList[pdfIndex];
    try {
      const origBytes = await this.fetchAndDecryptBlob(origFile.blob);
      const rawBytes = (origBytes instanceof Uint8Array) ? origBytes : new TextEncoder().encode(origBytes);
      const mimeType = 'application/pdf';
      const origBlob = new Blob([rawBytes], { type: mimeType });
      const origUrl = URL.createObjectURL(origBlob);
      this.activeObjectUrls.push(origUrl);
      this.currentLecture.currentPdfBlobUrl = origUrl;
      this.currentLecture.currentPdfName = origFile.name;

      this.readerOrigIframe.src = origUrl;
      if (this.readerPdfSelect) {
        this.readerPdfSelect.value = String(pdfIndex);
      }
    } catch (err) {
      console.error('Ошибка расшифровки оригинала:', err);
      if (this.readerOrigIframe) {
        this.readerOrigIframe.srcdoc = `
          <body style="background:#110e17;color:#e8d8b8;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
            <div style="text-align:center;padding:24px;max-width:500px;">
              <p style="font-size:1.15rem;color:#e57373;margin-bottom:8px;">⚠️ Не удалось расшифровать PDF оригинал</p>
              <p style="font-size:0.85rem;color:#a89f91;line-height:1.5;">${err.message || 'Ошибка криптографического ключа'}. Пожалуйста, обновите страницу (Ctrl+F5) и авторизуйтесь заново.</p>
            </div>
          </body>
        `;
      }
    }
  }

  // Скачивание оригинального PDF с благородным русским именем
  downloadOriginalPdf(lecture) {
    if (!lecture.currentPdfBlobUrl) return;
    const origList = lecture.originals || [];
    const currentOrig = origList[this.currentPdfIndex || 0] || origList[0];
    const a = document.createElement('a');
    a.href = lecture.currentPdfBlobUrl;
    const origName = currentOrig?.name ? currentOrig.name.replace(/\.pdf$/i, '') : 'Оригинал';
    const cleanSubj = lecture.subject.replace(/[\/\\?%*:|"<>]/g, '');
    const cleanTitle = lecture.title.replace(/[\/\\?%*:|"<>]/g, '');
    a.download = `[ФПМ ВШЭ] ${cleanSubj} · ${cleanTitle} — ${origName}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  cleanupBlobUrls() {
    for (const url of this.activeObjectUrls) {
      try { URL.revokeObjectURL(url); } catch (e) {}
    }
    this.activeObjectUrls = [];
  }

  closeReader(updateHash = true) {
    this.readerModal.classList.remove('open');
    this.readerIframe.src = 'about:blank';
    this.readerIframe.srcdoc = '';
    this.readerOrigIframe.src = 'about:blank';
    this.readerOrigIframe.srcdoc = '';
    this.cleanupBlobUrls();
    this.currentLecture = null;
    this.currentReaderMode = null;
    if (updateHash) {
      this.isProgrammaticHashChange = true;
      window.location.hash = '';
      setTimeout(() => {
        this.isProgrammaticHashChange = false;
      }, 150);
    }
  }

  async fetchAndDecryptBlob(hash) {
    if (this.blobCache.has(hash)) {
      const cached = this.blobCache.get(hash);
      return (cached instanceof Uint8Array) ? cached : new TextEncoder().encode(cached);
    }
    const resp = await fetch(`blobs/${hash}.bin`);
    if (!resp.ok) throw new Error(`Не удалось загрузить blob: ${hash}`);
    const buffer = await resp.arrayBuffer();
    const decryptedBytes = await VaultCrypto.decryptBlob(buffer, this.cryptoKey);
    this.blobCache.set(hash, decryptedBytes);
    return decryptedBytes;
  }

  // ==========================================
  // СУТОЧНОЕ ОСВЕЩЕНИЕ (CHIAROSCURO TIME-LAPSE)
  // ==========================================
  initCircadianLighting() {
    const update = () => {
      const hour = new Date().getHours();
      let tint = 'rgba(0, 0, 0, 0)';
      let label = 'Дневной зал';
      let icon = '🏛️';

      if (hour >= 5 && hour < 10) {
        // Рассветный архив: холодный серебристый туман
        tint = 'rgba(180, 200, 220, 0.03)';
        label = 'Рассветный архив';
        icon = '🌫️';
      } else if (hour >= 10 && hour < 17) {
        // Дневной зал: теплый музейный пергамент
        tint = 'rgba(212, 175, 55, 0.02)';
        label = 'Дневной зал';
        icon = '🏛️';
      } else if (hour >= 17 && hour < 22) {
        // Сумеречная ложа: медно-янтарный закат
        tint = 'rgba(181, 80, 31, 0.04)';
        label = 'Сумеречная ложа';
        icon = '🌇';
      } else {
        // Ночной бархат: глубокий обсидиановый полумрак
        tint = 'rgba(3, 2, 6, 0.12)';
        label = 'Ночной бархат';
        icon = '🌌';
      }

      document.documentElement.style.setProperty('--circadian-tint', tint);
    };

    update();
    setInterval(update, 60000);
  }

  // ==========================================
  // АКАДЕМИЧЕСКИЙ ФУНКЦИОНАЛ (Календарь, Дедлайны, Чеклист)
  // ==========================================
  toggleStudied(lecId) {
    if (this.studiedSet.has(lecId)) {
      this.studiedSet.delete(lecId);
    } else {
      this.studiedSet.add(lecId);
    }
    localStorage.setItem('fpm_studied', JSON.stringify([...this.studiedSet]));
    this.updateHeroStats();
  }

  updateReaderStudiedBtn() {
    if (!this.currentLecture) return;
    const isStudied = this.studiedSet.has(this.currentLecture.id);
    this.readerMarkStudiedBtn.textContent = isStudied ? '✓ Изучено' : '☐ Отметить изученным';
    this.readerMarkStudiedBtn.style.color = isStudied ? 'var(--gold-antique)' : 'var(--ivory-parchment)';
  }

  updateHeroStats() {
    const list = (this.metadata?.lectures || []).filter(l => !l.hidden || this.isAdmin);
    const total = list.length;
    let studiedCount = 0;
    for (const l of list) {
      if (this.studiedSet.has(l.id)) studiedCount++;
    }

    const percent = total > 0 ? Math.round((studiedCount / total) * 100) : 0;
    if (this.statTotalLectures) this.statTotalLectures.textContent = total;
    if (this.statStudiedPercent) this.statStudiedPercent.textContent = `${percent}%`;
    if (this.statStudiedRatio) this.statStudiedRatio.textContent = `${studiedCount} из ${total}`;
    if (this.statProgressBar) this.statProgressBar.style.width = `${percent}%`;

    const activeDeadlines = (this.metadata?.announcements || []).filter(a => {
      if (a.type !== 'deadline' || !a.datetime) return false;
      return new Date(a.datetime).getTime() > Date.now();
    }).length;
    if (this.statActiveDeadlines) this.statActiveDeadlines.textContent = activeDeadlines;
  }

  updateAnnouncementsBadge() {
    const announcements = this.metadata?.announcements || [];
    const urgentCount = announcements.filter(a => a.urgent || (a.type === 'deadline' && new Date(a.datetime) > new Date())).length;
    if (this.announcementsCountBadge) {
      if (urgentCount > 0) {
        this.announcementsCountBadge.style.display = 'inline-block';
        this.announcementsCountBadge.textContent = urgentCount;
      } else {
        this.announcementsCountBadge.style.display = 'none';
      }
    }
  }

  renderAnnouncements() {
    if (!this.announcementsList) return;
    this.announcementsList.innerHTML = '';
    const items = this.metadata?.announcements || [];

    if (items.length === 0) {
      this.announcementsList.innerHTML = `
        <div style="text-align: center; padding: 32px; color: var(--parchment-muted);">
          Активных дедлайнов нет.
        </div>
      `;
      return;
    }

    for (const ann of items) {
      const card = document.createElement('div');
      card.className = 'modal-card';
      card.style.padding = '16px';
      card.style.background = 'var(--bg-surface)';
      card.style.border = '1px solid var(--border-subtle)';

      let countdownText = '';
      if (ann.type === 'deadline' && ann.datetime) {
        const diffMs = new Date(ann.datetime).getTime() - Date.now();
        if (diffMs > 0) {
          const hours = Math.floor(diffMs / 3600000);
          const mins = Math.floor((diffMs % 3600000) / 60000);
          const secs = Math.floor((diffMs % 60000) / 1000);
          countdownText = `⏳ Осталось: ${hours}ч ${mins}м ${secs}с`;
        } else {
          countdownText = '⚠️ Дедлайн истек';
        }
      }

      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
          <h4 style="font-size: 1.1rem; color: var(--gold-antique);">${ann.title}</h4>
          ${this.isAdmin ? `<button class="js-del-ann" style="color: var(--urgent-color); font-size: 0.8rem;">✕</button>` : ''}
        </div>
        ${ann.text ? `<p style="font-size: 0.85rem; color: var(--parchment-muted); margin-bottom: 8px;">${ann.text}</p>` : ''}
        <div style="font-family: var(--font-mono); font-size: 0.76rem; color: var(--gold-light);">
          ${countdownText}
        </div>
      `;

      card.querySelector('.js-del-ann')?.addEventListener('click', () => {
        if (this.adminManager) {
          this.adminManager.deleteAnnouncement(ann.id);
          this.renderAnnouncements();
          this.updateHeroStats();
        }
      });

      this.announcementsList.appendChild(card);
    }
  }

  updateDeadlineCountdowns() {
    if (this.announcementsModal?.classList.contains('open')) {
      this.renderAnnouncements();
    }
  }

  renderCalendarMonth() {
    if (!this.calDaysGrid) return;
    const year = this.calCurrentDate.getFullYear();
    const month = this.calCurrentDate.getMonth();

    const monthNames = [
      'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
      'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ];
    this.calMonthTitle.textContent = `${monthNames[month]} ${year}`;

    this.calDaysGrid.innerHTML = '';
    const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7; // Понедельник = 0
    const totalDays = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDayIndex; i++) {
      const empty = document.createElement('div');
      this.calDaysGrid.appendChild(empty);
    }

    const lectures = this.metadata?.lectures || [];

    for (let day = 1; day <= totalDays; day++) {
      const cell = document.createElement('div');
      const dayStr = `${String(day).padStart(2, '0')}.${String(month + 1).padStart(2, '0')}.${year}`;
      const matchingLectures = lectures.filter(l => l.sessions?.some(s => s.date === dayStr));
      const hasMultiple = matchingLectures.length > 1;

      cell.className = `cal-day-cell ${matchingLectures.length > 0 ? 'has-classes' : ''} ${hasMultiple ? 'has-multiple' : ''}`;

      const maxDots = 3;
      const visibleDots = matchingLectures.slice(0, maxDots);
      const extraCount = matchingLectures.length - maxDots;

      cell.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: baseline;">
          <span style="font-weight: 600;">${day}</span>
          ${hasMultiple ? `<span style="font-size: 0.65rem; color: var(--gold-antique); font-family: var(--font-mono); font-weight: 700;">(${matchingLectures.length})</span>` : ''}
        </div>
        <div class="cal-dots">
          ${visibleDots.map(l => `<span class="cal-dot" style="background: ${this.getSubjectColor(l.subject)};" title="${l.subject}: ${l.title}"></span>`).join('')}
          ${extraCount > 0 ? `<span style="font-size: 0.62rem; color: var(--gold-antique); font-family: var(--font-mono); font-weight: 700;">+${extraCount}</span>` : ''}
        </div>
      `;

      cell.addEventListener('click', () => {
        this.calDaysGrid.querySelectorAll('.cal-day-cell').forEach(c => c.classList.remove('active-day'));
        cell.classList.add('active-day');
        this.showCalendarDaySchedule(dayStr, matchingLectures);
      });

      this.calDaysGrid.appendChild(cell);
    }
  }

  showCalendarDaySchedule(dayStr, matchingLectures) {
    if (!this.calSelectedDaySchedule) return;
    if (matchingLectures.length === 0) {
      this.calSelectedDaySchedule.innerHTML = `
        <div style="font-size: 0.85rem; color: var(--parchment-muted); text-align: center; padding: 14px;">
          На дату <strong>${dayStr}</strong> учебных занятий в архиве не зафиксировано.
        </div>
      `;
      return;
    }

    this.calSelectedDaySchedule.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 8px;">
        <div style="font-weight: 700; color: var(--gold-antique); font-size: 0.95rem;">
          📅 Занятия на ${dayStr}
        </div>
        <span style="font-family: var(--font-mono); font-size: 0.76rem; color: var(--parchment-muted); background: rgba(255, 255, 255, 0.05); padding: 3px 8px; border-radius: 4px;">
          Всего материалов: ${matchingLectures.length}
        </span>
      </div>
      <div style="display: flex; flex-direction: column; gap: 10px; max-height: 280px; overflow-y: auto;">
        ${matchingLectures.map((l, idx) => {
          const hasPdf = l.originals && l.originals.length > 0;
          const subjColor = this.getSubjectColor(l.subject);
          const sessionInfo = l.sessions?.find(s => s.date === dayStr);
          const pairNum = sessionInfo?.number ? `Пара №${sessionInfo.number}` : `Занятие ${idx + 1}`;

          return `
            <div style="background: var(--bg-surface); border: 1px solid var(--border-subtle); border-left: 3px solid ${subjColor}; border-radius: var(--radius-sm); padding: 10px 14px; display: flex; justify-content: space-between; align-items: center; gap: 12px;">
              <div style="overflow: hidden; flex: 1;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 3px;">
                  <span style="font-family: var(--font-serif); font-size: 0.78rem; text-transform: uppercase; color: ${subjColor}; font-weight: 700;">
                    ● ${l.subject}
                  </span>
                  <span style="font-family: var(--font-mono); font-size: 0.7rem; color: var(--gold-dim); background: rgba(212, 175, 55, 0.08); padding: 1px 6px; border-radius: 3px;">
                    ${pairNum}
                  </span>
                  <span style="font-size: 0.7rem; color: var(--parchment-muted);">
                    ${l.category || 'Лекция'}
                  </span>
                </div>
                <div style="font-weight: 600; color: var(--ivory-parchment); font-size: 0.88rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                  ${l.title}
                </div>
              </div>
              <div style="display: flex; gap: 6px; flex-shrink: 0;">
                <button class="btn-secondary js-open-from-cal" data-id="${l.id}" data-mode="html" style="padding: 5px 9px; font-size: 0.75rem;">
                  📝 Конспект
                </button>
                ${hasPdf ? `
                  <button class="pdf-quick-badge js-open-from-cal" data-id="${l.id}" data-mode="pdf" style="padding: 5px 9px; font-size: 0.75rem;" title="${l.originals.length > 1 ? `Материал содержит ${l.originals.length} PDF от лекторов` : 'Открыть PDF'}">
                    📄 ${l.originals.length > 1 ? `PDF (${l.originals.length})` : 'PDF'}
                  </button>
                  <button class="btn-secondary js-open-from-cal" data-id="${l.id}" data-mode="split" style="padding: 5px 8px; font-size: 0.75rem;" title="Сплит-ридер">
                    ⚖️
                  </button>
                ` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    this.calSelectedDaySchedule.querySelectorAll('.js-open-from-cal').forEach(b => {
      b.addEventListener('click', () => {
        this.calendarModal.classList.remove('open');
        this.openLecture(b.dataset.id, { mode: b.dataset.mode || 'html' });
      });
    });
  }

  async indexLecturesAsync() {
    this.searchEngine.buildIndex(this.metadata);

    if (!this.metadata || !this.metadata.lectures || !this.cryptoKey) return;

    // Фоновая тихая индексация полного текста конспектов (Zero-CDN, локально в памяти)
    const scheduleIdle = window.requestIdleCallback || ((cb) => setTimeout(cb, 200));

    scheduleIdle(async () => {
      for (const lec of this.metadata.lectures) {
        if (!lec.files || lec.files.length === 0) continue;
        const htmlFile = lec.files.find(f => f.type === 'html' && f.blob);
        if (!htmlFile) continue;

        try {
          let htmlText = '';
          if (this.blobCache.has(htmlFile.blob)) {
            const cached = this.blobCache.get(htmlFile.blob);
            htmlText = (cached instanceof Uint8Array) ? new TextDecoder().decode(cached) : String(cached);
          } else {
            const resp = await fetch(`blobs/${htmlFile.blob}.bin`);
            if (!resp.ok) continue;
            const buf = await resp.arrayBuffer();
            const dec = await VaultCrypto.decryptBlob(buf, this.cryptoKey);
            htmlText = new TextDecoder().decode(dec);
            this.blobCache.set(htmlFile.blob, dec);
          }
          if (htmlText) {
            this.searchEngine.updateLectureContent(lec.id, htmlText);
          }
        } catch (e) {
          // фоновая индексация выполняется тихо в фоне
        }
      }
    });
  }

  getSubjectColor(subjectName) {
    const subj = (this.metadata?.subjects || []).find(s => s.name === subjectName);
    return subj?.color || 'var(--gold-antique)';
  }

  parseDate(str) {
    if (!str) return 0;
    const parts = str.split('.');
    if (parts.length === 3) {
      return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`).getTime();
    }
    return 0;
  }

  initThemes() {
    const saved = localStorage.getItem('fpm_theme') || 'baroque';
    this.applyTheme(saved);
    if (this.themeSelector) {
      this.themeSelector.value = saved;
      this.themeSelector.addEventListener('change', (e) => {
        this.applyTheme(e.target.value);
        localStorage.setItem('fpm_theme', e.target.value);
      });
    }
  }

  applyTheme(theme) {
    if (theme === 'baroque') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }

  registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(err => {
        console.warn('SW registration skipped:', err);
      });
    }
  }

  handleHashChange() {
    if (this.isProgrammaticHashChange) return;

    const hash = window.location.hash.slice(1);
    if (hash.startsWith('lecture-')) {
      const payload = hash.replace('lecture-', '');
      let [id, mode] = payload.split(':');
      mode = mode || 'html';

      if (this.currentLecture?.id === id && this.currentReaderMode === mode) {
        return;
      }
      this.openLecture(id, { mode });
    } else if (!hash && this.readerModal?.classList.contains('open')) {
      this.closeReader(false);
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
