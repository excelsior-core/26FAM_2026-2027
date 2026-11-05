# -*- coding: utf-8 -*-
"""
Рендерер крупноформатных эталонных академических векторных гравюр для Лекций 14 и 15
Академический стиль: Caravaggio Dark Luxury / Imperial Science
Каждая иллюстрация — отдельная, крупная, полноформатная фигура с крупным шрифтом и идеальной читаемостью.
"""

import os
import io
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches

# Настройка шрифтов и типографики
plt.rcParams['font.family'] = 'DejaVu Serif'
plt.rcParams['mathtext.fontset'] = 'cm'
plt.rcParams['svg.fonttype'] = 'path'  # Перевод всех глифов в векторные контуры

PALETTE = {
    'bg_fig': '#120e0a',
    'bg_ax': '#16110c',
    'spine': '#6e5d4a',
    'grid': '#281e14',
    'text': '#e8e2d5',
    'text_muted': '#a0907e',
    'gold': '#e5b842',
    'gold_bright': '#ffd977',
    'gold_fill': '#e5b84224',
    'cyan': '#38bdf8',
    'cyan_fill': '#38bdf81c',
    'emerald': '#34d399',
    'emerald_fill': '#34d3991c',
    'ruby': '#fb7185',
    'ruby_fill': '#fb718522',
    'amber': '#fbbf24',
    'box_bg': '#1b140e',
}

def setup_ax(ax, title=None, xlim=None, ylim=None, xlabel=None, ylabel=None):
    ax.set_facecolor(PALETTE['bg_ax'])
    for spine in ax.spines.values():
        spine.set_color(PALETTE['spine'])
        spine.set_linewidth(1.3)
    ax.tick_params(colors=PALETTE['text_muted'], labelsize=12.5, width=1.3, length=5)
    ax.grid(True, linestyle=':', color=PALETTE['grid'], linewidth=1.0, alpha=0.7)
    if xlim: ax.set_xlim(xlim)
    if ylim: ax.set_ylim(ylim)
    if xlabel: ax.set_xlabel(xlabel, color=PALETTE['text'], fontsize=14, labelpad=8)
    if ylabel: ax.set_ylabel(ylabel, color=PALETTE['text'], fontsize=14, labelpad=8)
    if title:
        ax.set_title(title, color=PALETTE['gold'], fontsize=14.5, fontweight='bold', pad=14)

def fig_to_svg_string(fig):
    buf = io.StringIO()
    fig.savefig(buf, format='svg', bbox_inches='tight', pad_inches=0.18)
    plt.close(fig)
    svg_str = buf.getvalue()
    if '<?xml' in svg_str:
        svg_str = svg_str[svg_str.find('<svg'):]
    return svg_str

# ==============================================================================
# ЛЕКЦИЯ 15: РАВНОМЕРНАЯ НЕПРЕРЫВНОСТЬ И МОНОТОННЫЕ ФУНКЦИИ
# ==============================================================================

