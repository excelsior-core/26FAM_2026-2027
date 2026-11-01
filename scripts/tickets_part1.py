# -*- coding: utf-8 -*-
"""
Билеты 1–6 к коллоквиуму по высшей алгебре (1-й модуль, ФПМ ВШЭ).
Строгий академический стиль «Караваджо», полные доказательства,
определения, теоремы, ловушки и шпаргалки.
"""

def get_tickets_1_to_6():
    return [get_ticket_1(), get_ticket_2(), get_ticket_3(), get_ticket_4(), get_ticket_5(), get_ticket_6()]


def get_ticket_1():
    return """
    <!-- ==========================================================================
         БИЛЕТ 1: ПОЛЕ КОМПЛЕКСНЫХ ЧИСЕЛ
         ========================================================================== -->
    <section class="lecture-section" id="ticket-1">
      <div class="kicker-label">✦ БИЛЕТ 01 ✦</div>
      <h2>Билет 1. Поле комплексных чисел: модель Гамильтона, алгебраическая форма и сопряжение</h2>

      <p><span class="drop-cap">П</span>оле действительных чисел $\\mathbb{R}$, будучи полным линейно упорядоченным полем, страдает непреодолимым алгебраическим изъяном: в нем неразрешимы простейшие полиномиальные уравнения четной степени (в частности, $x^2 + 1 = 0$). Решением этой фундаментальной проблемы стало расширение вещественной числовой оси до двумерного континуума — поля комплексных чисел $\\mathbb{C}$. В данном билете строго рассматриваются аксиоматическое построение Гамильтона через упорядоченные пары, вывод алгебраической формы числа, мнимая единица и алгебраическая операция комплексного сопряжения со всеми ее инвариантами.</p>

      <h3>1.1. Аксиоматическое построение: модель упорядоченных пар Гамильтона</h3>
      <p>В строгой теории множеств введение мнимой единицы как «корня из минус единицы» методологически некорректно без предварительного доказательства непротиворечивости системы. Сэр Уильям Роуэн Гамильтон (1835 г.) предложил строгую модель, определив комплексные числа как упорядоченные пары вещественных чисел.</p>

      <div class="callout callout-def">
        <div class="callout-header">
          <span class="callout-tag">Определение 1.1</span>
          <span class="callout-title">Поле комплексных чисел (по Гамильтону)</span>
        </div>
        <div class="callout-body">
          <strong>Полем комплексных чисел</strong> называется множество $\\mathbb{C} = \\mathbb{R} \\times \\mathbb{R} = \\{(a, b) \\mid a, b \\in \\mathbb{R}\\}$, на котором заданы две бинарные операции:
          <ol style="margin: 0.6rem 0 0 1.2rem; padding: 0;">
            <li><strong>Сложение ($+$):</strong>
              $$(a_1, b_1) + (a_2, b_2) = (a_1 + a_2, \\, b_1 + b_2).$$
            </li>
            <li><strong>Умножение ($\\cdot$):</strong>
              $$(a_1, b_1) \\cdot (a_2, b_2) = (a_1 a_2 - b_1 b_2, \\, a_1 b_2 + a_2 b_1).$$
            </li>
          </ol>
          Два комплексных числа $(a_1, b_1)$ и $(a_2, b_2)$ считаются равными тогда и только тогда, когда $a_1 = a_2$ и $b_1 = b_2$.
        </div>
      </div>

      <div class="callout callout-thm">
        <div class="callout-header">
          <span class="callout-tag">Теорема 1.1</span>
          <span class="callout-title">Структура поля $(\\mathbb{C}, +, \\cdot)$</span>
        </div>
        <div class="callout-body">
          Алгебраическая система $(\\mathbb{C}, +, \\cdot)$ удовлетворяет всем девяти аксиомам поля:
          <ol style="margin: 0.6rem 0 0 1.2rem; padding: 0;">
            <li>Коммутативность сложения: $z_1 + z_2 = z_2 + z_1$.</li>
            <li>Ассоциативность сложения: $(z_1 + z_2) + z_3 = z_1 + (z_2 + z_3)$.</li>
            <li>Существование нуля: $0_\\mathbb{C} = (0, 0)$ такое, что $z + 0 = z$.</li>
            <li>Существование противоположного элемента: для $z = (a, b)$ существует $-z = (-a, -b)$ такое, что $z + (-z) = 0$.</li>
            <li>Коммутативность умножения: $z_1 \\cdot z_2 = z_2 \\cdot z_1$.</li>
            <li>Ассоциативность умножения: $(z_1 \\cdot z_2) \\cdot z_3 = z_1 \\cdot (z_2 \\cdot z_3)$.</li>
            <li>Существование единицы: $1_\\mathbb{C} = (1, 0)$ такое, что $z \\cdot 1 = z$.</li>
            <li>Существование обратного элемента: для любого $z = (a, b) \\ne (0, 0)$ существует $z^{-1} \\in \\mathbb{C}$ такое, что $z \\cdot z^{-1} = 1$.</li>
            <li>Дистрибутивность умножения относительно сложения: $z_1 \\cdot (z_2 + z_3) = z_1 z_2 + z_1 z_3$.</li>
          </ol>
        </div>
      </div>

      <details class="proof-block">
        <summary>Строгое доказательство аксиом поля для модели Гамильтона</summary>
        <div class="proof-content">
          <p><strong>1. Ассоциативность умножения:</strong></p>
          <p>Пусть $z_1 = (a_1, b_1)$, $z_2 = (a_2, b_2)$, $z_3 = (a_3, b_3)$. Вычислим левую часть:</p>
          $$\\begin{aligned}
          (z_1 z_2) z_3 &= (a_1 a_2 - b_1 b_2, \\, a_1 b_2 + a_2 b_1) \\cdot (a_3, b_3) \\\\
          &= ((a_1 a_2 - b_1 b_2)a_3 - (a_1 b_2 + a_2 b_1)b_3, \\, (a_1 a_2 - b_1 b_2)b_3 + (a_1 b_2 + a_2 b_1)a_3) \\\\
          &= (a_1 a_2 a_3 - b_1 b_2 a_3 - a_1 b_2 b_3 - a_2 b_1 b_3, \\, a_1 a_2 b_3 - b_1 b_2 b_3 + a_1 b_2 a_3 + a_2 b_1 a_3).
          \\end{aligned}$$
          <p>Аналогично раскладывая $z_1 (z_2 z_3)$, получаем абсолютно идентичное координатное выражение ввиду ассоциативности и дистрибутивности поля вещественных чисел $\\mathbb{R}$.</p>
          
          <p><strong>2. Существование единицы:</strong></p>
          <p>Для элемента $e = (1, 0)$ имеем:</p>
          $$(a, b) \\cdot (1, 0) = (a \\cdot 1 - b \\cdot 0, \\, a \\cdot 0 + b \\cdot 1) = (a, b).$$

          <p><strong>3. Существование обратного элемента:</strong></p>
          <p>Пусть $(a, b) \\ne (0, 0)$, что эквивалентно $a^2 + b^2 > 0$. Ищем пару $(x, y)$ такую, что $(a, b)(x, y) = (1, 0)$:</p>
          $$\\begin{cases} ax - by = 1, \\\\ bx + ay = 0. \\end{cases}$$
          <p>Умножим первое уравнение на $a$, второе на $b$ и сложим: $(a^2 + b^2)x = a \\implies x = \\frac{a}{a^2 + b^2}$.</p>
          <p>Умножим первое на $-b$, второе на $a$ и сложим: $(a^2 + b^2)y = -b \\implies y = \\frac{-b}{a^2 + b^2}$.</p>
          <p>Следовательно, обратный элемент существует, единственен и задается явной формулой:</p>
          $$z^{-1} = \\left(\\frac{a}{a^2 + b^2}, \\, \\frac{-b}{a^2 + b^2}\\right).$$

          <p><strong>4. Вложение $\\mathbb{R} \\hookrightarrow \\mathbb{C}$ (изоморфизм):</strong></p>
          <p>Рассмотрим подмножество $\\mathbb{C}_0 = \\{(a, 0) \\mid a \\in \\mathbb{R}\\} \\subset \\mathbb{C}$. Отображение $\\iota: \\mathbb{R} \\to \\mathbb{C}_0$, $\\iota(a) = (a, 0)$, является инъективным гомоморфизмом полей:</p>
          $$\\iota(a_1 + a_2) = (a_1 + a_2, 0) = (a_1, 0) + (a_2, 0) = \\iota(a_1) + \\iota(a_2),$$
          $$\\iota(a_1 a_2) = (a_1 a_2 - 0, 0) = (a_1, 0) \\cdot (a_2, 0) = \\iota(a_1) \\cdot \\iota(a_2).$$
          <p>Следовательно, поле вещественных чисел естественно изоморфно вложено в поле $\\mathbb{C}$, что позволяет отождествлять пару $(a, 0)$ с вещественным числом $a$.</p>
          <span class="qed">$\\blacksquare$</span>
        </div>
      </details>

      <h3>1.2. Алгебраическая форма комплексного числа и мнимая единица</h3>
      <div class="callout callout-def">
        <div class="callout-header">
          <span class="callout-tag">Определение 1.2</span>
          <span class="callout-title">Мнимая единица</span>
        </div>
        <div class="callout-body">
          <strong>Мнимой единицей</strong> называется элемент $i = (0, 1) \\in \\mathbb{C}$.
        </div>
      </div>

      <p>Вычислим квадрат мнимой единицы по правилу умножения пар Гамильтона:</p>
      $$i^2 = (0, 1) \\cdot (0, 1) = (0 \\cdot 0 - 1 \\cdot 1, \\, 0 \\cdot 1 + 1 \\cdot 0) = (-1, 0) = -1.$$
      <p>Теперь любое комплексное число $z = (a, b)$ единственным образом раскладывается по базису $\\{(1, 0), (0, 1)\\}$:</p>
      $$z = (a, b) = (a, 0) + (0, b) = (a, 0) + (b, 0) \\cdot (0, 1) = a + bi.$$
      <p>Здесь $a = \\operatorname{Re}(z)$ — вещественная часть (real part), а $b = \\operatorname{Im}(z)$ — мнимая часть (imaginary part, обращаем внимание: само число $b$ является <em>вещественным</em>!).</p>

      <h3>1.3. Операция сопряжения и ее фундаментальные свойства</h3>
      <div class="callout callout-def">
        <div class="callout-header">
          <span class="callout-tag">Определение 1.3</span>
          <span class="callout-title">Комплексное сопряжение</span>
        </div>
        <div class="callout-body">
          Для комплексного числа $z = a + bi$ ($a, b \\in \\mathbb{R}$) число $\\bar{z} = a - bi$ называется <strong>комплексно сопряженным</strong> к $z$.
        </div>
      </div>

      <div class="callout callout-thm">
        <div class="callout-header">
          <span class="callout-tag">Теорема 1.2</span>
          <span class="callout-title">Алгебраические свойства операции сопряжения</span>
        </div>
        <div class="callout-body">
          Для любых $z, z_1, z_2 \\in \\mathbb{C}$ выполнены следующие тождества:
          <ol style="margin: 0.6rem 0 0 1.2rem; padding: 0;">
            <li>$\\overline{z_1 + z_2} = \\bar{z}_1 + \\bar{z}_2$ (аддитивность).</li>
            <li>$\\overline{z_1 \\cdot z_2} = \\bar{z}_1 \\cdot \\bar{z}_2$ (мультипликативность).</li>
            <li>$\\overline{\\left(\\frac{z_1}{z_2}\\right)} = \\frac{\\bar{z}_1}{\\bar{z}_2}$, при $z_2 \\ne 0$.</li>
            <li>$\\bar{\\bar{z}} = z$ (инволютивность).</li>
            <li>$z \\in \\mathbb{R} \\iff z = \\bar{z}$.</li>
            <li>$z \\in i\\mathbb{R}$ (чисто мнимое) $\\iff z = -\\bar{z}$.</li>
            <li>$\\operatorname{Re}(z) = \\frac{z + \\bar{z}}{2}, \\quad \\operatorname{Im}(z) = \\frac{z - \\bar{z}}{2i}$.</li>
            <li>$z \\cdot \\bar{z} = a^2 + b^2 \\in \\mathbb{R}_{\\ge 0}$, причем $z \\bar{z} = 0 \\iff z = 0$.</li>
          </ol>
        </div>
      </div>

      <details class="proof-block">
        <summary>Строгое доказательство свойств комплексного сопряжения</summary>
        <div class="proof-content">
          <p>Пусть $z_1 = a_1 + b_1 i$, $z_2 = a_2 + b_2 i$.</p>
          <p><strong>Доказательство свойства 2 (мультипликативность):</strong></p>
          <p>Вычислим левую часть:</p>
          $$z_1 z_2 = (a_1 a_2 - b_1 b_2) + (a_1 b_2 + a_2 b_1)i \\implies \\overline{z_1 z_2} = (a_1 a_2 - b_1 b_2) - (a_1 b_2 + a_2 b_1)i.$$
          <p>Вычислим правую часть:</p>
          $$\\bar{z}_1 \\cdot \\bar{z}_2 = (a_1 - b_1 i)(a_2 - b_2 i) = (a_1 a_2 - (-b_1)(-b_2)) + (a_1(-b_2) + (-b_1)a_2)i = (a_1 a_2 - b_1 b_2) - (a_1 b_2 + a_2 b_1)i.$$
          <p>Части совпадают тождественно.</p>

          <p><strong>Доказательство свойства 3 (сопряжение частного):</strong></p>
          <p>Пусть $w = \\frac{z_1}{z_2}$. Тогда $z_1 = w \\cdot z_2$. Применим доказанное свойство 2 к обеим частям: $\\bar{z}_1 = \\overline{w \\cdot z_2} = \\bar{w} \\cdot \\bar{z}_2$. Поскольку $z_2 \\ne 0 \\implies \\bar{z}_2 \\ne 0$, разделим на $\\bar{z}_2$: $\\bar{w} = \\frac{\\bar{z}_1}{\\bar{z}_2}$, что и требовалось.</p>

          <p><strong>Доказательство формул вещественной и мнимой части:</strong></p>
          $$z + \\bar{z} = (a + bi) + (a - bi) = 2a = 2\\operatorname{Re}(z) \\implies \\operatorname{Re}(z) = \\frac{z + \\bar{z}}{2}.$$
          $$z - \\bar{z} = (a + bi) - (a - bi) = 2bi = 2i\\operatorname{Im}(z) \\implies \\operatorname{Im}(z) = \\frac{z - \\bar{z}}{2i}.$$
          <span class="qed">$\\blacksquare$</span>
        </div>
      </details>

      <div class="callout callout-warn">
        <div class="callout-header">
          <span class="callout-tag">Ловушка коллоквиума</span>
          <span class="callout-title">Линейный порядок в $\\mathbb{C}$ невозможен</span>
        </div>
        <div class="callout-body">
          Экзаменатор может спросить: <em>«Какое из двух чисел больше: $1 + 2i$ или $2 + i$?»</em><br>
          <strong>Правильный ответ:</strong> Комплексные числа принципиально <strong>нельзя упорядочить</strong> согласованно с операциями поля! Если бы существовал порядок $<$, то для $i \\ne 0$ должно было бы выполняться либо $i > 0$, либо $i < 0$. Но в упорядоченном поле квадрат любого ненулевого элемента положителен: $i > 0 \\implies i^2 > 0 \\implies -1 > 0$, противоречие. Если $i < 0$, то $-i > 0 \\implies (-i)^2 > 0 \\implies -1 > 0$, снова противоречие!
        </div>
      </div>

      <div class="key-takeaways">
        <div class="key-takeaways-title">Шпаргалка к билету 1</div>
        <ul>
          <li>Модель Гамильтона: пары $(a, b) \\in \\mathbb{R}^2$ с операцией $(a_1, b_1)(a_2, b_2) = (a_1 a_2 - b_1 b_2, \\, a_1 b_2 + a_2 b_1)$.</li>
          <li>Обратный элемент: $z^{-1} = \\left(\\frac{a}{a^2+b^2}, \\, \\frac{-b}{a^2+b^2}\\right) = \\frac{\\bar{z}}{z \\bar{z}}$.</li>
          <li>Мнимая единица: $i = (0, 1)$, $i^2 = -1$. Алгебраическая форма: $z = a + bi$.</li>
          <li>Сопряжение: $\\bar{z} = a - bi$, сохраняет сложение и умножение (является автоморфизмом поля $\\mathbb{C}$ над $\\mathbb{R}$).</li>
        </ul>
      </div>
    </section>
    <div class="engraved-divider">✦ ──────── ◈ ──────── ✦</div>
    """


