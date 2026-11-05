# -*- coding: utf-8 -*-
"""
Генератор высокоточных академических векторных гравюр (SVG) для лекций 14 и 15
Математически точный расчет координат, каноническая типографика, адаптивные CSS-токены.
"""

import math

def format_points(pts):
    return " ".join(f"{x:.1f},{y:.1f}" for x, y in pts)

def generate_svg_15_2():
    """
    Гравюра 15.2: Геометрия монотонных отображений
    Панель А: Точка разрыва (скачок) монотонной функции
    Панель Б: Непрерывность обратной функции и осевая симметрия
    """
    # Панель А: Скачок монотонной функции
    # Ось X: 50..340, Y_axis: 60..250. Начало координат (80, 230).
    # Точка x0 = 190.
    # Левая ветвь: x от 90 до 190. f(x) растет от 215 до 180.
    # В x0 = 190: предел слева f(x0 - 0) = 180 (выколотая точка).
    # Правая ветвь: x от 190 до 320. f(x) растет от 120 до 80.
    # В x0 = 190: f(x0) = f(x0 + 0) = 120 (закрашенная точка).
    
    pts_left = []
    for i in range(50):
        t = i / 49.0
        x = 90 + t * (190 - 90)
        # плавная вогнутая кривая
        y = 215 - 35 * (t ** 1.3)
        pts_left.append((x, y))
    path_left = "M " + " L ".join(f"{x:.1f},{y:.1f}" for x, y in pts_left)

    pts_right = []
    for i in range(60):
        t = i / 59.0
        x = 190 + t * (320 - 190)
        # плавная вогнутая кривая, начинающаяся в 120
        y = 120 - 40 * (t ** 0.8)
        pts_right.append((x, y))
    path_right = "M " + " L ".join(f"{x:.1f},{y:.1f}" for x, y in pts_right)

    # Панель Б: Обратная функция
    # Окно [400..730, 25..275]. Центр квадранта: начало координат (440, 240).
    # Масштаб 1:1 по обеим осям!
    # Размер рабочей области: 200 x 200 пикселей.
    # Биссектриса y = x: от (440, 240) до (660, 40) - строго 45 градусов!
    # f(x): пусть x_rel от 20 до 180.
    # f_rel(x) = 15 + 160 * (x_rel / 180)**2.2
    # f_screen = (440 + x_rel, 240 - y_rel)
    # f^-1_screen = (440 + y_rel, 240 - x_rel)  <-- строго симметрично!
    pts_f = []
    pts_finv = []
    for i in range(80):
        u = i / 79.0
        x_rel = 15 + u * 175
        # Экспоненциально-степенная строго возрастающая выпуклая кривая
        y_rel = 10 + 175 * (math.exp(1.4 * u) - 1) / (math.exp(1.4) - 1)
        sx_f = 440 + x_rel
        sy_f = 240 - y_rel
        pts_f.append((sx_f, sy_f))
        
        # Строгое зеркальное отражение: переставляем x_rel и y_rel!
        sx_inv = 440 + y_rel
        sy_inv = 240 - x_rel
        pts_finv.append((sx_inv, sy_inv))

    path_f = "M " + " L ".join(f"{x:.1f},{y:.1f}" for x, y in pts_f)
    path_finv = "M " + " L ".join(f"{x:.1f},{y:.1f}" for x, y in pts_finv)

    # Контрольная пара симметричных точек
    u_ctrl = 0.55
    x_c = 15 + u_ctrl * 175
    y_c = 10 + 175 * (math.exp(1.4 * u_ctrl) - 1) / (math.exp(1.4) - 1)
    m1_x, m1_y = 440 + x_c, 240 - y_c
    m2_x, m2_y = 440 + y_c, 240 - x_c
    mid_x, mid_y = (m1_x + m2_x) / 2, (m1_y + m2_y) / 2

    svg = f"""<figure class="figure-card">
  <div class="figure-svg-container">
    <svg viewBox="0 0 760 310" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Геометрия монотонных отображений">
      <defs>
        <marker id="arr-axis" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="var(--svg-axis)"/>
        </marker>
        <linearGradient id="grad-jump" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--warn-border)" stop-opacity="0.85"/>
          <stop offset="100%" stop-color="var(--warn-accent)" stop-opacity="0.35"/>
        </linearGradient>
      </defs>

      <!-- ================= ПАНЕЛЬ А: СКАЧОК МОНОТОННОЙ ФУНКЦИИ ================= -->
      <g id="panel-a">
        <rect x="25" y="20" width="345" height="270" rx="10" fill="var(--svg-bg)" stroke="var(--border-subtle)" stroke-width="1.2"/>
        
        <!-- Заголовок панели -->
        <text x="45" y="46" font-family="'Cinzel', serif" font-size="12.5" font-weight="700" letter-spacing="0.08em" fill="var(--text-gold)">
          ✦ А. СКАЧОК МОНОТОННОЙ ФУНКЦИИ
        </text>

        <!-- Оси координат с делениями -->
        <line x1="50" y1="235" x2="345" y2="235" stroke="var(--svg-axis)" stroke-width="1.5" marker-end="url(#arr-axis)"/>
        <line x1="75" y1="255" x2="75" y2="55" stroke="var(--svg-axis)" stroke-width="1.5" marker-end="url(#arr-axis)"/>
        <text x="345" y="248" font-family="'Cormorant Garamond', serif" font-size="17" font-style="italic" fill="var(--svg-text)">x</text>
        <text x="63" y="62" font-family="'Cormorant Garamond', serif" font-size="17" font-style="italic" fill="var(--svg-text)">y</text>
        <text x="63" y="248" font-family="'Cormorant Garamond', serif" font-size="14" fill="var(--text-muted)">O</text>

        <!-- Графики ветвей -->
        <path d="{path_left}" fill="none" stroke="var(--svg-stroke-gold)" stroke-width="2.6" stroke-linecap="round"/>
        <path d="{path_right}" fill="none" stroke="var(--svg-stroke-gold)" stroke-width="2.6" stroke-linecap="round"/>

        <!-- Проекции точки x0 -->
        <line x1="190" y1="235" x2="190" y2="120" stroke="var(--border-medium)" stroke-width="1.2" stroke-dasharray="3 3"/>
        <text x="186" y="252" font-family="'Cormorant Garamond', serif" font-size="16" font-style="italic" font-weight="600" fill="var(--text-gold)">x₀</text>

        <!-- Проекции на ось Oy для левого предела f(x0 - 0) -->
        <line x1="75" y1="180" x2="190" y2="180" stroke="var(--border-medium)" stroke-width="1" stroke-dasharray="3 3"/>
        <circle cx="75" cy="180" r="2.5" fill="var(--svg-axis)"/>
        <text x="28" y="184" font-family="'Cormorant Garamond', serif" font-size="13" font-style="italic" fill="var(--svg-text)">f(x₀-0)</text>

        <!-- Проекции на ось Oy для правого предела f(x0 + 0) -->
        <line x1="75" y1="120" x2="190" y2="120" stroke="var(--border-medium)" stroke-width="1" stroke-dasharray="3 3"/>
        <circle cx="75" cy="120" r="2.5" fill="var(--svg-axis)"/>
        <text x="28" y="124" font-family="'Cormorant Garamond', serif" font-size="13" font-style="italic" fill="var(--svg-text)">f(x₀+0)</text>

        <!-- Интервал скачка на оси Oy -->
        <rect x="72.5" y="120" width="5" height="60" rx="2.5" fill="url(#grad-jump)"/>
        <!-- Фигурная скобка или плашка разрыва -->
        <path d="M 85,120 L 92,120 L 92,145 L 97,150 L 92,155 L 92,180 L 85,180" fill="none" stroke="var(--warn-border)" stroke-width="1.4"/>
        <text x="103" y="146" font-family="'Cormorant Garamond', serif" font-size="13" font-weight="600" fill="var(--warn-accent)">Скачок h(x₀) &gt; 0</text>
        <text x="103" y="162" font-family="'Cormorant Garamond', serif" font-size="11.5" font-style="italic" fill="var(--text-muted)">J = (f(x₀-0), f(x₀+0))</text>
        <text x="103" y="176" font-family="'Cinzel', serif" font-size="10.5" fill="var(--warn-accent)">J ⊄ f(X) (БРЕШЬ)</text>

        <!-- Точки разрыва: выколотая и сплошная -->
        <circle cx="190" cy="180" r="4.5" fill="var(--bg-surface)" stroke="var(--svg-stroke-gold)" stroke-width="2"/>
        <circle cx="190" cy="120" r="4.5" fill="var(--svg-stroke-gold)"/>

        <!-- Подпись под панелью -->
        <text x="75" y="278" font-family="'Cormorant Garamond', serif" font-size="12.5" font-style="italic" fill="var(--text-secondary)">
          Разрыв 1-го рода (скачок) разрывает связность образа f(X)
        </text>
      </g>

      <!-- ================= ПАНЕЛЬ Б: НЕПРЕРЫВНОСТЬ ОБРАТНОЙ ФУНКЦИИ ================= -->
      <g id="panel-b">
        <rect x="390" y="20" width="345" height="270" rx="10" fill="var(--svg-bg)" stroke="var(--border-subtle)" stroke-width="1.2"/>
        
        <!-- Заголовок панели -->
        <text x="410" y="46" font-family="'Cinzel', serif" font-size="12.5" font-weight="700" letter-spacing="0.08em" fill="var(--svg-stroke-emerald)">
          ✦ Б. НЕПРЕРЫВНОСТЬ ОБРАТНОЙ ФУНКЦИИ
        </text>

        <!-- Оси координат 1:1 -->
        <line x1="415" y1="235" x2="710" y2="235" stroke="var(--svg-axis)" stroke-width="1.5" marker-end="url(#arr-axis)"/>
        <line x1="440" y1="255" x2="440" y2="55" stroke="var(--svg-axis)" stroke-width="1.5" marker-end="url(#arr-axis)"/>
        <text x="710" y="248" font-family="'Cormorant Garamond', serif" font-size="17" font-style="italic" fill="var(--svg-text)">x</text>
        <text x="428" y="62" font-family="'Cormorant Garamond', serif" font-size="17" font-style="italic" fill="var(--svg-text)">y</text>
        <text x="428" y="248" font-family="'Cormorant Garamond', serif" font-size="14" fill="var(--text-muted)">O</text>

        <!-- Биссектриса y = x строго под 45 градусов -->
        <line x1="440" y1="235" x2="640" y2="35" stroke="var(--border-medium)" stroke-width="1.5" stroke-dasharray="4 4"/>
        <text x="646" y="44" font-family="'Cormorant Garamond', serif" font-size="14" font-style="italic" fill="var(--text-muted)">y = x</text>

        <!-- Графики: f(x) и f^-1(x) -->
        <path d="{path_f}" fill="none" stroke="var(--svg-stroke-cyan)" stroke-width="2.6" stroke-linecap="round"/>
        <path d="{path_finv}" fill="none" stroke="var(--svg-stroke-emerald)" stroke-width="2.6" stroke-linecap="round"/>

        <!-- Подписи кривых -->
        <text x="590" y="85" font-family="'Cormorant Garamond', serif" font-size="15" font-weight="600" font-style="italic" fill="var(--svg-stroke-cyan)">y = f(x)</text>
        <text x="635" y="180" font-family="'Cormorant Garamond', serif" font-size="15" font-weight="600" font-style="italic" fill="var(--svg-stroke-emerald)">y = f⁻¹(x)</text>

        <!-- Ортогональная связка симметричных точек M и M' -->
        <line x1="{m1_x:.1f}" y1="{m1_y:.1f}" x2="{m2_x:.1f}" y2="{m2_y:.1f}" stroke="var(--border-strong)" stroke-width="1.2" stroke-dasharray="3 3"/>
        <circle cx="{m1_x:.1f}" cy="{m1_y:.1f}" r="4" fill="var(--svg-stroke-cyan)"/>
        <circle cx="{m2_x:.1f}" cy="{m2_y:.1f}" r="4" fill="var(--svg-stroke-emerald)"/>
        <circle cx="{mid_x:.1f}" cy="{mid_y:.1f}" r="2" fill="var(--text-gold)"/>

        <!-- Метки точек M(x₀, y₀) и M'(y₀, x₀) -->
        <text x="{m1_x - 70:.1f}" y="{m1_y - 6:.1f}" font-family="'Cormorant Garamond', serif" font-size="13" font-style="italic" fill="var(--svg-stroke-cyan)">M(x₀, y₀)</text>
        <text x="{m2_x + 8:.1f}" y="{m2_y + 12:.1f}" font-family="'Cormorant Garamond', serif" font-size="13" font-style="italic" fill="var(--svg-stroke-emerald)">M'(y₀, x₀)</text>

        <!-- Подпись под панелью -->
        <text x="430" y="278" font-family="'Cormorant Garamond', serif" font-size="12.5" font-style="italic" fill="var(--text-secondary)">
          Строгая зеркальная симметрия относительно биссектрисы y = x
        </text>
      </g>
    </svg>
  </div>
  <figcaption class="figure-caption">
    <strong>ГРАВЮРА 15.2.</strong> Геометрические принципы теории монотонных отображений. <em>Панель А:</em> скачок неубывающей функции порождает непустой открытый интервал $J = (f(x_0 - 0), f(x_0 + 0))$, не содержащий значений функции, нарушая связность образа $f(X)$. <em>Панель Б:</em> график обратной функции $y = f^{-1}(x)$ строго симметричен графику $y = f(x)$ относительно биссектрисы $y = x$; сохранение промежуточности гарантирует непрерывность $f^{-1}$.
  </figcaption>
</figure>"""
    return svg