def generate_gravure_15_1():
    """
    Гравюра 15.1:
    Полноформатная иллюстрация калибра Кантора delta(epsilon) и окна безопасности 2*delta x 2*epsilon.
    """
    fig, ax = plt.subplots(figsize=(10.8, 6.2), facecolor=PALETTE['bg_fig'])

    setup_ax(ax,
             title='ГРАВЮРА 15.1. Калибр Кантора $\\delta(\\varepsilon)$ и окно безопасности $2\\delta \\times 2\\varepsilon$',
             xlim=(0.6, 5.4), ylim=(0.65, 3.5),
             xlabel='$x$', ylabel='$y$')

    # Гладкая функция f(x)
    x = np.linspace(0.8, 5.2, 500)
    def f(t): return 1.15 + 1.05 * np.sin(0.72 * t + 0.2) + 0.12 * t
    y = f(x)
    ax.plot(x, y, color=PALETTE['cyan'], lw=3.4, label='$y = f(x)$', zorder=4)

    # Точка x0 и параметры окна безопасности
    x0 = 2.85
    y0 = f(x0)
    delta = 0.68
    epsilon = 0.52

    # Прямоугольник окна безопасности
    rect = patches.Rectangle((x0 - delta, y0 - epsilon), 2 * delta, 2 * epsilon,
                             linewidth=2.0, edgecolor=PALETTE['gold'], linestyle='--',
                             facecolor=PALETTE['gold_fill'], zorder=3)
    ax.add_patch(rect)

    # Центр окна M0(x0, f(x0))
    ax.scatter([x0], [y0], color=PALETTE['gold_bright'], s=110, zorder=6, edgecolors=PALETTE['gold'], lw=2.0)
    ax.annotate('$M_0(x_0, f(x_0))$', (x0, y0), textcoords="offset points", xytext=(12, 12),
                color=PALETTE['gold_bright'], fontsize=13.5, fontweight='bold')

    # Пунктиры к осям
    ax.plot([x0, x0], [0.65, y0], color=PALETTE['gold'], ls=':', lw=1.4, alpha=0.9)
    ax.plot([0.6, x0], [y0, y0], color=PALETTE['gold'], ls=':', lw=1.4, alpha=0.9)

    ax.plot([x0 - delta, x0 - delta], [0.65, y0 + epsilon], color=PALETTE['text_muted'], ls=':', lw=1.2)
    ax.plot([x0 + delta, x0 + delta], [0.65, y0 + epsilon], color=PALETTE['text_muted'], ls=':', lw=1.2)
    ax.plot([0.6, x0 + delta], [y0 - epsilon, y0 - epsilon], color=PALETTE['text_muted'], ls=':', lw=1.2)
    ax.plot([0.6, x0 + delta], [y0 + epsilon, y0 + epsilon], color=PALETTE['text_muted'], ls=':', lw=1.2)

    # Засечки на осях без наложений
    ax.set_xticks([0.8, x0 - delta, x0, x0 + delta, 5.2])
    ax.set_xticklabels(['$a$', '$x_0 - \\delta$', '$x_0$', '$x_0 + \\delta$', '$b$'], fontsize=13)

    ax.set_yticks([1.0, y0 - epsilon, y0, y0 + epsilon, 3.2])
    ax.set_yticklabels(['1.0', '$f(x_0) - \\varepsilon$', '$f(x_0)$', '$f(x_0) + \\varepsilon$', '3.2'], fontsize=12.5)

    # Стрелки размеров окна 2*delta и 2*epsilon
    ax.annotate('', xy=(x0 - delta, y0 - epsilon - 0.22), xytext=(x0 + delta, y0 - epsilon - 0.22),
                arrowprops=dict(arrowstyle='<->', color=PALETTE['gold'], lw=1.6))
    ax.text(x0, y0 - epsilon - 0.38, 'ширина: $2\\delta(\\varepsilon)$', color=PALETTE['gold'], ha='center', fontsize=12.5, fontweight='bold')

    ax.annotate('', xy=(x0 + delta + 0.22, y0 - epsilon), xytext=(x0 + delta + 0.22, y0 + epsilon),
                arrowprops=dict(arrowstyle='<->', color=PALETTE['ruby'], lw=1.6))
    ax.text(x0 + delta + 0.32, y0, 'высота:\n$2\\varepsilon$', color=PALETTE['ruby'], va='center', fontsize=12.5, fontweight='bold')

    # Поясняющий блок теоремы
    ax.text(0.85, 3.12,
            'Кривая пересекает только боковые границы окна:\n$\\forall x \\in [x_0 - \\delta, x_0 + \\delta] \\Rightarrow |f(x) - f(x_0)| < \\varepsilon$\n(размах по вертикали не превышает $2\\varepsilon$ на всем компакте)',
            fontsize=12, color=PALETTE['text'],
            bbox=dict(boxstyle='round,pad=0.55', facecolor=PALETTE['box_bg'], edgecolor=PALETTE['gold'], lw=1.1))

    plt.tight_layout(pad=2.4)
    return fig

