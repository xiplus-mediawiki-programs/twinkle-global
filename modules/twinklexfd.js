// <nowiki>


(function($) {


/*
 ****************************************
 *** twinklexfd.js: XFD module
 ****************************************
 * Mode of invocation:     Tab ("XFD")
 * Active on:              Existing, non-special pages, except for file pages with no local (non-Commons) file which are not redirects
 */

TwinkleGlobal.xfd = function twinklexfd() {
	// Disable on:
	// * special pages
	// * non-existent pages
	// * files on Commons, whether there is a local page or not (unneeded local pages of files on Commons are eligible for CSD F2, or R4 if it's a redirect)
	if (mw.config.get('wgNamespaceNumber') < 0 || !mw.config.get('wgArticleId') || (mw.config.get('wgNamespaceNumber') === 6 && document.getElementById('mw-sharedupload'))) {
		return;
	}
	TwinkleGlobal.addPortletLink(TwinkleGlobal.xfd.callback, 'XFD', 'twg-xfd', 'Start a deletion discussion');
};

TwinkleGlobal.xfd.num2order = function twinklexfdNum2order(num) {
	switch (num) {
		case 1: return '';
		case 2: return '2nd';
		case 3: return '3rd';
		default: return num + 'th';
	}
};

TwinkleGlobal.xfd.currentRationale = null;

// error callback on MorebitsGlobal.status.object
TwinkleGlobal.xfd.printRationale = function twinklexfdPrintRationale() {
	if (TwinkleGlobal.xfd.currentRationale) {
		MorebitsGlobal.status.printUserText(TwinkleGlobal.xfd.currentRationale, 'Your deletion rationale is provided below, which you can copy and paste into a new XFD dialog if you wish to try again:');
		// only need to print the rationale once
		TwinkleGlobal.xfd.currentRationale = null;
	}
};

TwinkleGlobal.xfd.callback = function twinklexfdCallback() {
	var Window = new MorebitsGlobal.simpleWindow(600, 350);
	Window.setTitle('Start a deletion discussion (XfD)');
	Window.setScriptName('Twinkle');
	Window.addFooterLink('About deletion discussions', 'WP:XFD');
	Window.addFooterLink('Twinkle help', 'WP:TW/DOC#xfd');

	var form = new MorebitsGlobal.quickForm(TwinkleGlobal.xfd.callback.evaluate);
	var categories = form.append({
		type: 'select',
		name: 'category',
		label: 'Deletion discussion venue:',
		tooltip: 'When activated, a default choice is made, based on what namespace you are in. This default should be the most appropriate',
		event: TwinkleGlobal.xfd.callback.change_category
	});
	var namespace = mw.config.get('wgNamespaceNumber');

	categories.append({
		type: 'option',
		label: 'AfD (Articles for deletion)',
		selected: namespace === 0,  // Main namespace
		value: 'afd'
	});
	categories.append({
		type: 'option',
		label: 'TfD (Templates for discussion)',
		selected: [ 10, 828 ].indexOf(namespace) !== -1,  // Template and module namespaces
		value: 'tfd'
	});
	categories.append({
		type: 'option',
		label: 'FfD (Files for discussion)',
		selected: namespace === 6,  // File namespace
		value: 'ffd'
	});
	categories.append({
		type: 'option',
		label: 'CfD (Categories for discussion)',
		selected: namespace === 14,  // Category namespace
		value: 'cfd'
	});
	categories.append({
		type: 'option',
		label: 'CfD/S (Categories for speedy renaming)',
		value: 'cfds'
	});
	categories.append({
		type: 'option',
		label: 'MfD (Miscellany for deletion)',
		selected: [ 0, 6, 10, 14, 828 ].indexOf(namespace) === -1 || MorebitsGlobal.pageNameNorm.indexOf('Template:User ', 0) === 0,
		// Other namespaces, and userboxes in template namespace
		value: 'mfd'
	});
	categories.append({
		type: 'option',
		label: 'RfD (Redirects for discussion)',
		selected: MorebitsGlobal.wiki.isPageRedirect(),
		value: 'rfd'
	});
	form.append({
		type: 'checkbox',
		list: [
			{
				label: 'Notify page creator if possible',
				value: 'notify',
				name: 'notify',
				tooltip: "A notification template will be placed on the creator's talk page if this is true.",
				checked: true
			}
		]
	});
	form.append({
		type: 'field',
		label: 'Work area',
		name: 'work_area'
	});

	var previewlink = document.createElement('a');
	$(previewlink).click(function() {
		TwinkleGlobal.xfd.callbacks.preview(result);  // |result| is defined below
	});
	previewlink.style.cursor = 'pointer';
	previewlink.textContent = 'Preview';
	form.append({ type: 'div', id: 'xfdpreview', label: [ previewlink ] });
	form.append({ type: 'div', id: 'twinklexfd-previewbox', style: 'display: none' });

	form.append({ type: 'submit' });

	var result = form.render();
	Window.setContent(result);
	Window.display();
	result.previewer = new MorebitsGlobal.wiki.preview($(result).find('div#twinklexfd-previewbox').last()[0]);

	// We must init the controls
	var evt = document.createEvent('Event');
	evt.initEvent('change', true, true);
	result.category.dispatchEvent(evt);
};

TwinkleGlobal.xfd.previousNotify = true;

TwinkleGlobal.xfd.callback.change_category = function twinklexfdCallbackChangeCategory(e) {
	var value = e.target.value;
	var form = e.target.form;
	var old_area = MorebitsGlobal.quickForm.getElements(e.target.form, 'work_area')[0];
	var work_area = null;

	var oldreasontextbox = form.getElementsByTagName('textarea')[0];
	var oldreason = oldreasontextbox ? oldreasontextbox.value : '';

	var appendReasonBox = function twinklexfdAppendReasonBox() {
		work_area.append({
			type: 'textarea',
			name: 'xfdreason',
			label: 'Reason: ',
			value: oldreason,
			tooltip: 'You can use wikimarkup in your reason. Twinkle will automatically sign your post.'
		});
	};

	form.previewer.closePreview();

	switch (value) {
		case 'afd':
			work_area = new MorebitsGlobal.quickForm.element({
				type: 'field',
				label: 'Articles for deletion',
				name: 'work_area'
			});
			work_area.append({
				type: 'checkbox',
				list: [
					{
						label: 'Wrap deletion tag with <noinclude>',
						value: 'noinclude',
						name: 'noinclude',
						tooltip: 'Will wrap the deletion tag in &lt;noinclude&gt; tags, so that it won\'t transclude. This option is not normally required.'
					}
				]
			});
			var afd_category = work_area.append({
				type: 'select',
				name: 'xfdcat',
				label: 'Choose what category this nomination belongs in:'
			});

			afd_category.append({ type: 'option', label: 'Unknown', value: '?', selected: true });
			afd_category.append({ type: 'option', label: 'Media and music', value: 'M' });
			afd_category.append({ type: 'option', label: 'Organisation, corporation, or product', value: 'O' });
			afd_category.append({ type: 'option', label: 'Biographical', value: 'B' });
			afd_category.append({ type: 'option', label: 'Society topics', value: 'S' });
			afd_category.append({ type: 'option', label: 'Web or internet', value: 'W' });
			afd_category.append({ type: 'option', label: 'Games or sports', value: 'G' });
			afd_category.append({ type: 'option', label: 'Science and technology', value: 'T' });
			afd_category.append({ type: 'option', label: 'Fiction and the arts', value: 'F' });
			afd_category.append({ type: 'option', label: 'Places and transportation', value: 'P' });
			afd_category.append({ type: 'option', label: 'Indiscernible or unclassifiable topic', value: 'I' });
			afd_category.append({ type: 'option', label: 'Debate not yet sorted', value: 'U' });

			// delsort categories list copied off [[User:Enterprisey/delsort.js]], originally taken from [[WP:DS/C]]
			var delsortCategories = {
				'People': ['People', 'Academics and educators', 'Actors and filmmakers', 'Artists', 'Authors', 'Bands and musicians', 'Businesspeople', 'Politicians', 'Sportspeople', 'Women', 'Lists of people'],
				'Arts': ['Arts', 'Fictional elements', 'Science fiction'],
				'Arts/Culinary': ['Food and drink', 'Wine'],
				'Arts/Language': ['Language', 'Academic journals', 'Bibliographies', 'Journalism', 'Literature', 'Logic', 'News media', 'Philosophy', 'Poetry'],
				'Arts/Performing': ['Albums and songs', 'Dance', 'Film', 'Magic', 'Music', 'Radio', 'Television', 'Theatre', 'Video games'],
				'Arts/Visual arts': ['Visual arts', 'Architecture', 'Fashion', 'Photography'],
				'Arts/Comics and animation': ['Comics and animation', 'Anime and manga', 'Webcomics'],
				'Places of interest': ['Museums and libraries', 'Shopping malls'],
				'Topical': ['Animal', 'Bilateral relations', 'Business', 'Conservatism', 'Conspiracy theories', 'Crime', 'Disability', 'Discrimination', 'Ethnic groups', 'Events', 'Games', 'Health and fitness', 'History', 'Law', 'Military', 'Organizations', 'Paranormal', 'Piracy', 'Politics', 'Terrorism'],
				'Topical/Business': ['Business', 'Advertising', 'Companies', 'Management', 'Finance'],
				'Topical/Culture': ['Beauty pageants', 'Fashion', 'Mythology', 'Popular culture', 'Sexuality and gender'],
				'Topical/Education': ['Education', 'Fraternities and sororities', 'Schools'],
				'Topical/Religion': ['Religion', 'Atheism', 'Bible', 'Buddhism', 'Christianity', 'Islam', 'Judaism', 'Hinduism', 'Paganism', 'Sikhism', 'Spirituality'],
				'Topical/Science': ['Science', 'Archaeology', 'Astronomy', 'Behavioural science', 'Economics', 'Environment', 'Geography', 'Mathematics', 'Medicine', 'Organisms', 'Social science', 'Transportation'],
				'Topical/Sports': ['Sports', 'American football', 'Baseball', 'Basketball', 'Bodybuilding', 'Boxing', 'Cricket', 'Cycling', 'Football', 'Golf', 'Horse racing', 'Ice hockey', 'Rugby union', 'Softball', 'Martial arts', 'Wrestling'],
				'Topical/Technology': ['Technology', 'Aviation', 'Computing', 'Firearms', 'Internet', 'Software', 'Websites'],
				'Wikipedia page type': ['Disambiguations', 'Lists'],
				'Geographic/Africa': ['Africa', 'Egypt', 'Ethiopia', 'Ghana', 'Kenya', 'Laos', 'Mauritius', 'Morocco', 'Nigeria', 'Somalia', 'South Africa', 'Zimbabwe'],
				'Geographic/Asia': ['Asia', 'Afghanistan', 'Bangladesh', 'Bahrain', 'Brunei', 'Cambodia', 'China', 'Hong Kong', 'India', 'Indonesia', 'Japan', 'Korea', 'Malaysia', 'Maldives', 'Mongolia', 'Myanmar', 'Nepal', 'Pakistan', 'Philippines', 'Singapore', 'South Korea', 'Sri Lanka', 'Taiwan', 'Thailand', 'Vietnam'],
				'Geographic/Asia/Central Asia': ['Central Asia', 'Kazakhstan', 'Kyrgyzstan', 'Tajikistan', 'Turkmenistan', 'Uzbekistan'],
				'Geographic/Asia/Middle East': ['Middle East', 'Iran', 'Iraq', 'Israel', 'Jordan', 'Kuwait', 'Lebanon', 'Libya', 'Palestine', 'Saudi Arabia', 'Syria', 'United Arab Emirates', 'Yemen', 'Qatar'],
				'Geographic/Europe': ['Europe', 'Albania', 'Armenia', 'Austria', 'Azerbaijan', 'Belarus', 'Belgium', 'Bosnia and Herzegovina', 'Bulgaria', 'Croatia', 'Cyprus', 'Czech Republic', 'Denmark', 'Estonia', 'Finland', 'France', 'Georgia (country)', 'Germany', 'Greece', 'Hungary', 'Iceland', 'Ireland', 'Italy', 'Jersey', 'Kosovo', 'Latvia', 'Lithuania', 'Luxembourg', 'Macedonia', 'Malta', 'Moldova', 'Montenegro', 'Netherlands', 'Norway', 'Poland', 'Portugal', 'Romania', 'Russia', 'Serbia', 'Slovakia', 'Slovenia', 'Spain', 'Sweden', 'Switzerland', 'Turkey', 'Ukraine', 'Yugoslavia'],
				'Geographic/Europe/United Kingdom': ['United Kingdom', 'England', 'Northern Ireland', 'Scotland', 'Wales'],
				'Geographic/Oceania': ['Oceania', 'Antarctica', 'Australia', 'New Zealand'],
				'Geographic/Americas/Canada': ['Canada', 'British Columbia', 'Manitoba', 'Nova Scotia', 'Ontario', 'Quebec', 'Alberta'],
				'Geographic/Americas/Latin America': ['Latin America', 'Caribbean', 'South America', 'Argentina', 'Barbados', 'Belize', 'Bolivia', 'Brazil', 'Chile', 'Colombia', 'Cuba', 'Ecuador', 'El Salvador', 'Guatemala', 'Haiti', 'Mexico', 'Nicaragua', 'Panama', 'Paraguay', 'Peru', 'Puerto Rico', 'Trinidad and Tobago', 'Uruguay', 'Venezuela', 'Grenada'],
				'Geographic/Americas/USA': ['United States of America', 'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia (U.S. state)', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'Washington, D.C.', 'West Virginia', 'Wisconsin', 'Wyoming'],
				'Geographic/Unsorted': ['Islands']
			};

			var delsort = work_area.append({
				type: 'select',
				multiple: true,
				name: 'delsort',
				label: 'Choose deletion sorting categories: ',
				tooltip: 'Select a few categories that are relevant to the subject of the article'
			});

			$.each(delsortCategories, function(groupname, list) {
				var group = delsort.append({ type: 'optgroup', label: groupname });
				list.forEach(function(item) {
					group.append({ type: 'option', label: item, value: item });
				});
			});

			appendReasonBox();
			work_area = work_area.render();
			old_area.parentNode.replaceChild(work_area, old_area);

			$(work_area).find('[name=delsort]')
				.attr('data-placeholder', 'Select delsort pages')
				.chosen({width: '100%'});

			// Reduce padding
			mw.util.addCSS('.morebitsglobal-dialog .chosen-drop .chosen-results li { padding-top: 2px; padding-bottom: 2px; }');

			break;
		case 'tfd':
			work_area = new MorebitsGlobal.quickForm.element({
				type: 'field',
				label: 'Templates for discussion',
				name: 'work_area'
			});
			work_area.append({
				type: 'div',
				label: 'Stub types and userboxes are not eligible for TfD. Stub types go to CfD, and userboxes go to MfD.'
			});
			var templateOrModule = mw.config.get('wgPageContentModel') === 'Scribunto' ? 'module' : 'template';
			var tfd_category = work_area.append({
				type: 'select',
				label: 'Choose type of action wanted: ',
				name: 'xfdcat',
				event: function(e) {
					var target = e.target;
					// add/remove extra input box
					if (target.value === 'tfm' && !target.form.xfdtarget) { // $(target.parentNode).find("input[name='xfdtarget']").length === 0 ) {
						var xfdtarget = new MorebitsGlobal.quickForm.element({
							name: 'xfdtarget',
							type: 'input',
							label: 'Other ' + templateOrModule + ' to be merged: '
						});
						target.parentNode.appendChild(xfdtarget.render());
					} else {
						$(MorebitsGlobal.quickForm.getElementContainer(target.form.xfdtarget)).remove();
						target.form.xfdtarget = null;
						// $(target.parentNode).find("input[name='xfdtarget']").remove();
					}
				}
			});
			tfd_category.append({ type: 'option', label: 'Deletion', value: 'tfd', selected: true });
			tfd_category.append({ type: 'option', label: 'Merge', value: 'tfm' });

			var tfd_template_type = work_area.append({
				type: 'select',
				name: 'templatetype',
				label: 'Deletion tag display style: ',
				tooltip: 'Which <code>type=</code> parameter to pass to the TfD tag template.'
			});
			if (templateOrModule === 'module') {
				tfd_template_type.append({ type: 'option', value: 'module', label: 'Module', selected: true });
			} else {
				tfd_template_type.append({ type: 'option', value: 'standard', label: 'Standard', selected: true });
				tfd_template_type.append({ type: 'option', value: 'sidebar', label: 'Sidebar/infobox', selected: $('.infobox').length });
				tfd_template_type.append({ type: 'option', value: 'inline', label: 'Inline template' });
				tfd_template_type.append({ type: 'option', value: 'tiny', label: 'Tiny inline' });
			}

			work_area.append({
				type: 'checkbox',
				list: [
					{
						label: 'Wrap deletion tag with <noinclude> (for substituted templates only)',
						value: 'noinclude',
						name: 'noinclude',
						tooltip: 'Will wrap the deletion tag in &lt;noinclude&gt; tags, so that it won\'t get substituted along with the template.',
						disabled: templateOrModule === 'module',
						checked: !!$('.box-Subst_only').length // Default to checked if page carries {{subst only}}
					}
				]
			});

			appendReasonBox();
			work_area = work_area.render();
			old_area.parentNode.replaceChild(work_area, old_area);
			break;
		case 'mfd':
			work_area = new MorebitsGlobal.quickForm.element({
				type: 'field',
				label: 'Miscellany for deletion',
				name: 'work_area'
			});
			work_area.append({
				type: 'checkbox',
				list: [
					{
						label: 'Wrap deletion tag with <noinclude>',
						value: 'noinclude',
						name: 'noinclude',
						tooltip: 'Will wrap the deletion tag in &lt;noinclude&gt; tags, so that it won\'t transclude. Select this option for userboxes.'
					}
				]
			});
			if (mw.config.get('wgNamespaceNumber') === 2 /* User: */ || mw.config.get('wgNamespaceNumber') === 3 /* User talk: */) {
				work_area.append({
					type: 'checkbox',
					list: [
						{
							label: 'Also notify owner of userspace if they are not the page creator',
							value: 'notifyuserspace',
							name: 'notifyuserspace',
							tooltip: 'If the user in whose userspace this page is located, is not the page creator (for example, the page is a rescued article stored as a userspace draft), notify the userspace owner as well.',
							checked: true
						}
					]
				});
			}
			appendReasonBox();
			work_area = work_area.render();
			old_area.parentNode.replaceChild(work_area, old_area);
			break;
		case 'ffd':
			work_area = new MorebitsGlobal.quickForm.element({
				type: 'field',
				label: 'Discussion venues for files',
				name: 'work_area'
			});
			appendReasonBox();
			work_area = work_area.render();
			old_area.parentNode.replaceChild(work_area, old_area);
			break;
		case 'cfd':
			work_area = new MorebitsGlobal.quickForm.element({
				type: 'field',
				label: 'Categories for discussion',
				name: 'work_area'
			});
			var cfd_category = work_area.append({
				type: 'select',
				label: 'Choose type of action wanted: ',
				name: 'xfdcat',
				event: function(e) {
					var value = e.target.value;
					var target = e.target.form.xfdtarget;
					// update enabled status
					if (value === 'cfd') {
						target.disabled = true;
					} else {
						target.disabled = false;
					}
					// update label
					if (value === 'cfs') {
						target.previousSibling.textContent = 'Target categories: ';
					} else if (value === 'cfc') {
						target.previousSibling.textContent = 'Target article: ';
					} else {
						target.previousSibling.textContent = 'Target category: ';
					}
					// add/remove extra input box
					if (value === 'cfs' && $(target.parentNode).find("input[name='xfdtarget2']").length === 0) {
						var xfdtarget2 = document.createElement('input');
						xfdtarget2.setAttribute('name', 'xfdtarget2');
						xfdtarget2.setAttribute('type', 'text');
						target.parentNode.appendChild(xfdtarget2);
					} else {
						$(target.parentNode).find("input[name='xfdtarget2']").remove();
					}
				}
			});
			cfd_category.append({ type: 'option', label: 'Deletion', value: 'cfd', selected: true });
			cfd_category.append({ type: 'option', label: 'Merge', value: 'cfm' });
			cfd_category.append({ type: 'option', label: 'Renaming', value: 'cfr' });
			cfd_category.append({ type: 'option', label: 'Split', value: 'cfs' });
			cfd_category.append({ type: 'option', label: 'Convert into article', value: 'cfc' });

			work_area.append({
				type: 'input',
				name: 'xfdtarget',
				label: 'Target page: ',
				disabled: true,
				value: ''
			});
			appendReasonBox();
			work_area = work_area.render();
			old_area.parentNode.replaceChild(work_area, old_area);
			break;
		case 'cfds':
			work_area = new MorebitsGlobal.quickForm.element({
				type: 'field',
				label: 'Categories for speedy renaming',
				name: 'work_area'
			});
			var cfds_category = work_area.append({
				type: 'select',
				label: 'C2 sub-criterion: ',
				name: 'xfdcat',
				tooltip: 'See WP:CFDS for full explanations.',
				event: function(e) {
					var value = e.target.value;
					var target = e.target.form.xfdtarget;
					if (value === 'cfd') {
						target.disabled = true;
					} else {
						target.disabled = false;
					}
				}
			});
			cfds_category.append({ type: 'option', label: 'C2A: Typographic and spelling fixes', value: 'C2A', selected: true });
			cfds_category.append({ type: 'option', label: 'C2B: Naming conventions and disambiguation', value: 'C2B' });
			cfds_category.append({ type: 'option', label: 'C2C: Consistency with names of similar categories', value: 'C2C' });
			cfds_category.append({ type: 'option', label: 'C2D: Rename to match article name', value: 'C2D' });
			cfds_category.append({ type: 'option', label: 'C2E: Author request', value: 'C2E' });

			work_area.append({
				type: 'input',
				name: 'xfdtarget',
				label: 'New name: ',
				value: ''
			});
			appendReasonBox();
			work_area = work_area.render();
			old_area.parentNode.replaceChild(work_area, old_area);
			break;
		case 'rfd':
			work_area = new MorebitsGlobal.quickForm.element({
				type: 'field',
				label: 'Redirects for discussion',
				name: 'work_area'
			});

			work_area.append({
				type: 'checkbox',
				list: [
					{
						label: 'Notify  target page if possible',
						value: 'relatedpage',
						name: 'relatedpage',
						tooltip: "A notification template will be placed on the talk page of this redirect's target if this is true.",
						checked: true
					}
				]
			});
			appendReasonBox();
			work_area = work_area.render();
			old_area.parentNode.replaceChild(work_area, old_area);
			break;
		default:
			work_area = new MorebitsGlobal.quickForm.element({
				type: 'field',
				label: 'Nothing for anything',
				name: 'work_area'
			});
			work_area = work_area.render();
			old_area.parentNode.replaceChild(work_area, old_area);
			break;
	}

	// No creator notification for CFDS
	if (value === 'cfds') {
		TwinkleGlobal.xfd.previousNotify = form.notify.checked;
		form.notify.checked = false;
		form.notify.disabled = true;
	} else {
		form.notify.checked = TwinkleGlobal.xfd.previousNotify;
		form.notify.disabled = false;
	}
};

TwinkleGlobal.xfd.setWatchPref = function twinklexfdsetWatchPref(pageobj, pref) {
	switch (pref) {
		case 'yes':
			pageobj.setWatchlist(true);
			break;
		case 'no':
			pageobj.setWatchlistFromPreferences(false);
			break;
		default:
			pageobj.setWatchlistFromPreferences(true);
			break;
	}
};

TwinkleGlobal.xfd.callbacks = {
	getDiscussionWikitext: function(venue, params) {
		if (venue === 'cfds') { // CfD/S takes a completely different style
			return '* [[:' + MorebitsGlobal.pageNameNorm + ']] to [[:' + params.target + ']]\u00A0\u2013 ' +
				params.xfdcat + (params.reason ? ': ' + MorebitsGlobal.string.formatReasonText(params.reason) : '.') + ' ~~~~';
			// U+00A0 NO-BREAK SPACE; U+2013 EN RULE
		}

		var text = '{{subst:' + venue + '2';
		var reasonKey = venue === 'ffd' ? 'Reason' : 'text';
		// Add a reason unconditionally, so that at least a signature is added
		if (params.reason) {
			text += '|' + reasonKey + '=' + MorebitsGlobal.string.formatReasonText(params.reason) + ' ~~~~';
		} else {
			text += '|' + reasonKey + '=~~~~';
		}

		if (venue === 'afd' || venue === 'mfd') {
			text += '|pg=' + MorebitsGlobal.pageNameNorm;
			if (venue === 'afd') {
				text += '|cat=' + params.xfdcat;
			}
		} else if (venue === 'rfd') {
			text += '|redirect=' + MorebitsGlobal.pageNameNorm;
		} else {
			text += '|1=' + mw.config.get('wgTitle');
			if (mw.config.get('wgPageContentModel') === 'Scribunto') {
				text += '|module=Module:';
			}
		}

		if (params.target) {
			if (venue === 'rfd') {
				text += '|target=' + params.target + (params.section ? '#' + params.section : '');
			} else if (venue !== 'cfd') {
				text += '|2=' + params.target;
			}
		}
		if (params.target2) {
			text += '|3=' + params.target2;
		}
		if (params.uploader) {
			text += '|Uploader=' + params.uploader;
		}

		text += '}}';

		if (params.delsort_cats) { // Only for AFDs
			params.delsort_cats.forEach(function (cat) {
				text += '\n{{subst:delsort|' + cat + '|~~~~}}';
			});
		}

		return text;
	},
	showPreview: function(form, venue, params) {
		var templatetext = TwinkleGlobal.xfd.callbacks.getDiscussionWikitext(venue, params);
		form.previewer.beginRender(templatetext, 'WP:TW'); // Force wikitext
	},
	preview: function(form) {
		var venue = form.category.value;
		var params = {
			reason: form.xfdreason.value
		};

		if (form.xfdcat) {
			params.xfdcat = form.xfdcat.value;
		}
		if (form.xfdtarget) {
			params.target = form.xfdtarget.value;
		}
		if (form.xfdtarget2) {
			params.target2 = form.xfdtarget2.value;
		}
		params.delsort_cats = $(form.delsort).val();

		if (venue === 'ffd') {
			// Fetch the uploader
			var page = new MorebitsGlobal.wiki.page(mw.config.get('wgPageName'));
			page.lookupCreation(function() {
				params.uploader = page.getCreator();
				TwinkleGlobal.xfd.callbacks.showPreview(form, venue, params);
			});
		} else if (venue === 'rfd') { // Find the target
			TwinkleGlobal.xfd.callbacks.rfd.findTarget(params, function(params) {
				TwinkleGlobal.xfd.callbacks.showPreview(form, venue, params);
			});
		} else if (venue === 'cfd') { // Swap in CfD subactions
			TwinkleGlobal.xfd.callbacks.showPreview(form, params.xfdcat, params);
		} else {
			TwinkleGlobal.xfd.callbacks.showPreview(form, venue, params);
		}
	},
	afd: {
		main: function(apiobj) {
			var xmlDoc = apiobj.responseXML;
			var titles = $(xmlDoc).find('allpages p');

			// There has been no earlier entries with this prefix, just go on.
			if (titles.length <= 0) {
				apiobj.params.numbering = apiobj.params.number = '';
			} else {
				var number = 0;
				for (var i = 0; i < titles.length; ++i) {
					var title = titles[i].getAttribute('title');

					// First, simple test, is there an instance with this exact name?
					if (title === 'Wikipedia:Articles for deletion/' + MorebitsGlobal.pageNameNorm) {
						number = Math.max(number, 1);
						continue;
					}

					var order_re = new RegExp('^' +
						RegExp.escape('Wikipedia:Articles for deletion/' + MorebitsGlobal.pageNameNorm, true) +
						'\\s*\\(\\s*(\\d+)(?:(?:th|nd|rd|st) nom(?:ination)?)?\\s*\\)\\s*$');
					var match = order_re.exec(title);

					// No match; A non-good value
					if (!match) {
						continue;
					}

					// A match, set number to the max of current
					number = Math.max(number, Number(match[1]));
				}
				apiobj.params.number = TwinkleGlobal.xfd.num2order(parseInt(number, 10) + 1);
				apiobj.params.numbering = number > 0 ? ' (' + apiobj.params.number + ' nomination)' : '';
			}
			apiobj.params.discussionpage = 'Wikipedia:Articles for deletion/' + MorebitsGlobal.pageNameNorm + apiobj.params.numbering;

			MorebitsGlobal.status.info('Next discussion page', '[[' + apiobj.params.discussionpage + ']]');

			// Updating data for the action completed event
			MorebitsGlobal.wiki.actionCompleted.redirect = apiobj.params.discussionpage;
			MorebitsGlobal.wiki.actionCompleted.notice = 'Nomination completed, now redirecting to the discussion page';

			// Tagging article
			var wikipedia_page = new MorebitsGlobal.wiki.page(mw.config.get('wgPageName'), 'Adding deletion tag to article');
			wikipedia_page.setFollowRedirect(true);  // should never be needed, but if the article is moved, we would want to follow the redirect
			wikipedia_page.setCallbackParameters(apiobj.params);
			wikipedia_page.load(TwinkleGlobal.xfd.callbacks.afd.taggingArticle);
		},
		// Tagging needs to happen before everything else: this means we can check if there is an AfD tag already on the page
		taggingArticle: function(pageobj) {
			var text = pageobj.getPageText();
			var params = pageobj.getCallbackParameters();
			var statelem = pageobj.getStatusElement();

			if (!pageobj.exists()) {
				statelem.error("It seems that the page doesn't exist; perhaps it has already been deleted");
				return;
			}

			// Check for existing AfD tag, for the benefit of new page patrollers
			var textNoAfd = text.replace(/<!--.*AfD.*\n\{\{(?:Article for deletion\/dated|AfDM).*\}\}\n<!--.*(?:\n<!--.*)?AfD.*(?:\s*\n)?/g, '');
			if (text !== textNoAfd) {
				if (confirm('An AfD tag was found on this article. Maybe someone beat you to it.  \nClick OK to replace the current AfD tag (not recommended), or Cancel to abandon your nomination.')) {
					text = textNoAfd;
				} else {
					statelem.error('Article already tagged with AfD tag, and you chose to abort');
					window.location.reload();
					return;
				}
			}

			// Now we know we want to go ahead with it, trigger the other AJAX requests

			// Mark the page as patrolled, if wanted
			if (TwinkleGlobal.getPref('markXfdPagesAsPatrolled')) {
				pageobj.patrol();
			}

			// Starting discussion page
			var wikipedia_page = new MorebitsGlobal.wiki.page(params.discussionpage, 'Creating article deletion discussion page');
			wikipedia_page.setCallbackParameters(params);
			wikipedia_page.load(TwinkleGlobal.xfd.callbacks.afd.discussionPage);

			// Today's list
			var date = new Date(pageobj.getLoadTime());
			wikipedia_page = new MorebitsGlobal.wiki.page('Wikipedia:Articles for deletion/Log/' + date.getUTCFullYear() + ' ' +
				date.getUTCMonthName() + ' ' + date.getUTCDate(), "Adding discussion to today's list");
			wikipedia_page.setFollowRedirect(true);
			wikipedia_page.setCallbackParameters(params);
			wikipedia_page.load(TwinkleGlobal.xfd.callbacks.afd.todaysList);

			// Notification to first contributor
			if (params.usertalk) {
				var thispage = new MorebitsGlobal.wiki.page(mw.config.get('wgPageName'));
				thispage.setCallbackParameters(params);
				thispage.lookupCreation(TwinkleGlobal.xfd.callbacks.afd.userNotification);
			}

			// List at deletion sorting pages
			if (params.delsort_cats) {
				params.delsort_cats.forEach(function (cat) {
					var delsortPage = new MorebitsGlobal.wiki.page('Wikipedia:WikiProject Deletion sorting/' + cat, 'Adding to list of ' + cat + '-related deletion discussions');
					delsortPage.setCallbackParameters({discussionPage: params.discussionpage});
					delsortPage.load(TwinkleGlobal.xfd.callbacks.afd.delsortListing);
				});
			}

			// Remove some tags that should always be removed on AfD.
			text = text.replace(/\{\{\s*(dated prod|dated prod blp|Prod blp\/dated|Proposed deletion\/dated|prod2|Proposed deletion endorsed|Userspace draft)\s*(\|(?:\{\{[^{}]*\}\}|[^{}])*)?\}\}\s*/ig, '');
			// Then, test if there are speedy deletion-related templates on the article.
			var textNoSd = text.replace(/\{\{\s*(db(-\w*)?|delete|(?:hang|hold)[- ]?on)\s*(\|(?:\{\{[^{}]*\}\}|[^{}])*)?\}\}\s*/ig, '');
			if (text !== textNoSd && confirm('A speedy deletion tag was found on this page. Should it be removed?')) {
				text = textNoSd;
			}

			pageobj.setPageText((params.noinclude ? '<noinclude>{{' : '{{') + (params.number === '' ? 'subst:afd|help=off' : 'subst:afdx|' +
				params.number + '|help=off') + (params.noinclude ? '}}</noinclude>\n' : '}}\n') + text);
			pageobj.setEditSummary('Nominated for deletion; see [[:' + params.discussionpage + ']].' + TwinkleGlobal.getPref('summaryAd'));
			TwinkleGlobal.xfd.setWatchPref(pageobj, TwinkleGlobal.getPref('xfdWatchPage'));
			pageobj.setCreateOption('nocreate');
			pageobj.save();
		},
		discussionPage: function(pageobj) {
			var params = pageobj.getCallbackParameters();

			pageobj.setPageText(TwinkleGlobal.xfd.callbacks.getDiscussionWikitext('afd', params));
			pageobj.setEditSummary('Creating deletion discussion page for [[:' + MorebitsGlobal.pageNameNorm + ']].' + TwinkleGlobal.getPref('summaryAd'));
			TwinkleGlobal.xfd.setWatchPref(pageobj, TwinkleGlobal.getPref('xfdWatchDiscussion'));
			pageobj.setCreateOption('createonly');
			pageobj.save(function() {
				TwinkleGlobal.xfd.currentRationale = null;  // any errors from now on do not need to print the rationale, as it is safely saved on-wiki
			});
		},
		todaysList: function(pageobj) {
			var old_text = pageobj.getPageText() + '\n';  // MW strips trailing blanks, but we like them, so we add a fake one
			var params = pageobj.getCallbackParameters();
			var statelem = pageobj.getStatusElement();

			var text = old_text.replace(/(<!-- Add new entries to the TOP of the following list -->\n+)/, '$1{{subst:afd3|pg=' + MorebitsGlobal.pageNameNorm + params.numbering + '}}\n');
			if (text === old_text) {
				var linknode = document.createElement('a');
				linknode.setAttribute('href', mw.util.getUrl('Wikipedia:Twinkle/Fixing AFD') + '?action=purge');
				linknode.appendChild(document.createTextNode('How to fix AFD'));
				statelem.error([ 'Could not find the target spot for the discussion. To fix this problem, please see ', linknode, '.' ]);
				return;
			}
			pageobj.setPageText(text);
			pageobj.setEditSummary('Adding [[:' + params.discussionpage + ']].' + TwinkleGlobal.getPref('summaryAd'));
			TwinkleGlobal.xfd.setWatchPref(pageobj, TwinkleGlobal.getPref('xfdWatchList'));
			pageobj.setCreateOption('recreate');
			pageobj.save();
		},
		userNotification: function(pageobj) {
			var params = pageobj.getCallbackParameters();
			var initialContrib = pageobj.getCreator();

			// Disallow warning yourself
			if (initialContrib === mw.config.get('wgUserName')) {
				pageobj.getStatusElement().warn('You (' + initialContrib + ') created this page; skipping user notification');
				return;
			}

			var usertalkpage = new MorebitsGlobal.wiki.page('User talk:' + initialContrib, 'Notifying initial contributor (' + initialContrib + ')');
			var notifytext = '\n{{subst:AFDWarning|1=' + MorebitsGlobal.pageNameNorm + (params.numbering !== '' ? '|order=&#32;' + params.numbering : '') + '}} ~~~~';
			usertalkpage.setAppendText(notifytext);
			usertalkpage.setEditSummary('Notification: [[' + params.discussionpage + '|nomination]] of [[:' + MorebitsGlobal.pageNameNorm + ']]  at [[WP:AFD|articles for deletion]].' + TwinkleGlobal.getPref('summaryAd'));
			usertalkpage.setCreateOption('recreate');
			TwinkleGlobal.xfd.setWatchPref(usertalkpage, TwinkleGlobal.getPref('xfdWatchUser'));
			usertalkpage.setFollowRedirect(true);
			usertalkpage.append();
		},
		delsortListing: function(pageobj) {
			var discussionPage = pageobj.getCallbackParameters().discussionPage;
			var text = pageobj.getPageText().replace('directly below this line -->', 'directly below this line -->\n{{' + discussionPage + '}}');
			pageobj.setPageText(text);
			pageobj.setEditSummary('Listing [[:' + discussionPage + ']].' + TwinkleGlobal.getPref('summaryAd'));
			pageobj.setCreateOption('nocreate');
			pageobj.save();
		}
	},


	tfd: {
		taggingTemplate: function(pageobj) {
			var text = pageobj.getPageText();
			var params = pageobj.getCallbackParameters();
			var tableNewline = params.tfdtype === 'standard' || params.tfdtype === 'sidebar' ? '\n' : ''; // No newline for inline

			pageobj.setPageText((params.noinclude ? '<noinclude>' : '') + '{{subst:template for discussion|help=off' +
				(params.tfdtype !== 'standard' ? '|type=' + params.tfdtype : '') + (params.noinclude ? '}}</noinclude>' : '}}') + tableNewline + text);
			pageobj.setEditSummary('Nominated for deletion; see [[:' + params.discussionpage + ']].' + TwinkleGlobal.getPref('summaryAd'));
			TwinkleGlobal.xfd.setWatchPref(pageobj, TwinkleGlobal.getPref('xfdWatchPage'));
			pageobj.setCreateOption('recreate'); // Module /doc might not exist
			pageobj.save();
		},
		taggingTemplateForMerge: function(pageobj) {
			var text = pageobj.getPageText();
			var params = pageobj.getCallbackParameters();
			var tableNewline = params.tfdtype === 'standard' || params.tfdtype === 'sidebar' ? '\n' : ''; // No newline for inline

			pageobj.setPageText((params.noinclude ? '<noinclude>' : '') + '{{subst:tfm|help=off|' +
				(params.tfdtype !== 'standard' ? 'type=' + params.tfdtype + '|' : '') + '1=' + params.otherTemplateName.replace(/^(?:Template|Module):/, '') +
				(params.noinclude ? '}}</noinclude>' : '}}') + tableNewline + text);
			pageobj.setEditSummary('Listed for merging with [[:' + params.otherTemplateName + ']]; see [[:' + params.discussionpage + ']].' + TwinkleGlobal.getPref('summaryAd'));
			TwinkleGlobal.xfd.setWatchPref(pageobj, TwinkleGlobal.getPref('xfdWatchPage'));
			pageobj.setCreateOption('recreate'); // Module /doc might not exist
			pageobj.save();
		},
		todaysList: function(pageobj) {
			var old_text = pageobj.getPageText();
			var params = pageobj.getCallbackParameters();
			var statelem = pageobj.getStatusElement();

			var added_data = TwinkleGlobal.xfd.callbacks.getDiscussionWikitext(params.xfdcat, params);

			var text = old_text.replace('-->', '-->\n' + added_data);
			if (text === old_text) {
				statelem.error('failed to find target spot for the discussion');
				return;
			}
			pageobj.setPageText(text);
			pageobj.setEditSummary('Adding ' + (params.xfdcat === 'tfd' ? 'deletion nomination' : 'merge listing') + ' of [[:' + MorebitsGlobal.pageNameNorm + ']].' + TwinkleGlobal.getPref('summaryAd'));
			TwinkleGlobal.xfd.setWatchPref(pageobj, TwinkleGlobal.getPref('xfdWatchDiscussion'));
			pageobj.setCreateOption('recreate');
			pageobj.save(function() {
				TwinkleGlobal.xfd.currentRationale = null;  // any errors from now on do not need to print the rationale, as it is safely saved on-wiki
			});
		},
		userNotification: function(pageobj) {
			var initialContrib = pageobj.getCreator();
			var params = pageobj.getCallbackParameters();

			// Disallow warning yourself
			if (initialContrib === mw.config.get('wgUserName')) {
				pageobj.getStatusElement().warn('You (' + initialContrib + ') created this page; skipping user notification');
				return;
			}

			var usertalkpage = new MorebitsGlobal.wiki.page('User talk:' + initialContrib, 'Notifying initial contributor (' + initialContrib + ')');
			var notifytext = '\n';
			var modNotice = mw.config.get('wgPageContentModel') === 'Scribunto' ? '|module=yes' : '';
			switch (params.xfdcat) {
				case 'tfd':
					notifytext += '{{subst:tfdnotice|1=' + mw.config.get('wgTitle') + modNotice + '}} ~~~~';
					break;
				case 'tfm':
					notifytext += '{{subst:tfmnotice|1=' + mw.config.get('wgTitle') + '|2=' + params.target + modNotice + '}} ~~~~';
					break;
				default:
					alert('twinklexfd in userNotification: unknown TFD action');
					break;
			}

			usertalkpage.setAppendText(notifytext);
			usertalkpage.setEditSummary('Notification: [[' + params.discussionpage + '|listing]] of [[:' + pageobj.getPageName() + ']] at [[WP:TFD|templates for discussion]].' + TwinkleGlobal.getPref('summaryAd'));
			usertalkpage.setCreateOption('recreate');
			TwinkleGlobal.xfd.setWatchPref(usertalkpage, TwinkleGlobal.getPref('xfdWatchUser'));
			usertalkpage.setFollowRedirect(true);
			usertalkpage.append();
		}
	},


	mfd: {
		main: function(apiobj) {
			var xmlDoc = apiobj.responseXML;
			var titles = $(xmlDoc).find('allpages p');

			// There has been no earlier entries with this prefix, just go on.
			if (titles.length <= 0) {
				apiobj.params.numbering = apiobj.params.number = '';
			} else {
				var number = 0;
				for (var i = 0; i < titles.length; ++i) {
					var title = titles[i].getAttribute('title');

					// First, simple test, is there an instance with this exact name?
					if (title === 'Wikipedia:Miscellany for deletion/' + MorebitsGlobal.pageNameNorm) {
						number = Math.max(number, 1);
						continue;
					}

					var order_re = new RegExp('^' +
							RegExp.escape('Wikipedia:Miscellany for deletion/' + MorebitsGlobal.pageNameNorm, true) +
							'\\s*\\(\\s*(\\d+)(?:(?:th|nd|rd|st) nom(?:ination)?)?\\s*\\)\\s*$');
					var match = order_re.exec(title);

					// No match; A non-good value
					if (!match) {
						continue;
					}

					// A match, set number to the max of current
					number = Math.max(number, Number(match[1]));
				}
				apiobj.params.number = TwinkleGlobal.xfd.num2order(parseInt(number, 10) + 1);
				apiobj.params.numbering = number > 0 ? ' (' + apiobj.params.number + ' nomination)' : '';
			}
			apiobj.params.discussionpage = 'Wikipedia:Miscellany for deletion/' + MorebitsGlobal.pageNameNorm + apiobj.params.numbering;

			apiobj.statelem.info('next in order is [[' + apiobj.params.discussionpage + ']]');

			// Tagging page
			var wikipedia_page = new MorebitsGlobal.wiki.page(mw.config.get('wgPageName'), 'Tagging page with deletion tag');
			wikipedia_page.setFollowRedirect(true);  // should never be needed, but if the page is moved, we would want to follow the redirect
			wikipedia_page.setCallbackParameters(apiobj.params);
			wikipedia_page.load(TwinkleGlobal.xfd.callbacks.mfd.taggingPage);

			// Updating data for the action completed event
			MorebitsGlobal.wiki.actionCompleted.redirect = apiobj.params.discussionpage;
			MorebitsGlobal.wiki.actionCompleted.notice = 'Nomination completed, now redirecting to the discussion page';

			// Discussion page
			wikipedia_page = new MorebitsGlobal.wiki.page(apiobj.params.discussionpage, 'Creating deletion discussion page');
			wikipedia_page.setCallbackParameters(apiobj.params);
			wikipedia_page.load(TwinkleGlobal.xfd.callbacks.mfd.discussionPage);

			// Today's list
			wikipedia_page = new MorebitsGlobal.wiki.page('Wikipedia:Miscellany for deletion', "Adding discussion to today's list");
			// wikipedia_page.setPageSection(2);
			// pageSection has been disabled - the API seems to throw up with nonexistent edit conflicts
			// it can be turned on again once the problem is fixed, to save bandwidth
			// wikipedia_page.setFollowRedirect(true);
			wikipedia_page.setCallbackParameters(apiobj.params);
			wikipedia_page.load(TwinkleGlobal.xfd.callbacks.mfd.todaysList);

			// Notification to first contributor, and notification to owner of userspace (if applicable and required)
			if (apiobj.params.usertalk) {
				var thispage = new MorebitsGlobal.wiki.page(mw.config.get('wgPageName'));
				thispage.setCallbackParameters(apiobj.params);
				thispage.lookupCreation(TwinkleGlobal.xfd.callbacks.mfd.userNotification);
			}
		},
		taggingPage: function(pageobj) {
			var text = pageobj.getPageText();
			var params = pageobj.getCallbackParameters();

			pageobj.setPageText((params.noinclude ? '<noinclude>' : '') + '{{' +
				(params.number === '' ? 'mfd' : 'mfdx|' + params.number) + '|help=off}}\n' +
				(params.noinclude ? '</noinclude>' : '') + text);
			pageobj.setEditSummary('Nominated for deletion; see [[:' + params.discussionpage + ']].' + TwinkleGlobal.getPref('summaryAd'));
			TwinkleGlobal.xfd.setWatchPref(pageobj, TwinkleGlobal.getPref('xfdWatchPage'));
			pageobj.setCreateOption('nocreate');
			pageobj.save();
		},
		discussionPage: function(pageobj) {
			var params = pageobj.getCallbackParameters();

			pageobj.setPageText(TwinkleGlobal.xfd.callbacks.getDiscussionWikitext('mfd', params));
			pageobj.setEditSummary('Creating deletion discussion page for [[:' + MorebitsGlobal.pageNameNorm + ']].' + TwinkleGlobal.getPref('summaryAd'));
			TwinkleGlobal.xfd.setWatchPref(pageobj, TwinkleGlobal.getPref('xfdWatchDiscussion'));
			pageobj.setCreateOption('createonly');
			pageobj.save(function() {
				TwinkleGlobal.xfd.currentRationale = null;  // any errors from now on do not need to print the rationale, as it is safely saved on-wiki
			});
		},
		todaysList: function(pageobj) {
			var text = pageobj.getPageText();
			var params = pageobj.getCallbackParameters();
			var statelem = pageobj.getStatusElement();

			var date = new Date(pageobj.getLoadTime());
			var date_header = '===' + date.getUTCMonthName() + ' ' + date.getUTCDate() + ', ' + date.getUTCFullYear() + '===\n';
			var date_header_regex = new RegExp('(===\\s*' + date.getUTCMonthName() + '\\s+' + date.getUTCDate() + ',\\s+' + date.getUTCFullYear() + '\\s*===)');
			var new_data = '{{subst:mfd3|pg=' + MorebitsGlobal.pageNameNorm + params.numbering + '}}';

			if (date_header_regex.test(text)) { // we have a section already
				statelem.info('Found today\'s section, proceeding to add new entry');
				text = text.replace(date_header_regex, '$1\n' + new_data);
			} else { // we need to create a new section
				statelem.info('No section for today found, proceeding to create one');
				text = text.replace('===', date_header + new_data + '\n\n===');
			}

			pageobj.setPageText(text);
			pageobj.setEditSummary('Adding [[:' + params.discussionpage + ']].' + TwinkleGlobal.getPref('summaryAd'));
			TwinkleGlobal.xfd.setWatchPref(pageobj, TwinkleGlobal.getPref('xfdWatchList'));
			pageobj.setCreateOption('recreate');
			pageobj.save();
		},
		userNotification: function(pageobj) {
			var initialContrib = pageobj.getCreator();
			var params = pageobj.getCallbackParameters();

			// Disallow warning yourself
			if (initialContrib === mw.config.get('wgUserName')) {
				pageobj.getStatusElement().warn('You (' + initialContrib + ') created this page; skipping user notification');
			} else {
				// Really notify the creator
				TwinkleGlobal.xfd.callbacks.mfd.userNotificationMain(params, initialContrib, 'Notifying initial contributor');
			}

			// Also notify the user who owns the subpage if they are not the creator
			if (params.notifyuserspace) {
				var userspaceOwner = mw.config.get('wgTitle').indexOf('/') === -1 ? mw.config.get('wgTitle') : mw.config.get('wgTitle').substring(0, mw.config.get('wgTitle').indexOf('/'));
				if (userspaceOwner !== initialContrib) {
					TwinkleGlobal.xfd.callbacks.mfd.userNotificationMain(params, userspaceOwner, 'Notifying owner of userspace');
				}
			}
		},
		userNotificationMain: function(params, initialContrib, actionName) {
			var usertalkpage = new MorebitsGlobal.wiki.page('User talk:' + initialContrib, actionName + ' (' + initialContrib + ')');
			var notifytext = '\n{{subst:MFDWarning|1=' + MorebitsGlobal.pageNameNorm + (params.numbering !== '' ? '|order=&#32;' + params.numbering : '') + '}} ~~~~';
			usertalkpage.setAppendText(notifytext);
			usertalkpage.setEditSummary('Notification: [[' + params.discussionpage + '|nomination]] of [[:' + MorebitsGlobal.pageNameNorm + ']] at [[WP:MFD|miscellany for deletion]].' + TwinkleGlobal.getPref('summaryAd'));
			usertalkpage.setCreateOption('recreate');
			TwinkleGlobal.xfd.setWatchPref(usertalkpage, TwinkleGlobal.getPref('xfdWatchUser'));
			usertalkpage.setFollowRedirect(true);
			usertalkpage.append();
		}
	},


	ffd: {
		main: function(pageobj) {
			// this is coming in from lookupCreation...!
			var params = pageobj.getCallbackParameters();
			var initialContrib = pageobj.getCreator();
			params.uploader = initialContrib;

			// Adding discussion
			var wikipedia_page = new MorebitsGlobal.wiki.page(params.logpage, "Adding discussion to today's list");
			wikipedia_page.setFollowRedirect(true);
			wikipedia_page.setCallbackParameters(params);
			wikipedia_page.load(TwinkleGlobal.xfd.callbacks.ffd.todaysList);

			// Notification to first contributor
			if (params.usertalk) {
				// Disallow warning yourself
				if (initialContrib === mw.config.get('wgUserName')) {
					pageobj.getStatusElement().warn('You (' + initialContrib + ') created this page; skipping user notification');
				} else {
					var usertalkpage = new MorebitsGlobal.wiki.page('User talk:' + initialContrib, 'Notifying initial contributor (' + initialContrib + ')');
					var notifytext = '\n{{subst:fdw|1=' + mw.config.get('wgTitle') + '}}';
					usertalkpage.setAppendText(notifytext);
					usertalkpage.setEditSummary('Notification: [[' + params.discussionpage + '|listing]] of [[:' + MorebitsGlobal.pageNameNorm + ']] at [[WP:FFD|files for discussion]].' + TwinkleGlobal.getPref('summaryAd'));
					usertalkpage.setCreateOption('recreate');
					TwinkleGlobal.xfd.setWatchPref(usertalkpage, TwinkleGlobal.getPref('xfdWatchUser'));
					usertalkpage.setFollowRedirect(true);
					usertalkpage.append();
				}
			}
		},
		taggingImage: function(pageobj) {
			var text = pageobj.getPageText();
			var params = pageobj.getCallbackParameters();

			text = text.replace(/\{\{(mtc|(copy |move )?to ?commons|move to wikimedia commons|copy to wikimedia commons)[^}]*\}\}/gi, '');

			pageobj.setPageText('{{ffd|log=' + params.date + '|help=off}}\n' + text);
			pageobj.setEditSummary('Listed for discussion at [[:' + params.discussionpage + ']].' + TwinkleGlobal.getPref('summaryAd'));
			TwinkleGlobal.xfd.setWatchPref(pageobj, TwinkleGlobal.getPref('xfdWatchPage'));
			pageobj.setCreateOption('recreate');  // it might be possible for a file to exist without a description page
			pageobj.save();
		},
		todaysList: function(pageobj) {
			var text = pageobj.getPageText();
			var params = pageobj.getCallbackParameters();

			// add date header if the log is found to be empty (a bot should do this automatically, but it sometimes breaks down)
			if (!pageobj.exists()) {
				text = '{{subst:Ffd log}}';
			}

			pageobj.setPageText(text + '\n\n' + TwinkleGlobal.xfd.callbacks.getDiscussionWikitext('ffd', params));
			pageobj.setEditSummary('Adding [[:' + MorebitsGlobal.pageNameNorm + ']].' + TwinkleGlobal.getPref('summaryAd'));
			TwinkleGlobal.xfd.setWatchPref(pageobj, TwinkleGlobal.getPref('xfdWatchDiscussion'));
			pageobj.setCreateOption('recreate');
			pageobj.save(function() {
				TwinkleGlobal.xfd.currentRationale = null;  // any errors from now on do not need to print the rationale, as it is safely saved on-wiki
			});
		}
	},


	cfd: {
		taggingCategory: function(pageobj) {
			var text = pageobj.getPageText();
			var params = pageobj.getCallbackParameters();

			var added_data = '';
			var editsummary = '';
			switch (params.xfdcat) {
				case 'cfd':
					added_data = '{{subst:cfd}}';
					editsummary = 'Category being considered for deletion; see [[:' + params.discussionpage + ']].';
					break;
				case 'cfm':
					added_data = '{{subst:cfm|' + params.target + '}}';
					editsummary = 'Category being considered for merging; see [[:' + params.discussionpage + ']].';
					break;
				case 'cfr':
					added_data = '{{subst:cfr|' + params.target + '}}';
					editsummary = 'Category being considered for renaming; see [[:' + params.discussionpage + ']].';
					break;
				case 'cfs':
					added_data = '{{subst:cfs|' + params.target + '|' + params.target2 + '}}';
					editsummary = 'Category being considered for splitting; see [[:' + params.discussionpage + ']].';
					break;
				case 'cfc':
					added_data = '{{subst:cfc|' + params.target + '}}';
					editsummary = 'Category being considered for conversion to an article; see [[:' + params.discussionpage + ']].';
					break;
				default:
					alert('twinklexfd in taggingCategory(): unknown CFD action');
					break;
			}

			pageobj.setPageText(added_data + '\n' + text);
			pageobj.setEditSummary(editsummary + TwinkleGlobal.getPref('summaryAd'));
			TwinkleGlobal.xfd.setWatchPref(pageobj, TwinkleGlobal.getPref('xfdWatchPage'));
			pageobj.setCreateOption('recreate');  // since categories can be populated without an actual page at that title
			pageobj.save();
		},
		todaysList: function(pageobj) {
			var old_text = pageobj.getPageText();
			var params = pageobj.getCallbackParameters();
			var statelem = pageobj.getStatusElement();

			var added_data = TwinkleGlobal.xfd.callbacks.getDiscussionWikitext(params.xfdcat, params);
			var summaryActions = {
				cfd: 'delete',
				cfm: 'merge',
				cfr: 'rename',
				cfs: 'split',
				cfc: 'convert'
			};
			var editsummary = 'Adding ' + summaryActions[params.xfdcat] + ' nomination of [[:' + MorebitsGlobal.pageNameNorm + ']].';

			var text = old_text.replace('below this line -->', 'below this line -->\n' + added_data);
			if (text === old_text) {
				statelem.error('failed to find target spot for the discussion');
				return;
			}

			pageobj.setPageText(text);
			pageobj.setEditSummary(editsummary + TwinkleGlobal.getPref('summaryAd'));
			TwinkleGlobal.xfd.setWatchPref(pageobj, TwinkleGlobal.getPref('xfdWatchDiscussion'));
			pageobj.setCreateOption('recreate');
			pageobj.save(function() {
				TwinkleGlobal.xfd.currentRationale = null;  // any errors from now on do not need to print the rationale, as it is safely saved on-wiki
			});
		},
		userNotification: function(pageobj) {
			var initialContrib = pageobj.getCreator();
			var params = pageobj.getCallbackParameters();

			// Disallow warning yourself
			if (initialContrib === mw.config.get('wgUserName')) {
				pageobj.getStatusElement().warn('You (' + initialContrib + ') created this page; skipping user notification');
				return;
			}

			var usertalkpage = new MorebitsGlobal.wiki.page('User talk:' + initialContrib, 'Notifying initial contributor (' + initialContrib + ')');
			var notifytext = '\n{{subst:cfd-notify|1=' + MorebitsGlobal.pageNameNorm + '}} ~~~~';
			usertalkpage.setAppendText(notifytext);
			usertalkpage.setEditSummary('Notification: [[' + params.discussionpage + '|listing]] of [[:' + MorebitsGlobal.pageNameNorm + ']] at [[WP:CFD|categories for discussion]].' + TwinkleGlobal.getPref('summaryAd'));
			usertalkpage.setCreateOption('recreate');
			TwinkleGlobal.xfd.setWatchPref(usertalkpage, TwinkleGlobal.getPref('xfdWatchUser'));
			usertalkpage.setFollowRedirect(true);
			usertalkpage.append();
		}
	},


	cfds: {
		taggingCategory: function(pageobj) {
			var text = pageobj.getPageText();
			var params = pageobj.getCallbackParameters();

			pageobj.setPageText('{{subst:cfr-speedy|1=' + params.target + '}}\n' + text);
			pageobj.setEditSummary('Listed for speedy renaming; see [[WP:CFDS|Categories for discussion/Speedy]].' + TwinkleGlobal.getPref('summaryAd'));
			TwinkleGlobal.xfd.setWatchPref(pageobj, TwinkleGlobal.getPref('xfdWatchPage'));
			pageobj.setCreateOption('recreate');  // since categories can be populated without an actual page at that title
			pageobj.save();
		},
		addToList: function(pageobj) {
			var old_text = pageobj.getPageText();
			var params = pageobj.getCallbackParameters();
			var statelem = pageobj.getStatusElement();

			params.target = /^Category:/.test(params.target) ? params.target : 'Category:' + params.target;
			var text = old_text.replace('BELOW THIS LINE -->', 'BELOW THIS LINE -->\n' + TwinkleGlobal.xfd.callbacks.getDiscussionWikitext('cfds', params));
			if (text === old_text) {
				statelem.error('failed to find target spot for the discussion');
				return;
			}

			pageobj.setPageText(text);
			pageobj.setEditSummary('Adding [[:' + MorebitsGlobal.pageNameNorm + ']].' + TwinkleGlobal.getPref('summaryAd'));
			TwinkleGlobal.xfd.setWatchPref(pageobj, TwinkleGlobal.getPref('xfdWatchDiscussion'));
			pageobj.setCreateOption('recreate');
			pageobj.save(function() {
				TwinkleGlobal.xfd.currentRationale = null;  // any errors from now on do not need to print the rationale, as it is safely saved on-wiki
			});
		}
	},


	rfd: {
		// This gets called both on submit and preview to determine the redirect target
		findTarget: function(params, callback) {
			if (document.getElementById('softredirect')) {
				// For soft redirects, skip straight to the callback
				params.target = document.getElementById('softredirect').textContent.replace(/^:+/, '');
				callback(params);
			} else {
				// Find current target of redirect
				var query = {
					action: 'query',
					titles: mw.config.get('wgPageName'),
					redirects: true,
					curtimestamp: true
				};
				var wikipedia_api = new MorebitsGlobal.wiki.api('Finding target of redirect', query, TwinkleGlobal.xfd.callbacks.rfd.findTargetCallback(callback));
				wikipedia_api.params = params;
				wikipedia_api.post();
			}
		},
		// This is a closure for the callback from the above API request, which gets the target of the redirect
		findTargetCallback: function(callback) {
			return function(apiobj) {
				var $xmlDoc = $(apiobj.responseXML);
				var curtimestamp = $xmlDoc.find('api').attr('curtimestamp');
				var target = $xmlDoc.find('redirects r').first().attr('to');
				if (!target) {
					apiobj.statelem.error('This page is currently not a redirect, aborting');
					return;
				}
				var section = $xmlDoc.find('redirects r').first().attr('tofragment');
				apiobj.params.curtimestamp = curtimestamp;
				apiobj.params.target = target;
				apiobj.params.section = section;
				callback(apiobj.params);
			};
		},
		main: function(params) {
			var date = new Date(params.curtimestamp);
			params.logpage = 'Wikipedia:Redirects for discussion/Log/' + date.getUTCFullYear() + ' ' + date.getUTCMonthName() + ' ' + date.getUTCDate();
			params.discussionpage = params.logpage + '#' + MorebitsGlobal.pageNameNorm;

			// Tagging redirect
			var wikipedia_page = new MorebitsGlobal.wiki.page(mw.config.get('wgPageName'), 'Adding deletion tag to redirect');
			wikipedia_page.setFollowRedirect(false);
			wikipedia_page.setCallbackParameters(params);
			wikipedia_page.load(TwinkleGlobal.xfd.callbacks.rfd.taggingRedirect);

			// Updating data for the action completed event
			MorebitsGlobal.wiki.actionCompleted.redirect = params.logpage;
			MorebitsGlobal.wiki.actionCompleted.notice = "Nomination completed, now redirecting to today's log";

			// Adding discussion
			wikipedia_page = new MorebitsGlobal.wiki.page(params.logpage, "Adding discussion to today's log");
			wikipedia_page.setFollowRedirect(true);
			wikipedia_page.setCallbackParameters(params);
			wikipedia_page.load(TwinkleGlobal.xfd.callbacks.rfd.todaysList);

			// Notifications
			if (params.usertalk || params.relatedpage) {
				var thispage = new MorebitsGlobal.wiki.page(mw.config.get('wgPageName'));
				thispage.setCallbackParameters(params);
				thispage.lookupCreation(TwinkleGlobal.xfd.callbacks.rfd.sendNotifications);
			}
		},
		taggingRedirect: function(pageobj) {
			var text = pageobj.getPageText();
			var params = pageobj.getCallbackParameters();

			pageobj.setPageText('{{subst:rfd|content=\n' + text + '\n}}');
			pageobj.setEditSummary('Listed for discussion at [[:' + params.discussionpage + ']].' + TwinkleGlobal.getPref('summaryAd'));
			TwinkleGlobal.xfd.setWatchPref(pageobj, TwinkleGlobal.getPref('xfdWatchPage'));
			pageobj.setCreateOption('nocreate');
			pageobj.save();
		},
		todaysList: function(pageobj) {
			var old_text = pageobj.getPageText();
			var params = pageobj.getCallbackParameters();
			var statelem = pageobj.getStatusElement();

			// params.target + sectionHash + "}} ~~~~\n" );
			var added_data = TwinkleGlobal.xfd.callbacks.getDiscussionWikitext('rfd', params);
			var text = old_text.replace(/(<!-- Add new entries directly below this line\.? -->)/, '$1\n' + added_data);
			if (text === old_text) {
				statelem.error('failed to find target spot for the discussion');
				return;
			}

			pageobj.setPageText(text);
			pageobj.setEditSummary('Adding [[:' + MorebitsGlobal.pageNameNorm + ']].' + TwinkleGlobal.getPref('summaryAd'));
			TwinkleGlobal.xfd.setWatchPref(pageobj, TwinkleGlobal.getPref('xfdWatchDiscussion'));
			pageobj.setCreateOption('recreate');
			pageobj.save(function() {
				TwinkleGlobal.xfd.currentRationale = null;  // any errors from now on do not need to print the rationale, as it is safely saved on-wiki
			});
		},
		sendNotifications: function(pageobj) {
			var initialContrib = pageobj.getCreator();
			var params = pageobj.getCallbackParameters();

			// Notifying initial contributor
			if (params.usertalk) {
				// Disallow warning yourself
				if (initialContrib === mw.config.get('wgUserName')) {
					pageobj.getStatusElement().warn('You (' + initialContrib + ') created this page; skipping user notification');
				} else {
					TwinkleGlobal.xfd.callbacks.rfd.userNotification(params, initialContrib);
				}
			}

			// Notifying target page's watchers
			if (params.relatedpage) {
				var targetTalk = new mw.Title(params.target).getTalkPage();

				// On the offchance it's a circular redirect
				if (params.target === mw.config.get('wgPageName')) {
					pageobj.getStatusElement().warn('Circular redirect; skipping target page notification');
				} else if (targetTalk.getNamespaceId() === 3) {
					// Don't issue if target talk is the initial contributor's talk or your own
					if (targetTalk.getNameText() === initialContrib) {
						pageobj.getStatusElement().warn('Target is initial contributor; skipping target page notification');
					} else if (targetTalk.getNameText() === mw.config.get('wgUserName')) {
						pageobj.getStatusElement().warn('You (' + mw.config.get('wgUserName') + ') are the target; skipping target page notification');
					}
				} else {
					TwinkleGlobal.xfd.callbacks.rfd.targetNotification(params, targetTalk);
				}
			}
		},
		userNotification: function(params, initialContrib) {
			var usertalkpage = new MorebitsGlobal.wiki.page('User talk:' + initialContrib, 'Notifying initial contributor (' + initialContrib + ')');
			var notifytext = '\n{{subst:RFDNote|1=' + MorebitsGlobal.pageNameNorm + '}} ~~~~';
			usertalkpage.setAppendText(notifytext);
			usertalkpage.setEditSummary('Notification: [[' + params.discussionpage + '|listing]] of [[:' + MorebitsGlobal.pageNameNorm + ']] at [[WP:RFD|redirects for discussion]].' + TwinkleGlobal.getPref('summaryAd'));
			usertalkpage.setCreateOption('recreate');
			TwinkleGlobal.xfd.setWatchPref(usertalkpage, TwinkleGlobal.getPref('xfdWatchUser'));
			usertalkpage.setFollowRedirect(true);
			usertalkpage.append();
		},
		targetNotification: function(params, targetTalk) {
			var targettalkpage = new MorebitsGlobal.wiki.page(targetTalk, 'Notifying redirect target of the discussion');
			var notifytext = '\n{{subst:RFDNote|1=' + MorebitsGlobal.pageNameNorm + '}} ~~~~';
			targettalkpage.setAppendText(notifytext);
			targettalkpage.setEditSummary('Notification: [[' + params.discussionpage + '|listing]] of [[:' + MorebitsGlobal.pageNameNorm + ']] at [[WP:RFD|redirects for discussion]].' + TwinkleGlobal.getPref('summaryAd'));
			targettalkpage.setCreateOption('recreate');
			TwinkleGlobal.xfd.setWatchPref(targettalkpage, TwinkleGlobal.getPref('xfdWatchRelated'));
			targettalkpage.setFollowRedirect(true);
			targettalkpage.append();
		}
	}
};



TwinkleGlobal.xfd.callback.evaluate = function(e) {
	var form = e.target;

	var type = form.category.value;
	var usertalk = form.notify.checked;
	var reason = form.xfdreason.value;
	var delsort_cats = $(form.delsort).val(); // afd
	var xfdcat = form.xfdcat && form.xfdcat.value; // afd, cfd, cfds, tfd
	var xfdtarget = form.xfdtarget && form.xfdtarget.value; // cfd, cfds, tfd
	var xfdtarget2 = form.xfdtarget2 && form.xfdtarget2.value; // cfd, cfds
	var noinclude = form.noinclude && form.noinclude.checked; // afd, mfd, tfd
	var tfdtype = form.templatetype && form.templatetype.value; // tfd
	var notifyuserspace = form.notifyuserspace && form.notifyuserspace.checked; // mfd
	var relatedpage = form.relatedpage && form.relatedpage.checked; // rfd

	MorebitsGlobal.simpleWindow.setButtonsEnabled(false);
	MorebitsGlobal.status.init(form);

	TwinkleGlobal.xfd.currentRationale = reason;
	MorebitsGlobal.status.onError(TwinkleGlobal.xfd.printRationale);

	if (!type) {
		MorebitsGlobal.status.error('Error', 'no action given');
		return;
	}

	var query, wikipedia_page, wikipedia_api, logpage, params;
	var date = new Date(); // XXX: avoid use of client clock, still used by TfD, FfD and CfD
	switch (type) {

		case 'afd': // AFD
			query = {
				action: 'query',
				list: 'allpages',
				apprefix: 'Articles for deletion/' + MorebitsGlobal.pageNameNorm,
				apnamespace: 4,
				apfilterredir: 'nonredirects',
				aplimit: MorebitsGlobal.userIsSysop ? 5000 : 500
			};
			wikipedia_api = new MorebitsGlobal.wiki.api('Tagging article with deletion tag', query, TwinkleGlobal.xfd.callbacks.afd.main);
			wikipedia_api.params = { usertalk: usertalk, reason: reason, noinclude: noinclude,
				xfdcat: xfdcat, delsort_cats: delsort_cats };
			wikipedia_api.post();
			break;

		case 'tfd': // TFD
			MorebitsGlobal.wiki.addCheckpoint();
			if (xfdtarget) {
				xfdtarget = MorebitsGlobal.string.toUpperCaseFirstChar(xfdtarget.replace(/^:?(?:Template|Module):/i, ''));
			} else {
				xfdtarget = '';
			}

			logpage = 'Wikipedia:Templates for discussion/Log/' + date.getUTCFullYear() + ' ' + date.getUTCMonthName() + ' ' + date.getUTCDate();

			params = { tfdtype: tfdtype, logpage: logpage, noinclude: noinclude, xfdcat: xfdcat, target: xfdtarget, reason: reason };
			params.discussionpage = params.logpage + '#' + MorebitsGlobal.pageNameNorm;

			// Modules can't be tagged, TfD instructions are to place on /doc subpage
			var isScribunto = mw.config.get('wgPageContentModel') === 'Scribunto';
			// Tagging template(s)/module(s)
			if (xfdcat === 'tfm') { // Merge
			// Tag this template/module
				if (isScribunto) {
					wikipedia_page = new MorebitsGlobal.wiki.page(mw.config.get('wgPageName') + '/doc', 'Tagging this module documentation with merge tag');
					params.otherTemplateName = 'Module:' + xfdtarget;
				} else {
					wikipedia_page = new MorebitsGlobal.wiki.page(mw.config.get('wgPageName'), 'Tagging this template with merge tag');
					params.otherTemplateName = 'Template:' + xfdtarget;
				}
				wikipedia_page.setFollowRedirect(true);
				wikipedia_page.setCallbackParameters(params);
				wikipedia_page.load(TwinkleGlobal.xfd.callbacks.tfd.taggingTemplateForMerge);

				// Tag other template/module
				if (isScribunto) {
					wikipedia_page = new MorebitsGlobal.wiki.page('Module:' + xfdtarget + '/doc', 'Tagging other module documentation with merge tag');
				} else {
					wikipedia_page = new MorebitsGlobal.wiki.page('Template:' + xfdtarget, 'Tagging other template with merge tag');
				}
				wikipedia_page.setFollowRedirect(true);
				params = $.extend(params);
				params.otherTemplateName = MorebitsGlobal.pageNameNorm;
				wikipedia_page.setCallbackParameters(params);
				wikipedia_page.load(TwinkleGlobal.xfd.callbacks.tfd.taggingTemplateForMerge);
			} else { // delete
				if (isScribunto) {
					wikipedia_page = new MorebitsGlobal.wiki.page(mw.config.get('wgPageName') + '/doc', 'Tagging module documentation with deletion tag');
				} else {
					wikipedia_page = new MorebitsGlobal.wiki.page(mw.config.get('wgPageName'), 'Tagging template with deletion tag');
				}
				wikipedia_page.setFollowRedirect(true);  // should never be needed, but if the page is moved, we would want to follow the redirect
				wikipedia_page.setCallbackParameters(params);
				wikipedia_page.load(TwinkleGlobal.xfd.callbacks.tfd.taggingTemplate);
			}

			// Updating data for the action completed event
			MorebitsGlobal.wiki.actionCompleted.redirect = logpage;
			MorebitsGlobal.wiki.actionCompleted.notice = "Nomination completed, now redirecting to today's log";

			// Adding discussion
			wikipedia_page = new MorebitsGlobal.wiki.page(logpage, "Adding discussion to today's log");
			wikipedia_page.setFollowRedirect(true);
			wikipedia_page.setCallbackParameters(params);
			wikipedia_page.load(TwinkleGlobal.xfd.callbacks.tfd.todaysList);

			// Notification to first contributors
			if (usertalk) {
				var involvedpages = [];
				var seenusers = [];
				involvedpages.push(new MorebitsGlobal.wiki.page(mw.config.get('wgPageName')));
				if (xfdcat === 'tfm') {
					if (isScribunto) {
						involvedpages.push(new MorebitsGlobal.wiki.page('Module:' + xfdtarget));
					} else {
						involvedpages.push(new MorebitsGlobal.wiki.page('Template:' + xfdtarget));
					}
				}
				involvedpages.forEach(function(page) {
					page.setCallbackParameters(params);
					page.lookupCreation(function(innerpage) {
						var username = innerpage.getCreator();
						if (seenusers.indexOf(username) === -1) {
							seenusers.push(username);
							TwinkleGlobal.xfd.callbacks.tfd.userNotification(innerpage);
						}
					});
				});
			}

			MorebitsGlobal.wiki.removeCheckpoint();
			break;

		case 'mfd': // MFD
			query = {
				action: 'query',
				list: 'allpages',
				apprefix: 'Miscellany for deletion/' + MorebitsGlobal.pageNameNorm,
				apnamespace: 4,
				apfilterredir: 'nonredirects',
				aplimit: MorebitsGlobal.userIsSysop ? 5000 : 500
			};
			wikipedia_api = new MorebitsGlobal.wiki.api('Looking for prior nominations of this page', query, TwinkleGlobal.xfd.callbacks.mfd.main);
			wikipedia_api.params = { usertalk: usertalk, notifyuserspace: notifyuserspace, reason: reason, noinclude: noinclude, xfdcat: xfdcat };
			wikipedia_api.post();
			break;

		case 'ffd': // FFD
			var dateString = date.getUTCFullYear() + ' ' + date.getUTCMonthName() + ' ' + date.getUTCDate();
			logpage = 'Wikipedia:Files for discussion/' + dateString;
			params = { usertalk: usertalk, reason: reason, date: dateString, logpage: logpage };
			params.discussionpage = params.logpage + '#' + MorebitsGlobal.pageNameNorm;

			MorebitsGlobal.wiki.addCheckpoint();

			// Updating data for the action completed event
			MorebitsGlobal.wiki.actionCompleted.redirect = logpage;
			MorebitsGlobal.wiki.actionCompleted.notice = 'Nomination completed, now redirecting to the discussion page';

			// Tagging file
			wikipedia_page = new MorebitsGlobal.wiki.page(mw.config.get('wgPageName'), 'Adding deletion tag to file page');
			wikipedia_page.setFollowRedirect(true);
			wikipedia_page.setCallbackParameters(params);
			wikipedia_page.load(TwinkleGlobal.xfd.callbacks.ffd.taggingImage);

			// Contributor specific edits
			wikipedia_page = new MorebitsGlobal.wiki.page(mw.config.get('wgPageName'));
			wikipedia_page.setCallbackParameters(params);
			wikipedia_page.lookupCreation(TwinkleGlobal.xfd.callbacks.ffd.main);

			MorebitsGlobal.wiki.removeCheckpoint();
			break;

		case 'cfd':
			MorebitsGlobal.wiki.addCheckpoint();

			if (xfdtarget) {
				xfdtarget = xfdtarget.replace(/^:?Category:/i, '');
			} else {
				xfdtarget = '';
			}

			if (xfdtarget2) {
				xfdtarget2 = xfdtarget2.replace(/^:?Category:/i, '');
			}

			logpage = 'Wikipedia:Categories for discussion/Log/' + date.getUTCFullYear() + ' ' + date.getUTCMonthName() + ' ' + date.getUTCDate();

			params = { reason: reason, xfdcat: xfdcat, target: xfdtarget, target2: xfdtarget2, logpage: logpage };
			params.discussionpage = params.logpage + '#' + MorebitsGlobal.pageNameNorm;

			// Updating data for the action completed event
			MorebitsGlobal.wiki.actionCompleted.redirect = logpage;
			MorebitsGlobal.wiki.actionCompleted.notice = "Nomination completed, now redirecting to today's log";

			// Tagging category
			wikipedia_page = new MorebitsGlobal.wiki.page(mw.config.get('wgPageName'), 'Tagging category with deletion tag');
			wikipedia_page.setCallbackParameters(params);
			wikipedia_page.load(TwinkleGlobal.xfd.callbacks.cfd.taggingCategory);

			// Adding discussion to list
			wikipedia_page = new MorebitsGlobal.wiki.page(logpage, "Adding discussion to today's list");
			// wikipedia_page.setPageSection(2);
			// pageSection has been disabled - the API seems to throw up with nonexistent edit conflicts
			// it can be turned on again once the problem is fixed, to save bandwidth
			// wikipedia_page.setFollowRedirect(true);
			wikipedia_page.setCallbackParameters(params);
			wikipedia_page.load(TwinkleGlobal.xfd.callbacks.cfd.todaysList);

			// Notification to first contributor
			if (usertalk) {
				wikipedia_page = new MorebitsGlobal.wiki.page(mw.config.get('wgPageName'));
				wikipedia_page.setCallbackParameters(params);
				wikipedia_page.lookupCreation(TwinkleGlobal.xfd.callbacks.cfd.userNotification);
			}

			MorebitsGlobal.wiki.removeCheckpoint();
			break;

		case 'cfds':
			xfdtarget = xfdtarget.replace(/^:?Category:/, '');

			logpage = 'Wikipedia:Categories for discussion/Speedy';
			params = { reason: reason, xfdcat: xfdcat, target: xfdtarget };

			// Updating data for the action completed event
			MorebitsGlobal.wiki.actionCompleted.redirect = logpage;
			MorebitsGlobal.wiki.actionCompleted.notice = 'Nomination completed, now redirecting to the discussion page';

			// Tagging category
			wikipedia_page = new MorebitsGlobal.wiki.page(mw.config.get('wgPageName'), 'Tagging category with rename tag');
			wikipedia_page.setCallbackParameters(params);
			wikipedia_page.load(TwinkleGlobal.xfd.callbacks.cfds.taggingCategory);

			// Adding discussion to list
			wikipedia_page = new MorebitsGlobal.wiki.page(logpage, 'Adding discussion to the list');
			wikipedia_page.setCallbackParameters(params);
			wikipedia_page.load(TwinkleGlobal.xfd.callbacks.cfds.addToList);

			break;

		case 'rfd':
			params = { usertalk: usertalk, relatedpage: relatedpage, reason: reason };
			// find target and pass main as the callback
			TwinkleGlobal.xfd.callbacks.rfd.findTarget(params, TwinkleGlobal.xfd.callbacks.rfd.main);
			break;
		default:
			alert('twinklexfd: unknown XFD discussion venue');
			break;
	}
};
})(jQuery);


// </nowiki>
