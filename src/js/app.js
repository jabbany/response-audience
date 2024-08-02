'use strict';

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['exports', 'dfc', 'components/editor-manager', 'components/grid-manager'], factory);
  } else if (typeof exports === 'object' && typeof exports.nodeName !== 'string') {
    factory(exports, require('dfc'), require('components/editor-manager'), require('components/grid-manager'));
  } else {
    factory((root.app = {}), root.dfc, root.editorManager, root.gridManager);
  }
}(typeof self !== 'undefined' ? self : this, function (exports, _, editorManager, gridManager) {

  function $(e) {
    var qs = document.querySelectorAll(e);
    if (qs.length === 0) {
      return null;
    } else if (qs.length === 1) {
      return qs[0];
    } else {
      return qs;
    }
  }

  window.addEventListener('load', function () {
    var mainGrid = new gridManager.GridManager($('#grid-main'), $('#grid-controls-main'));
    var editor = new editorManager.EditorManager($('#editor'));

    mainGrid.setState('wiz-planning');

    $('#action-start').addEventListener('click', function () {
      mainGrid.setState('wiz-editing');
    });

    $('#action-ai').addEventListener('click', function () {
      editor.insertAiResponse('This simulates some AI generated text!\nIt can span multiple lines whatnot.');
    });

  });

  // End file
}));