def generate_svg_15_1():
    """
    Гравюра 15.1: Равномерная непрерывность vs Осцилляторная сингулярность sin(1/x)
    """
    # 1. Плавная функция для Панели А: y = 200 - 130 * sin(0.012 * (x - 70))
    pts_smooth = []
    for i in range(80):
        x = 75 + i * (320 - 75) / 79.0
        y = 205 - 120 * math.sin(0.009 * (x - 60))
        pts_smooth.append((x, y))
    path_smooth = "M " + " L ".join(f"{x:.1f},{y:.1f}" for x, y in pts_smooth)

    # 2. Высокоточный график sin(1/x) для Панели Б:
    # Окно: x от 455 до 705.
    # Преобразуем экранный x в t in [0.015, 0.45]
    # x_screen = 450 + 250 * (t / 0.45)
    # y = sin(1/t)
    pts_sin = []
    num_samples = 400
    for i in range(num_samples):
        # квазилинейное сгущение к нулю
        u = i / float(num_samples - 1)
        t = 0.018 + 0.42 * (u ** 1.7)
        val = math.sin(1.0 / t)
        sx = 450 + (t / 0.45) * 240
        sy = 150 - val * 72
        pts_sin.append((sx, sy))
    path_sin = "M " + " L ".join(f"{x:.1f},{y:.1f}" for x, y in pts_sin)

    # Точки максимума и минимума sin(1/t) при малых t:
    # 1/t1 = pi/2 + 2*pi*n (val = 1) -> t1 = 1 / (0.5*pi + 6*pi) = 1 / (6.5*pi) ≈ 0.04897
    # 1/t2 = -pi/2 + 2*pi*n (val = -1) -> t2 = 1 / (1.5*pi + 6*pi) = 1 / (7.5*pi) ≈ 0.04244
    t1 = 1.0 / (6.5 * math.pi)
    t2 = 1.0 / (7.5 * math.pi)
    p1_x = 450 + (t1 / 0.45) * 240
    p1_y = 150 - 1.0 * 72
    p2_x = 450 + (t2 / 0.45) * 240
    p2_y = 150 - (-1.0) * 72

    svg = f"""<figure class="figure-card">
  <div class="figure-svg-container">
    <svg viewBox="0 0 760 310" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Равномерная непрерывность против осцилляций">
      <defs>
        <marker id="arr-axis2" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="var(--svg-axis)"/>
        </marker>
        <linearGradient id="grad-cantor-box" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="var(--accent-gold)" stop-opacity="0.22"/>
          <stop offset="100%" stop-color="var(--accent-gold)" stop-opacity="0.06"/>
        </linearGradient>
      </defs>

      <!-- ================= ПАНЕЛЬ А: ОКНО БЕЗОПАСНОСТИ КАНТОРА ================= -->
      <g id="panel-cantor">
        <rect x="25" y="20" width="345" height="270" rx="10" fill="var(--svg-bg)" stroke="var(--border-subtle)" stroke-width="1.2"/>
        <text x="45" y="46" font-family="'Cinzel', serif" font-size="12.5" font-weight="700" letter-spacing="0.08em" fill="var(--text-gold)">
          ✦ А. РАВНОМЕРНАЯ НЕПРЕРЫВНОСТЬ
        </text>

        <!-- Оси -->
        <line x1="50" y1="235" x2="345" y2="235" stroke="var(--svg-axis)" stroke-width="1.5" marker-end="url(#arr-axis2)"/>
        <line x1="75" y1="255" x2="75" y2="55" stroke="var(--svg-axis)" stroke-width="1.5" marker-end="url(#arr-axis2)"/>
        <text x="345" y="248" font-family="'Cormorant Garamond', serif" font-size="17" font-style="italic" fill="var(--svg-text)">x</text>
        <text x="63" y="62" font-family="'Cormorant Garamond', serif" font-size="17" font-style="italic" fill="var(--svg-text)">y</text>

        <!-- График функции -->
        <path d="{path_smooth}" fill="none" stroke="var(--svg-stroke-gold)" stroke-width="2.6" stroke-linecap="round"/>

        <!-- Прямоугольник безопасности Кантора 2delta x 2epsilon -->
        <!-- Центр: (195, 145) -->
        <rect x="155" y="115" width="80" height="60" rx="4" fill="url(#grad-cantor-box)" stroke="var(--accent-gold)" stroke-width="1.6" stroke-dasharray="4 3"/>
        <circle cx="195" cy="145" r="4.5" fill="var(--text-gold-bright)"/>

        <!-- Стрелки размеров 2delta и 2epsilon -->
        <line x1="155" y1="183" x2="235" y2="183" stroke="var(--text-gold)" stroke-width="1.2"/>
        <circle cx="155" cy="183" r="1.5" fill="var(--text-gold)"/>
        <circle cx="235" cy="183" r="1.5" fill="var(--text-gold)"/>
        <text x="185" y="197" font-family="'Cormorant Garamond', serif" font-size="13" font-style="italic" fill="var(--text-gold)">2δ(ε)</text>

        <line x1="243" y1="115" x2="243" y2="175" stroke="var(--text-gold)" stroke-width="1.2"/>
        <circle cx="243" cy="115" r="1.5" fill="var(--text-gold)"/>
        <circle cx="243" cy="175" r="1.5" fill="var(--text-gold)"/>
        <text x="250" y="149" font-family="'Cormorant Garamond', serif" font-size="13" font-style="italic" fill="var(--text-gold)">2ε</text>

        <!-- Поясняющий текст -->
        <text x="55" y="278" font-family="'Cormorant Garamond', serif" font-size="12.5" font-style="italic" fill="var(--text-secondary)">
          Окно 2δ×2ε скользит по кривой: график не выходит через горизонтали
        </text>
      </g>

      <!-- ================= ПАНЕЛЬ Б: ОСЦИЛЛЯЦИИ sin(1/x) ================= -->
      <g id="panel-oscillations">
        <rect x="390" y="20" width="345" height="270" rx="10" fill="var(--svg-bg)" stroke="var(--border-subtle)" stroke-width="1.2"/>
        <text x="410" y="46" font-family="'Cinzel', serif" font-size="12.5" font-weight="700" letter-spacing="0.08em" fill="var(--warn-accent)">
          ✦ Б. СИНГУЛЯРНОСТЬ y = sin(1/x)
        </text>

        <!-- Оси: начало (450, 150) -->
        <line x1="435" y1="150" x2="715" y2="150" stroke="var(--svg-axis)" stroke-width="1.5" marker-end="url(#arr-axis2)"/>
        <line x1="450" y1="245" x2="450" y2="55" stroke="var(--svg-axis)" stroke-width="1.5" marker-end="url(#arr-axis2)"/>
        <text x="715" y="163" font-family="'Cormorant Garamond', serif" font-size="17" font-style="italic" fill="var(--svg-text)">x</text>
        <text x="438" y="62" font-family="'Cormorant Garamond', serif" font-size="17" font-style="italic" fill="var(--svg-text)">y</text>

        <!-- Линии уровней y = 1 и y = -1 -->
        <line x1="450" y1="78" x2="690" y2="78" stroke="var(--border-subtle)" stroke-width="1" stroke-dasharray="2 2"/>
        <line x1="450" y1="222" x2="690" y2="222" stroke="var(--border-subtle)" stroke-width="1" stroke-dasharray="2 2"/>
        <text x="430" y="82" font-family="'Cormorant Garamond', serif" font-size="13" fill="var(--text-muted)">+1</text>
        <text x="432" y="226" font-family="'Cormorant Garamond', serif" font-size="13" fill="var(--text-muted)">-1</text>

        <!-- Высокоточный график sin(1/x) -->
        <path d="{path_sin}" fill="none" stroke="var(--svg-stroke-cyan)" stroke-width="1.8" stroke-linejoin="round"/>

        <!-- Сближающиеся точки с предельным разрывом Delta f = 2 -->
        <line x1="{p1_x:.1f}" y1="{p1_y:.1f}" x2="{p2_x:.1f}" y2="{p2_y:.1f}" stroke="var(--warn-border)" stroke-width="1.6" stroke-dasharray="2 2"/>
        <circle cx="{p1_x:.1f}" cy="{p1_y:.1f}" r="4" fill="var(--text-gold)"/>
        <circle cx="{p2_x:.1f}" cy="{p2_y:.1f}" r="4" fill="var(--warn-accent)"/>

        <!-- Текстовая аннотация разрушения равномерности -->
        <text x="{p1_x + 10:.1f}" y="{p1_y + 12:.1f}" font-family="'Cormorant Garamond', serif" font-size="13" font-style="italic" fill="var(--text-gold)">x'ₙ (f = +1)</text>
        <text x="{p2_x + 10:.1f}" y="{p2_y - 4:.1f}" font-family="'Cormorant Garamond', serif" font-size="13" font-style="italic" fill="var(--warn-accent)">x''ₙ (f = -1)</text>

        <rect x="525" y="165" width="185" height="52" rx="6" fill="var(--bg-surface-elevated)" stroke="var(--warn-border)" stroke-width="1"/>
        <text x="535" y="184" font-family="'Cormorant Garamond', serif" font-size="12.5" font-weight="600" fill="var(--warn-accent)">|x'ₙ - x''ₙ| → 0 (стягивание)</text>
        <text x="535" y="202" font-family="'Cormorant Garamond', serif" font-size="12.5" font-weight="700" fill="var(--text-gold)">|f(x'ₙ) - f(x''ₙ)| = 2 ≥ ε₀</text>

        <!-- Подпись под панелью -->
        <text x="420" y="278" font-family="'Cormorant Garamond', serif" font-size="12.5" font-style="italic" fill="var(--text-secondary)">
          Бесконечные осцилляции в окрестности 0 разрушают равномерность
        </text>
      </g>
    </svg>
  </div>
  <figcaption class="figure-caption">
    <strong>ГРАВЮРА 15.1.</strong> Геометрический критерий равномерной непрерывности. <em>Панель А:</em> калибр Кантора $\delta(\varepsilon)$ образует жесткое окно безопасности, сопровождающее график функции вдоль компакта. <em>Панель Б:</em> у функции $y = \sin(1/x)$ при $x \to +0$ частота осцилляций стремится к бесконечности; на сколь угодно малом интервале $\delta$ размах значений равен 2, что опровергает равномерную непрерывность.
  </figcaption>
</figure>"""
    return svg