def get_ticket_2():
    return """
    <!-- ==========================================================================
         БИЛЕТ 2: ТРИГОНОМЕТРИЧЕСКАЯ ФОРМА КОМПЛЕКСНОГО ЧИСЛА
         ========================================================================== -->
    <section class="lecture-section" id="ticket-2">
      <div class="kicker-label">✦ БИЛЕТ 02 ✦</div>
      <h2>Билет 2. Тригонометрическая форма комплексного числа: умножение и деление</h2>

      <p><span class="drop-cap">А</span>лгебраическая форма комплексного числа $z = a + bi$ превосходно приспособлена для аддитивных операций, однако при многократном умножении и делении приводит к громоздким полиномиальным вычислениям. Переход к полярным координатам на комплексной плоскости рождает тригонометрическую форму числа, в которой операции умножения и деления приобретают исключительную гармонию и прозрачный геометрический смысл растяжения и поворота.</p>

      <h3>2.1. Полярные координаты и определение тригонометрической формы</h3>
      <p>Отождествим комплексное число $z = a + bi$ с точкой плоскости $M(a, b)$ или радиус-вектором $\\vec{r} = (a, b)$. Введем на плоскости полярные координаты $(r, \\varphi)$:</p>
      $$r = |z| = \\sqrt{a^2 + b^2}, \\quad \\begin{cases} a = r \\cos \\varphi, \\\\ b = r \\sin \\varphi. \\end{cases}$$

      <div class="callout callout-def">
        <div class="callout-header">
          <span class="callout-tag">Определение 2.1</span>
          <span class="callout-title">Аргумент комплексного числа</span>
        </div>
        <div class="callout-body">
          Для всякого ненулевого комплексного числа $z \\ne 0$ угол $\\varphi \\in \\mathbb{R}$ между положительным направлением действительной оси и радиус-вектором точки $z$ называется <strong>аргументом</strong> числа $z$ и обозначается $\\operatorname{Arg}(z)$.<br>
          Аргумент определен с точностью до слагаемого, кратного $2\\pi$:
          $$\\operatorname{Arg}(z) = \\{\\arg(z) + 2\\pi k \\mid k \\in \\mathbb{Z}\\},$$
          где $\\arg(z) \\in (-\\pi, \\pi]$ (или $[0, 2\\pi)$) — <strong>главное значение аргумента</strong>. Для числа $z = 0$ аргумент не определен.
        </div>
      </div>

      <div class="callout callout-def">
        <div class="callout-header">
          <span class="callout-tag">Определение 2.2</span>
          <span class="callout-title">Тригонометрическая и показательная формы</span>
        </div>
        <div class="callout-body">
          Представление комплексного числа $z \\ne 0$ в виде:
          $$z = r(\\cos \\varphi + i \\sin \\varphi), \\quad r > 0, \\; \\varphi \\in \\mathbb{R}$$
          называется <strong>тригонометрической формой</strong> комплексного числа.<br>
          С учетом формулы Эйлера $e^{i\\varphi} = \\cos \\varphi + i \\sin \\varphi$, представление $z = r e^{i\\varphi}$ называется <strong>показательной формой</strong>.
        </div>
      </div>

      <h3>2.2. Теорема об операциях в тригонометрической форме</h3>
      <div class="callout callout-thm">
        <div class="callout-header">
          <span class="callout-tag">Теорема 2.1</span>
          <span class="callout-title">Умножение и деление комплексных чисел</span>
        </div>
        <div class="callout-body">
          Пусть даны два ненулевых комплексных числа в тригонометрической форме:
          $$z_1 = r_1 (\\cos \\varphi_1 + i \\sin \\varphi_1), \\quad z_2 = r_2 (\\cos \\varphi_2 + i \\sin \\varphi_2).$$
          Тогда:
          <ol style="margin: 0.6rem 0 0 1.2rem; padding: 0;">
            <li><strong>Произведение:</strong>
              $$z_1 z_2 = r_1 r_2 \\big(\\cos(\\varphi_1 + \\varphi_2) + i \\sin(\\varphi_1 + \\varphi_2)\\big).$$
              <em>Модули перемножаются, а аргументы складываются:</em> $|z_1 z_2| = |z_1||z_2|$, $\\operatorname{Arg}(z_1 z_2) = \\operatorname{Arg}(z_1) + \\operatorname{Arg}(z_2)$.
            </li>
            <li><strong>Частное:</strong>
              $$\\frac{z_1}{z_2} = \\frac{r_1}{r_2} \\big(\\cos(\\varphi_1 - \\varphi_2) + i \\sin(\\varphi_1 - \\varphi_2)\\big).$$
              <em>Модули делятся, а аргументы вычитаются:</em> $\\left|\\frac{z_1}{z_2}\\right| = \\frac{|z_1|}{|z_2|}$, $\\operatorname{Arg}\\left(\\frac{z_1}{z_2}\\right) = \\operatorname{Arg}(z_1) - \\operatorname{Arg}(z_2)$.
            </li>
          </ol>
        </div>
      </div>

      <details class="proof-block">
        <summary>Строгое доказательство теоремы об умножении и делении</summary>
        <div class="proof-content">
          <p><strong>1. Доказательство формулы умножения:</strong></p>
          <p>Раскроем скобки в произведении по алгебраическому правилу умножения:</p>
          $$\\begin{aligned}
          z_1 z_2 &= r_1 (\\cos \\varphi_1 + i \\sin \\varphi_1) \\cdot r_2 (\\cos \\varphi_2 + i \\sin \\varphi_2) \\\\
          &= r_1 r_2 \\Big[ (\\cos \\varphi_1 \\cos \\varphi_2 - \\sin \\varphi_1 \\sin \\varphi_2) + i (\\cos \\varphi_1 \\sin \\varphi_2 + \\sin \\varphi_1 \\cos \\varphi_2) \\Big].
          \\end{aligned}$$
          <p>Используем фундаментальные тригонометрические формулы для косинуса и синуса суммы двух углов:</p>
          $$\\cos(\\varphi_1 + \\varphi_2) = \\cos \\varphi_1 \\cos \\varphi_2 - \\sin \\varphi_1 \\sin \\varphi_2,$$
          $$\\sin(\\varphi_1 + \\varphi_2) = \\sin \\varphi_1 \\cos \\varphi_2 + \\cos \\varphi_1 \\sin \\varphi_2.$$
          <p>Подставляя эти тождества, получаем требуемое:</p>
          $$z_1 z_2 = r_1 r_2 \\big( \\cos(\\varphi_1 + \\varphi_2) + i \\sin(\\varphi_1 + \\varphi_2) \\big).$$

          <p><strong>2. Доказательство формулы деления:</strong></p>
          <p>Пусть $w = \\frac{z_1}{z_2} = R(\\cos \\theta + i \\sin \\theta)$. Тогда по определению частного $z_1 = w \\cdot z_2$.</p>
          <p>По доказанной формуле умножения:</p>
          $$r_1 (\\cos \\varphi_1 + i \\sin \\varphi_1) = R r_2 \\big(\\cos(\\theta + \\varphi_2) + i \\sin(\\theta + \\varphi_2)\\big).$$
          <p>Приравнивая модули и аргументы (с точностью до $2\\pi k$), находим:</p>
          $$r_1 = R r_2 \\implies R = \\frac{r_1}{r_2},$$
          $$\\theta + \\varphi_2 = \\varphi_1 + 2\\pi k \\implies \\theta = \\varphi_1 - \\varphi_2 - 2\\pi k.$$
          <p>Следовательно, с точностью до эквивалентности углов аргумент равен $\\varphi_1 - \\varphi_2$, что дает:</p>
          $$\\frac{z_1}{z_2} = \\frac{r_1}{r_2}\\big(\\cos(\\varphi_1 - \\varphi_2) + i \\sin(\\varphi_1 - \\varphi_2)\\big).$$
          <span class="qed">$\\blacksquare$</span>
        </div>
      </details>

      <div class="callout callout-remark">
        <div class="callout-header">
          <span class="callout-tag">Интуиция Караваджо</span>
          <span class="callout-title">Геометрический оператор поворота</span>
        </div>
        <div class="callout-body">
          Умножение вектора $z$ на комплексное число $w = R e^{i\\theta}$ производит композицию двух геометрических преобразований плоскости: <strong>гомотетию с коэффициентом $R$</strong> и <strong>поворот против часовой стрелки на угол $\\theta$</strong>. В частности, умножение на мнимую единицу $i = 1 \\cdot e^{i \\pi/2}$ поворачивает плоскость ровно на $90^\\circ$, что полностью демистифицирует равенство $i^2 = -1$ (два поворота на $90^\\circ$ дают поворот на $180^\\circ$, т.е. инверсию вектора).
        </div>
      </div>

      <div class="key-takeaways">
        <div class="key-takeaways-title">Шпаргалка к билету 2</div>
        <ul>
          <li>Тригонометрическая форма: $z = r(\\cos \\varphi + i \\sin \\varphi)$, где $r = |z| > 0$, $\\varphi = \\arg z$.</li>
          <li>Формула Эйлера: $e^{i\\varphi} = \\cos \\varphi + i \\sin \\varphi$.</li>
          <li>Умножение: $z_1 z_2 = r_1 r_2 (\\cos(\\varphi_1+\\varphi_2) + i\\sin(\\varphi_1+\\varphi_2))$.</li>
          <li>Деление: $\\frac{z_1}{z_2} = \\frac{r_1}{r_2}(\\cos(\\varphi_1-\\varphi_2) + i\\sin(\\varphi_1-\\varphi_2))$.</li>
        </ul>
      </div>
    </section>
    <div class="engraved-divider">✦ ──────── ◈ ──────── ✦</div>
    """