def generate_gravure_15_2():
    """
    Гравюра 15.2:
    Полноформатная иллюстрация разрушения равномерной непрерывности у функции y = sin(1/x) при x -> +0.
    """
    fig, ax = plt.subplots(figsize=(10.8, 6.2), facecolor=PALETTE['bg_fig'])

    setup_ax(ax,
             title='ГРАВЮРА 15.2. Разрушение равномерности: сингулярность $y = \\sin(1/x)$ при $x \\to +0$',
             xlim=(0.0, 0.85), ylim=(-1.45, 1.45),
             xlabel='$x$', ylabel='$y$')

    # Плотная сетка точек кривой sin(1/x)
    x_dense = np.linspace(0.030, 0.82, 3500)
    y_dense = np.sin(1.0 / x_dense)
    ax.plot(x_dense, y_dense, color=PALETTE['cyan'], lw=2.2, label='$y = \\sin(1/x)$', zorder=4)

    # Коридор значений [-1, 1]
    ax.axhline(1.0, color=PALETTE['text_muted'], ls='--', lw=1.1, alpha=0.6)
    ax.axhline(-1.0, color=PALETTE['text_muted'], ls='--', lw=1.1, alpha=0.6)
    ax.fill_between([0.0, 0.85], -1.0, 1.0, color=PALETTE['cyan_fill'], alpha=0.3, zorder=2)

    # Пара точек: n = 1 (крупно и наглядно)
    x_prime = 1.0 / (2.5 * np.pi)   # ≈ 0.1273
    x_dprime = 1.0 / (3.5 * np.pi)  # ≈ 0.0909
    y_prime = 1.0
    y_dprime = -1.0

    ax.scatter([x_prime], [y_prime], color=PALETTE['gold_bright'], s=110, zorder=6, edgecolors=PALETTE['gold'], lw=2.0)
    ax.scatter([x_dprime], [y_dprime], color=PALETTE['ruby'], s=110, zorder=6, edgecolors=PALETTE['ruby'], lw=2.0)

    ax.annotate('$M_n\'(x_n\', +1)$', (x_prime, y_prime), textcoords="offset points", xytext=(10, 8),
                color=PALETTE['gold_bright'], fontsize=13, fontweight='bold')
    ax.annotate('$M_n\'\'(x_n\'\', -1)$', (x_dprime, y_dprime), textcoords="offset points", xytext=(10, -18),
                color=PALETTE['ruby'], fontsize=13, fontweight='bold')

    # Проекции к оси X
    ax.plot([x_prime, x_prime], [0, y_prime], color=PALETTE['gold'], ls=':', lw=1.3)
    ax.plot([x_dprime, x_dprime], [0, y_dprime], color=PALETTE['ruby'], ls=':', lw=1.3)

    # Горизонтальные направляющие к вертикальной скобке размаха
    span_x = 0.24
    ax.plot([x_prime, span_x], [1.0, 1.0], color=PALETTE['ruby'], ls=':', lw=1.2, alpha=0.7)
    ax.plot([x_dprime, span_x], [-1.0, -1.0], color=PALETTE['ruby'], ls=':', lw=1.2, alpha=0.7)

    # Вертикальная скобка размаха колебаний
    ax.annotate('', xy=(span_x, -1.0), xytext=(span_x, 1.0),
                arrowprops=dict(arrowstyle='<->', color=PALETTE['ruby'], lw=2.2))
    ax.text(span_x + 0.025, 0.0, 'Размах колебаний:\n$|f(x_n\') - f(x_n\'\')| = 2 \\geq \\varepsilon_0$',
            color=PALETTE['ruby'], va='center', fontsize=13, fontweight='bold')

    # Расстояние по горизонтали
    ax.annotate('', xy=(x_dprime, -1.22), xytext=(x_prime, -1.22),
                arrowprops=dict(arrowstyle='<->', color=PALETTE['gold_bright'], lw=1.6))
    ax.text((x_prime + x_dprime) / 2, -1.38, '$|x_n\' - x_n\'\'| < \\delta \\to 0$',
            color=PALETTE['gold_bright'], ha='center', fontsize=12.5, fontweight='bold')

    # Информационный блок
    ax.text(0.36, 1.15,
            'Опровержение равномерной непрерывности:\n$\\forall \\delta > 0 \\;\\; \\exists x\', x\'\': \\; |x\' - x\'\'| < \\delta$,\nно $|\\sin(1/x\') - \\sin(1/x\'\')| = 2 \\geq \\varepsilon_0 = 1$',
            fontsize=12, color=PALETTE['text'],
            bbox=dict(boxstyle='round,pad=0.55', facecolor=PALETTE['box_bg'], edgecolor=PALETTE['ruby'], lw=1.1))

    plt.tight_layout(pad=2.4)
    return fig

