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
  function ApiService(baseUrl) {
    this._baseUrl = baseUrl;
  }

  ApiService.prototype._induceDelay = function (delay) {
    if (delay <= 0) {
      return Promise.resolve();
    }
    return new Promise(function (resolve) {
      setTimeout(resolve, delay);
    });
  }

  ApiService.prototype._requestEndpoint = function (endpoint, contentId) {
    // This is just a mock fetch
    return this._induceDelay(1000 * Math.random()).then((function () {
        return fetch(this._baseUrl + '/' + contentId + '.json');
      }).bind(this)).then(function (resp) {
        return resp.json();
      }).then(function (data) {
        return data[endpoint];
      });
  };

  ApiService.prototype.getContent = function (contentId) {
    return this._requestEndpoint('content', contentId);
  };

  ApiService.prototype.getFacts = function (contentId) {
    return this._requestEndpoint('analysis', contentId).then(function (analysis) {
      return analysis['facts'];
    });
  };

  ApiService.prototype.getInterpretations = function (contentId, audience) {
    return this._requestEndpoint('analysis', contentId).then(function (analysis) {
      return analysis['interpretations'];
    });
  };

  ApiService.prototype.getFocusPoints = function (contentId, audience) {
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