def get_ticket_3():
    return """
    <!-- ==========================================================================
         БИЛЕТ 3: МОДУЛЬ КОМПЛЕКСНОГО ЧИСЛА И НЕРАВЕНСТВО ТРЕУГОЛЬНИКА
         ========================================================================== -->
    <section class="lecture-section" id="ticket-3">
      <div class="kicker-label">✦ БИЛЕТ 03 ✦</div>
      <h2>Билет 3. Модуль комплексного числа: свойства и неравенство треугольника</h2>

      <p><span class="drop-cap">М</span>одуль комплексного числа играет фундаментальную роль метрического инварианта в $\\mathbb{C}$, индуцируя на комплексной плоскости евклидову метрику. Центральным аналитическим аппаратом метрических пространств является неравенство треугольника. В этом билете даются строгие формулировки свойств модуля, связь с сопряжением и полное аналитическое доказательство неравенства треугольника с исследованием критерия достижения равенства.</p>

      <h3>3.1. Определение и алгебраические свойства модуля</h3>
      <div class="callout callout-def">
        <div class="callout-header">
          <span class="callout-tag">Определение 3.1</span>
          <span class="callout-title">Модуль комплексного числа</span>
        </div>
        <div class="callout-body">
          Для комплексного числа $z = a + bi$ ($a, b \\in \\mathbb{R}$) его <strong>модулем</strong> (абсолютной величиной) называется неотрицательное вещественное число:
          $$|z| = \\sqrt{a^2 + b^2} = \\sqrt{z \\bar{z}}.$$
          Геометрически $|z|$ выражает евклидово расстояние от начала координат до точки $z$ на комплексной плоскости, а $|z_1 - z_2|$ — расстояние между точками $z_1$ и $z_2$.
        </div>
      </div>

      <div class="callout callout-thm">
        <div class="callout-header">
          <span class="callout-tag">Теорема 3.1</span>
          <span class="callout-title">Свойства модуля</span>
        </div>
        <div class="callout-body">
          Для любых $z, z_1, z_2 \\in \\mathbb{C}$ справедливы соотношения:
          <ol style="margin: 0.6rem 0 0 1.2rem; padding: 0;">
            <li>$|z| \\ge 0$, причем $|z| = 0 \\iff z = 0$ (положительная определенность).</li>
            <li>$|z|^2 = z \\bar{z}$.</li>
            <li>$|z| = |\\bar{z}| = |-z| = |-\\bar{z}|$.</li>
            <li>$|z_1 z_2| = |z_1| \\cdot |z_2|$ (мультипликативность).</li>
            <li>$\\left|\\frac{z_1}{z_2}\\right| = \\frac{|z_1|}{|z_2|}$ при $z_2 \\ne 0$.</li>
            <li>$|\\operatorname{Re}(z)| \\le |z|$ и $|\\operatorname{Im}(z)| \\le |z|$.</li>
          </ol>
        </div>
      </div>

      <details class="proof-block">
        <summary>Строгое доказательство свойств модуля</summary>
        <div class="proof-content">
          <p><strong>Мультипликативность $|z_1 z_2| = |z_1| |z_2|$:</strong></p>
          <p>Используя связь сопряжения и модуля, запишем квадрат модуля произведения:</p>
          $$|z_1 z_2|^2 = (z_1 z_2) \\overline{(z_1 z_2)} = (z_1 z_2)(\\bar{z}_1 \\bar{z}_2) = (z_1 \\bar{z}_1)(z_2 \\bar{z}_2) = |z_1|^2 \\cdot |z_2|^2.$$
          <p>Так как модули неотрицательны, извлекая арифметический квадратный корень, получаем $|z_1 z_2| = |z_1||z_2|$.</p>
          <p><strong>Оценка вещественной части $|\\operatorname{Re}(z)| \\le |z|$:</strong></p>
          $$|z| = \\sqrt{a^2 + b^2} \\ge \\sqrt{a^2} = |a| = |\\operatorname{Re}(z)|.$$
          <span class="qed">$\\blacksquare$</span>
        </div>
      </details>

      <h3>3.2. Неравенство треугольника</h3>
      <div class="callout callout-thm">
        <div class="callout-header">
          <span class="callout-tag">Теорема 3.2</span>
          <span class="callout-title">Неравенство треугольника (прямое и обратное)</span>
        </div>
        <div class="callout-body">
          Для любых комплексных чисел $z_1, z_2 \\in \\mathbb{C}$ выполняются неравенства:
          <ol style="margin: 0.6rem 0 0 1.2rem; padding: 0;">
            <li><strong>Прямое неравенство треугольника:</strong>
              $$|z_1 + z_2| \\le |z_1| + |z_2|.$$
              <em>Равенство достигается тогда и только тогда, когда $z_1 = 0$, $z_2 = 0$ или $z_1 = \\lambda z_2$ при некотором вещественном $\\lambda > 0$ (сонаправленность векторов).</em>
            </li>
            <li><strong>Обратное неравенство треугольника:</strong>
              $$|z_1 - z_2| \\ge \\big| |z_1| - |z_2| \\big|.$$
            </li>
          </ol>
        </div>
      </div>

      <details class="proof-block">
        <summary>Строгое аналитическое доказательство неравенства треугольника</summary>
        <div class="proof-content">
          <p><strong>1. Прямое неравенство:</strong></p>
          <p>Рассмотрим квадрат модуля суммы $|z_1 + z_2|^2$:</p>
          $$\\begin{aligned}
          |z_1 + z_2|^2 &= (z_1 + z_2)\\overline{(z_1 + z_2)} = (z_1 + z_2)(\\bar{z}_1 + \\bar{z}_2) \\\\
          &= z_1 \\bar{z}_1 + z_1 \\bar{z}_2 + z_2 \\bar{z}_1 + z_2 \\bar{z}_2 \\\\
          &= |z_1|^2 + |z_2|^2 + (z_1 \\bar{z}_2 + \\overline{z_1 \\bar{z}_2}) \\\\
          &= |z_1|^2 + |z_2|^2 + 2 \\operatorname{Re}(z_1 \\bar{z}_2).
          \\end{aligned}$$
          <p>По доказанному свойству вещественной части $\\operatorname{Re}(w) \\le |w|$ для любого $w \\in \\mathbb{C}$, применив это к $w = z_1 \\bar{z}_2$, получаем:</p>
          $$\\operatorname{Re}(z_1 \\bar{z}_2) \\le |z_1 \\bar{z}_2| = |z_1| |\\bar{z}_2| = |z_1| |z_2|.$$
          <p>Подставляя эту оценку в выражение для квадрата суммы:</p>
          $$|z_1 + z_2|^2 \\le |z_1|^2 + |z_2|^2 + 2|z_1||z_2| = (|z_1| + |z_2|)^2.$$
          <p>Так как обе части неравенства неотрицательны, извлечение арифметического квадратного корня сохраняет знак неравенства:</p>
          $$|z_1 + z_2| \\le |z_1| + |z_2|.$$

          <p><strong>Анализ случая равенства:</strong></p>
          <p>Равенство $|z_1 + z_2| = |z_1| + |z_2|$ возможно тогда и только тогда, когда $\\operatorname{Re}(z_1 \\bar{z}_2) = |z_1 \\bar{z}_2|$. Это означает, что число $w = z_1 \\bar{z}_2$ является неотрицательным вещественным числом: $z_1 \\bar{z}_2 \\ge 0$. Если $z_2 \\ne 0$, умножим обе части на $z_2$: $z_1 |z_2|^2 \\ge 0 \\implies z_1 = \\lambda z_2$, где $\\lambda = \\frac{z_1 \\bar{z}_2}{|z_2|^2} \\ge 0$.</p>

          <p><strong>2. Обратное неравенство:</strong></p>
          <p>Применим прямое неравенство треугольника к числам $(z_1 - z_2)$ и $z_2$:</p>
          $$|z_1| = |(z_1 - z_2) + z_2| \\le |z_1 - z_2| + |z_2| \\implies |z_1| - |z_2| \\le |z_1 - z_2|.$$
          <p>Поменяв роли $z_1$ и $z_2$, получаем:</p>
          $$|z_2| - |z_1| \\le |z_2 - z_1| = |z_1 - z_2| \\implies -(|z_1| - |z_2|) \\le |z_1 - z_2|.$$
          <p>Объединяя оба неравенства: $\\big| |z_1| - |z_2| \\big| \\le |z_1 - z_2|$, что доказывает обратное неравенство.</p>
          <span class="qed">$\\blacksquare$</span>
        </div>
      </details>

      <div class="key-takeaways">
        <div class="key-takeaways-title">Шпаргалка к билету 3</div>
        <ul>
          <li>Квадрат модуля: $|z|^2 = z \\bar{z} = a^2 + b^2$.</li>
          <li>Мультипликативность: $|z_1 z_2| = |z_1| |z_2|$.</li>
          <li>Прямое неравенство: $|z_1 + z_2| \\le |z_1| + |z_2|$ (равенство $\\iff z_1, z_2$ сонаправлены).</li>
          <li>Обратное неравенство: $|z_1 - z_2| \\ge \\big| |z_1| - |z_2| \\big|$.</li>
        </ul>
      </div>
    </section>
    <div class="engraved-divider">✦ ──────── ◈ ──────── ✦</div>
    """


