if (typeof(P) === 'undefined') {
var P = function(selector, q) {

	// Note ... current implementation IGNORES what happens before the last #
	// so for example div#foo is the same as just #foo
	
	var hasClassName = function( selector ) {
		var rclass = /[\n\t]/g;
		var className = " " + selector + " ";
		if ( (" " + this.className + " ").replace(rclass, " ").indexOf( className ) > -1 ) {
			return true;
		}

		return false;
	};
	
	var getFirstChild = function( ) {
		return this.firstChild;
	};
	
	var getNextSibling = function( ) {
		return this.nextSibling;
	};
	
	var getTagName = function( ) {
		return ('tagName' in this) ? this.tagName : undefined;
	};
	
	var filterByClassName = function(result, classes) {
		var result2 = [], passed;
		for (var k=0; k<result.length; ++k) {
			if (!('hasClassName' in result[k])) {
				result[k].hasClassName = hasClassName;
			}
			passed = true;
			for (var l=1; l<classes.length; ++l) {
				if (!result[k].hasClassName(classes[l])) {
					passed = false;
					break;
				}
			}
			if (passed) {
				result2.push(result[k]);
			}
		}
		return result2;
	}
	
	var filterByTagName = function(result, tagName) {
		var result2 = [], itsTagName;
		tagName = tagName.toLowerCase();
		for (var k=0; k<result.length; ++k) {
			if (!('getTagName' in result[k])) {
				result[k].getTagName = getTagName;
			}
			itsTagName = result[k].getTagName();
			if (itsTagName && itsTagName.toLowerCase() === tagName) {
				result2.push(result[k]);
			}
		}
		return result2;
	}
	
	var result = [], result2, result3;
	var i, j, k, l, s, g, d, child;
	if ((typeof selector === 'object') && ('getElementById' in selector)) {
		return P.extend([selector], P.fn);
	} else {
		if (typeof q === 'undefined') {
			q = P.extend([document], P.fn);
		} else if (q.length == 0) {
			return P.extend([], P.fn)
		}
		var p1 = selector.split('#');
		if (p1.length > 1) {
			var p1n = p1[p1.length-1];
			var id, elem, e = /[^a-z0-9-_]/i.exec(p1n);
			if (e) {
				id = p1n.substr(0, e.index);
				selector = p1n.substr(e.index);
			} else {
				id = p1n;
				selector = '';
			}
			for (i=0; i<q.length; ++i) {
				if (elem = q[i].getElementById(id)) {
					break;
				}
			}
			if (!elem) {
				return P.extend(result, P.fn); // so return an empty jq
			}
			result = [elem];
		} else {
			selector = selector.trim();
			if (!selector) {
				return P.extend(result, P.fn); // so return an empty jq
			}
			result = q;
			if (result.length === 1 && result[0] === document) {
				if ('getRootElement' in document) {
					result[0] = document.getRootElement();
				}
			}
			selector = ' ' + selector;
		}
		
		var findChildren, findDescendants;
		
		findChildren = false
		g = selector.split('>');
		for (i=0; i<g.length; ++i) {
			if (findChildren) {
				result2 = [];
				for (k=0; k<result.length; ++k) {
					if (!('getFirstChild' in result[k])) {
						result[k].getFirstChild = getFirstChild;
					}
					child = result[k].getFirstChild();
					while (child) {
						result2.push(child);
						if (!('getNextSibling' in child)) {
							child.getNextSibling = getNextSibling;
						}
						child = child.getNextSibling();
					}
				}
				result = result2;
				if (!result.length) //nothing is left
					return P.extend(result, P.fn); // so return an empty jq
			}
			findChildren = true;
			findDescendants = false;
			s = g[i].split(' ');
			for (j=0; j<s.length; ++j) {
				//if (!s[j].trim()) continue;
				d = s[j].split('.');
				if (findDescendants) {
					if (!d[0]) {
						d[0] = '*';
					}
					result2 = [];
					for (k=0; k<result.length; ++k) {
						if (!('getElementsByTagName' in result[k])) {
							continue;
						}
					 	result3 = result[k].getElementsByTagName(d[0]);
						for (l=0; l<result3.length; ++l) {
							result2.push(result3[l]);
						}
					}
					result = result2;
				} else {
					// we must do the tag name filter, since
					// we didn't do a search
					if (d[0]) {
						result = filterByTagName(result, d[0]);
					}
				}
				findDescendants = true;
				if (d.length <= 1) {
					continue;
				}
				result = filterByClassName(result, d);
				if (!result.length) //nothing is left
					return P.extend(result, P.fn); // so return an empty jq
			}
		}
	}

	// eliminate duplicates
	var dup;
	result2 = [];
	for (i=0; i<result.length; ++i) {
		dup = false;
		for (j=0; j<result2.length; ++j) {
			if (result[i] === result2[j]) {
				dup = true;
				break;
			}
		}
		if (!dup) {
			result2.push(result[i]);
		}
	}
	result = result2;
	
	result2 = [];
	for (i=0; i<result.length; ++i) {
		if (typeof(result[i]) !== 'function') {
			result2.push(result[i]);
		}
	}
	result = result2;
	
	return P.extend(result, P.fn).fields(true);
};
P.extend = function(a, b) {
	for (var i=1; i<arguments.length; ++i) {
		for (var k in arguments[i]) {
			a[k] = arguments[i][k];
		}
	}
	return a;
};
P.copy = function(a) {
	return P.extend(a);
};
P.fbjs = function() {
	return ('getRootElement' in document);
};
P.fn = {
	each: function(callback) {
		for (var i=0; i<this.length; ++i) {
			if (typeof callback === 'string') {
				if (! (callback in this[i])) {
					continue;
				}
				callback = this[i][callback];
			}
			if (false === callback.call(this[i], i, this[i])) {
				break;
			}
		}
		return this;
	},
	/** 
	 * Usage: P.call(callback, arg1, arg2, ...)
	 */ 
	call: function(callback) {
		var i;
		var	args = [];
		for (i=1; i<arguments.length; ++i) {
			args.push(arguments[i]);
		}
		for (i=0; i<this.length; ++i) {
			if (typeof callback === 'string') {
				if (! (callback in this[i])) {
					continue;
				}
				callback = this[i][callback];
			}
 			callback.apply(this[i], args);
		}
		return this;;
	},
	/**
	 * Enumerate properties in all the nodes of the jq
	 * and return a hash with their values.
	 * @param assign Boolean
	 *  If true, assigns all the function fields to the jq
	 *  so they can be called directly, resulting in a call
	 *  on each one.
	 */
	fields: function(assign) {
		var result = {};
		var jq = this;
		for (var i=0; i<this.length; ++i) {
			for (var k in this[i]) {
				result[k] = this[i][k];
				if (!assign) continue;
				if (typeof this[i][k] === 'function') {
					this[k] = function(k) {
						return function() { 
							var args = [k];
							for (var i=0; i<arguments.length; ++i) {
								args.push(arguments[i]);
							}
							return this.call.apply(this, args);
						};
					}(k);
				} else {
					var uc = k.substr(0, 1).toUpperCase() + k.substr(1);
					this['get'+uc] = function(uc, k) {
						return function() {
							var target, keys, i, j, kj;
							for (i=0; i<jq.length; ++i) {
								keys = [k];
								for (j=0; j<arguments.length; ++j) {
									keys.push(arguments[j]);
								}
								target = jq[i];
								for (j=0; j<keys.length; ++j) {
									kj = keys[j];
									if (typeof kj !== 'string') {
										throw 'all arguments must be strings';
									}
									if (! (kj in target)) {
										continue;
									}
									target = target[kj];
								}
								return target;
							}
							return undefined;
						};
					}(uc, k);
					this['set'+uc] = function(uc, k) {
						return function() {
							var target, keys, i, j, kj;
							if (arguments.length == 0) {
								throw 'must supply at least one argument';
							}
							for (i=0; i<jq.length; ++i) {
								if (typeof arguments[0] == 'object') {
									for (var k2 in arguments[0]) {
										jq[i][k][k2] = arguments[0][k2];
									}
									continue;
								}
								keys = [k];
								for (j=0; j<arguments.length-1; ++j) {
									keys.push(arguments[j]);
								}
								target = jq[i];
								for (j=0; j<keys.length-1; ++j) {
									kj = keys[j];
									if (typeof kj !== 'string') {
										throw 'all arguments except the last one must be strings';
									}
									if (! (kj in target)) {
										target[kj] = {};
									}
									target = target[kj];
								}
								kj = keys[keys.length-1];
								target[kj] = arguments[arguments.length-1]; // assign
							}
							return jq;
						};
					}(uc, k);
				}
			}
		}
		return assign ? this : result;
	},
	text: function(text) {
		var setInnerText = function(text) {
			if ('textContent' in this) {
				this.textContent = text.toString();
			} else {
				this.innerText = text.toString();
			}
		};
		for (var i=0; i<this.length; ++i) {
			if (!('setInnerText' in this[i])) {
				this[i].setInnerText = setInnerText;
			}
			this[i].setInnerText(text);
		}
		return this;
	}
};

if (typeof(p) === 'undefined') {
	p = P;
}

};

if (typeof alert === 'undefined') {
	// Make a facebook-style alert, confirm, etc.
	var alert = function (text, title) {
		if (typeof title === 'undefined') title = 'Alert';
		(new Dialog(Dialog.DIALOG_POPUP)).showMessage(title, text.toString());
	}
}
