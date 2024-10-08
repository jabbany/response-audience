'use strict';

/* This is a custom wrapper around the Quill editor */
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['exports', factory]);
  } else if (typeof exports === 'object' && typeof exports.nodeName !== 'string') {
    factory(exports);
  } else {
    factory((root.gridManager = {}));
  }
}(typeof self !== 'undefined' ? self : this, function (exports) {

  function GridManager(gridDom, controlsDom) {
    this._dom = gridDom;
    this._controls = controlsDom;

    this._listeners = [];
    this._modes = {};

    this._bind();
  }

  GridManager.prototype._bind = function () {
    var controlButtons = this._controls.querySelectorAll('.btn');
    for(var i = 0; i < controlButtons.length; i++) {
      var control = controlButtons[i];
      if (control.hasAttribute('switch-to')) {
        this._modes[control.getAttribute('switch-to')] = control;
        control.addEventListener('click', (function (role, self) {
          return function () {
            self.setState(role);
          }
        })(control.getAttribute('switch-to'), this));
      }
    }
  }

  GridManager.prototype._emitChangeEvent = function (newState) {
    this._listeners.forEach(function (listener) {
      try {
        listener(newState);
      } catch (e) { console.log(e); }
    });
  }

  GridManager.prototype.setState = function (state) {
    if (!state in this._modes) {
      throw new Error('Did not find ' + state + ' in available modes!');
    }
    for (var key in this._modes) {
      this._modes[key].classList.toggle('active', key === state);
      this._dom.classList.toggle(key, key === state);
    }
    this._emitChangeEvent(state);
  }

  GridManager.prototype.addChangeListener = function (onChange) {
    this._listeners.push(onChange);
  }

  exports.GridManager = GridManager;
}));
