'use strict';

/* This is a custom wrapper around the Quill editor */
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['exports', 'dfc', factory]);
  } else if (typeof exports === 'object' && typeof exports.nodeName !== 'string') {
    factory(exports, require('dfc'));
  } else {
    factory((root.modal = {}), dfc);
  }
}(typeof self !== 'undefined' ? self : this, function (exports, _) {

  function ModalPage(container) {
    this._dom = container;
    this._bodyDom = null;
    this._backdropDom = null;

    this._bind();
  }

  ModalPage.prototype._bind = function () {
    if (this._bodyDom === null) {
      this._bodyDom = _('div', {'className': 'modal-dialog'});
    }
    if (this._backdropDom === null) {
      this._backdropDom = _('div', {'className': 'modal-background'});
    }

    this._dom.appendChild(this._bodyDom);
    this._dom.appendChild(this._backdropDom);
    this._backdropDom.addEventListener('click', (function () {
      this.dismiss();
    }).bind(this));
  };

  ModalPage.prototype.setBody = function (elements) {
    this._bodyDom.replaceChildren(elements);
  };

  ModalPage.prototype.setTitle = function () {

  };

  ModalPage.prototype.close = function () {
    this._dom.classList.remove('show');
  };

  ModalPage.prototype.open = function () {
    this._dom.classList.add('show');
  };

  ModalPage.prototype.dismiss = function () {
    this.close();
  };

  exports.ModalPage = ModalPage;
}));
