/**
 * app/xray.js - Рентген-линза чертежника (Formula X-Ray Lens)
 * При зажатии Пробела или нажатии кнопки «Рентген» вокруг курсора раскрывается
 * круглая оптическая линза, обнажающая математический чертеж и скрытые формулы под интерфейсом.
 */

export class XRayLens {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'xray-lens-canvas';
    this.canvas.id = 'xray-canvas';
    document.body.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');

    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.active = false;
    this.targetRadius = 0;
    this.currentRadius = 0;
    this.maxRadius = 160;

    this.mouseX = this.width / 2;
    this.mouseY = this.height / 2;
    this.targetMouseX = this.width / 2;
    this.targetMouseY = this.height / 2;

    this.time = 0;
    this.formulas = [
      'e^{i\\pi} + 1 = 0',
      '\\int_{-\\infty}^\\infty e^{-x^2} dx = \\sqrt{\\pi}',
      '\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1',
      '\\det(A - \\lambda I) = 0',
      '\\nabla \\times \\mathbf{E} = -\\frac{\\partial \\mathbf{B}}{\\partial t}',
      '\\sum_{n=1}^\\infty \\frac{1}{n^2} = \\frac{\\pi^2}{6}',
      'f(x) = \\sum_{n=0}^\\infty \\frac{f^{(n)}(a)}{n!}(x - a)^n',
      '\\oint_C \\mathbf{F} \\cdot d\\mathbf{r} = \\iint_S (\\nabla \\times \\mathbf{F}) \\cdot d\\mathbf{S}',
      '\\chi(G) \\le \\Delta(G) + 1',
      'P(A|B) = \\frac{P(B|A)P(A)}{P(B)}'
    ];

    this.resize();
    this.bindEvents();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.ctx.scale(this.dpr, this.dpr);
  }

  bindEvents() {
    window.addEventListener('resize', () => this.resize());

    window.addEventListener('mousemove', (e) => {
      this.targetMouseX = e.clientX;
      this.targetMouseY = e.clientY;
    });

    window.addEventListener('keydown', (e) => {
      // Пробел активирует линзу (если не в поле ввода)
      if (e.code === 'Space' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        this.activate();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'Space') {
        this.deactivate();
      }
    });
  }

  toggle() {
    if (this.active) {
      this.deactivate();
    } else {
      this.activate();
    }
  }

  activate() {
    this.active = true;
    this.targetRadius = this.maxRadius;
    document.body.classList.add('xray-active');
  }

  deactivate() {
    this.active = false;
    this.targetRadius = 0;
    document.body.classList.remove('xray-active');
  }

  animate() {
    this.time += 0.02;

    // Плавное следование курсора и раскрытие радиуса
    this.mouseX += (this.targetMouseX - this.mouseX) * 0.2;
    this.mouseY += (this.targetMouseY - this.mouseY) * 0.2;
    this.currentRadius += (this.targetRadius - this.currentRadius) * 0.15;

    this.ctx.clearRect(0, 0, this.width, this.height);

    if (this.currentRadius > 1) {
      this.drawLens();
    }

    requestAnimationFrame(this.animate);
  }

  drawLens() {
    const ctx = this.ctx;
    const r = this.currentRadius;
    const mx = this.mouseX;
    const my = this.mouseY;

    ctx.save();

    // 1. Ограничение круглой областью (Clipping Path)
    ctx.beginPath();
    ctx.arc(mx, my, r, 0, Math.PI * 2);
    ctx.clip();

    // Темный чертежный фон линзы
    ctx.fillStyle = 'rgba(7, 10, 16, 0.94)';
    ctx.fillRect(mx - r, my - r, r * 2, r * 2);

    // 2. Координатная миллиметровая сетка
    const gridSize = 24;
    ctx.lineWidth = 0.5;
    ctx.strokeStyle = 'rgba(0, 210, 255, 0.12)';
    const startX = Math.floor((mx - r) / gridSize) * gridSize;
    const endX = mx + r;
    const startY = Math.floor((my - r) / gridSize) * gridSize;
    const endY = my + r;

    ctx.beginPath();
    for (let x = startX; x <= endX; x += gridSize) {
      ctx.moveTo(x, my - r);
      ctx.lineTo(x, my + r);
    }
    for (let y = startY; y <= endY; y += gridSize) {
      ctx.moveTo(mx - r, y);
      ctx.lineTo(mx + r, y);
    }
    ctx.stroke();

    // 3. Концентрические циркульные окружности
    ctx.beginPath();
    ctx.arc(mx, my, r * 0.45, 0, Math.PI * 2);
    ctx.arc(mx, my, r * 0.8, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(212, 163, 115, 0.25)';
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    // 4. Парящие математические формулы
    ctx.font = '11px "Golos Text", monospace';
    ctx.fillStyle = 'rgba(255, 215, 0, 0.75)';
    ctx.textAlign = 'center';

    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + this.time * 0.1;
      const dist = r * 0.55;
      const fx = mx + Math.cos(angle) * dist;
      const fy = my + Math.sin(angle) * dist;
      const formula = this.formulas[i % this.formulas.length];
      ctx.fillText(formula, fx, fy);
    }

    // 5. Центральный перекрестный визир (Crosshair)
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255, 90, 70, 0.8)';
    ctx.beginPath();
    ctx.moveTo(mx - 15, my);
    ctx.lineTo(mx + 15, my);
    ctx.moveTo(mx, my - 15);
    ctx.lineTo(mx, my + 15);
    ctx.stroke();

    ctx.restore();

    // 6. Латунная оправа линзы с делениями
    ctx.save();
    ctx.beginPath();
    ctx.arc(mx, my, r, 0, Math.PI * 2);
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = '#D4A373';
    ctx.shadowColor = 'rgba(212, 163, 115, 0.6)';
    ctx.shadowBlur = 14;
    ctx.stroke();

    // Текстовая метка координат под линзой
    if (r > 60) {
      ctx.font = '10px "Unbounded", monospace';
      ctx.fillStyle = '#D4A373';
      ctx.textAlign = 'center';
      ctx.fillText(`✦ X-RAY: ${Math.round(mx)} × ${Math.round(my)} · ФПМ`, mx, my + r + 18);
    }
    ctx.restore();
  }
}