def generate_gravure_15_3():
    """
    Гравюра 15.3:
    Полноформатная иллюстрация скачка монотонной функции и лакуны в образе (счетность разрывов).
    """
    fig, ax = plt.subplots(figsize=(10.8, 6.2), facecolor=PALETTE['bg_fig'])

    setup_ax(ax,
             title='ГРАВЮРА 15.3. Скачок монотонной функции и лакуна в образе: не более чем счётность разрывов',
             xlim=(0.4, 4.6), ylim=(0.4, 3.8),
             xlabel='$x$', ylabel='$y$')

    x0 = 2.4
    x_left = np.linspace(0.6, x0, 200)
    y_left = 0.65 + 0.38 * x_left
    ax.plot(x_left[:-1], y_left[:-1], color=PALETTE['gold'], lw=3.2, zorder=4)

    x_right = np.linspace(x0, 4.4, 200)
    y_right = 2.45 + 0.28 * (x_right - x0) + 0.08 * (x_right - x0)**2
    ax.plot(x_right, y_right, color=PALETTE['gold'], lw=3.2, zorder=4)

    y_left_lim = float(y_left[-1])   # f(x0 - 0) ≈ 1.562
    y_right_lim = float(y_right[0])  # f(x0 + 0) = 2.45

    # Точки на скачке: выколотая внизу, закрашенная вверху
    ax.scatter([x0], [y_left_lim], facecolors=PALETTE['bg_ax'], edgecolors=PALETTE['gold'], s=95, lw=2.5, zorder=6)
    ax.scatter([x0], [y_right_lim], color=PALETTE['gold_bright'], edgecolors=PALETTE['gold'], s=95, lw=2.0, zorder=6)

    # Проекции к осям
    ax.plot([x0, x0], [0.4, y_right_lim], color=PALETTE['text_muted'], ls=':', lw=1.3)
    ax.plot([0.4, x0], [y_left_lim, y_left_lim], color=PALETTE['text_muted'], ls=':', lw=1.2)
    ax.plot([0.4, x0], [y_right_lim, y_right_lim], color=PALETTE['text_muted'], ls=':', lw=1.2)

    # Выделение лакуны на оси Y
    gap_x = 0.44
    ax.plot([gap_x, gap_x], [y_left_lim, y_right_lim], color=PALETTE['ruby'], lw=7.0, zorder=5)
    ax.scatter([gap_x], [(y_left_lim + y_right_lim)/2], color=PALETTE['gold_bright'], s=85, marker='*', zorder=7)

    # Чистые символьные засечки на осях
    ax.set_xticks([0.6, 1.5, x0, 3.5, 4.4])
    ax.set_xticklabels(['$a$', '1.5', '$x_0$', '3.5', '$b$'], fontsize=13)

    ax.set_yticks([0.8, y_left_lim, y_right_lim, 3.3])
    ax.set_yticklabels(['0.8', '$f(x_0 - 0)$', '$f(x_0 + 0)$', '3.3'], fontsize=12.5)

    # Пояснение лакуны и рационального числа
    ax.annotate('Лакуна в образе:\n$J_{x_0} = (f(x_0 - 0), f(x_0 + 0))$\n$\\exists r \\in J_{x_0} \\cap \\mathbb{Q}$',
                xy=(gap_x + 0.10, (y_left_lim + y_right_lim)/2), xytext=(0.95, 2.05),
                arrowprops=dict(arrowstyle='->', color=PALETTE['ruby'], lw=1.6),
                color=PALETTE['ruby'], fontsize=13, fontweight='bold',
                bbox=dict(boxstyle='round,pad=0.55', facecolor=PALETTE['box_bg'], edgecolor=PALETTE['ruby'], lw=1.1))

    ax.text(0.7, 3.42,
            'Следствие: непустые интервалы $J_{x_0}$ попарно не пересекаются\n$\\Rightarrow$ каждому разрыву отвечает свое число $r \\in \\mathbb{Q}$\n$\\Rightarrow$ множество точек разрыва монотонной функции не более чем счётно!',
            fontsize=12, color=PALETTE['text'],
            bbox=dict(boxstyle='round,pad=0.55', facecolor=PALETTE['box_bg'], edgecolor=PALETTE['gold'], lw=1.0))

    plt.tight_layout(pad=2.4)
    return fig

