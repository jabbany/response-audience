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
    this._dialogDom = null;
    this._titleDom = null;
    this._contentsDom = null;
    this._backdropDom = null;

    this._bind();
  }

  ModalPage.prototype._bind = function () {
    if (this._dialogDom === null) {
      this._dialogDom = _('div', {'className': 'modal-dialog'});
    }
    if (this._backdropDom === null) {
      this._backdropDom = _('div', {'className': 'modal-background'});
    }
    if (this._titleDom === null) {
      this._titleDom = _('div', {'className': 'modal-title'});
    }
    if (this._contentsDom === null) {
      this._contentsDom = _('div', {'className': 'modal-body'});
    }

    this._dialogDom.appendChild(this._titleDom);
    this._dialogDom.appendChild(this._contentsDom);

    this._dom.appendChild(this._dialogDom);
    this._dom.appendChild(this._backdropDom);
    this._backdropDom.addEventListener('click', (function () {
      this.dismiss();
    }).bind(this));
  };

  ModalPage.prototype.setContents = function (body) {
    this._contentsDom.replaceChildren(body);
  };

  ModalPage.prototype.setTitle = function (title) {
    if (typeof elements === 'string') {
      this._titleDom.replaceChildren(_('', title));
    } else {
      this._titleDom.replaceChildren(title);
    }
    if (title === '' || title === null) {
      this._dialogDom.removeChild(this._titleDom);
    } else {
      this._dialogDom.insertBefore(this._titleDom, this._dialogDom.firstChild)
    }
  };

  ModalPage.prototype.close = function () {
    this._dom.classList.remove('show');
  };

  ModalPage.prototype.open = function (title, body) {
    if (typeof title !== 'undefined') {
      this.setTitle(title);
    }
    if (typeof body !== 'undefined') {
      this.setContents(body);
    }
    this._dom.classList.add('show');
  };

  ModalPage.prototype.dismiss = function () {
    this.close();
  };

  exports.ModalPage = ModalPage;
}));
