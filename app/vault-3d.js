/**
 * app/vault-3d.js - Процедурный 3D артефакт познания для экрана авторизации (The Vault Gate)
 * Реализация:
 * 1. Астролябия Познания (Celestial Armillary Astrolabe)
 * 2. 4D Гиперкуб / Тессеракт (Hyperdimensional Tesseract)
 * 3. Древний Криптекс Ордена (Order Cryptex со знаками математических операторов)
 *
 * Никаких лишних служебных кнопок и надписей. Инерция мыши, золотая пыль, реакция на ввод пароля.
 * При авторизации цикл рендеринга полностью глушится (Zero-CPU/GPU).
 */

export class Vault3D {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.canvas = document.createElement('canvas');
    this.canvas.className = 'vault-3d-canvas';
    this.container.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');

    this.types = ['astrolabe', 'tesseract', 'cryptex'];
    this.currentType = this.types[Math.floor(Math.random() * this.types.length)];

    this.width = 0;
    this.height = 0;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.rotX = 0.35;
    this.rotY = 0.45;
    this.rotZ = 0;
    this.targetRotX = 0.35;
    this.targetRotY = 0.45;
    this.isDragging = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;

    this.time = 0;
    this.pulse = 0;
    this.cipherStep = 0;
    this.isRunning = true;
    this.rafId = null;

    // 16 4D-вершин тессеракта
    this.tesseractVertices = [];
    for (let i = 0; i < 16; i++) {
      this.tesseractVertices.push([
        (i & 1) ? 1 : -1,
        (i & 2) ? 1 : -1,
        (i & 4) ? 1 : -1,
        (i & 8) ? 1 : -1
      ]);
    }

    // Ребра тессеракта
    this.tesseractEdges = [];
    for (let i = 0; i < 16; i++) {
      for (let j = i + 1; j < 16; j++) {
        let diff = 0;
        for (let k = 0; k < 4; k++) {
          if (this.tesseractVertices[i][k] !== this.tesseractVertices[j][k]) diff++;
        }
        if (diff === 1) this.tesseractEdges.push([i, j]);
      }
    }

    // Математические символы для колец криптекса
    this.cryptexSymbols = ['∇', '∫', '∮', '∂', '∞', 'ℝ', '∑', 'lim', '∀', '∃', 'ℂ', 'π'];

    // Парящие золотые частицы библиотечной пыли
    this.dustParticles = [];
    for (let i = 0; i < 48; i++) {
      this.dustParticles.push({
        x: (Math.random() - 0.5) * 360,
        y: (Math.random() - 0.5) * 360,
        z: (Math.random() - 0.5) * 200,
        vy: -0.2 - Math.random() * 0.4,
        size: 0.8 + Math.random() * 1.5,
        opacity: 0.15 + Math.random() * 0.45,
        flicker: Math.random() * Math.PI * 2
      });
    }

