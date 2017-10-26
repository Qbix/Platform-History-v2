(function (Q, $, window, document, undefined) {

var Users = Q.Users;
var Streams = Q.Streams;
var Websites = Q.Websites;

/**
 * @module Websites-tools
 */

/**
 * Tool for people to manage advertising campaigns
 * @method Websites advert campaign
 */

Q.Tool.define("Websites/advert/campaign", ['Streams/preview'],

function (options, preview) {
	var tool = this;
	var state = tool.state;
	
	tool.preview = preview;
	preview.state.onRefresh.add(tool.refresh.bind(this));
	$(tool.element).on(Q.Pointer.fastclick, function () {
		Q.handle(tool.state.onInvoke, tool, [preview]);
	});
},

{

},

{
	refresh: function (stream, callback) {
		
		var tool = this;
		var state = tool.state;
		var ps = tool.preview.state;
		var sf = stream.fields;
		var _fill = {
			creative: function () {
				tool.$creative.empty();
				Websites.advert.creatives(sf.publisherId, function (err) {
					if (err) return;
					Q.each(this.streams, function () {
						$('<option />', {value: this.fields.name})
						.text(this.fields.title).appendTo(tool.$creative);
					});
					p.fill('creative')();
				});
			}
		}
		
		var fields = [
			'creative', 'language', 'startTime', 'endTime', 
			'location', 'interest', 'budget', 'state'
		];
		
		Q.Template.render('Websites/advert/campaign',
		function (err, html) {
			if (err) return;
			tool.element.innerHTML = html;
			Q.each(fields, function (i, field) {
				tool['$'+field] = tool.$('.Websites_advert_campaign_' + field);	
			});
			
			var p = new Q.pipe(['creative'], function () {
				Q.handle(callback, tool);
			});
			
			Q.addStylesheet([
				'{{Q}}/pickadate/themes/default.css',
				'{{Q}}/pickadate/themes/default.date.css'
			]);
			Q.addScript([
				'{{Q}}/pickadate/picker.js',
				'{{Q}}/pickadate/picker.date.js'
			], function () {
				tool.$startTime.pickadate({
					min: new Date(),
					onSet: function () {
						var date = this.get('value');
						tool.$startTime.pickatime(function () {
						
						});
					}
				});
			});
			
			tool.$state.plugin('Q/clickable').click(function () {
				
			});
			
			_fill.creative();
			
			Streams.Stream.onRelatedTo(sf.publisherId, 'Websites/advert/creatives')
			.set(function () {
				_fill.creative();
			});
		});
	}
}

);

Q.Template.set("Websites/advert/campaign",
	"<select class='Websites_advert_campaign_creative'></select>"
	+ "<select class='Websites_advert_campaign_language'>"
	+   "<option value='en' selected='selected'>English</option>"
	+ "</select>"
	+ "<input type='datetime' class='Websites_advert_campaign_startTime'>"
	+ "<input type='datetime' class='Websites_advert_campaign_endTime'>"
	+ "<input class='Websites_advert_campaign_location'>"
	+ "<button class='Websites_advert_campaign_interest'>Interest</button>"
	+ "<input class='Websites_advert_campaign_budget'>"
	+ "<button class='Websites_advert_campaign_state Q_button'>Start</button>"
);

})(Q, jQuery, window, document);