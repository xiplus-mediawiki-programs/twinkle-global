// <nowiki>


(function($) {


/*
 ****************************************
 *** twinklearv.js: ARV module
 ****************************************
 * Mode of invocation:     Tab ("ARV")
 * Active on:              Existing and non-existing user pages, user talk pages, contributions pages
 * Config directives in:   TwinkleConfig
 */

Twinkle.arv = function twinklearv() {
	var username = mw.config.get('wgRelevantUserName');
	if (!username || username === mw.config.get('wgUserName')) {
		return;
	}

	var title = mw.util.isIPAddress(username) ? 'Report IP to administrators' : 'Report user to administrators';

	Twinkle.addPortletLink(function() {
		Twinkle.arv.callback(username);
	}, 'ARV', 'tw-arv', title);
};

Twinkle.arv.callback = function (uid) {
	var Window = new Morebits.simpleWindow(600, 500);
	Window.setTitle('Advance Reporting and Vetting'); // Backronym
	Window.setScriptName('Twinkle');
	if (mw.util.isIPAddress(uid)) {
		Window.addFooterLink('Global blocks', 'm:Global blocks');
	} else {
		Window.addFooterLink('Global locks', 'm:Global locks');
	}

	var form = new Morebits.quickForm(Twinkle.arv.callback.evaluate);
	var categories = form.append({
		type: 'select',
		name: 'category',
		label: 'Select report type: ',
		event: Twinkle.arv.callback.changeCategory
	});
	categories.append({
		type: 'option',
		label: mw.util.isIPAddress(uid) ? 'Global block (m:SRG)' : 'Global lock (m:SRG)',
		value: 'global'
	});
	form.append({
		type: 'field',
		label: 'Work area',
		name: 'work_area'
	});
	form.append({ type: 'submit' });
	form.append({
		type: 'hidden',
		name: 'uid',
		value: uid
	});

	var result = form.render();
	Window.setContent(result);
	Window.display();

	// We must init the
	var evt = document.createEvent('Event');
	evt.initEvent('change', true, true);
	result.category.dispatchEvent(evt);
};

Twinkle.arv.callback.changeCategory = function (e) {
	var value = e.target.value;
	var root = e.target.form;
	var old_area = Morebits.quickForm.getElements(root, 'work_area')[0];
	var work_area = null;

	switch (value) {
		case 'global':
		/* falls through */
		default:
			work_area = new Morebits.quickForm.element({
				type: 'field',
				label: mw.util.isIPAddress(mw.config.get('wgRelevantUserName'))
					? 'Request for global block' : 'Request for global lock',
				name: 'work_area'
			});
			work_area.append({
				type: 'checkbox',
				name: 'globaltype',
				list: [
					{
						label: 'Long-term abuse',
						value: 'lta'
					},
					{
						label: 'Cross-wiki abuse',
						value: 'xwiki'
					}
				]
			});
			if (!mw.util.isIPAddress(mw.config.get('wgRelevantUserName'))) {
				work_area.append({
					type: 'checkbox',
					list: [
						{
							label: 'Hide username',
							tooltip: 'Check it if you do not want the name to be visible on this page',
							name: 'hidename',
							value: 'hidename'
						}
					]
				});
			}
			work_area.append({
				type: 'textarea',
				name: 'reason',
				label: 'Comment: '
			});
			work_area = work_area.render();
			old_area.parentNode.replaceChild(work_area, old_area);
			break;
	}
};

Twinkle.arv.callback.evaluate = function(e) {
	var form = e.target;
	var reason = '';
	var comment = '';
	if (form.reason) {
		comment = form.reason.value;
	}
	var uid = form.uid.value;

	var types, header, summary;
	switch (form.category.value) {

		// Report user for vandalism
		case 'global':
			/* falls through */
		default:
			types = form.getChecked('globaltype');
			if (!types.length && comment === '') {
				alert('You must specify some reason');
				return;
			}

			if (mw.util.isIPAddress(mw.config.get('wgRelevantUserName'))) {
				header = '=== Global block for [[Special:Contributions/' + uid + '|' + uid + ']] ===\n';
				header += '{{Status}}\n';
				header += '* {{Luxotool|' + uid + '}}\n';
				summary = 'Report [[Special:Contributions/' + uid + '|' + uid + ']]';
			} else {
				if (form.hidename && form.hidename.checked) {
					header = '=== Global lock ===\n';
					summary = 'Report an account';
				} else {
					header = '=== Global lock for [[User:' + uid + '|' + uid + ']] ===\n';
					summary = 'Report [[Special:Contributions/' + uid + '|' + uid + ']]';
				}
				header += '{{Status}}\n';
				header += '*{{LockHide|' + uid;
				if (form.hidename && form.hidename.checked) {
					header += '|hidename=1';
				}
				header += '}}\n';
			}

			types = types.map(function(v) {
				switch (v) {
					case 'lta':
						return 'Long-term abuse';
					case 'xwiki':
						return 'Cross-wiki abuse';
					default:
						return '';
				}
			}).join('. ');

			reason += ':';
			if (types) {
				reason += types;
			}
			if (comment !== '') {
				comment = comment.replace(/\r?\n/g, '\n:');  // indent newlines
				reason += (types ? '. ' : '') + comment;
			}
			reason = reason.trim();
			if (reason.search(/[.?!;]$/) === -1) {
				reason += '.';
			}
			reason += ' --~~~~';

			Morebits.simpleWindow.setButtonsEnabled(false);
			Morebits.status.init(form);

			var statusIndicator = new Morebits.status('Reporting to Steward requests/Global', 'Fetching page...');

			var metaapi = Twinkle.getPref('metaApi');
			metaapi.edit('Steward requests/Global', function(revision) {
				var text = revision.content;
				if (new RegExp('{{\\s*([Ll]uxotool|[Ll]ock[Hh]ide|[Ll][Hh])\\s*\\|\\s*(1=)?\\s*' + RegExp.escape(uid, true) + '\\s*(\\||}})').test(text)) {
					statusIndicator.error('Report already present, will not add a new one');
					Morebits.status.printUserText(reason, 'The comments you typed are provided below, in case you wish to manually post them under the existing report for this user at SRG:');
					return $.Deferred().reject('dup');
				}
				if (mw.util.isIPAddress(mw.config.get('wgRelevantUserName'))) {
					text = text.replace(/\n+(== Requests for global \(un\)lock and \(un\)hiding == *\n)/, '\n\n' + header + reason + '\n$1');
				} else {
					text = text.replace(/\n+(== See also == *\n)/, '\n\n' + header + reason + '\n$1');
				}
				return {
					text: text,
					summary: summary,
					assert: 'user'
				};
			}).then(function() {
				statusIndicator.info('Done');
			}, function(e) {
				if (e === 'dup') {
					// pass
				} else {
					statusIndicator.error(e);
				}
			});
			break;
	}
};

})(jQuery);


// </nowiki>
