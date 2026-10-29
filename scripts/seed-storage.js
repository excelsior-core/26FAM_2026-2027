/**
 * scripts/seed-storage.js - Генерация эталонной структуры папок Storage/HSE
 * Создает конспекты и валидные PDF оригиналы для проверки сплит-ридера
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const HSE_DIR = path.join(ROOT, 'Storage', 'HSE');

function generateValidPdf(title, textLines) {
  const contentStream = [
    'BT',
    '/F1 20 Tf',
    '50 720 Td',
    `(${title.replace(/[\(\)]/g, '')}) Tj`,
    '/F1 12 Tf',
    '0 -35 Td'
  ];

  for (const line of textLines) {
    contentStream.push(`(${line.replace(/[\(\)]/g, '')}) Tj`);
    contentStream.push('0 -20 Td');
  }
  contentStream.push('ET');

  const streamData = contentStream.join('\n');
  const streamLen = Buffer.byteLength(streamData, 'utf8');

  let body = `%PDF-1.4\n`;
  const offsets = [];

  // obj 1: Catalog
  offsets.push(body.length);
  body += `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`;

  // obj 2: Pages
  offsets.push(body.length);
  body += `2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n`;

  // obj 3: Page
  offsets.push(body.length);
  body += `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n`;

  // obj 4: Contents
  offsets.push(body.length);
  body += `4 0 obj\n<< /Length ${streamLen} >>\nstream\n${streamData}\nendstream\nendobj\n`;

  // obj 5: Font
  offsets.push(body.length);
  body += `5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`;

  const xrefOffset = body.length;
  body += `xref\n0 6\n0000000000 65535 f \n`;
  for (const off of offsets) {
    body += `${String(off).padStart(10, '0')} 00000 n \n`;
  }
  body += `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.from(body, 'utf8');
}

function generateHtmlConspect(subject, title, date, bodyHtml) {
  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body {
      background: #0B080E;
      color: #F4EBE1;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      line-height: 1.7;
      max-width: 860px;
      margin: 0 auto;
      padding: 40px 24px;
    }
    h1, h2, h3 {
      font-family: 'Cormorant Garamond', Georgia, serif;
      color: #D4AF37;
      border-bottom: 1px solid rgba(212, 175, 55, 0.2);
      padding-bottom: 8px;
    }
    .badge {
      display: inline-block;
      font-size: 0.75rem;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #D4AF37;
      background: rgba(212, 175, 55, 0.1);
      padding: 4px 10px;
      border-radius: 4px;
      margin-bottom: 12px;
    }
    .definition-box {
      background: rgba(255, 255, 255, 0.03);
      border-left: 3px solid #D4AF37;
      padding: 14px 18px;
      margin: 20px 0;
      border-radius: 0 6px 6px 0;
    }
    .theorem-box {
      background: rgba(181, 52, 31, 0.08);
      border-left: 3px solid #B5341F;
      padding: 14px 18px;
      margin: 20px 0;
      border-radius: 0 6px 6px 0;
    }
    .formula {
      font-family: "Cambria Math", "Latin Modern Math", serif;
      font-size: 1.2rem;
      text-align: center;
      margin: 20px 0;
      color: #FFFDF9;
    }
    code {
      font-family: Consolas, monospace;
      background: rgba(255, 255, 255, 0.08);
      padding: 2px 6px;
      border-radius: 3px;
    }
  </style>
</head>
<body>
  <div class="badge">${subject} · ${date}</div>
  <h1>${title}</h1>
  ${bodyHtml}
</body>
</html>`;
}

// 1. Создание папок
const items = [
  {
    subject: "Матанализ",
    category: "лекции",
    folder: "01 02.09.2026 Введение в анализ",
    title: "Введение в математический анализ",
    date: "02.09.2026",
    html: `
      <p>Математический анализ — фундаментальная основа современной прикладной математики, изучающая функции, их пределы, дифференциальное и интегральное исчисление.</p>
      
      <div class="definition-box">
        <strong>Определение 1.1 (Множество вещественных чисел):</strong><br>
        Множество вещественных чисел обозначается как ℝ и представляет собой непрерывную числовую прямую, удовлетворяющую аксиомам поля, порядка и полноты (непрерывности Дедекинда).
      </div>

      <div class="formula">
        ∀ x, y ∈ ℝ, x &lt; y ⇒ ∃ q ∈ ℚ : x &lt; q &lt; y
      </div>

      <div class="theorem-box">
        <strong>Теорема 1.1 (О плотности рациональных чисел):</strong><br>
        Между любыми двумя различными вещественными числами существует бесконечно много рациональных чисел.
      </div>
    `,
    pdfTitle: "[FAM HSE] Mathematical Analysis - Lecture 01",
    pdfLines: [
      "Lecturer: Prof. FAM HSE",
      "Topic: Introduction to Analysis and Real Numbers",
      "Date: 02.09.2026",
      "Part 1: The real line and axioms of ordered fields.",
      "Part 2: Supremum and infimum of bounded sets.",
      "Part 3: Completeness axiom (Dedekind cuts)."
    ]
  },
  {
    subject: "Матанализ",
    category: "лекции",
    folder: "02 05.09.2026 Аксиоматика вещественных чисел",
    title: "Аксиоматика вещественных чисел и супремум",
    date: "05.09.2026",
    html: `
      <p>Во второй лекции рассматривается принцип точной верхней грани (супремума) и аксиома полноты.</p>
      
      <div class="definition-box">
        <strong>Определение 1.2 (Точная верхняя грань):</strong><br>
        Число M называется точной верхней гранью (sup E) ограниченного сверху множества E ⊂ ℝ, если:<br>
        1) ∀ x ∈ E : x ≤ M;<br>
        2) ∀ ε &gt; 0 ∃ x ∈ E : x &gt; M - ε.
      </div>

      <div class="formula">
        M = sup E ⇔ (∀ x ∈ E : x ≤ M) ∧ (∀ ε &gt; 0 ∃ x ∈ E : x &gt; M - ε)
      </div>
    `,
    pdfTitle: "[FAM HSE] Analysis - Lecture 02 (Original)",
    pdfLines: [
      "Lecturer Manuscript - Lecture 02",
      "Topic: Supremum, Infimum, Dedekind completeness",
      "Date: 05.09.2026",
      "Proof of Archimedean property and nested intervals theorem."
    ]
  },
  {
    subject: "Матанализ",
    category: "коллоквиумы",
    folder: "01 20.10.2026 Вопросы к 1 коллоквиуму",
    title: "Вопросы и билеты к 1 коллоквиуму по матанализу",
    date: "20.10.2026",
    html: `
      <h2>Программа 1-го коллоквиума</h2>
      <ol>
        <li>Аксиоматика поля вещественных чисел. Аксиома непрерывности.</li>
        <li>Принцип супремума и инфимума. Теорема о вложенных отрезках Коши-Кантора.</li>
        <li>Числовые последовательности. Определение предела по Коши.</li>
        <li>Теорема Вейерштрасса о монотонной ограниченной последовательности.</li>
        <li>Критерий Коши сходимости числовых последовательностей.</li>
      </ol>
    `
  },
  {
    subject: "Линал и Аналит",
    category: "лекции",
    folder: "01 03.09.2026 Векторные пространства",
    title: "Векторные пространства и линейная независимость",
    date: "03.09.2026",
    html: `
      <p>Линейная алгебра и аналитическая геометрия: аксиомы векторного пространства над полем K.</p>
      <div class="definition-box">
        <strong>Определение:</strong> Множество V с операциями сложения и умножения на скаляр из поля K называется векторным пространством, если выполнены 8 аксиом линейности.
      </div>
      <div class="formula">
        α(u + v) = α u + α v, (α + β)v = α v + β v
      </div>
    `,
    pdfTitle: "[FAM HSE] Linear Algebra - Lecture 01",
    pdfLines: [
      "Lecture 01: Vector Spaces & Linear Combinations",
      "Lecturer original handwritten notes",
      "Date: 03.09.2026"
    ]
  },
  {
    subject: "Линал и Аналит",
    category: "семинары",
    folder: "01 02.09.2026 Метод Гаусса и СЛАУ",
    title: "Метод последовательного исключения Гаусса",
    date: "02.09.2026",
    html: `
      <p>Семинар №1: Решение систем линейных алгебраических уравнений (СЛАУ) методом элементарных преобразований матриц.</p>
      <div class="definition-box">
        <strong>Определение:</strong> Элементарные преобразования строк расширенной матрицы не меняют множество решений системы уравнений.
      </div>
    `,
    pdfTitle: "[FAM HSE] Linear Algebra - Seminar 01",
    pdfLines: [
      "Seminar 01: Gauss-Jordan Elimination",
      "Problems and Solutions Guide",
      "Date: 02.09.2026"
    ]
  },
  {
    subject: "Дискретная математика",
    category: "лекции",
    folder: "01 04.09.2026 Множества и отношения",
    title: "Множества, бинарные отношения и отображения",
    date: "04.09.2026",
    html: `
      <p>Основы дискретной математики: канторовская теория множеств, отношения эквивалентности и частичного порядка.</p>
      <div class="formula">
        R ⊆ A × A : (a, b) ∈ R ∧ (b, c) ∈ R ⇒ (a, c) ∈ R
      </div>
    `,
    pdfTitle: "[FAM HSE] Discrete Mathematics - Lecture 01",
    pdfLines: [
      "Lecture 01: Sets, Relations, Equivalence classes",
      "Lecturer manuscript",
      "Date: 04.09.2026"
    ]
  }
];

for (const item of items) {
  const dir = path.join(HSE_DIR, item.subject, item.category, item.folder);
  fs.mkdirSync(dir, { recursive: true });

  // Создание conspect.html
  const htmlPath = path.join(dir, 'conspect.html');
  fs.writeFileSync(htmlPath, generateHtmlConspect(item.subject, item.title, item.date, item.html), 'utf8');

  // Создание оригинального PDF, если задан
  if (item.pdfTitle) {
    const origDir = path.join(dir, 'оригинал');
    fs.mkdirSync(origDir, { recursive: true });
    const pdfPath = path.join(origDir, 'lecture_original.pdf');
    const pdfBuf = generateValidPdf(item.pdfTitle, item.pdfLines);
    fs.writeFileSync(pdfPath, pdfBuf);
  }
}

// site-metadata.json
const siteMeta = {
  schema: 1,
  subjects: [
    { name: "Матанализ", color: "#B5341F", description: "Дифференциальное и интегральное исчисление" },
    { name: "Линал и Аналит", color: "#1D4E89", description: "Векторные пространства, матрицы, аналитическая геометрия" },
    { name: "Дискретная математика", color: "#2D6A4F", description: "Комбинаторика, теория графов и булевы функции" },
    { name: "Программирование", color: "#7209B7", description: "Алгоритмы, структуры данных и архитектура C++" }
  ],
  modules: ["Модуль 1", "Модуль 2", "Модуль 3", "Модуль 4"],
  announcements: [
    {
      id: "ann_colloq1",
      type: "deadline",
      title: "1-й Коллоквиум по Матанализу",
      subject: "Матанализ",
      datetime: "2026-10-31T12:00:00.000Z",
      text: "Коллоквиум по темам 1-го модуля (теоремы Больцано-Вейерштрасса, Коши, пределы).",
      urgent: true
    },
    {
      id: "ann_hw1",
      type: "deadline",
      title: "ДЗ №1 по Линейной алгебре",
      subject: "Линал и Аналит",
      datetime: "2026-11-05T20:59:00.000Z",
      text: "Сдать решения задач 1.1-1.18 в учебный ассистент.",
      urgent: false
    }
  ],
  lectures: []
};

fs.writeFileSync(path.join(HSE_DIR, 'site-metadata.json'), JSON.stringify(siteMeta, null, 2), 'utf8');
console.log('✅ Эталонная структура Storage/HSE успешно сформирована!');
