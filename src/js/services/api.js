'use strict';

/* This is a custom wrapper around the Quill editor */
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['exports', factory]);
  } else if (typeof exports === 'object' && typeof exports.nodeName !== 'string') {
    factory(exports);
  } else {
    factory((root.api = {}));
  }
}(typeof self !== 'undefined' ? self : this, function (exports) {

  function ContentData(type, rawData) {
    this._type = type;

    this._id = '';
    this._author = null;
    this._body = null;
    this._attachments = [];
    this._sources = [];

    if (typeof rawData === 'object' && rawData !== null) {
      this._parseData(type, rawData);
    }
  }

  ContentData.prototype._parseData = function (type, rawData) {
    if (type === 'tweet') {
      this._id = rawData['tweet_id'];
      this._body = rawData['tweet_text'];
      this._author = {
        'handle': rawData['user_screen_name'],
        'name': rawData['user_name'],
        'signature': rawData['user_description']
      };
      for (var i = 0; i < rawData['tweet_images'].length; i++) {
        this._attachments.push({
          'type': 'image',
          'url': rawData['tweet_images'][i],
          'description': (i < rawData['tweet_image2text'].length ? rawData['tweet_image2text'][i] : null)
        });
      }
      try {
        rawData['context_evidences'].forEach((function (source) {
          this._sources.push(this._parseSource(source))
        }).bind(this));
      } catch (e) {}
      try {
        rawData['refute_evidences'].forEach((function (source) {
          this._sources.push(this._parseSource(source))
        }).bind(this));
      } catch (e) {}
    }
  }

  ContentData.prototype._parseSource = function (sourceText) {
    if (sourceText.startsWith('- ')) {
      sourceText = sourceText.substring(2);
    }
    var snippet = sourceText.split('Reference:');
    var sourceUrl = snippet.slice(1).join(' ').split('published on');
    return {
      'excerpt': snippet[0].trim(),
      'url': sourceUrl[0].trim(),
      'name': (new URL(sourceUrl[0].trim())).hostname
    };
  }

  ContentData.prototype.getAuthorInfo = function () {
    return this._author;
  }

  ContentData.prototype.getBody = function () {
    return this._body;
  }

  ContentData.prototype.getAttachments = function () {
    return this._attachments;
  }

  ContentData.prototype.getSources = function () {
    return this._sources;
  }

  ContentData.prototype.getAttachmentsAsText = function () {
    if (this._attachments.length === 0) {
      return '';
    }
    return 'With the following ' +
      (this._attachments.length === 1 ? 'attachment' : (this._attachments.length + ' attachments')) +
      ':\n\n' +
      this._attachments.map(function (attachment) {
        return '[' + attachment['type'] + '] ' + attachment['description']
      }).join('\n\n');
  }

  ContentData.prototype.toString = function () {
    return 'User ' + this._author['name'] + ' (' + this._author['handle'] + ') posts:\n\n' +
      this._body + '\n\n' + this.getAttachmentsAsText();
  }

  function ApiService(baseUrl, baseUrlLLM, manualDelay) {
    this._baseUrlContent = baseUrl;
    this._baseUrlLLM = baseUrlLLM;
    this._delay = (typeof manualDelay === 'number') ? manualDelay : 0;
  }

  ApiService.prototype._induceDelay = function (delay) {
    // this is used to mock a delay time
    if (delay <= 0) {
      return Promise.resolve();
    }
    return new Promise(function (resolve) {
      setTimeout(resolve, delay);
    });
  }

  ApiService.prototype._requestContentEndpoint = function (endpoint) {
    var promise = this._delay > 0 ? this._induceDelay(this._delay) : Promise.resolve();
    return promise.then((function () {
      return fetch(this._baseUrlContent + '/' + endpoint);
    }).bind(this)).then(function (resp) {
      return resp.json();
    });
  };

  ApiService.prototype._requestLLMEndpoint = function (endpoint, body) {
    var promise = this._delay > 0 ? this._induceDelay(this._delay) : Promise.resolve();
    return promise.then((function () {
      return fetch(this._baseUrlLLM + '/' + endpoint, {
        'method': 'post',
        'mode': 'cors',
        'headers': {
          'content-type': 'application/json',
          'accept': 'application/json'
        },
        'body': JSON.stringify(body)
      });
    }).bind(this)).then(function (resp) {
      return resp.json();
    });
  };

  ApiService.prototype.getContent = function (contentId) {
    return this._requestContentEndpoint('data/outputs/multimodal/' + contentId + '.json').then(function (data) {
      var content = new ContentData('tweet', data);
      console.log('Loaded ' + content.toString());
      return content;
    });
  };

  ApiService.prototype.getPersonas = function (personaConstraints) {
    return this._requestLLMEndpoint('api/audience/generate', {
      'personas': personaConstraints
    }).then(function (results) {
      return results.personas;
    });
  };

  ApiService.prototype.getPersonaConcerns = function (content, personas) {
    return this._requestLLMEndpoint('api/audience/key_points', {
      'content': content.toString(),
      'personas': personas
    }).then(function (results) {
      return results;
    });;
  };

  ApiService.prototype.getPersonaRankings = function (content, sources) {
    return this._requestLLMEndpoint('api/audience/key_points', {
      'content': content.toString(),
      'sources': sources
    });
  };

  ApiService.prototype.synthesizeResponse = function (content, sources, concerns) {
    return this._requestLLMEndpoint('analysis', contentId).then(function (analysis) {
      return analysis['interpretations'];
    });
  };

  ApiService.prototype.getPersonaReactions = function (content, personas) {
    return this._requestEndpoint('analysis', contentId).then(function (analysis) {
      return analysis['focus'];
    });
  };

  ApiService.prototype.getSources = function (contentId, audience) {
    return this._requestEndpoint('sources', contentId).then(function (sources) {
      return sources;
    });
  };

  exports.ApiService = ApiService;
}));