def generate_gravure_15_4():
    """
    Гравюра 15.4:
    Полноформатная иллюстрация строго монотонной непрерывной обратной функции y = f^{-1}(x).
    Строго квадратный формат с честным aspect='equal' для идеального угла 45 градусов.
    """
    fig, ax = plt.subplots(figsize=(9.2, 7.8), facecolor=PALETTE['bg_fig'])

    setup_ax(ax,
             title='ГРАВЮРА 15.4. Строго монотонная обратная функция $y = f^{-1}(x)$: непрерывность и зеркальная симметрия',
             xlim=(0.3, 3.8), ylim=(0.3, 3.8),
             xlabel='$x$', ylabel='$y$')
    ax.set_aspect('equal')  # Равномасштабность осей

    # Биссектриса y = x
    diag = np.linspace(0.4, 3.6, 150)
    ax.plot(diag, diag, color=PALETTE['gold'], ls='--', lw=1.8, alpha=0.8, label='Биссектриса $y = x$')
    ax.text(3.35, 3.48, '$y = x$', color=PALETTE['gold'], fontsize=14, fontweight='bold')

    # Функция f(x)
    def f(u): return 0.15 + 0.20 * u + 0.35 * u**2

    t = np.linspace(0.5, 2.7, 300)
    x_orig = t
    y_orig = f(t)

    mask = (x_orig >= 0.4) & (x_orig <= 3.5) & (y_orig >= 0.4) & (y_orig <= 3.5)
    ax.plot(x_orig[mask], y_orig[mask], color=PALETTE['cyan'], lw=3.4, label='$y = f(x)$', zorder=4)
    ax.plot(y_orig[mask], x_orig[mask], color=PALETTE['emerald'], lw=3.4, label='$y = f^{-1}(x)$', zorder=4)

    # Симметричная пара точек M(a, b) и M'(b, a)
    pt_a = 1.55
    pt_b = float(f(pt_a))  # ≈ 1.30

    ax.plot([pt_a, pt_b], [pt_b, pt_a], color=PALETTE['ruby'], ls=':', lw=1.8, zorder=5)
    ax.scatter([pt_a], [pt_b], color=PALETTE['cyan'], s=100, edgecolors=PALETTE['gold_bright'], lw=2.0, zorder=6)
    ax.scatter([pt_b], [pt_a], color=PALETTE['emerald'], s=100, edgecolors=PALETTE['gold_bright'], lw=2.0, zorder=6)

    # Середина на диагонали y = x
    mid_coord = (pt_a + pt_b) / 2.0
    ax.scatter([mid_coord], [mid_coord], color=PALETTE['gold_bright'], s=50, zorder=6)

    ax.annotate('$M(a, b)$', (pt_a, pt_b), textcoords="offset points", xytext=(10, -18),
                color=PALETTE['cyan'], fontsize=13, fontweight='bold')
    ax.annotate('$M\'(b, a)$', (pt_b, pt_a), textcoords="offset points", xytext=(-35, 10),
                color=PALETTE['emerald'], fontsize=13, fontweight='bold')

    # Метки кривых
    ax.text(2.65, 3.32, '$y = f(x)$', color=PALETTE['cyan'], fontsize=13.5, fontweight='bold')
    ax.text(3.30, 2.65, '$y = f^{-1}(x)$', color=PALETTE['emerald'], fontsize=13.5, fontweight='bold')

    # Поясняющий блок
    ax.text(1.70, 0.52,
            'Теорема об обратной функции:\n$f: X \\to Y \\Rightarrow f^{-1}: Y \\to X$\nстрого возрастает и непрерывна.\nЗеркальная симметрия сохраняет связность!',
            fontsize=12, color=PALETTE['text'],
            bbox=dict(boxstyle='round,pad=0.55', facecolor=PALETTE['box_bg'], edgecolor=PALETTE['emerald'], lw=1.1))

    plt.tight_layout(pad=2.4)
    return fig

# ==============================================================================
# ЛЕКЦИЯ 14: СВОЙСТВА НЕПРЕРЫВНЫХ ФУНКЦИЙ НА ОТРЕЗКЕ
# ==============================================================================

