# -*- coding: utf-8 -*-
"""
Генератор подробнейшего академического конспекта Лекции 14 по Математическому Анализу
Стиль: Караваджо / Dark Academy Luxury (GENESIS)
"""

import os

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
TEMPLATE_PATH = os.path.join(ROOT_DIR, 'GENESIS', 'template-lecture.html')
CONTENT_PATH = os.path.join(ROOT_DIR, 'scripts', 'lec14_content.html')
OUTPUT_DIR = os.path.join(ROOT_DIR, 'Storage', 'HSE', 'Математический Анализ', 'Лекции', '14 19.10.2026 Свойства непрерывных функций на отрезке')
OUTPUT_FILE = os.path.join(OUTPUT_DIR, 'МА_14__Лекция_Gemini.html')

def main():
    print(f"Reading template from: {TEMPLATE_PATH}")
    with open(TEMPLATE_PATH, 'r', encoding='utf-8') as f:
        template = f.read()

    print(f"Reading content from: {CONTENT_PATH}")
    with open(CONTENT_PATH, 'r', encoding='utf-8') as f:
        content = f.read()

    replacements = {
        'COURSE_NAME': 'Математический Анализ',
        'LECTURE_NUMBER': '14',
        'LECTURE_TITLE': 'Свойства непрерывных функций на отрезке',
        'LECTURE_TITLE_HTML': 'НЕПРЕРЫВНЫЕ ФУНКЦИИ И ИХ <span class="gold-phrase">СВОЙСТВА НА ОТРЕЗКЕ</span>',
        'LECTURE_DATE': '19 октября 2026',
        'LECTURE_SUMMARY_LEAD': 'Фундаментальный академический трактат о локальных свойствах непрерывных отображений, теоремах Больцано–Коши о промежуточных значениях, теоремах Вейерштрасса об ограниченности и экстремумах на компакте, а также принципе связности непрерывного образа отрезка.',
        'CONTENT_PLACEHOLDER': content
    }

    result = template
    for key, val in replacements.items():
        result = result.replace(f"{{{{{key}}}}}", val)

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write(result)

    print(f"Successfully generated Lecture 14: {OUTPUT_FILE}")
    print(f"File size: {len(result)} bytes ({len(result.splitlines())} lines)")

if __name__ == '__main__':
    main()
