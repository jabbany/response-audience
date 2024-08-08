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

  function VerticalAccordion(parent, title, body) {
    this._parentDom = parent;

    this._container = null;
    this._titleDom = null;
    this._contentsDom = null;

    this._bind(title, body);
  }

  VerticalAccordion.prototype._bind = function (title, body) {
    if (this._container === null) {
      this._container = _('section', {'className': 'v-accordion open'});
      this._titleDom = _('div', {'className': 'title'});
      this._bodyDom = _('div', {'className': 'body'});

      this._contents = {};
      this._container.appendChild(this._titleDom);
      this._container.appendChild(this._bodyDom);
    }

    this._parentDom.appendChild(this._container);

    if (typeof title === 'string') {
      this.setTitle(title);
    }
    if (typeof body === 'object' && body !== null) {
      this.setContents('', body);
    }

    this._titleDom.addEventListener('mousedown', (function () {
      this.setOpen(!this.isOpen());
    }).bind(this));
  };

  VerticalAccordion.prototype.setTitle = function (text) {
    this._titleDom.innerText = text;
  };

  VerticalAccordion.prototype.getTitle = function (text) {
    return this._titleDom.innerText;
  };

  VerticalAccordion.prototype.getContents = function () {
    return this._contentsDom;
  };

  VerticalAccordion.prototype.setContentsBlock = function (name, contents) {
    if (!(name in this._contents)) {
      this._contents[name] = _('div', {'className': 'contents'});
      this._bodyDom.appendChild(this._contents[name]);
    }

    this._contents[name].replaceChildren(contents);

    return this._contents[name];
  };

  VerticalAccordion.prototype.setContentStyle = function (name, style) {

    if (!(name in this._contents)) {
      this.setContentsBlock(name, []);
    }

    this._contents[name].className = 'contents';
    if (Array.isArray(style)) {
      style.forEach((function (styleName) {
        this._contents[name].classList.add(styleName);
      }).bind(this));
    } else {
      this._contents[name].classList.add(style);
    }
  };

  VerticalAccordion.prototype.setOpen = function (isOpen) {
    this._container.classList.toggle('open', isOpen);
  };

  VerticalAccordion.prototype.isOpen = function () {
    return this._container.classList.contains('open');
  };

  /** Vertical Accordion Derivatives */

  function ContentPanel(contentService, parent) {
    this._contentService = contentService;
    this._panel = new VerticalAccordion(parent, 'CONTEXT');

    this._panel.setContentsBlock('', _makeThrobber());
  }

  ContentPanel.prototype._renderContent = function (content) {
    this._panel.setContentStyle('', ['sns-post', content.source]);

    var fragment = document.createDocumentFragment();

    fragment.appendChild(_('div', {'className': 'post-author showable'}, [
      _('div', {'className': 'avatar'}),
      _('div', {'className': 'name'}, [
        _('strong', {}, [ _('', content.author.name) ]),
        _('', ' (@' + content.author.handle + ')')
      ]),
    ]));

    fragment.appendChild(_('div', {'className': 'post-body showable'}, [
      _('', content.text)
    ]));

    if ('attachments' in content &&
      Array.isArray(content.attachments) &&
      content.attachments.length > 0) {

        fragment.appendChild(_('div', {'className': 'post-attachments showable'},
          content.attachments.map(function (attachment) {
            return _('div', {
              'className': 'image',
              'style': {
                'backgroundImage': 'url(' + attachment.url + ')'
              }
            });
          })));
    }

    this._panel.setContentsBlock('', fragment);
  };

  ContentPanel.prototype.showContent = function (id) {
    this._panel.setContentsBlock('', _makeThrobber());

    return this._contentService.getContent(id).then((function (content) {
        this._renderContent(content);
      }).bind(this));
  };

  function FactsPanel(contentService, parent) {
    this._contentService = contentService;
    this._panel = new VerticalAccordion(parent, 'CONTEXT INSIGHTS');

    this._panel.setContentsBlock('', _makeThrobber());
  }

  FactsPanel.prototype._renderFacts = function (facts) {
    var body = _('ul');

    facts.forEach(function (factlet) {
      body.appendChild(_('li', { 'className': 'showable' }, [_('', factlet)]));
    });

    this._panel.setContentsBlock('', body);
  };

  FactsPanel.prototype.showFacts = function (id) {
    this._panel.setContentsBlock('', _makeThrobber());

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
    this._panel = new VerticalAccordion(parent, 'AUDIENCE');

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

    this._panel.setContentsBlock('', fragment);
  };

  AudienceConfigurationPanel.prototype.getProperties = function () {
    return this._audienceProperties;
  };

  function PersonasPanel (contentService, parent) {
    this._contentService = contentService;
    this._panel = new VerticalAccordion(parent, 'AUDIENCE REACTIONS (Simulated)');

    this._personasArea = null;
    this._personasToolbar = null;

    this._bind();
  }

  PersonasPanel.prototype._renderPersonasList = function (personas) {
    var fragment = document.createDocumentFragment();

    personas.forEach((function (persona) {
      fragment.appendChild(_('div', {'className': 'persona'}, [
        _('div', {'className': 'avatar'}, [
          _('div', {'className': 'info'}, [ _('', 'This is a test of the persona information panel.')])
        ]),
        _('div', {'className': 'body'}, [ _('', persona) ]),

      ]));
    }).bind(this));

    this._panel.setContentsBlock('personas-list', fragment);
  }

  PersonasPanel.prototype._bind = function () {
    this._toolbarLoadBtn = _('div', {
      'className': 'btn btn-primary'
    }, [_('', 'Simulate Audience')]);
    this._toolbarLoadBtn.addEventListener('click', (function () {
      this._panel.setContentsBlock('personas-list', _makeThrobber());

      this._contentService.getInterpretations('example').then((function (results) {
        this._renderPersonasList(results);
      }).bind(this));
    }).bind(this));

    this._personasToolbar = this._panel.setContentsBlock('personas-toolbar', this._toolbarLoadBtn);
    this._personasArea = this._panel.setContentsBlock('personas-list', []);

    this._panel.setContentStyle('personas-toolbar', ['personas-toolbar']);
    this._panel.setContentStyle('personas-list', ['personas-list']);
  };

  function KeyPointsPanel (contentService, parent) {
    this._contentService = contentService;
    this._panel = new VerticalAccordion(parent, 'KEY POINTS');

    this._bind();
  }

  KeyPointsPanel.prototype._bind = function () {
    this._panel.setContentsBlock('', document.createDocumentFragment());
  };

  function SourcesPanel (contentService, parent) {
    this._contentService = contentService;
    this._panel = new VerticalAccordion(parent, 'SOURCES');

    this._bind();
  }

  SourcesPanel.prototype._bind = function () {
    this._panel.setContentsBlock('', document.createDocumentFragment());
  }

  function ReflectionsPanel (contentService, parent) {
    this._contentService = contentService;
    this._panel = new VerticalAccordion(parent, 'REFLECTIONS');

    this._bind();
  }

  ReflectionsPanel.prototype._bind = function () {
    this._panel.setContentsBlock('', document.createDocumentFragment());
  }

  exports.VerticalAccordion = VerticalAccordion;

  exports.ContentPanel = ContentPanel;
  exports.FactsPanel = FactsPanel;
  exports.AudienceConfigurationPanel = AudienceConfigurationPanel;
  exports.PersonasPanel = PersonasPanel;
  exports.KeyPointsPanel = KeyPointsPanel;
  exports.SourcesPanel = SourcesPanel;
  exports.ReflectionsPanel = ReflectionsPanel;
}));
