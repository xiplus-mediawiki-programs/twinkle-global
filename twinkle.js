/**
 * +-------------------------------------------------------------------------+
 * |                  === WARNING: GLOBAL GADGET FILE ===                    |
 * |                Changes to this page affect many users.                  |
 * |           Please discuss changes at [[WT:TW]] before editing.           |
 * +-------------------------------------------------------------------------+
 *
 * Imported from github [https://github.com/azatoth/twinkle].
 * All changes should be made in the repository, otherwise they will be lost.
 *
 * To update this script from github, you must have a local repository set up. Then
 * follow the instructions at [https://github.com/azatoth/twinkle/blob/master/README.md].
 *
 * ----------
 *
 * This is AzaToth's Twinkle, the popular script sidekick for newbies, admins, and
 * every Wikipedian in between. Visit [[WP:TW]] for more information.
 */
// <nowiki>

/* global MorebitsGlobal */

(function (window, document, $) { // Wrap with anonymous function

var TwinkleGlobal = {};
window.TwinkleGlobal = TwinkleGlobal;  // allow global access

// for use by custom modules (normally empty)
TwinkleGlobal.initCallbacks = [];
TwinkleGlobal.addInitCallback = function twinkleAddInitCallback(func) {
	TwinkleGlobal.initCallbacks.push(func);
};

TwinkleGlobal.defaultConfig = {};
/**
 * This holds the default set of preferences used by Twinkle.
 * It is important that all new preferences added here, especially admin-only ones, are also added to
 * |Twinkle.config.sections| in twinkleconfig.js, so they are configurable via the Twinkle preferences panel.
 * For help on the actual preferences, see the comments in twinkleconfig.js.
 *
 * Formerly Twinkle.defaultConfig.twinkle and Twinkle.defaultConfig.friendly
 */
TwinkleGlobal.defaultConfig = {
	// General
	summaryAd: ' (TwinkleGlobal)',
	deletionSummaryAd: ' (TwinkleGlobal)',
	protectionSummaryAd: ' (TwinkleGlobal)',
	userTalkPageMode: 'tab',
	dialogLargeFont: false,
	showPrefLink: true,

	// GARV
	spiWatchReport: 'yes',
	customSRGReasonList: [],
	srgCollapseNumber: 10,
	arvDisabledWikis: [],

	// Block
	blankTalkpageOnIndefBlock: false,

	// Fluff (revert and rollback)
	openTalkPage: [ 'agf', 'norm', 'vand' ],
	openTalkPageOnAutoRevert: false,
	markRevertedPagesAsMinor: [ 'vand' ],
	watchRevertedPages: [ 'agf', 'norm', 'vand', 'torev' ],
	offerReasonOnNormalRevert: true,
	confirmOnFluff: false,
	showRollbackLinks: [ 'diff', 'others' ],
	fluffDisabledWikis: [
		{ 'value': 'enwiki', 'label': '' },
		{ 'value': 'simplewiki', 'label': '' },
		{ 'value': 'zh_classicalwiki', 'label': '' },
		{ 'value': 'zhwiki', 'label': '' },
		{ 'value': 'zhwikibooks', 'label': '' },
		{ 'value': 'zhwikiquote', 'label': '' },
		{ 'value': 'zhwikiversity', 'label': '' },
		{ 'value': 'zhwikivoyage', 'label': '' },
		{ 'value': 'zhwiktionary', 'label': '' }
	],

	// DI (twinkleimage)
	notifyUserOnDeli: true,
	deliWatchPage: 'default',
	deliWatchUser: 'default',

	// PROD
	watchProdPages: true,
	prodReasonDefault: '',
	logProdPages: false,
	prodLogPageName: 'PROD log',

	// CSD
	speedySelectionStyle: 'buttonClick',
	customCSDReasonList: [],
	markSpeedyPagesAsPatrolled: false,

	// these next two should probably be identical by default
	promptForSpeedyDeletionSummary: [],
	speedyWindowHeight: 500,
	speedyWindowWidth: 800,
	logSpeedyNominations: false,
	speedyLogPageName: 'CSD log',
	noLogOnSpeedyNomination: [ 'u1' ],
	speedyDisabledWikis: [
		{ 'value': 'enwiki', 'label': '' },
		{ 'value': 'simplewiki', 'label': '' },
		{ 'value': 'zh_classicalwiki', 'label': '' },
		{ 'value': 'zhwiki', 'label': '' },
		{ 'value': 'zhwikiquote', 'label': '' },
		{ 'value': 'zhwikiversity', 'label': '' },
		{ 'value': 'zhwikivoyage', 'label': '' },
		{ 'value': 'zhwiktionary', 'label': '' }
	],

	// Unlink
	unlinkNamespaces: [ '0', '10', '100', '118' ],

	// Warn
	defaultWarningGroup: '1',
	showSharedIPNotice: true,
	watchWarnings: true,
	oldSelect: false,
	customWarningList: [],
	autoMenuAfterRollback: false,

	// XfD
	xfdWatchDiscussion: 'default',
	xfdWatchList: 'no',
	xfdWatchPage: 'default',
	xfdWatchUser: 'default',
	xfdWatchRelated: 'default',
	markXfdPagesAsPatrolled: true,

	// Diff
	diffDisabledWikis: [
		{ 'value': 'enwiki', 'label': '' },
		{ 'value': 'simplewiki', 'label': '' },
		{ 'value': 'zh_classicalwiki', 'label': '' },
		{ 'value': 'zhwiki', 'label': '' },
		{ 'value': 'zhwikibooks', 'label': '' },
		{ 'value': 'zhwikiquote', 'label': '' },
		{ 'value': 'zhwikiversity', 'label': '' },
		{ 'value': 'zhwikivoyage', 'label': '' },
		{ 'value': 'zhwiktionary', 'label': '' }
	],

	// Hidden preferences
	revertMaxRevisions: 50,
	batchdeleteChunks: 50,
	batchMax: 5000,
	batchProtectChunks: 50,
	batchundeleteChunks: 50,
	proddeleteChunks: 50,
	configPage: '//meta.wikimedia.org/wiki/User:Xiplus/Twinkle/Preferences',
	metaApi: mw.config.get('wgDBname') === 'metawiki'
		? new mw.Api()
		: new mw.ForeignApi('https://meta.wikimedia.org/w/api.php'),
	dataApi: mw.config.get('wgDBname') === 'wikidatawiki'
		? new mw.Api()
		: new mw.ForeignApi('https://www.wikidata.org/w/api.php'),
	speedyTemplateItem: 'Q4847311',
	bugReportLink: 'https://meta.wikimedia.org/wiki/User_talk:Xiplus/TwinkleGlobal',
	optionsPage: 'twinkleoptions',

	// Formerly defaultConfig.friendly:

	// Tag
	groupByDefault: true,
	watchTaggedPages: true,
	watchMergeDiscussions: true,
	markTaggedPagesAsMinor: false,
	markTaggedPagesAsPatrolled: true,
	tagArticleSortOrder: 'cat',
	customTagList: [],
	customFileTagList: [],
	customRedirectTagList: [],

	// Welcome
	topWelcomes: false,
	watchWelcomes: true,
	welcomeHeading: 'Welcome',
	insertHeadings: true,
	insertUsername: true,
	insertSignature: true,  // sign welcome templates, where appropriate
	quickWelcomeMode: 'norm',
	quickWelcomeTemplate: 'welcome',
	customWelcomeList: [],
	customWelcomeSignature: true,

	// Talkback
	markTalkbackAsMinor: true,
	insertTalkbackSignature: true,  // always sign talkback templates
	talkbackHeading: 'New message from ' + mw.config.get('wgUserName'),
	adminNoticeHeading: 'Notice',
	mailHeading: "You've got mail!",

	// Shared
	markSharedIPAsMinor: true
};

// now some skin dependent config.
switch (mw.config.get('skin')) {
	case 'vector':
		TwinkleGlobal.defaultConfig.portletArea = 'right-navigation';
		TwinkleGlobal.defaultConfig.portletId = 'p-twinkle';
		TwinkleGlobal.defaultConfig.portletName = 'TW';
		TwinkleGlobal.defaultConfig.portletType = 'menu';
		TwinkleGlobal.defaultConfig.portletNext = 'p-search';
		break;
	case 'timeless':
		TwinkleGlobal.defaultConfig.portletArea = '#page-tools .sidebar-inner';
		TwinkleGlobal.defaultConfig.portletId = 'p-twinkle';
		TwinkleGlobal.defaultConfig.portletName = 'Twinkle';
		TwinkleGlobal.defaultConfig.portletType = null;
		TwinkleGlobal.defaultConfig.portletNext = 'p-userpagetools';
		break;
	default:
		TwinkleGlobal.defaultConfig.portletArea = null;
		TwinkleGlobal.defaultConfig.portletId = 'p-cactions';
		TwinkleGlobal.defaultConfig.portletName = null;
		TwinkleGlobal.defaultConfig.portletType = null;
		TwinkleGlobal.defaultConfig.portletNext = null;
}


TwinkleGlobal.getPref = function twinkleGetPref(name) {
	if (typeof TwinkleGlobal.prefs === 'object' && TwinkleGlobal.prefs[name] !== undefined) {
		return TwinkleGlobal.prefs[name];
	}
	// Old preferences format, used before twinkleoptions.js was a thing
	if (typeof window.TwinkleConfig === 'object' && window.TwinkleConfig[name] !== undefined) {
		return window.TwinkleConfig[name];
	}
	if (typeof window.FriendlyConfig === 'object' && window.FriendlyConfig[name] !== undefined) {
		return window.FriendlyConfig[name];
	}
	return TwinkleGlobal.defaultConfig[name];
};


/**
 * **************** Twinkle.addPortlet() ****************
 *
 * Adds a portlet menu to one of the navigation areas on the page.
 * This is necessarily quite a hack since skins, navigation areas, and
 * portlet menu types all work slightly different.
 *
 * Available navigation areas depend on the skin used.
 * Monobook:
 *  "column-one", outer div class "portlet", inner div class "pBody". Existing portlets: "p-cactions", "p-personal", "p-logo", "p-navigation", "p-search", "p-interaction", "p-tb", "p-coll-print_export"
 *  Special layout of p-cactions and p-personal through specialized styles.
 * Vector:
 *  "mw-panel", outer div class "portal", inner div class "body". Existing portlets/elements: "p-logo", "p-navigation", "p-interaction", "p-tb", "p-coll-print_export"
 *  "left-navigation", outer div class "vectorTabs" or "vectorMenu", inner div class "" or "menu". Existing portlets: "p-namespaces", "p-variants" (menu)
 *  "right-navigation", outer div class "vectorTabs" or "vectorMenu", inner div class "" or "menu". Existing portlets: "p-views", "p-cactions" (menu), "p-search"
 *  Special layout of p-personal portlet (part of "head") through specialized styles.
 * Modern:
 *  "mw_contentwrapper" (top nav), outer div class "portlet", inner div class "pBody". Existing portlets or elements: "p-cactions", "mw_content"
 *  "mw_portlets" (sidebar), outer div class "portlet", inner div class "pBody". Existing portlets: "p-navigation", "p-search", "p-interaction", "p-tb", "p-coll-print_export"
 *
 * @param String navigation -- id of the target navigation area (skin dependant, on vector either of "left-navigation", "right-navigation", or "mw-panel")
 * @param String id -- id of the portlet menu to create, preferably start with "p-".
 * @param String text -- name of the portlet menu to create. Visibility depends on the class used.
 * @param String type -- type of portlet. Currently only used for the vector non-sidebar portlets, pass "menu" to make this portlet a drop down menu.
 * @param Node nextnodeid -- the id of the node before which the new item should be added, should be another item in the same list, or undefined to place it at the end.
 *
 * @return Node -- the DOM node of the new item (a DIV element) or null
 */
TwinkleGlobal.addPortlet = function(navigation, id, text, type, nextnodeid) {
	// sanity checks, and get required DOM nodes
	var root = document.getElementById(navigation) || document.querySelector(navigation);
	if (!root) {
		return null;
	}

	var item = document.getElementById(id);
	if (item) {
		if (item.parentNode && item.parentNode === root) {
			return item;
		}
		return null;
	}

	var nextnode;
	if (nextnodeid) {
		nextnode = document.getElementById(nextnodeid);
	}

	// verify/normalize input
	var skin = mw.config.get('skin');
	if (skin !== 'vector' || (navigation !== 'left-navigation' && navigation !== 'right-navigation')) {
		type = null; // menu supported only in vector's #left-navigation & #right-navigation
	}
	var outerDivClass, innerDivClass;
	switch (skin) {
		case 'vector':
			// XXX: portal doesn't work
			if (navigation !== 'portal' && navigation !== 'left-navigation' && navigation !== 'right-navigation') {
				navigation = 'mw-panel';
			}
			outerDivClass = navigation === 'mw-panel' ? 'portal' : type === 'menu' ? 'vectorMenu' : 'vectorTabs';
			break;
		case 'modern':
			if (navigation !== 'mw_portlets' && navigation !== 'mw_contentwrapper') {
				navigation = 'mw_portlets';
			}
			outerDivClass = 'portlet';
			break;
		case 'timeless':
			outerDivClass = 'mw-portlet';
			innerDivClass = 'mw-portlet-body';
			break;
		default:
			navigation = 'column-one';
			outerDivClass = 'portlet';
			break;
	}

	// Build the DOM elements.
	var outerDiv = document.createElement('div');
	outerDiv.setAttribute('role', 'navigation');
	outerDiv.setAttribute('aria-labelledby', id + '-label');
	outerDiv.className = outerDivClass + ' emptyPortlet';
	outerDiv.id = id;
	if (nextnode && nextnode.parentNode === root) {
		root.insertBefore(outerDiv, nextnode);
	} else {
		root.appendChild(outerDiv);
	}

	var h5 = document.createElement('h3');
	h5.id = id + '-label';
	var ul = document.createElement('ul');

	if (outerDivClass === 'vectorMenu') {

		// add invisible checkbox to keep menu open when clicked
		// similar to the p-cactions ("More") menu
		var chkbox = document.createElement('input');
		chkbox.className = 'vectorMenuCheckbox';
		chkbox.setAttribute('type', 'checkbox');
		chkbox.setAttribute('aria-labelledby', id + '-label');
		outerDiv.appendChild(chkbox);

		var span = document.createElement('span');
		span.appendChild(document.createTextNode(text));
		h5.appendChild(span);

		var a = document.createElement('a');
		a.href = '#';

		$(a).click(function(e) {
			e.preventDefault();
		});

		h5.appendChild(a);
		outerDiv.appendChild(h5);

		ul.className = 'menu';
		outerDiv.appendChild(ul);

	} else {

		h5.appendChild(document.createTextNode(text));
		outerDiv.appendChild(h5);
		if (innerDivClass) {
			var innerDiv = document.createElement('div');
			innerDiv.className = innerDivClass;
			innerDiv.appendChild(ul);
			outerDiv.appendChild(innerDiv);
		} else {
			outerDiv.appendChild(ul);
		}

	}

	return outerDiv;

};


/**
 * **************** Twinkle.addPortletLink() ****************
 * Builds a portlet menu if it doesn't exist yet, and add the portlet link.
 * @param task: Either a URL for the portlet link or a function to execute.
 */
TwinkleGlobal.addPortletLink = function(task, text, id, tooltip) {
	if (TwinkleGlobal.getPref('portletArea') !== null) {
		TwinkleGlobal.addPortlet(TwinkleGlobal.getPref('portletArea'), TwinkleGlobal.getPref('portletId'), TwinkleGlobal.getPref('portletName'), TwinkleGlobal.getPref('portletType'), TwinkleGlobal.getPref('portletNext'));
	}
	var link = mw.util.addPortletLink(TwinkleGlobal.getPref('portletId'), typeof task === 'string' ? task : '#', text, id, tooltip);
	$('.client-js .skin-vector #p-cactions').css('margin-right', 'initial');
	if (typeof task === 'function') {
		$(link).click(function (ev) {
			task();
			ev.preventDefault();
		});
	}
	if ($.collapsibleTabs) {
		$.collapsibleTabs.handleResize();
	}
	return link;
};


/**
 * **************** General initialization code ****************
 */

var scriptpathbefore = '//meta.wikimedia.org/w/index.php?title=',
	scriptpathafter = '&action=raw&ctype=text/javascript&happy=yes';

// Retrieve the user's Twinkle preferences
mw.loader.getScript(scriptpathbefore + 'User:' + encodeURIComponent(mw.config.get('wgUserName')) + '/' + TwinkleGlobal.defaultConfig.optionsPage + '.js' + scriptpathafter)
	.fail(function () {
		mw.notify('Could not load ' + TwinkleGlobal.defaultConfig.optionsPage + '.js');
	})
	.always(function () {
		if (TwinkleGlobal.prefs.twinkle || TwinkleGlobal.prefs.friendly) { // Old preferences format
			TwinkleGlobal.prefs = $.extend(TwinkleGlobal.prefs, TwinkleGlobal.prefs.twinkle, TwinkleGlobal.prefs.friendly);
		}
		// v2 established after unification of Twinkle/Friendly objects
		TwinkleGlobal.prefs.optionsVersion = TwinkleGlobal.prefs.optionsVersion || 1;
		$(TwinkleGlobal.load);
	});

// Developers: you can import custom Twinkle modules here
// For example, mw.loader.load(scriptpathbefore + "User:UncleDouggie/morebits-test.js" + scriptpathafter);

TwinkleGlobal.load = function () {
	// Don't activate on special pages other than those on the whitelist so that
	// they load faster, especially the watchlist.
	var specialPageWhitelist = [ 'Block', 'Contributions' ]; // wgRelevantUserName defined for non-sysops on Special:Block
	if (MorebitsGlobal.userIsSysop) {
		specialPageWhitelist = specialPageWhitelist.concat([ 'DeletedContributions', 'Prefixindex' ]);
	}
	if (mw.config.get('wgNamespaceNumber') === -1 &&
		specialPageWhitelist.indexOf(mw.config.get('wgCanonicalSpecialPageName')) === -1) {
		return;
	}

	// Prevent clickjacking
	if (window.top !== window.self) {
		return;
	}

	// Set custom Api-User-Agent header, for server-side logging purposes
	MorebitsGlobal.wiki.api.setApiUserAgent('Twinkle/2.0 (' + mw.config.get('wgDBname') + ')');

	// Load the modules in the order that the tabs should appear
	// User/user talk-related
	TwinkleGlobal.arv();
	// TwinkleGlobal.warn();
	if (MorebitsGlobal.userIsSysop) {
		// TwinkleGlobal.block();
	}
	// TwinkleGlobal.welcome();
	// TwinkleGlobal.shared();
	// TwinkleGlobal.talkback();
	// Deletion
	TwinkleGlobal.speedy();
	// TwinkleGlobal.prod();
	// TwinkleGlobal.xfd();
	// TwinkleGlobal.image();
	// Maintenance
	// TwinkleGlobal.protect();
	// TwinkleGlobal.tag();
	// Misc. ones last
	TwinkleGlobal.diff();
	// TwinkleGlobal.unlink();
	TwinkleGlobal.config.init();
	TwinkleGlobal.fluff();
	if (MorebitsGlobal.userIsSysop) {
		// TwinkleGlobal.deprod();
		// TwinkleGlobal.batchdelete();
		// TwinkleGlobal.batchprotect();
		// TwinkleGlobal.batchundelete();
	}

	if (TwinkleGlobal.getPref('showPrefLink')) {
		TwinkleGlobal.addPortletLink(TwinkleGlobal.getPref('configPage'), 'Pref', 'twg-config', 'Set Twinkle preferences');
	}

	// Run the initialization callbacks for any custom modules
	TwinkleGlobal.initCallbacks.forEach(function (func) {
		func();
	});
	TwinkleGlobal.addInitCallback = function (func) {
		func();
	};

	// Increases text size in Twinkle dialogs, if so configured
	if (TwinkleGlobal.getPref('dialogLargeFont')) {
		mw.util.addCSS('.morebits-dialog-content, .morebits-dialog-footerlinks { font-size: 100% !important; } ' +
			'.morebits-dialog input, .morebits-dialog select, .morebits-dialog-content button { font-size: inherit !important; }');
	}
};

}(window, document, jQuery)); // End wrap with anonymous function

// </nowiki>
