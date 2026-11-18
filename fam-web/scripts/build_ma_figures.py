"""Rebuild the four self-contained vector diagrams in calculus notes 18–20."""
from pathlib import Path
import base64
import html
import math
import re

ROOT = Path(__file__).resolve().parents[2]
PALETTES = {
    'light': ('#f8f6f0', '#202e29', '#6b7a73', '#285f82', '#8a6b32', '#a83e32', '#2e6945'),
    'dark': ('#17221e', '#e8e9dd', '#96a59e', '#68a6d4', '#d5b878', '#e98c80', '#65b882'),
    'parchment': ('#eee3cc', '#372f22', '#7d715e', '#34597b', '#795a24', '#94382e', '#346543'),
}


class Diagram:
    def __init__(self, theme, title, height=480):
        self.bg, self.ink, self.muted, self.blue, self.gold, self.red, self.green = PALETTES[theme]
        self.parts = [f'<svg xmlns="http://www.w3.org/2000/svg" width="800" height="{height}" viewBox="0 0 800 {height}" role="img">',
                      f'<title>{html.escape(title)}</title>',
                      '<style>text{font-family:Arial,DejaVu Sans,sans-serif;font-size:16px} .small{font-size:14px}</style>',
                      f'<rect width="800" height="{height}" fill="{self.bg}"/>']

    def text(self, x, y, text, color=None, anchor='start', small=False):
        self.parts.append(f'<text x="{x}" y="{y}" fill="{color or self.ink}" text-anchor="{anchor}" class="{"small" if small else "label"}">{html.escape(text)}</text>')

    def line(self, x1, y1, x2, y2, color=None, dash=False, width=2):
        self.parts.append(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{color or self.ink}" stroke-width="{width}"' + (' stroke-dasharray="5 5"' if dash else '') + '/>')

    def path(self, data, color=None, width=3):
        self.parts.append(f'<path d="{data}" fill="none" stroke="{color or self.blue}" stroke-width="{width}" stroke-linejoin="round"/>')

    def dot(self, x, y, color=None, label=None, dx=10, dy=-10):
        self.parts.append(f'<circle cx="{x}" cy="{y}" r="4.5" fill="{color or self.blue}"/>')
        if label:
            self.text(x+dx, y+dy, label, color)

    def arrow(self, x1, y1, x2, y2, color=None):
        self.line(x1, y1, x2, y2, color, width=2.5)
        a = math.atan2(y2-y1, x2-x1)
        points = [(x2-11*math.cos(a-d), y2-11*math.sin(a-d)) for d in (-.4, .4)]
        self.path(f'M {points[0][0]},{points[0][1]} L {x2},{y2} L {points[1][0]},{points[1][1]}', color, 2.5)

    def axes(self, ox, oy, left, right, top, bottom):
        self.arrow(left, oy, right, oy)
        self.arrow(ox, bottom, ox, top)
        self.text(right+10, oy+5, 'x')
        self.text(ox-5, top-12, 'y')

    def finish(self):
        return '\n'.join(self.parts + ['</svg>'])


def differential(theme):
    d = Diagram(theme, 'Геометрический смысл дифференциала', 510)
    d.text(32, 32, 'Дифференциал и приращение функции')
    # Exact quadratic: f_screen(x)=300−0.4(x−220)−0.0008(x−220)².
    # At A its derivative is −0.4; C lies on the tangent and D on the curve.
    f = lambda x: 300-.4*(x-220)-.0008*(x-220)**2
    d.axes(85, 405, 55, 735, 80, 430)
    d.text(68, 426, 'O', d.muted)
    for x, label in [(220, 'x₀'), (520, 'x₀ + Δx')]:
        d.line(x, 405, x, f(x), d.muted, True, 1)
        d.text(x, 430, label, anchor='middle')
    d.line(85, 300, 520, 300, d.muted, True, 1)
    d.text(72, 294, 'f(x₀)', anchor='end')
    d.line(135, 334, 650, 128, d.gold)
    d.text(645, 190, 'касательная', d.gold, small=True)
    d.path('M '+' L '.join(f'{x},{f(x):.3f}' for x in range(135, 596, 2)))
    d.text(600, 52, 'y = f(x)', d.blue)
    d.line(220, 300, 520, 108, d.green, True)
    d.text(305, 203, 'секущая AD', d.green, small=True)
    d.line(520, 300, 520, 180, d.gold, width=4)
    d.line(520, 180, 520, 108, d.red, width=4)
    for x,y,c,label,dx,dy in [(220,300,d.blue,'A',-23,-10),(520,300,d.muted,'B',10,5),(520,180,d.gold,'C',-25,5),(520,108,d.blue,'D',-25,0)]:
        d.dot(x,y,c,label,dx,dy)
    d.path('M 506,300 L 506,286 L 520,286', d.muted, 1)
    d.text(548, 241, 'BC = dy = f′(x₀) dx', d.gold, small=True)
    d.line(525, 108, 548, 108, d.red, True, 1)
    d.line(525, 180, 548, 180, d.red, True, 1)
    d.text(558, 85, 'CD = Δy − dy', d.red, small=True)
    d.text(558, 105, '= o(Δx)', d.red, small=True)
    d.text(370, 326, 'AB = dx = Δx', anchor='middle')
    d.text(85, 469, 'dy — приращение касательной; Δy = BD — приращение графика.', small=True)
    d.text(85, 492, 'Δy = dy + o(Δx),  Δx → 0', d.gold)
    return d.finish()


def parametric(theme):
    d = Diagram(theme, 'Параметрическая производная и вектор скорости', 510)
    d.text(32, 32, 'Эллипс: x = a cos t,  y = b sin t')
    d.text(32, 60, 'Верхняя половина: 0 ≤ t ≤ π', d.muted, small=True)
    d.axes(350, 365, 70, 735, 95, 390)
    d.path('M 110,365 A 240,180 0 0,1 590,365')
    x, y = 350+240/math.sqrt(2), 365-180/math.sqrt(2)
    slope = 180/240
    d.line(260, y+slope*(260-x), 675, y+slope*(675-x), d.gold)
    d.text(645, 330, 'касательная', d.gold, small=True)
    d.line(x,365,x,y,d.muted,True,1)
    d.line(350,y,x,y,d.muted,True,1)
    d.text(x,389,'x₀',anchor='middle')
    d.text(335,y+5,'y₀',anchor='end')
    d.text(99,389,'−a'); d.text(587,389,'a'); d.text(362,185,'b')
    d.text(333,386,'O',d.muted)
    d.arrow(x,y,x-120,y-90,d.red)
    d.text(405,130,'v = (−a sin t₀, b cos t₀)',d.red,small=True)
    d.dot(x,y,d.red,'M₀',12,-9)
    d.text(570,210,'t₀ = π/4',d.red,small=True)
    d.text(85,440,'dy/dx = (dy/dt) / (dx/dt) = −(b/a) cot t',d.gold)
    d.text(85,468,'При t₀ = π/4:  dy/dx = −b/a;   dx/dt ≠ 0.',small=True)
    d.text(85,494,'Вектор скорости направлен по касательной в сторону роста t.',small=True)
    return d.finish()


def fermat(theme):
    d = Diagram(theme, 'Теорема Ферма и недифференцируемый минимум', 520)
    d.text(32,32,'Теорема Ферма: в точке гладкого экстремума f′(x₀) = 0')
    d.line(408,70,408,485,d.muted,width=1)
    d.text(55,80,'Гладкий максимум',d.blue)
    d.axes(65,370,45,365,120,390)
    f = lambda x: 170+.005*(x-220)**2
    d.path('M '+' L '.join(f'{x},{f(x):.3f}' for x in range(75,366,2)))
    d.line(130,170,310,170,d.gold)
    d.line(220,370,220,170,d.muted,True,1)
    d.dot(220,170,d.gold)
    d.text(220,151,'f′(x₀) = 0',d.gold,anchor='middle')
    d.text(220,395,'x₀',anchor='middle')
    for x,c in [(120,d.green),(320,d.red)]:
        d.line(x,f(x),220,170,c,True)
        d.dot(x,f(x),c)
    d.text(55,430,'Слева: Δf/Δx ≥ 0',d.green)
    d.text(55,458,'Справа: Δf/Δx ≤ 0',d.red)
    d.text(55,486,'Производная существует ⇒ f′(x₀) = 0',small=True)
    d.text(450,80,'Угловая точка: y = |x|',d.red)
    d.axes(600,330,450,745,125,390)
    d.path('M 470,200 L 600,330 L 730,200',d.red)
    d.dot(600,330,d.red)
    d.text(585,355,'0',anchor='end')
    d.text(455,180,'f′₋(0) = −1',d.muted,small=True)
    d.text(655,180,'f′₊(0) = +1',d.muted,small=True)
    d.text(450,430,'Минимум в начале координат.')
    d.text(450,458,'Односторонние производные различны.',small=True)
    d.text(450,486,'Производная в нуле не существует.',d.red,small=True)
    return d.finish()


def rolle(theme):
    d = Diagram(theme, 'Теорема Ролля и разделение нулей производной', 510)
    d.text(32,32,'Теорема Ролля: f(a) = f(b) ⇒ ∃ ξ ∈ (a, b): f′(ξ) = 0')
    d.text(32,60,'f непрерывна на [a, b] и дифференцируема на (a, b).',d.muted,small=True)
    # Sinusoid gives true extrema and a true inflection, with no extra stationary point.
    f = lambda x: 240-105*math.sin(2*math.pi*(x-150)/520)
    d.axes(85,380,55,735,100,405)
    d.line(85,240,710,240,d.muted,True,1)
    d.text(100,227,'f(a) = f(b)',d.muted,small=True)
    d.path('M '+' L '.join(f'{x},{f(x):.3f}' for x in range(150,671,2)))
    d.text(687,225,'y = f(x)',d.blue,small=True)
    for x,label,c in [(150,'a',d.blue),(280,'ξ₁',d.gold),(540,'ξ₂',d.gold),(670,'b',d.blue)]:
        d.line(x,380,x,f(x),d.muted,True,1)
        d.dot(x,f(x),c)
        d.text(x,405,label,anchor='middle')
    for x in (280,540):
        d.line(x-65,f(x),x+65,f(x),d.gold)
    d.text(280,118,'f′(ξ₁) = 0',d.gold,anchor='middle')
    d.text(540,328,'f′(ξ₂) = 0',d.gold,anchor='middle')
    d.dot(410,240,d.green,'d',10,22)
    d.text(425,218,'f″(d) = 0',d.green,small=True)
    d.text(85,453,'Для этой гладкой кривой между ξ₁ и ξ₂ есть нуль f″.',small=True)
    d.text(85,480,'В общем случае: если f′ непрерывна на [ξ₁, ξ₂] и дифференцируема внутри.',small=True)
    return d.finish()


def main():
    lectures = ROOT / 'Storage/HSE/Математический Анализ/Лекции'
    for number, builders in [(18,[differential]),(19,[parametric]),(20,[fermat,rolle])]:
        note = next(lectures.glob(f'{number} */*.html'))
        source = note.read_text(encoding='utf-8')
        figures = list(re.finditer(r'<figure class="themed-figure">.*?</figure>',source,re.S))
        assert len(figures) == len(builders), (note, len(figures))
        for match, builder in reversed(list(zip(figures,builders))):
            figure = match.group()
            for theme in PALETTES:
                svg = builder(theme)
                encoded = base64.b64encode(svg.encode()).decode()
                figure, count = re.subn(r'(<img data-figure-theme="'+theme+r'" src=")data:image/svg\+xml;base64,[^"]+',lambda m:m[1]+'data:image/svg+xml;base64,'+encoded,figure)
                assert count == 1
            source = source[:match.start()] + figure + source[match.end():]
        note.write_text(source,encoding='utf-8')
        print(f'Updated lecture {number}: {len(builders)} diagrams, all three themes')


if __name__ == '__main__':
    main()
