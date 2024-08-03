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

  function _makeThrobber() {
    return _('div', {
      'className': 'throbber'
    }, [
      _('div', {'className': 'dot'}),
      _('div', {'className': 'dot'}),
      _('div', {'className': 'dot'})
    ]);
  }

  function CollapsablePanel(parent, title, body) {
    this._parentDom = parent;
    this._headDom = null;
    this._bodyDom = null;

    this._collapseState = false;

    this._bind(title, body);
  }

  CollapsablePanel.prototype._bind = function (title, body) {
    if (this._headDom === null) {
      this._headDom = _('div', {'className': 'title'});
    }
    if (this._bodyDom === null) {
      this._bodyDom = _('div', {'className': 'body'});
    }

    this._parentDom.appendChild(this._headDom);
    this._parentDom.appendChild(this._bodyDom);

    if (typeof title === 'string') {
      this.setTitle(title);
    }
    if (typeof body === 'object' && body !== null) {
      this.setBody(body);
    }

    this._headDom.addEventListener('mousedown', (function () {
      this.setCollapse(!this._collapseState);
    }).bind(this));
  };

  CollapsablePanel.prototype.setTitle = function (text) {
    this._headDom.innerHTML = '';
    this._headDom.appendChild(_('', text));
  };

  CollapsablePanel.prototype.getBody = function () {
    return this._bodyDom;
  };

  CollapsablePanel.prototype.setCollapse = function (collapseState) {
    if (collapseState) {
      // Collapse
      this._bodyDom.classList.add('hidden');
      this._headDom.classList.add('caret-down');
      this._headDom.classList.remove('caret-up');

    } else {
      // Expand
      this._bodyDom.classList.remove('hidden');
      this._headDom.classList.remove('caret-down');
      this._headDom.classList.add('caret-up');

    }

    this._collapseState = collapseState;
  };

  CollapsablePanel.prototype.setBody = function (bodyContents) {
    this._bodyDom.innerHTML = '';
    this._bodyDom.appendChild(bodyContents);
  };

  CollapsablePanel.prototype.renderThrobber = function () {
    this.setBody(_makeThrobber());
  };

  function ContentPanel(contentService, parent) {
    this._contentService = contentService;
    this._panel = new CollapsablePanel(parent, 'CONTEXT');

    this._panel.renderThrobber();
  }

  ContentPanel.prototype._renderContent = function (content) {
    var container = this._panel.getBody();
    container.classList.add('sns-post');
    container.classList.add(content.source);

    var fragment = document.createDocumentFragment();

    fragment.appendChild(_('div', {'className': 'post-author'}, [
      _('div', {'className': 'avatar'}),
      _('div', {'className': 'name'}, [
        _('strong', {}, [ _('', content.author.name) ]),
        _('', ' (@' + content.author.handle + ')')
      ]),
    ]));

    fragment.appendChild(_('div', {'className': 'post-body'}, [
      _('', content.text)
    ]));

    if ('attachments' in content &&
      Array.isArray(content.attachments) &&
      content.attachments.length > 0) {

        fragment.appendChild(_('div', {'className': 'post-attachments'},
          content.attachments.map(function (attachment) {
            return _('div', {
              'className': 'image',
              'style': {
                'backgroundImage': 'url(' + attachment.url + ')'
              }
            });
          })));
    }

    this._panel.setBody(fragment);
  };

  ContentPanel.prototype.showContent = function (id) {
    this._panel.renderThrobber();
    return this._contentService.getContent(id).then((function (content) {
        this._renderContent(content);
      }).bind(this));
  };

  function FactsPanel(contentService, parent) {
    this._contentService = contentService;
    this._panel = new CollapsablePanel(parent, 'CONTEXT INSIGHTS');

    this._panel.renderThrobber();
  }

  FactsPanel.prototype._renderFacts = function (facts) {
    var body = _('ul');

    facts.forEach(function (factlet) {
      body.appendChild(_('li', {}, [_('', factlet)]));
    });

    this._panel.setBody(body);
  };

  FactsPanel.prototype.showFacts = function (id) {
    this._panel.renderThrobber();
    return this._contentService.getFacts(id).then((function (facts) {
        this._renderFacts(facts);
      }).bind(this));
  };

  function PropertySelector(options, defaultValue) {
    this._options = options;
    this._value = defaultValue;

    this._dom = _('span', {
      'className': 'badge clickable text-bg-info'
    }, [_('', this._value)]);

    this._pickerDom = null;
    this._editMode = false;

    this._bind();
  }

  PropertySelector.prototype._bind = function () {
    if (this._pickerDom === null) {
      var optionsDom = this._options.map((function (value) {
        var option = _('option', {
          'value': value
        }, [_('', value)]);
        if (value === this._value) {
          option.setAttribute('selected', 'selected')
        }
        return option;
      }).bind(this));

      this._pickerDom = _('select', {}, optionsDom);
      this._pickerDom.addEventListener('change', (function () {
        this.editMode(false);
      }).bind(this));
      this._pickerDom.addEventListener('focusout', (function () {
        this.editMode(false);
      }).bind(this));
    }

    this._dom.addEventListener('click', (function () {
      if (!this._editMode) {
        this.editMode(true);
      }
    }).bind(this));
  }

  PropertySelector.prototype.editMode = function (editMode) {
    if (editMode) {
      this._dom.innerHTML = '';
      this._dom.appendChild(this._pickerDom);
    } else {
      this._dom.innerHTML = '';
      this._dom.appendChild(_('', this.value()))
    }
    this._editMode = editMode;
  }

  PropertySelector.prototype.value = function () {
    return this._pickerDom.value;
  }

  function AudienceConfigurationPanel(contentService, parent) {
    this._contentService = contentService;
    this._panel = new CollapsablePanel(parent, 'AUDIENCE');

    this._audienceProperties = {
      'segment': new PropertySelector([
          'elderly',
          'parents',
          'students',
          'homeowners'
        ], 'parents'),
      'political': new PropertySelector([
          'conservatives',
          'liberals',
          'moderates'
        ], 'liberals'),
      'location': new PropertySelector([
          'urban',
          'rural'
        ], 'urban'),
      'religion': new PropertySelector([
          'very important',
          'somewhat important',
          'not at all important'
        ], 'not at all important')
    };

    this._bind();
  }

  AudienceConfigurationPanel.prototype._bind = function () {
    var fragment = document.createDocumentFragment();

    fragment.appendChild(_('', 'This post has been shared in a community with the following properties:\n'));
    fragment.appendChild(_('', 'Community members are mostly '));
    fragment.appendChild(this._audienceProperties.segment._dom);
    fragment.appendChild(_('', '. '));

    fragment.appendChild(_('', 'Community members live in a '));
    fragment.appendChild(this._audienceProperties.location._dom);
    fragment.appendChild(_('', ' location. '));

    fragment.appendChild(_('', 'Community members identify as '));
    fragment.appendChild(this._audienceProperties.political._dom);
    fragment.appendChild(_('', ' politically. '));

    fragment.appendChild(_('', 'Most community members consider religion to be '));
    fragment.appendChild(this._audienceProperties.religion._dom);
    fragment.appendChild(_('', ' in their lives. '));

    this._panel.setBody(fragment);
  };

  AudienceConfigurationPanel.prototype.getProperties = function () {
    return this._audienceProperties;
  };

  function AudiencePersonasPanel (contentService, parent) {
    this._contentService = contentService;
    this._panel = new CollapsablePanel(parent, 'AUDIENCE REACTIONS (Simulated)');

    this._personasArea = _('div');
    this._loadPersonasBtn = _('div', {
        'className': 'btn btn-primary'
      }, [_('', 'Simulate Audience')]);

    this._bind();
  }

  AudiencePersonasPanel.prototype._bind = function () {
    this._loadPersonasBtn.addEventListener('click', (function () {
      this._personasArea.innerHTML = '';
      this._personasArea.appendChild(_makeThrobber());
      this._contentService.getInterpretations('example').then((function (results) {
        this._personasArea.innerHTML = '';
        results.forEach((function (response) {
          this._personasArea.appendChild(_('div', {'style': {'padding': '0.75rem'}}, [_('', response)]));
        }).bind(this))
      }).bind(this));
    }).bind(this));

    var fragment = document.createDocumentFragment();
    fragment.appendChild(this._personasArea);
    fragment.appendChild(this._loadPersonasBtn);

    this._panel.setBody(fragment);
  };

  AudiencePersonasPanel.prototype.showPersonasSimulation = function (personaProperties) {

  }

  exports.CollapsablePanel = CollapsablePanel;
  exports.ContentPanel = ContentPanel;
  exports.FactsPanel = FactsPanel;
  exports.AudienceConfigurationPanel = AudienceConfigurationPanel;
  exports.AudiencePersonasPanel = AudiencePersonasPanel;
}));
