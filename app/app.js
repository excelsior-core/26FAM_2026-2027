/**
 * app/app.js - Высокобюджетное ядро «“КОНСПЕКТЫ” ФПМ»
 * Единый гармонический волновой арт для всех предметов под их цвет,
 * интерактивные табы предметов, календарь, доска дедлайнов и скрытая админка
 */

import { VaultCrypto } from './crypto.js';
import { SearchEngine } from './search.js';
import { AdminManager } from './admin.js';

class App {
  constructor() {
    this.metadata = null;
    this.cryptoKey = null;
    this.isAdmin = false;
    this.blobCache = new Map();
    this.searchEngine = new SearchEngine();
    this.adminManager = null;

    const savedStudied = localStorage.getItem('fpm_studied');
    this.studiedSet = new Set(savedStudied ? JSON.parse(savedStudied) : []);

    this.lastVisit = localStorage.getItem('fpm_last_visit') || new Date(0).toISOString();
    this.currentLecture = null;

    // Календарь: 2026-2027 учебный год (сентябрь 2026)
    this.calCurrentDate = new Date(2026, 8, 1);

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
    this.adminIndicator = document.getElementById('admin-indicator');
    this.themeSelector = document.getElementById('theme-selector');
    this.logoutBtn = document.getElementById('logout-btn');

    this.lecturesContainer = document.getElementById('lectures-container');
    this.subjectsTabsContainer = document.getElementById('subjects-tabs-container');
    this.newLecturesSection = document.getElementById('new-lectures-section');
    this.newLecturesGrid = document.getElementById('new-lectures-grid');

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

    this.announcementsOpenBtn = document.getElementById('announcements-open-btn');
    this.announcementsCountBadge = document.getElementById('announcements-count-badge');
    this.calendarOpenBtn = document.getElementById('calendar-open-btn');
    this.paletteOpenBtn = document.getElementById('palette-open-btn');

    // Календарь
    this.calendarModal = document.getElementById('calendar-modal');
    this.calCloseBtn = document.getElementById('cal-close-btn');
    this.calPrevMonth = document.getElementById('cal-prev-month');
    this.calNextMonth = document.getElementById('cal-next-month');
    this.calCurrentMonthLabel = document.getElementById('cal-current-month-label');
    this.calendarDaysContainer = document.getElementById('calendar-days-container');
    this.calendarDayDetails = document.getElementById('calendar-day-details');
    this.calSelectedDateTitle = document.getElementById('cal-selected-date-title');
    this.calSelectedDateList = document.getElementById('cal-selected-date-list');

    // Объявления
    this.announcementsModal = document.getElementById('announcements-modal');
    this.annCloseBtn = document.getElementById('ann-close-btn');
    this.announcementsListContainer = document.getElementById('announcements-list-container');
    this.annAdminAddBtn = document.getElementById('ann-admin-add-btn');

    this.adminAnnModal = document.getElementById('admin-announcement-modal');
    this.adminAnnForm = document.getElementById('admin-ann-form');
    this.adminAnnCancel = document.getElementById('admin-ann-cancel');
    this.adminAnnType = document.getElementById('admin-ann-type');
    this.adminAnnDatetimeGroup = document.getElementById('admin-ann-datetime-group');

    // Ридер
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

    // Палитра
    this.paletteModal = document.getElementById('palette-modal');
    this.paletteInput = document.getElementById('palette-search-input');
    this.paletteResults = document.getElementById('palette-results-list');
  }