def generate_gravure_14_1():
    """
    Гравюра 14.1:
    Полноформатная иллюстрация метода дихотомии Больцано-Коши и стягивания отрезков.
    """
    fig, ax = plt.subplots(figsize=(11.5, 6.2), facecolor=PALETTE['bg_fig'])

    setup_ax(ax,
             title='ГРАВЮРА 14.1. Геометрия дихотомии Больцано — Коши: стягивание вложенных отрезков к корню $c$',
             xlim=(0.6, 5.4), ylim=(-2.7, 2.7),
             xlabel='$x$', ylabel='$y$')

    # Горизонтальная ось абсцисс
    ax.axhline(0, color=PALETTE['spine'], lw=1.5, zorder=3)

    # Непрерывная функция f(x), меняющая знак
    x = np.linspace(0.8, 5.2, 500)
    def f(t): return 0.35 * (t - 3.1)**3 - 0.4 * (t - 3.1) + 0.15
    y = f(x)
    ax.plot(x, y, color=PALETTE['cyan'], lw=3.4, label='$y = f(x)$', zorder=4)

    # Шаги дихотомии
    a0 = 1.0
    b0 = 4.8

    def find_root(func, a, b):
        for _ in range(50):
            m = (a + b) / 2.0
            if func(a) * func(m) <= 0: b = m
            else: a = m
        return (a + b) / 2.0

    c_root = find_root(f, a0, b0)  # ≈ 1.868

    c1 = (a0 + b0) / 2.0  # 2.9 (f(c1) > 0)
    a1, b1 = a0, c1       # [1.0, 2.9]

    c2 = (a1 + b1) / 2.0  # 1.95 (f(c2) > 0)
    a2, b2 = a1, c2       # [1.0, 1.95]

    # Точки на концах и серединах
    ax.scatter([a0], [f(a0)], color=PALETTE['ruby'], s=100, zorder=5, edgecolors=PALETTE['gold_bright'], lw=1.8)
    ax.scatter([b0], [f(b0)], color=PALETTE['emerald'], s=100, zorder=5, edgecolors=PALETTE['gold_bright'], lw=1.8)
    ax.scatter([c1], [f(c1)], color=PALETTE['emerald'], s=85, zorder=5, edgecolors=PALETTE['gold_bright'], lw=1.6)
    ax.scatter([c2], [f(c2)], color=PALETTE['emerald'], s=80, zorder=5, edgecolors=PALETTE['gold_bright'], lw=1.6)

    # Проекции точек к оси абсцисс
    ax.plot([a0, a0], [0, f(a0)], color=PALETTE['ruby'], ls=':', lw=1.4)
    ax.plot([b0, b0], [0, f(b0)], color=PALETTE['emerald'], ls=':', lw=1.4)
    ax.plot([c1, c1], [0, f(c1)], color=PALETTE['emerald'], ls=':', lw=1.4)
    ax.plot([c2, c2], [0, f(c2)], color=PALETTE['emerald'], ls=':', lw=1.2)

    # Точка корня c
    ax.scatter([c_root], [0], color=PALETTE['gold_bright'], s=120, marker='o', zorder=6, edgecolors=PALETTE['gold'], lw=2.2)
    ax.text(c_root - 0.35, 0.24, '$c: f(c) = 0$', color=PALETTE['gold_bright'], fontsize=13, fontweight='bold', ha='center')

    # Метки точек на кривой
    ax.annotate('$f(a_0) < 0$', (a0, f(a0)), textcoords="offset points", xytext=(10, -10),
                color=PALETTE['ruby'], fontsize=13, fontweight='bold')
    ax.annotate('$f(b_0) > 0$', (b0, f(b0)), textcoords="offset points", xytext=(-15, 12),
                color=PALETTE['emerald'], fontsize=13, fontweight='bold')
    ax.annotate('$c_1 = \\frac{a_0+b_0}{2}$', (c1, f(c1)), textcoords="offset points", xytext=(-38, 16),
                color=PALETTE['gold_bright'], fontsize=12.5)
    ax.annotate('$c_2 = \\frac{a_1+b_1}{2}$', (c2, f(c2)), textcoords="offset points", xytext=(-15, 18),
                color=PALETTE['emerald'], fontsize=12)

    # 3 уровня вложенных отрезков под осью X
    bracket_y1 = -0.7
    bracket_y2 = -1.2
    bracket_y3 = -1.7

    # Уровень 0: [a0, b0]
    ax.plot([a0, b0], [bracket_y1, bracket_y1], color=PALETTE['gold'], lw=3.0, zorder=5)
    ax.scatter([a0, b0], [bracket_y1, bracket_y1], color=PALETTE['gold'], s=50, zorder=6)
    ax.text((a0 + b0)/2, bracket_y1 + 0.14, 'Исходный отрезок $[a_0, b_0]$', color=PALETTE['gold'], ha='center', fontsize=12, fontweight='bold')

    # Уровень 1: [a1, b1] = [a0, c1]
    ax.plot([a0, c1], [bracket_y2, bracket_y2], color=PALETTE['emerald'], lw=3.0, zorder=5)
    ax.scatter([a0, c1], [bracket_y2, bracket_y2], color=PALETTE['emerald'], s=50, zorder=6)
    ax.text((a0 + c1)/2, bracket_y2 + 0.14, 'Шаг 1: $[a_1, b_1] = [a_0, c_1]$ (длина $\\frac{b-a}{2}$)', color=PALETTE['emerald'], ha='center', fontsize=12)

    # Уровень 2: [a2, b2] = [a0, c2]
    ax.plot([a0, c2], [bracket_y3, bracket_y3], color=PALETTE['cyan'], lw=3.0, zorder=5)
    ax.scatter([a0, c2], [bracket_y3, bracket_y3], color=PALETTE['cyan'], s=50, zorder=6)
    ax.text((a0 + c2)/2, bracket_y3 + 0.14, 'Шаг 2: $[a_2, b_2] = [a_0, c_2]$ (длина $\\frac{b-a}{4}$)', color=PALETTE['cyan'], ha='center', fontsize=12)

    # Вертикальная линия стягивания к корню
    ax.axvline(c_root, color=PALETTE['gold_bright'], ls='--', lw=1.5, alpha=0.7, zorder=2)

    # Информационный блок
    ax.text(3.05, -1.8,
            'Лемма Кантора о вложенных отрезках:\n$[a_0, b_0] \\supset [a_1, b_1] \\supset [a_2, b_2] \\dots$\n$|b_n - a_n| = \\frac{b-a}{2^n} \\to 0 \\Rightarrow \\exists! c = \\lim a_n = \\lim b_n$\nПо непрерывности: $f(c) = 0$',
            fontsize=12, color=PALETTE['text'],
            bbox=dict(boxstyle='round,pad=0.55', facecolor=PALETTE['box_bg'], edgecolor=PALETTE['gold'], lw=1.1))

    plt.tight_layout(pad=2.4)
    return fig

