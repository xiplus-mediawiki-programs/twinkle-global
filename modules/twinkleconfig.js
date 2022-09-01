// <nowiki>


(function($) {


/*
 ****************************************
 *** twinkleconfig.js: Preferences module
 ****************************************
 * Mode of invocation:     Adds configuration form to Wikipedia:Twinkle/Preferences and user
                           subpages named "/Twinkle preferences", and adds an ad box to the top of user
                           subpages belonging to the currently logged-in user which end in '.js'
 * Active on:              What I just said.  Yeah.

 I, [[User:This, that and the other]], originally wrote this.  If the code is misbehaving, or you have any
 questions, don't hesitate to ask me.  (This doesn't at all imply [[WP:OWN]]ership - it's just meant to
 point you in the right direction.)  -- TTO
 */


TwinkleGlobal.config = {};

TwinkleGlobal.config.watchlistEnums = {
	'yes': 'Add to watchlist (indefinitely)',
	'no': "Don't add to watchlist",
	'default': 'Follow your site preferences',
	'1 week': 'Watch for 1 week',
	'1 month': 'Watch for 1 month',
	'3 months': 'Watch for 3 months',
	'6 months': 'Watch for 6 months'
};

TwinkleGlobal.config.commonSets = {
	csdCriteria: {
		db: 'Custom rationale ({{db}})',
		g1: 'G1', g2: 'G2', g3: 'G3', g4: 'G4', g5: 'G5', g6: 'G6', g7: 'G7', g8: 'G8', g10: 'G10', g11: 'G11', g12: 'G12', g13: 'G13', g14: 'G14',
		a1: 'A1', a2: 'A2', a3: 'A3', a5: 'A5', a7: 'A7', a9: 'A9', a10: 'A10', a11: 'A11',
		u1: 'U1', u2: 'U2', u3: 'U3', u5: 'U5',
		f1: 'F1', f2: 'F2', f3: 'F3', f7: 'F7', f8: 'F8', f9: 'F9', f10: 'F10',
		c1: 'C1',
		t2: 'T2', t3: 'T3',
		r2: 'R2', r3: 'R3', r4: 'R4',
		p1: 'P1', p2: 'P2'
	},
	csdCriteriaDisplayOrder: [
		'db',
		'g1', 'g2', 'g3', 'g4', 'g5', 'g6', 'g7', 'g8', 'g10', 'g11', 'g12', 'g13', 'g14',
		'a1', 'a2', 'a3', 'a5', 'a7', 'a9', 'a10', 'a11',
		'u1', 'u2', 'u3', 'u5',
		'f1', 'f2', 'f3', 'f7', 'f8', 'f9', 'f10',
		'c1',
		't2', 't3',
		'r2', 'r3', 'r4',
		'p1', 'p2'
	],
	namespacesNoSpecial: {
		0: 'Article',
		1: 'Talk (article)',
		2: 'User',
		3: 'User talk',
		4: 'Wikipedia',
		5: 'Wikipedia talk',
		6: 'File',
		7: 'File talk',
		8: 'MediaWiki',
		9: 'MediaWiki talk',
		10: 'Template',
		11: 'Template talk',
		12: 'Help',
		13: 'Help talk',
		14: 'Category',
		15: 'Category talk',
		100: 'Portal',
		101: 'Portal talk',
		108: 'Book',
		109: 'Book talk',
		118: 'Draft',
		119: 'Draft talk',
		710: 'TimedText',
		711: 'TimedText talk',
		828: 'Module',
		829: 'Module talk'
	}
};

/**
 * Section entry format:
 *
 * {
 *   title: <human-readable section title>,
 *   adminOnly: <true for admin-only sections>,
 *   hidden: <true for advanced preferences that rarely need to be changed - they can still be modified by manually editing twinkleoptions.js>,
 *   preferences: [
 *     {
 *       name: <TwinkleConfig property name>,
 *       label: <human-readable short description - used as a form label>,
 *       helptip: <(optional) human-readable text (using valid HTML) that complements the description, like limits, warnings, etc.>
 *       adminOnly: <true for admin-only preferences>,
 *       type: <string|boolean|integer|enum|set|customList> (customList stores an array of JSON objects { value, label }),
 *       enumValues: <for type = "enum": a JSON object where the keys are the internal names and the values are human-readable strings>,
 *       setValues: <for type = "set": a JSON object where the keys are the internal names and the values are human-readable strings>,
 *       setDisplayOrder: <(optional) for type = "set": an array containing the keys of setValues (as strings) in the order that they are displayed>,
 *       customListValueTitle: <for type = "customList": the heading for the left "value" column in the custom list editor>,
 *       customListLabelTitle: <for type = "customList": the heading for the right "label" column in the custom list editor>
 *     },
 *     . . .
 *   ]
 * },
 * . . .
 *
 */

TwinkleGlobal.config.sections = [
	{
		title: 'General',
		preferences: [
		// TwinkleConfig.summaryAd (string)
		// Text to be appended to the edit summary of edits made using Twinkle
			{
				name: 'summaryAd',
				label: "\"Ad\" to be appended to Twinkle's edit summaries",
				helptip: 'The summary ad should start with a space, and be kept short.',
				type: 'string'
			},

			// TwinkleConfig.dialogLargeFont (boolean)
			{
				name: 'dialogLargeFont',
				label: 'Use larger text in Twinkle dialogs',
				type: 'boolean'
			},
			{
				name: 'showPrefLink',
				label: 'Include a link to the preference page in the dropdown menu',
				type: 'boolean'
			}
		]
	},

	{
		title: 'GARV',
		preferences: [
			{
				name: 'customSRGReasonList',
				label: 'Custom SRG report reason',
				type: 'customList',
				customListValueTitle: 'Reason used in the report',
				customListLabelTitle: 'Text to show in GARV dialog'
			},

			{
				name: 'srgCollapseNumber',
				label: 'Put user list in collapse template if the number of users is more than',
				type: 'integer'
			},

			{
				name: 'customGARVGSRReasonList',
				label: 'Custom GS/R report reason',
				type: 'customList',
				customListValueTitle: 'Reason used in the report',
				customListLabelTitle: 'Text to show in GARV dialog'
			},

			// Disable arv on these wikis.
			{
				name: 'arvDisabledWikis',
				label: 'Disable GARV function on these wikis',
				helptip: 'Use wiki\'s database name.',
				type: 'customList',
				customListValueTitle: 'Database name',
				customListLabelTitle: '(unused)'
			}
		]
	},

	{
		title: 'Revert and rollback',  // twinklefluff module
		preferences: [
			{
				name: 'showVandRollbackLink',
				label: 'Show "Vandalism rollback" link',
				type: 'boolean'
			},

			// TwinkleConfig.openTalkPage (array)
			// What types of actions that should result in opening of talk page
			{
				name: 'openTalkPage',
				label: 'Open user talk page after these types of reversions',
				type: 'set',
				setValues: { norm: 'Normal rollback', vand: 'Vandalism rollback' }
			},

			// TwinkleConfig.openTalkPageOnAutoRevert (bool)
			// Defines if talk page should be opened when calling revert from contribs or recent changes pages. If set to true, openTalkPage defines then if talk page will be opened.
			{
				name: 'openTalkPageOnAutoRevert',
				label: 'Open user talk page when invoking rollback from user contributions or recent changes',
				helptip: 'When this is on, the desired options must be enabled in the previous setting for this to work.',
				type: 'boolean'
			},

			// TwinkleConfig.rollbackInPlace (bool)
			//
			{
				name: 'rollbackInPlace',
				label: "Don't reload the page when rolling back from contributions or recent changes",
				helptip: "When this is on, Twinkle won't reload the contributions or recent changes feed after reverting, allowing you to revert more than one edit at a time.",
				type: 'boolean'
			},

			// TwinkleConfig.markRevertedPagesAsMinor (array)
			// What types of actions that should result in marking edit as minor
			{
				name: 'markRevertedPagesAsMinor',
				label: 'Mark as minor edit for these types of reversions',
				type: 'set',
				setValues: { norm: 'Normal rollback', vand: 'Vandalism rollback', torev: '"Restore this version"' }
			},

			// TwinkleConfig.watchRevertedPages (array)
			// What types of actions that should result in forced addition to watchlist
			{
				name: 'watchRevertedPages',
				label: 'Add pages to watchlist for these types of reversions',
				type: 'set',
				setValues: { norm: 'Normal rollback', vand: 'Vandalism rollback', torev: '"Restore this version"' }
			},
			// TwinkleConfig.watchRevertedExpiry
			// If any of the above items are selected, whether to expire the watch
			{
				name: 'watchRevertedExpiry',
				label: 'When reverting a page, how long to watch it for',
				type: 'enum',
				enumValues: TwinkleGlobal.config.watchlistEnums
			},

			// TwinkleConfig.offerReasonOnNormalRevert (boolean)
			// If to offer a prompt for extra summary reason for normal reverts, default to true
			{
				name: 'offerReasonOnNormalRevert',
				label: 'Prompt for reason for normal rollbacks',
				helptip: '"Normal" rollbacks are the ones that are invoked from the middle [rollback] link.',
				type: 'boolean'
			},

			{
				name: 'confirmOnFluff',
				label: 'Require confirmation before reverting (all devices)',
				helptip: 'For users of pen or touch devices, and chronically indecisive people.',
				type: 'boolean'
			},

			{
				name: 'confirmOnMobileFluff',
				label: 'Require confirmation before reverting (mobile devices only)',
				helptip: 'Avoid accidental reversions when on mobile devices.',
				type: 'boolean'
			},

			// TwinkleConfig.showRollbackLinks (array)
			// Where Twinkle should show rollback links:
			// diff, others, mine, contribs, history, recent
			// Note from TTO: |contribs| seems to be equal to |others| + |mine|, i.e. redundant, so I left it out heres
			{
				name: 'showRollbackLinks',
				label: 'Show rollback links on these pages',
				type: 'set',
				setValues: { diff: 'Diff pages', others: 'Contributions pages of other users', mine: 'My contributions page', recent: 'Recent changes and related changes special pages', history: 'History pages' }
			},

			// Disable fluff on these wikis.
			{
				name: 'fluffDisabledWikis',
				label: 'Disable revert function on these wikis',
				helptip: 'Use wiki\'s database name.',
				type: 'customList',
				customListValueTitle: 'Database name',
				customListLabelTitle: '(unused)'
			}
		]
	},

	{
		title: 'Speedy deletion (CSD)',
		preferences: [
			{
				name: 'speedySelectionStyle',
				label: 'When to go ahead and tag/delete the page',
				type: 'enum',
				enumValues: { buttonClick: 'When I click "Submit"', radioClick: 'As soon as I click an option' }
			},

			// TwinkleConfig.markSpeedyPagesAsPatrolled (boolean)
			// If, when applying speedy template to page, to mark the page as patrolled (if the page was reached from NewPages)
			{
				name: 'markSpeedyPagesAsPatrolled',
				label: 'Mark page as patrolled when tagging (if possible)',
				type: 'boolean'
			},

			// TwinkleConfig.speedyWindowWidth (integer)
			// Defines the width of the Twinkle SD window in pixels
			{
				name: 'speedyWindowWidth',
				label: 'Width of speedy deletion window (pixels)',
				type: 'integer'
			},

			// TwinkleConfig.speedyWindowWidth (integer)
			// Defines the width of the Twinkle SD window in pixels
			{
				name: 'speedyWindowHeight',
				label: 'Height of speedy deletion window (pixels)',
				helptip: 'If you have a big monitor, you might like to increase this.',
				type: 'integer'
			},

			{
				name: 'customCSDReasonList',
				label: 'Custom speedy reason',
				type: 'customList',
				customListValueTitle: 'Reason used in the template',
				customListLabelTitle: 'Text to show in CSD dialog'
			},

			// Disable speedy on these wikis.
			{
				name: 'speedyDisabledWikis',
				label: 'Disable speedy deletion function on these wikis',
				helptip: 'Use wiki\'s database name.',
				type: 'customList',
				customListValueTitle: 'Database name',
				customListLabelTitle: '(unused)'
			}
		]
	},

	{
		title: 'Diff',
		preferences: [
			// Disable diff on these wikis.
			{
				name: 'diffDisabledWikis',
				label: 'Disable diff function on these wikis',
				helptip: 'Use wiki\'s database name.',
				type: 'customList',
				customListValueTitle: 'Database name',
				customListLabelTitle: '(unused)'
			}
		]
	},

	{
		title: 'Hidden',
		hidden: true,
		preferences: [
			// twinkle.js: portlet setup
			{
				name: 'portletArea',
				type: 'string'
			},
			{
				name: 'portletId',
				type: 'string'
			},
			{
				name: 'portletName',
				type: 'string'
			},
			{
				name: 'portletType',
				type: 'string'
			},
			{
				name: 'portletNext',
				type: 'string'
			},
			// twinklefluff.js: defines how many revision to query maximum, maximum possible is 50, default is 50
			{
				name: 'revertMaxRevisions',
				type: 'integer'
			},
			// twinklebatchdelete.js: How many pages should be processed maximum
			{
				name: 'batchMax',
				type: 'integer',
				adminOnly: true
			},
			// twinklebatchdelete.js: How many pages should be processed at a time
			{
				name: 'batchdeleteChunks',
				type: 'integer',
				adminOnly: true
			},
			// twinklebatchprotect.js: How many pages should be processed at a time
			{
				name: 'batchProtectChunks',
				type: 'integer',
				adminOnly: true
			},
			// twinklebatchundelete.js: How many pages should be processed at a time
			{
				name: 'batchundeleteChunks',
				type: 'integer',
				adminOnly: true
			},
			// twinkledeprod.js: How many pages should be processed at a time
			{
				name: 'proddeleteChunks',
				type: 'integer',
				adminOnly: true
			}
		]
	}

]; // end of TwinkleGlobal.config.sections


TwinkleGlobal.config.init = function twinkleconfigInit() {

	if ((mw.config.get('wgServer') + mw.util.getUrl() === TwinkleGlobal.getPref('configPage')) &&
			mw.config.get('wgAction') === 'view') {
		// create the config page at Wikipedia:Twinkle/Preferences, and at user subpages (for testing purposes)

		if (!document.getElementById('twinkleglobal-config')) {
			return;  // maybe the page is misconfigured, or something - but any attempt to modify it will be pointless
		}

		// set style (the url() CSS function doesn't seem to work from wikicode - ?!)
		document.getElementById('twinkleglobal-config-titlebar').style.backgroundImage = 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAkCAMAAAB%2FqqA%2BAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAEhQTFRFr73ZobTPusjdsMHZp7nVwtDhzNbnwM3fu8jdq7vUt8nbxtDkw9DhpbfSvMrfssPZqLvVztbno7bRrr7W1d%2Fs1N7qydXk0NjpkW7Q%2BgAAADVJREFUeNoMwgESQCAAAMGLkEIi%2FP%2BnbnbpdB59app5Vdg0sXAoMZCpGoFbK6ciuy6FX4ABAEyoAef0BXOXAAAAAElFTkSuQmCC)';

		var contentdiv = document.getElementById('twinkleglobal-config-content');
		contentdiv.textContent = '';  // clear children

		// let user know about possible conflict with monobook.js/vector.js file
		// (settings in that file will still work, but they will be overwritten by twinkleoptions.js settings)
		var contentnotice = document.createElement('p');
		// I hate innerHTML, but this is one thing it *is* good for...
		contentnotice.innerHTML = '<b>Before modifying your preferences here,</b> make sure you have removed any old <code>TwinkleConfig</code> and <code>FriendlyConfig</code> settings from your <a href="' + mw.util.getUrl('Special:MyPage/skin.js') + '" title="Special:MyPage/skin.js">user JavaScript file</a>.';
		contentdiv.appendChild(contentnotice);

		// look and see if the user does in fact have any old settings in their skin JS file
		var skinjs = new MorebitsGlobal.wiki.page('User:' + mw.config.get('wgUserName') + '/' + mw.config.get('skin') + '.js');
		skinjs.setCallbackParameters(contentnotice);
		skinjs.load(TwinkleGlobal.config.legacyPrefsNotice);

		// start a table of contents
		var toctable = document.createElement('div');
		toctable.className = 'toc';
		toctable.style.marginLeft = '0.4em';
		// create TOC title
		var toctitle = document.createElement('div');
		toctitle.id = 'toctitle';
		var toch2 = document.createElement('h2');
		toch2.textContent = 'Contents ';
		toctitle.appendChild(toch2);
		// add TOC show/hide link
		var toctoggle = document.createElement('span');
		toctoggle.className = 'toctoggle';
		toctoggle.appendChild(document.createTextNode('['));
		var toctogglelink = document.createElement('a');
		toctogglelink.className = 'internal';
		toctogglelink.setAttribute('href', '#twg-tocshowhide');
		toctogglelink.textContent = 'hide';
		toctoggle.appendChild(toctogglelink);
		toctoggle.appendChild(document.createTextNode(']'));
		toctitle.appendChild(toctoggle);
		toctable.appendChild(toctitle);
		// create item container: this is what we add stuff to
		var tocul = document.createElement('ul');
		toctogglelink.addEventListener('click', function twinkleconfigTocToggle() {
			var $tocul = $(tocul);
			$tocul.toggle();
			if ($tocul.find(':visible').length) {
				toctogglelink.textContent = 'hide';
			} else {
				toctogglelink.textContent = 'show';
			}
		}, false);
		toctable.appendChild(tocul);
		contentdiv.appendChild(toctable);

		var tocnumber = 1;

		var contentform = document.createElement('form');
		contentform.setAttribute('action', 'javascript:void(0)');  // was #tw-save - changed to void(0) to work around Chrome issue
		contentform.addEventListener('submit', TwinkleGlobal.config.save, true);
		contentdiv.appendChild(contentform);

		var container = document.createElement('table');
		container.style.width = '100%';
		contentform.appendChild(container);

		$(TwinkleGlobal.config.sections).each(function(sectionkey, section) {
			if (section.hidden || (section.adminOnly && !MorebitsGlobal.userIsSysop)) {
				return true;  // i.e. "continue" in this context
			}

			// add to TOC
			var tocli = document.createElement('li');
			tocli.className = 'toclevel-1';
			var toca = document.createElement('a');
			toca.setAttribute('href', '#twinkleglobal-config-section-' + tocnumber.toString());
			toca.appendChild(document.createTextNode(section.title));
			tocli.appendChild(toca);
			tocul.appendChild(tocli);

			var row = document.createElement('tr');
			var cell = document.createElement('td');
			cell.setAttribute('colspan', '3');
			var heading = document.createElement('h4');
			heading.style.borderBottom = '1px solid gray';
			heading.style.marginTop = '0.2em';
			heading.id = 'twinkleglobal-config-section-' + (tocnumber++).toString();
			heading.appendChild(document.createTextNode(section.title));
			cell.appendChild(heading);
			row.appendChild(cell);
			container.appendChild(row);

			var rowcount = 1;  // for row banding

			// add each of the preferences to the form
			$(section.preferences).each(function(prefkey, pref) {
				if (pref.adminOnly && !MorebitsGlobal.userIsSysop) {
					return true;  // i.e. "continue" in this context
				}

				row = document.createElement('tr');
				row.style.marginBottom = '0.2em';
				// create odd row banding
				if (rowcount++ % 2 === 0) {
					row.style.backgroundColor = 'rgba(128, 128, 128, 0.1)';
				}
				cell = document.createElement('td');

				var label, input;
				switch (pref.type) {

					case 'boolean':  // create a checkbox
						cell.setAttribute('colspan', '2');

						label = document.createElement('label');
						input = document.createElement('input');
						input.setAttribute('type', 'checkbox');
						input.setAttribute('id', pref.name);
						input.setAttribute('name', pref.name);
						if (TwinkleGlobal.getPref(pref.name) === true) {
							input.setAttribute('checked', 'checked');
						}
						label.appendChild(input);
						label.appendChild(document.createTextNode(pref.label));
						cell.appendChild(label);
						break;

					case 'string':  // create an input box
					case 'integer':
						// add label to first column
						cell.style.textAlign = 'right';
						cell.style.paddingRight = '0.5em';
						label = document.createElement('label');
						label.setAttribute('for', pref.name);
						label.appendChild(document.createTextNode(pref.label + ':'));
						cell.appendChild(label);
						row.appendChild(cell);

						// add input box to second column
						cell = document.createElement('td');
						cell.style.paddingRight = '1em';
						input = document.createElement('input');
						input.setAttribute('type', 'text');
						input.setAttribute('id', pref.name);
						input.setAttribute('name', pref.name);
						if (pref.type === 'integer') {
							input.setAttribute('size', 6);
							input.setAttribute('type', 'number');
							input.setAttribute('step', '1');  // integers only
						}
						if (TwinkleGlobal.getPref(pref.name)) {
							input.setAttribute('value', TwinkleGlobal.getPref(pref.name));
						}
						cell.appendChild(input);
						break;

					case 'enum':  // create a combo box
						// add label to first column
						// note: duplicates the code above, under string/integer
						cell.style.textAlign = 'right';
						cell.style.paddingRight = '0.5em';
						label = document.createElement('label');
						label.setAttribute('for', pref.name);
						label.appendChild(document.createTextNode(pref.label + ':'));
						cell.appendChild(label);
						row.appendChild(cell);

						// add input box to second column
						cell = document.createElement('td');
						cell.style.paddingRight = '1em';
						input = document.createElement('select');
						input.setAttribute('id', pref.name);
						input.setAttribute('name', pref.name);
						$.each(pref.enumValues, function(enumvalue, enumdisplay) {
							var option = document.createElement('option');
							option.setAttribute('value', enumvalue);
							if (TwinkleGlobal.getPref(pref.name) === enumvalue) {
								option.setAttribute('selected', 'selected');
							}
							option.appendChild(document.createTextNode(enumdisplay));
							input.appendChild(option);
						});
						cell.appendChild(input);
						break;

					case 'set':  // create a set of check boxes
						// add label first of all
						cell.setAttribute('colspan', '2');
						label = document.createElement('label');  // not really necessary to use a label element here, but we do it for consistency of styling
						label.appendChild(document.createTextNode(pref.label + ':'));
						cell.appendChild(label);

						var checkdiv = document.createElement('div');
						checkdiv.style.paddingLeft = '1em';
						var worker = function(itemkey, itemvalue) {
							var checklabel = document.createElement('label');
							checklabel.style.marginRight = '0.7em';
							checklabel.style.display = 'inline-block';
							var check = document.createElement('input');
							check.setAttribute('type', 'checkbox');
							check.setAttribute('id', pref.name + '_' + itemkey);
							check.setAttribute('name', pref.name + '_' + itemkey);
							if (TwinkleGlobal.getPref(pref.name) && TwinkleGlobal.getPref(pref.name).indexOf(itemkey) !== -1) {
								check.setAttribute('checked', 'checked');
							}
							// cater for legacy integer array values for unlinkNamespaces (this can be removed a few years down the track...)
							if (pref.name === 'unlinkNamespaces') {
								if (TwinkleGlobal.getPref(pref.name) && TwinkleGlobal.getPref(pref.name).indexOf(parseInt(itemkey, 10)) !== -1) {
									check.setAttribute('checked', 'checked');
								}
							}
							checklabel.appendChild(check);
							checklabel.appendChild(document.createTextNode(itemvalue));
							checkdiv.appendChild(checklabel);
						};
						if (pref.setDisplayOrder) {
							// add check boxes according to the given display order
							$.each(pref.setDisplayOrder, function(itemkey, item) {
								worker(item, pref.setValues[item]);
							});
						} else {
							// add check boxes according to the order it gets fed to us (probably strict alphabetical)
							$.each(pref.setValues, worker);
						}
						cell.appendChild(checkdiv);
						break;

					case 'customList':
						// add label to first column
						cell.style.textAlign = 'right';
						cell.style.paddingRight = '0.5em';
						label = document.createElement('label');
						label.setAttribute('for', pref.name);
						label.appendChild(document.createTextNode(pref.label + ':'));
						cell.appendChild(label);
						row.appendChild(cell);

						// add button to second column
						cell = document.createElement('td');
						cell.style.paddingRight = '1em';
						var button = document.createElement('button');
						button.setAttribute('id', pref.name);
						button.setAttribute('name', pref.name);
						button.setAttribute('type', 'button');
						button.addEventListener('click', TwinkleGlobal.config.listDialog.display, false);
						// use jQuery data on the button to store the current config value
						$(button).data({
							value: TwinkleGlobal.getPref(pref.name),
							pref: pref
						});
						button.appendChild(document.createTextNode('Edit items'));
						cell.appendChild(button);
						break;

					default:
						alert('twinkleconfig: unknown data type for preference ' + pref.name);
						break;
				}
				row.appendChild(cell);

				// add help tip
				cell = document.createElement('td');
				cell.style.fontSize = '90%';

				cell.style.color = 'gray';
				if (pref.helptip) {
					// convert mentions of templates in the helptip to clickable links
					cell.innerHTML = pref.helptip.replace(/{{(.+?)}}/g,
						'{{<a href="' + mw.util.getUrl('Template:') + '$1" target="_blank">$1</a>}}');
				}
				// add reset link (custom lists don't need this, as their config value isn't displayed on the form)
				if (pref.type !== 'customList') {
					var resetlink = document.createElement('a');
					resetlink.setAttribute('href', '#twg-reset');
					resetlink.setAttribute('id', 'twinkleglobal-config-reset-' + pref.name);
					resetlink.addEventListener('click', TwinkleGlobal.config.resetPrefLink, false);
					resetlink.style.cssFloat = 'right';
					resetlink.style.margin = '0 0.6em';
					resetlink.appendChild(document.createTextNode('Reset'));
					cell.appendChild(resetlink);
				}
				row.appendChild(cell);

				container.appendChild(row);
				return true;
			});
			return true;
		});

		var footerbox = document.createElement('div');
		footerbox.setAttribute('id', 'twinkleglobal-config-buttonpane');
		footerbox.style.backgroundColor = '#BCCADF';
		footerbox.style.padding = '0.5em';
		var button = document.createElement('button');
		button.setAttribute('id', 'twinkleglobal-config-submit');
		button.setAttribute('type', 'submit');
		button.appendChild(document.createTextNode('Save changes'));
		footerbox.appendChild(button);
		var footerspan = document.createElement('span');
		footerspan.className = 'plainlinks';
		footerspan.style.marginLeft = '2.4em';
		footerspan.style.fontSize = '90%';
		var footera = document.createElement('a');
		footera.setAttribute('href', '#twg-reset-all');
		footera.setAttribute('id', 'twinkleglobal-config-resetall');
		footera.addEventListener('click', TwinkleGlobal.config.resetAllPrefs, false);
		footera.appendChild(document.createTextNode('Restore defaults'));
		footerspan.appendChild(footera);
		footerbox.appendChild(footerspan);
		contentform.appendChild(footerbox);

		// since all the section headers exist now, we can try going to the requested anchor
		if (location.hash) {
			window.location.hash = location.hash;
		}

	} else if (mw.config.get('wgNamespaceNumber') === mw.config.get('wgNamespaceIds').user &&
			mw.config.get('wgTitle').indexOf(mw.config.get('wgUserName')) === 0 &&
			mw.config.get('wgPageName').slice(-3) === '.js') {

		var box = document.createElement('div');
		box.setAttribute('id', 'twinkleglobal-config-headerbox');
		box.style.border = '1px #f60 solid';
		box.style.background = '#fed';
		box.style.padding = '0.6em';
		box.style.margin = '0.5em auto';
		box.style.textAlign = 'center';

		var link,
			scriptPageName = mw.config.get('wgPageName').slice(mw.config.get('wgPageName').lastIndexOf('/') + 1,
				mw.config.get('wgPageName').lastIndexOf('.js'));

		if (TwinkleGlobal.getPref('onConfigSite') && scriptPageName === TwinkleGlobal.defaultConfig.optionsPage) {
			// place "why not try the preference panel" notice
			box.style.fontWeight = 'bold';
			box.style.width = '80%';
			box.style.borderWidth = '2px';

			if (mw.config.get('wgArticleId') > 0) {  // page exists
				box.appendChild(document.createTextNode('This page contains your TwinkleGlobal preferences. You can change them using the '));
			} else {  // page does not exist
				box.appendChild(document.createTextNode('You can customize TwinkleGlobal to suit your preferences by using the '));
			}
			link = document.createElement('a');
			link.setAttribute('href', TwinkleGlobal.getPref('configPage'));
			link.appendChild(document.createTextNode('TwinkleGlobal preferences panel'));
			box.appendChild(link);
			box.appendChild(document.createTextNode(', or by editing this page.'));
			$(box).insertAfter($('#contentSub'));

		} else if (['monobook', 'vector', 'vector-2022', 'cologneblue', 'modern', 'timeless', 'minerva', 'common', 'global'].indexOf(scriptPageName) !== -1 ||
				scriptPageName === TwinkleGlobal.defaultConfig.optionsPage) {
			// place "Looking for Twinkle options?" notice
			box.style.width = '60%';

			box.appendChild(document.createTextNode('If you want to set TwinkleGlobal preferences, you can use the '));
			link = document.createElement('a');
			link.setAttribute('href', TwinkleGlobal.getPref('configPage'));
			link.appendChild(document.createTextNode('TwinkleGlobal preferences panel'));
			box.appendChild(link);
			box.appendChild(document.createTextNode('.'));
			$(box).insertAfter($('#contentSub'));
		}
	}
};

// MorebitsGlobal.wiki.page callback from init code
TwinkleGlobal.config.legacyPrefsNotice = function twinkleconfigLegacyPrefsNotice(pageobj) {
	var text = pageobj.getPageText();
	var contentnotice = pageobj.getCallbackParameters();
	if (text.indexOf('TwinkleConfig') !== -1 || text.indexOf('FriendlyConfig') !== -1) {
		contentnotice.innerHTML = '<table class="plainlinks ombox ombox-content"><tr><td class="mbox-image">' +
			'<img alt="" src="http://upload.wikimedia.org/wikipedia/en/3/38/Imbox_content.png" /></td>' +
			'<td class="mbox-text"><p><big><b>Before modifying your settings here,</b> you must remove your old Twinkle and Friendly settings from your personal skin JavaScript.</big></p>' +
			'<p>To do this, you can <a href="' + mw.config.get('wgScript') + '?title=User:' + encodeURIComponent(mw.config.get('wgUserName')) + '/' + mw.config.get('skin') + '.js&action=edit" target="_blank"><b>edit your personal JavaScript</b></a>, removing all lines of code that refer to <code>TwinkleConfig</code> and <code>FriendlyConfig</code>.</p>' +
			'</td></tr></table>';
	} else {
		$(contentnotice).remove();
	}
};

// custom list-related stuff

TwinkleGlobal.config.listDialog = {};

TwinkleGlobal.config.listDialog.addRow = function twinkleconfigListDialogAddRow(dlgtable, value, label) {
	var contenttr = document.createElement('tr');
	// "remove" button
	var contenttd = document.createElement('td');
	var removeButton = document.createElement('button');
	removeButton.setAttribute('type', 'button');
	removeButton.addEventListener('click', function() {
		$(contenttr).remove();
	}, false);
	removeButton.textContent = 'Remove';
	contenttd.appendChild(removeButton);
	contenttr.appendChild(contenttd);

	// value input box
	contenttd = document.createElement('td');
	var input = document.createElement('input');
	input.setAttribute('type', 'text');
	input.className = 'twinkleglobal-config-customlist-value';
	input.style.width = '97%';
	if (value) {
		input.setAttribute('value', value);
	}
	contenttd.appendChild(input);
	contenttr.appendChild(contenttd);

	// label input box
	contenttd = document.createElement('td');
	input = document.createElement('input');
	input.setAttribute('type', 'text');
	input.className = 'twinkleglobal-config-customlist-label';
	input.style.width = '98%';
	if (label) {
		input.setAttribute('value', label);
	}
	contenttd.appendChild(input);
	contenttr.appendChild(contenttd);

	dlgtable.appendChild(contenttr);
};

TwinkleGlobal.config.listDialog.display = function twinkleconfigListDialogDisplay(e) {
	var $prefbutton = $(e.target);
	var curvalue = $prefbutton.data('value');
	var curpref = $prefbutton.data('pref');

	var dialog = new MorebitsGlobal.simpleWindow(720, 400);
	dialog.setTitle(curpref.label);
	dialog.setScriptName('Twinkle preferences');

	var dialogcontent = document.createElement('div');
	var dlgtable = document.createElement('table');
	dlgtable.className = 'wikitable';
	dlgtable.style.margin = '1.4em 1em';
	dlgtable.style.width = 'auto';

	var dlgtbody = document.createElement('tbody');

	// header row
	var dlgtr = document.createElement('tr');
	// top-left cell
	var dlgth = document.createElement('th');
	dlgth.style.width = '5%';
	dlgtr.appendChild(dlgth);
	// value column header
	dlgth = document.createElement('th');
	dlgth.style.width = '35%';
	dlgth.textContent = curpref.customListValueTitle ? curpref.customListValueTitle : 'Value';
	dlgtr.appendChild(dlgth);
	// label column header
	dlgth = document.createElement('th');
	dlgth.style.width = '60%';
	dlgth.textContent = curpref.customListLabelTitle ? curpref.customListLabelTitle : 'Label';
	dlgtr.appendChild(dlgth);
	dlgtbody.appendChild(dlgtr);

	// content rows
	var gotRow = false;
	$.each(curvalue, function(k, v) {
		gotRow = true;
		TwinkleGlobal.config.listDialog.addRow(dlgtbody, v.value, v.label);
	});
	// if there are no values present, add a blank row to start the user off
	if (!gotRow) {
		TwinkleGlobal.config.listDialog.addRow(dlgtbody);
	}

	// final "add" button
	var dlgtfoot = document.createElement('tfoot');
	dlgtr = document.createElement('tr');
	var dlgtd = document.createElement('td');
	dlgtd.setAttribute('colspan', '3');
	var addButton = document.createElement('button');
	addButton.style.minWidth = '8em';
	addButton.setAttribute('type', 'button');
	addButton.addEventListener('click', function() {
		TwinkleGlobal.config.listDialog.addRow(dlgtbody);
	}, false);
	addButton.textContent = 'Add';
	dlgtd.appendChild(addButton);
	dlgtr.appendChild(dlgtd);
	dlgtfoot.appendChild(dlgtr);

	dlgtable.appendChild(dlgtbody);
	dlgtable.appendChild(dlgtfoot);
	dialogcontent.appendChild(dlgtable);

	// buttonpane buttons: [Save changes] [Reset] [Cancel]
	var button = document.createElement('button');
	button.setAttribute('type', 'submit');  // so MorebitsGlobal.simpleWindow puts the button in the button pane
	button.addEventListener('click', function() {
		TwinkleGlobal.config.listDialog.save($prefbutton, dlgtbody);
		dialog.close();
	}, false);
	button.textContent = 'Save changes';
	dialogcontent.appendChild(button);
	button = document.createElement('button');
	button.setAttribute('type', 'submit');  // so MorebitsGlobal.simpleWindow puts the button in the button pane
	button.addEventListener('click', function() {
		TwinkleGlobal.config.listDialog.reset($prefbutton, dlgtbody);
	}, false);
	button.textContent = 'Reset';
	dialogcontent.appendChild(button);
	button = document.createElement('button');
	button.setAttribute('type', 'submit');  // so MorebitsGlobal.simpleWindow puts the button in the button pane
	button.addEventListener('click', function() {
		dialog.close();  // the event parameter on this function seems to be broken
	}, false);
	button.textContent = 'Cancel';
	dialogcontent.appendChild(button);

	dialog.setContent(dialogcontent);
	dialog.display();
};

// Resets the data value, re-populates based on the new (default) value, then saves the
// old data value again (less surprising behaviour)
TwinkleGlobal.config.listDialog.reset = function twinkleconfigListDialogReset(button, tbody) {
	// reset value on button
	var $button = $(button);
	var curpref = $button.data('pref');
	var oldvalue = $button.data('value');
	TwinkleGlobal.config.resetPref(curpref);

	// reset form
	var $tbody = $(tbody);
	$tbody.find('tr').slice(1).remove();  // all rows except the first (header) row
	// add the new values
	var curvalue = $button.data('value');
	$.each(curvalue, function(k, v) {
		TwinkleGlobal.config.listDialog.addRow(tbody, v.value, v.label);
	});

	// save the old value
	$button.data('value', oldvalue);
};

TwinkleGlobal.config.listDialog.save = function twinkleconfigListDialogSave(button, tbody) {
	var result = [];
	var current = {};
	$(tbody).find('input[type="text"]').each(function(inputkey, input) {
		if ($(input).hasClass('twinkleglobal-config-customlist-value')) {
			current = { value: input.value };
		} else {
			current.label = input.value;
			// exclude totally empty rows
			if (current.value || current.label) {
				result.push(current);
			}
		}
	});
	$(button).data('value', result);
};

// reset/restore defaults

TwinkleGlobal.config.resetPrefLink = function twinkleconfigResetPrefLink(e) {
	var wantedpref = e.target.id.substring(27); // "twinkleglobal-config-reset-" prefix is stripped

	// search tactics
	$(TwinkleGlobal.config.sections).each(function(sectionkey, section) {
		if (section.hidden || (section.adminOnly && !MorebitsGlobal.userIsSysop)) {
			return true;  // continue: skip impossibilities
		}

		var foundit = false;

		$(section.preferences).each(function(prefkey, pref) {
			if (pref.name !== wantedpref) {
				return true;  // continue
			}
			TwinkleGlobal.config.resetPref(pref);
			foundit = true;
			return false;  // break
		});

		if (foundit) {
			return false;  // break
		}
	});
	return false;  // stop link from scrolling page
};

TwinkleGlobal.config.resetPref = function twinkleconfigResetPref(pref) {
	switch (pref.type) {

		case 'boolean':
			document.getElementById(pref.name).checked = TwinkleGlobal.defaultConfig[pref.name];
			break;

		case 'string':
		case 'integer':
		case 'enum':
			document.getElementById(pref.name).value = TwinkleGlobal.defaultConfig[pref.name];
			break;

		case 'set':
			$.each(pref.setValues, function(itemkey) {
				if (document.getElementById(pref.name + '_' + itemkey)) {
					document.getElementById(pref.name + '_' + itemkey).checked = TwinkleGlobal.defaultConfig[pref.name].indexOf(itemkey) !== -1;
				}
			});
			break;

		case 'customList':
			$(document.getElementById(pref.name)).data('value', TwinkleGlobal.defaultConfig[pref.name]);
			break;

		default:
			alert('twinkleconfig: unknown data type for preference ' + pref.name);
			break;
	}
};

TwinkleGlobal.config.resetAllPrefs = function twinkleconfigResetAllPrefs() {
	// no confirmation message - the user can just refresh/close the page to abort
	$(TwinkleGlobal.config.sections).each(function(sectionkey, section) {
		if (section.hidden || (section.adminOnly && !MorebitsGlobal.userIsSysop)) {
			return true;  // continue: skip impossibilities
		}
		$(section.preferences).each(function(prefkey, pref) {
			if (!pref.adminOnly || MorebitsGlobal.userIsSysop) {
				TwinkleGlobal.config.resetPref(pref);
			}
		});
		return true;
	});
	return false;  // stop link from scrolling page
};

TwinkleGlobal.config.save = function twinkleconfigSave(e) {
	MorebitsGlobal.status.init(document.getElementById('twinkleglobal-config-content'));

	var userjs = mw.config.get('wgFormattedNamespaces')[mw.config.get('wgNamespaceIds').user] + ':' + mw.config.get('wgUserName') + '/' + TwinkleGlobal.defaultConfig.optionsPage + '.js';
	var wikipedia_page = new MorebitsGlobal.wiki.page(userjs, 'Saving preferences to ' + userjs);
	wikipedia_page.setCallbackParameters(e.target);
	wikipedia_page.load(TwinkleGlobal.config.writePrefs);

	return false;
};

TwinkleGlobal.config.writePrefs = function twinkleconfigWritePrefs(pageobj) {
	var form = pageobj.getCallbackParameters();

	// this is the object which gets serialized into JSON; only
	// preferences that this script knows about are kept
	var newConfig = {optionsVersion: 2};

	// a comparison function is needed later on
	// it is just enough for our purposes (i.e. comparing strings, numbers, booleans,
	// arrays of strings, and arrays of { value, label })
	// and it is not very robust: e.g. compare([2], ["2"]) === true, and
	// compare({}, {}) === false, but it's good enough for our purposes here
	var compare = function(a, b) {
		if (Array.isArray(a)) {
			if (a.length !== b.length) {
				return false;
			}
			var asort = a.sort(), bsort = b.sort();
			for (var i = 0; asort[i]; ++i) {
				// comparison of the two properties of custom lists
				if ((typeof asort[i] === 'object') && (asort[i].label !== bsort[i].label ||
					asort[i].value !== bsort[i].value)) {
					return false;
				} else if (asort[i].toString() !== bsort[i].toString()) {
					return false;
				}
			}
			return true;
		}
		return a === b;

	};

	$(TwinkleGlobal.config.sections).each(function(sectionkey, section) {
		if (section.adminOnly && !MorebitsGlobal.userIsSysop) {
			return;  // i.e. "continue" in this context
		}

		// reach each of the preferences from the form
		$(section.preferences).each(function(prefkey, pref) {
			var userValue;  // = undefined

			// only read form values for those prefs that have them
			if (!pref.adminOnly || MorebitsGlobal.userIsSysop) {
				if (!section.hidden) {
					switch (pref.type) {
						case 'boolean':  // read from the checkbox
							userValue = form[pref.name].checked;
							break;

						case 'string':  // read from the input box or combo box
						case 'enum':
							userValue = form[pref.name].value;
							break;

						case 'integer':  // read from the input box
							userValue = parseInt(form[pref.name].value, 10);
							if (isNaN(userValue)) {
								MorebitsGlobal.status.warn('Saving', 'The value you specified for ' + pref.name + ' (' + pref.value + ') was invalid.  The save will continue, but the invalid data value will be skipped.');
								userValue = null;
							}
							break;

						case 'set':  // read from the set of check boxes
							userValue = [];
							if (pref.setDisplayOrder) {
							// read only those keys specified in the display order
								$.each(pref.setDisplayOrder, function(itemkey, item) {
									if (form[pref.name + '_' + item].checked) {
										userValue.push(item);
									}
								});
							} else {
							// read all the keys in the list of values
								$.each(pref.setValues, function(itemkey) {
									if (form[pref.name + '_' + itemkey].checked) {
										userValue.push(itemkey);
									}
								});
							}
							break;

						case 'customList':  // read from the jQuery data stored on the button object
							userValue = $(form[pref.name]).data('value');
							break;

						default:
							alert('twinkleconfig: unknown data type for preference ' + pref.name);
							break;
					}
				} else if (TwinkleGlobal.prefs) {
					// Retain the hidden preferences that may have customised by the user from twinkleoptions.js
					// undefined if not set
					userValue = TwinkleGlobal.prefs[pref.name];
				}
			}

			// only save those preferences that are *different* from the default
			if (userValue !== undefined && !compare(userValue, TwinkleGlobal.defaultConfig[pref.name])) {
				newConfig[pref.name] = userValue;
			}
		});
	});

	var text =
		'// ' + TwinkleGlobal.defaultConfig.optionsPage + '.js: personal Twinkle preferences file\n' +
		'//\n' +
		'// NOTE: The easiest way to change your Twinkle preferences is by using the\n' +
		'// Twinkle preferences panel, at [[' + MorebitsGlobal.pageNameNorm + ']].\n' +
		'//\n' +
		'// This file is AUTOMATICALLY GENERATED.  Any changes you make (aside from\n' +
		'// changing the configuration parameters in a valid-JavaScript way) will be\n' +
		'// overwritten the next time you click "save" in the Twinkle preferences\n' +
		'// panel.  If modifying this file, make sure to use correct JavaScript.\n' +
		'// <no' + 'wiki>\n' +
		'\n' +
		'window.TwinkleGlobal.prefs = ';
	text += JSON.stringify(newConfig, null, 2);
	text +=
		';\n' +
		'\n' +
		'// </no' + 'wiki>\n' +
		'// End of ' + TwinkleGlobal.defaultConfig.optionsPage + '.js\n';

	pageobj.setPageText(text);
	pageobj.setEditSummary('Saving Twinkle preferences: automatic edit from [[:' + MorebitsGlobal.pageNameNorm + ']]' + TwinkleGlobal.getPref('summaryAd'));
	pageobj.setCreateOption('recreate');
	pageobj.save(TwinkleGlobal.config.saveSuccess);
};

TwinkleGlobal.config.saveSuccess = function twinkleconfigSaveSuccess(pageobj) {
	pageobj.getStatusElement().info('successful');

	var noticebox = document.createElement('div');
	noticebox.className = 'mw-message-box mw-message-box-success';
	noticebox.style.fontSize = '100%';
	noticebox.style.marginTop = '2em';
	noticebox.innerHTML = '<p><b>Your Twinkle preferences have been saved.</b></p><p>To see the changes, you will need to <b>clear your browser cache entirely</b> (see <a href="' + mw.util.getUrl('WP:BYPASS') + '" title="WP:BYPASS">WP:BYPASS</a> for instructions).</p>';
	MorebitsGlobal.status.root.appendChild(noticebox);
	var noticeclear = document.createElement('br');
	noticeclear.style.clear = 'both';
	MorebitsGlobal.status.root.appendChild(noticeclear);
};
})(jQuery);


// </nowiki>
