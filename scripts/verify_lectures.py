# -*- coding: utf-8 -*-
import os

def check(path, boards):
    with open(path, 'r', encoding='utf-8') as f:
        c = f.read()
    print('Checking:', os.path.basename(path))
    print(' - Length:', len(c))
    print(' - jsxgraphcore.js:', 'jsxgraphcore.js' in c)
    print(' - createAcademicBoard:', 'window.createAcademicBoard' in c)
    for b in boards:
        print(f' - container id="{b}":', f'id="{b}"' in c)

check('Storage/HSE/Математический Анализ/Лекции/14 19.10.2026 Свойства непрерывных функций на отрезке/МА_14__Лекция_Gemini.html', ['jxg-board-14-1', 'jxg-board-14-2'])
check('Storage/HSE/Математический Анализ/Лекции/15 23.10.2026 Равномерная непрерывность и монотонные функции/МА_15__Лекция_Gemini.html', ['jxg-board-15-1a', 'jxg-board-15-1b', 'jxg-board-15-2a', 'jxg-board-15-2b'])
