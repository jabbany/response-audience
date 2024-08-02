'use strict';

/* This is a custom wrapper around the Quill editor */
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['exports', 'Quill'], factory);
  } else if (typeof exports === 'object' && typeof exports.nodeName !== 'string') {
    factory(exports, require('Quill'));
  } else {
    factory((root.editorManager = {}), root.Quill);
  }
}(typeof self !== 'undefined' ? self : this, function (exports, Quill) {

  //var Inline = Quill.import('blots/inline');
  //function AiText() {
  //  Inline.apply(this, arguments);
  //}
  //AiText.prototype = Inline.prototype;
  //AiText.prototype.constructor = AiText;

  //Quill.register('formats/ai', AiText);

  function EditorManager(dom) {
    this._quill = new Quill(dom, {
      'modules': {
        'toolbar': {
          'container': '#toolbar',
        }
      },
      'theme': 'snow',
      'placeholder': 'Please draft your response here...'
    });

    // Bind immediately
    this.bind();
  }

  EditorManager.prototype._handleSelection = function (range, oldRange) {
    if (range.length === 0) {
      // The user is just moving the cursor
      this._quill.format('background','#fff');
    } else {
      // The user is actually selecting something, do not change the format
    }
  }

  EditorManager.prototype._handleUserInput = function () {

  }

  EditorManager.prototype.bind = function () {
    this._quill.root.setAttribute('spellcheck', false);

    this._quill.on('selection-change', (function (range, oldRange, source) {
      if (range && source === 'user') {
        this._handleSelection(range, oldRange);
      }
    }).bind(this));
  }

  EditorManager.prototype.insertAiResponse = function (text) {
    var selection = this._quill.getSelection(true);
    var fullText = '\n' + text;
    console.log(selection);
    if (selection) {
      if (selection.length === 0) {
        this._quill.insertText(selection.index, fullText, {
          'background': '#cff4fc',
          'color': ''
        });
      }
    } else {
      this._quill.insertText(this._quill.getLength() - 1, fullText, {
        'background': '#cff4fc',
        'color': ''
      });
    }
  }

  exports.EditorManager = EditorManager;
}));
