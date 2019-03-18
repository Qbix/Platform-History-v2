/*jshint node:true */
/**
 * Websites plugin
 * @module Websites
 */
var Q = require('Q');

/**
 * Static methods for the Websites model
 * @class Websites
 * @extends Base.Websites
 * @static
 */
function Websites() { }
module.exports = Websites;

var Base_Websites = require('Base/Websites');
Q.mixin(Websites, Base_Websites);

/*
 * This is where you would place all the static methods for the models,
 * the ones that don't strongly pertain to a particular row or table.
 * Just assign them as methods of the Websites object.
 * If file 'Websites.js.inc' exists, its content is included
 * * * */

/* * * */