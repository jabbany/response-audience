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

  AICursor.prototype.executeScript = function (actions) {
    var promise = Promise.resolve();
    actions.forEach((function (spec) {
      promise = promise.then((function () {
        if (spec.action === 'move') {
          return this.suggestMove(spec.index, spec.duration);
        } else if (spec.action === 'attention') {
          return this.suggestAttention(spec.index, spec.length, spec.duration);
        } else if (spec.action === 'insert') {
          return this.suggestInsert(spec.index, spec.content, spec.duration);
        } else if (spec.action === 'delete') {
          return this.suggestDelete(spec.index, spec.length, spec.duration);
        } else if (spec.action === 'modify') {
          return this.suggestModify(spec.index, spec.length, spec.content, spec.duration);
        } else if (spec.action === 'confirm') {
          return this._parent.requestConfirmation(spec.prompt);
        } else if (spec.action === 'talk') {
          return this._parent.setAIStatusMessage(spec.message);
        } else if (spec.action === 'wait') {
          return _newWaitTimer(spec.duration);
        } else {
          return;
        }
      }).bind(this))
    }).bind(this));
    return promise;
  }

  AICursor.prototype.leave = function () {
    if (this._parent._activeAICursor !== this) {
      throw new Error('Stale cursor instance!');
    }

    this._parent._cursors.removeCursor(this._cursorId);
    this._parent._activeAICursor = null;
  }

  function EditorManager(editorDom, controlsDom, notificationsDom) {
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
    this._notificationsDom = notificationsDom;

    // AI notification related
    this._notifyTutorialDom = null;
    this._notifyConfirmDom = null;
    this._notifyStatusDom = null;

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

    // hook up the tutorial
    var tutorialStartButton = _('div', {
        'className': 'btn btn-secondary'
      }, [_('', 'Walkthrough: Get started')]);
    this._notifyTutorialDom = _('div', {}, [
      _('strong', {}, [_('', 'AI-Supported Editing Mode Enabled')]),
      _('p', {}, [_('', 'In editing mode, you will be able to collaborate with an AI cursor.')]),
      tutorialStartButton
    ]);
    tutorialStartButton.addEventListener('click', (function () {
      this._notifyTutorialDom.style.display = 'none';

      var promise = Promise.resolve();

      promise = promise.then((function () {
        return this.executeScript([
          {'action': 'talk', 'message': 'Please select the "instruct" mode. Once in this mode, text typed into the editor become instructions for the AI assistant.'},
          {'action': 'highlight-mode', 'editMode': 'instruct', 'duration': -1},
          {'action': 'talk', 'message': 'Tutorial: Here\'s an example of some instructions you could type.'},
          {'action': 'type', 'content': 'Please generate a reply that corrects the misinformation in the context post.\n', 'index': 0, 'duration': 2000},
          {'action': 'talk', 'message': 'Once you\'re done with the instructions, please select the "Handoff to AI" to indicate to the AI assistant that you are ready for suggestions.'},
          {'action': 'highlight-mode', 'editMode': 'ai', 'duration': -1}
        ]);
      }).bind(this));

      promise = promise.then((function () {
        var cursor = this.startAICursor();

        return cursor.executeScript([
          {'action': 'talk', 'message': 'Assistant is examining the editor...'},
          {'action': 'move', 'index': 0, 'duration': 0},
          {'action': 'attention', 'index': 0, 'length': 77, 'duration': 2000},
          {'action': 'talk', 'message': 'Working...'},
          {'action': 'wait', 'duration': 2000},
          {'action': 'talk', 'message': 'Suggesting...'},
          {'action': 'move', 'index': 78, 'duration': 0},
          {'action': 'insert', 'index': 78, 'content': 'This is a simulated AI response! \nBlah blah blah.\nBlah blah blah.', 'duration': 4000},
          {'action': 'talk', 'message': ''},
          {'action': 'confirm', 'prompt': 'The AI has generated the following response, do you want to accept?'},
          {'action': 'talk', 'message': 'Assistant is examining the editor...'},
          {'action': 'move', 'index': 0, 'duration': 1000},
          {'action': 'talk', 'message': 'Working...'},
          {'action': 'wait', 'duration': 1000},
          {'action': 'delete', 'index': 0, 'length': 78, 'duration': 2000},
          {'action': 'talk', 'message': ''},
          {'action': 'confirm', 'prompt': 'The AI suggests deleting the prompt from the editor as the response has been generated, do you want to do this?'},
        ]);
      }).bind(this)).then((function () {
        this.startAICursor().leave();
        return this.executeScript([
          {'action': 'delete', 'index': 0, 'length': 78},
          {'action': 'talk', 'message': 'Assistant is examining the editor...'},
          {'action': 'wait', 'duration': 1000 },
          {'action': 'talk', 'message': 'Switching back to writing mode: Click on the "write" button to switch back to direct writing mode. In this mode, you will be editing the response draft directly.'},
          {'action': 'highlight-mode', 'editMode': 'write', 'duration': -1},
          {'action': 'talk', 'message': 'Thanks for completing the tutorial! (This concludes the demo)'},
        ]);
      }).bind(this)).catch((function () {
        // tutorial failed
        this._notifyTutorialDom.style.display = '';
      }).bind(this));
    }).bind(this));

    // hook up the status dialog
    this._notifyStatusDom = _('div');

    // hook up the confirmation dialog
    this._notifyConfirmDom = {
      'confirmBtn': _('div', { 'className': 'btn btn-primary' }, [_('', 'Looks good!')]),
      'rejectBtn': _('div', { 'className': 'btn btn-secondary' }, [_('', 'Doesn\'t look good :(')]),
      'prompt': _('p', {}, [_('', '')]),
      'container': _('div', { 'style': { 'display': 'none' } }, [
        _('strong', {}, [_('', 'The AI Assistant has a question for you:')])
      ])
    };
    this._notifyConfirmDom.container.appendChild(this._notifyConfirmDom.prompt);
    this._notifyConfirmDom.container.appendChild(this._notifyConfirmDom.confirmBtn);
    this._notifyConfirmDom.container.appendChild(this._notifyConfirmDom.rejectBtn);

    this._notificationsDom.appendChild(this._notifyTutorialDom);
    this._notificationsDom.appendChild(this._notifyStatusDom);
    this._notificationsDom.appendChild(this._notifyConfirmDom.container);

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

  EditorManager.prototype.requestConfirmation = function (prompt, showSkipButton) {
    return new Promise((function (resolve, reject) {
      var acceptFn = (function () {
        cleanup();
        resolve();
      }).bind(this);
      var rejectFn = (function () {
        cleanup();
        reject();
      }).bind(this);

      var cleanup = (function () {
        this._notifyConfirmDom.container.style.display = 'none';
        this._notifyConfirmDom.confirmBtn.removeEventListener('click', acceptFn);
        this._notifyConfirmDom.rejectBtn.removeEventListener('click', rejectFn);
      }).bind(this);

      this._notifyConfirmDom.container.style.display = '';
      this._notifyConfirmDom.prompt.innerText = prompt;
      this._notifyConfirmDom.confirmBtn.addEventListener('click', acceptFn);
      this._notifyConfirmDom.rejectBtn.addEventListener('click', rejectFn);
    }).bind(this));
  }

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

  EditorManager.prototype.executeScript = function (actions) {
    var promise = Promise.resolve();

    // chain the actions
    actions.forEach((function (spec) {
      promise = promise.then((function () {
        // do the action
        if (spec.action === 'type') {
          return this.animateTyping(spec.index, spec.content, spec.duration);
        } else if (spec.action === 'talk') {
          return this.setAIStatusMessage(spec.message);
        } else if (spec.action === 'delete') {
          this._quill.deleteText(spec.index, spec.length);
          return ;
        } else if (spec.action === 'highlight-mode') {
          return this.highlightModeButton(spec.editMode, spec.duration);
        } else if (spec.action === 'switch-mode') {
          this._changeEditMode(spec.editMode);
          return;
        } else if (spec.action === 'wait') {
          return _newWaitTimer(spec.duration);
        } else {
          console.log('Error: Cannot handle action spec');
          console.log(spec);
          return;
        }
      }).bind(this));
    }).bind(this));

    return promise;
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

  exports.EditorManager = EditorManager;
}));