  initThemes() {
    const savedTheme = localStorage.getItem('fpm_theme') || 'dark';
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
    this.authPassword.addEventListener('keyup', (e) => {
      if (e.getModifierState && e.getModifierState('CapsLock')) {
        this.capsWarning.classList.add('visible');
      } else {
        this.capsWarning.classList.remove('visible');
      }
    });

    this.authForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleLogin(this.authPassword.value.trim());
    });

    this.logoutBtn.addEventListener('click', () => this.handleLogout());

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
      this.filterModule.value = '';
      this.filterStudiedToggle.classList.remove('active');
      this.renderSubjectsTabs();
      this.renderLectures();
    });

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

    this.annAdminAddBtn.addEventListener('click', () => this.openAdminAnnModal());
    this.adminAnnCancel.addEventListener('click', () => this.adminAnnModal.classList.remove('open'));
    this.adminAnnType.addEventListener('change', (e) => {
      this.adminAnnDatetimeGroup.style.display = e.target.value === 'deadline' ? 'flex' : 'none';
    });
    this.adminAnnForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSaveAnnouncement();
    });

    document.querySelectorAll('[data-toggle]').forEach(el => {
      el.addEventListener('click', () => {
        el.parentElement.classList.toggle('collapsed');
      });
    });

    this.readerCloseBtn.addEventListener('click', () => this.closeReaderModal());
    this.splitToggleBtn.addEventListener('click', () => this.toggleSplitView());
    this.readerNewTabBtn.addEventListener('click', () => {
      if (this.currentActiveNoteUrl) window.open(this.currentActiveNoteUrl, '_blank');
    });
    this.readerPrintBtn.addEventListener('click', () => {
      if (this.readerIframe && this.readerIframe.contentWindow) this.readerIframe.contentWindow.print();
    });

    this.paletteOpenBtn.addEventListener('click', () => this.openPalette());
    this.paletteModal.addEventListener('click', (e) => {
      if (e.target === this.paletteModal) this.closePalette();
    });
    this.paletteInput.addEventListener('input', (e) => this.handlePaletteSearch(e.target.value));

    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        this.openPalette();
      } else if (e.key === 'Escape') {
        this.closeReaderModal();
        this.closePalette();
        this.calendarModal.classList.remove('open');
        this.announcementsModal.classList.remove('open');
        this.adminAnnModal.classList.remove('open');
      } else if (!this.readerModal.classList.contains('open') && !this.paletteModal.classList.contains('open') && !this.calendarModal.classList.contains('open')) {
        if (e.key === 't' || e.key === 'е') {
          const themes = ['dark', 'paper', 'sepia', 'midnight'];
          const cur = document.documentElement.getAttribute('data-theme') || 'dark';
          const next = themes[(themes.indexOf(cur) + 1) % themes.length];
          this.setTheme(next);
          this.themeSelector.value = next;
        } else if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
          e.preventDefault();
          this.openPalette();
        }
      }
    });

    window.addEventListener('hashchange', () => this.handleHashChange());

    const discBtn = document.getElementById('footer-disclaimer-toggle');
    const discBox = document.getElementById('footer-disclaimer-box');
    if (discBtn && discBox) {
      discBtn.addEventListener('click', () => {
        discBox.style.display = discBox.style.display === 'none' ? 'block' : 'none';
      });
    }

    const aiClose = document.getElementById('ai-banner-close');
    if (aiClose) {
      aiClose.addEventListener('click', () => {
        document.getElementById('ai-banner').style.display = 'none';
      });
    }
  }

  async checkAutoLogin() {
    const storedKey = sessionStorage.getItem('fpm_key') || localStorage.getItem('fpm_key');
    if (!storedKey) return;

    try {
      this.cryptoKey = await VaultCrypto.importKeyRaw(storedKey);

      // Математически строгая верификация роли админа:
      // Пытаемся расшифровать admin.bin текущим ключом.
      // Студенческий ключ (fpm2026) никогда не сможет расшифровать admin.bin!
      let adminUnlocked = false;
      try {
        const adminResp = await fetch('admin.bin');
        if (adminResp.ok) {
          const adminBuf = await adminResp.arrayBuffer();
          const dec = await VaultCrypto.decryptBlob(adminBuf, this.cryptoKey);
          this.metadata = JSON.parse(new TextDecoder().decode(dec));
          adminUnlocked = true;
        }
      } catch (errAdminTest) {
        adminUnlocked = false;
      }

      this.isAdmin = adminUnlocked;

      if (!this.isAdmin) {
        await this.loadMetadata();
      }

      this.unlockApp();
    } catch (e) {
      console.warn('Auto-login failed:', e);
      this.handleLogout();
    }
  }

  async handleLogin(password) {
    this.authError.classList.remove('visible');
    this.authSubmit.disabled = true;
    this.authSubmit.textContent = 'Расшифровка...';

    try {
      // 1. Проверяем студенческий пароль (metadata.bin)
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
        } catch (errShared) {}
      }

      // 2. Проверяем админ-пароль (admin.bin)
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
        } catch (errAdmin) {}
      }

      throw new Error('Неверный пароль');
    } catch (e) {
      this.authError.classList.add('visible');
    } finally {
      this.authSubmit.disabled = false;
      this.authSubmit.textContent = 'Войти в архив';
    }
  }

  async completeLoginSuccess(password, sampleBlobBuffer) {
    const bytes = new Uint8Array(sampleBlobBuffer);
    const salt = bytes.slice(6, 22);

    if (this.isAdmin && this.metadata && this.metadata.sharedKeyHex) {
      const hex = this.metadata.sharedKeyHex;
      const raw = new Uint8Array(hex.length / 2);
      for (let i = 0; i < hex.length; i += 2) {
        raw[i / 2] = parseInt(hex.substr(i, 2), 16);
      }
      this.cryptoKey = await crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, true, ['encrypt', 'decrypt']);
    } else {
      this.cryptoKey = await VaultCrypto.deriveKey(password, salt);
    }

    // Полный сброс обоих хранилищ во избежание залипания сессий
    localStorage.removeItem('fpm_key');
    localStorage.removeItem('fpm_is_admin');
    sessionStorage.removeItem('fpm_key');
    sessionStorage.removeItem('fpm_is_admin');

    const rawKeyB64 = await VaultCrypto.exportKeyRaw(this.cryptoKey);
    const targetStorage = this.authRemember.checked ? localStorage : sessionStorage;
    targetStorage.setItem('fpm_key', rawKeyB64);
    targetStorage.setItem('fpm_is_admin', this.isAdmin ? 'true' : 'false');

    this.unlockApp();
  }

  async loadMetadata() {
    const filename = this.isAdmin ? 'admin.bin' : 'metadata.bin';
    const resp = await fetch(filename);
    if (!resp.ok) throw new Error('Не найден файл метаданных');
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
    this.authView.style.display = 'none';
    this.mainView.style.display = 'block';

    // Жесткое управление видимостью админ-кнопок
    if (this.isAdmin) {
      this.adminToolbar.classList.add('active');
      this.adminIndicator.classList.add('active');
      this.annAdminAddBtn.classList.add('active');
      this.adminToolbar.style.setProperty('display', 'block', 'important');
      this.adminIndicator.style.setProperty('display', 'inline-block', 'important');
      this.annAdminAddBtn.style.setProperty('display', 'inline-flex', 'important');
      this.initAdmin();
    } else {
      this.adminToolbar.classList.remove('active');
      this.adminIndicator.classList.remove('active');
      this.annAdminAddBtn.classList.remove('active');
      this.adminToolbar.style.setProperty('display', 'none', 'important');
      this.adminIndicator.style.setProperty('display', 'none', 'important');
      this.annAdminAddBtn.style.setProperty('display', 'none', 'important');
    }

    this.populateFilterDropdowns();
    this.renderSubjectsTabs();
    this.renderNewLectures();
    this.renderLectures();
    this.updateHeroStats();
    this.updateAnnouncementsBadge();

    this.indexLecturesAsync();
    this.handleHashChange();
    localStorage.setItem('fpm_last_visit', new Date().toISOString());
  }

  handleLogout() {
    localStorage.removeItem('fpm_key');
    localStorage.removeItem('fpm_is_admin');
    sessionStorage.clear();
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
      this.renderSubjectsTabs();
      this.renderLectures();
      this.updateHeroStats();
      this.updateAnnouncementsBadge();
      this.renderAnnouncements();
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

    document.getElementById('admin-new-announcement-btn').addEventListener('click', () => {
      this.openAdminAnnModal();
    });

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
    this.filterModule.innerHTML = '<option value="">Все модули</option>';
    for (const mod of this.metadata.modules || []) {
      const opt = document.createElement('option');
      opt.value = mod;
      opt.textContent = mod;
      this.filterModule.appendChild(opt);
    }
  }

  renderSubjectsTabs() {
    this.subjectsTabsContainer.innerHTML = '';
    const lectures = (this.metadata.lectures || []).filter(l => !l.hidden || this.isAdmin);
    const totalCount = lectures.length;

    // Таб "Все материалы"
    const allTab = document.createElement('button');
    allTab.className = `subject-tab-pill ${!this.filters.subject ? 'active' : ''}`;
    allTab.innerHTML = `<span>ВСЕ МАТЕРИАЛЫ</span><span style="opacity: 0.7;">(${totalCount})</span>`;
    allTab.addEventListener('click', () => {
      this.filters.subject = '';
      this.renderSubjectsTabs();
      this.renderLectures();
    });
    this.subjectsTabsContainer.appendChild(allTab);

    // Табы предметов
    for (const subj of this.metadata.subjects || []) {
      const count = lectures.filter(l => l.subject === subj.name).length;
      const tab = document.createElement('button');
      tab.className = `subject-tab-pill ${this.filters.subject === subj.name ? 'active' : ''}`;
      tab.innerHTML = `
        <span style="color: ${subj.color || 'var(--accent-color)'}; font-size: 0.9rem;">●</span>
        <span>${subj.name}</span>
        <span style="opacity: 0.7;">(${count})</span>
      `;

      tab.addEventListener('click', () => {
        this.filters.subject = this.filters.subject === subj.name ? '' : subj.name;
        this.renderSubjectsTabs();
        this.renderLectures();
      });

      this.subjectsTabsContainer.appendChild(tab);
    }
  }

  updateHeroStats() {
    const list = (this.metadata.lectures || []).filter(l => !l.hidden || this.isAdmin);
    const total = list.length;
    let studiedCount = 0;
    for (const l of list) {
      if (this.studiedSet.has(l.id)) studiedCount++;
    }

    const percent = total > 0 ? Math.round((studiedCount / total) * 100) : 0;
    this.statTotalLectures.textContent = total;
    this.statStudiedPercent.textContent = `${percent}%`;
    this.statStudiedRatio.textContent = `${studiedCount} из ${total}`;
    this.statProgressBar.style.width = `${percent}%`;

    const activeDeadlines = (this.metadata.announcements || []).filter(a => {
      if (a.type !== 'deadline' || !a.datetime) return false;
      return new Date(a.datetime).getTime() > Date.now();
    }).length;
    this.statActiveDeadlines.textContent = activeDeadlines;
  }

  updateAnnouncementsBadge() {
    const announcements = this.metadata.announcements || [];
    const urgentCount = announcements.filter(a => a.urgent || (a.type === 'deadline' && new Date(a.datetime) > new Date())).length;
    if (urgentCount > 0) {
      this.announcementsCountBadge.style.display = 'inline-block';
      this.announcementsCountBadge.textContent = urgentCount;
    } else {
      this.announcementsCountBadge.style.display = 'none';
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
        item.className = 'subject-tab-pill active';
        item.innerHTML = `<span>${lec.title}</span><span style="opacity: 0.7;">${lec.subject}</span>`;
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

    if (this.filters.subject) list = list.filter(l => l.subject === this.filters.subject);
    if (this.filters.module) list = list.filter(l => l.module === this.filters.module);
    if (this.filters.tag) list = list.filter(l => (l.tags || []).includes(this.filters.tag));
    if (this.filters.studiedOnly) list = list.filter(l => !this.studiedSet.has(l.id));

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
        <div style="grid-column: 1 / -1; text-align: center; padding: 70px 20px; color: var(--text-muted); background: var(--bg-card); border-radius: var(--radius-md); border: 1px dashed var(--border-subtle);">
          Ничего не найдено — возможно, папка лекции ещё не добавлена в Storage.
        </div>
      `;
      return;
    }

    for (let i = 0; i < list.length; i++) {
      const card = this.createLectureCard(list[i], i);
      this.lecturesContainer.appendChild(card);
    }

    this.updateHeroStats();
  }

  /**
   * Истинный кинематографичный генератор волновых линий (как у матана)
   * Гармонические синусоиды, варьирующиеся по частоте и фазе, под цвет каждого предмета
   */
  generateHarmonicWaveSvg(color = '#D65A42', seed = 0) {
    const s = seed % 6;
    let wave1, wave2, wave3, dots;

    if (s === 0) {
      wave1 = 'M0,80 Q50,20 100,80 T200,80 T300,80 T400,80';
      wave2 = 'M0,90 Q60,140 120,90 T240,90 T360,90 T400,90';
      wave3 = 'M0,70 Q40,35 80,70 T160,70 T240,70 T320,70 T400,70';
      dots = `<circle cx="100" cy="80" r="4.5" fill="${color}" stroke="#FFFFFF" stroke-width="1.8"/>
              <circle cx="200" cy="80" r="4.5" fill="${color}" stroke="#FFFFFF" stroke-width="1.8"/>
              <circle cx="300" cy="80" r="4.5" fill="${color}" stroke="#FFFFFF" stroke-width="1.8"/>`;
    } else if (s === 1) {
      wave1 = 'M0,75 Q60,135 120,75 T240,75 T360,75 T400,75';
      wave2 = 'M0,85 Q45,25 90,85 T180,85 T270,85 T360,85 T400,85';
      wave3 = 'M0,95 Q70,145 140,95 T280,95 T400,95';
      dots = `<circle cx="120" cy="75" r="4.5" fill="${color}" stroke="#FFFFFF" stroke-width="1.8"/>
              <circle cx="240" cy="75" r="4.5" fill="${color}" stroke="#FFFFFF" stroke-width="1.8"/>
              <circle cx="360" cy="75" r="4.5" fill="${color}" stroke="#FFFFFF" stroke-width="1.8"/>`;
    } else if (s === 2) {
      wave1 = 'M0,80 Q40,15 80,80 T160,80 T240,80 T320,80 T400,80';
      wave2 = 'M0,95 Q55,145 110,95 T220,95 T330,95 T400,95';
      wave3 = 'M0,65 Q80,25 160,75 T320,75 T400,75';
      dots = `<circle cx="80" cy="80" r="4.5" fill="${color}" stroke="#FFFFFF" stroke-width="1.8"/>
              <circle cx="160" cy="80" r="4.5" fill="${color}" stroke="#FFFFFF" stroke-width="1.8"/>
              <circle cx="240" cy="80" r="4.5" fill="${color}" stroke="#FFFFFF" stroke-width="1.8"/>
              <circle cx="320" cy="80" r="4.5" fill="${color}" stroke="#FFFFFF" stroke-width="1.8"/>`;
    } else if (s === 3) {
      wave1 = 'M0,85 Q75,25 150,85 T300,85 T400,85';
      wave2 = 'M0,75 Q50,135 100,75 T200,75 T300,75 T400,75';
      wave3 = 'M0,90 Q35,40 70,90 T140,90 T210,90 T280,90 T350,90 T400,90';
      dots = `<circle cx="150" cy="85" r="4.5" fill="${color}" stroke="#FFFFFF" stroke-width="1.8"/>
              <circle cx="300" cy="85" r="4.5" fill="${color}" stroke="#FFFFFF" stroke-width="1.8"/>`;
    } else if (s === 4) {
      wave1 = 'M0,70 Q55,130 110,70 T220,70 T330,70 T400,70';
      wave2 = 'M0,90 Q40,30 80,90 T160,90 T240,90 T320,90 T400,90';
      wave3 = 'M0,80 Q70,20 140,80 T280,80 T400,80';
      dots = `<circle cx="110" cy="70" r="4.5" fill="${color}" stroke="#FFFFFF" stroke-width="1.8"/>
              <circle cx="220" cy="70" r="4.5" fill="${color}" stroke="#FFFFFF" stroke-width="1.8"/>
              <circle cx="330" cy="70" r="4.5" fill="${color}" stroke="#FFFFFF" stroke-width="1.8"/>`;
    } else {
      wave1 = 'M0,80 Q45,20 90,80 T180,80 T270,80 T360,80 T400,80';
      wave2 = 'M0,85 Q70,145 140,85 T280,85 T400,85';
      wave3 = 'M0,75 Q60,35 120,75 T240,75 T360,75 T400,75';
      dots = `<circle cx="90" cy="80" r="4.5" fill="${color}" stroke="#FFFFFF" stroke-width="1.8"/>
              <circle cx="180" cy="80" r="4.5" fill="${color}" stroke="#FFFFFF" stroke-width="1.8"/>
              <circle cx="270" cy="80" r="4.5" fill="${color}" stroke="#FFFFFF" stroke-width="1.8"/>
              <circle cx="360" cy="80" r="4.5" fill="${color}" stroke="#FFFFFF" stroke-width="1.8"/>`;
    }

    return `
      <svg viewBox="0 0 400 160" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="waveGlow_${seed}" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="${color}" stop-opacity="0.95"/>
            <stop offset="50%" stop-color="#FFFFFF" stop-opacity="0.85"/>
            <stop offset="100%" stop-color="${color}" stop-opacity="0.35"/>
          </linearGradient>
          <radialGradient id="radialGlow_${seed}" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stop-color="${color}" stop-opacity="0.25"/>
            <stop offset="100%" stop-color="transparent" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="#08070A"/>
        <circle cx="200" cy="80" r="140" fill="url(#radialGlow_${seed})"/>
        
        <!-- Академическая координатная сетка -->
        <g stroke="rgba(255,255,255,0.06)" stroke-width="0.8">
          <line x1="0" y1="80" x2="400" y2="80"/>
          <line x1="0" y1="40" x2="400" y2="40"/>
          <line x1="0" y1="120" x2="400" y2="120"/>
          <line x1="100" y1="0" x2="100" y2="160"/>
          <line x1="200" y1="0" x2="200" y2="160"/>
          <line x1="300" y1="0" x2="300" y2="160"/>
        </g>

        <!-- Волновые гармоники под цвет предмета -->
        <path d="${wave1}" fill="none" stroke="url(#waveGlow_${seed})" stroke-width="2.5"/>
        <path d="${wave2}" fill="none" stroke="${color}" stroke-opacity="0.4" stroke-width="1.6"/>
        <path d="${wave3}" fill="none" stroke="${color}" stroke-opacity="0.45" stroke-width="1.2" stroke-dasharray="4,4"/>
        
        ${dots}
      </svg>
    `;
  }

  createLectureCard(lec, index = 0) {
    const card = document.createElement('div');
    const isStudied = this.studiedSet.has(lec.id);
    card.className = `lecture-card ${isStudied ? 'studied' : ''}`;
    card.id = `card-${lec.id}`;

    const subj = (this.metadata.subjects || []).find(s => s.name === lec.subject);
    const subjColor = subj ? subj.color : 'var(--accent-color)';

    const firstNum = (lec.sessions && lec.sessions[0]?.number) ? String(lec.sessions[0].number).padStart(2, '0') : String(index + 1).padStart(2, '0');
    const sessionsChips = (lec.sessions || []).map(s => `№${s.number} · ${s.date}`).join(' | ');
    const tagsHtml = (lec.tags || []).map(t => `<span class="card-tag" data-tag="${t}">#${t}</span>`).join('');

    card.innerHTML = `
      <div class="card-artwork-frame">
        <div class="card-artwork">
          ${this.generateHarmonicWaveSvg(subjColor, index)}
          <div class="card-subj-floating-pill" style="border-color: ${subjColor};">
            <span class="pill-dot" style="background-color: ${subjColor};"></span>
            <span>${lec.subject}</span>
          </div>
          <div class="card-vintage-index">/${firstNum}</div>
        </div>
      </div>

      <div class="card-content">
        <div class="card-meta-top">
          <span class="card-session-index">${sessionsChips || '1 КУРС · 2026–2027'}</span>
          ${lec.module ? `<span class="card-module-tag">${lec.module}</span>` : ''}
        </div>

        <h3 class="card-lecture-title">${lec.title}</h3>
        <p class="card-lecture-desc">${lec.description || 'Теоретический конспект и доказательства лекции.'}</p>

        <div class="card-tags">${tagsHtml}</div>

        <div class="card-bottom-actions">
          <button class="read-article-link btn-open-note">
            <span>ИЗУЧИТЬ МАТЕРИАЛ</span>
            <span class="arrow-svg">→</span>
          </button>
          
          <div style="display: flex; gap: 8px; align-items: center;">
            ${(lec.originals && lec.originals.length > 0) ? `
              <button class="btn-icon-subtle btn-open-orig" title="Оригинал лектора (${lec.originals.length} файл.)">
                📄 PDF
              </button>
            ` : ''}
            ${this.isAdmin ? `
              <button class="btn-icon-subtle btn-admin-edit" title="Редактировать">
                ✏️
              </button>
            ` : ''}
            <button class="btn-icon-subtle studied-toggle-btn ${isStudied ? 'studied-active' : ''}" title="Отметить изученным">
              ${isStudied ? '✓ Изучено' : '○'}
            </button>
          </div>
        </div>
      </div>
    `;

    card.querySelector('.card-lecture-title').addEventListener('click', () => this.openLecture(lec.id));
    card.querySelector('.btn-open-note').addEventListener('click', () => this.openLecture(lec.id, false));

    const origBtn = card.querySelector('.btn-open-orig');
    if (origBtn) {
      origBtn.addEventListener('click', () => this.openLecture(lec.id, true));
    }

    if (this.isAdmin) {
      const editBtn = card.querySelector('.btn-admin-edit');
      if (editBtn) editBtn.addEventListener('click', () => this.openAdminLectureModal(lec));
    }

    const studiedBtn = card.querySelector('.studied-toggle-btn');
    studiedBtn.addEventListener('click', () => {
      if (this.studiedSet.has(lec.id)) {
        this.studiedSet.delete(lec.id);
        studiedBtn.classList.remove('studied-active');
        studiedBtn.textContent = '○';
        card.classList.remove('studied');
      } else {
        this.studiedSet.add(lec.id);
        studiedBtn.classList.add('studied-active');
        studiedBtn.textContent = '✓ Изучено';
        card.classList.add('studied');
      }
      localStorage.setItem('fpm_studied', JSON.stringify([...this.studiedSet]));
      this.updateHeroStats();
    });

    card.querySelectorAll('.card-tag').forEach(tagEl => {
      tagEl.addEventListener('click', (e) => {
        this.filters.tag = e.target.dataset.tag;
        this.renderLectures();
      });
    });

    return card;
  }

  renderCalendarMonth() {
    const year = this.calCurrentDate.getFullYear();
    const month = this.calCurrentDate.getMonth();

    const monthNames = [
      'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
      'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ];
    this.calCurrentMonthLabel.textContent = `${monthNames[month]} ${year}`;

    this.calendarDaysContainer.innerHTML = '';
    this.calendarDayDetails.style.display = 'none';

    const lecturesByDate = new Map();
    for (const lec of this.metadata.lectures || []) {
      for (const ses of lec.sessions || []) {
        if (ses.date) {
          const list = lecturesByDate.get(ses.date) || [];
          list.push({ lecture: lec, session: ses });
          lecturesByDate.set(ses.date, list);
        }
      }
    }

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const cell = document.createElement('div');
      cell.className = 'calendar-day-cell other-month';
      cell.innerHTML = `<span class="calendar-day-num">${prevMonthLastDay - i}</span>`;
      this.calendarDaysContainer.appendChild(cell);
    }

    for (let day = 1; day <= lastDay.getDate(); day++) {
      const cell = document.createElement('div');
      cell.className = 'calendar-day-cell';

      const dStr = String(day).padStart(2, '0');
      const mStr = String(month + 1).padStart(2, '0');
      const dateKey = `${dStr}.${mStr}.${year}`;

      cell.innerHTML = `<span class="calendar-day-num">${day}</span>`;

      if (lecturesByDate.has(dateKey)) {
        const pairs = lecturesByDate.get(dateKey);
        for (const p of pairs) {
          const subj = (this.metadata.subjects || []).find(s => s.name === p.lecture.subject);
          const color = subj ? subj.color : 'var(--accent-color)';
          const pill = document.createElement('div');
          pill.className = 'calendar-lecture-pill';
          pill.style.backgroundColor = color;
          pill.textContent = `№${p.session.number} ${p.lecture.subject}`;
          cell.appendChild(pill);
        }

        cell.addEventListener('click', () => {
          this.calendarDayDetails.style.display = 'block';
          this.calSelectedDateTitle.textContent = `Лекции за ${dateKey}:`;
          this.calSelectedDateList.innerHTML = '';
          for (const p of pairs) {
            const row = document.createElement('div');
            row.style.cssText = 'display: flex; justify-content: space-between; align-items: center; background: var(--bg-surface); padding: 10px 14px; border-radius: 6px; border: 1px solid var(--border-subtle);';
            row.innerHTML = `
              <span><strong>№${p.session.number} (${p.lecture.subject}):</strong> ${p.lecture.title}</span>
              <button class="action-btn-primary" style="padding: 5px 12px; font-size: 0.78rem;">Открыть</button>
            `;
            row.querySelector('button').addEventListener('click', () => {
              this.calendarModal.classList.remove('open');
              this.openLecture(p.lecture.id);
            });
            this.calSelectedDateList.appendChild(row);
          }
        });
      }

      this.calendarDaysContainer.appendChild(cell);
    }
  }

  renderAnnouncements() {
    this.announcementsListContainer.innerHTML = '';
    const list = this.metadata.announcements || [];

    if (list.length === 0) {
      this.announcementsListContainer.innerHTML = `
        <div style="text-align: center; padding: 40px; color: var(--text-muted);">
          Нет активных дедлайнов или объявлений.
        </div>
      `;
      return;
    }

    for (const ann of list) {
      const card = document.createElement('div');
      card.className = `announcement-card ${ann.urgent ? 'urgent' : ''}`;
      card.id = `ann-card-${ann.id}`;

      const isDeadline = ann.type === 'deadline';

      card.innerHTML = `
        <div class="announcement-header">
          <div>
            <span class="announcement-badge ${isDeadline ? 'badge-deadline' : 'badge-info'}">
              ${isDeadline ? '⏰ ДЕДЛАЙН' : '📢 ОБЪЯВЛЕНИЕ'}
            </span>
            <span style="font-family: var(--font-mono); font-size: 0.78rem; margin-left: 8px; color: var(--secondary-color);">
              [${ann.subject || 'Общее'}]
            </span>
            <h4 style="font-size: 1.15rem; margin-top: 6px;">${ann.title}</h4>
          </div>
          ${this.isAdmin ? `
            <button class="btn-icon-subtle btn-ann-del" style="color: var(--urgent-color);" title="Удалить">✕</button>
          ` : ''}
        </div>

        <p style="font-size: 0.92rem; line-height: 1.55; color: var(--text-main);">${ann.text}</p>

        ${isDeadline && ann.datetime ? `
          <div class="announcement-countdown" id="countdown-${ann.id}">
            <!-- Заполняется таймером -->
          </div>
        ` : ''}
      `;

      if (this.isAdmin) {
        card.querySelector('.btn-ann-del').addEventListener('click', () => {
          this.adminManager.deleteAnnouncement(ann.id);
        });
      }

      this.announcementsListContainer.appendChild(card);
    }

    this.updateDeadlineCountdowns();
  }

  updateDeadlineCountdowns() {
    if (!this.metadata) return;
    const announcements = this.metadata.announcements || [];

    for (const ann of announcements) {
      if (ann.type === 'deadline' && ann.datetime) {
        const wrap = document.getElementById(`countdown-${ann.id}`);
        if (!wrap) continue;

        const target = new Date(ann.datetime).getTime();
        const diff = target - Date.now();

        if (diff <= 0) {
          wrap.innerHTML = `<span style="color: var(--urgent-color); font-weight: bold; font-family: var(--font-mono); font-size: 0.9rem;">● ДЕДЛАЙН ИСТЁК</span>`;
        } else {
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
          const minutes = Math.floor((diff / (1000 * 60)) % 60);
          const seconds = Math.floor((diff / 1000) % 60);

          wrap.innerHTML = `
            <div class="countdown-unit">
              <span class="countdown-digits">${days}</span>
              <span class="countdown-label">Дней</span>
            </div>
            <div class="countdown-unit">
              <span class="countdown-digits">${String(hours).padStart(2, '0')}</span>
              <span class="countdown-label">Часов</span>
            </div>
            <div class="countdown-unit">
              <span class="countdown-digits">${String(minutes).padStart(2, '0')}</span>
              <span class="countdown-label">Минут</span>
            </div>
            <div class="countdown-unit">
              <span class="countdown-digits">${String(seconds).padStart(2, '0')}</span>
              <span class="countdown-label">Секунд</span>
            </div>
          `;
        }
      }
    }
  }

  openAdminAnnModal() {
    const subjSelect = document.getElementById('admin-ann-subject');
    subjSelect.innerHTML = '<option value="Общее">Общее</option>';
    for (const s of this.metadata.subjects || []) {
      const opt = document.createElement('option');
      opt.value = s.name;
      opt.textContent = s.name;
      subjSelect.appendChild(opt);
    }
    this.adminAnnModal.classList.add('open');
  }

  handleSaveAnnouncement() {
    const type = document.getElementById('admin-ann-type').value;
    const title = document.getElementById('admin-ann-title').value;
    const subject = document.getElementById('admin-ann-subject').value;
    const datetime = document.getElementById('admin-ann-datetime').value;
    const text = document.getElementById('admin-ann-text').value;
    const urgent = document.getElementById('admin-ann-urgent').checked;

    this.adminManager.saveAnnouncement({ type, title, subject, datetime, text, urgent });
    this.adminAnnModal.classList.remove('open');
    this.adminAnnForm.reset();
  }

  async openLecture(id, openWithOriginal = false) {
    const lec = (this.metadata.lectures || []).find(l => l.id === id);
    if (!lec) return;

    this.currentLecture = lec;
    this.readerTitle.textContent = `${lec.subject}: ${lec.title}`;
    this.readerModal.classList.add('open');
    window.location.hash = `#/lecture/${id}`;

    const noteFile = (lec.files || []).find(f => f.type === 'html');
    if (noteFile && noteFile.blob) {
      const blobUrl = await this.getDecryptedBlobUrl(noteFile.blob, 'text/html');
      this.currentActiveNoteUrl = blobUrl;
      this.readerIframe.src = blobUrl;

      this.noteDownloadsSpan.innerHTML = `
        <a href="${blobUrl}" download="${this.sanitizeFileName(lec.title)} — ${noteFile.name}" class="btn-secondary" style="padding: 2px 8px; font-size: 0.72rem;">
          ↓ Скачать HTML
        </a>
      `;
    } else {
      this.readerIframe.srcdoc = '<p style="padding: 24px; font-family: sans-serif;">Конспект отсутствует.</p>';
      this.noteDownloadsSpan.innerHTML = '';
    }

    const origFile = (lec.originals || [])[0];
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    if (origFile && origFile.blob) {
      const mime = origFile.type === 'pdf' ? 'application/pdf' : 'image/jpeg';
      const origBlobUrl = await this.getDecryptedBlobUrl(origFile.blob, mime);

      if (isIOS && origFile.type === 'pdf') {
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
      this.paletteResults.innerHTML = `
        <div class="palette-item" data-action="theme">
          <div class="palette-item-title">🎨 Сменить тему оформления</div>
        </div>
        <div class="palette-item" data-action="calendar">
          <div class="palette-item-title">📅 Открыть календарь пар</div>
        </div>
        <div class="palette-item" data-action="deadlines">
          <div class="palette-item-title">⏰ Посмотреть дедлайны и объявления</div>
        </div>
        <div class="palette-item" data-action="reset">
          <div class="palette-item-title">🔄 Сбросить все фильтры</div>
        </div>
      `;
      this.paletteResults.querySelectorAll('.palette-item').forEach(item => {
        item.addEventListener('click', () => {
          const action = item.dataset.action;
          if (action === 'theme') {
            const themes = ['dark', 'paper', 'sepia', 'midnight'];
            const cur = document.documentElement.getAttribute('data-theme') || 'dark';
            this.setTheme(themes[(themes.indexOf(cur) + 1) % themes.length]);
          } else if (action === 'calendar') {
            this.calendarOpenBtn.click();
          } else if (action === 'deadlines') {
            this.announcementsOpenBtn.click();
          } else if (action === 'reset') {
            this.resetFiltersBtn.click();
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
          } catch (e) {}
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

window.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
