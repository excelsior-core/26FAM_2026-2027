# -*- coding: utf-8 -*-
import os

TEMPLATE_PATH = os.path.join(os.path.dirname(__file__), '..', 'GENESIS', 'template-lecture.html')

with open(TEMPLATE_PATH, 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Add JSXGraph to <head> right after KaTeX
katex_tag = '<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js"></script>'
jsxgraph_tags = """<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js"></script>

  <!-- JSXGraph для высокоточных интерактивных математических чертежей и графиков -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/jsxgraph@1.11.0/distrib/jsxgraph.css">
  <script defer src="https://cdn.jsdelivr.net/npm/jsxgraph@1.11.0/distrib/jsxgraphcore.js"></script>"""

if 'jsxgraphcore.js' not in text:
    assert katex_tag in text, "KaTeX tag not found in template!"
    text = text.replace(katex_tag, jsxgraph_tags, 1)
    print("Added JSXGraph script & style tags to <head>")

# 2. Add JSXGraph and dual-figure container CSS to <style>
figure_card_css = """.figure-card {
      background: var(--svg-bg);
      border: 1px solid var(--border-medium);
      border-radius: 12px;
      padding: 1.75rem;
      margin: 2.5rem 0;
      text-align: center;
      box-shadow: var(--shadow-ambient);
      position: relative;
      break-inside: avoid;
      page-break-inside: avoid;
      min-width: 0;
      max-width: 100%;
    }"""

jsxgraph_css = """.figure-card {
      background: var(--svg-bg);
      border: 1px solid var(--border-medium);
      border-radius: 12px;
      padding: 1.75rem;
      margin: 2.5rem 0;
      text-align: center;
      box-shadow: var(--shadow-ambient);
      position: relative;
      break-inside: avoid;
      page-break-inside: avoid;
      min-width: 0;
      max-width: 100%;
    }

    /* Контейнеры для досок JSXGraph и двухпанельных научных иллюстраций */
    .figure-board-container {
      width: 100%;
      max-width: 900px;
      margin: 0 auto;
    }

    .figure-dual-container {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
      width: 100%;
      max-width: 960px;
      margin: 0 auto;
      text-align: left;
    }

    @media (max-width: 860px) {
      .figure-dual-container {
        grid-template-columns: 1fr;
        gap: 1.25rem;
      }
    }

    .figure-half {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .figure-panel-title {
      font-family: 'Cinzel', serif;
      font-size: 0.92rem;
      font-weight: 600;
      color: var(--text-gold);
      letter-spacing: 0.04em;
      padding-bottom: 0.25rem;
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }

    .jxgbox {
      position: relative;
      overflow: hidden;
      width: 100%;
      height: 380px;
      background-color: var(--svg-bg) !important;
      border: 1px solid var(--border-medium) !important;
      border-radius: 10px;
      box-shadow: inset 0 2px 12px rgba(0, 0, 0, 0.45);
      touch-action: none;
    }

    [data-theme="marble"] .jxgbox {
      box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.06);
    }

    /* JSXGraph Text Elements & Typography */
    .JXGtext {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif !important;
      color: var(--text-main) !important;
      font-size: 13.5px !important;
      user-select: none;
      -webkit-user-select: none;
    }

    .jxg-katex-label {
      font-size: 14px;
      line-height: 1;
      display: inline-block;
      white-space: nowrap;
    }

    /* Скрытие стандартного навигатора и копирайта JSXGraph */
    .JXG_navigation {
      display: none !important;
    }"""

if '.figure-dual-container' not in text:
    assert figure_card_css in text, "figure-card CSS not found in template!"
    text = text.replace(figure_card_css, jsxgraph_css, 1)
    print("Added JSXGraph CSS styles to <style>")

# 3. Add print support for jxgbox
old_print = """.callout,
      .figure-card,
      .table-box,"""
new_print = """.callout,
      .figure-card,
      .jxgbox,
      .table-box,"""
if '.jxgbox,' not in text:
    text = text.replace(old_print, new_print, 1)
    print("Added .jxgbox to @media print rules")

# 4. Add JavaScript helpers and theme listener
apply_theme_code = """      function applyTheme(theme) {
        document.documentElement.setAttribute("data-theme", theme);
        themeBtns.forEach(b => {
          b.classList.toggle("active", b.getAttribute("data-set-theme") === theme);
        });
      }"""

new_apply_theme_code = """      function applyTheme(theme) {
        document.documentElement.setAttribute("data-theme", theme);
        themeBtns.forEach(b => {
          b.classList.toggle("active", b.getAttribute("data-set-theme") === theme);
        });
        window.dispatchEvent(new CustomEvent('academicThemeChanged', { detail: { theme } }));
      }

      // Глобальный хелпер для создания академических интерактивных досок JSXGraph
      window.createAcademicBoard = function(containerId, options) {
        if (typeof JXG === 'undefined') return null;
        options = options || {};

        const theme = document.documentElement.getAttribute('data-theme') || 'caravaggio';
        const isDark = theme === 'caravaggio';

        const palette = {
          gold: isDark ? '#e5b842' : '#946c15',
          goldBright: isDark ? '#ffd977' : '#b8861d',
          cyan: isDark ? '#38bdf8' : '#0284c7',
          emerald: isDark ? '#34d399' : '#059669',
          ruby: isDark ? '#fb7185' : '#be123c',
          purple: isDark ? '#c084fc' : '#7c3aed',
          amber: isDark ? '#fbbf24' : '#d97706',
          axis: isDark ? '#a89880' : '#6b5d4a',
          grid: isDark ? 'rgba(229, 184, 66, 0.12)' : 'rgba(160, 120, 40, 0.12)',
          text: isDark ? '#e8e2d5' : '#251e17',
          fillGold: isDark ? 'rgba(229, 184, 66, 0.14)' : 'rgba(148, 108, 21, 0.1)',
          fillCyan: isDark ? 'rgba(56, 189, 248, 0.12)' : 'rgba(2, 132, 199, 0.1)',
          fillEmerald: isDark ? 'rgba(52, 211, 153, 0.12)' : 'rgba(5, 150, 105, 0.1)',
          fillRuby: isDark ? 'rgba(251, 113, 133, 0.12)' : 'rgba(190, 18, 60, 0.1)'
        };

        const defaultOpts = {
          boundingbox: [-5, 5, 5, -5],
          axis: false,
          showNavigation: false,
          showCopyright: false,
          keepaspectratio: false,
          pan: { enabled: true, needShift: false },
          zoom: { enabled: true, needShift: false, factorX: 1.2, factorY: 1.2 }
        };

        const config = Object.assign({}, defaultOpts, options);
        const board = JXG.JSXGraph.initBoard(containerId, config);
        board.palette = palette;

        board.renderKaTeX = function() {
          const container = document.getElementById(containerId);
          if (container && window.renderMathInElement) {
            window.renderMathInElement(container, {
              delimiters: [
                {left: '$$', right: '$$', display: true},
                {left: '$', right: '$', display: false}
              ],
              throwOnError: false
            });
          }
        };

        return board;
      };

      // Хелпер для создания стандартных академических осей
      window.createAcademicAxes = function(board, config) {
        config = config || {};
        const pal = board.palette || { axis: '#a89880', text: '#e8e2d5', grid: 'rgba(229, 184, 66, 0.12)' };

        if (config.grid !== false) {
          board.create('grid', [], {
            strokeColor: pal.grid,
            strokeWidth: 1,
            dash: 2,
            gridX: config.gridX || 1,
            gridY: config.gridY || 1
          });
        }

        const xAxis = board.create('axis', [[0, 0], [1, 0]], {
          strokeColor: pal.axis,
          strokeWidth: 1.5,
          highlight: false,
          ticks: {
            strokeColor: pal.axis,
            insertTicks: true,
            drawLabels: config.xLabels !== false,
            label: { strokeColor: pal.text, fontSize: 13, offset: [-4, -14] }
          }
        });

        const yAxis = board.create('axis', [[0, 0], [0, 1]], {
          strokeColor: pal.axis,
          strokeWidth: 1.5,
          highlight: false,
          ticks: {
            strokeColor: pal.axis,
            insertTicks: true,
            drawLabels: config.yLabels !== false,
            label: { strokeColor: pal.text, fontSize: 13, offset: [-22, 0] }
          }
        });

        return { xAxis, yAxis };
      };"""

if 'window.createAcademicBoard' not in text:
    assert apply_theme_code in text, "applyTheme code not found in template!"
    text = text.replace(apply_theme_code, new_apply_theme_code, 1)
    print("Added createAcademicBoard and createAcademicAxes helpers")

with open(TEMPLATE_PATH, 'w', encoding='utf-8') as f:
    f.write(text)

print("Successfully updated template-lecture.html!")
