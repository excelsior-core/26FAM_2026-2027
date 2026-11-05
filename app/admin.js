/**
 * app/admin.js - Модуль панели администратора «КОНСПЕКТЫ ФПМ»
 * Доступен исключительно при вводе мастер-пароля администратора (дешифрует admin.bin).
 * Скрыт от обычных студентов на математическом и визуальном уровне.
 * Позволяет управлять предметами, модулями, лекциями, дедлайнами и экспортировать site-metadata.json
 */

export class AdminManager {
  constructor(metadata, onSaveCallback) {
    this.metadata = metadata;
    this.onSave = onSaveCallback;
    this.colorsPalette = [
      '#B5341F', '#D4AF37', '#1D4E89', '#2D6A4F',
      '#7209B7', '#C87D20', '#0E7490', '#4338CA',
      '#6A040F', '#374151', '#A23E22', '#5BC3D5'
    ];
  }

  setMetadata(metadata) {
    this.metadata = metadata;
  }

  commitChanges() {
    this.metadata.updatedAt = new Date().toISOString();
    if (this.onSave) {
      this.onSave(this.metadata);
    }
  }

  saveSubject(name, color, description = '', oldName = null) {
    if (!name || !name.trim()) return;
    const cleanName = name.trim();

    if (!this.metadata.subjects) this.metadata.subjects = [];

    if (oldName && oldName !== cleanName) {
      for (const lec of this.metadata.lectures || []) {
        if (lec.subject === oldName) {
          lec.subject = cleanName;
        }
      }
      const existing = this.metadata.subjects.find(s => s.name === oldName);
      if (existing) {
        existing.name = cleanName;
        existing.color = color || this.colorsPalette[0];
        existing.description = description;
      }
    } else {
      let subj = this.metadata.subjects.find(s => s.name === cleanName);
      if (subj) {
        subj.color = color;
        subj.description = description;
      } else {
        this.metadata.subjects.push({
          name: cleanName,
          color: color || this.colorsPalette[this.metadata.subjects.length % this.colorsPalette.length],
          description
        });
      }
    }
    this.commitChanges();
  }

  deleteSubject(name) {
    if (!confirm(`Удалить предмет «${name}»? Исходные файлы на диске останутся нетронутыми.`)) return;
    this.metadata.subjects = (this.metadata.subjects || []).filter(s => s.name !== name);
    this.commitChanges();
  }

  normalizeModules() {
    if (!this.metadata.modules || !Array.isArray(this.metadata.modules) || !this.metadata.modules.length) {
      this.metadata.modules = [
        { name: 'Модуль 1', startDate: '01.09.2026', endDate: '25.10.2026' },
        { name: 'Модуль 2', startDate: '26.10.2026', endDate: '31.12.2026' },
        { name: 'Модуль 3', startDate: '11.01.2027', endDate: '28.03.2027' },
        { name: 'Модуль 4', startDate: '29.03.2027', endDate: '30.06.2027' }
      ];
      return this.metadata.modules;
    }

    const defaultDates = {
      'Модуль 1': { start: '01.09.2026', end: '25.10.2026' },
      'Модуль 2': { start: '26.10.2026', end: '31.12.2026' },
      'Модуль 3': { start: '11.01.2027', end: '28.03.2027' },
      'Модуль 4': { start: '29.03.2027', end: '30.06.2027' }
    };

    this.metadata.modules = this.metadata.modules.map(m => {
      if (typeof m === 'string') {
        const d = defaultDates[m] || { start: '', end: '' };
        return { name: m, startDate: d.start, endDate: d.end };
      }
      return {
        name: m.name || 'Модуль',
        startDate: m.startDate || '',
        endDate: m.endDate || ''
      };
    });

    return this.metadata.modules;
  }

