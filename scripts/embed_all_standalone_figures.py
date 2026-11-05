# -*- coding: utf-8 -*-
"""
Скрипт встраивания всех 7 полноформатных отдельных векторных гравюр (SVG)
в конспекты Лекции 14 и Лекции 15.
Каждая иллюстрация — отдельная, крупная, полноширинная карточка figure-card.
Никакого клиентского JavaScript.
"""

import os
import re

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
FIGURES_DIR = os.path.join(ROOT_DIR, 'figures')
SCRIPTS_DIR = os.path.join(ROOT_DIR, 'scripts')

def load_and_normalize_svg(filename):
    path = os.path.join(FIGURES_DIR, filename)
    with open(path, 'r', encoding='utf-8') as f:
        svg = f.read().strip()
    
    if '<?xml' in svg:
        svg = svg[svg.find('<svg'):]
    
    # Заменяем фиксированные width="...pt" и height="...pt" на адаптивные width="100%" height="auto"
    svg = re.sub(r'<svg([^>]*)width="[^"]+"([^>]*)height="[^"]+"',
                 r'<svg\1width="100%"\2height="auto" preserveAspectRatio="xMidYMid meet"',
                 svg, count=1)
    return svg

def process_lecture_15():
    content_path = os.path.join(SCRIPTS_DIR, 'lec15_content.html')
    with open(content_path, 'r', encoding='utf-8') as f:
        content = f.read()

    svg15_1 = load_and_normalize_svg('gravure_15_1.svg')
    svg15_2 = load_and_normalize_svg('gravure_15_2.svg')
    svg15_3 = load_and_normalize_svg('gravure_15_3.svg')
    svg15_4 = load_and_normalize_svg('gravure_15_4.svg')

    # Блок 1: Замена первого двойного блока на две крупные раздельные гравюры (15.1 и 15.2)
    # Ищем точный блок вокруг jxg-board-15-1a
    fig1_target_start = '<!-- Интерактивная доска JSXGraph: Равномерная непрерывность vs Осцилляции -->'
    fig1_target_end = '</figure>'
    idx1_start = content.find(fig1_target_start)
    if idx1_start != -1:
        idx1_end = content.find(fig1_target_end, idx1_start) + len(fig1_target_end)
        
        replacement_1 = f"""<!-- Академические векторные гравюры 15.1 и 15.2 -->
        <figure class="figure-card">
          <div class="figure-svg-container">
{svg15_1}
          </div>
          <figcaption class="figure-caption">
            <strong>ГРАВЮРА 15.1.</strong> Геометрический критерий равномерной непрерывности (теорема Кантора). Калибр $\\delta(\\varepsilon)$ образует жесткое окно безопасности $2\\delta \\times 2\\varepsilon$: график функции пересекает прямоугольник строго через боковые вертикальные границы, гарантируя, что вертикальный размах значений $|f(x) - f(x_0)| < \\varepsilon$ для всех $x \\in [x_0 - \\delta, x_0 + \\delta]$.
          </figcaption>
        </figure>

        <figure class="figure-card">
          <div class="figure-svg-container">
{svg15_2}
          </div>
          <figcaption class="figure-caption">
            <strong>ГРАВЮРА 15.2.</strong> Разрушение равномерной непрерывности: сингулярность $y = \\sin(1/x)$ при $x \\to +0$. При приближении к нулю частота осцилляций неограниченно возрастает. Для сколь угодно малого $\\delta > 0$ найдутся точки $x_n'$ и $x_n''$ на расстоянии $|x_n' - x_n''| < \\delta$, в которых размах значений функции достигает $|f(x_n') - f(x_n'')| = 2 \\geqslant \\varepsilon_0 = 1$, что опровергает равномерную непрерывность.
          </figcaption>
        </figure>"""
        
        content = content[:idx1_start] + replacement_1 + content[idx1_end:]
        print("Lecture 15: successfully replaced Fig 15.1 & 15.2")
    else:
        print("Lecture 15: Fig 1 target not found!")

    # Блок 2: Замена второго двойного блока на две крупные раздельные гравюры (15.3 и 15.4)
    fig2_target_start = '<!-- Интерактивная доска JSXGraph: Скачок монотонной функции и обратная функция -->'
    idx2_start = content.find(fig2_target_start)
    if idx2_start != -1:
        idx2_end = content.find(fig1_target_end, idx2_start) + len(fig1_target_end)
        
        replacement_2 = f"""<!-- Академические векторные гравюры 15.3 и 15.4 -->
        <figure class="figure-card">
          <div class="figure-svg-container">
{svg15_3}
          </div>
          <figcaption class="figure-caption">
            <strong>ГРАВЮРА 15.3.</strong> Скачок монотонной функции и лакуна в множестве значений. В точке разрыва $x_0$ образуется непустой открытый интервал значений $J_{{x_0}} = (f(x_0 - 0), f(x_0 + 0))$, не содержащий значений функции. Внутри каждого такого непересекающегося интервала содержится хотя бы одно рациональное число $r \\in \\mathbb{{Q}}$, что доказывает теорему о не более чем счётности множества точек разрыва монотонной функции.
          </figcaption>
        </figure>

        <figure class="figure-card">
          <div class="figure-svg-container">
{svg15_4}
          </div>
          <figcaption class="figure-caption">
            <strong>ГРАВЮРА 15.4.</strong> Непрерывность и зеркальная симметрия обратной функции $y = f^{{-1}}(x)$. Для строго монотонной функции отображение взаимнооднозначно, а её обратная функция строго монотонна и непрерывна на связном образе. График обратной функции зеркально-симметричен относительно биссектрисы $y = x$, а сегменты между парами точек $M(a, b) \\leftrightarrow M'(b, a)$ строго ортогональны оси симметрии.
          </figcaption>
        </figure>"""
        
        content = content[:idx2_start] + replacement_2 + content[idx2_end:]
        print("Lecture 15: successfully replaced Fig 15.3 & 15.4")
    else:
        print("Lecture 15: Fig 2 target not found!")

    # Удаление скрипта JSXGraph в конце файла
    script_idx = content.find('<script>')
    if script_idx != -1 and 'buildLecture15Boards' in content[script_idx:]:
        content = content[:script_idx].rstrip()
        print("Lecture 15: stripped script block")

    with open(content_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Saved: {content_path}")

def process_lecture_14():
    content_path = os.path.join(SCRIPTS_DIR, 'lec14_content.html')
    with open(content_path, 'r', encoding='utf-8') as f:
        content = f.read()

    svg14_1 = load_and_normalize_svg('gravure_14_1.svg')
    svg14_2 = load_and_normalize_svg('gravure_14_2.svg')
    svg14_3 = load_and_normalize_svg('gravure_14_3.svg')

    # Блок 1: Замена гравюры 14.1 (дихотомия)
    fig1_target_start = '<!-- Интерактивная доска JSXGraph: Метод дихотомии и теорема Больцано-Коши -->'
    fig_target_end = '</figure>'
    idx1_start = content.find(fig1_target_start)
    if idx1_start != -1:
        idx1_end = content.find(fig_target_end, idx1_start) + len(fig_target_end)
        
        replacement_1 = f"""<!-- Академическая векторная гравюра 14.1 -->
        <figure class="figure-card">
          <div class="figure-svg-container">
{svg14_1}
          </div>
          <figcaption class="figure-caption">
            <strong>ГРАВЮРА 14.1.</strong> Геометрическая визуализация первой теоремы Больцано–Коши и алгоритма дихотомии. Непрерывная траектория $y = f(x)$, связывающая разнознаковые концы $f(a) < 0$ и $f(b) > 0$, неминуемо пересекает координатную ось. Конструктивный метод половинного деления порождает систему вложенных отрезков $[a_0, b_0] \\supset [a_1, b_1] \\supset [a_2, b_2] \\dots$, длины которых стремятся к нулю, стягиваясь к единственному предельному корню $c \\in (a, b)$, в котором $f(c) = 0$.
          </figcaption>
        </figure>"""
        
        content = content[:idx1_start] + replacement_1 + content[idx1_end:]
        print("Lecture 14: successfully replaced Fig 14.1")
    else:
        print("Lecture 14: Fig 1 target not found!")

    # Блок 2: Замена второго блока на две отдельные крупные гравюры (14.2 - Вейерштрасс и 14.3 - Дарбу)
    fig2_target_start = '<!-- Интерактивная доска JSXGraph: Теоремы Вейерштрасса и образ отрезка -->'
    idx2_start = content.find(fig2_target_start)
    if idx2_start != -1:
        idx2_end = content.find(fig_target_end, idx2_start) + len(fig_target_end)
        
        replacement_2 = f"""<!-- Академические векторные гравюры 14.2 и 14.3 -->
        <figure class="figure-card">
          <div class="figure-svg-container">
{svg14_2}
          </div>
          <figcaption class="figure-caption">
            <strong>ГРАВЮРА 14.2.</strong> Теоремы Вейерштрасса: ограниченность и достижение точных граней на компакте. Непрерывная функция на отрезке $[a, b]$ гарантированно ограничена и достигает своего точного минимума $m = \\min f = f(x_*)$ и точного максимума $M = \\max f = f(x^*)$. Непрерывный образ отрезка представляет собой замкнутый ограниченный отрезок $[m, M]$.
          </figcaption>
        </figure>

        <figure class="figure-card">
          <div class="figure-svg-container">
{svg14_3}
          </div>
          <figcaption class="figure-caption">
            <strong>ГРАВЮРА 14.3.</strong> Вторая теорема Больцано–Коши (теорема Дарбу о промежуточном значении). Для любого промежуточного уровня $C \\in (m, M)$ горизонтальная прямая $y = C$ пересекает график функции хотя бы в одной точке: $\\exists c \\in (a, b): f(c) = C$. Это доказывает связность образа непрерывной функции и отсутствие лакун в множестве принимаемых значений.
          </figcaption>
        </figure>"""
        
        content = content[:idx2_start] + replacement_2 + content[idx2_end:]
        print("Lecture 14: successfully replaced Fig 14.2 & 14.3")
    else:
        print("Lecture 14: Fig 2 target not found!")

    # Удаление скрипта JSXGraph в конце файла
    script_idx = content.find('<script>')
    if script_idx != -1 and 'buildLecture14Boards' in content[script_idx:]:
        content = content[:script_idx].rstrip()
        print("Lecture 14: stripped script block")

    with open(content_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Saved: {content_path}")

def main():
    process_lecture_15()
    process_lecture_14()
    print("All lecture content files successfully updated with standalone figures!")

if __name__ == '__main__':
    main()
