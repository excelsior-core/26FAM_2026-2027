# -*- coding: utf-8 -*-
"""
Обновление конспектов лекций 14 и 15 новыми высокоточными векторными гравюрами
"""

import re
import os
from generate_math_illustrations import (
    generate_svg_14_1,
    generate_svg_14_2,
    generate_svg_15_1,
    generate_svg_15_2
)

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
LEC14_CONTENT = os.path.join(ROOT_DIR, 'scripts', 'lec14_content.html')
LEC15_CONTENT = os.path.join(ROOT_DIR, 'scripts', 'lec15_content.html')

def replace_figures(content, fig1, fig2):
    # Находим все блоки <figure class="figure-card">...</figure>
    pattern = re.compile(r'<figure class="figure-card">.*?</figure>', re.DOTALL)
    figures = list(pattern.finditer(content))
    if len(figures) != 2:
        print(f"Warning: expected 2 figures, found {len(figures)}")
        return content
    
    first = figures[0]
    second = figures[1]
    
    new_content = (
        content[:first.start()] +
        fig1 +
        content[first.end():second.start()] +
        fig2 +
        content[second.end():]
    )
    return new_content

def main():
    print("Updating Lecture 14 content...")
    with open(LEC14_CONTENT, 'r', encoding='utf-8') as f:
        c14 = f.read()
    new_c14 = replace_figures(c14, generate_svg_14_1(), generate_svg_14_2())
    with open(LEC14_CONTENT, 'w', encoding='utf-8') as f:
        f.write(new_c14)
    print("Lecture 14 content updated successfully.")

    print("Updating Lecture 15 content...")
    with open(LEC15_CONTENT, 'r', encoding='utf-8') as f:
        c15 = f.read()
    new_c15 = replace_figures(c15, generate_svg_15_1(), generate_svg_15_2())
    with open(LEC15_CONTENT, 'w', encoding='utf-8') as f:
        f.write(new_c15)
    print("Lecture 15 content updated successfully.")

if __name__ == '__main__':
    main()