def get_ticket_4():
    return """
    <!-- ==========================================================================
         БИЛЕТ 4: ВОЗВЕДЕНИЕ В СТЕПЕНЬ И ИЗВЛЕЧЕНИЕ КОРНЕЙ. ФОРМУЛА МУАВРА
         ========================================================================== -->
    <section class="lecture-section" id="ticket-4">
      <div class="kicker-label">✦ БИЛЕТ 04 ✦</div>
      <h2>Билет 4. Возведение в степень и извлечение корней: формула Муавра и геометрия корней</h2>

      <p><span class="drop-cap">О</span>дной из вершин алгебры комплексных чисел является замкнутость относительно операции извлечения корней произвольной натуральной степени. В поле действительных чисел корень четной степени из отрицательного числа не существует, а из положительного — принимает два противоположных значения. В поле $\\mathbb{C}$ корень любой степени $n$ из всякого ненулевого числа существует и принимает ровно $n$ попарно различных значений. Этот результат базируется на великой формуле Абрахама де Муавра.</p>

      <h3>4.1. Формула Муавра для целых показателей</h3>
      <div class="callout callout-thm">
        <div class="callout-header">
          <span class="callout-tag">Теорема 4.1</span>
          <span class="callout-title">Формула Муавра</span>
        </div>
        <div class="callout-body">
          Для любого ненулевого комплексного числа $z = r(\\cos \\varphi + i \\sin \\varphi) \\ne 0$ и любого целого числа $n \\in \\mathbb{Z}$ справедлива формула:
          $$z^n = r^n \\big(\\cos(n\\varphi) + i \\sin(n\\varphi)\\big).$$
          В частности, при $r = 1$:
          $$(\\cos \\varphi + i \\sin \\varphi)^n = \\cos(n\\varphi) + i \\sin(n\\varphi).$$
        </div>
      </div>

      <details class="proof-block">
        <summary>Строгое доказательство формулы Муавра по индукции</summary>
        <div class="proof-content">
          <p><strong>1. Случай натуральных показателей $n \\in \\mathbb{N}$ (математическая индукция):</strong></p>
          <p><em>База индукции:</em> При $n = 1$ формула $z^1 = r^1(\\cos(1\\cdot\\varphi) + i \\sin(1\\cdot\\varphi))$ очевидно верна.</p>
          <p><em>Индукционный переход:</em> Пусть формула верна для $n = k$, то есть $z^k = r^k(\\cos(k\\varphi) + i \\sin(k\\varphi))$. Докажем для $n = k + 1$:</p>
          $$\\begin{aligned}
          z^{k+1} &= z^k \\cdot z = \\big[ r^k (\\cos(k\\varphi) + i \\sin(k\\varphi)) \\big] \\cdot \\big[ r (\\cos \\varphi + i \\sin \\varphi) \\big] \\\\
          &= r^k \\cdot r \\big[ \\cos(k\\varphi + \\varphi) + i \\sin(k\\varphi + \\varphi) \\big] \\\\
          &= r^{k+1} \\big( \\cos((k+1)\\varphi) + i \\sin((k+1)\\varphi) \\big).
          \\end{aligned}$$
          <p>Шаг доказан. По принципу математической индукции формула верна для всех $n \\in \\mathbb{N}$.</p>

          <p><strong>2. Случай $n = 0$:</strong></p>
          $$z^0 = 1 = 1 \\cdot (\\cos 0 + i \\sin 0) = r^0(\\cos(0\\cdot\\varphi) + i \\sin(0\\cdot\\varphi)).$$

          <p><strong>3. Случай отрицательных показателей $n = -m$, где $m \\in \\mathbb{N}$:</strong></p>
          <p>По определению степени с отрицательным показателем и теореме о делении в тригонометрической форме:</p>
          $$\\begin{aligned}
          z^n = z^{-m} &= \\frac{1}{z^m} = \\frac{1(\\cos 0 + i \\sin 0)}{r^m(\\cos(m\\varphi) + i \\sin(m\\varphi))} \\\\
          &= \\frac{1}{r^m}\\big(\\cos(0 - m\\varphi) + i \\sin(0 - m\\varphi)\\big) = r^{-m}\\big(\\cos(-m\\varphi) + i \\sin(-m\\varphi)\\big) \\\\
          &= r^n \\big(\\cos(n\\varphi) + i \\sin(n\\varphi)\\big).
          \\end{aligned}$$
          <span class="qed">$\\blacksquare$</span>
        </div>
      </details>

      <h3>4.2. Извлечение корней $n$-й степени из комплексного числа</h3>
      <div class="callout callout-def">
        <div class="callout-header">
          <span class="callout-tag">Определение 4.1</span>
          <span class="callout-title">Корень $n$-й степени</span>
        </div>
        <div class="callout-body">
          Пусть $z \\in \\mathbb{C}$ и $n \\in \\mathbb{N}$. Число $w \\in \\mathbb{C}$ называется <strong>корнем $n$-й степени из $z$</strong> (обозначается $\\sqrt[n]{z}$), если $w^n = z$.
        </div>
      </div>

      <div class="callout callout-thm">
        <div class="callout-header">
          <span class="callout-tag">Теорема 4.2</span>
          <span class="callout-title">О существовании ровно $n$ корней</span>
        </div>
        <div class="callout-body">
          Для всякого ненулевого комплексного числа $z = r(\\cos \\varphi + i \\sin \\varphi) \\ne 0$ и любого $n \\in \\mathbb{N}$ существует ровно $n$ различных комплексных корней $n$-й степени из $z$, которые выражаются формулой:
          $$w_k = \\sqrt[n]{r} \\left( \\cos \\frac{\\varphi + 2\\pi k}{n} + i \\sin \\frac{\\varphi + 2\\pi k}{n} \\right), \\quad k = 0, 1, 2, \\dots, n - 1.$$
          Здесь $\\sqrt[n]{r}$ означает обычный арифметический корень из положительного вещественного числа $r > 0$.
        </div>
      </div>

      <details class="proof-block">
        <summary>Строгое доказательство теоремы о корнях $n$-й степени</summary>
        <div class="proof-content">
          <p>Пусть искомый корень записан в тригонометрической форме: $w = R(\\cos \\theta + i \\sin \\theta)$. Уравнение $w^n = z$ по формуле Муавра переписывается как:</p>
          $$R^n (\\cos(n\\theta) + i \\sin(n\\theta)) = r(\\cos \\varphi + i \\sin \\varphi).$$
          <p>Два комплексных числа в тригонометрической форме равны тогда и только тогда, когда их модули равны, а аргументы отличаются на целое кратное $2\\pi$:</p>
          $$\\begin{cases} R^n = r \\\\ n\\theta = \\varphi + 2\\pi k, \\quad k \\in \\mathbb{Z} \\end{cases} \\implies \\begin{cases} R = \\sqrt[n]{r} \\\\ \\theta_k = \\frac{\\varphi + 2\\pi k}{n}, \\quad k \\in \\mathbb{Z}. \\end{cases}$$
          <p><strong>1. Значения $w_0, w_1, \\dots, w_{n-1}$ попарно различны:</strong></p>
          <p>Предположим противное: $w_{k_1} = w_{k_2}$ для $0 \\le k_1 < k_2 \\le n - 1$. Тогда их аргументы должны отличаться на целое кратное $2\\pi$:</p>
          $$\\frac{\\varphi + 2\\pi k_2}{n} - \\frac{\\varphi + 2\\pi k_1}{n} = 2\\pi m \\implies \\frac{2\\pi(k_2 - k_1)}{n} = 2\\pi m \\implies k_2 - k_1 = n m.$$
          <p>Однако $0 < k_2 - k_1 < n$, следовательно, разность не может делиться на $n$. Противоречие.</p>

          <p><strong>2. Других значений корни не дают:</strong></p>
          <p>Пусть $k \\in \\mathbb{Z}$ — произвольное целое число. Разделим $k$ на $n$ с остатком: $k = n q + r$, где $0 \\le r < n$. Тогда:</p>
          $$\\theta_k = \\frac{\\varphi + 2\\pi(nq + r)}{n} = \\frac{\\varphi + 2\\pi r}{n} + 2\\pi q = \\theta_r + 2\\pi q.$$
          <p>Так как синус и косинус $2\\pi$-периодичны, $w_k = w_r$. То есть при всех $k \\in \\mathbb{Z}$ мы получаем в точности значения из набора $\\{w_0, w_1, \\dots, w_{n-1}\\}$.</p>
          <span class="qed">$\\blacksquare$</span>
        </div>
      </details>

      <div class="callout callout-remark">
        <div class="callout-header">
          <span class="callout-tag">Интуиция Караваджо</span>
          <span class="callout-title">Геометрия правильного $n$-угольника</span>
        </div>
        <div class="callout-body">
          Все $n$ корней $w_k$ обладают одинаковым модулем $R = \\sqrt[n]{r}$, а значит, лежат на окружности с центром в начале координат радиуса $\\sqrt[n]{r}$. Разность углов между соседними корнями постоянна и равна $\\frac{2\\pi}{n}$. Таким образом, <strong>точки $w_0, w_1, \\dots, w_{n-1}$ являются вершинами правильного $n$-угольника</strong>, вписанного в эту окружность!
        </div>
      </div>

      <div class="key-takeaways">
        <div class="key-takeaways-title">Шпаргалка к билету 4</div>
        <ul>
          <li>Формула Муавра: $z^n = r^n(\\cos(n\\varphi) + i\\sin(n\\varphi))$.</li>
          <li>Формула корней: $w_k = \\sqrt[n]{r}\\left(\\cos\\frac{\\varphi+2\\pi k}{n} + i\\sin\\frac{\\varphi+2\\pi k}{n}\\right)$, $k = 0, \\dots, n-1$.</li>
          <li>Число корней степени $n$ из любого $z \\ne 0$ ровно $n$.</li>
          <li>Геометрия: вершины правильного $n$-угольника на окружности радиуса $\\sqrt[n]{|z|}$.</li>
        </ul>
      </div>
    </section>
    <div class="engraved-divider">✦ ──────── ◈ ──────── ✦</div>
    """