def generate_gravure_14_2():
    """
    Гравюра 14.2:
    Полноформатная иллюстрация теорем Вейерштрасса: ограниченность и достижение экстремумов m, M на компакте.
    """
    fig, ax = plt.subplots(figsize=(10.8, 6.2), facecolor=PALETTE['bg_fig'])

    setup_ax(ax,
             title='ГРАВЮРА 14.2. Теоремы Вейерштрасса: ограниченность и достижение точных граней $m$ и $M$ на компакте',
             xlim=(0.5, 4.5), ylim=(0.2, 3.4),
             xlabel='$x$', ylabel='$y$')

    x = np.linspace(0.7, 4.3, 400)
    def f(t): return 1.9 + 0.9 * np.sin(2.4 * t - 1.2) - 0.15 * t

    x_max = 1.13
    y_max = float(f(x_max))  # ≈ 2.63
    x_min = 2.49
    y_min = float(f(x_min))  # ≈ 0.63

    ax.plot(x, f(x), color=PALETTE['cyan'], lw=3.4, zorder=4)

    # Горизонтальные касательные на уровнях M и m
    ax.axhline(y_max, color=PALETTE['gold_bright'], ls='--', lw=1.3, alpha=0.7)
    ax.axhline(y_min, color=PALETTE['ruby'], ls='--', lw=1.3, alpha=0.7)

    # Точки экстремумов
    ax.scatter([x_max], [y_max], color=PALETTE['gold_bright'], s=110, edgecolors=PALETTE['gold'], lw=2.0, zorder=6)
    ax.scatter([x_min], [y_min], color=PALETTE['ruby'], s=110, edgecolors=PALETTE['ruby'], lw=2.0, zorder=6)

    # Проекции на ось Y и X
    ax.plot([x_max, x_max], [0.2, y_max], color=PALETTE['gold_bright'], ls=':', lw=1.3)
    ax.plot([x_min, x_min], [0.2, y_min], color=PALETTE['ruby'], ls=':', lw=1.3)
    ax.plot([0.5, x_max], [y_max, y_max], color=PALETTE['gold_bright'], ls=':', lw=1.3)
    ax.plot([0.5, x_min], [y_min, y_min], color=PALETTE['ruby'], ls=':', lw=1.3)

    # Проекция образа отрезка на оси Y (от m до M)
    bar_x = 0.54
    ax.plot([bar_x, bar_x], [y_min, y_max], color=PALETTE['gold'], lw=7.0, zorder=5)

    # Подписи экстремумов
    ax.annotate('$M = \\max f = f(x^*)$', (x_max, y_max), textcoords="offset points", xytext=(12, 10),
                color=PALETTE['gold_bright'], fontsize=13, fontweight='bold')
    ax.annotate('$m = \\min f = f(x_*)$', (x_min, y_min), textcoords="offset points", xytext=(12, -20),
                color=PALETTE['ruby'], fontsize=13, fontweight='bold')

    # Чистые символьные засечки на осях
    ax.set_xticks([0.7, x_max, x_min, 4.3])
    ax.set_xticklabels(['$a$', '$x^*$', '$x_*$', '$b$'], fontsize=13)

    ax.set_yticks([y_min, y_max])
    ax.set_yticklabels(['$m$', '$M$'], fontsize=13, fontweight='bold')

    ax.annotate('Образ отрезка:\n$f([a, b]) = [m, M]$\n(компакт)',
                xy=(bar_x, 1.25), xytext=(0.68, 0.78),
                arrowprops=dict(arrowstyle='->', color=PALETTE['gold'], lw=1.6),
                color=PALETTE['gold_bright'], fontsize=12, fontweight='bold',
                bbox=dict(boxstyle='round,pad=0.50', facecolor=PALETTE['box_bg'], edgecolor=PALETTE['gold'], lw=1.1))

    ax.text(2.0, 2.95,
            'Теорема Вейерштрасса II:\nНепрерывная функция на компакте достигает своих точных граней:\n$\\exists x_*, x^* \\in [a, b]: \\quad f(x_*) = \\inf f = m, \\quad f(x^*) = \\sup f = M$',
            fontsize=12, color=PALETTE['text'],
            bbox=dict(boxstyle='round,pad=0.55', facecolor=PALETTE['box_bg'], edgecolor=PALETTE['spine'], lw=1.1))

    plt.tight_layout(pad=2.4)
    return fig

