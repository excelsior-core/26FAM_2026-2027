# -*- coding: utf-8 -*-
"""
scripts/convert_all_algebra_lectures.py
Приведение всех 10 лекций по алгебре к единому элитному стандарту GENESIS (стиль «Караваджо»)
с интерактивным оглавлением, переключением тем, collapsible proof-blocks (<details>)
и кнопками управления доказательствами («◈ Свернуть док-ва», «◈ Развернуть все»).
"""

import os
import re

# Определение метаданных для всех лекций
LECTURES_METADATA = [
    {
        "folder": "01 02.09.2026 02 04.09.2026 Поле комплексных чисел и модель Гамильтона",
        "html_file": "А_1-2__Лекции_Gemini.html",
        "number": "01–02",
        "title": "Поле комплексных чисел и модель Гамильтона",
        "title_html": "ПОЛЕ КОМПЛЕКСНЫХ ЧИСЕЛ И <span class=\"gold-phrase\">МОДЕЛЬ ГАМИЛЬТОНА</span>",
        "date": "2, 4 сентября 2026",
        "lead": "Строгое аксиоматическое построение поля комплексных чисел через упорядоченные пары Гамильтона, "
                "доказательство аксиом поля, вывод алгебраической формы, свойства мнимой единицы, алгебра "
                "комплексного сопряжения и метрические свойства модуля."
    },
    {
        "folder": "03 11.09.2026 Тригонометрическая форма и формула Муавра",
        "html_file": "А_3__Лекция_Gemini.html",
        "number": "03",
        "title": "Тригонометрическая форма и формула Муавра",
        "title_html": "ТРИГОНОМЕТРИЧЕСКАЯ ФОРМА И <span class=\"gold-phrase\">ФОРМУЛА МУАВРА</span>",
        "date": "11 сентября 2026",
        "lead": "Полярные координаты на комплексной плоскости, главное значение аргумента, оператор поворота, "
                "теорема об умножении и делении в тригонометрической форме, строгий вывод формулы Муавра "
                "и аналитическое доказательство неравенства треугольника."
    },
    {
        "folder": "04 16.09.2026 05 18.09.2026 Делимость, сравнения и кольцо классов вычетов",
        "html_file": "А_4-5__Лекции_Gemini.html",
        "number": "04–05",
        "title": "Делимость, сравнения и кольцо классов вычетов",
        "title_html": "ДЕЛИМОСТЬ, СРАВНЕНИЯ И <span class=\"gold-phrase\">КОЛЬЦО КЛАССОВ ВЫЧЕТОВ</span>",
        "date": "16, 18 сентября 2026",
        "lead": "Теория делимости в кольце целых чисел, строгое доказательство теоремы о делении с остатком, "
                "отношение сравнимости по модулю, алгебраическая структура кольца классов вычетов Z_m и критерий поля."
    },
    {
        "folder": "06 25.09.2026 НОД, тождество Безу и алгоритм Евклида",
        "html_file": "А_6__Лекция_Gemini.html",
        "number": "06",
        "title": "НОД, тождество Безу и алгоритм Евклида",
        "title_html": "НАИБОЛЬШИЙ ОБЩИЙ ДЕЛИТЕЛЬ, <span class=\"gold-phrase\">ТОЖДЕСТВО БЕЗУ И АЛГОРИТМ ЕВКЛИДА</span>",
        "date": "25 сентября 2026",
        "lead": "Аксиоматика наибольшего общего делителя, алгоритм Евклида с доказательством корректности и конечности, "
                "конструктивное доказательство тождества Безу обратным ходом и фундаментальные свойства взаимно простых чисел."
    },
    {
        "folder": "07 30.09.2026 Простые числа и основная теорема арифметики",
        "html_file": "А_7__Лекция_Gemini.html",
        "number": "07",
        "title": "Простые числа и основная теорема арифметики",
        "title_html": "ПРОСТЫЕ ЧИСЛА И <span class=\"gold-phrase\">ОСНОВНАЯ ТЕОРЕМА АРИФМЕТИКИ</span>",
        "date": "30 сентября 2026",
        "lead": "Наименьший простой делитель и оценка p <= sqrt(n), лемма Евклида о делении произведения, "
                "полное индуктивное доказательство существования и единственности канонического разложения ОТА, "
                "теорема Евклида о бесконечности простых чисел и мультипликативные функции тау и сигма."
    },
    {
        "folder": "08 02.10.2026 Корни из единицы и первообразные корни",
        "html_file": "lecture-08-roots-of-unity.html",
        "number": "08",
        "title": "Корни из единицы и первообразные корни",
        "title_html": "КОРНИ ИЗ ЕДИНИЦЫ И <span class=\"gold-phrase\">ПЕРВООБРАЗНЫЕ КОРНИ</span>",
        "date": "2 октября 2026",
        "lead": "Множество корней из единицы U_n и его геометрия в виде правильного n-угольника, циклическая группа "
                "корней, определение первообразного корня, критерий первообразности gcd(k, n) = 1 со строгим "
                "доказательством и выражение корней произвольного комплексного числа."
    },
    {
        "folder": "09 09.10.2026 Системы линейных уравнений и метод Гаусса",
        "html_file": "А_9__Лекция_Gemini.html",
        "number": "09",
        "title": "Системы линейных уравнений и метод Гаусса",
        "title_html": "СИСТЕМЫ ЛИНЕЙНЫХ УРАВНЕНИЙ И <span class=\"gold-phrase\">МЕТОД ГАУССА</span>",
        "date": "9 октября 2026",
        "lead": "Матричный аппарат СЛАУ, элементарные преобразования строк расширенной матрицы и доказательство их "
                "обратимости, ступенчатый вид матрицы и строгий индуктивный алгоритм прямого хода метода Гаусса."
    },
    {
        "folder": "10 14.10.2026 Критерий совместности СЛАУ и структура решений",
        "html_file": "А_10__Лекция_Gemini.html",
        "number": "10",
        "title": "Критерий совместности СЛАУ и структура решений",
        "title_html": "КРИТЕРИЙ СОВМЕСТНОСТИ СЛАУ И <span class=\"gold-phrase\">СТРУКТУРА РЕШЕНИЙ</span>",
        "date": "14 октября 2026",
        "lead": "Критерий совместности ступенчатой системы уравнений с полным доказательством, разделение неизвестных на "
                "главные и свободные, теоремы о единственности (r = n) и бесконечности (r < n) множества решений, "
                "а также теория однородных СЛАУ и нетривиальных решений при m < n."
    },
    {
        "folder": "11 16.10.2026 Определители, правило Крамера и перестановки",
        "html_file": "А_11__Лекция_Gemini.html",
        "number": "11",
        "title": "Определители, правило Крамера и перестановки",
        "title_html": "ОПРЕДЕЛИТЕЛИ 2-ГО И 3-ГО ПОРЯДКОВ, <span class=\"gold-phrase\">ПРАВИЛО КРАМЕРА И ПЕРЕСТАНОВКИ</span>",
        "date": "16 октября 2026",
        "lead": "Определители 2-го и 3-го порядков, геометрический смысл ориентированной площади и объема, "
                "строгий алгебраический вывод формул Крамера для систем 2x2, правило треугольников Саррюса "
                "и введение в комбинаторную теорию перестановок конечных множеств."
    },
    {
        "folder": "12 23.10.2026 Теория перестановок, подстановок и четность",
        "html_file": "lecture-12-permutations-substitutions.html",
        "number": "12",
        "title": "Теория перестановок, подстановок и четность",
        "title_html": "ТЕОРИЯ ПЕРЕСТАНОВОК И ПОДСТАНОВОК: <span class=\"gold-phrase\">ЧЁТНОСТЬ И СИММЕТРИЧЕСКАЯ ГРУППА</span>",
        "date": "23 октября 2026",
        "lead": "Комбинаторная теория перестановок, транспозиции, закон сохранения чётности при транспозициях "
                "(сведение к 2s+1 соседним транспозициям), знакопеременная группа A_n и циклическое разложение."
    }
]

