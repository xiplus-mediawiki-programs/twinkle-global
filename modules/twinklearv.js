// <nowiki>


(function($) {


/*
 ****************************************
 *** twinklearv.js: ARV module
 ****************************************
 * Mode of invocation:     Tab ("GARV")
 * Active on:              Any page with relevant user name (userspace, contribs, etc.)
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

	var title = mw.util.isIPAddress(username) ? 'Report IP to stewards' : 'Report user to stewards';

	TwinkleGlobal.addPortletLink(function() {
		TwinkleGlobal.arv.callback(username);
	}, 'GARV', 'twg-arv', title);
};

TwinkleGlobal.arv.callback = function (uid) {
	var Window = new MorebitsGlobal.simpleWindow(600, 500);
	Window.setTitle('Advance Reporting and Vetting'); // Backronym
	Window.setScriptName('Twinkle');
	Window.addFooterLink('Add custom reason', TwinkleGlobal.getPref('configPage'));
	Window.addFooterLink('Suggest useful reasons', TwinkleGlobal.getPref('bugReportLink'));
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
	categories.append({
		type: 'option',
		label: 'Checkuser (m:SRCU)',
		value: 'srcu'
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
					},
					{
						label: 'Spam / spambot',
						value: 'Spam / spambot'
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

		case 'srcu':
			work_area = new MorebitsGlobal.quickForm.element({
				type: 'field',
				label: 'Request for checkuser',
				name: 'work_area'
			});
			work_area.append({
				type: 'header',
				label: 'Basic information'
			});
			work_area.append({
				type: 'input',
				name: 'target',
				label: 'Target: ',
				value: username,
				size: 30,
				tooltip: 'Modify if you want to claim your target as someone (usually an LTA)'
			});
			work_area.append({
				type: 'select',
				name: 'project',
				label: 'Project: ',
				event: TwinkleGlobal.arv.callback.changeProject,
				list: [
					{ label: 'Wikipedia', value: 'w' },
					{ label: 'Wikibooks', value: 'b' },
					{ label: 'Wikiquote', value: 'q' },
					{ label: 'Wiktionary', value: 'wikt' },
					{ label: 'Wikinews', value: 'n' },
					{ label: 'Wikisource', value: 's' },
					{ label: 'Wikiversity', value: 'v' },
					{ label: 'Wikivoyage', value: 'voy' },
					{ label: 'Mediawiki.org', value: 'mw' },
					{ label: 'Incubator', value: 'incubator' }
				]
			});
			work_area.append({
				type: 'input',
				name: 'langcode',
				label: 'Language Code: ',
				size: 20
			});
			work_area.append({
				type: 'input',
				name: 'main_uid',
				label: 'User to check: ',
				readonly: true,
				value: username,
				tooltip: 'Decided by the page where you are'
			});
			work_area.append(
				{
					type: 'dyninput',
					name: 'sockpuppet',
					label: 'Users to compare',
					sublabel: 'Username :',
					tooltip: 'Usernames of suspected sockpuppet WITHOUT "User:"',
					min: 1,
					max: 9
				});
			work_area.append({
				type: 'header',
				label: 'Local confirmation or policy'
			});
			work_area.append({
				type: 'input',
				name: 'discussion',
				label: 'Link: ',
				tooltip: 'Be sure it is WITH brackets'
			});
			work_area.append({
				type: 'textarea',
				name: 'reason',
				label: 'Reason',
				tooltip: 'will add --~~~~'
			});
			work_area.append({
				type: 'header',
				label: 'Due to the impact of checkuser, please confirm you really want to request this checkuser and click the box below.'
			});
			work_area.append({
				type: 'checkbox',
				list: [
					{
						label: 'I confirm this request is beneficial for the community and I will take full responsibility for this quest.',
						name: 'disclaimer',
						value: 'disclaimer'
					}
				]
			});
			work_area = work_area.render();
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

TwinkleGlobal.arv.callback.changeProject = function(e) {
	var project = e.target.value;
	var langcode = e.target.form.langcode;
	if (project === 'mw' || project === 'incubator' || project === 'd') {
		MorebitsGlobal.quickForm.setElementVisibility(langcode.parentNode, false);
	} else {
		MorebitsGlobal.quickForm.setElementVisibility(langcode.parentNode, true);
	}

};

TwinkleGlobal.arv.callback.evaluate = function(e) {

	var form = e.target;
	var trust = form.disclaimer.checked;
	if (!trust) {
		alert('You should check the box after reading the text or you can not request');
		return;
	}
	var header;
	var summary;
	var uid = form.uid.value;
	var reason;
	var statusIndicator;
	var metaapi;
	switch (form.category.value) {
		// Report user for vandalism
		case 'srcu':
			reason = form.reason.value;
			var target = form.target.value;
			var langcode = form.langcode.value;
			var project = form.project.value;


			if (reason === '') {
				alert('You must provide the reason to run this check');
				return;
			}

			if (langcode === '' && project !== 'mw' && project !== 'd' && project !== 'incubator') {
				alert('You must specific a language code');
				return;
			}
			var sockpuppets = $.map($('input:text[name=sockpuppet]', form), function (o) {
				return $(o).val() || null;
			});

			if (!sockpuppets.length) {
				alert('You must specify at least one user to compare');
				return;
			}

			// build section title
			header = '=== ';
			header += target;
			header += '@';
			// build template
			var template = '\n{{CU request\n' +
				' |status          = \n' +
				' |language code   = ';
			var isThirdParam = true;
			switch (project) {
				case 'mw':
					header += 'mediawiki.org ===';
					template += project;
					isThirdParam = false;
					break;
				case 'incubator':
					header += 'incubator.wikimedia.org ===';
					template += project;
					isThirdParam = false;
					break;
				case 'd':
					header += 'wikidata.org ===';
					template += project;
					isThirdParam = false;
					break;
				case 'w':
					header += langcode + '.wikipedia ===';
					break;
				case 'b':
					header += langcode + '.wikibooks ===';
					break;
				case 'q':
					header += langcode + '.wikiquote ===';
					break;
				case 'wikt':
					header += langcode + '.wiktionary ===';
					break;
				case 'n':
					header += langcode + '.wikinews ===';
					break;
				case 's':
					header += langcode + '.wikisource ===';
					break;
				case 'v':
					header += langcode + '.wikiversity ===';
					break;
				case 'voy':
				/* falls through */
				default:
					header += langcode + '.wikivoyage ===';
					break;
			}
			if (isThirdParam) {
				template += langcode + '\n' +
					' |project shortcut = ' + project;
			}

			// section title built

			template += '\n' +
				' |user name1      = ' + uid + '\n' +
				sockpuppets.map(function(v, i) {
					return ' |user name' + (i + 2) + '      = ' + v;
				}).join('\n');

			if (form.discussion) {
				template += '\n' +
					' |discussion      = ' + form.discussion.value;
			} else {
				template += '\n' +
					' |discussion      = ';
			}

			template += '\n' +
				' |reason          = ' + reason + ' --~~~~\n' +
				'}}';
			// template built

			if (uid === target) {
				summary = 'Requesting checkuser on [[Special:CentralAuth/' + uid + '|' + uid + ']]' + ' related accounts';
			} else {
				summary = 'Requesting checkuser on ' + target + ' with accounts like [[Special:CentralAuth/' + uid + '|' + uid + ']]';
			}
			// edit summary built

			MorebitsGlobal.simpleWindow.setButtonsEnabled(false);
			MorebitsGlobal.status.init(form);

			statusIndicator = new MorebitsGlobal.status('Reporting to Steward requests/Checkuser', 'Fetching page...');

			metaapi = TwinkleGlobal.getPref('metaApi');
			metaapi.edit('User:Hamish/SRCU', function(revision) {
				var text = revision.content;
				var allUsers = [uid];
				sockpuppets.map(function (v, i) {
					return allUsers[i + 1] = v;
				});

				var dup = false;
				allUsers.map(function (v) {
					if (new RegExp('\\s*\\|user name([0-9]|10)(\\s*=\\s*)' + RegExp.escape(v, true) + '\\s').test(text)) {
						dup = true;
					}
				});
				if (dup) {
					statusIndicator.error('Request on at least one of the users you request already present, will not add a new one');
					var $srgLink = '<a target="_blank" href="/wiki/m:SRCU">m:SRCU</a>';
					MorebitsGlobal.status.printUserText(header + template, 'The comments you typed are provided below, in case you wish to manually post them under the existing report for this user at ' + $srgLink + ':');
					return $.Deferred().reject('dup');
				}

				text = text.replace(/(== See also == <!-- DO NOT EDIT UNDER THIS LINE -->)/, header + template + '\n\n$1');
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


		case 'global':
		/* falls through */
		default:
			reason = '';
			var comment = '';
			if (form.reason) {
				comment = form.reason.value;
			}

			var types;
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
					if (usernames.length > TwinkleGlobal.getPref('srgCollapseNumber')) {
						header += '{{Collapse top|User list}}\n';
					}
					header += '*{{MultiLock|';
					header += usernames.join('|');
					if (form.hidename && form.hidename.checked) {
						header += '|hidename=1';
					}
					header += '}}\n';
					if (usernames.length > TwinkleGlobal.getPref('srgCollapseNumber')) {
						header += '{{Collapse bottom}}\n';
					}
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

			statusIndicator = new MorebitsGlobal.status('Reporting to Steward requests/Global', 'Fetching page...');

			metaapi = TwinkleGlobal.getPref('metaApi');
			metaapi.edit('Steward requests/Global', function(revision) {
				var text = revision.content;
				if (new RegExp('{{\\s*([Ll]uxotool|[Ll]ock[Hh]ide|[Ll][Hh]|[Mm]ulti[Ll]ock).*?\\|\\s*(\\d+\\s*=\\s*)?' + RegExp.escape(uid, true) + '\\s*(\\||}})').test(text)) {
					statusIndicator.error('Report already present, will not add a new one');
					var $srgLink = '<a target="_blank" href="/wiki/m:SRG">m:SRG</a>';
					MorebitsGlobal.status.printUserText(header + reason, 'The comments you typed are provided below, in case you wish to manually post them under the existing report for this user at ' + $srgLink + ':');
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
