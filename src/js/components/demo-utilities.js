'use strict';

/* This is a custom wrapper around the Quill editor */
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['exports', factory]);
  } else if (typeof exports === 'object' && typeof exports.nodeName !== 'string') {
    factory(exports);
  } else {
    factory((root.demo = {}));
  }
}(typeof self !== 'undefined' ? self : this, function (exports) {

  function Randomizer() {

  }

  Randomizer.prototype.gaussianSample = function (mean, stdev) {
    // Box-Muller transform of uniform random variables from Math.random()
    const u = 1 - Math.random(); // Converting [0,1) to (0,1]
    const v = Math.random();
    const z = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );

    // Transform to the desired mean and standard deviation:
    return z * stdev + mean;
  }

  Randomizer.prototype.rebatch = function (items, batches, variance) {

  }

  Randomizer.prototype.heuristicRebatch = function (items, likelihoods, batches, variance) {

  }


  function Animator() {

  }

  Animator.prototype.animate = function (tasks) {
    return new Promise(function () {

    });
  }

  Animator.prototype.cancel = function () {};

  exports.Randomizer = Randomizer;
  exports.Animator = Animator;
}));
