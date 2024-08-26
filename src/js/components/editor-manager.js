'use strict';

/* This is a custom wrapper around the Quill editor */
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['exports', 'quill', 'quill-cursors', 'dfc'], factory);
  } else if (typeof exports === 'object' && typeof exports.nodeName !== 'string') {
    factory(exports, require('quill'), require('quill-cursors'), require('dfc'));
  } else {
    factory((root.editorManager = {}), root.Quill, root.QuillCursors, root.dfc);
  }
}(typeof self !== 'undefined' ? self : this, function (exports, Quill, QuillCursors, _) {

  Quill.register('modules/cursors', QuillCursors);

  function _rebatch(content, splits, deviations) {
    if (typeof content === 'text') {
      // split the text into separate spans
    } else if (typeof content === 'number') {
      // split the number into separate constituents
    } else if (Array.isArray(content)) {
      // regroup the list into lists of sublists
    }
  }

  function _chunkifyText(content, chunkCount) {
    var textChunks = [], contentLength = content.length;
    for (var i = 0 ; i < chunkCount; i++) {
      textChunks.push(content.slice(0, Math.floor(contentLength / chunkCount + Math.random() * 3)));
      content = content.slice(textChunks[textChunks.length - 1].length);
    }
    if (content.length > 0) {
      textChunks[textChunks.length - 1] += content;
    }
    return textChunks;
  }

  function _newWaitTimer(duration) {
    if (duration <= 0) {
      return Promise.resolve();
    }
    return new Promise(function (resolve) {
      setTimeout(resolve, duration);
    });
  }

  var MODES = {
    'write': {
      'bg-color': false
    },
    'instruct': {
      'bg-color': '#cff4fc'
    },
    'demonstrate': {
      'bg-color': '#d1e7dd'
    },
    'ai': {
      'bg-color': '',
      'fg-color': '#dc3545',
      'cursor-color': '#dc3545',
    }
  }

  function AICursor(editor) {
    this._cursorId = 'assistant';
    this._parent = editor;

    this._cursorLocation = 0;

    this._parent._cursors.createCursor(this._cursorId, 'AI', MODES['ai']['cursor-color']);
  }

  AICursor.prototype.suggestMove = function (index, animationDuration) {
    if (this._parent._activeAICursor !== this) {
      throw new Error('Stale cursor instance!');
    }
    if (this._cursorLocation === index) {
      this._parent._cursors.toggleFlag(this._cursorId, true);
      return Promise.resolve();
    }
    // Use the cursor to indicate the AI is moving in the document

    if (typeof animationDuration !== 'number' || animationDuration <= 0) {
      this._parent._cursors.moveCursor(this._cursorId, {'index': index, 'length': 0 })
      this._parent._cursors.toggleFlag(this._cursorId, true);
      this._cursorLocation = Math.min(index, this._parent._quill.getLength());
      return Promise.resolve();
    } else {
      this._parent._cursors.toggleFlag(this._cursorId, true);
      var steps = Math.round(Math.abs(index - this._cursorLocation) / 6);

      return new Promise((function (resolve) {
        // create a bunch of intermediates
        var intermediates = []
        for (var i = 0; i < steps; i++) {
          intermediates.push(Math.round((i + 1) / steps * (index - this._cursorLocation)) +
            this._cursorLocation);
        }
        var moveTowards = (function () {
          if (intermediates.length > 0) {
            this._parent._cursors.moveCursor(this._cursorId, {'index': intermediates.shift(), 'length': 0 });
            setTimeout(moveTowards, animationDuration / steps);
          } else {
            this._parent._cursors.moveCursor(this._cursorId, {'index': index, 'length': 0 });
            this._cursorLocation = index;
            resolve();
          }
        }).bind(this);
        moveTowards();
      }).bind(this));
    }
  }

  AICursor.prototype.suggestAttention = function (index, length, animationDuration) {
    if (this._parent._activeAICursor !== this) {
      throw new Error('Stale cursor instance!');
    }

    // Use the cursor to indicate the AI is calling for attention (no particular action)

    if (typeof animationDuration !== 'number' || animationDuration <= 0) {
      this._parent._cursors.moveCursor(this._cursorId, {'index': index, 'length': length });
      this._parent._cursors.toggleFlag(this._cursorId, true);
      this._cursorLocation = Math.min(index + length, this._parent._quill.getLength());
      return Promise.resolve();
    } else {
      this._parent._cursors.toggleFlag(this._cursorId, true);
      var steps = Math.round(Math.abs(length) / 5);

      return new Promise((function (resolve) {
        // create a bunch of intermediates
        var intermediates = []
        for (var i = 0; i < steps; i++) {
          intermediates.push(Math.round((i + 1) / steps * length));
        }
        var selectTowards = (function () {
          if (intermediates.length > 0) {
            this._parent._cursors.moveCursor(this._cursorId, {'index': index, 'length': intermediates.shift() });
            setTimeout(selectTowards, animationDuration / steps);
          } else {
            this._parent._cursors.moveCursor(this._cursorId, {'index': index, 'length': length });
            this._cursorLocation = index;
            resolve();
          }
        }).bind(this);
        selectTowards();
      }).bind(this));
    }
  }

  AICursor.prototype.suggestInsert = function (index, content, animationDuration) {
    if (this._parent._activeAICursor !== this) {
      throw new Error('Stale cursor instance!');
    }

    // Use the cursor to indicate the AI is calling for attention (no particular action)
    this._parent._cursors.toggleFlag(this._cursorId, true);

    if (typeof animationDuration !== 'number' || animationDuration <= 0) {
      this._parent._quill.insertText(index, content);
      this._parent._cursors.moveCursor(this._cursorId, {'index': index, 'length': content.length });
      this._cursorLocation = index + content.length;
      return Promise.resolve();
    } else {
      this._parent._cursors.toggleFlag(this._cursorId, true);

      var chunkSize = 20, runningIndex = index;

      return new Promise((function (resolve) {
        // create a bunch of intermediates
        var textChunks = _chunkifyText(content, chunkSize);
        var typeTowards = (function () {
          if (textChunks.length > 0) {
            var chunk = textChunks.shift();
            this._parent._quill.insertText(runningIndex, chunk);
            runningIndex += chunk.length;
            this._parent._cursors.moveCursor(this._cursorId, {'index': index, 'length': runningIndex - index });
            setTimeout(typeTowards, animationDuration / chunkSize);
          } else {
            this._parent._cursors.moveCursor(this._cursorId, {'index': index, 'length': content.length });
            this._cursorLocation = index + content.length;
            resolve();
          }
        }).bind(this);
        typeTowards();
      }).bind(this));
    }
  }

  AICursor.prototype.suggestDelete = function (index, length, animationDuration) {
    if (this._parent._activeAICursor !== this) {
      throw new Error('Stale cursor instance!');
    }

    // Use the cursor to indicate the AI is suggesting a removal
    if (typeof animationDuration !== 'number' || animationDuration <= 0) {
      this._parent._quill.formatText(index, length, { 'strike': true, 'color': MODES['ai']['fg-color'] });
      this._parent._cursors.moveCursor(this._cursorId, {'index': index, 'length': length });
    } else {
      this._parent._cursors.toggleFlag(this._cursorId, true);
      var steps = 10;

      return new Promise((function (resolve) {
        // create a bunch of intermediates
        var intermediates = []
        for (var i = 0; i < steps; i++) {
          intermediates.push(Math.round((i + 1) / steps * length));
        }
        var selectTowards = (function () {
          if (intermediates.length > 0) {
            this._parent._cursors.moveCursor(this._cursorId, {'index': index, 'length': intermediates.shift() });
            setTimeout(selectTowards, animationDuration / steps);
          } else {
            this._parent._quill.formatText(index, length, { 'strike': true, 'color': MODES['ai']['fg-color'] });
            this._parent._cursors.moveCursor(this._cursorId, {'index': index, 'length': length });
            this._cursorLocation = index;
            resolve();
          }
        }).bind(this);

        selectTowards();
      }).bind(this));
    }
  }

  AICursor.prototype.suggestModify = function (index, length, newContent, animationDuration) {
    if (this._parent._activeAICursor !== this) {
      throw new Error('Stale cursor instance!');
    }

    // Use the cursor to indicate the AI is suggesting that the text be rewritten

  }

  AICursor.prototype.leave = function () {
    if (this._parent._activeAICursor !== this) {
      throw new Error('Stale cursor instance!');
    }

    this._parent._cursors.removeCursor(this._cursorId);
    this._parent._activeAICursor = null;
  }

  function EditorManager(editorDom, controlsDom) {
    this._quill = new Quill(editorDom, {
      'modules': {
        'toolbar': {
          'container': '#toolbar',
        },
        'cursors': {
          'transformOnTextChange': true
        }
      },
      'theme': 'snow',
      'placeholder': 'Please draft your response here...'
    });

    this._editorMode = 'write';
    this._controlsDom = controlsDom;

    // AI related
    this._cursors = this._quill.getModule('cursors');
    this._activeAICursor = null;

    this._changeEditModeHook = null;

    // Bind immediately
    this.bind();
  }

  EditorManager.prototype._syncCurrentMarker = function () {
    this._quill.format('background', MODES[this._editorMode]['bg-color']);
  }

  EditorManager.prototype._handleSelection = function (range, oldRange) {
    if (range.length === 0) {
      // The user is just moving the cursor
      this._syncCurrentMarker();
    } else {
      // The user is actually selecting something, do not change the format
    }
  }

  EditorManager.prototype._handleUserInput = function () {
    // do nothing for now
  }

  EditorManager.prototype._changeEditMode = function (editorMode) {
    if (!(editorMode in MODES)) {
      throw new Error('Editor mode ' + editorMode + ' not found');
    }
    this._editorMode = editorMode;

    // update the buttons
    var buttons = this._controlsDom.querySelectorAll('.btn');
    for (var i = 0; i < buttons.length; i++) {
      if (!buttons[i].hasAttribute('editor-mode')) {
        continue;
      }
      buttons[i].classList.toggle('active',
        buttons[i].getAttribute('editor-mode') === editorMode);
    }

    if (this._editorMode === 'ai') {
      this._quill.enable(false);
      this._triggerAi();
    } else {
      this._quill.enable(true);
    }

    this._syncCurrentMarker();

    if (this._changeEditModeHook !== null) {
      try {
        this._changeEditModeHook(editorMode);
      } catch (e) {}
      this._changeEditModeHook = null;
    }
  }

  EditorManager.prototype._triggerAi = function () {

  }

  EditorManager.prototype.bind = function () {
    this._quill.root.setAttribute('spellcheck', false);

    this._quill.on('selection-change', (function (range, oldRange, source) {
      if (range && source === 'user') {
        this._handleSelection(range, oldRange);
      }
    }).bind(this));

    // bind the controls for mode switching
    var buttons = this._controlsDom.querySelectorAll('.btn');
    for (var i = 0; i < buttons.length; i++) {
      if (!buttons[i].hasAttribute('editor-mode')) {
        continue;
      }
      buttons[i].addEventListener('click', (function (e) {
        this._changeEditMode(e.target.getAttribute('editor-mode'));
      }).bind(this));
    }

    this._changeEditMode('write');
  }

  EditorManager.prototype.highlightModeButton = function (buttonType, animationDuration) {
    var buttonDom = this._controlsDom.querySelectorAll('.btn[editor-mode="' + buttonType + '"]');
    if (buttonDom.length <= 0) {
      return Promise.reject();
    }
    return new Promise((function (resolve, reject) {
      buttonDom[0].classList.add('wiggle');

      if (animationDuration > 0) {
        setTimeout(function () {
          buttonDom[0].classList.remove('wiggle');
          resolve();
        }, animationDuration);
      } else {
        // wait indefinitely
        this._changeEditModeHook = function (editMode) {
          if (editMode === buttonType) {
            // user clicked on the right one
            buttonDom[0].classList.remove('wiggle');
            resolve();
          } else {
            buttonDom[0].classList.remove('wiggle');
            reject();
          }
        }
      }
    }).bind(this));
  }

  EditorManager.prototype.setAIStatusMessage = function (message, showThrobber) {
    return new Promise((function (resolve) {
      this._notifyStatusDom.innerHTML = '';
      this._notifyStatusDom.appendChild(_('', message));
      resolve();
    }).bind(this));
  };

  EditorManager.prototype.animateTyping = function (index, content, animationDuration) {
    if (index === null) {
      var selection = this._quill.getSelection(true);
      if (selection) {
        index = selection.index;
      } else {
        index = 0;
      }
    }
    var chunkSize = 20, runningIndex = index;

    return new Promise((function (resolve) {
      var textChunks = _chunkifyText(content, chunkSize);

      var typeText = (function () {
        if (textChunks.length > 0) {
          var currentChunk = textChunks.shift();
          if (this._editorMode !== 'write') {
            this._syncCurrentMarker();
          }
          // add the text into the editor
          this._quill.insertText(runningIndex, currentChunk);
          runningIndex += currentChunk.length;
          setTimeout(typeText, animationDuration / chunkSize);
        } else {
          resolve();
        }
      }).bind(this);

      typeText();
    }).bind(this));
  }

  EditorManager.prototype.startAICursor = function () {
    if (this._activeAICursor === null) {
      this._activeAICursor = new AICursor(this);
    }
    return this._activeAICursor;
  }

  EditorManager.prototype.interpret = function () {
    var contents = this._quill.getContents()['ops'];
    return contents.map(function (op) {
      if (attributes)
      return {
        'type': ''
      };
    });
  };


  EditorManager.prototype.enable = function (enabled) {
    this._quill.enable(enabled);
  }

  function EditorMessageManager (dom) {
    this._dom = dom;
    this._body = _('div', { 'className': 'alert alert-info body'});

    this._dom.appendChild(this._body);
  }

  EditorMessageManager.prototype.isBusy = function () {
    return this._dom.classList.contains('show');
  }

  EditorMessageManager.prototype.showResolvingMessage = function (message, promise) {
    return new Promise((function (resolve) {
      var complete = (function () {
        this._dom.classList.remove('open');
        resolve();
      }).bind(this);

      this._body.innerHTML = '';
      var contents = _('div', { 'className': 'contents' });
      if (typeof message === 'string') {
        contents.appendChild(_('', message));
      } else if (Array.isArray(message)) {
        message.forEach(function (elem) {
          contents.appendChild(elem);
        });
      } else {
        contents.appendChild(message);
      }

      promise.then(function () {
        complete();
      });

      this._body.appendChild(contents);
      this._dom.classList.add('open');
    }).bind(this));
  };

  EditorMessageManager.prototype.showMessage = function (message, delay) {
    return new Promise((function (resolve, reject) {
      var complete = (function () {
        this._dom.classList.remove('open');
        resolve();
      }).bind(this);

      this._body.innerHTML = '';
      var contents = _('div', { 'className': 'contents' });
      if (typeof message === 'string') {
        contents.appendChild(_('', message));
      } else if (Array.isArray(message)) {
        message.forEach(function (elem) {
          contents.appendChild(elem);
        });
      } else {
        contents.appendChild(message);
      }

      var timer = setTimeout(function () {
        complete();
      }, delay);
      this._body.appendChild(contents);
      this._dom.classList.add('open');
    }).bind(this));
  };

  EditorMessageManager.prototype.showConfirmation = function (message, options) {
    return new Promise((function (resolve, reject) {
      // general functions
      var complete = (function (selectedOption) {
        this._dom.classList.remove('open');
        resolve(selectedOption);
      }).bind(this);

      // create the UI
      this._body.innerHTML = '';
      var contents = _('div', { 'className': 'contents' });
      if (typeof message === 'string') {
        contents.appendChild(_('', message));
      } else if (Array.isArray(message)) {
        message.forEach(function (elem) {
          contents.appendChild(elem);
        });
      } else {
        contents.appendChild(message);
      }

      var buttonGroup = _('div', { 'className': 'btn-group' },
        options.map(function (option) {
          var button = _('div', { 'className': 'btn btn-' + option.type },
            [_('', option.text)]);
          button.addEventListener('click', function () {
            complete(option.id);
          });
          return button;
        }));

      contents.appendChild(buttonGroup);
      this._body.appendChild(contents);
      this._dom.classList.add('open');
    }).bind(this));
  };

  function EditorScripter (editor, messenger) {
    this._editor = editor;
    this._messenger = messenger;

    this._steps = {};
  }

  EditorScripter.prototype.addStep = function (stepName, handler) {
    this._steps[stepName] = handler.bind(this);
  }

  EditorScripter.prototype.start = function (stepName) {
    return new Promise((function (resolve, reject) {
      try {
        resolve(this._steps[stepName]());
      } catch (e) {
        reject(e);
      }
    }).bind(this));
  }

  exports.EditorManager = EditorManager;
  exports.EditorMessageManager = EditorMessageManager;
  exports.EditorScripter = EditorScripter;
}));
