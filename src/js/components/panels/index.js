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

  function VerticalAccordion(parent, title, body, startClosed) {
    this._parentDom = parent;

    this._container = null;
    this._titleDom = null;
    this._contentsDom = null;

    this._bind(title, body);
    if (startClosed) {
      this.setOpen(false);
    }
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
    this._panel = new VerticalAccordion(parent, 'RESPONSE TARGET');

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
            }, [], function (attachment) {
              attachment.addEventListener('click', (function (url) {
                return function () {
                  try {
                    modal.open('Image Preview', _('img', {'src': url}));
                  } catch (e) { console.log (e); }
                }
              })(attachment.url));
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
    this._panel = new VerticalAccordion(parent, 'FACT CHECK');

    this._panel.setContentsBlock('', _makeThrobber());
  }

  FactsPanel.prototype._renderFacts = function (facts) {
    var fragment = document.createDocumentFragment();
    fragment.appendChild(_('p', {}, [_('', 'Based on fact checkers, the content above is misinformed in the following ways:')]))

    var body = _('ul');
    facts.forEach(function (factlet) {
      body.appendChild(_('li', { 'className': 'showable' }, [_('', factlet)]));
    });
    fragment.appendChild(body);

    this._panel.setContentsBlock('', fragment);
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
        this._setEditMode(false);
      }).bind(this));
      this._pickerDom.addEventListener('focusout', (function () {
        this._setEditMode(false);
      }).bind(this));
    }

    this._dom.addEventListener('click', (function () {
      if (!this._editMode) {
        this._setEditMode(true);
      }
    }).bind(this));
  }

  PropertySelector.prototype._setEditMode = function (editMode) {
    if (editMode) {
      this._dom.innerHTML = '';
      this._dom.appendChild(this._pickerDom);
    } else {
      this._dom.innerHTML = '';
      this._dom.appendChild(_('', this.value()))
    }
    this._editMode = editMode;
  }

  PropertySelector.prototype.setValue = function (value) {
    if (this._options.indexOf(value) < 0) {
      throw new Error('Cannot set value to ' + value + ' as it is not one of the options.');
    }
    // figure out what mode we're in
    this._pickerDom.value = value;
    if (!this._editMode) {
      this._dom.innerHTML = '';
      this._dom.appendChild(_('', this.value()));
    }
  }

  PropertySelector.prototype.value = function () {
    return this._pickerDom.value;
  }

  function AudienceConfigurationPanel(contentService, parent) {
    this._contentService = contentService;
    this._panel = new VerticalAccordion(parent, 'AUDIENCE CONFIGURATION', null, true);

    this._listeners = [];
    this._supportedProperties = {
      'segment': {
        'preamble': 'Consist mainly of ',
        'selector': new PropertySelector([
          'elderly',
          'parents',
          'students',
          'homeowners'
        ], 'parents'),
        'suffix': '.'
      },
      'political': {
        'preamble': 'Politically identify as ',
        'selector': new PropertySelector([
          'conservatives',
          'liberals',
          'moderates'
        ], 'liberals'),
        'suffix': '.'
      },
      'location': {
        'preamble': 'Reside in a ',
        'selector': new PropertySelector([
          'urban',
          'rural'
        ], 'urban'),
        'suffix': ' area.'
      },
      'religion': {
        'preamble': 'Consider religion to be ',
        'selector': new PropertySelector([
          'very important',
          'somewhat important',
          'not at all important'
        ], 'not at all important'),
        'suffix': ' in their lives.'
      }
    }
    this._audienceProperties = [];
    this._renderPropertiesList();
  }

  AudienceConfigurationPanel.prototype._renderPropertiesList = function () {
    var fragment = document.createDocumentFragment();

    fragment.appendChild(_('', 'The audience of this post is anticipated to:\n'));

    var list = _('ul');
    this._audienceProperties.forEach((function (propertyName) {
      var item = _('li', {}, [
        _('', this._supportedProperties[propertyName].preamble),
        this._supportedProperties[propertyName].selector._dom,
        _('', this._supportedProperties[propertyName].suffix)
      ])
      list.appendChild(item);
    }).bind(this));

    fragment.appendChild(list);

    this._panel.setContentsBlock('', fragment);
  };

  AudienceConfigurationPanel.prototype._emitChangeEvent = function (properties) {
    this._listeners.forEach(function (listener) {
      try {
        listener(properties);
      } catch (e) { console.log(e); }
    })
  };

  AudienceConfigurationPanel.prototype.addProperty = function (propertyName, value) {
    if (!propertyName in this._supportedProperties) {
      throw new Error('The property ' + propertyName + ' is not supported!');
    }
    if (this._audienceProperties.indexOf(propertyName) < 0) {
      // not in the list
      this._audienceProperties.push(propertyName);
      if (typeof value !== undefined && value !== null) {
        this._supportedProperties[propertyName].selector.set
      }
      this._renderPropertiesList();
    }
  };

  AudienceConfigurationPanel.prototype.removeProperty = function (propertyName) {
    if (this._audienceProperties.indexOf(propertyName) >= 0) {
      // remove it
      this._audienceProperties.splice(this._audienceProperties.indexOf(propertyName), 1);
      this._renderPropertiesList();
    }
  };

  AudienceConfigurationPanel.prototype.getAudienceProperties = function () {
    return this._audienceProperties.reduce((function (acc, propertyName) {
      acc[propertyName] = this._supportedProperties[propertyName].selector.value();
    }).bind(this), {});
  };

  AudienceConfigurationPanel.prototype.addChangeListener = function (listener) {
    this._listeners.push(listener);
  };

  function PersonasPanel (contentService, parent, modal) {
    this._contentService = contentService;
    this._panel = new VerticalAccordion(parent, 'SIMULATED REACTIONS', null, true);

    this._modal = modal;

    this._personasArea = null;
    this._personasToolbar = null;

    this._bind();
  }

  PersonasPanel.prototype._renderPersonasList = function (personas) {
    var fragment = document.createDocumentFragment();

    if (personas.length > 0) {
      personas.forEach((function (persona) {
        fragment.appendChild(_('div', {'className': 'persona'}, [
          _('div', {'className': 'avatar'}, [
            _('div', {'className': 'info'}, [ _('', 'Name:' + persona['persona'] + '\nProperties:' + persona['tags'].join(','))])
          ]),
          _('div', {'className': 'body'}, [ _('', persona['takeaway']) ]),

        ]));
      }).bind(this));
    } else {
      fragment.appendChild(_('div', {'style': {'margin': '1rem'}}, [_('', '(Demo Limitation: Did not retrieve any personas for this criteria.)')]));
    }

    this._panel.setContentsBlock('personas-list', fragment);
  }

  PersonasPanel.prototype._bind = function () {
    var loadBtn = _('div', { 'className': 'btn btn-primary' }, [_('', 'Simulate')]);
    var configBtn = _('div', { 'className': 'btn btn-secondary' }, [_('', 'Edit Population')]);

    loadBtn.addEventListener('click', (function () {
      this._panel.setContentsBlock('personas-list', _('div', {'style': {'margin': '1rem'}}, _makeThrobber()));

      this._contentService.getInterpretations('example').then((function (results) {
        this._renderPersonasList(results);
      }).bind(this));
    }).bind(this));

    configBtn.addEventListener('click', (function () {
      // make sure the modal is here
      this._modal.open('Configure Population for Simulation', _('div', {}, []));
    }).bind(this));

    this._personasToolbar = this._panel.setContentsBlock('personas-toolbar', _('div', { 'className': 'btn-group' }, [loadBtn, configBtn]));
    this._personasArea = this._panel.setContentsBlock('personas-list', []);

    this._panel.setContentStyle('personas-toolbar', ['personas-toolbar']);
    this._panel.setContentStyle('personas-list', ['personas-list']);
  };


  function KeyPointChecklistItem (name, labelText) {
    this._dom = _('div', {'className': 'form-group'});
    this._label = _('label', {'for': name}, [_('', labelText)]);
    this._checkbox = _('input', {'type': 'checkbox', 'id': name, 'checked': 'checked'});

    this._bind();
  }

  KeyPointChecklistItem.prototype._bind = function () {
    this._dom.appendChild(this._checkbox);
    this._dom.appendChild(this._label);

    this._checkbox.addEventListener('change', this._onToggle.bind(this));
  }
  KeyPointChecklistItem.prototype._onToggle = function () {
    // this has been toggled!
    if (this._checkbox.checked) {

    } else {

    }
  }

  KeyPointChecklistItem.prototype.value = function () {
    return this._checkbox.checked ? true : false; // forces conformal to boolean
  }

  KeyPointChecklistItem.prototype.setLabel = function (labelText) {
    this._label.innerText = labelText;
  }


  function KeyPointsPanel (contentService, parent) {
    this._contentService = contentService;
    this._panel = new VerticalAccordion(parent, 'KEY POINTS');

    this._keyPoints = {};

    this._bind();
  }

  KeyPointsPanel.prototype._bind = function () {
    this._panel.setContentsBlock('preamble', _('div', {}, [_('', 'The AI assistant will try to identify potentially important aspects to address.')]));

    this._renderKeyPoints([]);
  };

  KeyPointsPanel.prototype._renderKeyPoints = function (keyPoints) {
    var fragment = document.createDocumentFragment();

    keyPoints.forEach((function (keyPoint) {
      if (!(keyPoint['name'] in this._keyPoints)) {
        // create the key point
        this._keyPoints[keyPoint['name']] = new KeyPointChecklistItem('key-point-checklist-' + keyPoint['name'], keyPoint['label']);
      } else {
        // update the key point
        this._keyPoints[keyPoint['name']].setLabel(keyPoint['label']);
      }

      fragment.appendChild(this._keyPoints[keyPoint['name']]._dom);
    }).bind(this))

    // render the key points
    if (keyPoints.length > 0) {
      this._panel.setContentsBlock('', fragment);
    } else {
      this._panel.setContentsBlock('', _('div', {}, [_('', 'We did not identify any additional key points to address as part of the response.')]))
    }
  }

  KeyPointsPanel.prototype.syncKeyPoints = function (contentId, audienceConfig) {
    return this._contentService.getFocusPoints(contentId, audienceConfig).then((function (points) {
      this._renderKeyPoints(points);
    }).bind(this));
  }

  KeyPointsPanel.prototype.getSelection = function () {

  }

  function SourcesPanel (contentService, parent) {
    this._contentService = contentService;
    this._panel = new VerticalAccordion(parent, 'SOURCES');

    this._bind();
  }

  SourcesPanel.prototype._bind = function () {
    this._panel.setContentsBlock('toolbar', document.createDocumentFragment());
    this._panel.setContentsBlock('list', document.createDocumentFragment());
  }

  function ReflectionsPanel (contentService, parent) {
    this._contentService = contentService;
    this._panel = new VerticalAccordion(parent, 'REFLECTIONS');

    this._bind();
  }

  ReflectionsPanel.prototype._bind = function () {
    this._panel.setContentsBlock('', document.createDocumentFragment());
  }

  ReflectionsPanel.prototype.analyze = function (content) {

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
