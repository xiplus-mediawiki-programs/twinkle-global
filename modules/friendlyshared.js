// <nowiki>


(function($) { // eslint-disable-line no-unused-vars


/*
 ****************************************
 *** friendlyshared.js: Shared IP tagging module
 ****************************************
 * Mode of invocation:     Tab ("Shared")
 * Active on:              Existing IP user talk pages
 */

TwinkleGlobal.shared = function friendlyshared() {
	if (mw.config.get('wgNamespaceNumber') === 3 && mw.util.isIPAddress(mw.config.get('wgTitle'))) {
		var username = mw.config.get('wgRelevantUserName');
		TwinkleGlobal.addPortletLink(function() {
			TwinkleGlobal.shared.callback(username);
		}, 'Shared IP', 'friendly-shared', 'Shared IP tagging');
	}
};

TwinkleGlobal.shared.callback = function friendlysharedCallback() {
	var Window = new MorebitsGlobal.simpleWindow(600, 420);
	Window.setTitle('Shared IP address tagging');
	Window.setScriptName('Twinkle');
	Window.addFooterLink('Twinkle help', 'WP:TW/DOC#shared');

	var form = new MorebitsGlobal.quickForm(TwinkleGlobal.shared.callback.evaluate);

	var div = form.append({
		type: 'div',
		id: 'sharedip-templatelist',
		className: 'morebitsglobal-scrollbox'
	}
	);
	div.append({ type: 'header', label: 'Shared IP address templates' });
	div.append({ type: 'radio', name: 'shared', list: TwinkleGlobal.shared.standardList,
		event: function(e) {
			TwinkleGlobal.shared.callback.change_shared(e);
			e.stopPropagation();
		}
	});

	var org = form.append({ type: 'field', label: 'Fill in other details (optional) and click "Submit"' });
	org.append({
		type: 'input',
		name: 'organization',
		label: 'IP address owner/operator',
		disabled: true,
		tooltip: 'You can optionally enter the name of the organization that owns/operates the IP address.  You can use wikimarkup if necessary.'
	}
	);
	org.append({
		type: 'input',
		name: 'host',
		label: 'Host name (optional)',
		disabled: true,
		tooltip: 'The host name (for example, proxy.example.com) can be optionally entered here and will be linked by the template.'
	}
	);
	org.append({
		type: 'input',
		name: 'contact',
		label: 'Contact information (only if requested)',
		disabled: true,
		tooltip: 'You can optionally enter some contact details for the organization.  Use this parameter only if the organization has specifically requested that it be added.  You can use wikimarkup if necessary.'
	}
	);

	form.append({ type: 'submit' });

	var result = form.render();
	Window.setContent(result);
	Window.display();
};

TwinkleGlobal.shared.standardList = [
	{
		label: '{{Shared IP}}: standard shared IP address template',
		value: 'Shared IP',
		tooltip: 'IP user talk page template that shows helpful information to IP users and those wishing to warn, block or ban them'
	},
	{
		label: '{{Shared IP edu}}: shared IP address template modified for educational institutions',
		value: 'Shared IP edu'
	},
	{
		label: '{{Shared IP corp}}: shared IP address template modified for businesses',
		value: 'Shared IP corp'
	},
	{
		label: '{{Shared IP public}}: shared IP address template modified for public terminals',
		value: 'Shared IP public'
	},
	{
		label: '{{Shared IP gov}}: shared IP address template modified for government agencies or facilities',
		value: 'Shared IP gov'
	},
	{
		label: '{{Dynamic IP}}: shared IP address template modified for organizations with dynamic addressing',
		value: 'Dynamic IP'
	},
	{
		label: '{{Static IP}}: shared IP address template modified for static IP addresses',
		value: 'Static IP'
	},
	{
		label: '{{ISP}}: shared IP address template modified for ISP organizations (specifically proxies)',
		value: 'ISP'
	},
	{
		label: '{{Mobile IP}}: shared IP address template modified for mobile phone companies and their customers',
		value: 'Mobile IP'
	},
	{
		label: '{{Whois}}: template for IP addresses in need of monitoring, but unknown whether static, dynamic or shared',
		value: 'Whois'
	}
];

TwinkleGlobal.shared.callback.change_shared = function friendlysharedCallbackChangeShared(e) {
	e.target.form.contact.disabled = e.target.value !== 'Shared IP edu';  // only supported by {{Shared IP edu}}
	e.target.form.organization.disabled = false;
	e.target.form.host.disabled = e.target.value === 'Whois';  // host= not supported by {{Whois}}
};

TwinkleGlobal.shared.callbacks = {
	main: function(pageobj) {
		var params = pageobj.getCallbackParameters();
		var pageText = pageobj.getPageText();
		var found = false;
		var text = '{{';

		for (var i = 0; i < TwinkleGlobal.shared.standardList.length; i++) {
			var tagRe = new RegExp('(\\{\\{' + TwinkleGlobal.shared.standardList[i].value + '(\\||\\}\\}))', 'im');
			if (tagRe.exec(pageText)) {
				MorebitsGlobal.status.warn('Info', 'Found {{' + TwinkleGlobal.shared.standardList[i].value + '}} on the user\'s talk page already...aborting');
				found = true;
			}
		}

		if (found) {
			return;
		}

		MorebitsGlobal.status.info('Info', 'Will add the shared IP address template to the top of the user\'s talk page.');
		text += params.value + '|' + params.organization;
		if (params.value === 'Shared IP edu' && params.contact !== '') {
			text += '|' + params.contact;
		}
		if (params.value !== 'Whois' && params.host !== '') {
			text += '|host=' + params.host;
		}
		text += '}}\n\n';

		var summaryText = 'Added {{[[Template:' + params.value + '|' + params.value + ']]}} template.';
		pageobj.setPageText(text + pageText);
		pageobj.setEditSummary(summaryText + TwinkleGlobal.getPref('summaryAd'));
		pageobj.setMinorEdit(TwinkleGlobal.getPref('markSharedIPAsMinor'));
		pageobj.setCreateOption('recreate');
		pageobj.save();
	}
};

TwinkleGlobal.shared.callback.evaluate = function friendlysharedCallbackEvaluate(e) {
	var shared = e.target.getChecked('shared');
	if (!shared || shared.length <= 0) {
		alert('You must select a shared IP address template to use!');
		return;
	}

	var value = shared[0];

	if (e.target.organization.value === '') {
		alert('You must input an organization for the {{' + value + '}} template!');
		return;
	}

	var params = {
		value: value,
		organization: e.target.organization.value,
		host: e.target.host.value,
		contact: e.target.contact.value
	};

	MorebitsGlobal.simpleWindow.setButtonsEnabled(false);
	MorebitsGlobal.status.init(e.target);

	MorebitsGlobal.wiki.actionCompleted.redirect = mw.config.get('wgPageName');
	MorebitsGlobal.wiki.actionCompleted.notice = 'Tagging complete, reloading talk page in a few seconds';

	var wikipedia_page = new MorebitsGlobal.wiki.page(mw.config.get('wgPageName'), 'User talk page modification');
	wikipedia_page.setFollowRedirect(true);
	wikipedia_page.setCallbackParameters(params);
	wikipedia_page.load(TwinkleGlobal.shared.callbacks.main);
};
})(jQuery);


// </nowiki>
