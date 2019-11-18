// <nowiki>


(function($) {


/*
 ****************************************
 *** twinklebatchundelete.js: Batch undelete module
 ****************************************
 * Mode of invocation:     Tab ("Und-batch")
 * Active on:              Existing user and project pages
 * Config directives in:   TwinkleConfig
 */


TwinkleGlobal.batchundelete = function twinklebatchundelete() {
	if ((mw.config.get('wgNamespaceNumber') !== mw.config.get('wgNamespaceIds').user &&
		mw.config.get('wgNamespaceNumber') !== mw.config.get('wgNamespaceIds').project) ||
		!mw.config.get('wgArticleId')) {
		return;
	}
	if (MorebitsGlobal.userIsInGroup('sysop')) {
		TwinkleGlobal.addPortletLink(TwinkleGlobal.batchundelete.callback, 'Und-batch', 'twg-batch-undel', "Undelete 'em all");
	}
};

TwinkleGlobal.batchundelete.callback = function twinklebatchundeleteCallback() {
	var Window = new MorebitsGlobal.simpleWindow(600, 400);
	Window.setScriptName('Twinkle');
	Window.setTitle('Batch undelete');
	Window.addFooterLink('Twinkle help', 'WP:TW/DOC#batchundelete');

	var form = new MorebitsGlobal.quickForm(TwinkleGlobal.batchundelete.callback.evaluate);
	form.append({
		type: 'checkbox',
		list: [
			{
				label: 'Restore talk pages of undeleted pages if they existed',
				name: 'undel_talk',
				value: 'undel_talk',
				checked: true
			}
		]
	});
	form.append({
		type: 'input',
		name: 'reason',
		label: 'Reason: ',
		size: 60
	});

	var statusdiv = document.createElement('div');
	statusdiv.style.padding = '15px';  // just so it doesn't look broken
	Window.setContent(statusdiv);
	MorebitsGlobal.status.init(statusdiv);
	Window.display();

	var query = {
		'action': 'query',
		'generator': 'links',
		'prop': 'info',
		'inprop': 'protection',
		'titles': mw.config.get('wgPageName'),
		'gpllimit': TwinkleGlobal.getPref('batchMax') // the max for sysops
	};
	var statelem = new MorebitsGlobal.status('Grabbing list of pages');
	var wikipedia_api = new MorebitsGlobal.wiki.api('loading...', query, function(apiobj) {
		var xml = apiobj.responseXML;
		var $pages = $(xml).find('page[missing]');
		var list = [];
		$pages.each(function(index, page) {
			var $page = $(page);
			var title = $page.attr('title');
			var $editprot = $page.find('pr[type="create"][level="sysop"]');
			var isProtected = $editprot.length > 0;

			list.push({
				label: title + (isProtected ? ' (fully create protected' + ($editprot.attr('expiry') === 'infinity' ? ' indefinitely' : ', expires ' + $editprot.attr('expiry')) + ')' : ''),
				value: title,
				checked: true,
				style: isProtected ? 'color:red' : ''
			});
		});
		apiobj.params.form.append({ type: 'header', label: 'Pages to undelete' });
		apiobj.params.form.append({
			type: 'button',
			label: 'Select All',
			event: function(e) {
				$(MorebitsGlobal.quickForm.getElements(e.target.form, 'pages')).prop('checked', true);
			}
		});
		apiobj.params.form.append({
			type: 'button',
			label: 'Deselect All',
			event: function(e) {
				$(MorebitsGlobal.quickForm.getElements(e.target.form, 'pages')).prop('checked', false);
			}
		});
		apiobj.params.form.append({
			type: 'checkbox',
			name: 'pages',
			list: list
		});
		apiobj.params.form.append({ type: 'submit' });

		var result = apiobj.params.form.render();
		apiobj.params.Window.setContent(result);

		MorebitsGlobal.checkboxShiftClickSupport(MorebitsGlobal.quickForm.getElements(result, 'pages'));
	}, statelem);
	wikipedia_api.params = { form: form, Window: Window };
	wikipedia_api.post();
};

TwinkleGlobal.batchundelete.callback.evaluate = function(event) {
	MorebitsGlobal.wiki.actionCompleted.notice = 'Batch undeletion is now complete';

	var numProtected = $(MorebitsGlobal.quickForm.getElements(event.target, 'pages')).filter(function(index, element) {
		return element.checked && element.nextElementSibling.style.color === 'red';
	}).length;
	if (numProtected > 0 && !confirm('You are about to undelete ' + numProtected + ' fully create protected page(s). Are you sure?')) {
		return;
	}

	var pages = event.target.getChecked('pages');
	var reason = event.target.reason.value;
	var undel_talk = event.target.reason.value;
	if (!reason) {
		alert('You need to give a reason, you cabal crony!');
		return;
	}
	MorebitsGlobal.simpleWindow.setButtonsEnabled(false);
	MorebitsGlobal.status.init(event.target);

	if (!pages) {
		MorebitsGlobal.status.error('Error', 'nothing to undelete, aborting');
		return;
	}


	var pageUndeleter = new MorebitsGlobal.batchOperation('Undeleting pages');
	pageUndeleter.setOption('chunkSize', TwinkleGlobal.getPref('batchUndeleteChunks'));
	pageUndeleter.setOption('preserveIndividualStatusLines', true);
	pageUndeleter.setPageList(pages);
	pageUndeleter.run(function(pageName) {
		var params = {
			page: pageName,
			undel_talk: undel_talk,
			reason: reason,
			pageUndeleter: pageUndeleter
		};

		var wikipedia_page = new MorebitsGlobal.wiki.page(pageName, 'Undeleting page ' + pageName);
		wikipedia_page.setCallbackParameters(params);
		wikipedia_page.setEditSummary(reason + TwinkleGlobal.getPref('deletionSummaryAd'));
		wikipedia_page.suppressProtectWarning();
		wikipedia_page.setMaxRetries(3); // temporary increase from 2 to make batchundelete more likely to succeed [[phab:T222402]] #613
		wikipedia_page.undeletePage(TwinkleGlobal.batchundelete.callbacks.doExtras, pageUndeleter.workerFailure);
	});
};

TwinkleGlobal.batchundelete.callbacks = {
	// this stupid parameter name is a temporary thing until I implement an overhaul
	// of MorebitsGlobal.wiki.* callback parameters
	doExtras: function(thingWithParameters) {
		var params = thingWithParameters.parent ? thingWithParameters.parent.getCallbackParameters() :
			thingWithParameters.getCallbackParameters();
		// the initial batch operation's job is to delete the page, and that has
		// succeeded by now
		params.pageUndeleter.workerSuccess(thingWithParameters);

		var query, wikipedia_api;

		if (params.undel_talk) {
			var talkpagename = new mw.Title(params.page).getTalkPage().getPrefixedText();
			if (talkpagename !== params.page) {
				query = {
					'action': 'query',
					'prop': 'deletedrevisions',
					'drvprop': 'ids',
					'drvlimit': 1,
					'titles': talkpagename
				};
				wikipedia_api = new MorebitsGlobal.wiki.api('Checking talk page for deleted revisions', query, TwinkleGlobal.batchundelete.callbacks.undeleteTalk);
				wikipedia_api.params = params;
				wikipedia_api.params.talkPage = talkpagename;
				wikipedia_api.post();
			}
		}
	},
	undeleteTalk: function(apiobj) {
		var xml = apiobj.responseXML;
		var exists = $(xml).find('page:not([missing])').length > 0;
		var delrevs = $(xml).find('rev').attr('revid');

		if (exists || !delrevs) {
			// page exists or has no deleted revisions; forget about it
			return;
		}

		var page = new MorebitsGlobal.wiki.page(apiobj.params.talkPage, 'Undeleting talk page of ' + apiobj.params.page);
		page.setEditSummary('Undeleting [[Help:Talk page|talk page]] of "' + apiobj.params.page + '"' + TwinkleGlobal.getPref('deletionSummaryAd'));
		page.undeletePage();
	}
};

})(jQuery);


// </nowiki>
