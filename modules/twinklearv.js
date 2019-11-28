// <nowiki>


(function($) {


/*
 ****************************************
 *** twinklearv.js: ARV module
 ****************************************
 * Mode of invocation:     Tab ("ARV")
 * Active on:              Any page with relevant user name (userspace, contribs, etc.)
 * Config directives in:   TwinkleConfig
 */

TwinkleGlobal.arv = function twinklearv() {
	var username = mw.config.get('wgRelevantUserName');
	if (!username || username === mw.config.get('wgUserName')) {
		return;
	}

	var disabledWikis = $.map(TwinkleGlobal.getPref('arvDisabledWikis'), function(el) {
		return el.value.trim();
	});
	if (disabledWikis.indexOf(mw.config.get('wgDBname')) !== -1) {
		return;
	}

	var title = mw.util.isIPAddress(username) ? 'Report IP to administrators' : 'Report user to administrators';

	TwinkleGlobal.addPortletLink(function() {
		TwinkleGlobal.arv.callback(username);
	}, 'ARV', 'twg-arv', title);
};

TwinkleGlobal.arv.callback = function (uid) {
	var Window = new MorebitsGlobal.simpleWindow(600, 500);
	Window.setTitle('Advance Reporting and Vetting'); // Backronym
	Window.setScriptName('Twinkle');
	if (mw.util.isIPAddress(uid)) {
		Window.addFooterLink('Global blocks', 'm:Global blocks');
	} else {
		Window.addFooterLink('Global locks', 'm:Global locks');
	}

	var form = new MorebitsGlobal.quickForm(TwinkleGlobal.arv.callback.evaluate);
	var categories = form.append({
		type: 'select',
		name: 'category',
		label: 'Select report type: ',
		event: TwinkleGlobal.arv.callback.changeCategory
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

TwinkleGlobal.arv.callback.changeCategory = function (e) {
	var value = e.target.value;
	var root = e.target.form;
	var old_area = MorebitsGlobal.quickForm.getElements(root, 'work_area')[0];
	var work_area = null;
	var username = mw.config.get('wgRelevantUserName');

	switch (value) {
		case 'global':
		/* falls through */
		default:
			work_area = new MorebitsGlobal.quickForm.element({
				type: 'field',
				label: mw.util.isIPAddress(username)
					? 'Request for global block' : 'Request for global lock',
				name: 'work_area'
			});
			if (mw.util.isIPAddress(username)) {
				work_area.append({
					type: 'input',
					name: 'header',
					label: 'Header: Global block for ',
					value: '[[Special:Contributions/' + username + '|' + username + ']]',
					size: 50
				});
				work_area.append({
					type: 'dyninput',
					name: 'username',
					label: 'IPs',
					sublabel: 'IP: ',
					tooltip: 'Without the User:-prefix',
					min: 1
				});
			} else {
				work_area.append({
					type: 'input',
					name: 'header',
					label: 'Header: Global lock for ',
					value: '[[User:' + username + '|' + username + ']]',
					size: 50
				});
				work_area.append({
					type: 'dyninput',
					name: 'username',
					label: 'Usernames',
					sublabel: 'Username: ',
					tooltip: 'Without the User:-prefix',
					min: 1
				});
				work_area.append({
					type: 'checkbox',
					list: [
						{
							label: 'Hide username',
							tooltip: 'Check it if you do not want the name to be visible on this page',
							name: 'hidename',
							value: 'hidename',
							event: TwinkleGlobal.arv.callback.changeHidename
						}
					]
				});
			}
			work_area.append({
				type: 'header',
				label: 'Comment: '
			});
			work_area.append({
				type: 'checkbox',
				name: 'globaltype',
				list: [
					{
						label: 'Long-term abuse',
						value: 'Long-term abuse'
					},
					{
						label: 'Cross-wiki abuse',
						value: 'Cross-wiki abuse'
					},
					{
						label: 'Abusive username',
						value: 'Abusive username'
					}
				].concat(TwinkleGlobal.getPref('customSRGReasonList'))
			});
			work_area.append({
				type: 'textarea',
				name: 'reason'
			});
			work_area = work_area.render();
			$('input:text[name=username]', work_area).first().val(username);
			old_area.parentNode.replaceChild(work_area, old_area);
			break;
	}
};

TwinkleGlobal.arv.callback.changeHidename = function(e) {
	var checked = e.target.checked;
	var form = e.target.form;
	var username = mw.config.get('wgRelevantUserName');

	if (checked) {
		form.header.value = '';
	} else {
		form.header.value = '[[User:' + username + '|' + username + ']]';
	}
};

TwinkleGlobal.arv.callback.evaluate = function(e) {
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

			var usernames = $.map($('input:text[name=username]', form), function(o) {
				return $(o).val() || null;
			});

			if (!usernames.length) {
				alert('You must specify at least one ' + mw.util.isIPAddress(uid) ? 'IP' : 'user');
				return;
			}

			if (mw.util.isIPAddress(uid)) {
				header = '=== Global block ';
				if (form.header.value.trim()) {
					header += 'for ' + form.header.value.trim();
				}
				header += ' ===\n';
				header += '{{Status}}\n';
				usernames.forEach(function(v) {
					header += '* {{Luxotool|' + v + '}}\n';
				});
				summary = 'Reporting [[Special:Contributions/' + uid + '|' + uid + ']]';
				if (usernames.length > 1) {
					summary += ' and ' + (usernames.length - 1) + ' other IP';
					if (usernames.length > 2) {
						summary += 's';
					}
				}
			} else {
				header = '=== Global lock ';
				if (form.header.value.trim()) {
					header += 'for ' + form.header.value.trim();
				}
				header += ' ===\n';
				if (form.hidename && form.hidename.checked) {
					summary = 'Reporting ' + (usernames.length > 1 ? usernames.length + ' accounts' : 'an account');
				} else {
					summary = 'Reporting [[Special:CentralAuth/' + uid + '|' + uid + ']]';
					if (usernames.length > 1) {
						summary += ' and ' + (usernames.length - 1) + ' other account';
						if (usernames.length > 2) {
							summary += 's';
						}
					}
				}
				header += '{{Status}}\n';
				if (usernames.length === 1) {
					header += '*{{LockHide|' + uid;
					if (form.hidename && form.hidename.checked) {
						header += '|hidename=1';
					}
					header += '}}\n';
				} else {
					header += '*{{MultiLock|';
					header += usernames.join('|');
					if (form.hidename && form.hidename.checked) {
						header += '|hidename=1';
					}
					header += '}}\n';
				}
			}

			types = types.map(function(v) {
				switch (v) {
					default:
						return v;
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

			MorebitsGlobal.simpleWindow.setButtonsEnabled(false);
			MorebitsGlobal.status.init(form);

			var statusIndicator = new MorebitsGlobal.status('Reporting to Steward requests/Global', 'Fetching page...');

			var metaapi = TwinkleGlobal.getPref('metaApi');
			metaapi.edit('Steward requests/Global', function(revision) {
				var text = revision.content;
				if (new RegExp('{{\\s*([Ll]uxotool|[Ll]ock[Hh]ide|[Ll][Hh]|[Mm]ulti[Ll]ock).*?\\|\\s*(\\d+\\s*=\\s*)?' + RegExp.escape(uid, true) + '\\s*(\\||}})').test(text)) {
					statusIndicator.error('Report already present, will not add a new one');
					MorebitsGlobal.status.printUserText(header + reason, 'The comments you typed are provided below, in case you wish to manually post them under the existing report for this user at SRG:');
					return $.Deferred().reject('dup');
				}
				if (mw.util.isIPAddress(uid)) {
					text = text.replace(/\n+(== Requests for global \(un\)lock and \(un\)hiding == *\n)/, '\n\n' + header + reason + '\n\n$1');
				} else {
					text = text.replace(/\n+(== See also == *\n)/, '\n\n' + header + reason + '\n\n$1');
				}
				return {
					text: text,
					summary: summary + TwinkleGlobal.getPref('summaryAd'),
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
