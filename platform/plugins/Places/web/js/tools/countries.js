(function (Q, $, window, document, undefined) {

var Places = Q.Places;

/**
 * Places Tools
 * @module Places-tools
 */

/**
 * Displays a way to select one or more countries
 * @class Places countries
 * @constructor
 * @param {Object} [options] used to pass options
 * @param {String} [options.flags="Q/plugins/Places/img/squareflags"] the path for the flags, or set to false to omit the flag
 * @param {String} [options.countryCode='US'] the initial country to select in the list
 * @param {Array} [options.firstCountryCodes='US','GB'] array of country codes to place first in the list
 * @param {Boolean} [options.sort] if true, sorts the countries alphabetically
 * @param {Q.Tool} [options.globe] a reference to a "Places/globe" tool to synchronize
 * @param {Q.Event} [options.onReady] this event occurs when the countries selector is ready
 * @param {Q.Event} [options.onChange=new Q.Event()] Occurs when the value has changed
 */
Q.Tool.define("Places/countries", function _Places_countries(options) {
	var tool = this;
	var state = tool.state;
	var $te = $(tool.element);
	
	state.countryCode = state.countryCode.toUpperCase();
	tool.$options = {};
	
	var position = $te.css('position');
	$te.css('position', position === 'static' ? 'relative' : position);
	
	Places.loadCountries(function () {
		if (state.flags) {
			tool.$flag = $('<img class="Places_countries_flag" />').attr({
				src: Q.url(state.flags+'/'+state.countryCode+'.png')
			}).appendTo(tool.element);
			$te.addClass('Places_countries_flags');
		}
		var $select = tool.$select = 
			$('<select class="Places_countries_select" />').appendTo($te);
		if (!state.countries) {
			state.countries = [];
			for (var i=0, l=Places.countries.length; i<l; ++i) {
				state.countries.push(Places.countries[i][1]);
			}
		}
		tool.refresh();
		$select.on('change', tool,
		Q.preventRecursion('Places/countries onchange', function () {
			var countryCode = tool.$select.val() || state.countryCode;
			if (state.globe) {
				state.globe.rotateToCountry(countryCode);
			}
			Q.handle(state.onChange, tool, [countryCode]);
			if (tool.$flag) {
				tool.$flag.attr({
					src: Q.url(state.flags+'/'+countryCode+'.png')
				});
			}
		}));
		$select.val(state.countryCode);
		$select.trigger('change');
		Q.handle(state.onReady, tool);
	});
	
	tool.Q.onStateChanged('countryCode').set(function () {
		var globe = this.state.globe;
		var countryCode = this.state.countryCode;
		this.$select.val(countryCode);
		this.$select.trigger('change');
		if (globe) {
			globe.rotateToCountry(countryCode);
		}
	}, "Places/countries");
	
	if (state.globe) {
		this.globe(state.globe);
	}
},

{ // default options here
	flags: "Q/plugins/Places/img/squareflags",
	countryCode: 'US',
	firstCountryCodes: ['US','GB'],
	globe: null,
	sort: false,
	onChange: new Q.Event(),
	onReady: new Q.Event()
},

{ // methods go here
	
	/**
	 * @setCountry
	 * @param {String} countryCode
	 */
	setCountry: Q.preventRecursion('Places/countries setCountry', function (countryCode) {
		this.state.countryCode = countryCode;
		this.stateChanged('countryCode');
	}),
	
	/**
	 * @method globe
	 * @param {Q.Tool|false} globeTool A reference to a "Places/globe" tool, or false to unlink
	 */
	globe: function (globeTool) {
		if (!globeTool) {
			this.state.globe = null;
			return;
		}
		this.state.globe = globeTool;
		var tool = this;
		globeTool.state.beforeRotateToCountry.set(function (countryCode) {
			tool.setCountry(countryCode);
		}, true);
	},
	
	/**
	 * Refreshes the list of countries, to reflect any updates
	 * @method refresh
	 */
	refresh: function () {
		this.state.onReady.add(function () {
			var tool = this;
			var state = tool.state;
			tool.$select.empty();
			var codes = {};
			Q.each(state.firstCountryCodes, function (i, countryCode) {
				var $option = $('<option />')
					.attr('value', countryCode)
					.text(Places.countriesByCode[countryCode][0])
					.appendTo(tool.$select);
				tool.$options[countryCode] = $option;
				codes[countryCode] = true;
			});
			if (state.sort) {
				state.countries.sort(function (a, b) {
					var a1 = Places.countriesByCode[a][0];
					var b1 = Places.countriesByCode[b][0];
					return a1 > b1 ? 1 : (a == b ? 0 : -1);
				});
			}
			Q.each(state.countries, function (i, countryCode) {
				var countryCode = countryCode;
				if (codes[countryCode]) return;
				var $option = $('<option />')
					.attr('value', countryCode)
					.text(Places.countriesByCode[countryCode][0])
					.appendTo(tool.$select);
				tool.$options[countryCode] = $option;
			});
		}, this);
	}
	
});

})(Q, jQuery, window, document);