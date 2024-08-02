'use strict';

/* This is a custom wrapper around the Quill editor */
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['exports', factory]);
  } else if (typeof exports === 'object' && typeof exports.nodeName !== 'string') {
    factory(exports);
  } else {
    factory((root.searchGui = {}));
  }
}(typeof self !== 'undefined' ? self : this, function (exports) {

  function SearchPanel(gridDom, controlsDom) {
    this._dom = gridDom;
    this._controls = controlsDom;

    this._modes = {};

    this._bind();
  }

  exports.SearchPanel = SearchPanel;
}));