def generate_svg_14_1():
    """
    Гравюра 14.1: Первая теорема Больцано-Коши и метод бисекции
    """
    # Построим непрерывную кубическую кривую f(x) = (x - 2.2)^3 * 0.25 - (x - 2.2)*0.8 - 0.2
    # Экранные координаты: x in [80..680], ось Ox на y = 160. Корень в x = 380.
    pts = []
    for i in range(100):
        t = i / 99.0
        x = 100 + t * (660 - 100)
        # нормированное u от -2.2 до +2.2
        u = -2.2 + t * 4.4
        # кубическая функция с хорошим наклоном
        val = 0.08 * (u ** 3) + 0.35 * u
        y = 160 - val * 70
        pts.append((x, y))
    path_curve = "M " + " L ".join(f"{x:.1f},{y:.1f}" for x, y in pts)

    svg = """<figure class="figure-card">
  <div class="figure-svg-container">
    <svg viewBox="0 0 760 310" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Первая теорема Больцано-Коши и алгоритм дихотомии">
      <defs>
        <marker id="arr-axis14" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="var(--svg-axis)"/>
        </marker>
        <linearGradient id="grad-bisection" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="var(--accent-gold)" stop-opacity="0.35"/>
          <stop offset="50%" stop-color="var(--accent-gold)" stop-opacity="0.15"/>
          <stop offset="100%" stop-color="var(--svg-stroke-emerald)" stop-opacity="0.35"/>
        </linearGradient>
      </defs>

      <!-- Фон и рамка -->
      <rect x="25" y="20" width="710" height="270" rx="10" fill="var(--svg-bg)" stroke="var(--border-subtle)" stroke-width="1.2"/>

      <!-- Сетка координат -->
      <line x1="60" y1="70" x2="700" y2="70" stroke="var(--svg-grid)" stroke-width="1" stroke-dasharray="4 4"/>
      <line x1="60" y1="250" x2="700" y2="250" stroke="var(--svg-grid)" stroke-width="1" stroke-dasharray="4 4"/>

      <!-- Оси координат -->
      <line x1="55" y1="160" x2="710" y2="160" stroke="var(--svg-axis)" stroke-width="1.6" marker-end="url(#arr-axis14)"/>
      <line x1="90" y1="265" x2="90" y2="40" stroke="var(--svg-axis)" stroke-width="1.6" marker-end="url(#arr-axis14)"/>
      <text x="710" y="174" font-family="'Cormorant Garamond', serif" font-size="18" font-style="italic" fill="var(--svg-text)">x</text>
      <text x="78" y="48" font-family="'Cormorant Garamond', serif" font-size="18" font-style="italic" fill="var(--svg-text)">y</text>
      <text x="76" y="174" font-family="'Cormorant Garamond', serif" font-size="14" fill="var(--text-muted)">O</text>

      <!-- Плавный график непрерывной функции -->
      """ + f'<path d="{path_curve}" fill="none" stroke="var(--svg-stroke-gold)" stroke-width="2.8" stroke-linecap="round"/>' + """

      <!-- Концы исходного отрезка [a, b] -->
      <!-- Точка A: x = 140, y = 236 (f(a) < 0) -->
      <line x1="140" y1="160" x2="140" y2="236" stroke="var(--border-medium)" stroke-width="1.2" stroke-dasharray="3 3"/>
      <circle cx="140" cy="160" r="3" fill="var(--svg-axis)"/>
      <circle cx="140" cy="236" r="5" fill="var(--svg-stroke-gold)"/>
      <text x="133" y="152" font-family="'Cinzel', serif" font-size="14" font-weight="700" fill="var(--text-gold)">a</text>
      <text x="150" y="246" font-family="'Cormorant Garamond', serif" font-size="14" font-style="italic" fill="var(--warn-accent)">f(a) &lt; 0</text>

      <!-- Точка B: x = 620, y = 84 (f(b) > 0) -->
      <line x1="620" y1="84" x2="620" y2="160" stroke="var(--border-medium)" stroke-width="1.2" stroke-dasharray="3 3"/>
      <circle cx="620" cy="160" r="3" fill="var(--svg-axis)"/>
      <circle cx="620" cy="84" r="5" fill="var(--svg-stroke-gold)"/>
      <text x="615" y="178" font-family="'Cinzel', serif" font-size="14" font-weight="700" fill="var(--text-gold)">b</text>
      <text x="630" y="88" font-family="'Cormorant Garamond', serif" font-size="14" font-style="italic" fill="var(--svg-stroke-emerald)">f(b) &gt; 0</text>

      <!-- Первая бисекция: середина c0 = (140 + 620)/2 = 380 -->
      <!-- В x = 380 корень ровно на оси! Добавим промежуточный шаг c0 = 420 (f(c0) > 0) -->
      <line x1="435" y1="128" x2="435" y2="160" stroke="var(--svg-stroke-cyan)" stroke-width="1.3" stroke-dasharray="2 2"/>
      <circle cx="435" cy="128" r="4" fill="var(--svg-stroke-cyan)"/>
      <circle cx="435" cy="160" r="3" fill="var(--svg-stroke-cyan)"/>
      <text x="428" y="178" font-family="'Cinzel', serif" font-size="13" font-weight="600" fill="var(--svg-stroke-cyan)">c₀</text>
      <text x="444" y="132" font-family="'Cormorant Garamond', serif" font-size="12" font-style="italic" fill="var(--svg-stroke-cyan)">f(c₀) &gt; 0</text>

      <!-- Стягивающаяся область на оси Ox -->
      <rect x="140" y="156" width="295" height="8" rx="4" fill="url(#grad-bisection)"/>
      <text x="210" y="148" font-family="'Cormorant Garamond', serif" font-size="12.5" font-style="italic" fill="var(--text-gold)">
        [a₁, b₁] — сохранение разных знаков
      </text>

      <!-- Истинный предельный корень c: x = 380, y = 160 -->
      <circle cx="380" cy="160" r="6" fill="var(--svg-stroke-emerald)" stroke="#ffffff" stroke-width="2"/>
      <text x="374" y="145" font-family="'Cinzel', serif" font-size="17" font-weight="700" fill="var(--svg-stroke-emerald)">c</text>
      <text x="335" y="198" font-family="'Cormorant Garamond', serif" font-size="15" font-weight="600" font-style="italic" fill="var(--svg-stroke-emerald)">
        f(c) = lim f(aₙ) = 0
      </text>

      <!-- Академическая плашка метода дихотомии -->
      <rect x="490" y="215" width="225" height="58" rx="6" fill="var(--bg-surface-elevated)" stroke="var(--border-strong)" stroke-width="1"/>
      <text x="502" y="236" font-family="'Cinzel', serif" font-size="12" font-weight="700" fill="var(--text-gold)">МЕТОД БИСЕКЦИИ КАНТОРА</text>
      <text x="502" y="254" font-family="'Cormorant Garamond', serif" font-size="13" font-style="italic" fill="var(--text-secondary)">
        bₙ - aₙ = (b - a)/2ⁿ → 0  (n → ∞)
      </text>
      <text x="502" y="268" font-family="'Cormorant Garamond', serif" font-size="12" fill="var(--text-muted)">
        Погрешность: |c - cₙ| ≤ (b - a)/2ⁿ⁺¹
      </text>
    </svg>
  </div>
  <figcaption class="figure-caption">
    <strong>ГРАВЮРА 14.1.</strong> Геометрическая визуализация первой теоремы Больцано–Коши. Непрерывная траектория $y = f(x)$, связывающая разнознаковые концы $f(a) < 0$ и $f(b) > 0$, неминуемо пересекает координатную ось. Конструктивный метод дихотомии стягивает систему вложенных отрезков к единственному предельному нулю $c \in (a, b)$.
  </figcaption>
</figure>"""
    return svg

