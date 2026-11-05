# -*- coding: utf-8 -*-
import os

TEMPLATE_PATH = os.path.join(os.path.dirname(__file__), '..', 'GENESIS', 'template-lecture.html')

with open(TEMPLATE_PATH, 'r', encoding='utf-8') as f:
    text = f.read()

# Replace window.createAcademicBoard implementation with one that handles freeBoard
target_fn = """      // Глобальный хелпер для создания академических интерактивных досок JSXGraph
      window.createAcademicBoard = function(containerId, options) {
        if (typeof JXG === 'undefined') return null;
        options = options || {};"""

replacement_fn = """      // Глобальный хелпер для создания академических интерактивных досок JSXGraph
      window.createAcademicBoard = function(containerId, options) {
        if (typeof JXG === 'undefined') return null;
        options = options || {};

        if (window._academicBoards && window._academicBoards[containerId]) {
          try {
            JXG.JSXGraph.freeBoard(window._academicBoards[containerId]);
          } catch(e) {}
        }
        window._academicBoards = window._academicBoards || {};"""

if target_fn in text and 'freeBoard' not in text:
    text = text.replace(target_fn, replacement_fn, 1)
    # Also save board to window._academicBoards
    old_ret = """        board.palette = palette;

        board.renderKaTeX = function() {"""
    new_ret = """        board.palette = palette;
        window._academicBoards[containerId] = board;

        board.renderKaTeX = function() {"""
    text = text.replace(old_ret, new_ret, 1)

    with open(TEMPLATE_PATH, 'w', encoding='utf-8') as f:
        f.write(text)
    print("Enhanced createAcademicBoard with freeBoard in template-lecture.html")
else:
    print("Already has freeBoard or target not matched")
