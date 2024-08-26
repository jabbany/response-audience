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

  function setupTutorial(scripter) {
    // teaser
    scripter.addStep('teaser', function () {
      return this._messenger.showConfirmation(
        _('div', {}, [
          _('strong', {}, [_('', 'Tutorial: AI-Supported Editing')]),
          _('p', {}, [_('', 'This editor comes with additional AI features that can help you draft your response. ' +
            'Think of the AI as a collaborator also working on this draft that you can write notes for. ' +
            'To explore how to collaborate with the AI, we\'ve prepared a short tutorial. ' +
            '(It is highly recommended that you go through the tutorial if you have not used this tool before.)')])
        ]),
        [
          {'id': 'start', 'text': 'Start Tutorial', 'type': 'primary'},
          {'id': 'skip', 'text': 'Skip', 'type': 'secondary'}
        ]).then((function (result) {
          if (result === 'start') {
            return this.start('learn-instruct');
          } else {
            return Promise.resolve();
          }
        }).bind(this));
    });

    // main tutorial
    scripter.addStep('learn-instruct', function () {
      return this._messenger.showResolvingMessage(_('div', {}, [
          _('strong', {}, _('', 'We will first demonstrate the "instruct" mode. ')),
          _('p', {}, _('', 'In this mode, text that you type into the editor is interpreted as an instruction for the AI. Select the "Instruct" button to switch to this mode.'))
        ]),
        this._editor.highlightModeButton('instruct', -1)).then((function () {
          return this.start('instruct-demo');
        }).bind(this));
    });

    scripter.addStep('instruct-demo', function () {
      return this._messenger.showResolvingMessage('Now, we will show you an example of what you could input as an instruction...',
        this._editor.animateTyping(0, 'Draft a response to the target tweet that explains why it is misinformed. ' +
          'Try to address the key points selected and use the selected sources to back up your explanation when possible.', 3000)).then((function () {

          return this._messenger.showResolvingMessage('Once you are done, select the "Handoff to AI" button to indicate to the AI that you are ready to get its input.',
            this._editor.highlightModeButton('ai', -1))
        }).bind(this)).then((function () {
          this.start('instruct-ai-handoff');
        }).bind(this));
    });

    scripter.addStep('instruct-ai-handoff', function () {
      var cursor = this._editor.startAICursor();
      var messenger = this._messenger;
      var promise = cursor.suggestMove(0, 0);
      promise = promise.then(function () {
        return cursor.suggestAttention(0, 184, 2000);
      });
      promise = promise.then(function () {
        return messenger.showMessage('Working...', 2000);
      });
      promise = promise.then((function () {
        return this.start('instruct-ai-handoff-generate');
      }).bind(this));
      return promise;
    });

    scripter.addStep('instruct-ai-handoff-generate', function () {
      var cursor = this._editor.startAICursor();
      var messenger = this._messenger;
      var promise = Promise.resolve();
      promise = promise.then(function () {
        return cursor.suggestMove(185, 0);
      });
      promise = promise.then(function () {
        return messenger.showMessage('Suggesting...', 2000);
      });
      promise = promise.then(function () {
        var generateOptions = [
          'This tweet is misinformed: While there have been proposals to remove certain books from schools based on religious grounds in Florida in the past, the state does not have any state-wide ban on any book titles.\n As such, several of the books on the list are indeed considered classics and are even on the state\'s recommended list of Benchmarks for Excellent Student Thinking (B.E.S.T.) books. Creating and enforcing content guidelines for which books are appropriate in school libraries is the responsibility of local school districts. Sources have identified that the list included in the image was originally created as a satirical example, and is not reflective of any current policy in Florida.\n\nIf you want to learn more, here are some helpful sources: \nhttps://www.reuters.com/article/fact-check/florida-has-not-banned-of-mice-and-men-and-other-classics-for-being-woke-idUSL1N3000ZJ\nhttps://www.politifact.com/factchecks/2022/aug/24/viral-image/viral-list-banned-books-florida-satire/\nhttps://rumors.newslit.org/viral-list-of-banned-books-in-florida-isnt-real/\n',
          'Actually, the information in the image is not accurate. The book titles included in this image have not been banned in Florida, and the image has already been debunked as originating from a satire piece. While it is true that in the months leading up to this viral meme, several book bans were enacted at libraries and schools across the United States on titles that primarily dealt with racism and LGBTQ issues, this was not the case in Florida where it is generally up to local school districts to enforce any recommendations on books. Furthermore, titles like "1984", "Of Mice and Men", and "Lord of the Flies" are in fact on the list of recommended books in Florida. \nWhile there have certainly been local challenges to freedom of speech in recent years, in this case no books have actually been banned in the state.\nHere are some helpful sources to check out if you want more details: \nhttps://rumors.newslit.org/viral-list-of-banned-books-in-florida-isnt-real/\nhttps://www.politifact.com/factchecks/2022/aug/24/viral-image/viral-list-banned-books-florida-satire/\n'
        ];
        return cursor.suggestInsert(185, generateOptions[Math.floor(generateOptions.length * Math.random())], 4000);
      });
      promise = promise.then((function () {
        return messenger.showConfirmation(_('div', {}, [
          _('strong', {}, _('', 'The AI has a question for you:')),
          _('p', {}, _('', 'I\'ve added some text. Does this look good to you?'))
        ]), [
          {'id': 'success', 'text': 'Yes, use this', 'type': 'primary'},
          {'id': 'retry', 'text': 'Show me an alternative', 'type': 'secondary'},
          {'id': 'fail', 'text': 'Stop and let me make changes', 'type': 'secondary'},
        ]).then((function (selection) {
          if (selection === 'success') {
            return this.start('learn-demonstrate');
          } else if (selection === 'retry') {
            return this.start('instruct-ai-handoff-generate');
          } else {
            return; // move nowhere
          }
        }).bind(this));
      }).bind(this));

      return promise;
    });

    scripter.addStep('learn-demonstrate', function () {
      return this._messenger.showResolvingMessage(_('div', {}, [
          _('strong', {}, _('', 'Next, we will show you how to use the "demonstrate" mode.')),
          _('p', {}, _('', 'In this mode, text that you type will serve as an example of (a snippet from) a good response that the AI should try to learn from. Select the "Demonstrate" button to switch to this mode.'))
        ]),
        this._editor.highlightModeButton('demonstrate', -1)).then((function () {
          // clear the editor
          this._editor._quill.deleteText(0, this._editor._quill.getLength());
          return this.start('demonstrate-demo');
        }).bind(this));
    });

    scripter.addStep('demonstrate-demo', function () {
      return this._messenger.showResolvingMessage('Here\'s an example of of what you might add as a demonstration.',
        this._editor.animateTyping(0, 'I understand the concerns about this, as the news does look worrying. ' +
          'However, before reacting right away, we should first look into how reliable the source of this news is to decide whether we can trust it.', 3000)).then((function () {

          return this._messenger.showResolvingMessage('Again, once you are done, select the "Handoff to AI" button to indicate to the AI that you are ready to get its input.',
            this._editor.highlightModeButton('ai', -1))
        }).bind(this)).then((function () {
          this.start('demonstrate-ai-handoff');
        }).bind(this));
    });

    scripter.addStep('demonstrate-ai-handoff', function () {
      var cursor = this._editor.startAICursor();
      var messenger = this._messenger;
      var promise = cursor.suggestMove(0, 0);
      promise = promise.then(function () {
        return cursor.suggestAttention(0, 207, 2000);
      });
      promise = promise.then(function () {
        return messenger.showMessage('Working...', 2000);
      });
      promise = promise.then((function () {
        return this.start('demonstrate-ai-handoff-generate');
      }).bind(this));
      return promise;
    });

    scripter.addStep('demonstrate-ai-handoff-generate', function () {
      var cursor = this._editor.startAICursor();
      var messenger = this._messenger;
      var promise = Promise.resolve();
      promise = promise.then(function () {
        return cursor.suggestMove(208, 0);
      });
      promise = promise.then(function () {
        return messenger.showMessage('Suggesting...', 2000);
      });
      promise = promise.then(function () {
        return cursor.suggestInsert(208, 'I understand that this looks like an example of the worrying challenges mounted against our freedom of speech these days. ' +
          'However, before we potentially over-react, let\'s take a step back and check whether the information in the image is accurate. \nA brief search tells us that the original image was actually produced as a satirical piece on recent challenges to books related to racism and LGBTQ themes in conservative states. In actuality, there is no list of banned books for Florida, and any books that might have been removed during investigations, have all since been restored.\n While we should be vigilant, in this case, the information was inaccurate.', 4000);
      });
      promise = promise.then((function () {
        return messenger.showConfirmation(_('div', {}, [
          _('strong', {}, _('', 'The AI has a question for you:')),
          _('p', {}, _('', 'I\'ve added some text. Does this look good to you?'))
        ]), [
          {'id': 'success', 'text': 'Yes, use this', 'type': 'primary'},
          {'id': 'retry', 'text': 'Show me an alternative', 'type': 'secondary'},
          {'id': 'fail', 'text': 'Stop and let me make changes', 'type': 'secondary'},
        ]).then((function (selection) {
          if (selection === 'success') {
            return this.start('learn-empty');
          } else if (selection === 'retry') {
            return this.start('demonstrate-ai-handoff-generate');
          } else {
            return; // move nowhere
          }
        }).bind(this));
      }).bind(this));

      return promise;
    });

    scripter.addStep('learn-empty', function () {
      return this._messenger.showResolvingMessage(_('div', {}, [
        _('strong', {}, _('', 'Finally, we will demonstrate handing off to the AI without any special notes.')),
        _('p', {}, _('', 'Select the "Write" button to switch to regular writing mode.'))
      ]),
      this._editor.highlightModeButton('write', -1)).then((function () {
        // clear the editor
        this._editor._quill.deleteText(0, this._editor._quill.getLength());
        return this.start('empty-demo');
      }).bind(this));
    });

    scripter.addStep('empty-demo', function () {
      return this._messenger.showResolvingMessage('In this mode, you can just start writing directly',
        this._editor.animateTyping(0, 'This tweet is misinformed. ', 2000)).then((function () {

          return this._messenger.showResolvingMessage('When you want the AI to help you continue your writing, select the "Handoff to AI" button to indicate to the AI that you are ready to get its input.',
            this._editor.highlightModeButton('ai', -1))
        }).bind(this)).then((function () {
          this.start('empty-ai-handoff');
        }).bind(this));
    });

    scripter.addStep('empty-ai-handoff', function () {
      var cursor = this._editor.startAICursor();
      var messenger = this._messenger;
      var promise = cursor.suggestMove(0, 0);
      promise = promise.then(function () {
        return cursor.suggestAttention(0, 26, 1000);
      });
      promise = promise.then(function () {
        return messenger.showMessage('Working...', 1000);
      });
      promise = promise.then((function () {
        return this.start('empty-ai-handoff-generate');
      }).bind(this));
      return promise;
    });

    scripter.addStep('empty-ai-handoff-generate', function () {
      var cursor = this._editor.startAICursor();
      var messenger = this._messenger;
      var promise = Promise.resolve();
      promise = promise.then(function () {
        return cursor.suggestMove(26, 0);
      });
      promise = promise.then(function () {
        return messenger.showMessage('Suggesting...', 2000);
      });
      promise = promise.then(function () {
        return cursor.suggestInsert(26, 'The image attached is not an authentic list of banned books in Florida. The state does not have a state-wide ban on book titles, and the local school districts are responsible for enforcing content guidelines. Some of the books mentioned in the list are even recommended by the state\'s Benchmarks for Excellent Student Thinking (B.E.S.T.) Standards. The list was later clarified to be satirical. ', 3000);
      });
      promise = promise.then((function () {
        return messenger.showConfirmation(_('div', {}, [
          _('strong', {}, _('', 'The AI has a question for you:')),
          _('p', {}, _('', 'I\'ve added some text. Does this look good to you?'))
        ]), [
          {'id': 'success', 'text': 'Yes, use this', 'type': 'primary'},
          {'id': 'retry', 'text': 'Show me an alternative', 'type': 'secondary'},
          {'id': 'fail', 'text': 'Stop and let me make changes', 'type': 'secondary'},
        ]).then((function (selection) {
          if (selection === 'success') {
            return this.start('complete-tutorial');
          } else if (selection === 'retry') {
            return this.start('empty-ai-handoff-generate');
          } else {
            return; // move nowhere
          }
        }).bind(this));
      }).bind(this));

      return promise;
    });

    scripter.addStep('complete-tutorial', function () {
      return this._messenger.showResolvingMessage(_('div', {}, [
        _('strong', {}, _('', 'Tutorial complete!')),
        _('p', {}, _('', 'Select the "Write" button to switch to regular writing mode.'))
      ]),
      this._editor.highlightModeButton('write', -1)).then((function () {
        // clear the editor
        this._editor._quill.deleteText(0, this._editor._quill.getLength());
        this._editor.startAICursor().leave();
      }).bind(this));
    });
  }

  window.addEventListener('load', function () {
    var CONTENT_ID = 'example';
    var apiService = new api.ApiService('res');

    var mainGrid = new gridManager.GridManager($('#grid-main'), $('#grid-controls-main'));
    var modalDialog = new modal.ModalPage($('#modal'));

    // explanations for why sources were ranked this way short explanation[]

    // additional feature: specify custom personas. have some default at the top and allow users to add at the bottom.

    // neurips workshop position piece: tie in case law paper and SPICA,

    // a couple of sections in the paper: here are some ways we can used cases - follow on project (synthesis) [ different use cases based on differnt settings [few cases, a lot of cases, cases on demand, shared cases]  = > different case banks = > What do you get making a case bank like this || why we think this is useful || => pluralism (pluralistic AI focus on how they affect plurlism, cheaper version, vs more resource intensive version) ]

    var messenger = new editorManager.EditorMessageManager($('#card-suggestions-edit'));
    var editor = new editorManager.EditorManager($('#editor'), $('#btg-editor-mode'));
    var scripter = new editorManager.EditorScripter(editor, messenger);

    // bind a tutorial to the scripter
    setupTutorial(scripter);

    var contentPanel = new panels.ContentPanel(apiService, $('#card-content'));
    var factsPanel = new panels.FactsPanel(apiService, $('#card-content'));
    var audiencePanel = new panels.AudienceConfigurationPanel(apiService, $('#card-audience'));
    var planningPersonas = new panels.PersonasPanel(apiService, $('#card-audience'), modalDialog);
    var reflectionPanel = new panels.ReflectionsPanel(apiService, $('#card-reflection'))
    var keyPointsPanel = new panels.KeyPointsPanel(apiService, $('#card-key-points'));
    var reviewPersonas = new panels.PersonasPanel(apiService, $('#card-reactions'), modalDialog);

    contentPanel.showContent(CONTENT_ID).then(function () {
      return factsPanel.showFacts(CONTENT_ID);
    }).then(function () {
      $('#trigger-audience').classList.add('open');
    });

    $('#btn-go-audience').addEventListener('click', function () {
      // close the other panels
      $('#trigger-audience').classList.remove('open');
      contentPanel._panel.setOpen(false);
      factsPanel._panel.setOpen(false);

      $('#card-audience').style.display = '';
      $('#trigger-start').classList.add('open');

      audiencePanel.addProperty('segment');
      audiencePanel.addProperty('political');
      audiencePanel.addProperty('location');
      audiencePanel.addProperty('religion');
      audiencePanel._panel.setOpen(true);
      planningPersonas._panel.setOpen(true);
    });

    audiencePanel.addChangeListener(function (audienceDetails) {
      // test
      planningPersonas.setDefaultAudience(audienceDetails);
      reviewPersonas.setDefaultAudience(audienceDetails);
    });

    var hasDoneTutorial = false;
    mainGrid.addChangeListener(function (newMode) {
      if (newMode === 'wiz-editing') {
        // make sure the editor is enabled
        editor.enable(true);

        if (!hasDoneTutorial) {
          scripter.start('teaser');
          hasDoneTutorial = true;
        }

        keyPointsPanel.syncKeyPoints(CONTENT_ID);

      } else if (newMode === 'wiz-reviewing') {
        // make sure the editor is disabled
        editor.enable(false);

      } else if (newMode === 'wiz-planning') {

      }
    });
    mainGrid.setState('wiz-planning');

    $('#btn-start').addEventListener('click', function () {
      mainGrid.setState('wiz-editing');
    });

    this.window.editor = editor;
    this.window.messenger = messenger;
    this.window.modal = modalDialog;
  });

}));