def generate_gravure_14_3():
    """
    Гравюра 14.3:
    Полноформатная иллюстрация второй теоремы Больцано-Коши о промежуточном значении (теорема Дарбу).
    """
    fig, ax = plt.subplots(figsize=(10.8, 6.2), facecolor=PALETTE['bg_fig'])

    setup_ax(ax,
             title='ГРАВЮРА 14.3. Теорема Дарбу о промежуточных значениях: связность образа непрерывной функции',
             xlim=(0.5, 4.5), ylim=(0.2, 3.4),
             xlabel='$x$', ylabel='$y$')

    x = np.linspace(0.7, 4.3, 400)
    def f(t): return 1.9 + 0.9 * np.sin(2.4 * t - 1.2) - 0.15 * t

    ax.plot(x, f(x), color=PALETTE['cyan'], lw=3.4, zorder=4)

    # Промежуточное значение C
    C = 1.65
    ax.axhline(C, color=PALETTE['amber'], ls='--', lw=1.8, zorder=3)
    ax.text(4.4, C + 0.10, '$y = C$', color=PALETTE['amber'], fontsize=13.5, fontweight='bold', ha='right')

    # Находим точки пересечения f(x) = C
    c_pts = []
    for i in range(len(x)-1):
        if (f(x[i]) - C) * (f(x[i+1]) - C) <= 0:
            c_val = x[i] - (f(x[i]) - C) * (x[i+1] - x[i]) / (f(x[i+1]) - f(x[i]))
            c_pts.append(float(c_val))

    for idx, cpt in enumerate(c_pts[:2]):
        ax.scatter([cpt], [C], color=PALETTE['emerald'], s=95, edgecolors=PALETTE['gold_bright'], lw=1.8, zorder=6)
        ax.plot([cpt, cpt], [0.2, C], color=PALETTE['emerald'], ls=':', lw=1.4)
        ax.text(cpt, 0.28, f'$c_{idx+1}$', color=PALETTE['emerald'], ha='center', fontsize=13, fontweight='bold')

    if len(c_pts) >= 1:
        target_c = c_pts[0]
        ax.annotate('Вторая теорема Больцано — Коши:\nДля любого $C \\in (m, M)$\n$\\exists c \\in (a, b): \\quad f(c) = C$',
                    xy=(target_c, C), xytext=(2.45, 2.75),
                    arrowprops=dict(arrowstyle='->', color=PALETTE['emerald'], lw=1.6),
                    color=PALETTE['emerald'], fontsize=12.5, fontweight='bold',
                    bbox=dict(boxstyle='round,pad=0.55', facecolor=PALETTE['box_bg'], edgecolor=PALETTE['emerald'], lw=1.1))

    ax.text(0.60, 3.08,
            'Связность: образ отрезка\nне содержит "дыр" и лакун:\n$f([a, b])$ — связное множество',
            fontsize=11.5, color=PALETTE['text'],
            bbox=dict(boxstyle='round,pad=0.50', facecolor=PALETTE['box_bg'], edgecolor=PALETTE['amber'], lw=1.1))

    # Засечки на осях
    ax.set_xticks([0.7, c_pts[0], c_pts[1], 4.3])
    ax.set_xticklabels(['$a$', '$c_1$', '$c_2$', '$b$'], fontsize=13)

    ax.set_yticks([0.63, C, 2.63])
    ax.set_yticklabels(['$m$', '$C$', '$M$'], fontsize=13, fontweight='bold')

    plt.tight_layout(pad=2.4)
    return fig

def main():
    output_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'figures'))
    os.makedirs(output_dir, exist_ok=True)

    figures = [
        ('gravure_15_1', generate_gravure_15_1),
        ('gravure_15_2', generate_gravure_15_2),
        ('gravure_15_3', generate_gravure_15_3),
        ('gravure_15_4', generate_gravure_15_4),
        ('gravure_14_1', generate_gravure_14_1),
        ('gravure_14_2', generate_gravure_14_2),
        ('gravure_14_3', generate_gravure_14_3),
    ]

    for name, gen_fn in figures:
        print(f"Generating full-width {name}...")
        fig = gen_fn()
        png_path = os.path.join(output_dir, f"{name}.png")
        svg_path = os.path.join(output_dir, f"{name}.svg")
        fig.savefig(png_path, dpi=150, bbox_inches='tight')
        svg_str = fig_to_svg_string(fig)
        with open(svg_path, 'w', encoding='utf-8') as f:
            f.write(svg_str)
        print(f"  -> Saved {png_path} and {svg_path}")

    print("All 7 full-width standalone figures successfully generated!")

if __name__ == '__main__':
    main()
