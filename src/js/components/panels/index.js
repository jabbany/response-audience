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
    console.log(content);
    this._panel.setContentStyle('', ['sns-post', content._type]);

    var fragment = document.createDocumentFragment();

    fragment.appendChild(_('div', {'className': 'post-author showable'}, [
      _('div', {'className': 'avatar'}),
      _('div', {'className': 'name'}, [
        _('strong', {}, [ _('', content.getAuthorInfo().name) ]),
        _('', ' (@' + content.getAuthorInfo().handle + ')')
      ]),
    ]));

    fragment.appendChild(_('div', {'className': 'post-body showable'}, [
      _('', content.getBody())
    ]));

    if (content.getAttachments().length > 0) {

        fragment.appendChild(_('div', {'className': 'post-attachments showable'},
          content.getAttachments().map(function (attachment) {
            return _('div', {
              'className': 'image',
              'style': {
                'backgroundImage': 'url(' + attachment.url + ')'
              },
              'x-attachment-url': attachment.url
            }, [], function (attachment) {
              attachment.addEventListener('click', function (e) {
                var url = e.target.getAttribute('x-attachment-url');
                modal.open('Image Preview', _('img', {'src': url}));
              });
            });
          })));
    }

    this._panel.setContentsBlock('', fragment);
  };

  ContentPanel.prototype.showContent = function (id) {
    this._panel.setContentsBlock('', _makeThrobber());

    return this._contentService.getContent(id).then((function (content) {
        this._renderContent(content);
        return content;
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
    this._value = (typeof defaultValue !== 'undefined' ?
      defaultValue : options[Math.floor(Math.random() * options.length)]);

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
      'gender': {
        'preamble': 'Gender identity: ',
        'selector': new PropertySelector(['man', 'woman', 'non-binary']),
        'suffix': ''
      },
      'political': {
        'preamble': 'Political affiliation: ',
        'selector': new PropertySelector(['republican', 'democrat', 'independent']),
        'suffix': ''
      },
      'ethnicity': {
        'preamble': 'Ethnicity: ',
        'selector': new PropertySelector(['white', 'black', 'asian', 'mixed-race']),
        'suffix': ''
      },
      'education': {
        'preamble': 'Highest education level: ',
        'selector': new PropertySelector(['high school degree', 'college or undergraduate degree', 'graduate degree', 'doctorate degree']),
        'suffix': ''
      },
      'religion': {
        'preamble': 'Considers religion to be: ',
        'selector': new PropertySelector(['very important', 'somewhat important', 'not at all important']),
        'suffix': ''
      },
      'location': {
        'preamble': 'Lives in: ',
        'selector': new PropertySelector(['an urban', 'a rural']),
        'suffix': ' location'
      },
      'household_size': {
        'preamble': 'Household size: ',
        'selector': new PropertySelector(['1', '2', '3', '4', '5', '6', 'more than 6']),
        'suffix': ''
      },
      'home_ownership': {
        'preamble': 'Home ownership: ',
        'selector': new PropertySelector(['homeowner', 'renter']),
        'suffix': ''
      },
      'employment': {
        'preamble': 'Current employment status: ',
        'selector': new PropertySelector(['employed', 'unemployed', 'retired']),
        'suffix': ''
      }
    }
    this._audienceProperties = [];

    this._content = null;

    this._renderPropertiesList();
    this._bindSimulateButton();
  }

  AudienceConfigurationPanel.prototype._bindSimulateButton = function () {
    var fragment = document.createDocumentFragment();
    fragment.appendChild(_('p', {}, [_('', 'Select the number of samples to draw:')]));

    var simulateCounter = _('input', {'type': 'number', 'value': '4', 'min': '0', 'step': '1', 'className': 'form-control'});
    var simulateButton = _('div', {'className': 'btn btn-primary'}, [_('', 'Sample Personas')]);

    simulateButton.addEventListener('click', (function () {
      this._panel.setContentsBlock('personas-result', _makeThrobber());
      var personas = [];
      for (var i = 0; i < parseInt(simulateCounter.value, 10); i++) {
        personas.push(this.getAudienceProperties());
      }
      this._contentService.getPersonas(personas).then((function (personaProfiles) {
        this._panel.setContentsBlock('personas-result', _('p', {}, [_('', personaProfiles.length + ' personas sampled.')]));
        this._emitChangeEvent(personaProfiles);
      }).bind(this));
    }).bind(this));


    fragment.appendChild(_('div', {'className': 'input-group'}, [simulateCounter, simulateButton]));

    this._panel.setContentsBlock('trigger-simulation', fragment);
  }

  AudienceConfigurationPanel.prototype._renderPropertiesList = function () {
    var fragment = document.createDocumentFragment();

    fragment.appendChild(_('', 'Specify some properties of the intended audience: (Note: Any unspecified properties will be randomly sampled based on a representative population)\n'));

    var list = _('ul');
    var renderedProperties = [];
    this._audienceProperties.forEach((function (propertyName) {
      renderedProperties.push(propertyName);
      var item = _('li', {}, [
        _('', this._supportedProperties[propertyName].preamble),
        this._supportedProperties[propertyName].selector._dom,
        _('', this._supportedProperties[propertyName].suffix)
      ])
      list.appendChild(item);
    }).bind(this));

    // Add the final item to add properties
    var remainingProperties = [];
    for (var propertyName in this._supportedProperties) {
      if (renderedProperties.indexOf(propertyName) < 0) {
        remainingProperties.push(propertyName);
      }
    }
    if (remainingProperties.length > 0) {
      var selector = _('select', {'className': 'form-select form-sm'}, remainingProperties.map(function (propertyName, index) {
        return _('option', {'value': propertyName, 'selected': index === 0 ? 'selected' : null}, _('', propertyName));
      }));
      list.appendChild(_('li', {}, [
        _('', 'Add constraint: '),
        selector,
        _('', ' '),
        _('a', {'className': 'btn btn-primary btn-sm'}, [_('', 'Add')], (function (addbtn) {
          addbtn.addEventListener('click', (function () {
            this.addProperty(selector.value);
          }).bind(this));
        }).bind(this))
      ]));
    }

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

  AudienceConfigurationPanel.prototype.setContent = function (content) {
    this._content = content;
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
    console.log(this._audienceProperties);
    return this._audienceProperties.reduce((function (acc, propertyName) {
      acc[propertyName] = this._supportedProperties[propertyName].selector.value();
      console.log(acc);
      return acc;
    }).bind(this), {});
  };

  AudienceConfigurationPanel.prototype.addChangeListener = function (listener) {
    this._listeners.push(listener);
  };

  function PersonasPanel (contentService, parent, mode, modal) {
    this._contentService = contentService;
    this._mode = mode;
    this._panel = new VerticalAccordion(parent, 'SIMULATED ' + mode.toUpperCase(), null, true);

    this._listeners = [];
    this._modal = modal;

    this._editor = null;
    this._content = null;
    this._personas = [];
    this._concerns = [];

    this._personasArea = null;
    this._personasToolbar = null;

    this._bind();
  }

  PersonasPanel.prototype._renderPersonasList = function (personaResults) {
    var fragment = document.createDocumentFragment();

    if (personaResults.length > 0) {
      personaResults.forEach((function (result) {
        fragment.appendChild(_('div', {'className': 'persona'}, [
          _('div', {'className': 'avatar'}, [
            _('div', {'className': 'info'}, [ _('', 'Name:' + result['profile']['name'] + '\nProperties:' + JSON.stringify(result['profile']))])
          ]),
          _('div', {'className': 'body'}, [ _('', result['takeaway']) ]),

        ]));
      }).bind(this));
    } else {
      fragment.appendChild(_('div', {'style': {'margin': '1rem'}}, [_('', '(No people sampled for population)')]));
    }

    this._panel.setContentsBlock('personas-list', fragment);
  }

  PersonasPanel.prototype._bind = function () {
    var loadBtn = _('div', { 'className': 'btn btn-primary' }, [_('', 'Simulate')]);
    var configBtn = _('div', { 'className': 'btn btn-secondary' }, [_('', 'Edit Personas')]);

    loadBtn.addEventListener('click', (function () {
      this._panel.setContentsBlock('personas-list', _('div', {'style': {'margin': '1rem'}}, _makeThrobber()));

      console.log(this._content);
      if (this._mode === 'concerns') {
        this._contentService.getPersonaConcerns(this._content, this._personas).then((function (results) {
          this._emitChangeEvent(results);

          this._concerns = results.key_points.points;
          this._renderPersonasList(results.takeaways);
        }).bind(this));
      } else if (this._mode === 'reactions') {
        this._contentService.getPersonaReactions(this._content, this._response, this._concerns, this._personas).then((function (results) {
          this._emitChangeEvent(results);

          this._emitChangeEvent(results);
          this._renderPersonasList(results.reactions);
        }).bind(this));
      }
    }).bind(this));

    configBtn.addEventListener('click', (function () {
      // make sure the modal is here
      this._modal.open('Configure Population for Simulation', _('div', {}, [_('', 'This feature is not complete yet.')]));
    }).bind(this));

    this._personasToolbar = this._panel.setContentsBlock('personas-toolbar', _('div', { 'className': 'btn-group' }, [loadBtn, configBtn]));
    this._personasArea = this._panel.setContentsBlock('personas-list', _('div', {'style': {'margin': '1rem'}}, [_('', 'Please click "Simulate" to simulate some audience members.')]));

    this._panel.setContentStyle('personas-toolbar', ['personas-toolbar']);
    this._panel.setContentStyle('personas-list', ['personas-list']);
  };

  PersonasPanel.prototype._emitChangeEvent = function (properties) {
    this._listeners.forEach(function (listener) {
      try {
        listener(properties);
      } catch (e) { console.log(e); }
    })
  };

  PersonasPanel.prototype.setContent = function (content) {
    this._content = content;
  };
  PersonasPanel.prototype.setEditor = function (editor) {
    this._editor = editor;
  };
  PersonasPanel.prototype.setConcerns = function (concerns) {
    this._concerns = concerns;
  };
  PersonasPanel.prototype.setAudience = function (personas) {
    this._personas = personas;
  };
  PersonasPanel.prototype.addChangeListener = function (listener) {
    this._listeners.push(listener);
  }


  function KeyPointChecklistItem (name, labelText, referrer) {
    this._dom = _('div', {'className': 'form-group'});
    this._label = _('label', {'for': name}, [_('i', {'className': 'bi bi-file-person', 'title': 'Generated from ' + referrer}), _('', ' ' + labelText)]);
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
    this._panel = new VerticalAccordion(parent, 'AUDIENCE CONCERNS');

    this._keyPoints = {};

    this._bind();
  }

  KeyPointsPanel.prototype._bind = function () {
    this._panel.setContentsBlock('preamble', _('div', {}, [_('', 'Based on the audience, the AI has identified the following potential points of concerns members may have after viewing the original post. You might want to some or all of these concerns in your response. Use the checkboxes to indicate which ones you\'d like the AI to consider when writing a response.')]));
    this._panel.setContentStyle('preamble', ['alert-lite']);
    this._renderKeyPoints([]);
  };

  KeyPointsPanel.prototype._renderKeyPoints = function (keyPoints) {
    var fragment = document.createDocumentFragment();

    keyPoints.forEach((function (keyPoint) {
      if (!(keyPoint['name'] in this._keyPoints)) {
        // create the key point
        this._keyPoints[keyPoint['name']] = new KeyPointChecklistItem('key-point-checklist-' + keyPoint['name'], keyPoint['label'], keyPoint['refer']);
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

  KeyPointsPanel.prototype.setKeyPoints = function (keyPoints) {
    this._renderKeyPoints(keyPoints.map(function (point, i) {
      return {
        'name': 'point-' + i,
        'label': point,
        'refer': 'This concern was noted by the following people: (TBD)'
      }
    }))
  }

  KeyPointsPanel.prototype.getSelection = function () {

  }

  function SourcesPanel (contentService, parent) {
    this._contentService = contentService;
    this._panel = new VerticalAccordion(parent, 'SOURCES');

    this._sourcesList = [];

    this._bind();

    this._renderSources([]);
  }

  SourcesPanel.prototype._bind = function () {
    var fragment = document.createDocumentFragment();

    fragment.appendChild(_('div', {'className': 'input-group'}, [
      _('input', {'type': 'text', 'className': 'form-control'}),
      _('div', {'className': 'btn btn-secondary'}, [_('', 'Search')])
    ]));

    this._panel.setContentsBlock('toolbar', fragment);
  }

  SourcesPanel.prototype._renderSources = function (sources) {
    var fragment = document.createDocumentFragment();

    if (sources.length === 0) {
      fragment.appendChild(_('p', {}, [_('', 'No sources available to cite.')]))
    } else {
      sources.forEach(function (source) {
        fragment.appendChild(_('div', {'className': 'item'}, [
          _('p', {}, [_('', source.excerpt)]),
          _('a', {'href': source.url, 'target': '_blank'}, [_('', source.url)]),
          _('p', {}, [_('', source.name)])
        ]));
      });
    }

    this._panel.setContentsBlock('list', fragment);
    this._panel.setContentStyle('list', ['list']);
  }

  SourcesPanel.prototype.setSources = function (sources) {
    sources.forEach((function (source) {
      if (this._sourcesList.indexOf(source) < 0) {
        this._sourcesList.push(source);
      }
    }).bind(this))

    this._renderSources(this._sourcesList);
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
