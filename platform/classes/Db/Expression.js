/**
 * @module Db
 */
/**
 * The representation of expression to use inqueries
 * @class Expression
 * @namespace Db
 * @constructor
 * @param {Db.Expression|String} chain1 Pass as many arguments as you want, and they will be concatenated together
 *  with spaces in between them. Db.Expression objects will be enclosed in parentheses before being concatenated.
 */
function Expression(chain, chain2) {
	var j, k, str;
	this.expression = '';
	this.typename = "Db.Expression";
	this.parameters = {};
	var pieces = [];
	for (j = 0; j < arguments.length; ++j) {
		var arg = arguments[j];
		if (arg === null || arg === undefined) {
			pieces.push("NULL"); 
		} else if (typeof arg === 'number') {
			pieces.push(arg.toString());
		} else if (typeof arg === 'string') {
			pieces.push(arg);
		} else if (typeof arg === 'object') {
			var expr_list = [];
			for (var expr in arg) {
				var value = arg[expr];
				if (value.typename === "Db.Expression") {
					str = value.toString();
					if (typeof value.parameters === 'object') {
						for (k in value.parameters) {
							this.parameters[k] = value[k];
						}
					}
				} else {
					str = ":_dbExpr_"+i;
					this.parameters["_dbExpr_"+i] = value;
				}
				if (/\W/.test(expr.slice(-1))) {
					expr_list.push("(" + expr + str + ")");
				} else {
					expr_list.push("(" + expr + '=' + str + ")");
				}
				++ i;
			}
			pieces.push('(' + expr_list.join(' AND ') + ')');
		} else if (arg.typename === "Db.Expression") {
			pieces.push('"' + arg + '"');
			if (typeof arg.parameters === 'object') {
				for (k in arg.parameters) {
					this.parameters[k] = arg[k];
				}
			}
		}
	}
	this.expression = pieces.join(' ');
}

/**
 * Convert expression to string
 * @method valueOf
 * @return {string}
 */
Expression.prototype.valueOf = Expression.prototype.toString = function () {
	return this.expression;
};

module.exports = Expression;