def find_matching_close_tag(html, start_pos, tag='div'):
    open_tag_start = f'<{tag}'
    close_tag = f'</{tag}>'
    pos = html.find('>', start_pos) + 1
    depth = 1
    
    tag_re = re.compile(rf'(<{tag}[\s>]|</{tag}>)', re.IGNORECASE)
    for m in tag_re.finditer(html, pos):
        match_str = m.group(1).lower()
        if match_str.startswith(open_tag_start):
            depth += 1
        elif match_str == close_tag:
            depth -= 1
            if depth == 0:
                return m.end()
    return -1

def get_prepared_template():
    with open("GENESIS/template-lecture.html", "r", encoding="utf-8") as f:
        template = f.read()

    # Встраиваем кнопки управления доказательствами в док
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

    # Встраиваем функцию toggleAllProofs
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

    return template

def generate_lecture_8_body():
    return """
    <section class="lecture-section" id="roots-of-unity">
      <div class="kicker-label">✦ РАЗДЕЛ 01 ✦</div>
      <h2>1. Множество корней из единицы и геометрическое представление</h2>

      <p><span class="drop-cap">К</span>орни из единицы образуют фундаментальный математический мост между тригонометрией, комплексным анализом и абстрактной теорией групп. В поле действительных чисел $\\mathbb{R}$ корень $n$-й степени из 1 принимает значение $1$ (при нечетных $n$) или $\\pm 1$ (при четных $n$). В поле комплексных чисел $\\mathbb{C}$ уравнение степени $n$ всегда имеет ровно $n$ попарно различных решений, образующих исключительную геометрическую структуру правильного $n$-угольника.</p>

      <div class="callout callout-def">
        <div class="callout-header">
          <span class="callout-tag">Определение 8.1</span>
          <span class="callout-title">Множество корней степени $n$ из единицы</span>
        </div>
        <div class="callout-body">
          <strong>Множеством корней степени $n$ из единицы</strong> называется множество всех комплексных чисел, $n$-я степень которых равна 1:
          $$U_n = \\{ z \\in \\mathbb{C} \\mid z^n = 1 \\}.$$
          Записывая число $1$ в тригонометрической форме $1 = \\cos 0 + i \\sin 0 = 1 \\cdot e^{i \\cdot 0}$, по формуле Муавра для корней получаем явный вид:
          $$\\varepsilon_k = \\cos \\frac{2\\pi k}{n} + i \\sin \\frac{2\\pi k}{n} = e^{i \\frac{2\\pi k}{n}}, \\quad k = 0, 1, 2, \\dots, n - 1.$$
          Следовательно:
          $$U_n = \\{ \\varepsilon_0, \\varepsilon_1, \\dots, \\varepsilon_{n-1} \\}.$$
        </div>
      </div>

      <div class="callout callout-thm">
        <div class="callout-header">
          <span class="callout-tag">Теорема 8.1</span>
          <span class="callout-title">О геометрическом расположении корней из единицы</span>
        </div>
        <div class="callout-body">
          Все $n$ корней степени $n$ из единицы расположены на единичной окружности с центром в начале координат (радиуса $R = 1$) в вершинах <strong>правильного $n$-угольника</strong>, вписанного в эту окружность, причем одна из его вершин лежит на действительной оси в точке с координатами $(1, 0)$ (корень $\\varepsilon_0 = 1$).
        </div>
      </div>

      <div class="callout callout-remark">
        <div class="callout-header">
          <span class="callout-tag">Интуиция Караваджо</span>
          <span class="callout-title">Симметрия единичного круга</span>
        </div>
        <div class="callout-body">
          Угол между любыми двумя соседними корнями $\\varepsilon_k$ и $\\varepsilon_{k+1}$ постоянен и равен $\\Delta \\varphi = \\frac{2\\pi}{n}$. В силу симметрии правильного $n$-угольника центр масс всех его вершин совпадает с началом координат, откуда немедленно следует замечательное тождество для суммы всех корней:
          $$\\sum_{k=0}^{n-1} \\varepsilon_k = 0 \\quad (\\text{при } n \\ge 2).$$
        </div>
      </div>

      <div class="engraved-divider">✦ ──────── ◈ ──────── ✦</div>

      <div class="kicker-label">✦ РАЗДЕЛ 02 ✦</div>
      <h2>2. Групповые свойства множества $U_n$</h2>

      <div class="callout callout-thm">
        <div class="callout-header">
          <span class="callout-tag">Теорема 8.2</span>
          <span class="callout-title">Мультипликативная группа корней из единицы</span>
        </div>
        <div class="callout-body">
          Множество корней из единицы $U_n$ относительно стандартной операции умножения комплексных чисел образует <strong>абелеву группу</strong> порядка $n$.<br>
          Группа $(U_n, \\cdot)$ обладает свойствами:
          <ol style="margin: 0.6rem 0 0 1.2rem; padding: 0;">
            <li><strong>Единичный элемент:</strong> $1 = \\varepsilon_0 \\in U_n$, так как $1^n = 1$.</li>
            <li><strong>Замкнутость:</strong> Произведение двух корней из $U_n$ является корнем из $U_n$: $z_1, z_2 \\in U_n \\implies z_1 z_2 \\in U_n$.</li>
            <li><strong>Обратный элемент:</strong> Для любого $z \\in U_n$ обратный элемент $z^{-1} = \\bar{z} \\in U_n$.</li>
          </ol>
        </div>
      </div>

      <details class="proof-block">
        <summary>Строгое доказательство групповых свойств $(U_n, \\cdot)$</summary>
        <div class="proof-content">
          <p><strong>1. Нейтральный элемент:</strong> $1^n = 1 \\implies 1 \\in U_n$. Для любого $z \\in U_n$ имеем $z \\cdot 1 = z$.</p>
          <p><strong>2. Замкнутость:</strong> Пусть $z_1, z_2 \\in U_n$, то есть $z_1^n = 1$ и $z_2^n = 1$. По свойству возведения произведения в степень:</p>
          $$(z_1 z_2)^n = z_1^n \\cdot z_2^n = 1 \\cdot 1 = 1 \\implies z_1 z_2 \\in U_n.$$
          <p><strong>3. Обратный элемент:</strong> Пусть $z \\in U_n$, то есть $z^n = 1$. Так как $z \\ne 0$, обратный элемент $z^{-1}$ существует в $\\mathbb{C}$. Возведем его в $n$-ю степень:</p>
          $$(z^{-1})^n = (z^n)^{-1} = 1^{-1} = 1 \\implies z^{-1} \\in U_n.$$
          <p>В явном виде для $\\varepsilon_k$: $(\\varepsilon_k)^{-1} = \\varepsilon_{n-k} = \\overline{\\varepsilon_k}$.</p>
          <p>Ассоциативность и коммутативность умножения наследуются из поля $\\mathbb{C}$. Следовательно, $(U_n, \\cdot)$ — абелева группа.</p>
          <span class="qed">$\\blacksquare$</span>
        </div>
      </details>

      <div class="engraved-divider">✦ ──────── ◈ ──────── ✦</div>

      <div class="kicker-label">✦ РАЗДЕЛ 03 ✦</div>
      <h2>3. Первообразные (примитивные) корни и критерий первообразности</h2>

      <div class="callout callout-def">
        <div class="callout-header">
          <span class="callout-tag">Определение 8.2</span>
          <span class="callout-title">Первообразный корень</span>
        </div>
        <div class="callout-body">
          Корень $\\varepsilon \\in U_n$ называется <strong>первообразным (примитивным) корнем степени $n$ из единицы</strong>, если его наименьший положительный порядок равен в точности $n$, то есть:
          $$\\varepsilon^n = 1 \\quad \\text{и} \\quad \\varepsilon^m \\ne 1 \\; \\text{для всех} \\; 0 < m < n.$$
          Иными словами, $\\varepsilon$ не является корнем никакой меньшей натуральной степени из единицы.
        </div>
      </div>

      <div class="callout callout-example">
        <div class="callout-header">
          <span class="callout-tag">Пример 8.1</span>
          <span class="callout-title">Анализ корней 6-й степени из единицы ($n = 6$)</span>
        </div>
        <div class="callout-body">
          Выпишем все 6 корней степени 6: $\\varepsilon_k = \\cos \\frac{2\\pi k}{6} + i \\sin \\frac{2\\pi k}{6} = \\cos \\frac{\\pi k}{3} + i \\sin \\frac{\\pi k}{3}$:
          $$\\begin{aligned}
          \\varepsilon_0 &= \\cos 0 + i \\sin 0 = 1, &&\\text{порядок } 1; \\\\
          \\varepsilon_1 &= \\cos \\frac{\\pi}{3} + i \\sin \\frac{\\pi}{3} = \\frac{1}{2} + \\frac{\\sqrt{3}}{2}i, &&\\text{порядок } 6 \\; (\\text{первообразный!}); \\\\
          \\varepsilon_2 &= \\cos \\frac{2\\pi}{3} + i \\sin \\frac{2\\pi}{3} = -\\frac{1}{2} + \\frac{\\sqrt{3}}{2}i, &&\\varepsilon_2^3 = 1 \\implies \\text{порядок } 3; \\\\
          \\varepsilon_3 &= \\cos \\pi + i \\sin \\pi = -1, &&\\varepsilon_3^2 = 1 \\implies \\text{порядок } 2; \\\\
          \\varepsilon_4 &= \\cos \\frac{4\\pi}{3} + i \\sin \\frac{4\\pi}{3} = -\\frac{1}{2} - \\frac{\\sqrt{3}}{2}i, &&\\varepsilon_4^3 = 1 \\implies \\text{порядок } 3; \\\\
          \\varepsilon_5 &= \\cos \\frac{5\\pi}{3} + i \\sin \\frac{5\\pi}{3} = \\frac{1}{2} - \\frac{\\sqrt{3}}{2}i, &&\\text{порядок } 6 \\; (\\text{первообразный!}).
          \\end{aligned}$$
          Следовательно, первообразными корнями 6-й степени являются только $\\varepsilon_1$ и $\\varepsilon_5$. Обратим внимание: их индексы $1$ и $5$ — это в точности числа, взаимно простые с $6$!
        </div>
      </div>

      <div class="callout callout-thm">
        <div class="callout-header">
          <span class="callout-tag">Теорема 8.3</span>
          <span class="callout-title">Критерий первообразного корня</span>
        </div>
        <div class="callout-body">
          Корень $\\varepsilon_k = \\cos \\frac{2\\pi k}{n} + i \\sin \\frac{2\\pi k}{n}$ является первообразным корнем степени $n$ тогда и только тогда, когда его номер $k$ взаимно прост с показателем степени $n$:
          $$\\gcd(k, n) = 1.$$
          <em>Следствие:</em> Количество первообразных корней степени $n$ равно значению функции Эйлера $\\varphi(n)$.
        </div>
      </div>

      <details class="proof-block">
        <summary>Строгое доказательство критерия первообразности корня в обе стороны</summary>
        <div class="proof-content">
          <p>Рассмотрим возведение $\\varepsilon_k$ в степень $m$ ($m \\in \\mathbb{N}$):</p>
          $$(\\varepsilon_k)^m = \\cos \\frac{2\\pi k m}{n} + i \\sin \\frac{2\\pi k m}{n}.$$
          <p>Условие $(\\varepsilon_k)^m = 1$ равносильно тому, что аргумент кратен $2\\pi$:</p>
          $$\\frac{2\\pi k m}{n} = 2\\pi t \\; (t \\in \\mathbb{Z}) \\iff k m = n t \\iff n \\mid k m.$$

          <p><strong>Необходимость ($\implies$):</strong></p>
          <p>Пусть $\\varepsilon_k$ — первообразный корень. Предположим противное: $\\gcd(k, n) = d > 1$.</p>
          <p>Тогда $n = n_1 d$ и $k = k_1 d$, где $n_1 = \\frac{n}{d} < n$.</p>
          <p>Возведем $\\varepsilon_k$ в степень $n_1$:</p>
          $$(\\varepsilon_k)^{n_1} = \\cos \\frac{2\\pi (k_1 d) n_1}{n_1 d} + i \\sin \\frac{2\\pi (k_1 d) n_1}{n_1 d} = \\cos(2\\pi k_1) + i \\sin(2\\pi k_1) = 1.$$
          <p>Но $0 < n_1 < n$, что противоречит определению первообразного корня (он не может давать 1 в степени, меньшей $n$).</p>
          <p>Следовательно, предположение неверно, и $\\gcd(k, n) = 1$.</p>

          <p><strong>Достаточность ($\impliedby$):</strong></p>
          <p>Пусть $\\gcd(k, n) = 1$. Предположим, что $(\\varepsilon_k)^m = 1$ для некоторого $m \\in \\mathbb{N}$.</p>
          <p>Тогда $n \\mid km$. Но числа $k$ и $n$ взаимно просты! По лемме Евклида, если $n$ делит $km$ и $\\gcd(k, n) = 1$, то $n$ обязано делить $m$ ($n \\mid m$).</p>
          <p>Отсюда следует, что $m \\ge n$. Значит, ни для какого $0 < m < n$ равенство $(\\varepsilon_k)^m = 1$ невозможно. По определению, корень $\\varepsilon_k$ первообразный!</p>
          <span class="qed">$\\blacksquare$</span>
        </div>
      </details>

      <div class="engraved-divider">✦ ──────── ◈ ──────── ✦</div>

      <div class="kicker-label">✦ РАЗДЕЛ 04 ✦</div>
      <h2>4. Порождение группы $U_n$ и циклическая структура</h2>

      <div class="callout callout-thm">
        <div class="callout-header">
          <span class="callout-tag">Теорема 8.4</span>
          <span class="callout-title">О выражении корней через первообразный корень</span>
        </div>
        <div class="callout-body">
          Пусть $\\varepsilon$ — произвольный первообразный корень степени $n$ из единицы. Тогда любой корень из единицы является некоторой степенью корня $\\varepsilon$:
          $$U_n = \\{ \\varepsilon^0, \\varepsilon^1, \\varepsilon^2, \\dots, \\varepsilon^{n-1} \\}.$$
          Следовательно, группа $U_n$ является <strong>циклической группой</strong> порядка $n$:
          $$U_n = \\langle \\varepsilon \\rangle \\cong (\\mathbb{Z}_n, +).$$
        </div>
      </div>

      <details class="proof-block">
        <summary>Строгое доказательство теоремы о порождении циклической группы</summary>
        <div class="proof-content">
          <p>Рассмотрим множество степеней $M = \\{ \\varepsilon^0, \\varepsilon^1, \\dots, \\varepsilon^{n-1} \\}$. По свойству замкнутости все эти степени лежат в $U_n$, то есть $M \\subseteq U_n$.</p>
          <p>Покажем, что все $n$ элементов множества $M$ попарно различны. Предположим противное: пусть $\\varepsilon^s = \\varepsilon^k$ для некоторых $0 \\le k < s \\le n - 1$.</p>
          <p>Умножим обе части равенства на $(\\varepsilon^k)^{-1}$:</p>
          $$\\varepsilon^{s - k} = 1.$$
          <p>Но разность $m = s - k$ удовлетворяет строгому неравенству $0 < s - k < n$. Это противоречит тому, что $\\varepsilon$ — первообразный корень степени $n$ (он не может давать 1 при степени $0 < m < n$).</p>
          <p>Следовательно, все степени $\\varepsilon^0, \\dots, \\varepsilon^{n-1}$ различны. Множество $M$ содержит ровно $n$ элементов, и $U_n$ содержит ровно $n$ элементов. Так как $M \\subseteq U_n$ и $|M| = |U_n| = n$, то $M = U_n$.</p>
          <span class="qed">$\\blacksquare$</span>
        </div>
      </details>

      <div class="engraved-divider">✦ ──────── ◈ ──────── ✦</div>

      <div class="kicker-label">✦ РАЗДЕЛ 05 ✦</div>
      <h2>5. Выражение корней произвольного комплексного числа $z$</h2>

      <div class="callout callout-thm">
        <div class="callout-header">
          <span class="callout-tag">Теорема 8.5</span>
          <span class="callout-title">О связи корней из $z$ с корнями из единицы</span>
        </div>
        <div class="callout-body">
          Пусть $z \\in \\mathbb{C}$, $z \\ne 0$, и пусть $w$ — некоторый фиксированный корень $n$-й степени из $z$ (то есть $w^n = z$).<br>
          Тогда все $n$ корней степени $n$ из числа $z$ получаются умножением фиксированного значения $w$ на все корни степени $n$ из единицы:
          $$\\sqrt[n]{z} = \\{ w \\cdot \\varepsilon_0, \\, w \\cdot \\varepsilon_1, \\, \\dots, \\, w \\cdot \\varepsilon_{n-1} \\}.$$
          Если $\\varepsilon$ — первообразный корень степени $n$, то:
          $$\\sqrt[n]{z} = \\{ w \\cdot \\varepsilon^0, \\, w \\cdot \\varepsilon^1, \\, \\dots, \\, w \\cdot \\varepsilon^{n-1} \\}.$$
        </div>
      </div>

      <details class="proof-block">
        <summary>Строгое доказательство теоремы о выражении всех корней</summary>
        <div class="proof-content">
          <p><strong>1. Проверка того, что каждое число $w \\varepsilon_k$ является корнем из $z$:</strong></p>
          $$(w \\varepsilon_k)^n = w^n \\cdot (\\varepsilon_k)^n = z \\cdot 1 = z.$$
          <p>Значит, все элементы множества действительно являются корнями степени $n$ из $z$.</p>
          
          <p><strong>2. Попарная различность элементов:</strong></p>
          <p>Пусть $w \\varepsilon_k = w \\varepsilon_m$. Так как $z \\ne 0$, корень $w \\ne 0$. Разделив равенство на $w$, получаем $\\varepsilon_k = \\varepsilon_m \\implies k = m$. Все $n$ значений попарно различны.</p>
          <p>По теореме о числе корней, уравнение $x^n = z$ имеет ровно $n$ комплексных корней. Следовательно, набор $\\{w \\varepsilon_k\\}_{k=0}^{n-1}$ исчерпывает все корни $n$-й степени из $z$.</p>
          <span class="qed">$\\blacksquare$</span>
        </div>
      </details>

      <div class="key-takeaways">
        <div class="key-takeaways-title">Шпаргалка к лекции 8</div>
        <ul>
          <li>Множество корней: $U_n = \\{\\varepsilon_0, \\dots, \\varepsilon_{n-1}\\}$, $\\varepsilon_k = e^{i \\frac{2\\pi k}{n}}$.</li>
          <li>Геометрия: вершины правильного $n$-угольника на единичной окружности с вершиной в $(1, 0)$.</li>
          <li>Группа: $(U_n, \\cdot)$ — циклическая группа порядка $n$.</li>
          <li>Критерий первообразности: $\\varepsilon_k$ первообразный $\\iff \\gcd(k, n) = 1$. Число таких корней: $\\varphi(n)$.</li>
          <li>Выражение корней из $z$: $\\sqrt[n]{z} = \\{w \\varepsilon^0, w \\varepsilon^1, \\dots, w \\varepsilon^{n-1}\\}$.</li>
        </ul>
      </div>
    </section>
    """