def get_ticket_5():
    return """
    <!-- ==========================================================================
         БИЛЕТ 5: КОРНИ ИЗ ЕДИНИЦЫ И ГРУППА U_n
         ========================================================================== -->
    <section class="lecture-section" id="ticket-5">
      <div class="kicker-label">✦ БИЛЕТ 05 ✦</div>
      <h2>Билет 5. Корни из единицы: группа $U_n$, первообразные корни и цикличность</h2>

      <p><span class="drop-cap">К</span>орни из единицы занимают центральное положение в абстрактной алгебре, теории чисел и цифровой обработке сигналов (дискретное преобразование Фурье). Корни степени $n$ из единицы замыкаются относительно обычного комплексного умножения, образуя конечную абелеву группу. В данном билете исследуются групповые свойства множества $U_n$, понятие первообразного корня, точный критерий первообразности через взаимную простоту и изоморфизм $U_n \\cong \\mathbb{Z}_n$.</p>

      <h3>5.1. Группа корней из единицы $U_n$</h3>
      <div class="callout callout-def">
        <div class="callout-header">
          <span class="callout-tag">Определение 5.1</span>
          <span class="callout-title">Множество корней из единицы</span>
        </div>
        <div class="callout-body">
          Число $\\varepsilon \\in \\mathbb{C}$ называется <strong>корнем степени $n$ из единицы</strong>, если $\\varepsilon^n = 1$. Множество всех корней степени $n$ из единицы обозначается $U_n$.<br>
          По теореме об извлечении корней (при $r = 1$, $\\varphi = 0$):
          $$U_n = \\{\\varepsilon_0, \\varepsilon_1, \\dots, \\varepsilon_{n-1}\\}, \\quad \\varepsilon_k = \\cos \\frac{2\\pi k}{n} + i \\sin \\frac{2\\pi k}{n} = e^{i \\frac{2\\pi k}{n}}, \\; k = 0, 1, \\dots, n - 1.$$
        </div>
      </div>

      <div class="callout callout-thm">
        <div class="callout-header">
          <span class="callout-tag">Теорема 5.1</span>
          <span class="callout-title">Групповая структура $U_n$</span>
        </div>
        <div class="callout-body">
          Множество $U_n$ относительно стандартной операции умножения комплексных чисел образует <strong>конечную мультипликативную абелеву группу</strong> порядка $n$.
        </div>
      </div>

      <details class="proof-block">
        <summary>Строгая проверка четырех аксиом группы для $(U_n, \\cdot)$</summary>
        <div class="proof-content">
          <p><strong>1. Замкнутость:</strong></p>
          <p>Пусть $\\varepsilon_a, \\varepsilon_b \\in U_n$. Это означает, что $(\\varepsilon_a)^n = 1$ и $(\\varepsilon_b)^n = 1$. Тогда:</p>
          $$(\\varepsilon_a \\cdot \\varepsilon_b)^n = (\\varepsilon_a)^n \\cdot (\\varepsilon_b)^n = 1 \\cdot 1 = 1 \\implies \\varepsilon_a \\cdot \\varepsilon_b \\in U_n.$$
          <p>В явном виде: $\\varepsilon_a \\cdot \\varepsilon_b = \\varepsilon_{(a+b) \\bmod n}$.</p>

          <p><strong>2. Ассоциативность:</strong></p>
          <p>Наследуется из ассоциативности умножения в поле $\\mathbb{C}$.</p>

          <p><strong>3. Существование нейтрального элемента:</strong></p>
          <p>Число $\\varepsilon_0 = \\cos 0 + i \\sin 0 = 1 \\in U_n$, так как $1^n = 1$. Для любого $\\varepsilon \\in U_n$ имеем $\\varepsilon \\cdot 1 = \\varepsilon$.</p>

          <p><strong>4. Существование обратного элемента:</strong></p>
          <p>Для любого $\\varepsilon_k \\in U_n$ рассмотрим элемент $\\varepsilon_{n-k} = \\cos \\frac{2\\pi(n-k)}{n} + i \\sin \\frac{2\\pi(n-k)}{n}$. Тогда:</p>
          $$\\varepsilon_k \\cdot \\varepsilon_{n-k} = \\varepsilon_n = \\varepsilon_0 = 1.$$
          <p>Следовательно, $(\\varepsilon_k)^{-1} = \\varepsilon_{n-k} = \\overline{\\varepsilon_k} \\in U_n$.</p>
          <span class="qed">$\\blacksquare$</span>
        </div>
      </details>

      <h3>5.2. Первообразные (примитивные) корни из единицы</h3>
      <div class="callout callout-def">
        <div class="callout-header">
          <span class="callout-tag">Определение 5.2</span>
          <span class="callout-title">Первообразный корень</span>
        </div>
        <div class="callout-body">
          Корень $\\varepsilon \\in U_n$ называется <strong>первообразным (примитивным) корнем степени $n$</strong>, если его порядок в группе $U_n$ равен в точности $n$, то есть:
          $$\\varepsilon^n = 1 \\quad \\text{и} \\quad \\varepsilon^m \\ne 1 \\; \\text{при всех} \\; 1 \\le m < n.$$
          Это равносильно тому, что последовательность его степеней исчерпывает всю группу:
          $$U_n = \\{ \\varepsilon^0, \\varepsilon^1, \\varepsilon^2, \\dots, \\varepsilon^{n-1} \\}.$$
        </div>
      </div>

      <div class="callout callout-thm">
        <div class="callout-header">
          <span class="callout-tag">Теорема 5.2</span>
          <span class="callout-title">Критерий первообразности корня</span>
        </div>
        <div class="callout-body">
          Корень $\\varepsilon_k = \\cos \\frac{2\\pi k}{n} + i \\sin \\frac{2\\pi k}{n} \\in U_n$ является первообразным корнем степени $n$ тогда и только тогда, когда $k$ взаимно просто с $n$:
          $$\\gcd(k, n) = 1.$$
          <em>Следствие:</em> Количество первообразных корней степени $n$ равно функции Эйлера $\\varphi(n)$.
        </div>
      </div>

      <details class="proof-block">
        <summary>Строгое доказательство критерия первообразности корня</summary>
        <div class="proof-content">
          <p>Пусть корень имеет вид $\\varepsilon_k$. Рассмотрим условие $(\\varepsilon_k)^m = 1$ для натурального $m$:</p>
          $$(\\varepsilon_k)^m = e^{i \\frac{2\\pi k m}{n}} = 1 \\iff \\frac{2\\pi k m}{n} = 2\\pi l \\; (l \\in \\mathbb{Z}) \\iff km = n l \\iff n \\mid km.$$
          
          <p><strong>Необходимость ($\implies$):</strong></p>
          <p>Пусть $\\varepsilon_k$ — первообразный корень. Предположим, что $\\gcd(k, n) = d > 1$.</p>
          <p>Положим $m = \\frac{n}{d}$. Так как $d > 1$, имеем $1 \\le m < n$.</p>
          <p>Вычислим $km$: $km = k \\cdot \\frac{n}{d} = \\frac{k}{d} \\cdot n$. Так как $d = \\gcd(k, n)$, число $\\frac{k}{d}$ — целое. Следовательно, $km$ делится на $n$.</p>
          <p>Но тогда $(\\varepsilon_k)^m = 1$ при $m < n$, что противоречит определению первообразного корня. Значит, $\\gcd(k, n) = 1$.</p>

          <p><strong>Достаточность ($\impliedby$):</strong></p>
          <p>Пусть $\\gcd(k, n) = 1$. Пусть $(\\varepsilon_k)^m = 1$ для некоторого натурального $m$.</p>
          <p>Тогда $n \\mid km$. По лемме Евклида, если $n$ делит произведение $km$ и $\\gcd(k, n) = 1$, то $n$ обязан делить $m$ ($n \\mid m$).</p>
          <p>Следовательно, наименьшее положительное $m$, при котором $(\\varepsilon_k)^m = 1$, равно в точности $n$. Это означает, что порядок элемента равен $n$, и $\\varepsilon_k$ — первообразный.</p>
          <span class="qed">$\\blacksquare$</span>
        </div>
      </details>

      <div class="callout callout-thm">
        <div class="callout-header">
          <span class="callout-tag">Теорема 5.3</span>
          <span class="callout-title">Цикличность группы $U_n$ и изоморфизм</span>
        </div>
        <div class="callout-body">
          Группа корней из единицы $U_n$ является <strong>циклической группой</strong>, порожденной элементом $\\varepsilon_1 = e^{i \\frac{2\\pi}{n}}$:
          $$U_n = \\langle \\varepsilon_1 \\rangle.$$
          При этом группа $U_n$ канонически изоморфна аддитивной группе классов вычетов $(\\mathbb{Z}_n, +)$:
          $$U_n \\cong (\\mathbb{Z}_n, +), \\quad \\text{изоморфизм задается отображением } \\phi(\\bar{k}) = \\varepsilon_k.$$
        </div>
      </div>

      <div class="key-takeaways">
        <div class="key-takeaways-title">Шпаргалка к билету 5</div>
        <ul>
          <li>Корни из единицы: $\\varepsilon_k = e^{i \\frac{2\\pi k}{n}}$, $k = 0, \\dots, n-1$.</li>
          <li>$(U_n, \\cdot)$ — циклическая абелева группа порядка $n$.</li>
          <li>Критерий первообразности: $\\varepsilon_k$ первообразный $\\iff \\gcd(k, n) = 1$.</li>
          <li>Число первообразных корней: $\\varphi(n)$. Изоморфизм: $U_n \\cong \\mathbb{Z}_n$.</li>
        </ul>
      </div>
    </section>
    <div class="engraved-divider">✦ ──────── ◈ ──────── ✦</div>
    """