  detectModuleForDate(dateStr) {
    if (!dateStr) return null;
    const modules = this.normalizeModules();
    const parts = String(dateStr).trim().split('.');
    if (parts.length !== 3) return null;
    const time = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10)).getTime();
    if (!time) return null;

    for (const m of modules) {
      if (m.startDate && m.endDate) {
        const sParts = m.startDate.split('.');
        const eParts = m.endDate.split('.');
        if (sParts.length === 3 && eParts.length === 3) {
          const sTime = new Date(parseInt(sParts[2], 10), parseInt(sParts[1], 10) - 1, parseInt(sParts[0], 10)).getTime();
          const eTime = new Date(parseInt(eParts[2], 10), parseInt(eParts[1], 10) - 1, parseInt(eParts[0], 10)).getTime() + 86400000 - 1;
          if (time >= sTime && time <= eTime) {
            return m.name;
          }
        }
      }
    }
    return null;
  }

  saveModulesList(modulesList, autoAssignToLectures = false) {
    this.metadata.modules = modulesList;
    let reassignedCount = 0;
    if (autoAssignToLectures) {
      for (const lec of this.metadata.lectures || []) {
        const dateStr = lec.sessions?.[0]?.date;
        if (dateStr) {
          const detected = this.detectModuleForDate(dateStr);
          if (detected) {
            lec.module = detected;
            reassignedCount++;
          }
        }
      }
    }
    this.commitChanges();
    return reassignedCount;
  }

  saveModule(name, oldName = null, startDate = '', endDate = '') {
    if (!name || !name.trim()) return;
    const cleanName = name.trim();
    const modules = this.normalizeModules();

    if (oldName && oldName !== cleanName) {
      const existing = modules.find(m => m.name === oldName);
      if (existing) {
        existing.name = cleanName;
        if (startDate) existing.startDate = startDate;
        if (endDate) existing.endDate = endDate;
      }
      for (const lec of this.metadata.lectures || []) {
        if (lec.module === oldName) {
          lec.module = cleanName;
        }
      }
    } else {
      const existing = modules.find(m => m.name === cleanName);
      if (existing) {
        if (startDate) existing.startDate = startDate;
        if (endDate) existing.endDate = endDate;
      } else {
        modules.push({ name: cleanName, startDate, endDate });
      }
    }
    this.commitChanges();
  }

  updateLecture(id, updates) {
    const lecture = (this.metadata.lectures || []).find(l => l.id === id);
    if (!lecture) return false;

    if (updates.title !== undefined) lecture.title = updates.title.trim();
    if (updates.description !== undefined) lecture.description = updates.description.trim();
    if (updates.subject !== undefined) lecture.subject = updates.subject;
    if (updates.module !== undefined) lecture.module = updates.module;
    if (updates.hidden !== undefined) lecture.hidden = !!updates.hidden;
    if (updates.tags !== undefined) {
      lecture.tags = Array.isArray(updates.tags)
        ? updates.tags.map(t => String(t).trim().replace(/^#+/, '').toUpperCase()).filter(Boolean)
        : String(updates.tags).split(/[,;\s]+/).map(t => t.trim().replace(/^#+/, '').toUpperCase()).filter(Boolean);
    }
    if (updates.sessions !== undefined) {
      lecture.sessions = updates.sessions;
    }
    lecture.updatedAt = new Date().toISOString();

    this.commitChanges();
    return true;
  }

  saveAnnouncement(data) {
    if (!this.metadata.announcements) this.metadata.announcements = [];
    if (data.id) {
      const idx = this.metadata.announcements.findIndex(a => a.id === data.id);
      if (idx !== -1) {
        this.metadata.announcements[idx] = {
          ...this.metadata.announcements[idx],
          ...data,
          updatedAt: new Date().toISOString()
        };
      }
    } else {
      const newAnn = {
        id: 'ann_' + Date.now().toString(36),
        type: data.type || 'deadline',
        title: data.title || 'Новый дедлайн',
        subject: data.subject || 'Общее',
        datetime: data.datetime || '',
        text: data.text || '',
        urgent: !!data.urgent,
        createdAt: new Date().toISOString()
      };
      this.metadata.announcements.unshift(newAnn);
    }
    this.commitChanges();
  }

  deleteAnnouncement(id) {
    if (!confirm('Удалить эту запись?')) return;
    this.metadata.announcements = (this.metadata.announcements || []).filter(a => a.id !== id);
    this.commitChanges();
  }

  exportMetadataJson() {
    const jsonStr = JSON.stringify(this.metadata, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'site-metadata.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
