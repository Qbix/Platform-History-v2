/*jshint node:true */
/**
 * Places model
 * @module Places
 * @main Places
 */
var Q = require('Q');
var Base_Places = require('Base/Places');

/**
 * Static methods for the Places model
 * @class Places
 * @extends Base.Places
 * @static
 */
function Places() { return this; }
Q.mixin(Places, Base_Places);

/*
 * This is where you would place all the static methods for the models,
 * the ones that don't strongly pertain to a particular row or table.
 * Just assign them as methods of the Places object.
 * If file 'Places.js.inc' exists, its content is included
 * * * */

/* * * */