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
		Q.Text.get('Websites/content', function (err, text) {
			var state = tool.state;
			var ps = tool.preview.state;
			var sf = stream.fields;
			var _fill = {
				creative: function () {
					Websites.advert.creatives(sf.publisherId, function (err) {
						if (err) return;
						tool.$creative.empty();
						Q.each(this.relatedStreams, function () {
							$('<option />', {value: this.fields.name})
							.text(this.fields.title).appendTo(tool.$creative);
						});
					});
				}
			};
			var fields = [
				'creative', 'link', 'language',
				'startDate', 'startTime', 'endDate', 'endTime', 
				'location', 'interest', 'budget', 'state'
			];
			var _notYetEnabled = 'Websites_advert_campaign_notYetEnabled';
			var placeholders = text.advert.campaign.placeholders;
		
			Q.Template.render('Websites/advert/campaign', Q.extend({
				notYetEnabled: _notYetEnabled
			}, text.advert.campaign), function (err, html) {
				if (err) return;
				Q.replace(tool.element, html);;
				Q.each(fields, function (i, field) {
					var $e = tool['$'+field] = tool.$('.Websites_advert_campaign_' + field);	
					if (placeholders[field]) {
						$e.attr('placeholder', placeholders[field]).plugin('Q/placeholders');
					}
				});
			
				var p = new Q.pipe(['creative'], function () {
					Q.handle(callback, tool);
				});
			
				Q.addStylesheet([
					'{{Q}}/pickadate/themes/default.css',
					'{{Q}}/pickadate/themes/default.date.css',
					'{{Q}}/pickadate/themes/default.time.css'
				], {slotName: 'Q'});
				Q.addScript([
					'{{Q}}/pickadate/picker.js',
					'{{Q}}/pickadate/picker.date.js',
					'{{Q}}/pickadate/picker.time.js'
				], function () {
					tool.$startDate.pickadate({
						min: new Date(),
						onSet: _onStartDate
					});
				});
			
				function _onStartDate() {
					state.startDate = this.get('value');
					tool.$startTime.removeClass(_notYetEnabled).pickatime({
						onSet: _onStartTime
					});
				}
				function _onStartTime() {
					state.startTime = this.get('value');
					tool.$endDate.removeClass(_notYetEnabled).pickadate({
						min: state.startDate,
						onSet: _onEndDate
					});
				}
				function _onEndDate() {
					state.endDate = this.get('value');
					tool.$endTime.removeClass(_notYetEnabled).pickatime({
						onSet: _onEndTime
					});
				}
				function _onEndTime() {
					state.endTime = this.get('value');
				}
				
				tool.$location.plugin('Q/clickable').click(function () {
					
				});
				
				tool.$location.plugin('Q/clickable').click(function () {
					Q.Dialogs.push({
						title: text.advert.campaign.interests.Title,
						className: 'Streams_dialog_interests',
						stylesheet: '{{Q}}/css/expandable.css',
						content: Q.Tool.setUpElement('div', 'Places/location', {
							onChoose: function (coordinates) {
								tool.$location.text(results, coordinates.latitude);
								Q.Dialogs.pop();
								return false;
							}
						})
					});
				});
				
				tool.$interest.plugin('Q/clickable').click(function () {
					Q.Dialogs.push({
						title: text.advert.campaign.interests.Title,
						className: 'Streams_dialog_interests',
						content: Q.Tool.setUpElement('div', 'Streams/interests', {
							filter: text.advert.campaign.interests.FilterInterests,
							all: text.advert.campaign.interests.AllInterests,
							onClick: function (element, normalized, category, interest, wasSelected) {
								tool.$interest.text(interest).val(normalized);
								Q.Dialogs.pop();
								return false;
							}
						})
					});
				});
			
				tool.$state.plugin('Q/clickable').click(function () {
				
				});
			
				_fill.creative();
			
				Streams.Stream.onRelatedTo(sf.publisherId, 'Websites/advert/creatives')
				.or(Streams.Stream.onUnrelatedTo(sf.publisherId, 'Websites/advert/creatives'))
				.set(_fill.creative);
			});
		});
	}
}

);

Q.Template.set("Websites/advert/campaign",
	"<select class='Websites_advert_campaign_creative'></select>"
	+ "<input type='text' class='Websites_advert_campaign_link'>"
	+ "<select class='Websites_advert_campaign_language'>"
	+   "<option value='en' selected='selected'>English</option>"
	+ "</select>"
	+ "<input type='text' class='Websites_advert_campaign_startDate'>"
	+ "<input type='text' class='Websites_advert_campaign_startTime {{notYetEnabled}}'>"
	+ "<input type='text' class='Websites_advert_campaign_endDate {{notYetEnabled}}'>"
	+ "<input type='text' class='Websites_advert_campaign_endTime {{notYetEnabled}}'>"
	+ "<button class='Websites_advert_campaign_location Q_button'>{{Location}}</button>"
	+ "<button class='Websites_advert_campaign_interest Q_button'>{{Interest}}</button>"
	+ "<input type='number' class='Websites_advert_campaign_budget'>"
	+ "<button class='Websites_advert_campaign_state Q_button'>Start</button>"
);

})(Q, Q.$, window, document);