    this.initEvents();
    this.resize();
    this.animate();
  }

  initEvents() {
    window.addEventListener('resize', () => this.resize());

    const handleStart = (clientX, clientY) => {
      this.isDragging = true;
      this.lastMouseX = clientX;
      this.lastMouseY = clientY;
    };

    const handleMove = (clientX, clientY) => {
      if (!this.isDragging) {
        // Мягкий параллакс курсора
        const rect = this.canvas.getBoundingClientRect();
        const nx = (clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
        const ny = (clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
        this.targetRotY = 0.45 + nx * 0.35;
        this.targetRotX = 0.35 - ny * 0.35;
        return;
      }
      const dx = clientX - this.lastMouseX;
      const dy = clientY - this.lastMouseY;
      this.rotY += dx * 0.008;
      this.rotX += dy * 0.008;
      this.targetRotY = this.rotY;
      this.targetRotX = this.rotX;
      this.lastMouseX = clientX;
      this.lastMouseY = clientY;
    };

    const handleEnd = () => {
      this.isDragging = false;
    };

    this.canvas.addEventListener('mousedown', (e) => handleStart(e.clientX, e.clientY));
    window.addEventListener('mousemove', (e) => handleMove(e.clientX, e.clientY));
    window.addEventListener('mouseup', handleEnd);

    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches[0]) handleStart(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });
    window.addEventListener('touchmove', (e) => {
      if (e.touches[0]) handleMove(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });
    window.addEventListener('touchend', handleEnd);
  }

  resize() {
    if (!this.container) return;
    const rect = this.container.getBoundingClientRect();
    this.width = rect.width || 320;
    this.height = rect.height || 220;
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  onKeyPress() {
    this.pulse = 1.0;
    this.cipherStep += 1;
    this.targetRotY += 0.25;
  }

  onError() {
    this.pulse = 1.5;
    // Драматичное встряхивание
    this.rotX += (Math.random() - 0.5) * 0.3;
    this.rotY += (Math.random() - 0.5) * 0.5;
  }

  pause() {
    this.isRunning = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  resume() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.animate();
    }
  }

  animate() {
    if (!this.isRunning) return;
    this.time += 0.014;
    this.pulse *= 0.92;

    this.rotX += (this.targetRotX - this.rotX) * 0.06;
    this.rotY += (this.targetRotY - this.rotY) * 0.06;

    this.ctx.clearRect(0, 0, this.width, this.height);

    const cx = this.width / 2;
    const cy = this.height / 2;

    this.renderDust(cx, cy);

    if (this.currentType === 'astrolabe') {
      this.renderAstrolabe(cx, cy);
    } else if (this.currentType === 'tesseract') {
      this.renderTesseract(cx, cy);
    } else {
      this.renderCryptex(cx, cy);
    }

    this.rafId = requestAnimationFrame(() => this.animate());
  }

  renderDust(cx, cy) {
    const ctx = this.ctx;
    ctx.save();
    for (const p of this.dustParticles) {
      p.y += p.vy;
      p.flicker += 0.03;
      if (p.y < -120) p.y = 120;

      const alpha = p.opacity * (0.6 + 0.4 * Math.sin(p.flicker));
      ctx.fillStyle = `rgba(212, 175, 55, ${alpha.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(cx + p.x, cy + p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // ==========================================
  // 1. АСТРОЛЯБИЯ ПОЗНАНИЯ
  // ==========================================
  renderAstrolabe(cx, cy) {
    const ctx = this.ctx;
    const baseRadius = Math.min(this.width, this.height) * 0.34;
    const rings = [
      { r: baseRadius * 1.0, rx: this.rotX * 0.8 + Math.sin(this.time * 0.6) * 0.2, ry: this.rotY + this.time * 0.4, w: 2.5, gold: '#E5C158' },
      { r: baseRadius * 0.82, rx: this.rotX + 0.5, ry: -this.rotY * 0.9 - this.time * 0.5, w: 1.8, gold: '#D4AF37' },
      { r: baseRadius * 0.64, rx: -this.rotX * 0.7 + this.time * 0.3, ry: this.rotY * 1.2 + 0.8, w: 1.4, gold: '#C5A059' },
      { r: baseRadius * 0.44, rx: this.rotX * 1.3, ry: this.rotY - this.time * 0.7, w: 1.0, gold: '#AA8238' }
    ];

    ctx.save();
    ctx.translate(cx, cy);

    // Центральное свечение
    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, baseRadius * 1.2);
    glow.addColorStop(0, `rgba(212, 175, 55, ${0.12 + this.pulse * 0.2})`);
    glow.addColorStop(1, 'rgba(212, 175, 55, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, baseRadius * 1.2, 0, Math.PI * 2);
    ctx.fill();

    // Рисование колец астролябии
    for (const ring of rings) {
      ctx.strokeStyle = ring.gold;
      ctx.lineWidth = ring.w + this.pulse * 0.5;
      ctx.shadowColor = 'rgba(212, 175, 55, 0.4)';
      ctx.shadowBlur = 6 + this.pulse * 10;

      ctx.beginPath();
      const points = 64;
      for (let i = 0; i <= points; i++) {
        const theta = (i / points) * Math.PI * 2;
        let x = ring.r * Math.cos(theta);
        let y = ring.r * Math.sin(theta);
        let z = 0;

        // Поворот Y
        let x1 = x * Math.cos(ring.ry) + z * Math.sin(ring.ry);
        let z1 = -x * Math.sin(ring.ry) + z * Math.cos(ring.ry);
        // Поворот X
        let y2 = y * Math.cos(ring.rx) - z1 * Math.sin(ring.rx);
        let z2 = y * Math.sin(ring.rx) + z1 * Math.cos(ring.rx);

        const fov = 340;
        const scale = fov / (fov + z2);
        const px = x1 * scale;
        const py = y2 * scale;

        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    // Центральная сфера / Земля / Солнце
    const coreGrad = ctx.createRadialGradient(-3, -3, 0, 0, 0, 10);
    coreGrad.addColorStop(0, '#FFF5D6');
    coreGrad.addColorStop(0.5, '#E5C158');
    coreGrad.addColorStop(1, '#664E1C');
    ctx.fillStyle = coreGrad;
    ctx.shadowBlur = 12 + this.pulse * 16;
    ctx.shadowColor = '#D4AF37';
    ctx.beginPath();
    ctx.arc(0, 0, 7 + this.pulse * 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // ==========================================
  // 2. 4D ГИПЕРКУБ / ТЕССЕРАКТ
  // ==========================================
  renderTesseract(cx, cy) {
    const ctx = this.ctx;
    const baseScale = Math.min(this.width, this.height) * 0.28;

    // Углы вращения в 4D
    const angleXW = this.time * 0.45 + this.rotX;
    const angleYW = this.time * 0.35 + this.rotY;
    const angleZW = this.cipherStep * 0.15;

    const projected = this.tesseractVertices.map(v => {
      let [x, y, z, w] = v;

      // Вращение в плоскости X-W
      let x1 = x * Math.cos(angleXW) - w * Math.sin(angleXW);
      let w1 = x * Math.sin(angleXW) + w * Math.cos(angleXW);

      // Вращение в плоскости Y-W
      let y1 = y * Math.cos(angleYW) - w1 * Math.sin(angleYW);
      let w2 = y * Math.sin(angleYW) + w1 * Math.cos(angleYW);

      // Вращение в плоскости Z-W
      let z1 = z * Math.cos(angleZW) - w2 * Math.sin(angleZW);
      let w3 = z * Math.sin(angleZW) + w2 * Math.cos(angleZW);

      // 4D -> 3D стереографическая перспектива
      const dist4 = 2.4;
      const s4 = 1 / (dist4 - w3);
      let x3d = x1 * s4 * baseScale;
      let y3d = y1 * s4 * baseScale;
      let z3d = z1 * s4 * baseScale;

      // 3D вращение по камере
      let rx = x3d * Math.cos(this.rotY * 0.5) + z3d * Math.sin(this.rotY * 0.5);
      let rz = -x3d * Math.sin(this.rotY * 0.5) + z3d * Math.cos(this.rotY * 0.5);
      let ry = y3d * Math.cos(this.rotX * 0.5) - rz * Math.sin(this.rotX * 0.5);
      let rz2 = y3d * Math.sin(this.rotX * 0.5) + rz * Math.cos(this.rotX * 0.5);

      const fov = 320;
      const s3 = fov / (fov + rz2);
      return {
        px: cx + rx * s3,
        py: cy + ry * s3,
        depth: rz2
      };
    });

    ctx.save();

    // Ребра 4D-куба
    for (const [i, j] of this.tesseractEdges) {
      const p1 = projected[i];
      const p2 = projected[j];
      const avgDepth = (p1.depth + p2.depth) / 2;
      const alpha = Math.max(0.12, Math.min(0.85, 0.45 - avgDepth * 0.003 + this.pulse * 0.3));

      ctx.strokeStyle = `rgba(212, 175, 55, ${alpha.toFixed(3)})`;
      ctx.lineWidth = 1.2 + this.pulse * 0.8;
      ctx.shadowColor = '#D4AF37';
      ctx.shadowBlur = 4 + this.pulse * 6;

      ctx.beginPath();
      ctx.moveTo(p1.px, p1.py);
      ctx.lineTo(p2.px, p2.py);
      ctx.stroke();
    }

    // Вершины
    for (const p of projected) {
      const vAlpha = Math.max(0.2, Math.min(1.0, 0.6 - p.depth * 0.004 + this.pulse * 0.4));
      ctx.fillStyle = `rgba(255, 245, 214, ${vAlpha.toFixed(3)})`;
      ctx.shadowColor = '#E5C158';
      ctx.shadowBlur = 8 + this.pulse * 8;
      ctx.beginPath();
      ctx.arc(p.px, p.py, 2.5 + this.pulse * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // ==========================================
  // 3. ДРЕВНИЙ КРИПТЕКС ОРДЕНА
  // ==========================================
  renderCryptex(cx, cy) {
    const ctx = this.ctx;
    const ringCount = 5;
    const ringWidth = 28;
    const radius = Math.min(this.width, this.height) * 0.30;
    const totalW = ringCount * ringWidth;

    ctx.save();
    ctx.translate(cx, cy);

    // Наклон криптекса в изометрии
    const tilt = this.rotX * 0.6;
    const spinBase = this.rotY + this.time * 0.2;

    for (let r = 0; r < ringCount; r++) {
      const rx = (r - (ringCount - 1) / 2) * ringWidth;
      const ringSpin = spinBase + (this.cipherStep * (r % 2 === 0 ? 0.35 : -0.35));

      // Цилиндрическая грань кольца
      ctx.save();
      ctx.translate(rx, 0);

      // Багетные резные насечки золотого обода
      ctx.strokeStyle = r % 2 === 0 ? '#D4AF37' : '#C5A059';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-ringWidth / 2 + 1, -radius, ringWidth - 2, radius * 2);

      // Математические символы по кругу цилиндра
      const count = this.cryptexSymbols.length;
      ctx.font = 'bold 13px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      for (let s = 0; s < count; s++) {
        const theta = (s / count) * Math.PI * 2 + ringSpin;
        const cosTheta = Math.cos(theta);
        const sinTheta = Math.sin(theta);

        // Показываем только фронтальные символы
        if (sinTheta > 0) {
          const sy = -cosTheta * radius * Math.cos(tilt);
          const fontAlpha = Math.max(0.15, sinTheta);
          ctx.fillStyle = `rgba(244, 235, 225, ${fontAlpha.toFixed(2)})`;
          ctx.shadowColor = '#D4AF37';
          ctx.shadowBlur = (sinTheta > 0.8 ? 8 : 0) + this.pulse * 6;

          const symbol = this.cryptexSymbols[(s + r * 2) % count];
          ctx.fillText(symbol, 0, sy);
        }
      }

      ctx.restore();
    }

    // Осевой шпиндель и замочные бронзовые наконечники
    ctx.strokeStyle = '#AA8238';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-totalW / 2 - 16, 0);
    ctx.lineTo(totalW / 2 + 16, 0);
    ctx.stroke();

    // Левый и правый золотые набалдашники
    ctx.fillStyle = '#D4AF37';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#D4AF37';
    ctx.beginPath();
    ctx.arc(-totalW / 2 - 14, 0, 10, 0, Math.PI * 2);
    ctx.arc(totalW / 2 + 14, 0, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
