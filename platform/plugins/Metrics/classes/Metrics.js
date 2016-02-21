/*jshint node:true */
/**
 * Metrics model
 * @module Metrics
 * @main Metrics
 */
var Q = require('Q');

/**
 * Static methods for the Metrics model
 * @class Metrics
 * @extends Base.Metrics
 * @static
 */
function Metrics() { return this; }

var Base_Metrics = require('Base/Metrics');
Q.mixin(Metrics, Base_Metrics);

module.exports = Metrics;