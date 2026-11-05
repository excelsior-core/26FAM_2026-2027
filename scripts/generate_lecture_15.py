# -*- coding: utf-8 -*-
"""
Генератор подробнейшего академического конспекта Лекции 15 по Математическому Анализу
Стиль: Караваджо / Dark Academy Luxury (GENESIS)
"""

import os

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
TEMPLATE_PATH = os.path.join(ROOT_DIR, 'GENESIS', 'template-lecture.html')
CONTENT_PATH = os.path.join(ROOT_DIR, 'scripts', 'lec15_content.html')
OUTPUT_DIR = os.path.join(ROOT_DIR, 'Storage', 'HSE', 'Математический Анализ', 'Лекции', '15 23.10.2026 Равномерная непрерывность и монотонные функции')
OUTPUT_FILE = os.path.join(OUTPUT_DIR, 'МА_15__Лекция_Gemini.html')

def main():
    print(f"Reading template from: {TEMPLATE_PATH}")
    with open(TEMPLATE_PATH, 'r', encoding='utf-8') as f:
        template = f.read()

    print(f"Reading content from: {CONTENT_PATH}")
    with open(CONTENT_PATH, 'r', encoding='utf-8') as f:
        content = f.read()

    replacements = {
        'COURSE_NAME': 'Математический Анализ',
        'LECTURE_NUMBER': '15',
        'LECTURE_TITLE': 'Равномерная непрерывность, теорема Кантора и свойства монотонных функций',
        'LECTURE_TITLE_HTML': 'РАВНОМЕРНАЯ НЕПРЕРЫВНОСТЬ И <span class="gold-phrase">НЕПРЕРЫВНОСТЬ МОНОТОННЫХ ФУНКЦИЙ</span>',
        'LECTURE_DATE': '23 октября 2026',
        'LECTURE_SUMMARY_LEAD': 'Исчерпывающий академический трактат о равномерной непрерывности на метрических множествах, великой теореме Кантора о компактах, структуре скачков монотонных функций, критерии непрерывности и обратимости строго монотонных отображений.',
        'CONTENT_PLACEHOLDER': content
    }

    result = template
    for key, val in replacements.items():
        result = result.replace(f"{{{{{key}}}}}", val)

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write(result)

    print(f"Successfully generated Lecture 15: {OUTPUT_FILE}")
    print(f"File size: {len(result)} bytes ({len(result.splitlines())} lines)")

if __name__ == '__main__':
    main()
