# -*- coding: utf-8 -*-
"""
scripts/generate_colloquium.py
Генератор полного академического конспекта по всем 17 билетам коллоквиума по высшей алгебре
(ФПМ ВШЭ, 1 курс, 1 модуль) на основе шаблона GENESIS/template-lecture.html.
"""

import os
import sys

# Добавляем scripts в sys.path для импорта модулей с билетами
sys.path.insert(0, os.path.dirname(__file__))

from tickets_part1 import get_tickets_1_to_6
from tickets_part2 import get_tickets_7_to_12
from tickets_part3 import get_tickets_13_to_17

def build_conspectus():
    template_path = os.path.join("GENESIS", "template-lecture.html")
    with open(template_path, "r", encoding="utf-8") as f:
        template = f.read()

    # 1. Добавляем кнопки управления доказательствами в панель инструментов
    old_dock = """    <button class="dock-btn active" id="dockTocToggleBtn" onclick="toggleSidebarDesk()">
      <span>✦</span> Оглавление
    </button>
    <div class="dock-divider"></div>
    <div class="theme-dock-group">"""
    
    new_dock = """    <button class="dock-btn active" id="dockTocToggleBtn" onclick="toggleSidebarDesk()">
      <span>✦</span> Оглавление
    </button>
    <div class="dock-divider"></div>
    <button class="dock-btn" onclick="toggleAllProofs(false)" title="Свернуть все доказательства для быстрого повторения">
      ◈ Свернуть док-ва
    </button>
    <button class="dock-btn" onclick="toggleAllProofs(true)" title="Развернуть все доказательства">
      ◈ Развернуть все
    </button>
    <div class="dock-divider"></div>
    <div class="theme-dock-group">"""
    
    if old_dock in template:
        template = template.replace(old_dock, new_dock)
    else:
        print("Warning: old_dock marker not matched directly")

    # 2. Добавляем функцию toggleAllProofs в скрипт
    old_script_start = """    document.addEventListener("DOMContentLoaded", function() {"""
    new_script_start = """    window.toggleAllProofs = function(open) {
      document.querySelectorAll("details.proof-block").forEach(function(d) {
        if (open) d.setAttribute("open", "");
        else d.removeAttribute("open");
      });
    };

    document.addEventListener("DOMContentLoaded", function() {"""
    
    if old_script_start in template:
        template = template.replace(old_script_start, new_script_start)

    # 3. Заполняем метаданные шапки
    template = template.replace("{{COURSE_NAME}}", "Алгебра")
    template = template.replace("{{LECTURE_NUMBER}}", "Коллоквиум 1")
    template = template.replace("{{LECTURE_TITLE}}", "Все билеты к коллоквиуму (1-й модуль)")
    template = template.replace(
        "{{LECTURE_TITLE_HTML}}",
        "ВСЕ БИЛЕТЫ К КОЛЛОКВИУМУ <span class=\"gold-phrase\">ПО АЛГЕБРЕ (1-Й МОДУЛЬ)</span>"
    )
    template = template.replace("{{LECTURE_DATE}}", "31 октября 2026")
    template = template.replace(
        "{{LECTURE_SUMMARY_LEAD}}",
        "Полный и исчерпывающий академический трактат по всем 17 билетам программы коллоквиума первого модуля. "
        "Содержит строгие аксиоматические определения, теоремы, полные развернутые доказательства с возможностью мгновенной компактизации, "
        "алгоритмы, разбор типичных экзаменационных ловушек и сводные таблицы инвариантов."
    )

    # 4. Собираем все 17 билетов
    all_tickets = get_tickets_1_to_6() + get_tickets_7_to_12() + get_tickets_13_to_17()
    print(f"Collected {len(all_tickets)} tickets.")

    body_html = "\n".join(all_tickets)

    # 5. Вставляем тело лекций в контент
    placeholder = "<!-- {{CONTENT_PLACEHOLDER}} -->"
    if placeholder in template:
        full_html = template.replace(placeholder, body_html)
    else:
        # Резервная замена по тегу article
        full_html = template.replace(
            '<article class="content-area" id="lectureContent">',
            f'<article class="content-area" id="lectureContent">\n{body_html}'
        )

    # 6. Сохраняем итоговый файл
    target_dir = os.path.join(
        "Storage", "HSE", "Алгебра", "Коллоквиумы",
        "01 31.10.2026 Все билеты к коллоквиуму по алгебре (1-й модуль)"
    )
    os.makedirs(target_dir, exist_ok=True)
    target_file = os.path.join(target_dir, "colloquium-algebra-module-1.html")

    with open(target_file, "w", encoding="utf-8") as f:
        f.write(full_html)

    file_size_kb = os.path.getsize(target_file) / 1024
    print(f"Successfully generated: {target_file} ({file_size_kb:.1f} KB)")
    return target_file

if __name__ == "__main__":
    build_conspectus()
