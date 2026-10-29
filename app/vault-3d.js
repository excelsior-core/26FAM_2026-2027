/**
 * app/vault-3d.js - Процедурный 3D WebGL / Canvas движок для экрана авторизации
 * Три мистических артефакта:
 * 1. Астролябия Познания (Celestial Armillary Astrolabe)
 * 2. 4D Гиперкуб / Тессеракт (Hyperdimensional Tesseract)
 * 3. Криптекс Ордена (Ancient Mathematical Cryptex)
 * Чистый визуал без кнопок и подписей на экране. Инерция мыши, 60 FPS, реакция на ввод пароля.
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
    // Выбираем случайно при входе на сайт
    const randomIndex = Math.floor(Math.random() * this.types.length);
    this.currentType = this.types[randomIndex];

    this.width = 0;
    this.height = 0;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.rotX = 0.3;
    this.rotY = 0.4;
    this.rotZ = 0;
    this.targetRotX = 0.3;
    this.targetRotY = 0.4;
    this.isDragging = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;

    this.time = 0;
    this.keyPressPulse = 0;
    this.cipherStep = 0;
    this.isRunning = true;

    // 16 вершин тессеракта в 4D
    this.tesseractVertices = [];
    for (let i = 0; i < 16; i++) {
      this.tesseractVertices.push([
        (i & 1) ? 1 : -1,
        (i & 2) ? 1 : -1,
        (i & 4) ? 1 : -1,
        (i & 8) ? 1 : -1
      ]);
    }
    this.tesseractEdges = [];
    for (let i = 0; i < 16; i++) {
      for (let j = i + 1; j < 16; j++) {
        const diff = (i ^ j);
        if (diff === 1 || diff === 2 || diff === 4 || diff === 8) {
          this.tesseractEdges.push([i, j]);
        }
      }
    }

    this.cryptexGlyphs = ['∇', '∫', '∮', '∂', '∞', 'ℝ', '∑', '∀', '∃', 'λ', 'μ', 'Ω'];

    this.resize();
    this.bindEvents();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  resize() {
    const rect = this.container.getBoundingClientRect();
    this.width = rect.width || 340;
    this.height = rect.height || 300;
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.ctx.scale(this.dpr, this.dpr);
  }

  bindEvents() {
    window.addEventListener('resize', () => this.resize());

    const onStart = (x, y) => {
      this.isDragging = true;
      this.lastMouseX = x;
      this.lastMouseY = y;
    };

    const onMove = (x, y) => {
      if (!this.isDragging) {
        const rect = this.container.getBoundingClientRect();
        const nx = (x - rect.left) / this.width - 0.5;
        const ny = (y - rect.top) / this.height - 0.5;
        this.targetRotY = nx * 1.5;
        this.targetRotX = -ny * 1.5;
        return;
      }
      const dx = x - this.lastMouseX;
      const dy = y - this.lastMouseY;
      this.targetRotY += dx * 0.01;
      this.targetRotX += dy * 0.01;
      this.lastMouseX = x;
      this.lastMouseY = y;
    };

    const onEnd = () => {
      this.isDragging = false;
    };

    this.container.addEventListener('mousedown', (e) => onStart(e.clientX, e.clientY));
    window.addEventListener('mousemove', (e) => onMove(e.clientX, e.clientY));
    window.addEventListener('mouseup', onEnd);

    this.container.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) onStart(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (this.isDragging && e.touches.length === 1) {
        onMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    window.addEventListener('touchend', onEnd);
  }

  triggerKeyPulse() {
    this.keyPressPulse = 1.0;
    this.cipherStep += 1;
    this.targetRotY += 0.35;
  }

  pause() {
    this.isRunning = false;
  }

  resume() {
    if (!this.isRunning) {
      this.isRunning = true;
      requestAnimationFrame(this.animate);
    }
  }

  animate() {
    if (!this.isRunning) return;

    this.time += 0.016;
    this.keyPressPulse *= 0.94;

    this.rotX += (this.targetRotX - this.rotX) * 0.08;
    this.rotY += (this.targetRotY - this.rotY) * 0.08;

    this.ctx.clearRect(0, 0, this.width, this.height);

    const cx = this.width / 2;
    const cy = this.height / 2;

    if (this.currentType === 'astrolabe') {
      this.drawAstrolabe(cx, cy);
    } else if (this.currentType === 'tesseract') {
      this.drawTesseract(cx, cy);
    } else if (this.currentType === 'cryptex') {
      this.drawCryptex(cx, cy);
    }

    requestAnimationFrame(this.animate);
  }

  // --- 1. АСТРОЛЯБИЯ ПОЗНАНИЯ ---
  drawAstrolabe(cx, cy) {
    const ctx = this.ctx;
    const radius = Math.min(this.width, this.height) * 0.38;
    const baseGlow = 0.2 + this.keyPressPulse * 0.6;

    const radGlow = ctx.createRadialGradient(cx, cy, 10, cx, cy, radius * 1.3);
    radGlow.addColorStop(0, `rgba(212, 163, 115, ${baseGlow * 0.2})`);
    radGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = radGlow;
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.save();
    ctx.translate(cx, cy);

    const rings = [
      { r: radius, rotSpeed: 0.4, tilt: this.rotX + 0.2, spin: this.time * 0.3 + this.rotY, color: '#D4A373' },
      { r: radius * 0.82, rotSpeed: -0.6, tilt: this.rotX + 1.2, spin: -this.time * 0.5 + this.rotY * 1.2, color: '#E5BA8F' },
      { r: radius * 0.64, rotSpeed: 0.8, tilt: this.rotX - 0.7, spin: this.time * 0.7 + this.rotY * 0.8, color: '#C89355' }
    ];

    for (let idx = 0; idx < rings.length; idx++) {
      const ring = rings[idx];
      ctx.save();
      ctx.rotate(ring.spin);

      const scaleY = Math.cos(ring.tilt);
      ctx.scale(1, Math.max(0.15, Math.abs(scaleY)));

      ctx.beginPath();
      ctx.arc(0, 0, ring.r, 0, Math.PI * 2);
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = ring.color;
      ctx.shadowColor = ring.color;
      ctx.shadowBlur = 8 + this.keyPressPulse * 16;
      ctx.stroke();

      const ticks = 16;
      for (let t = 0; t < ticks; t++) {
        const ang = (t / ticks) * Math.PI * 2;
        const x1 = Math.cos(ang) * (ring.r - 5);
        const y1 = Math.sin(ang) * (ring.r - 5);
        const x2 = Math.cos(ang) * (ring.r + 5);
        const y2 = Math.sin(ang) * (ring.r + 5);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(255, 230, 180, 0.6)';
        ctx.stroke();
      }

      ctx.restore();
    }

    const corePulse = 8 + Math.sin(this.time * 3) * 3 + this.keyPressPulse * 8;
    ctx.beginPath();
    ctx.arc(0, 0, corePulse, 0, Math.PI * 2);
    ctx.fillStyle = '#FFF2D6';
    ctx.shadowColor = '#D4A373';
    ctx.shadowBlur = 24 + this.keyPressPulse * 20;
    ctx.fill();

    for (let p = 0; p < 8; p++) {
      const pAng = (p / 8) * Math.PI * 2 + this.time * 0.4;
      const pDist = radius * 0.4 + Math.sin(this.time * 2 + p) * 15;
      const px = Math.cos(pAng) * pDist;
      const py = Math.sin(pAng) * pDist * 0.6;
      ctx.beginPath();
      ctx.arc(px, py, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 240, 200, 0.8)';
      ctx.shadowBlur = 6;
      ctx.fill();
    }

    ctx.restore();
  }

  // --- 2. 4D ГИПЕРКУБ / ТЕССЕРАКТ ---
  drawTesseract(cx, cy) {
    const ctx = this.ctx;
    const scale = Math.min(this.width, this.height) * 0.28;

    const angleXW = this.time * 0.6 + this.rotY;
    const angleYZ = this.time * 0.4 + this.rotX;

    const cosA = Math.cos(angleXW);
    const sinA = Math.sin(angleXW);
    const cosB = Math.cos(angleYZ);
    const sinB = Math.sin(angleYZ);

    const projected2D = [];
    const cameraDist4D = 2.4;
    const cameraDist3D = 3.2;

    for (let i = 0; i < 16; i++) {
      let [x, y, z, w] = this.tesseractVertices[i];

      const xRot = x * cosA - w * sinA;
      const wRot = x * sinA + w * cosA;
      x = xRot;
      w = wRot;

      const yRot = y * cosB - z * sinB;
      const zRot = y * sinB + z * cosB;
      y = yRot;
      z = zRot;

      const wFactor = 1 / (cameraDist4D - w);
      const x3 = x * wFactor;
      const y3 = y * wFactor;
      const z3 = z * wFactor;

      const zFactor = 1 / (cameraDist3D - z3);
      const x2 = x3 * zFactor * scale * 3.6 + cx;
      const y2 = y3 * zFactor * scale * 3.6 + cy;

      projected2D.push({ x: x2, y: y2, depth: z3 });
    }

    ctx.lineWidth = 1.6;
    for (const [i, j] of this.tesseractEdges) {
      const p1 = projected2D[i];
      const p2 = projected2D[j];

      const avgDepth = (p1.depth + p2.depth) / 2;
      const alpha = Math.max(0.15, Math.min(0.9, 0.5 + avgDepth * 0.5)) + this.keyPressPulse * 0.3;

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.strokeStyle = `rgba(181, 52, 31, ${alpha})`;
      ctx.shadowColor = '#B5341F';
      ctx.shadowBlur = 6 + this.keyPressPulse * 12;
      ctx.stroke();
    }

    for (let i = 0; i < 16; i++) {
      const p = projected2D[i];
      const ptRadius = Math.max(2, 3.5 + p.depth * 2) + this.keyPressPulse * 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, ptRadius, 0, Math.PI * 2);
      ctx.fillStyle = '#FFD79E';
      ctx.shadowColor = '#FF8C42';
      ctx.shadowBlur = 10 + this.keyPressPulse * 14;
      ctx.fill();
    }
  }

  // --- 3. КРИПТЕКС ОРДЕНА ---
  drawCryptex(cx, cy) {
    const ctx = this.ctx;
    const radius = Math.min(this.width, this.height) * 0.36;
    const ringsCount = 3;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this.rotX * 0.5);

    const cylinderWidth = radius * 1.5;
    const ringSpacing = cylinderWidth / (ringsCount + 1);

    for (let r = 0; r < ringsCount; r++) {
      const rx = -cylinderWidth / 2 + (r + 1) * ringSpacing;
      const ringOffsetAngle = (this.cipherStep * (r % 2 === 0 ? 0.5 : -0.5)) + this.time * (0.2 + r * 0.1) + this.rotY;

      ctx.save();
      ctx.translate(rx, 0);

      ctx.beginPath();
      ctx.ellipse(0, 0, 16, radius, 0, 0, Math.PI * 2);
      ctx.strokeStyle = '#D4A373';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#D4A373';
      ctx.shadowBlur = 10 + this.keyPressPulse * 15;
      ctx.stroke();

      ctx.font = '12px "Unbounded", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const totalGlyphs = this.cryptexGlyphs.length;
      for (let g = 0; g < totalGlyphs; g++) {
        const glyphAngle = ringOffsetAngle + (g / totalGlyphs) * Math.PI * 2;
        const gy = Math.sin(glyphAngle) * (radius * 0.85);
        const gz = Math.cos(glyphAngle);

        if (gz > 0) {
          const alpha = Math.max(0.2, gz) + this.keyPressPulse * 0.4;
          const scale = 0.8 + gz * 0.4;
          ctx.save();
          ctx.translate(0, gy);
          ctx.scale(scale, scale);
          ctx.fillStyle = `rgba(255, 235, 205, ${alpha})`;
          ctx.shadowColor = '#FFC078';
          ctx.shadowBlur = 8 * gz;
          const glyph = this.cryptexGlyphs[(g + r * 3) % totalGlyphs];
          ctx.fillText(glyph, 0, 0);
          ctx.restore();
        }
      }

      ctx.restore();
    }

    ctx.beginPath();
    ctx.moveTo(-cylinderWidth / 2 - 15, 0);
    ctx.lineTo(cylinderWidth / 2 + 15, 0);
    ctx.strokeStyle = 'rgba(212, 163, 115, 0.7)';
    ctx.lineWidth = 3;
    ctx.shadowBlur = 12;
    ctx.stroke();

    ctx.restore();
  }
}
