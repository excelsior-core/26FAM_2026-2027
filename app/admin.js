/**
 * app/admin.js - Модуль панели администратора
 * Доступен при вводе мастер-пароля администратора (дешифрует admin.bin).
 * Позволяет редактировать предметы, модули, лекции и экспортировать site-metadata.json
 */

export class AdminManager {
  constructor(metadata, onSaveCallback) {
    this.metadata = metadata;
    this.onSave = onSaveCallback;
    this.colorsPalette = [
      '#B5341F', '#D9A05B', '#2D6A4F', '#1D4E89',
      '#7209B7', '#D00000', '#3F37C9', '#4895EF',
      '#6A040F', '#007200', '#F77F00', '#4A4E69'
    ];
  }

  /**
   * Обновление ссылки на актуальные метаданные
   */
  setMetadata(metadata) {
    this.metadata = metadata;
  }

  /**
   * Сохранение и вызов коллбэка обновления интерфейса
   */
  commitChanges() {
    this.metadata.updatedAt = new Date().toISOString();
    if (this.onSave) {
      this.onSave(this.metadata);
    }
  }

  /**
   * Добавление/обновление предмета
   */
  saveSubject(name, color, description = '', oldName = null) {
    if (!name || !name.trim()) return;
    const cleanName = name.trim();

    if (!this.metadata.subjects) this.metadata.subjects = [];

    if (oldName && oldName !== cleanName) {
      // Обновляем имя предмета в лекциях
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

  /**
   * Удаление предмета
   */
  deleteSubject(name) {
    if (!confirm(`Удалить предмет «${name}»? Сами файлы лекций останутся на диске.`)) return;
    this.metadata.subjects = (this.metadata.subjects || []).filter(s => s.name !== name);
    this.commitChanges();
  }

  /**
   * Добавление/переименование модуля
   */
  saveModule(name, oldName = null) {
    if (!name || !name.trim()) return;
    const cleanName = name.trim();
    if (!this.metadata.modules) this.metadata.modules = [];

    if (oldName && oldName !== cleanName) {
      const idx = this.metadata.modules.indexOf(oldName);
      if (idx !== -1) {
        this.metadata.modules[idx] = cleanName;
      }
      for (const lec of this.metadata.lectures || []) {
        if (lec.module === oldName) {
          lec.module = cleanName;
        }
      }
    } else if (!this.metadata.modules.includes(cleanName)) {
      this.metadata.modules.push(cleanName);
    }
    this.commitChanges();
  }

  /**
   * Редактирование лекции
   */
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
        ? updates.tags
        : updates.tags.split(',').map(t => t.trim()).filter(Boolean);
    }
    if (updates.sessions !== undefined) {
      lecture.sessions = updates.sessions;
    }
    lecture.updatedAt = new Date().toISOString();

    this.commitChanges();
    return true;
  }

  /**
   * Экспорт site-metadata.json в файл для синхронизации
   */
  exportMetadataJson() {
    const jsonStr = JSON.stringify(this.metadata, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
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