def get_ticket_6():
    return """
    <!-- ==========================================================================
         БИЛЕТ 6: ДЕЛИМОСТЬ В КОЛЬЦЕ Z И ДЕЛЕНИЕ С ОСТАТКОМ
         ========================================================================== -->
    <section class="lecture-section" id="ticket-6">
      <div class="kicker-label">✦ БИЛЕТ 06 ✦</div>
      <h2>Билет 6. Отношение делимости в $\\mathbb{Z}$ и теорема о делении с остатком</h2>

      <p><span class="drop-cap">Т</span>еория чисел берет свое начало из фундаментального свойства кольца целых чисел $\\mathbb{Z}$ — дискретности и отсутствия обратимости для большинства элементов. Операция деления в $\\mathbb{Z}$ не является всюду определенной, что порождает отношение делимости и теорему о делении с остатком. В данном билете исследуются алгебраические свойства отношения делимости, доказательство их истинности и исчерпывающее строгое доказательство теоремы о существовании и единственности неполного частного и остатка.</p>

      <h3>6.1. Отношение делимости и его свойства</h3>
      <div class="callout callout-def">
        <div class="callout-header">
          <span class="callout-tag">Определение 6.1</span>
          <span class="callout-title">Отношение делимости в $\\mathbb{Z}$</span>
        </div>
        <div class="callout-body">
          Пусть $a, b \\in \\mathbb{Z}$. Говорят, что <strong>$a$ делится на $b$</strong> (или $b$ делит $a$, обозначается $b \\mid a$), если существует такое целое число $q \\in \\mathbb{Z}$, что:
          $$a = b \\cdot q.$$
          Число $b$ называется <em>делителем</em> числа $a$, а $a$ — <em>кратным</em> числа $b$.
        </div>
      </div>

      <div class="callout callout-thm">
        <div class="callout-header">
          <span class="callout-tag">Теорема 6.1</span>
          <span class="callout-title">Элементарные свойства делимости</span>
        </div>
        <div class="callout-body">
          Для любых $a, b, c, d \\in \\mathbb{Z}$ выполнены свойства:
          <ol style="margin: 0.6rem 0 0 1.2rem; padding: 0;">
            <li><strong>Рефлексивность:</strong> $a \\mid a$ для любого $a \\in \\mathbb{Z}$ (так как $a = a \\cdot 1$).</li>
            <li><strong>Транзитивность:</strong> Если $a \\mid b$ и $b \\mid c$, то $a \\mid c$.</li>
            <li><strong>Делимость нуля:</strong> $a \\mid 0$ для всех $a \\in \\mathbb{Z}$ ($0 = a \\cdot 0$). Но $0 \\mid a \\iff a = 0$.</li>
            <li><strong>Взаимная делимость:</strong> Если $a \\mid b$ и $b \\mid a$, то $a = \\pm b$.</li>
            <li><strong>Делимость линейной комбинации:</strong> Если $c \\mid a$ и $c \\mid b$, то для любых целых $x, y \\in \\mathbb{Z}$ выполнено $c \\mid (ax + by)$.</li>
            <li><strong>Делимость произведения:</strong> Если $c \\mid a$, то для любого $b \\in \\mathbb{Z}$ выполнено $c \\mid ab$.</li>
            <li><strong>Сокращение:</strong> При $c \\ne 0$: $ca \\mid cb \\iff a \\mid b$.</li>
          </ol>
        </div>
      </div>

      <details class="proof-block">
        <summary>Строгие доказательства свойств делимости</summary>
        <div class="proof-content">
          <p><strong>1. Транзитивность:</strong></p>
          <p>$a \\mid b \\implies b = a q_1$; $b \\mid c \\implies c = b q_2$. Подставляя $b$, получаем $c = (a q_1) q_2 = a (q_1 q_2)$. Так как $q_1 q_2 \\in \\mathbb{Z}$, то $a \\mid c$.</p>

          <p><strong>2. Взаимная делимость:</strong></p>
          <p>$a \\mid b \\implies b = a q_1$; $b \\mid a \\implies a = b q_2$. Тогда $a = (a q_1) q_2 = a(q_1 q_2)$. Если $a = 0$, то $b = 0$. Если $a \\ne 0$, сокращаем на $a$: $q_1 q_2 = 1$. В $\\mathbb{Z}$ делителями единицы являются только $\\pm 1$. Следовательно, $q_1 = q_2 = \\pm 1$, откуда $a = \\pm b$.</p>

          <p><strong>3. Делимость линейной комбинации:</strong></p>
          <p>$c \\mid a \\implies a = c q_1$; $c \\mid b \\implies b = c q_2$. Тогда:</p>
          $$ax + by = (c q_1)x + (c q_2)y = c(q_1 x + q_2 y).$$
          <p>Так как $q_1 x + q_2 y \\in \\mathbb{Z}$, число $c$ делит $ax + by$.</p>
          <span class="qed">$\\blacksquare$</span>
        </div>
      </details>

      <h3>6.2. Теорема о делении с остатком в $\\mathbb{Z}$</h3>
      <div class="callout callout-thm">
        <div class="callout-header">
          <span class="callout-tag">Теорема 6.2</span>
          <span class="callout-title">Теорема о делении с остатком</span>
        </div>
        <div class="callout-body">
          Для любого целого делимого $a \\in \\mathbb{Z}$ и любого натурального делителя $b \\in \\mathbb{N}$ ($b > 0$) <strong>существуют и единственны</strong> такие целые числа $q \\in \\mathbb{Z}$ (неполное частное) и $r \\in \\mathbb{Z}$ (остаток), что:
          $$a = b \\cdot q + r, \\quad \\text{где } 0 \\le r < b.$$
        </div>
      </div>

      <details class="proof-block">
        <summary>Строгое доказательство существования и единственности частного и остатка</summary>
        <div class="proof-content">
          <p><strong>ЧАСТЬ I: СУЩЕСТВОВАНИЕ</strong></p>
          <p>Рассмотрим числовое множество всех неотрицательных чисел вида $a - bk$ при различных целых $k$:</p>
          $$S = \\{ a - bk \\mid k \\in \\mathbb{Z}, \\; a - bk \\ge 0 \\} \\subset \\mathbb{Z}_{\\ge 0}.$$
          <p><em>Шаг 1. Множество $S$ не пусто:</em></p>
          <ul>
            <li>Если $a \\ge 0$, выберем $k = 0$, тогда $a - b\\cdot 0 = a \\ge 0 \\implies a \\in S$.</li>
            <li>Если $a < 0$, выберем $k = a$. Так как $b \\ge 1$, то $1 - b \\le 0$, следовательно $a - ba = a(1 - b) \\ge 0 \\implies a - ba \\in S$.</li>
          </ul>
          <p><em>Шаг 2. Применение принципа наименьшего элемента:</em></p>
          <p>Множество $S$ — непустое подмножество неотрицательных целых чисел. По аксиоме индукции (принципу вполне упорядоченности $\\mathbb{N}_0$) в множестве $S$ существует наименьший элемент. Обозначим его $r$.</p>
          <p>По определению множества $S$, раз $r \\in S$, то $r \\ge 0$ и существует такое $q \\in \\mathbb{Z}$, что $r = a - bq \\implies a = bq + r$.</p>
          <p><em>Шаг 3. Докажем, что $r < b$:</em></p>
          <p>Предположим противное: $r \\ge b$. Рассмотрим число $r' = r - b$:</p>
          $$r' = (a - bq) - b = a - b(q + 1).$$
          <p>Так как $r \\ge b$, то $r' \\ge 0$. Значит, число $r'$ имеет вид $a - bk'$ при $k' = q + 1$ и неотрицательно, то есть $r' \\in S$.</p>
          <p>Но $r' = r - b < r$ (поскольку $b > 0$). Мы получили элемент из $S$, который строго меньше наименьшего элемента $r$. Противоречие! Следовательно, $0 \\le r < b$. Существование доказано.</p>

          <p><strong>ЧАСТЬ II: ЕДИНСТВЕННОСТЬ</strong></p>
          <p>Пусть существуют две пары $(q_1, r_1)$ и $(q_2, r_2)$, удовлетворяющие условиям теоремы:</p>
          $$a = b q_1 + r_1, \\quad 0 \\le r_1 < b,$$
          $$a = b q_2 + r_2, \\quad 0 \\le r_2 < b.$$
          <p>Вычтем одно равенство из другого:</p>
          $$b q_1 + r_1 = b q_2 + r_2 \\implies b(q_1 - q_2) = r_2 - r_1.$$
          <p>Отсюда следует, что разность $r_2 - r_1$ кратна $b$.</p>
          <p>Оценим величину разности $r_2 - r_1$. Так как $0 \\le r_1 < b$ и $0 \\le r_2 < b$, имеем двойные неравенства:</p>
          $$-b < -r_1 \\le 0 \\quad \\text{и} \\quad 0 \\le r_2 < b.$$
          <p>Складывая их, получаем строгую границу:</p>
          $$-b < r_2 - r_1 < b.$$
          <p>Единственным целым числом в интервале $(-b, b)$, которое делится на $b$, является число $0$!</p>
          <p>Следовательно, $r_2 - r_1 = 0 \\implies r_1 = r_2$.</p>
          <p>Подставляя это в $b(q_1 - q_2) = 0$, ввиду $b \\ne 0$, получаем $q_1 - q_2 = 0 \\implies q_1 = q_2$.</p>
          <p>Единственность частного и остатка доказана полностью.</p>
          <span class="qed">$\\blacksquare$</span>
        </div>
      </details>

      <div class="callout callout-warn">
        <div class="callout-header">
          <span class="callout-tag">Ловушка коллоквиума</span>
          <span class="callout-title">Деление отрицательных чисел</span>
        </div>
        <div class="callout-body">
          Экзаменатор может спросить: <em>«Чему равны частное и остаток при делении $-17$ на $5$?»</em><br>
          Студент часто ошибочно отвечает $q = -3, r = -2$. Но по теореме остаток строго неотрицателен: $0 \\le r < b$!<br>
          Правильное разложение: $-17 = 5 \\cdot (-4) + 3$, то есть <strong>неполное частное $q = -4$, а остаток $r = 3$</strong>.
        </div>
      </div>

      <div class="key-takeaways">
        <div class="key-takeaways-title">Шпаргалка к билету 6</div>
        <ul>
          <li>Делимость $b \\mid a \\iff \\exists q: a = bq$.</li>
          <li>Теорема о делении с остатком: $a = bq + r$, где $0 \\le r < b$.</li>
          <li>Существование: через принцип наименьшего элемента множества $S = \\{a - bk \\ge 0\\}$.</li>
          <li>Единственность: через ограничение $-b < r_2 - r_1 < b$ на кратное $b$.</li>
        </ul>
      </div>
    </section>
    <div class="engraved-divider">✦ ──────── ◈ ──────── ✦</div>
    """
