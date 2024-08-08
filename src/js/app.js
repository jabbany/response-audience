'use strict';

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['exports',
      'dfc',
      'components/editor-manager',
      'components/grid-manager',
      'components/panels',
      'components/modal',
      'services/analysis-api'], factory);

  } else if (typeof exports === 'object' && typeof exports.nodeName !== 'string') {
    factory(exports,
      require('dfc'),
      require('components/editor-manager'),
      require('components/grid-manager'),
      require('components/panels'),
      require('components/modal'),
      require('service/analysis-api'));

  } else {
    factory((root.app = {}),
      root.dfc,
      root.editorManager,
      root.gridManager,
      root.panels,
      root.modal,
      root.api);
  }
}(typeof self !== 'undefined' ? self : this, function (exports, _, editorManager, gridManager, panels, modal, api) {

  // like jquery but without all the fluff
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
    var apiService = new api.ApiService('res');

    var mainGrid = new gridManager.GridManager($('#grid-main'), $('#grid-controls-main'));
    mainGrid.setState('wiz-planning');

    var modalManager = new modal.ModalPage($('#modal'));

    var contentPanel = new panels.ContentPanel(apiService, $('#card-content'));
    var factsPanel = new panels.FactsPanel(apiService, $('#card-content'));



    // explanations for why sources were ranked this way short explanation[]

    // additional feature: specify custom personas. have some default at the top and allow users to add at the bottom.

    // neurips workshop position piece: tie in case law paper and SPICA,

    // a couple of sections in the paper: here are some ways we can used cases - follow on project (synthesis) [ different use cases based on differnt settings [few cases, a lot of cases, cases on demand, shared cases]  = > different case banks = > What do you get making a case bank like this || why we think this is useful || => pluralism (pluralistic AI focus on how they affect plurlism, cheaper version, vs more resource intensive version) ]

    var editor = new editorManager.EditorManager($('#editor'), $('#btg-editor-mode'), $('#card-suggestions-edit'));

    contentPanel.showContent('example').then(function () {
      factsPanel.showFacts('example');

      var audiencePanel = new panels.AudienceConfigurationPanel(apiService, $('#card-audience'));
      var planningPersonas = new panels.PersonasPanel(apiService, $('#card-audience'));
    });

    var reflectionPanel = new panels.ReflectionsPanel(apiService, $('#card-reflection'))
    var keyPointsPanel = new panels.KeyPointsPanel(apiService, $('#card-key-points'));
    var reviewPersonas = new panels.PersonasPanel(apiService, $('#card-reactions'));

    $('#btn-start').addEventListener('click', function () {
      mainGrid.setState('wiz-editing');
    });

    this.window.editor = editor;
    this.window.modal = modalManager;
  });

}));
