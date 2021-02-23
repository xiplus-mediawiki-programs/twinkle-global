// <nowiki>


(function($) {


/*
 ****************************************
 *** twinklespeedy.js: CSD module
 ****************************************
 * Mode of invocation:     Tab ("CSD")
 * Active on:              Non-special, existing pages
 *
 * NOTE FOR DEVELOPERS:
 *   If adding a new criterion, add it to the appropriate places at the top of
 *   twinkleconfig.js.  Also check out the default values of the CSD preferences
 *   in twinkle.js, and add your new criterion to those if you think it would be
 *   good.
 */

TwinkleGlobal.speedy = function twinklespeedy() {
	// Disable on:
	// * special pages
	// * non-existent pages
	if (mw.config.get('wgNamespaceNumber') < 0 || !mw.config.get('wgArticleId')) {
		return;
	}

	var disabledWikis = $.map(TwinkleGlobal.getPref('speedyDisabledWikis'), function(el) {
		return el.value.trim();
	});

	if (disabledWikis.indexOf(mw.config.get('wgDBname')) !== -1) {
		return;
	}

	TwinkleGlobal.addPortletLink(TwinkleGlobal.speedy.callback, 'CSD', 'twg-csd', 'Request speedy deletion');
};

TwinkleGlobal.speedy.speedyTemplate = null;
TwinkleGlobal.speedy.speedyTemplateDefault = {
	'jawiki': 'Delete'
};
TwinkleGlobal.speedy.speedyTemplateSubst = [
	'kowiki'
];

// This function is run when the CSD tab/header link is clicked
TwinkleGlobal.speedy.callback = function twinklespeedyCallback() {
	var DBname = mw.config.get('wgDBname');
	if (DBname in TwinkleGlobal.speedy.speedyTemplateDefault) {
		TwinkleGlobal.speedy.speedyTemplate = TwinkleGlobal.speedy.speedyTemplateDefault[DBname];
		TwinkleGlobal.speedy.initDialog(TwinkleGlobal.speedy.callback.evaluateUser);
		return;
	}

	var dataapi = TwinkleGlobal.getPref('dataApi');
	dataapi.get({
		'action': 'wbgetentities',
		'format': 'json',
		'ids': TwinkleGlobal.getPref('speedyTemplateItem'),
		'props': 'sitelinks',
		'sitefilter': mw.config.get('wgDBname')
	}).done(function (data) {
		var site = data.entities[TwinkleGlobal.getPref('speedyTemplateItem')].sitelinks[mw.config.get('wgDBname')];
		if (site !== undefined) {
			TwinkleGlobal.speedy.speedyTemplate = site.title.replace(/^[^:]+:/, '');
		}
	}).always(function () {
		TwinkleGlobal.speedy.initDialog(TwinkleGlobal.speedy.callback.evaluateUser, true);
	});
};

// Used by unlink feature
TwinkleGlobal.speedy.dialog = null;

// The speedy criteria list can be in one of several modes
TwinkleGlobal.speedy.mode = {
	sysopSingleSubmit: 1,  // radio buttons, no subgroups, submit when "Submit" button is clicked
	sysopRadioClick: 2,  // radio buttons, no subgroups, submit when a radio button is clicked
	sysopMultipleSubmit: 3, // check boxes, subgroups, "Submit" button already present
	sysopMultipleRadioClick: 4, // check boxes, subgroups, need to add a "Submit" button
	userMultipleSubmit: 5,  // check boxes, subgroups, "Submit" button already pressent
	userMultipleRadioClick: 6,  // check boxes, subgroups, need to add a "Submit" button
	userSingleSubmit: 7,  // radio buttons, subgroups, submit when "Submit" button is clicked
	userSingleRadioClick: 8,  // radio buttons, subgroups, submit when a radio button is clicked

	// are we in "delete page" mode?
	// (sysops can access both "delete page" [sysop] and "tag page only" [user] modes)
	isSysop: function twinklespeedyModeIsSysop(mode) {
		return mode === TwinkleGlobal.speedy.mode.sysopSingleSubmit ||
			mode === TwinkleGlobal.speedy.mode.sysopMultipleSubmit ||
			mode === TwinkleGlobal.speedy.mode.sysopRadioClick ||
			mode === TwinkleGlobal.speedy.mode.sysopMultipleRadioClick;
	},
	// do we have a "Submit" button once the form is created?
	hasSubmitButton: function twinklespeedyModeHasSubmitButton(mode) {
		return mode === TwinkleGlobal.speedy.mode.sysopSingleSubmit ||
			mode === TwinkleGlobal.speedy.mode.sysopMultipleSubmit ||
			mode === TwinkleGlobal.speedy.mode.sysopMultipleRadioClick ||
			mode === TwinkleGlobal.speedy.mode.userMultipleSubmit ||
			mode === TwinkleGlobal.speedy.mode.userMultipleRadioClick ||
			mode === TwinkleGlobal.speedy.mode.userSingleSubmit;
	},
	// is db-multiple the outcome here?
	isMultiple: function twinklespeedyModeIsMultiple(mode) {
		return mode === TwinkleGlobal.speedy.mode.userMultipleSubmit ||
			mode === TwinkleGlobal.speedy.mode.sysopMultipleSubmit ||
			mode === TwinkleGlobal.speedy.mode.userMultipleRadioClick ||
			mode === TwinkleGlobal.speedy.mode.sysopMultipleRadioClick;
	}
};

// Prepares the speedy deletion dialog and displays it
TwinkleGlobal.speedy.initDialog = function twinklespeedyInitDialog(callbackfunc) {
	var dialog;
	TwinkleGlobal.speedy.dialog = new MorebitsGlobal.simpleWindow(TwinkleGlobal.getPref('speedyWindowWidth'), TwinkleGlobal.getPref('speedyWindowHeight'));
	dialog = TwinkleGlobal.speedy.dialog;
	dialog.setTitle('Choose criteria for speedy deletion');
	dialog.setScriptName('Twinkle');
	dialog.addFooterLink('Add custom reason', TwinkleGlobal.getPref('configPage'));
	dialog.addFooterLink('Suggest useful reasons', TwinkleGlobal.getPref('bugReportLink'));

	var form = new MorebitsGlobal.quickForm(callbackfunc, TwinkleGlobal.getPref('speedySelectionStyle') === 'radioClick' ? 'change' : null);

	var tagOptions = form.append({
		type: 'div',
		name: 'tag_options'
	});

	tagOptions.append({
		type: 'checkbox',
		list: [
			{
				label: 'Tag with multiple criteria',
				value: 'multiple',
				name: 'multiple',
				tooltip: 'When selected, you can select several criteria that apply to the page.',
				event: function(event) {
					TwinkleGlobal.speedy.callback.modeChanged(event.target.form);
					event.stopPropagation();
				}
			}
		]
	});

	tagOptions.append({
		type: 'checkbox',
		list: [
			{
				label: 'Blank the page',
				value: 'blank',
				name: 'blank',
				tooltip: 'When selected, blank the page before tagging.'
			}
		]
	});

	if (MorebitsGlobal.isGSWiki()) {
		tagOptions.append({
			type: 'checkbox',
			list: [
				{
					label: 'Request at m:Global sysops/Requests (BETA feature: Remember to review your edits after clicking "Submit Query")',
					value: 'gsr',
					name: 'gsr'
				}
			]
		});
	}

	form.append({
		type: 'div',
		name: 'work_area',
		label: 'Failed to initialize the CSD module. Please try again, or tell the Twinkle developers about the issue.'
	});

	if (TwinkleGlobal.getPref('speedySelectionStyle') !== 'radioClick') {
		form.append({ type: 'submit' });
	}

	var result = form.render();
	dialog.setContent(result);
	dialog.display();

	TwinkleGlobal.speedy.callback.modeChanged(result);
};

TwinkleGlobal.speedy.callback.getMode = function twinklespeedyCallbackGetMode(form) {
	var mode = TwinkleGlobal.speedy.mode.userSingleSubmit;

	if (form.multiple.checked) {
		mode = TwinkleGlobal.speedy.mode.userMultipleSubmit;
	} else {
		mode = TwinkleGlobal.speedy.mode.userSingleSubmit;
	}
	if (TwinkleGlobal.getPref('speedySelectionStyle') === 'radioClick') {
		mode++;
	}

	return mode;
};

TwinkleGlobal.speedy.callback.modeChanged = function twinklespeedyCallbackModeChanged(form) {
	// first figure out what mode we're in
	var mode = TwinkleGlobal.speedy.callback.getMode(form);

	var work_area = new MorebitsGlobal.quickForm.element({
		type: 'div',
		name: 'work_area'
	});

	if (mode === TwinkleGlobal.speedy.mode.userMultipleRadioClick || mode === TwinkleGlobal.speedy.mode.sysopMultipleRadioClick) {
		var evaluateType = 'evaluateUser';

		work_area.append({
			type: 'div',
			label: 'When finished choosing criteria, click:'
		});
		work_area.append({
			type: 'button',
			name: 'submit-multiple',
			label: 'Submit Query',
			event: function(event) {
				TwinkleGlobal.speedy.callback[evaluateType](event);
				event.stopPropagation();
			}
		});
	}

	var radioOrCheckbox = TwinkleGlobal.speedy.mode.isMultiple(mode) ? 'checkbox' : 'radio';

	var generalCriteria = TwinkleGlobal.speedy.generalList.concat(TwinkleGlobal.getPref('customCSDReasonList'));

	$.each(TwinkleGlobal.getPref('customCSDReasonList'), function (_, item) {
		TwinkleGlobal.speedy.normalizeHash[item.value] = item.value;
	});

	// custom rationale lives under general criteria when tagging
	generalCriteria = TwinkleGlobal.speedy.customRationale.concat(generalCriteria);
	work_area.append({ type: 'header', label: 'General criteria' });
	work_area.append({ type: radioOrCheckbox, name: 'csd', list: TwinkleGlobal.speedy.generateCsdList(generalCriteria, mode) });

	if (TwinkleGlobal.speedy.speedyTemplate) {
		work_area.append({
			type: 'div',
			label: $.parseHTML('<span>Note: {{<a href="' + mw.util.getUrl('Template:' + TwinkleGlobal.speedy.speedyTemplate) + '" target="_blank">' + TwinkleGlobal.speedy.speedyTemplate + '</a>}} will be used as speedy deletion template on this wiki. Wrong? Fix it <a href="' + mw.util.getUrl('d:' + TwinkleGlobal.getPref('speedyTemplateItem')) + '" target="_blank">on Wikidata</a> or report bug <a href="' + TwinkleGlobal.getPref('bugReportLink') + '" target="_blank">here</a>.</span>')
		});
	} else {
		work_area.append({
			type: 'div',
			label: $.parseHTML('<span>Note: Fail to retrieve speedy deletion template name. {{<a href="' + mw.util.getUrl('Template:Delete') + '" target="_blank">Delete</a>}} will be used as speedy deletion template. Add template name <a href="' + mw.util.getUrl('d:' + TwinkleGlobal.getPref('speedyTemplateItem')) + '" target="_blank">on Wikidata</a> or report bug <a href="' + TwinkleGlobal.getPref('bugReportLink') + '" target="_blank">here</a></span>')
		});
	}

	var old_area = MorebitsGlobal.quickForm.getElements(form, 'work_area')[0];
	form.replaceChild(work_area.render(), old_area);
};

TwinkleGlobal.speedy.generateCsdList = function twinklespeedyGenerateCsdList(list, mode) {
	// mode switches
	var multiple = TwinkleGlobal.speedy.mode.isMultiple(mode);
	var hasSubmitButton = TwinkleGlobal.speedy.mode.hasSubmitButton(mode);
	var pageNamespace = mw.config.get('wgNamespaceNumber');

	var openSubgroupHandler = function(e) {
		$(e.target.form).find('input').prop('disabled', true);
		$(e.target.form).children().css('color', 'gray');
		$(e.target).parent().css('color', 'black').find('input').prop('disabled', false);
		$(e.target).parent().find('input:text')[0].focus();
		e.stopPropagation();
	};
	var submitSubgroupHandler = function(e) {
		var evaluateType = 'evaluateUser';
		TwinkleGlobal.speedy.callback[evaluateType](e);
		e.stopPropagation();
	};

	return $.map(list, function(critElement) {
		var criterion = $.extend({}, critElement);

		if (multiple) {
			if (criterion.hideWhenMultiple) {
				return null;
			}
			if (criterion.hideSubgroupWhenMultiple) {
				criterion.subgroup = null;
			}
		} else {
			if (criterion.hideWhenSingle) {
				return null;
			}
			if (criterion.hideSubgroupWhenSingle) {
				criterion.subgroup = null;
			}
		}

		if (mw.config.get('wgIsRedirect') && criterion.hideWhenRedirect) {
			return null;
		}

		if (criterion.showInNamespaces && criterion.showInNamespaces.indexOf(pageNamespace) < 0) {
			return null;
		}
		if (criterion.hideInNamespaces && criterion.hideInNamespaces.indexOf(pageNamespace) > -1) {
			return null;
		}

		if (criterion.subgroup && !hasSubmitButton) {
			if (Array.isArray(criterion.subgroup)) {
				criterion.subgroup = criterion.subgroup.concat({
					type: 'button',
					name: 'submit',
					label: 'Submit Query',
					event: submitSubgroupHandler
				});
			} else {
				criterion.subgroup = [
					criterion.subgroup,
					{
						type: 'button',
						name: 'submit',  // ends up being called "csd.submit" so this is OK
						label: 'Submit Query',
						event: submitSubgroupHandler
					}
				];
			}
			// FIXME: does this do anything?
			criterion.event = openSubgroupHandler;
		}

		return criterion;
	});
};

TwinkleGlobal.speedy.customRationale = [
	{
		label: 'Custom rationale',
		value: 'reason',
		subgroup: {
			name: 'reason_1',
			type: 'input',
			label: 'Rationale: ',
			size: 60
		}
	}
];

TwinkleGlobal.speedy.generalList = [
	{
		label: 'Spam',
		value: 'Spam'
	},
	{
		label: 'Vandalism',
		value: 'Vandalism'
	},
	{
		label: 'Out of project scope',
		value: 'Out of project scope'
	},
	{
		label: 'Nonsense',
		value: 'Nonsense'
	},
	{
		label: 'Test page',
		value: 'Test page'
	},
	{
		label: 'Empty page',
		value: 'Empty page'
	}
];

TwinkleGlobal.speedy.normalizeHash = {
	'reason': 'db',
	'Spam': 'spam',
	'Vandalism': 'vandalism',
	'Out of project scope': 'scope',
	'Nonsense': 'nonsense',
	'Test page': 'test',
	'Empty page': 'empty'
};

TwinkleGlobal.speedy.callbacks = {
	getTemplateCodeAndParams: function(params) {
		var reason = '', norm, parameters;

		$.each(params.values, function(index, value) {
			norm = TwinkleGlobal.speedy.normalizeHash[value];
			if (norm !== 'db') {
				reason += value + ', ';
			}
			parameters = params.templateParams[index] || [];
			for (var i in parameters) {
				if (typeof parameters[i] === 'string') {
					reason += parameters[i] + ', ';
				}
			}
		});
		reason = reason.substr(0, reason.length - 2); // remove trailing comma
		var code = '{{' +
			(TwinkleGlobal.speedy.speedyTemplateSubst.indexOf(mw.config.get('wgDBname')) !== -1 ? 'subst:' : '') +
			TwinkleGlobal.speedy.getSpeedyTemplate() + '|1=' + reason + '}}';

		return [code, reason];
	},

	parseWikitext: function(wikitext, callback) {
		var query = {
			action: 'parse',
			prop: 'text',
			pst: 'true',
			text: wikitext,
			contentmodel: 'wikitext',
			title: mw.config.get('wgPageName')
		};

		var statusIndicator = new MorebitsGlobal.status('Building deletion summary');
		var api = new MorebitsGlobal.wiki.api('Parsing deletion template', query, function(apiObj) {
			var reason = decodeURIComponent($(apiObj.getXML().querySelector('text').childNodes[0].nodeValue).find('#delete-reason').text()).replace(/\+/g, ' ');
			if (!reason) {
				statusIndicator.warn('Unable to generate summary from deletion template');
			} else {
				statusIndicator.info('complete');
			}
			callback(reason);
		}, statusIndicator);
		api.post();
	},

	user: {
		main: function(pageobj) {
			var statelem = pageobj.getStatusElement();

			// defaults to /doc for lua modules, which may not exist
			if (!pageobj.exists() && mw.config.get('wgPageContentModel') !== 'Scribunto') {
				statelem.error("It seems that the page doesn't exist; perhaps it has already been deleted");
				return;
			}

			var text = pageobj.getPageText();
			var params = pageobj.getCallbackParameters();

			// given the params, builds the template and also adds the user talk page parameters to the params that were passed in
			// returns => [<string> wikitext, <string> reason]
			var buildData = TwinkleGlobal.speedy.callbacks.getTemplateCodeAndParams(params),
				code = buildData[0],
				reason = buildData[1];

			var thispage = new MorebitsGlobal.wiki.page(mw.config.get('wgPageName'));
			// patrol the page, if reached from Special:NewPages
			if (TwinkleGlobal.getPref('markSpeedyPagesAsPatrolled')) {
				thispage.patrol();
			}

			if (params.gsr) {
				var statusIndicator = new MorebitsGlobal.status('Adding request at Global sysops/Requests', 'Fetching page...');

				var metaapi = TwinkleGlobal.getPref('metaApi');
				metaapi.edit('Global sysops/Requests', function(revision) {
					var text = revision.content.trim();

					text += '\n* Please delete ';
					if (MorebitsGlobal.interwikiPrefix !== null) {
						text += '[[:' + MorebitsGlobal.interwikiPrefix + ':' + MorebitsGlobal.pageNameNorm + ']]';
					} else {
						text += 'https:' + mw.config.get('wgServer') + mw.util.getUrl();
					}
					text += ': ' + reason + ' --~~~~';

					return {
						text: text,
						summary: 'Requesting deletion' + TwinkleGlobal.getPref('summaryAd'),
						assert: 'user'
					};
				}).then(function() {
					statusIndicator.info('Done');
				}, function(e) {
					statusIndicator.error(e);
				});
			}

			statelem.status('Checking for tags on the page...');

			// check for existing deletion tags
			var delete_re_string = MorebitsGlobal.pageNameRegex(RegExp.escape(TwinkleGlobal.speedy.getSpeedyTemplate(), true));
			var delete_re = new RegExp('{{\\s*(delete|' + delete_re_string + ')\\s*(\\|(?:{{[^{}]*}}|[^{}])*)?}}\\s*', 'i');
			var textNoSd = text.replace(delete_re, '');
			if (text !== textNoSd && !confirm('The page already has the CSD-related template on it. Do you want to remove this one and add yours template?')) {
				statelem.error('Aborted marking by user.');
				return;
			}
			text = textNoSd;

			// Wrap SD template in noinclude tags if we are in template space.
			// Won't work with userboxes in userspace, or any other transcluded page outside template space
			if (mw.config.get('wgNamespaceNumber') === 10) {  // Template:
				code = '<noinclude>' + code + '</noinclude>';
			}

			// Generate edit summary for edit
			var editsummary, norm, parameters;
			if (params.values.length > 1) {
				editsummary = 'Requesting speedy deletion (';
				$.each(params.values, function(index, value) {
					norm = TwinkleGlobal.speedy.normalizeHash[value];
					if (norm !== 'db') {
						editsummary += value + ', ';
					}
					parameters = params.templateParams[index] || [];
					for (var i in parameters) {
						if (typeof parameters[i] === 'string') {
							editsummary += parameters[i] + ', ';
						}
					}
				});
				editsummary = editsummary.substr(0, editsummary.length - 2); // remove trailing comma
				editsummary += ').';
			} else if (params.normalizeds[0] === 'db') {
				editsummary = 'Requesting speedy deletion with rationale "' + params.templateParams[0]['1'] + '".';
			} else {
				editsummary = 'Requesting speedy deletion (' + params.values[0] + ').';
			}

			pageobj.setPageText(code + (params.blank ? '' : '\n' + text));
			pageobj.setEditSummary(editsummary + TwinkleGlobal.getPref('summaryAd'));
			pageobj.setWatchlist(params.watch);
			if (params.scribunto) {
				pageobj.setCreateOption('recreate'); // Module /doc might not exist
				if (params.watch) {
					// Watch module in addition to /doc subpage
					var watch_query = {
						action: 'watch',
						titles: mw.config.get('wgPageName'),
						token: mw.user.tokens.get('watchToken')
					};
					new MorebitsGlobal.wiki.api('Adding Module to watchlist', watch_query).post();
				}
			}
			pageobj.save();
		}
	}
};

// validate subgroups in the form passed into the speedy deletion tag
TwinkleGlobal.speedy.getParameters = function twinklespeedyGetParameters(form, values) {
	var parameters = [];

	$.each(values, function(index, value) {
		var currentParams = [];
		switch (value) {
			case 'reason':
				if (form['csd.reason_1']) {
					var dbrationale = form['csd.reason_1'].value;
					if (!dbrationale || !dbrationale.trim()) {
						alert('Custom rationale:  Please specify a rationale.');
						parameters = null;
						return false;
					}
					currentParams['1'] = dbrationale;
				}
				break;
			default:
				break;
		}
		parameters.push(currentParams);
	});
	return parameters;
};

TwinkleGlobal.speedy.getSpeedyTemplate = function twinklespeedyGetSpeedyTemplate() {
	return TwinkleGlobal.speedy.speedyTemplate || 'Delete';
};


TwinkleGlobal.speedy.resolveCsdValues = function twinklespeedyResolveCsdValues(e) {
	var values = (e.target.form ? e.target.form : e.target).getChecked('csd');
	if (values.length === 0) {
		alert('Please select a criterion!');
		return null;
	}
	return values;
};

TwinkleGlobal.speedy.callback.evaluateUser = function twinklespeedyCallbackEvaluateUser(e) {
	var form = e.target.form ? e.target.form : e.target;

	if (e.target.type === 'checkbox' || e.target.type === 'text' ||
			e.target.type === 'select') {
		return;
	}

	var values = TwinkleGlobal.speedy.resolveCsdValues(e);
	if (!values) {
		return;
	}
	// var multiple = form.multiple.checked;
	var normalizeds = [];
	$.each(values, function(index, value) {
		var norm = TwinkleGlobal.speedy.normalizeHash[value];

		normalizeds.push(norm);
	});

	var blank = form.blank.checked;
	var gsr = form.gsr ? form.gsr.checked : false;

	var params = {
		values: values,
		normalizeds: normalizeds,
		templateParams: TwinkleGlobal.speedy.getParameters(form, values),
		blank: blank,
		gsr: gsr
	};
	if (!params.templateParams) {
		return;
	}

	MorebitsGlobal.simpleWindow.setButtonsEnabled(false);
	MorebitsGlobal.status.init(form);

	MorebitsGlobal.wiki.actionCompleted.redirect = mw.config.get('wgPageName');
	MorebitsGlobal.wiki.actionCompleted.notice = 'Tagging complete';

	// Modules can't be tagged, follow standard at TfD and place on /doc subpage
	params.scribunto = mw.config.get('wgPageContentModel') === 'Scribunto';
	var wikipedia_page = params.scribunto ? new MorebitsGlobal.wiki.page(mw.config.get('wgPageName') + '/doc', 'Tagging module documentation page') : new MorebitsGlobal.wiki.page(mw.config.get('wgPageName'), 'Tagging page');
	wikipedia_page.setCallbackParameters(params);
	wikipedia_page.load(TwinkleGlobal.speedy.callbacks.user.main);
};
})(jQuery);


// </nowiki>
