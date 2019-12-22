// <nowiki>


(function($) {


/*
 ****************************************
 *** friendlywelcome.js: Welcome module
 ****************************************
 * Mode of invocation:     Tab ("Wel"), or from links on diff pages
 * Active on:              Any page with relevant user name (userspace,
 *                         contribs, etc.) and diff pages
 */

TwinkleGlobal.welcome = function friendlywelcome() {
	if (MorebitsGlobal.queryString.exists('friendlywelcome')) {
		if (MorebitsGlobal.queryString.get('friendlywelcome') === 'auto') {
			TwinkleGlobal.welcome.auto();
		} else {
			TwinkleGlobal.welcome.semiauto();
		}
	} else {
		TwinkleGlobal.welcome.normal();
	}
};

TwinkleGlobal.welcome.auto = function() {
	if (MorebitsGlobal.queryString.get('action') !== 'edit') {
		// userpage not empty, aborting auto-welcome
		return;
	}

	TwinkleGlobal.welcome.welcomeUser();
};

TwinkleGlobal.welcome.semiauto = function() {
	TwinkleGlobal.welcome.callback(mw.config.get('wgRelevantUserName'));
};

TwinkleGlobal.welcome.normal = function() {
	if (MorebitsGlobal.queryString.exists('diff')) {
		// check whether the contributors' talk pages exist yet
		var $oList = $('#mw-diff-otitle2').find('span.mw-usertoollinks a.new:contains(talk)').first();
		var $nList = $('#mw-diff-ntitle2').find('span.mw-usertoollinks a.new:contains(talk)').first();

		if ($oList.length > 0 || $nList.length > 0) {
			var spanTag = function(color, content) {
				var span = document.createElement('span');
				span.style.color = color;
				span.appendChild(document.createTextNode(content));
				return span;
			};

			var welcomeNode = document.createElement('strong');
			var welcomeLink = document.createElement('a');
			welcomeLink.appendChild(spanTag('Black', '['));
			welcomeLink.appendChild(spanTag('Goldenrod', 'welcome'));
			welcomeLink.appendChild(spanTag('Black', ']'));
			welcomeNode.appendChild(welcomeLink);

			if ($oList.length > 0) {
				var oHref = $oList.attr('href');

				var oWelcomeNode = welcomeNode.cloneNode(true);
				oWelcomeNode.firstChild.setAttribute('href', oHref + '&' + MorebitsGlobal.queryString.create({
					'friendlywelcome': TwinkleGlobal.getPref('quickWelcomeMode') === 'auto' ? 'auto' : 'norm',
					'vanarticle': MorebitsGlobal.pageNameNorm
				}));
				$oList[0].parentNode.parentNode.appendChild(document.createTextNode(' '));
				$oList[0].parentNode.parentNode.appendChild(oWelcomeNode);
			}

			if ($nList.length > 0) {
				var nHref = $nList.attr('href');

				var nWelcomeNode = welcomeNode.cloneNode(true);
				nWelcomeNode.firstChild.setAttribute('href', nHref + '&' + MorebitsGlobal.queryString.create({
					'friendlywelcome': TwinkleGlobal.getPref('quickWelcomeMode') === 'auto' ? 'auto' : 'norm',
					'vanarticle': MorebitsGlobal.pageNameNorm
				}));
				$nList[0].parentNode.parentNode.appendChild(document.createTextNode(' '));
				$nList[0].parentNode.parentNode.appendChild(nWelcomeNode);
			}
		}
	}
	if (mw.config.get('wgRelevantUserName')) {
		TwinkleGlobal.addPortletLink(function() {
			TwinkleGlobal.welcome.callback(mw.config.get('wgRelevantUserName'));
		}, 'Wel', 'friendly-welcome', 'Welcome user');
	}
};

TwinkleGlobal.welcome.welcomeUser = function welcomeUser() {
	MorebitsGlobal.status.init(document.getElementById('mw-content-text'));
	$('#catlinks').remove();

	var params = {
		value: TwinkleGlobal.getPref('quickWelcomeTemplate'),
		article: MorebitsGlobal.queryString.exists('vanarticle') ? MorebitsGlobal.queryString.get('vanarticle') : '',
		mode: 'auto'
	};

	var userTalkPage = mw.config.get('wgFormattedNamespaces')[3] + ':' + mw.config.get('wgRelevantUserName');
	MorebitsGlobal.wiki.actionCompleted.redirect = userTalkPage;
	MorebitsGlobal.wiki.actionCompleted.notice = 'Welcoming complete, reloading talk page in a few seconds';

	var wikipedia_page = new MorebitsGlobal.wiki.page(userTalkPage, 'User talk page modification');
	wikipedia_page.setFollowRedirect(true);
	wikipedia_page.setCallbackParameters(params);
	wikipedia_page.load(TwinkleGlobal.welcome.callbacks.main);
};

TwinkleGlobal.welcome.callback = function friendlywelcomeCallback(uid) {
	if (uid === mw.config.get('wgUserName') && !confirm('Are you really sure you want to welcome yourself?...')) {
		return;
	}

	var Window = new MorebitsGlobal.simpleWindow(600, 420);
	Window.setTitle('Welcome user');
	Window.setScriptName('Twinkle');
	Window.addFooterLink('Welcoming Committee', 'WP:WC');
	Window.addFooterLink('Twinkle help', 'WP:TW/DOC#welcome');

	var form = new MorebitsGlobal.quickForm(TwinkleGlobal.welcome.callback.evaluate);

	form.append({
		type: 'select',
		name: 'type',
		label: 'Type of welcome: ',
		event: TwinkleGlobal.welcome.populateWelcomeList,
		list: [
			{ type: 'option', value: 'standard', label: 'Standard welcomes', selected: !mw.util.isIPAddress(mw.config.get('wgRelevantUserName')) },
			{ type: 'option', value: 'anonymous', label: 'IP user welcomes', selected: mw.util.isIPAddress(mw.config.get('wgRelevantUserName')) },
			{ type: 'option', value: 'wikiProject', label: 'WikiProject welcomes' },
			{ type: 'option', value: 'nonEnglish', label: 'Non-English welcomes' }
		]
	});

	form.append({
		type: 'div',
		id: 'welcomeWorkArea',
		className: 'morebits-scrollbox'
	});

	form.append({
		type: 'input',
		name: 'article',
		label: '* Linked article (if supported by template):',
		value: MorebitsGlobal.queryString.exists('vanarticle') ? MorebitsGlobal.queryString.get('vanarticle') : '',
		tooltip: 'An article might be linked from within the welcome if the template supports it. Leave empty for no article to be linked.  Templates that support a linked article are marked with an asterisk.'
	});

	var previewlink = document.createElement('a');
	$(previewlink).click(function() {
		TwinkleGlobal.welcome.callbacks.preview(result);  // |result| is defined below
	});
	previewlink.style.cursor = 'pointer';
	previewlink.textContent = 'Preview';
	form.append({ type: 'div', name: 'welcomepreview', label: [ previewlink ] });

	form.append({ type: 'submit' });

	var result = form.render();
	Window.setContent(result);
	Window.display();

	// initialize the welcome list
	var evt = document.createEvent('Event');
	evt.initEvent('change', true, true);
	result.type.dispatchEvent(evt);
};

TwinkleGlobal.welcome.populateWelcomeList = function(e) {
	var type = e.target.value;

	var container = new MorebitsGlobal.quickForm.element({ type: 'fragment' });

	if ((type === 'standard' || type === 'anonymous') && TwinkleGlobal.getPref('customWelcomeList').length) {
		container.append({ type: 'header', label: 'Custom welcome templates' });
		container.append({
			type: 'radio',
			name: 'template',
			list: TwinkleGlobal.getPref('customWelcomeList'),
			event: TwinkleGlobal.welcome.selectTemplate
		});
	}

	var appendTemplates = function(list) {
		container.append({
			type: 'radio',
			name: 'template',
			list: list.map(function(obj) {
				var properties = TwinkleGlobal.welcome.templates[obj];
				var result = properties ? {
					value: obj,
					label: '{{' + obj + '}}: ' + properties.description + (properties.linkedArticle ? '\u00A0*' : ''),  // U+00A0 NO-BREAK SPACE
					tooltip: properties.tooltip  // may be undefined
				} : {
					value: obj,
					label: '{{' + obj + '}}'
				};
				return result;
			}),
			event: TwinkleGlobal.welcome.selectTemplate
		});
	};

	switch (type) {
		case 'standard':
			container.append({ type: 'header', label: 'General welcome templates' });
			appendTemplates([
				'welcome',
				'welcome-short',
				'welcome-personal',
				'welcome-graphical',
				'welcome-menu',
				'welcome-screen',
				'welcome-belated',
				'welcome student',
				'welcome teacher',
				'welcome non-latin'
			]);
			container.append({ type: 'header', label: 'Problem user welcome templates' });
			appendTemplates([
				'welcomelaws',
				'first article',
				'welcometest',
				'welcomevandal',
				'welcomenpov',
				'welcomespam',
				'welcomeunsourced',
				'welcomeauto',
				'welcome-COI',
				'welcome-delete',
				'welcome-image'
			]);
			break;
		case 'anonymous':
			container.append({ type: 'header', label: 'Anonymous user welcome templates' });
			appendTemplates([
				'welcome-anon',
				'welcome-anon-test',
				'welcome-anon-unconstructive',
				'welcome-anon-constructive',
				'welcome-anon-delete'
			]);
			break;
		case 'wikiProject':
			container.append({ type: 'header', label: 'WikiProject-specific welcome templates' });
			appendTemplates([
				'welcome-anatomy',
				'welcome-athletics',
				'welcome-au',
				'welcome-bd',
				'welcome-bio',
				'welcome-cal',
				'welcome-conserv',
				'welcome-cycling',
				'welcome-dbz',
				'welcome-et',
				'welcome-de',
				'welcome-in',
				'welcome-math',
				'welcome-med',
				'welcome-no',
				'welcome-pk',
				'welcome-phys',
				'welcome-pl',
				'welcome-roads',
				'welcome-rugbyunion',
				'welcome-ru',
				'welcome-starwars',
				'welcome-ch',
				'welcome-uk',
				'welcome-videogames',
				'TWA invite'
			]);
			break;
		case 'nonEnglish':
			container.append({ type: 'header', label: 'Non-English welcome templates' });
			appendTemplates([
				'welcomeen',
				'welcomeen-sq',
				'welcomeen-ar',
				'welcomeen-zh',
				'welcomeen-nl',
				'welcomeen-fi',
				'welcomeen-fr',
				'welcomeen-de',
				'welcomeen-he',
				'welcomeen-ja',
				'welcomeen-ko',
				'welcomeen-ml',
				'welcomeen-mr',
				'welcomeen-or',
				'welcomeen-pt',
				'welcomeen-ro',
				'welcomeen-ru',
				'welcomeen-es',
				'welcomeen-sv',
				'welcomeen-uk'
			]);
			break;
		default:
			container.append({ type: 'div', label: 'Twinkle.welcome.populateWelcomeList: something went wrong' });
			break;
	}

	var rendered = container.render();
	$(e.target.form).find('div#welcomeWorkArea').empty().append(rendered);

	var firstRadio = e.target.form.template[0];
	firstRadio.checked = true;
	TwinkleGlobal.welcome.selectTemplate({ target: firstRadio });
};

TwinkleGlobal.welcome.selectTemplate = function(e) {
	var properties = TwinkleGlobal.welcome.templates[e.target.values];
	e.target.form.article.disabled = properties ? !properties.linkedArticle : false;
};


// A list of welcome templates and their properties and syntax

// The four fields that are available are "description", "linkedArticle", "syntax", and "tooltip".
// The three magic words that can be used in the "syntax" field are:
//   - $USERNAME$  - replaced by the welcomer's username, depending on user's preferences
//   - $ARTICLE$   - replaced by an article name, if "linkedArticle" is true
//   - $HEADER$    - adds a level 2 header (most templates already include this)

TwinkleGlobal.welcome.templates = {
	// GENERAL WELCOMES

	'welcome': {
		description: 'standard welcome',
		linkedArticle: true,
		syntax: '{{subst:welcome|$USERNAME$|art=$ARTICLE$}} ~~~~'
	},
	'welcome-short': {
		description: 'a shorter welcome message',
		linkedArticle: false,
		syntax: '{{subst:welcome-short|$USERNAME$}} $EXTRA$ ~~~~'
	},
	'welcome-personal': {
		description: 'more personal welcome, including a plate of cookies',
		linkedArticle: false,
		syntax: '{{subst:welcome-personal|$USERNAME$}} ~~~~'
	},
	'welcome-graphical': {
		description: 'colorful welcome message with table of about 20 links',
		linkedArticle: false,
		syntax: '$HEADER$ {{subst:welcome-graphical|$EXTRA$}}'
	},
	'welcome-menu': {
		description: 'welcome message with large table of about 60 links',
		linkedArticle: false,
		syntax: '{{subst:welcome-menu}}'
	},
	'welcome-screen': {
		description: 'welcome message with clear, annotated table of 10 links',
		linkedArticle: false,
		syntax: '$HEADER$ {{subst:welcome-screen}}'
	},
	'welcome-belated': {
		description: 'welcome for users with more substantial contributions',
		linkedArticle: false,
		syntax: '{{subst:welcome-belated|$USERNAME$}}'
	},
	'welcome student': {
		description: 'welcome for students editing as part of an educational class project',
		linkedArticle: false,
		syntax: '$HEADER$ {{subst:welcome student|$USERNAME$}} ~~~~'
	},
	'welcome teacher': {
		description: 'welcome for course instructors involved in an educational class project',
		linkedArticle: false,
		syntax: '$HEADER$ {{subst:welcome teacher|$USERNAME$}} ~~~~'
	},
	'welcome non-latin': {
		description: 'welcome for users with a username containing non-Latin characters',
		linkedArticle: false,
		syntax: '{{subst:welcome non-latin|$USERNAME$}} ~~~~'
	},

	// PROBLEM USER WELCOMES

	'welcomelaws': {
		description: 'welcome with information about copyrights, NPOV, the sandbox, and vandalism',
		linkedArticle: false,
		syntax: '{{subst:welcomelaws|$USERNAME$}} ~~~~'
	},
	'first article': {
		description: 'for someone whose first article did not meet page creation guidelines',
		linkedArticle: true,
		syntax: '{{subst:first article|$ARTICLE$|$USERNAME$}}'
	},
	'welcometest': {
		description: 'for someone whose initial efforts appear to be tests',
		linkedArticle: true,
		syntax: '{{subst:welcometest|$ARTICLE$|$USERNAME$}} ~~~~'
	},
	'welcomevandal': {
		description: 'for someone whose initial efforts appear to be vandalism',
		linkedArticle: true,
		syntax: '{{subst:welcomevandal|$ARTICLE$|$USERNAME$}}'
	},
	'welcomenpov': {
		description: 'for someone whose initial efforts do not adhere to the neutral point of view policy',
		linkedArticle: true,
		syntax: '{{subst:welcomenpov|$ARTICLE$|$USERNAME$}} ~~~~'
	},
	'welcomespam': {
		description: 'welcome with additional discussion of anti-spamming policies',
		linkedArticle: true,
		syntax: '{{subst:welcomespam|$ARTICLE$|$USERNAME$}} ~~~~'
	},
	'welcomeunsourced': {
		description: 'for someone whose initial efforts are unsourced',
		linkedArticle: true,
		syntax: '{{subst:welcomeunsourced|$ARTICLE$|$USERNAME$}} ~~~~'
	},
	'welcomeauto': {
		description: 'for someone who created an autobiographical article',
		linkedArticle: true,
		syntax: '{{subst:welcomeauto|$USERNAME$|art=$ARTICLE$}} ~~~~'
	},
	'welcome-COI': {
		description: 'for someone who has edited in areas where they may have a conflict of interest',
		linkedArticle: true,
		syntax: '{{subst:welcome-COI|$USERNAME$|art=$ARTICLE$}} ~~~~'
	},
	'welcome-delete': {
		description: 'for someone who has been removing information from articles',
		linkedArticle: true,
		syntax: '{{subst:welcome-delete|$ARTICLE$|$USERNAME$}} ~~~~'
	},
	'welcome-image': {
		description: 'welcome with additional information about images (policy and procedure)',
		linkedArticle: true,
		syntax: '{{subst:welcome-image|$USERNAME$|art=$ARTICLE$}}'
	},

	// ANONYMOUS USER WELCOMES

	'welcome-anon': {
		description: 'for anonymous users; encourages creating an account',
		linkedArticle: true,
		syntax: '{{subst:welcome-anon|art=$ARTICLE$}} ~~~~'
	},
	'welcome-anon-test': {
		description: 'for anonymous users who have performed test edits',
		linkedArticle: true,
		syntax: '{{subst:welcome-anon-test|$ARTICLE$|$USERNAME$}} ~~~~'
	},
	'welcome-anon-unconstructive': {
		description: 'for anonymous users who have vandalized or made unhelpful edits',
		linkedArticle: true,
		syntax: '{{subst:welcome-anon-unconstructive|$ARTICLE$|$USERNAME$}}'
	},
	'welcome-anon-constructive': {
		description: 'for anonymous users who fight vandalism or edit constructively',
		linkedArticle: true,
		syntax: '{{subst:welcome-anon-constructive|art=$ARTICLE$}}'
	},
	'welcome-anon-delete': {
		description: 'for anonymous users who have removed content from pages',
		linkedArticle: true,
		syntax: '{{subst:welcome-anon-delete|$ARTICLE$|$USERNAME$}} ~~~~'
	},

	// WIKIPROJECT-SPECIFIC WELCOMES

	'welcome-anatomy': {
		description: 'welcome for users with an apparent interest in anatomy topics',
		linkedArticle: false,
		syntax: '{{subst:welcome-anatomy}} ~~~~'
	},
	'welcome-athletics': {
		description: 'welcome for users with an apparent interest in athletics (track and field) topics',
		linkedArticle: false,
		syntax: '{{subst:welcome-athletics}}'
	},
	'welcome-au': {
		description: 'welcome for users with an apparent interest in Australia topics',
		linkedArticle: false,
		syntax: '{{subst:welcome-au}} ~~~~'
	},
	'welcome-bd': {
		description: 'welcome for users with an apparent interest in Bangladesh topics',
		linkedArticle: true,
		syntax: '{{subst:welcome-bd|$USERNAME$||$EXTRA$|art=$ARTICLE$}} ~~~~'
	},
	'welcome-bio': {
		description: 'welcome for users with an apparent interest in biographical topics',
		linkedArticle: false,
		syntax: '{{subst:welcome-bio}} ~~~~'
	},
	'welcome-cal': {
		description: 'welcome for users with an apparent interest in California topics',
		linkedArticle: false,
		syntax: '{{subst:welcome-cal}} ~~~~'
	},
	'welcome-conserv': {
		description: 'welcome for users with an apparent interest in conservatism topics',
		linkedArticle: false,
		syntax: '{{subst:welcome-conserv}}'
	},
	'welcome-cycling': {
		description: 'welcome for users with an apparent interest in cycling topics',
		linkedArticle: false,
		syntax: '{{subst:welcome-cycling}} ~~~~'
	},
	'welcome-dbz': {
		description: 'welcome for users with an apparent interest in Dragon Ball topics',
		linkedArticle: false,
		syntax: '{{subst:welcome-dbz|$EXTRA$|sig=~~~~}}'
	},
	'welcome-et': {
		description: 'welcome for users with an apparent interest in Estonia topics',
		linkedArticle: false,
		syntax: '{{subst:welcome-et}}'
	},
	'welcome-de': {
		description: 'welcome for users with an apparent interest in Germany topics',
		linkedArticle: false,
		syntax: '{{subst:welcome-de}} ~~~~'
	},
	'welcome-in': {
		description: 'welcome for users with an apparent interest in India topics',
		linkedArticle: true,
		syntax: '{{subst:welcome-in|$USERNAME$|art=$ARTICLE$}} ~~~~'
	},
	'welcome-math': {
		description: 'welcome for users with an apparent interest in mathematical topics',
		linkedArticle: true,
		syntax: '{{subst:welcome-math|$USERNAME$|art=$ARTICLE$}} ~~~~'
	},
	'welcome-med': {
		description: 'welcome for users with an apparent interest in medicine topics',
		linkedArticle: true,
		syntax: '{{subst:welcome-med|$USERNAME$|art=$ARTICLE$}} ~~~~'
	},
	'welcome-no': {
		description: 'welcome for users with an apparent interest in Norway topics',
		linkedArticle: false,
		syntax: '{{subst:welcome-no}} ~~~~'
	},
	'welcome-pk': {
		description: 'welcome for users with an apparent interest in Pakistan topics',
		linkedArticle: true,
		syntax: '{{subst:welcome-pk|$USERNAME$|art=$ARTICLE$}} ~~~~'
	},
	'welcome-phys': {
		description: 'welcome for users with an apparent interest in physics topics',
		linkedArticle: true,
		syntax: '{{subst:welcome-phys|$USERNAME$|art=$ARTICLE$}} ~~~~'
	},
	'welcome-pl': {
		description: 'welcome for users with an apparent interest in Poland topics',
		linkedArticle: false,
		syntax: '{{subst:welcome-pl}} ~~~~'
	},
	'welcome-rugbyunion': {
		description: 'welcome for users with an apparent interest in rugby union topics',
		linkedArticle: false,
		syntax: '{{subst:welcome-rugbyunion}} ~~~~'
	},
	'welcome-ru': {
		description: 'welcome for users with an apparent interest in Russia topics',
		linkedArticle: false,
		syntax: '{{subst:welcome-ru}} ~~~~'
	},
	'welcome-starwars': {
		description: 'welcome for users with an apparent interest in Star Wars topics',
		linkedArticle: false,
		syntax: '{{subst:welcome-starwars}} ~~~~'
	},
	'welcome-ch': {
		description: 'welcome for users with an apparent interest in Switzerland topics',
		linkedArticle: true,
		syntax: '{{subst:welcome-ch|$USERNAME$|art=$ARTICLE$}} ~~~~'
	},
	'welcome-uk': {
		description: 'welcome for users with an apparent interest in Ukraine topics',
		linkedArticle: false,
		syntax: '{{subst:welcome-uk}} ~~~~'
	},
	'welcome-roads': {
		description: 'welcome for users with an apparent interest in roads and highways topics',
		linkedArticle: false,
		syntax: '{{subst:welcome-roads}}'
	},
	'welcome-videogames': {
		description: 'welcome for users with an apparent interest in video game topics',
		linkedArticle: false,
		syntax: '{{subst:welcome-videogames}}'
	},
	'TWA invite': {
		description: 'invite the user to The Wikipedia Adventure (not a welcome template)',
		linkedArticle: false,
		syntax: '{{WP:TWA/InviteTW|signature=~~~~}}'
	},

	// NON-ENGLISH WELCOMES

	'welcomeen': {
		description: 'welcome for users whose first language is not listed here',
		linkedArticle: false,
		syntax: '{{subst:welcomeen}}'
	},
	'welcomeen-ar': {
		description: 'welcome for users whose first language appears to be Arabic',
		linkedArticle: false,
		syntax: '{{subst:welcomeen-ar}}'
	},
	'welcomeen-sq': {
		description: 'welcome for users whose first language appears to be Albanian',
		linkedArticle: false,
		syntax: '{{subst:welcomeen-sq}}'
	},
	'welcomeen-zh': {
		description: 'welcome for users whose first language appears to be Chinese',
		linkedArticle: false,
		syntax: '{{subst:welcomeen-zh}}'
	},
	'welcomeen-nl': {
		description: 'welcome for users whose first language appears to be Dutch',
		linkedArticle: false,
		syntax: '{{subst:welcomeen-nl}}'
	},
	'welcomeen-fi': {
		description: 'welcome for users whose first language appears to be Finnish',
		linkedArticle: false,
		syntax: '{{subst:welcomeen-fi}}'
	},
	'welcomeen-fr': {
		description: 'welcome for users whose first language appears to be French',
		linkedArticle: false,
		syntax: '{{subst:welcomeen-fr}}'
	},
	'welcomeen-de': {
		description: 'welcome for users whose first language appears to be German',
		linkedArticle: false,
		syntax: '{{subst:welcomeen-de}}'
	},
	'welcomeen-he': {
		description: 'welcome for users whose first language appears to be Hebrew',
		linkedArticle: false,
		syntax: '{{subst:welcomeen-he}}'
	},
	'welcomeen-ja': {
		description: 'welcome for users whose first language appears to be Japanese',
		linkedArticle: false,
		syntax: '{{subst:welcomeen-ja}}'
	},
	'welcomeen-ko': {
		description: 'welcome for users whose first language appears to be Korean',
		linkedArticle: false,
		syntax: '{{subst:welcomeen-ko}}'
	},
	'welcomeen-ml': {
		description: 'welcome for users whose first language appears to be Malayalam',
		linkedArticle: false,
		syntax: '{{subst:welcomeen-ml}}'
	},
	'welcomeen-mr': {
		description: 'welcome for users whose first language appears to be Marathi',
		linkedArticle: false,
		syntax: '{{subst:welcomeen-mr}}'
	},
	'welcomeen-or': {
		description: 'welcome for users whose first language appears to be Oriya (Odia)',
		linkedArticle: false,
		syntax: '{{subst:welcomeen-or}}'
	},
	'welcomeen-pt': {
		description: 'welcome for users whose first language appears to be Portuguese',
		linkedArticle: false,
		syntax: '{{subst:welcomeen-pt}}'
	},
	'welcomeen-ro': {
		description: 'welcome for users whose first language appears to be Romanian',
		linkedArticle: false,
		syntax: '{{subst:welcomeen-ro}}'
	},
	'welcomeen-ru': {
		description: 'welcome for users whose first language appears to be Russian',
		linkedArticle: false,
		syntax: '{{subst:welcomeen-ru}}'
	},
	'welcomeen-es': {
		description: 'welcome for users whose first language appears to be Spanish',
		linkedArticle: false,
		syntax: '{{subst:welcomeen-es}}'
	},
	'welcomeen-sv': {
		description: 'welcome for users whose first language appears to be Swedish',
		linkedArticle: false,
		syntax: '{{subst:welcomeen-sv}}'
	},
	'welcomeen-uk': {
		description: 'welcome for users whose first language appears to be Ukrainian',
		linkedArticle: false,
		syntax: '{{subst:welcomeen-uk}}'
	}
};

TwinkleGlobal.welcome.getTemplateWikitext = function(template, article) {
	var properties = TwinkleGlobal.welcome.templates[template];
	if (properties) {
		return properties.syntax.
			replace('$USERNAME$', TwinkleGlobal.getPref('insertUsername') ? mw.config.get('wgUserName') : '').
			replace('$ARTICLE$', article ? article : '').
			replace(/\$HEADER\$\s*/, '== Welcome ==\n\n').
			replace('$EXTRA$', '');  // EXTRA is not implemented yet
	}
	return '{{subst:' + template + (article ? '|art=' + article : '') + '}}' +
			(TwinkleGlobal.getPref('customWelcomeSignature') ? ' ~~~~' : '');
};

TwinkleGlobal.welcome.callbacks = {
	preview: function(form) {
		var previewDialog = new MorebitsGlobal.simpleWindow(750, 400);
		previewDialog.setTitle('Welcome template preview');
		previewDialog.setScriptName('Welcome user');
		previewDialog.setModality(true);

		var previewdiv = document.createElement('div');
		previewdiv.style.marginLeft = previewdiv.style.marginRight = '0.5em';
		previewdiv.style.fontSize = 'small';
		previewDialog.setContent(previewdiv);

		var previewer = new MorebitsGlobal.wiki.preview(previewdiv);
		previewer.beginRender(TwinkleGlobal.welcome.getTemplateWikitext(form.getChecked('template'), form.article.value), 'User talk:' + mw.config.get('wgRelevantUserName')); // Force wikitext/correct username

		var submit = document.createElement('input');
		submit.setAttribute('type', 'submit');
		submit.setAttribute('value', 'Close');
		previewDialog.addContent(submit);

		previewDialog.display();

		$(submit).click(function() {
			previewDialog.close();
		});
	},
	main: function(pageobj) {
		var params = pageobj.getCallbackParameters();
		var text = pageobj.getPageText();

		// abort if mode is auto and form is not empty
		if (pageobj.exists() && params.mode === 'auto') {
			MorebitsGlobal.status.info('Warning', 'User talk page not empty; aborting automatic welcome');
			MorebitsGlobal.wiki.actionCompleted.event();
			return;
		}

		var welcomeText = TwinkleGlobal.welcome.getTemplateWikitext(params.value, params.article);

		if (TwinkleGlobal.getPref('topWelcomes')) {
			text = welcomeText + '\n\n' + text;
		} else {
			text += '\n' + welcomeText;
		}

		var summaryText = 'Welcome to Wikipedia!';
		pageobj.setPageText(text);
		pageobj.setEditSummary(summaryText + TwinkleGlobal.getPref('summaryAd'));
		pageobj.setWatchlist(TwinkleGlobal.getPref('watchWelcomes'));
		pageobj.setCreateOption('recreate');
		pageobj.save();
	}
};

TwinkleGlobal.welcome.callback.evaluate = function friendlywelcomeCallbackEvaluate(e) {
	var form = e.target;

	var params = {
		value: form.getChecked('template'),
		article: form.article.value,
		mode: 'manual'
	};

	MorebitsGlobal.simpleWindow.setButtonsEnabled(false);
	MorebitsGlobal.status.init(form);

	var userTalkPage = mw.config.get('wgFormattedNamespaces')[3] + ':' + mw.config.get('wgRelevantUserName');
	MorebitsGlobal.wiki.actionCompleted.redirect = userTalkPage;
	MorebitsGlobal.wiki.actionCompleted.notice = 'Welcoming complete, reloading talk page in a few seconds';

	var wikipedia_page = new MorebitsGlobal.wiki.page(userTalkPage, 'User talk page modification');
	wikipedia_page.setFollowRedirect(true);
	wikipedia_page.setCallbackParameters(params);
	wikipedia_page.load(TwinkleGlobal.welcome.callbacks.main);
};
})(jQuery);


// </nowiki>
