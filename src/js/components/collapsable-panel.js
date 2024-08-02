'use strict';

/* This is a custom wrapper around the Quill editor */
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['exports', factory, 'dfc']);
  } else if (typeof exports === 'object' && typeof exports.nodeName !== 'string') {
    factory(exports, require('dfc'));
  } else {
    factory((root.panels = {}), root.dfc);
  }
}(typeof self !== 'undefined' ? self : this, function (exports, _) {

  function CollapsablePanel(parent) {
    this._parentDom = parent;
    this._headDom = null;
    this._bodyDom = null;

    this._collapseState = false;

    this._bind();
  }

  CollapsablePanel.prototype._bind = function () {
    if (this._headDom === null) {
      this._headDom = _('div', {'className': ''}, [

      ])
    }
    if (this._bodyDom === null) {
      this._bodyDom = _('div', {'className': 'body'});
    }

    this._parentDom.appendChild(this._headDom);
    this._parentDom.appendChild(this._bodyDom);
  };

  CollapsablePanel.prototype.setCollapse = function (collapseState) {
    if (collapseState) {
      // Collapse
    } else {
      // Expand
      this._bodyDom.classList.remove('hidden');
      this._headDom.classList.remove('caret-down');
      this._headDom.classList.add('caret-up');

    }

    this._collapseState = collapseState;
  };

  CollapsablePanel.prototype.renderBody = function (bodyContents) {

  };

  CollapsablePanel.prototype.

  function ContentPanel() {

  }

  ContentPanel.prototype.render = function () {

  }

  function PersonasPanel () {

  }

  PersonasPanel.prototype.render = function () {

  }

  exports.CollapsablePanel = CollapsablePanel;
  exports.ContentPanel = ContentPanel;
  exports.PersonasPanel = PersonasPanel;
}));