def convert_lecture(meta):
    folder_path = os.path.join("Storage", "HSE", "Алгебра", "Лекции", meta["folder"])
    out_file = os.path.join(folder_path, meta["html_file"])

    template = get_prepared_template()

    # Заполняем метаданные в шаблоне
    template = template.replace("{{COURSE_NAME}}", "Алгебра")
    template = template.replace("{{LECTURE_NUMBER}}", f"Лекция {meta['number']}")
    template = template.replace("{{LECTURE_TITLE}}", meta["title"])
    template = template.replace("{{LECTURE_TITLE_HTML}}", meta["title_html"])
    template = template.replace("{{LECTURE_DATE}}", meta["date"])
    template = template.replace("{{LECTURE_SUMMARY_LEAD}}", meta["lead"])

    # Если это лекция 8, генерируем идеальное тело с нуля
    if meta["number"] == "08":
        body = generate_lecture_8_body()
        full_html = template.replace("<!-- {{CONTENT_PLACEHOLDER}} -->", body)
        with open(out_file, "w", encoding="utf-8") as f:
            f.write(full_html)
        print(f"[{meta['number']}] Generated Lecture 8: {out_file} ({len(full_html)} bytes)")
        return

    # Для остальных лекций читаем исходный HTML (предпочитаем чистый .orig)
    orig_file = out_file + ".orig"
    if os.path.exists(orig_file):
        src_file = orig_file
    elif os.path.exists(out_file):
        src_file = out_file
    else:
        htmls = [f for f in os.listdir(folder_path) if f.endswith(".html") and not f.endswith(".orig")]
        if htmls:
            src_file = os.path.join(folder_path, htmls[0])
        else:
            src_file = out_file
    
    with open(src_file, "r", encoding="utf-8") as f:
        src_html = f.read()

    # Если это лекция 12, она уже близка к Караваджо, но проверим ее и встроим кнопки dock и обновим стили
    if meta["number"] == "12":
        # Обновляем стили из шаблона
        templ_style = re.search(r'<style>(.*?)</style>', template, re.DOTALL)
        if templ_style:
            l12_html = re.sub(r'<style>.*?</style>', f"<style>{templ_style.group(1)}</style>", src_html, flags=re.DOTALL)
        else:
            l12_html = src_html

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
        if old_dock in l12_html:
            l12_html = l12_html.replace(old_dock, new_dock)

        old_script_start = """    document.addEventListener("DOMContentLoaded", function() {"""
        new_script_start = """    window.toggleAllProofs = function(open) {
      document.querySelectorAll("details.proof-block").forEach(function(d) {
        if (open) d.setAttribute("open", "");
        else d.removeAttribute("open");
      });
    };

    document.addEventListener("DOMContentLoaded", function() {"""
        if old_script_start in l12_html and "window.toggleAllProofs" not in l12_html:
            l12_html = l12_html.replace(old_script_start, new_script_start)

        with open(out_file, "w", encoding="utf-8") as f:
            f.write(l12_html)
        print(f"[{meta['number']}] Updated Lecture 12 reading dock & styles: {out_file}")
        return

    # Извлекаем содержимое <main>
    main_m = re.search(r'<main[^>]*>(.*?)</main>', src_html, re.DOTALL)
    if not main_m:
        print(f"[{meta['number']}] Error: <main> not found in {src_file}")
        return
    body = main_m.group(1)

    # Удаляем старые шапки и оглавления (включая doc-header, print-toc-container, printable-toc)
    body = re.sub(r'<header[^>]*>.*?</header>', '', body, flags=re.DOTALL | re.IGNORECASE)
    body = re.sub(r'<section[^>]*class="[^"]*print-toc[^"]*"[^>]*>.*?</section>', '', body, flags=re.DOTALL | re.IGNORECASE)
    body = re.sub(r'<section[^>]*id="document-toc"[^>]*>.*?</section>', '', body, flags=re.DOTALL | re.IGNORECASE)
    body = re.sub(r'<div[^>]*class="[^"]*print-toc[^"]*"[^>]*>.*?</div\s*>', '', body, flags=re.DOTALL | re.IGNORECASE)
    body = re.sub(r'<div[^>]*class="printable-toc-box"[^>]*>.*?</div>\s*</div>', '', body, flags=re.DOTALL | re.IGNORECASE)
    body = re.sub(r'<nav[^>]*>.*?</nav>', '', body, flags=re.DOTALL | re.IGNORECASE)

    # Преобразуем доказательства с помощью сбалансированного парсера
    proof_pattern = re.compile(
        r'<div[^>]*class="[^"]*(?:callout-proof|proof-box|box-proof|callout proof)[^"]*"[^>]*>',
        re.IGNORECASE
    )

    offset = 0
    new_body_parts = []
    last_end = 0

    while True:
        m = proof_pattern.search(body, last_end)
        if not m:
            break
        # Проверяем, не является ли это внутренним элементом
        tag_str = m.group(0).lower()
        if any(x in tag_str for x in ['proof-step', 'proof-end', 'proof-header']):
            last_end = m.end()
            continue

        end_pos = find_matching_close_tag(body, m.start(), 'div')
        if end_pos == -1:
            last_end = m.end()
            continue

        # Добавляем текст до блока доказательства
        new_body_parts.append(body[last_end:m.start()])

        block_inner = body[m.end():end_pos - 6] # отсекаем </div> в конце

        # Извлекаем заголовок, если есть
        header_text = "Строгое доказательство"
        h_match = re.search(r'<(?:div|span|h[34])[^>]*class="[^"]*(?:header|title)[^"]*"[^>]*>(.*?)</(?:div|span|h[34])>', block_inner, re.DOTALL)
        if h_match:
            clean_h = re.sub(r'<[^>]+>', '', h_match.group(1)).strip()
            if clean_h and len(clean_h) < 120 and "доказательств" not in clean_h.lower():
                header_text = f"Строгое доказательство ({clean_h})"
            elif clean_h and len(clean_h) < 120:
                header_text = clean_h
            # Удаляем заголовок из текста
            block_inner = block_inner[:h_match.start()] + block_inner[h_match.end():]

        # Удаляем метки окончания proof-end
        block_inner = re.sub(r'<div class="proof-end">.*?</div>', '', block_inner, flags=re.DOTALL)

        # Обеспечиваем символ Q.E.D.
        if '$\blacksquare$' not in block_inner and '■' not in block_inner:
            block_inner += '\n<span class="qed">$\\blacksquare$</span>'

        details_html = f'\n<details class="proof-block">\n  <summary>{header_text}</summary>\n  <div class="proof-content">\n{block_inner.strip()}\n  </div>\n</details>\n'
        new_body_parts.append(details_html)
        last_end = end_pos

    new_body_parts.append(body[last_end:])
    body = "".join(new_body_parts)

    # Нормализуем остальные типы callouts
    # Определения
    body = re.sub(r'class="[^"]*(?:definition-box|box-def|def-box|callout definition)[^"]*"', 'class="callout callout-def"', body)
    # Теоремы
    body = re.sub(r'class="[^"]*(?:theorem-box|box-thm|thm-box|callout theorem|proposition-box|box-lem|cor-box|callout corollary)[^"]*"', 'class="callout callout-thm"', body)
    # Замечания
    body = re.sub(r'class="[^"]*(?:remark-box|box-rem|note-box|callout-rem|callout-note)[^"]*"', 'class="callout callout-remark"', body)
    # Предупреждения
    body = re.sub(r'class="[^"]*(?:warning-box|box-warn|warn-box|callout-warn|callout warning)[^"]*"', 'class="callout callout-warn"', body)
    # Примеры
    body = re.sub(r'class="[^"]*(?:example-box|box-ex|ex-box|callout-ex|callout example)[^"]*"', 'class="callout callout-example"', body)

    # Проверяем буквицу drop-cap в первом абзаце
    if '<span class="drop-cap">' not in body:
        # Добавляем буквицу к первому тегу <p>
        p_match = re.search(r'<p>\s*([А-ЯA-Z])', body)
        if p_match:
            first_letter = p_match.group(1)
            body = body[:p_match.start()] + f'<p><span class="drop-cap">{first_letter}</span>' + body[p_match.start() + len(f'<p>{first_letter}'):]

    full_html = template.replace("<!-- {{CONTENT_PLACEHOLDER}} -->", body)

    with open(out_file, "w", encoding="utf-8") as f:
        f.write(full_html)
    print(f"[{meta['number']}] Successfully converted: {out_file} ({len(full_html)} bytes)")

def convert_all():
    print("Converting all Algebra lectures to Caravaggio design system with proof compactization...")
    for meta in LECTURES_METADATA:
        convert_lecture(meta)
    print("All algebra lectures converted successfully!")

if __name__ == "__main__":
    convert_all()
