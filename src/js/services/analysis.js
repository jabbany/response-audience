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




  function ApiService() {

  }

  ApiService.prototype._requestEndpoint = function (endpoint) {
    // This is just a mock fetch
    return fetch('res/').then(function (resp) {
      return resp.json();
    }).then(function (data) {
      return data;
    });
  };

  ApiService.prototype.getContent = function (contentId) {
    return this._requestEndpoint('')
  };

  ApiService.prototype.getFacts = function (contentId) {

  };

  ApiService.prototype.getInterpretations = function (contentId, audience) {

  };

  ApiService.prototype.getFocusPoints = function (contentId, audience) {

  };

  ApiService.prototype.getSources = function (contentId, audience) {

  };

  exports.ApiService = ApiService;
}));