def generate_svg_14_2():
    """
    Гравюра 14.2: Теоремы Вейерштрасса и непрерывный образ отрезка
    """
    # График с выраженным глобальным максимумом M и минимумом m
    # Окно: x от 130 до 670.
    # a = 140, b = 660.
    # Максимум x* = 310, y = 55.
    # Минимум x_* = 520, y = 265.
    pts = []
    for i in range(120):
        t = i / 119.0
        x = 135 + t * (665 - 135)
        # Параметрическая полигармоническая кривая с гладкими вершинами
        val = math.sin(2.7 * t + 0.3) + 0.35 * math.cos(5.4 * t)
        # масштабируем val в диапазон [55..265]
        # при t ≈ 0.32: max -> y ≈ 55
        # при t ≈ 0.74: min -> y ≈ 265
        y = 160 - val * 95
        pts.append((x, y))
    path_curve = "M " + " L ".join(f"{x:.1f},{y:.1f}" for x, y in pts)

    svg = """<figure class="figure-card">
  <div class="figure-svg-container">
    <svg viewBox="0 0 760 320" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Теоремы Вейерштрасса и образ отрезка">
      <defs>
        <marker id="arr-axis14b" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="var(--svg-axis)"/>
        </marker>
        <linearGradient id="grad-image-y" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--text-gold-bright)"/>
          <stop offset="50%" stop-color="var(--accent-gold)"/>
          <stop offset="100%" stop-color="var(--text-gold)"/>
        </linearGradient>
      </defs>

      <!-- Рамка -->
      <rect x="25" y="20" width="710" height="280" rx="10" fill="var(--svg-bg)" stroke="var(--border-subtle)" stroke-width="1.2"/>

      <!-- Оси -->
      <line x1="55" y1="180" x2="710" y2="180" stroke="var(--svg-axis)" stroke-width="1.6" marker-end="url(#arr-axis14b)"/>
      <line x1="95" y1="285" x2="95" y2="35" stroke="var(--svg-axis)" stroke-width="1.6" marker-end="url(#arr-axis14b)"/>
      <text x="710" y="194" font-family="'Cormorant Garamond', serif" font-size="18" font-style="italic" fill="var(--svg-text)">x</text>
      <text x="82" y="44" font-family="'Cormorant Garamond', serif" font-size="18" font-style="italic" fill="var(--svg-text)">y</text>
      <text x="80" y="195" font-family="'Cormorant Garamond', serif" font-size="14" fill="var(--text-muted)">O</text>

      <!-- НЕПРЕРЫВНЫЙ ОБРАЗ f([a, b]) = [m, M] НА ОСИ Oy -->
      <rect x="91" y="58" width="8" height="204" rx="4" fill="url(#grad-image-y)"/>
      <!-- Ограничители экстремумов на оси Oy -->
      <circle cx="95" cy="58" r="4.5" fill="var(--text-gold-bright)"/>
      <circle cx="95" cy="262" r="4.5" fill="var(--accent-gold)"/>
      <text x="32" y="62" font-family="'Cinzel', serif" font-size="13" font-weight="700" fill="var(--text-gold-bright)">M = sup f</text>
      <text x="35" y="266" font-family="'Cinzel', serif" font-size="13" font-weight="700" fill="var(--text-gold)">m = inf f</text>

      <!-- График функции -->
      """ + f'<path d="{path_curve}" fill="none" stroke="var(--svg-stroke-cyan)" stroke-width="2.8" stroke-linecap="round"/>' + """

      <!-- Проекции максимума M в точке x* (x = 300, y = 58) -->
      <line x1="95" y1="58" x2="300" y2="58" stroke="var(--border-medium)" stroke-width="1.2" stroke-dasharray="3 3"/>
      <line x1="300" y1="58" x2="300" y2="180" stroke="var(--border-medium)" stroke-width="1.2" stroke-dasharray="3 3"/>
      <circle cx="300" cy="58" r="5" fill="var(--text-gold-bright)" stroke="#ffffff" stroke-width="1.5"/>
      <circle cx="300" cy="180" r="3" fill="var(--svg-axis)"/>
      <text x="294" y="198" font-family="'Cormorant Garamond', serif" font-size="16" font-style="italic" font-weight="700" fill="var(--text-gold)">x*</text>
      <text x="270" y="48" font-family="'Cormorant Garamond', serif" font-size="13" font-weight="600" fill="var(--text-gold-bright)">f(x*) = M (max)</text>

      <!-- Проекции минимума m в точке x_* (x = 525, y = 262) -->
      <line x1="95" y1="262" x2="525" y2="262" stroke="var(--border-medium)" stroke-width="1.2" stroke-dasharray="3 3"/>
      <line x1="525" y1="180" x2="525" y2="262" stroke="var(--border-medium)" stroke-width="1.2" stroke-dasharray="3 3"/>
      <circle cx="525" cy="262" r="5" fill="var(--accent-gold)" stroke="#ffffff" stroke-width="1.5"/>
      <circle cx="525" cy="180" r="3" fill="var(--svg-axis)"/>
      <text x="519" y="174" font-family="'Cormorant Garamond', serif" font-size="16" font-style="italic" font-weight="700" fill="var(--text-gold)">x⁎</text>
      <text x="535" y="275" font-family="'Cormorant Garamond', serif" font-size="13" font-weight="600" fill="var(--accent-gold)">f(x⁎) = m (min)</text>

      <!-- Границы отрезка [a, b] -->
      <line x1="135" y1="180" x2="135" y2="210" stroke="var(--border-strong)" stroke-width="1.2" stroke-dasharray="2 2"/>
      <circle cx="135" cy="180" r="3.5" fill="var(--svg-axis)"/>
      <text x="130" y="198" font-family="'Cinzel', serif" font-size="14" font-weight="700" fill="var(--svg-text)">a</text>

      <line x1="665" y1="135" x2="665" y2="180" stroke="var(--border-strong)" stroke-width="1.2" stroke-dasharray="2 2"/>
      <circle cx="665" cy="180" r="3.5" fill="var(--svg-axis)"/>
      <text x="660" y="198" font-family="'Cinzel', serif" font-size="14" font-weight="700" fill="var(--svg-text)">b</text>

      <!-- Горизонталь промежуточного значения C (Вторая теорема Больцано-Коши) -->
      <line x1="95" y1="140" x2="675" y2="140" stroke="var(--svg-stroke-emerald)" stroke-width="1.4" stroke-dasharray="4 4"/>
      <circle cx="95" cy="140" r="3" fill="var(--svg-stroke-emerald)"/>
      <text x="75" y="144" font-family="'Cormorant Garamond', serif" font-size="15" font-style="italic" font-weight="700" fill="var(--svg-stroke-emerald)">C</text>
      <!-- Точки пересечения y = C -->
      <circle cx="195" cy="140" r="4" fill="var(--svg-stroke-emerald)"/>
      <circle cx="430" cy="140" r="4" fill="var(--svg-stroke-emerald)"/>
      <circle cx="650" cy="140" r="4" fill="var(--svg-stroke-emerald)"/>
      <text x="440" y="132" font-family="'Cormorant Garamond', serif" font-size="12" font-style="italic" fill="var(--svg-stroke-emerald)">f(c) = C (3 корня)</text>
    </svg>
  </div>
  <figcaption class="figure-caption">
    <strong>ГРАВЮРА 14.2.</strong> Теоремы Вейерштрасса и непрерывный образ отрезка. На компакте $[a, b]$ непрерывная функция гарантированно достигает своих точных граней: глобального максимума $M = f(x^*)$ и минимума $m = f(x_*)$. Проекция графика образует сплошной замкнутый отрезок $[m, M]$ на оси ординат, а любое промежуточное значение $C \in (m, M)$ достигается хотя бы в одной точке (вторая теорема Больцано–Коши).
  </figcaption>
</figure>"""
    return svg

def main():
    print("Generating high-precision SVGs...")
    svg14_1 = generate_svg_14_1()
    svg14_2 = generate_svg_14_2()
    svg15_1 = generate_svg_15_1()
    svg15_2 = generate_svg_15_2()
    print("Done! All 4 SVGs generated successfully.")

if __name__ == '__main__':
    main()
