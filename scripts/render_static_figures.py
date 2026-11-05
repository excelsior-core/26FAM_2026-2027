# -*- coding: utf-8 -*-
"""
Рендерер эталонных академических векторных гравюр для Лекций 14 и 15
Академический стиль: Caravaggio Dark Luxury / Imperial Science
Чистый SVG вектор без клиентского JavaScript, без внешних зависимостей.
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
plt.rcParams['svg.fonttype'] = 'path'  # Перевод глифов в векторные контуры для 100% стабильности

PALETTE = {
    'bg_fig': '#120e0a',
    'bg_ax': '#16110c',
    'spine': '#6e5d4a',
    'grid': '#281e14',
    'text': '#e8e2d5',
    'text_muted': '#9e8f7c',
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
        spine.set_linewidth(1.2)
    ax.tick_params(colors=PALETTE['text_muted'], labelsize=10, width=1.1, length=4)
    ax.grid(True, linestyle=':', color=PALETTE['grid'], linewidth=0.9, alpha=0.7)
    if xlim: ax.set_xlim(xlim)
    if ylim: ax.set_ylim(ylim)
    if xlabel: ax.set_xlabel(xlabel, color=PALETTE['text'], fontsize=11, labelpad=6)
    if ylabel: ax.set_ylabel(ylabel, color=PALETTE['text'], fontsize=11, labelpad=6)
    if title:
        ax.set_title(title, color=PALETTE['gold'], fontsize=12.5, fontweight='bold', pad=12)

def generate_gravure_15_1():
    """
    Гравюра 15.1:
    Панель А: Калибр Кантора delta(epsilon) и окно безопасности 2*delta x 2*epsilon.
    Панель Б: Разрушение равномерности у y = sin(1/x) при x -> +0.
    """
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14.0, 5.7), facecolor=PALETTE['bg_fig'])

    # --- ПАНЕЛЬ А: ОКНО БЕЗОПАСНОСТИ КАНТОРА ---
    setup_ax(ax1, 
             title='А. Калибр Кантора $\\delta(\\varepsilon)$ и окно безопасности $2\\delta \\times 2\\varepsilon$',
             xlim=(0.6, 5.4), ylim=(0.7, 3.5),
             xlabel='$x$', ylabel='$y$')

    # Гладкая функция f(x)
    x = np.linspace(0.8, 5.2, 400)
    def f_a(t): return 1.15 + 1.05 * np.sin(0.72 * t + 0.2) + 0.12 * t
    y = f_a(x)
    ax1.plot(x, y, color=PALETTE['cyan'], lw=2.5, label='$y = f(x)$', zorder=4)

    # Точка x0 и окно безопасности
    x0 = 2.85
    y0 = f_a(x0)
    delta = 0.68
    epsilon = 0.52

    # Окно безопасности (прямоугольник)
    rect = patches.Rectangle((x0 - delta, y0 - epsilon), 2 * delta, 2 * epsilon,
                             linewidth=1.5, edgecolor=PALETTE['gold'], linestyle='--',
                             facecolor=PALETTE['gold_fill'], zorder=3)
    ax1.add_patch(rect)

    # Центр окна M0(x0, f(x0))
    ax1.scatter([x0], [y0], color=PALETTE['gold_bright'], s=65, zorder=5, edgecolors=PALETTE['gold'], lw=1.5)
    ax1.annotate('$M_0(x_0, f(x_0))$', (x0, y0), textcoords="offset points", xytext=(8, 10),
                 color=PALETTE['gold_bright'], fontsize=11, fontweight='bold')

    # Пунктиры к осям
    ax1.plot([x0, x0], [0.7, y0], color=PALETTE['gold'], ls=':', lw=1.2, alpha=0.8)
    ax1.plot([0.6, x0], [y0, y0], color=PALETTE['gold'], ls=':', lw=1.2, alpha=0.8)

    ax1.plot([x0 - delta, x0 - delta], [0.7, y0 + epsilon], color=PALETTE['text_muted'], ls=':', lw=1.0)
    ax1.plot([x0 + delta, x0 + delta], [0.7, y0 + epsilon], color=PALETTE['text_muted'], ls=':', lw=1.0)
    ax1.plot([0.6, x0 + delta], [y0 - epsilon, y0 - epsilon], color=PALETTE['text_muted'], ls=':', lw=1.0)
    ax1.plot([0.6, x0 + delta], [y0 + epsilon, y0 + epsilon], color=PALETTE['text_muted'], ls=':', lw=1.0)

    # Засечки на осях без наложений
    ax1.set_xticks([0.8, x0 - delta, x0, x0 + delta, 5.2])
    ax1.set_xticklabels(['$a$', '$x_0 - \\delta$', '$x_0$', '$x_0 + \\delta$', '$b$'], fontsize=10.5)

    ax1.set_yticks([1.0, y0 - epsilon, y0, y0 + epsilon, 3.2])
    ax1.set_yticklabels(['1.0', '$f(x_0) - \\varepsilon$', '$f(x_0)$', '$f(x_0) + \\varepsilon$', '3.2'], fontsize=10)

    # Стрелки размеров окна 2*delta и 2*epsilon
    ax1.annotate('', xy=(x0 - delta, y0 - epsilon - 0.22), xytext=(x0 + delta, y0 - epsilon - 0.22),
                 arrowprops=dict(arrowstyle='<->', color=PALETTE['gold'], lw=1.3))
    ax1.text(x0, y0 - epsilon - 0.38, 'ширина: $2\\delta(\\varepsilon)$', color=PALETTE['gold'], ha='center', fontsize=10)

    ax1.annotate('', xy=(x0 + delta + 0.18, y0 - epsilon), xytext=(x0 + delta + 0.18, y0 + epsilon),
                 arrowprops=dict(arrowstyle='<->', color=PALETTE['ruby'], lw=1.3))
    ax1.text(x0 + delta + 0.26, y0, 'высота:\n$2\\varepsilon$', color=PALETTE['ruby'], va='center', fontsize=10)

    # Поясняющий блок
    ax1.text(0.85, 3.12,
             'Кривая пересекает только боковые границы:\n$\\forall x \\in [x_0 - \\delta, x_0 + \\delta] \\Rightarrow |f(x) - f(x_0)| < \\varepsilon$',
             fontsize=9.5, color=PALETTE['text'],
             bbox=dict(boxstyle='round,pad=0.45', facecolor=PALETTE['box_bg'], edgecolor=PALETTE['gold'], lw=0.9))

    # --- ПАНЕЛЬ Б: РАЗРУШЕНИЕ РАВНОМЕРНОСТИ SIN(1/X) ---
    setup_ax(ax2,
             title='Б. Разрушение равномерности: сингулярность $y = \\sin(1/x)$',
             xlim=(0.0, 0.85), ylim=(-1.45, 1.45),
             xlabel='$x$', ylabel='$y$')

    # Плотная сетка точек для кривой sin(1/x)
    x_dense = np.linspace(0.032, 0.82, 3000)
    y_dense = np.sin(1.0 / x_dense)
    ax2.plot(x_dense, y_dense, color=PALETTE['cyan'], lw=1.6, label='$y = \\sin(1/x)$', zorder=4)

    # Коридор значений [-1, 1]
    ax2.axhline(1.0, color=PALETTE['text_muted'], ls='--', lw=0.9, alpha=0.6)
    ax2.axhline(-1.0, color=PALETTE['text_muted'], ls='--', lw=0.9, alpha=0.6)
    ax2.fill_between([0.0, 0.85], -1.0, 1.0, color=PALETTE['cyan_fill'], alpha=0.3, zorder=2)

    # Пара точек: n = 1
    x_prime = 1.0 / (2.5 * np.pi)   # ≈ 0.1273
    x_dprime = 1.0 / (3.5 * np.pi)  # ≈ 0.0909
    y_prime = 1.0
    y_dprime = -1.0

    ax2.scatter([x_prime], [y_prime], color=PALETTE['gold_bright'], s=65, zorder=5, edgecolors=PALETTE['gold'], lw=1.5)
    ax2.scatter([x_dprime], [y_dprime], color=PALETTE['ruby'], s=65, zorder=5, edgecolors=PALETTE['ruby'], lw=1.5)

    ax2.annotate('$M_n\'(x_n\', +1)$', (x_prime, y_prime), textcoords="offset points", xytext=(8, 6),
                 color=PALETTE['gold_bright'], fontsize=10.5, fontweight='bold')
    ax2.annotate('$M_n\'\'(x_n\'\', -1)$', (x_dprime, y_dprime), textcoords="offset points", xytext=(8, -14),
                 color=PALETTE['ruby'], fontsize=10.5, fontweight='bold')

    # Проекции к оси X
    ax2.plot([x_prime, x_prime], [0, y_prime], color=PALETTE['gold'], ls=':', lw=1.1)
    ax2.plot([x_dprime, x_dprime], [0, y_dprime], color=PALETTE['ruby'], ls=':', lw=1.1)

    # Горизонтальные направляющие к вертикальной скобке размаха
    span_x = 0.22
    ax2.plot([x_prime, span_x], [1.0, 1.0], color=PALETTE['ruby'], ls=':', lw=1.0, alpha=0.7)
    ax2.plot([x_dprime, span_x], [-1.0, -1.0], color=PALETTE['ruby'], ls=':', lw=1.0, alpha=0.7)

    # Скобка размаха по вертикали |f' - f''| = 2
    ax2.annotate('', xy=(span_x, -1.0), xytext=(span_x, 1.0),
                 arrowprops=dict(arrowstyle='<->', color=PALETTE['ruby'], lw=1.8))
    ax2.text(span_x + 0.02, 0.0, 'Размах колебаний:\n$|f(x_n\') - f(x_n\'\')| = 2 \\geq \\varepsilon_0$',
             color=PALETTE['ruby'], va='center', fontsize=10, fontweight='bold')

    # Расстояние по горизонтали
    ax2.annotate('', xy=(x_dprime, -1.22), xytext=(x_prime, -1.22),
                 arrowprops=dict(arrowstyle='<->', color=PALETTE['gold_bright'], lw=1.3))
    ax2.text((x_prime + x_dprime) / 2, -1.38, '$|x_n\' - x_n\'\'| < \\delta \\to 0$',
             color=PALETTE['gold_bright'], ha='center', fontsize=9.5)

    # Информационный блок
    ax2.text(0.38, 1.15,
             'Опровержение равномерности:\n$\\forall \\delta > 0 \\;\\; \\exists x\', x\'\': \\; |x\' - x\'\'| < \\delta$,\nно $|\\sin(1/x\') - \\sin(1/x\'\')| = 2$',
             fontsize=9.5, color=PALETTE['text'],
             bbox=dict(boxstyle='round,pad=0.45', facecolor=PALETTE['box_bg'], edgecolor=PALETTE['ruby'], lw=0.9))

    plt.tight_layout(pad=2.2)
    return fig

def generate_gravure_15_2():
    """
    Гравюра 15.2:
    Панель А: Скачок монотонной функции и непустая лакуна в образе (счетность разрывов).
    Панель Б: Непрерывность и геометрическая зеркальная симметрия обратной функции y = f^{-1}(x).
    """
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14.0, 5.7), facecolor=PALETTE['bg_fig'])

    # --- ПАНЕЛЬ А: СКАЧОК МОНОТОННОЙ ФУНКЦИИ ---
    setup_ax(ax1,
             title='А. Скачок монотонной функции и лакуна в образе',
             xlim=(0.4, 4.6), ylim=(0.4, 3.8),
             xlabel='$x$', ylabel='$y$')

    x0 = 2.4
    x_left = np.linspace(0.6, x0, 150)
    y_left = 0.65 + 0.38 * x_left
    ax1.plot(x_left[:-1], y_left[:-1], color=PALETTE['gold'], lw=2.4, zorder=4)

    x_right = np.linspace(x0, 4.4, 150)
    y_right = 2.45 + 0.28 * (x_right - x0) + 0.08 * (x_right - x0)**2
    ax1.plot(x_right, y_right, color=PALETTE['gold'], lw=2.4, zorder=4)

    y_left_lim = float(y_left[-1])   # f(x0 - 0) ≈ 1.562
    y_right_lim = float(y_right[0])  # f(x0 + 0) = 2.45

    # Точки на скачке: выколотая внизу, закрашенная вверху
    ax1.scatter([x0], [y_left_lim], facecolors=PALETTE['bg_ax'], edgecolors=PALETTE['gold'], s=60, lw=2, zorder=6)
    ax1.scatter([x0], [y_right_lim], color=PALETTE['gold_bright'], edgecolors=PALETTE['gold'], s=60, lw=1.5, zorder=6)

    # Проекции к осям
    ax1.plot([x0, x0], [0.4, y_right_lim], color=PALETTE['text_muted'], ls=':', lw=1.1)
    ax1.plot([0.4, x0], [y_left_lim, y_left_lim], color=PALETTE['text_muted'], ls=':', lw=1.0)
    ax1.plot([0.4, x0], [y_right_lim, y_right_lim], color=PALETTE['text_muted'], ls=':', lw=1.0)

    # Выделение лакуны на оси Y
    gap_x = 0.44
    ax1.plot([gap_x, gap_x], [y_left_lim, y_right_lim], color=PALETTE['ruby'], lw=5.5, zorder=5)
    ax1.scatter([gap_x], [(y_left_lim + y_right_lim)/2], color=PALETTE['gold_bright'], s=50, marker='*', zorder=7)

    # Чистые математические засечки на осях
    ax1.set_xticks([0.6, 1.5, x0, 3.5, 4.4])
    ax1.set_xticklabels(['$a$', '1.5', '$x_0$', '3.5', '$b$'], fontsize=10.5)

    ax1.set_yticks([0.8, y_left_lim, y_right_lim, 3.3])
    ax1.set_yticklabels(['0.8', '$f(x_0 - 0)$', '$f(x_0 + 0)$', '3.3'], fontsize=10)

    # Пояснение лакуны и рационального числа
    ax1.annotate('Лакуна в образе:\n$J_{x_0} = (f(x_0 - 0), f(x_0 + 0))$\n$\\exists r \\in J_{x_0} \\cap \\mathbb{Q}$',
                 xy=(gap_x + 0.08, (y_left_lim + y_right_lim)/2), xytext=(1.0, 2.05),
                 arrowprops=dict(arrowstyle='->', color=PALETTE['ruby'], lw=1.3),
                 color=PALETTE['ruby'], fontsize=10, fontweight='bold',
                 bbox=dict(boxstyle='round,pad=0.4', facecolor=PALETTE['box_bg'], edgecolor=PALETTE['ruby'], lw=0.9))

    ax1.text(0.7, 3.42,
             'Следствие: интервалы $J_{x_0}$ попарно не пересекаются\n$\\Rightarrow$ множество точек разрыва не более чем счётно!',
             fontsize=9.5, color=PALETTE['text'],
             bbox=dict(boxstyle='round,pad=0.4', facecolor=PALETTE['box_bg'], edgecolor=PALETTE['gold'], lw=0.8))

    # --- ПАНЕЛЬ Б: ОБРАТНАЯ ФУНКЦИЯ И ЗЕРКАЛЬНАЯ СИММЕТРИЯ ---
    setup_ax(ax2,
             title='Б. Непрерывность и зеркальная симметрия: $y = f^{-1}(x)$',
             xlim=(0.3, 3.8), ylim=(0.3, 3.8),
             xlabel='$x$', ylabel='$y$')
    ax2.set_aspect('equal')

    # Биссектриса y = x
    diag = np.linspace(0.4, 3.6, 100)
    ax2.plot(diag, diag, color=PALETTE['gold'], ls='--', lw=1.3, alpha=0.7, label='Биссектриса $y = x$')
    ax2.text(3.35, 3.48, '$y = x$', color=PALETTE['gold'], fontsize=11, fontweight='bold')

    # Строго возрастающая выпуклая функция y = f(x)
    def f_b(u):
        return 0.15 + 0.20 * u + 0.35 * u**2

    t = np.linspace(0.5, 2.7, 200)
    x_orig = t
    y_orig = f_b(t)

    mask = (x_orig >= 0.4) & (x_orig <= 3.5) & (y_orig >= 0.4) & (y_orig <= 3.5)
    ax2.plot(x_orig[mask], y_orig[mask], color=PALETTE['cyan'], lw=2.4, label='$y = f(x)$', zorder=4)
    ax2.plot(y_orig[mask], x_orig[mask], color=PALETTE['emerald'], lw=2.4, label='$y = f^{-1}(x)$', zorder=4)

    # Симметричная пара точек M(a, b) и M'(b, a)
    pt_a = 1.55
    pt_b = float(f_b(pt_a))  # ≈ 1.30

    ax2.plot([pt_a, pt_b], [pt_b, pt_a], color=PALETTE['ruby'], ls=':', lw=1.4, zorder=5)
    ax2.scatter([pt_a], [pt_b], color=PALETTE['cyan'], s=60, edgecolors=PALETTE['gold_bright'], lw=1.4, zorder=6)
    ax2.scatter([pt_b], [pt_a], color=PALETTE['emerald'], s=60, edgecolors=PALETTE['gold_bright'], lw=1.4, zorder=6)

    # Середина отрезка на диагонали y=x
    mid_coord = (pt_a + pt_b) / 2.0
    ax2.scatter([mid_coord], [mid_coord], color=PALETTE['gold_bright'], s=30, zorder=6)

    ax2.annotate('$M(a, b)$', (pt_a, pt_b), textcoords="offset points", xytext=(8, -14),
                 color=PALETTE['cyan'], fontsize=10.5, fontweight='bold')
    ax2.annotate('$M\'(b, a)$', (pt_b, pt_a), textcoords="offset points", xytext=(-28, 8),
                 color=PALETTE['emerald'], fontsize=10.5, fontweight='bold')

    # Метки кривых
    ax2.text(2.65, 3.32, '$y = f(x)$', color=PALETTE['cyan'], fontsize=11, fontweight='bold')
    ax2.text(3.30, 2.65, '$y = f^{-1}(x)$', color=PALETTE['emerald'], fontsize=11, fontweight='bold')

    # Поясняющий блок в нижней правой четверти
    ax2.text(1.75, 0.58,
             'Отображение строго взаимнооднозначно:\n$f: X \\to Y \\Rightarrow f^{-1}: Y \\to X$\nстрого возрастает и непрерывна',
             fontsize=9.2, color=PALETTE['text'],
             bbox=dict(boxstyle='round,pad=0.4', facecolor=PALETTE['box_bg'], edgecolor=PALETTE['emerald'], lw=0.8))

    plt.tight_layout(pad=2.2)
    return fig

def generate_gravure_14_1():
    """
    Гравюра 14.1:
    Метод дихотомии Больцано-Коши и стягивание системы вложенных отрезков.
    """
    fig, ax = plt.subplots(figsize=(13.0, 5.7), facecolor=PALETTE['bg_fig'])

    setup_ax(ax,
             title='ГРАВЮРА 14.1. Геометрия дихотомии Больцано — Коши: стягивание вложенных отрезков к корню $c$',
             xlim=(0.6, 5.4), ylim=(-2.7, 2.7),
             xlabel='$x$', ylabel='$y$')

    # Горизонтальная ось абсцисс выделена
    ax.axhline(0, color=PALETTE['spine'], lw=1.4, zorder=3)

    # Непрерывная функция f(x), меняющая знак
    x = np.linspace(0.8, 5.2, 400)
    def f(t):
        return 0.35 * (t - 3.1)**3 - 0.4 * (t - 3.1) + 0.15
    y = f(x)
    ax.plot(x, y, color=PALETTE['cyan'], lw=2.6, label='$y = f(x)$', zorder=4)

    # Шаги дихотомии
    a0 = 1.0
    b0 = 4.8

    # Численный поиск корня бисекцией
    def find_root(func, a, b):
        for _ in range(50):
            m = (a + b) / 2.0
            if func(a) * func(m) <= 0:
                b = m
            else:
                a = m
        return (a + b) / 2.0

    c_root = find_root(f, a0, b0)  # ≈ 1.868

    c1 = (a0 + b0) / 2.0  # 2.9 (f(c1) > 0)
    a1, b1 = a0, c1       # [1.0, 2.9]

    c2 = (a1 + b1) / 2.0  # 1.95 (f(c2) > 0)
    a2, b2 = a1, c2       # [1.0, 1.95]

    # Точки на концах и серединах
    ax.scatter([a0], [f(a0)], color=PALETTE['ruby'], s=70, zorder=5, edgecolors=PALETTE['gold_bright'], lw=1.4)
    ax.scatter([b0], [f(b0)], color=PALETTE['emerald'], s=70, zorder=5, edgecolors=PALETTE['gold_bright'], lw=1.4)
    ax.scatter([c1], [f(c1)], color=PALETTE['emerald'], s=60, zorder=5, edgecolors=PALETTE['gold_bright'], lw=1.4)
    ax.scatter([c2], [f(c2)], color=PALETTE['emerald'], s=55, zorder=5, edgecolors=PALETTE['gold_bright'], lw=1.3)

    # Проекции точек к оси абсцисс
    ax.plot([a0, a0], [0, f(a0)], color=PALETTE['ruby'], ls=':', lw=1.2)
    ax.plot([b0, b0], [0, f(b0)], color=PALETTE['emerald'], ls=':', lw=1.2)
    ax.plot([c1, c1], [0, f(c1)], color=PALETTE['emerald'], ls=':', lw=1.2)
    ax.plot([c2, c2], [0, f(c2)], color=PALETTE['emerald'], ls=':', lw=1.1)

    # Точка корня c
    ax.scatter([c_root], [0], color=PALETTE['gold_bright'], s=90, marker='o', zorder=6, edgecolors=PALETTE['gold'], lw=2)
    ax.text(c_root - 0.32, 0.22, '$c: f(c) = 0$', color=PALETTE['gold_bright'], fontsize=11, fontweight='bold', ha='center')

    # Метки точек на кривой
    ax.annotate('$f(a_0) < 0$', (a0, f(a0)), textcoords="offset points", xytext=(8, -8),
                color=PALETTE['ruby'], fontsize=10.5, fontweight='bold')
    ax.annotate('$f(b_0) > 0$', (b0, f(b0)), textcoords="offset points", xytext=(-12, 10),
                color=PALETTE['emerald'], fontsize=10.5, fontweight='bold')
    ax.annotate('$c_1 = \\frac{a_0+b_0}{2}$', (c1, f(c1)), textcoords="offset points", xytext=(-35, 12),
                color=PALETTE['gold_bright'], fontsize=10)
    ax.annotate('$c_2 = \\frac{a_1+b_1}{2}$', (c2, f(c2)), textcoords="offset points", xytext=(8, 12),
                color=PALETTE['emerald'], fontsize=9.5)

    # 3 уровня вложенных отрезков под осью X
    bracket_y1 = -0.7
    bracket_y2 = -1.2
    bracket_y3 = -1.7

    # Уровень 0: [a0, b0]
    ax.plot([a0, b0], [bracket_y1, bracket_y1], color=PALETTE['gold'], lw=2.4, zorder=5)
    ax.scatter([a0, b0], [bracket_y1, bracket_y1], color=PALETTE['gold'], s=35, zorder=6)
    ax.text((a0 + b0)/2, bracket_y1 + 0.12, 'Исходный отрезок $[a_0, b_0]$', color=PALETTE['gold'], ha='center', fontsize=9.5)

    # Уровень 1: [a1, b1] = [a0, c1]
    ax.plot([a0, c1], [bracket_y2, bracket_y2], color=PALETTE['emerald'], lw=2.4, zorder=5)
    ax.scatter([a0, c1], [bracket_y2, bracket_y2], color=PALETTE['emerald'], s=35, zorder=6)
    ax.text((a0 + c1)/2, bracket_y2 + 0.12, 'Шаг 1: $[a_1, b_1] = [a_0, c_1]$ (длина $\\frac{b-a}{2}$)', color=PALETTE['emerald'], ha='center', fontsize=9.5)

    # Уровень 2: [a2, b2] = [a0, c2]
    ax.plot([a0, c2], [bracket_y3, bracket_y3], color=PALETTE['cyan'], lw=2.4, zorder=5)
    ax.scatter([a0, c2], [bracket_y3, bracket_y3], color=PALETTE['cyan'], s=35, zorder=6)
    ax.text((a0 + c2)/2, bracket_y3 + 0.12, 'Шаг 2: $[a_2, b_2] = [a_0, c_2]$ (длина $\\frac{b-a}{4}$)', color=PALETTE['cyan'], ha='center', fontsize=9.5)

    # Вертикальная линия стягивания к корню
    ax.axvline(c_root, color=PALETTE['gold_bright'], ls='--', lw=1.2, alpha=0.6, zorder=2)

    # Информационный блок
    ax.text(3.1, -1.8,
            'Лемма Кантора о вложенных отрезках:\n$[a_0, b_0] \\supset [a_1, b_1] \\supset [a_2, b_2] \\dots$\n$|b_n - a_n| = \\frac{b-a}{2^n} \\to 0 \\Rightarrow \\exists! c = \\lim a_n = \\lim b_n$\nПо непрерывности: $f(c) = 0$',
            fontsize=9.8, color=PALETTE['text'],
            bbox=dict(boxstyle='round,pad=0.5', facecolor=PALETTE['box_bg'], edgecolor=PALETTE['gold'], lw=0.9))

    plt.tight_layout(pad=2.2)
    return fig

def generate_gravure_14_2():
    """
    Гравюра 14.2:
    Панель А: Теоремы Вейерштрасса (ограниченность и достижение точных граней m, M).
    Панель Б: Теорема о промежуточных значениях (Дарбу) и связность образа отрезка.
    """
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14.0, 5.7), facecolor=PALETTE['bg_fig'])

    # Общая функция для обеих панелей
    x = np.linspace(0.7, 4.3, 300)
    def f(t):
        return 1.9 + 0.9 * np.sin(2.4 * t - 1.2) - 0.15 * t

    # Точки глобальных экстремумов:
    x_max = 1.13
    y_max = float(f(x_max))  # ≈ 2.63
    x_min = 2.49
    y_min = float(f(x_min))  # ≈ 0.63

    # --- ПАНЕЛЬ А: ТЕОРЕМЫ ВЕЙЕРШТРАССА ---
    setup_ax(ax1,
             title='А. Достижение точных граней $m$ и $M$ (Теоремы Вейерштрасса)',
             xlim=(0.5, 4.5), ylim=(0.2, 3.4),
             xlabel='$x$', ylabel='$y$')

    ax1.plot(x, f(x), color=PALETTE['cyan'], lw=2.4, zorder=4)

    # Горизонтальные касательные на уровнях M и m
    ax1.axhline(y_max, color=PALETTE['gold_bright'], ls='--', lw=1.1, alpha=0.7)
    ax1.axhline(y_min, color=PALETTE['ruby'], ls='--', lw=1.1, alpha=0.7)

    # Точки экстремумов
    ax1.scatter([x_max], [y_max], color=PALETTE['gold_bright'], s=75, edgecolors=PALETTE['gold'], lw=1.5, zorder=6)
    ax1.scatter([x_min], [y_min], color=PALETTE['ruby'], s=75, edgecolors=PALETTE['ruby'], lw=1.5, zorder=6)

    # Проекции на ось Y и X
    ax1.plot([x_max, x_max], [0.2, y_max], color=PALETTE['gold_bright'], ls=':', lw=1.0)
    ax1.plot([x_min, x_min], [0.2, y_min], color=PALETTE['ruby'], ls=':', lw=1.0)
    ax1.plot([0.5, x_max], [y_max, y_max], color=PALETTE['gold_bright'], ls=':', lw=1.0)
    ax1.plot([0.5, x_min], [y_min, y_min], color=PALETTE['ruby'], ls=':', lw=1.0)

    # Проекция образа отрезка на оси Y (от m до M)
    bar_x = 0.54
    ax1.plot([bar_x, bar_x], [y_min, y_max], color=PALETTE['gold'], lw=5.5, zorder=5)

    # Подписи экстремумов
    ax1.annotate('$M = \\max f = f(x^*)$', (x_max, y_max), textcoords="offset points", xytext=(8, 8),
                 color=PALETTE['gold_bright'], fontsize=10.5, fontweight='bold')
    ax1.annotate('$m = \\min f = f(x_*)$', (x_min, y_min), textcoords="offset points", xytext=(8, -16),
                 color=PALETTE['ruby'], fontsize=10.5, fontweight='bold')

    # Чистые академические метки на осях
    ax1.set_xticks([0.7, x_max, x_min, 4.3])
    ax1.set_xticklabels(['$a$', '$x^*$', '$x_*$', '$b$'], fontsize=11)

    ax1.set_yticks([y_min, y_max])
    ax1.set_yticklabels(['$m$', '$M$'], fontsize=11, fontweight='bold')

    ax1.annotate('Образ отрезка:\n$f([a, b]) = [m, M]$\n(компакт в $\\mathbb{R}$)',
                 xy=(bar_x, (y_min + y_max)/2), xytext=(0.85, 1.8),
                 arrowprops=dict(arrowstyle='->', color=PALETTE['gold'], lw=1.2),
                 color=PALETTE['gold_bright'], fontsize=10, fontweight='bold',
                 bbox=dict(boxstyle='round,pad=0.4', facecolor=PALETTE['box_bg'], edgecolor=PALETTE['gold'], lw=0.8))

    ax1.text(2.1, 2.95,
             'Теорема Вейерштрасса II:\n$\\exists x_*, x^* \\in [a, b]:$\n$f(x_*) = \\inf f, \\; f(x^*) = \\sup f$',
             fontsize=9.2, color=PALETTE['text'],
             bbox=dict(boxstyle='round,pad=0.4', facecolor=PALETTE['box_bg'], edgecolor=PALETTE['spine'], lw=0.8))

    # --- ПАНЕЛЬ Б: ТЕОРЕМА О ПРОМЕЖУТОЧНОМ ЗНАЧЕНИИ ---
    setup_ax(ax2,
             title='Б. Теорема Дарбу о промежуточных значениях',
             xlim=(0.5, 4.5), ylim=(0.2, 3.4),
             xlabel='$x$', ylabel='$y$')

    ax2.plot(x, f(x), color=PALETTE['cyan'], lw=2.4, zorder=4)

    # Промежуточное значение C
    C = 1.65
    ax2.axhline(C, color=PALETTE['amber'], ls='--', lw=1.4, zorder=3)
    ax2.text(4.4, C + 0.08, '$y = C$', color=PALETTE['amber'], fontsize=11, fontweight='bold', ha='right')

    # Находим точки пересечения f(x) = C
    c_pts = []
    for i in range(len(x)-1):
        if (f(x[i]) - C) * (f(x[i+1]) - C) <= 0:
            c_val = x[i] - (f(x[i]) - C) * (x[i+1] - x[i]) / (f(x[i+1]) - f(x[i]))
            c_pts.append(float(c_val))

    for idx, cpt in enumerate(c_pts[:2]):
        ax2.scatter([cpt], [C], color=PALETTE['emerald'], s=60, edgecolors=PALETTE['gold_bright'], lw=1.3, zorder=6)
        ax2.plot([cpt, cpt], [0.2, C], color=PALETTE['emerald'], ls=':', lw=1.1)
        ax2.text(cpt, 0.28, f'$c_{idx+1}$', color=PALETTE['emerald'], ha='center', fontsize=10.5, fontweight='bold')

    if len(c_pts) >= 1:
        target_c = c_pts[0]
        # Размещаем плашку в открытом верхнем пространстве над долиной функции
        ax2.annotate('Вторая теорема Больцано — Коши:\nДля любого $C \\in (m, M)$\n$\\exists c: f(c) = C$',
                     xy=(target_c, C), xytext=(2.1, 2.65),
                     arrowprops=dict(arrowstyle='->', color=PALETTE['emerald'], lw=1.3),
                     color=PALETTE['emerald'], fontsize=10, fontweight='bold',
                     bbox=dict(boxstyle='round,pad=0.45', facecolor=PALETTE['box_bg'], edgecolor=PALETTE['emerald'], lw=0.9))

    ax2.text(0.65, 3.08,
             'Связность: образ отрезка\nне содержит "дыр" и лакун:\n$f([a, b])$ — связное множество',
             fontsize=9.2, color=PALETTE['text'],
             bbox=dict(boxstyle='round,pad=0.4', facecolor=PALETTE['box_bg'], edgecolor=PALETTE['amber'], lw=0.8))

    plt.tight_layout(pad=2.2)
    return fig

def fig_to_svg_string(fig):
    buf = io.StringIO()
    fig.savefig(buf, format='svg', bbox_inches='tight', pad_inches=0.15)
    plt.close(fig)
    svg_str = buf.getvalue()
    if '<?xml' in svg_str:
        svg_str = svg_str[svg_str.find('<svg'):]
    return svg_str

def main():
    output_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'figures'))
    os.makedirs(output_dir, exist_ok=True)

    print("Generating polished Gravure 15.1...")
    fig15_1 = generate_gravure_15_1()
    svg15_1_path = os.path.join(output_dir, 'gravure_15_1.svg')
    png15_1_path = os.path.join(output_dir, 'gravure_15_1.png')
    fig15_1.savefig(png15_1_path, dpi=150, bbox_inches='tight')
    svg15_1_str = fig_to_svg_string(fig15_1)
    with open(svg15_1_path, 'w', encoding='utf-8') as f:
        f.write(svg15_1_str)

    print("Generating polished Gravure 15.2...")
    fig15_2 = generate_gravure_15_2()
    svg15_2_path = os.path.join(output_dir, 'gravure_15_2.svg')
    png15_2_path = os.path.join(output_dir, 'gravure_15_2.png')
    fig15_2.savefig(png15_2_path, dpi=150, bbox_inches='tight')
    svg15_2_str = fig_to_svg_string(fig15_2)
    with open(svg15_2_path, 'w', encoding='utf-8') as f:
        f.write(svg15_2_str)

    print("Generating polished Gravure 14.1...")
    fig14_1 = generate_gravure_14_1()
    svg14_1_path = os.path.join(output_dir, 'gravure_14_1.svg')
    png14_1_path = os.path.join(output_dir, 'gravure_14_1.png')
    fig14_1.savefig(png14_1_path, dpi=150, bbox_inches='tight')
    svg14_1_str = fig_to_svg_string(fig14_1)
    with open(svg14_1_path, 'w', encoding='utf-8') as f:
        f.write(svg14_1_str)

    print("Generating polished Gravure 14.2...")
    fig14_2 = generate_gravure_14_2()
    svg14_2_path = os.path.join(output_dir, 'gravure_14_2.svg')
    png14_2_path = os.path.join(output_dir, 'gravure_14_2.png')
    fig14_2.savefig(png14_2_path, dpi=150, bbox_inches='tight')
    svg14_2_str = fig_to_svg_string(fig14_2)
    with open(svg14_2_path, 'w', encoding='utf-8') as f:
        f.write(svg14_2_str)

    print("All polished figures successfully rendered to SVG and PNG in:", output_dir)

if __name__ == '__main__':
    main()
