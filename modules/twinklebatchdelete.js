// <nowiki>


(function($) {


/*
 ****************************************
 *** twinklebatchdelete.js: Batch delete module (sysops only)
 ****************************************
 * Mode of invocation:     Tab ("D-batch")
 * Active on:              Existing non-articles, and Special:PrefixIndex
 * Config directives in:   TwinkleConfig
 */

TwinkleGlobal.batchdelete = function twinklebatchdelete() {
	if (
		MorebitsGlobal.userIsInGroup('sysop') && (
			(mw.config.get('wgCurRevisionId') && mw.config.get('wgNamespaceNumber') > 0) ||
			mw.config.get('wgCanonicalSpecialPageName') === 'Prefixindex'
		)
	) {
		TwinkleGlobal.addPortletLink(TwinkleGlobal.batchdelete.callback, 'D-batch', 'twg-batch', 'Delete pages found in this category/on this page');
	}
};

TwinkleGlobal.batchdelete.unlinkCache = {};

// Has the subpages list been loaded?
var subpagesLoaded;

TwinkleGlobal.batchdelete.callback = function twinklebatchdeleteCallback() {
	subpagesLoaded = false;
	var Window = new MorebitsGlobal.simpleWindow(600, 400);
	Window.setTitle('Batch deletion');
	Window.setScriptName('Twinkle');
	Window.addFooterLink('Twinkle help', 'WP:TW/DOC#batchdelete');

	var form = new MorebitsGlobal.quickForm(TwinkleGlobal.batchdelete.callback.evaluate);
	form.append({
		type: 'checkbox',
		list: [
			{
				label: 'Delete pages',
				name: 'delete_page',
				value: 'delete',
				checked: true,
				subgroup: {
					type: 'checkbox',
					list: [
						{
							label: 'Delete associated talk pages (except user talk pages)',
							name: 'delete_talk',
							value: 'delete_talk',
							checked: true
						},
						{
							label: 'Delete redirects to deleted pages',
							name: 'delete_redirects',
							value: 'delete_redirects',
							checked: true
						},
						{
							label: 'Delete subpages of deleted pages',
							name: 'delete_subpages',
							value: 'delete_subpages',
							checked: false,
							event: TwinkleGlobal.batchdelete.callback.toggleSubpages,
							subgroup: {
								type: 'checkbox',
								list: [
									{
										label: 'Delete talk pages of deleted subpages',
										name: 'delete_subpage_talks',
										value: 'delete_subpage_talks'
									},
									{
										label: 'Delete redirects to deleted subpages',
										name: 'delete_subpage_redirects',
										value: 'delete_subpage_redirects'
									},
									{
										label: 'Unlink backlinks to each deleted subpage (in Main and Portal namespaces only)',
										name: 'unlink_subpages',
										value: 'unlink_subpages'
									}
								]
							}
						}
					]
				}
			},
			{
				label: 'Unlink backlinks to each page (in Main and Portal namespaces only)',
				name: 'unlink_page',
				value: 'unlink',
				checked: false
			},
			{
				label: 'Remove usages of each file (in all namespaces)',
				name: 'unlink_file',
				value: 'unlink_file',
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

	var query = {
		'action': 'query',
		'prop': 'revisions|info|imageinfo',
		'inprop': 'protection',
		'rvprop': 'size|user'
	};

	// On categories
	if (mw.config.get('wgNamespaceNumber') === 14) {
		query.generator = 'categorymembers';
		query.gcmtitle = mw.config.get('wgPageName');
		query.gcmlimit = TwinkleGlobal.getPref('batchMax'); // the max for sysops

	// On Special:PrefixIndex
	} else if (mw.config.get('wgCanonicalSpecialPageName') === 'Prefixindex') {

		query.generator = 'allpages';
		query.gaplimit = TwinkleGlobal.getPref('batchMax'); // the max for sysops
		if (MorebitsGlobal.queryString.exists('prefix')) {
			query.gapnamespace = MorebitsGlobal.queryString.get('namespace');
			query.gapprefix = MorebitsGlobal.string.toUpperCaseFirstChar(MorebitsGlobal.queryString.get('prefix'));
		} else {
			var pathSplit = decodeURIComponent(location.pathname).split('/');
			if (pathSplit.length < 3 || pathSplit[2] !== 'Special:PrefixIndex') {
				return;
			}
			var titleSplit = pathSplit[3].split(':');
			query.gapnamespace = mw.config.get('wgNamespaceIds')[titleSplit[0].toLowerCase()];
			if (titleSplit.length < 2 || typeof query.gapnamespace === 'undefined') {
				query.gapnamespace = 0;  // article namespace
				query.gapprefix = pathSplit.splice(3).join('/');
			} else {
				pathSplit = pathSplit.splice(4);
				pathSplit.splice(0, 0, titleSplit.splice(1).join(':'));
				query.gapprefix = pathSplit.join('/');
			}
		}

	// On normal pages
	} else {
		query.generator = 'links';
		query.titles = mw.config.get('wgPageName');
		query.gpllimit = TwinkleGlobal.getPref('batchMax'); // the max for sysops
	}

	var statusdiv = document.createElement('div');
	statusdiv.style.padding = '15px';  // just so it doesn't look broken
	Window.setContent(statusdiv);
	MorebitsGlobal.status.init(statusdiv);
	Window.display();

	TwinkleGlobal.batchdelete.pages = {};

	var statelem = new MorebitsGlobal.status('Grabbing list of pages');
	var wikipedia_api = new MorebitsGlobal.wiki.api('loading...', query, function(apiobj) {
		var xml = apiobj.responseXML;
		var $pages = $(xml).find('page').filter(':not([missing])');  // :not([imagerepository="shared"])
		$pages.each(function(index, page) {
			var $page = $(page);
			var ns = $page.attr('ns');
			var title = $page.attr('title');
			var isRedir = $page.attr('redirect') === '';
			var $editprot = $page.find('pr[type="edit"][level="sysop"]');
			var isProtected = $editprot.length > 0;
			var size = $page.find('rev').attr('size');

			var metadata = [];
			if (isRedir) {
				metadata.push('redirect');
			}
			if (isProtected) {
				metadata.push('fully protected' +
					($editprot.attr('expiry') === 'infinity' ? ' indefinitely' : ', expires ' + $editprot.attr('expiry')));
			}
			if (ns === '6') {  // mimic what delimages used to show for files
				metadata.push('uploader: ' + $page.find('ii').attr('user'));
				metadata.push('last edit from: ' + $page.find('rev').attr('user'));
			} else {
				metadata.push(size + ' bytes');
			}
			TwinkleGlobal.batchdelete.pages[title] = {
				label: title + (metadata.length ? ' (' + metadata.join('; ') + ')' : ''),
				value: title,
				checked: true,
				style: isProtected ? 'color:red' : ''
			};
		});

		var form = apiobj.params.form;
		form.append({ type: 'header', label: 'Pages to delete' });
		form.append({
			type: 'button',
			label: 'Select All',
			event: function dBatchSelectAll() {
				result.getUnchecked('pages').forEach(function(e) {
					$('input[value="' + e + '"]').click();
				});

				// Check any unchecked subpages too
				$('input[name="pages.subpages"]').prop('checked', true);
			}
		});
		form.append({
			type: 'button',
			label: 'Deselect All',
			event: function dBatchDeselectAll() {
				result.getChecked('pages').forEach(function(e) {
					$('input[value="' + e + '"]').click();
				});
			}
		});
		form.append({
			type: 'checkbox',
			name: 'pages',
			id: 'twg-dbatch-pages',
			list: $.map(TwinkleGlobal.batchdelete.pages, function (e) {
				return e;
			})
		});
		form.append({ type: 'submit' });

		var result = form.render();
		apiobj.params.Window.setContent(result);

		var pageCheckboxes = MorebitsGlobal.quickForm.getElements(result, 'pages') || [];
		pageCheckboxes.forEach(generateArrowLinks);
		MorebitsGlobal.checkboxShiftClickSupport(pageCheckboxes);

	}, statelem);

	wikipedia_api.params = { form: form, Window: Window };
	wikipedia_api.post();
};

function generateArrowLinks (checkbox) {
	var link = MorebitsGlobal.htmlNode('a', ' >');
	link.setAttribute('class', 'twg-dbatch-page-link');
	link.setAttribute('href', mw.util.getUrl(checkbox.value));
	link.setAttribute('target', '_blank');
	checkbox.nextElementSibling.append(link);
}

TwinkleGlobal.batchdelete.generateNewPageList = function(form) {

	// Update the list of checked pages in Twinkle.batchdelete.pages object
	var elements = form.elements.pages;
	if (elements instanceof NodeList) { // if there are multiple pages
		for (var i = 0; i < elements.length; ++i) {
			TwinkleGlobal.batchdelete.pages[elements[i].value].checked = elements[i].checked;
		}
	} else if (elements instanceof HTMLInputElement) { // if there is just one page
		TwinkleGlobal.batchdelete.pages[elements.value].checked = elements.checked;
	}

	return new MorebitsGlobal.quickForm.element({
		type: 'checkbox',
		name: 'pages',
		id: 'twg-dbatch-pages',
		list: $.map(TwinkleGlobal.batchdelete.pages, function (e) {
			return e;
		})
	}).render();
};

TwinkleGlobal.batchdelete.callback.toggleSubpages = function twDbatchToggleSubpages(e) {

	var form = e.target.form;
	var newPageList, pageCheckboxes, subpageCheckboxes;

	if (e.target.checked) {

		form.delete_subpage_redirects.checked = form.delete_redirects.checked;
		form.delete_subpage_talks.checked = form.delete_talk.checked;
		form.unlink_subpages.checked = form.unlink_page.checked;

		// If lists of subpages were already loaded once, they are
		// available without use of any API calls
		if (subpagesLoaded) {

			$.each(TwinkleGlobal.batchdelete.pages, function(i, el) {
				// Get back the subgroup from subgroup_, where we saved it
				if (el.subgroup === null && el.subgroup_) {
					el.subgroup = el.subgroup_;
				}
			});

			newPageList = TwinkleGlobal.batchdelete.generateNewPageList(form);
			$('#twg-dbatch-pages').replaceWith(newPageList);

			pageCheckboxes = MorebitsGlobal.quickForm.getElements(newPageList, 'pages') || [];
			pageCheckboxes.forEach(generateArrowLinks);
			MorebitsGlobal.checkboxShiftClickSupport(pageCheckboxes);

			subpageCheckboxes = MorebitsGlobal.quickForm.getElements(newPageList, 'pages.subpages') || [];
			subpageCheckboxes.forEach(generateArrowLinks);
			MorebitsGlobal.checkboxShiftClickSupport(subpageCheckboxes);

			return;
		}

		// Proceed with API calls to get list of subpages
		var loadingText = '<strong id="dbatch-subpage-loading">Loading... </strong>';
		$(e.target).after(loadingText);

		var pages = $(form.pages).map(function(i, el) {
			return el.value;
		}).get();

		var subpageLister = new MorebitsGlobal.batchOperation();
		subpageLister.setOption('chunkSize', TwinkleGlobal.getPref('batchdeleteChunks'));
		subpageLister.setPageList(pages);
		subpageLister.run(function worker (pageName) {
			var pageTitle = mw.Title.newFromText(pageName);

			// No need to look for subpages in main/file/mediawiki space
			if ([0, 6, 8].indexOf(pageTitle.namespace) > -1) {
				subpageLister.workerSuccess();
				return;
			}

			var wikipedia_api = new MorebitsGlobal.wiki.api('Getting list of subpages of ' + pageName, {
				action: 'query',
				prop: 'revisions|info|imageinfo',
				generator: 'allpages',
				rvprop: 'size',
				inprop: 'protection',
				gapprefix: pageTitle.title + '/',
				gapnamespace: pageTitle.namespace,
				gaplimit: 'max',
				pageNameFull: pageName // Not used by API, but added for access in onSuccess()
			}, function onSuccess(apiobj) {
				var xml = apiobj.responseXML;
				var $pages = $(xml).find('page');
				var subpageList = [];
				$pages.each(function(index, page) {
					var $page = $(page);
					var ns = $page.attr('ns');
					var title = $page.attr('title');
					var isRedir = $page.attr('redirect') === '';
					var $editprot = $page.find('pr[type="edit"][level="sysop"]');

					var isProtected = $editprot.length > 0;
					var size = $page.find('rev').attr('size');

					var metadata = [];
					if (isRedir) {
						metadata.push('redirect');
					}
					if (isProtected) {
						metadata.push('fully protected' +
							($editprot.attr('expiry') === 'infinity' ? ' indefinitely' : ', expires ' + $editprot.attr('expiry')));
					}
					if (ns === '6') {  // mimic what delimages used to show for files
						metadata.push('uploader: ' + $page.find('ii').attr('user'));
						metadata.push('last edit from: ' + $page.find('rev').attr('user'));
					} else {
						metadata.push(size + ' bytes');
					}
					subpageList.push({
						label: title + (metadata.length ? ' (' + metadata.join('; ') + ')' : ''),
						value: title,
						checked: true,
						style: isProtected ? 'color:red' : ''
					});
				});
				if (subpageList.length) {
					var pageName = apiobj.query.pageNameFull;
					TwinkleGlobal.batchdelete.pages[pageName].subgroup = {
						type: 'checkbox',
						name: 'subpages',
						className: 'dbatch-subpages',
						list: subpageList
					};
				}
				subpageLister.workerSuccess();
			}, null /* statusElement */, function onFailure() {
				subpageLister.workerFailure();
			});
			wikipedia_api.post();

		}, function postFinish () {
			// List 'em on the interface

			newPageList = TwinkleGlobal.batchdelete.generateNewPageList(form);
			$('#twg-dbatch-pages').replaceWith(newPageList);

			pageCheckboxes = MorebitsGlobal.quickForm.getElements(newPageList, 'pages') || [];
			pageCheckboxes.forEach(generateArrowLinks);
			MorebitsGlobal.checkboxShiftClickSupport(pageCheckboxes);

			subpageCheckboxes = MorebitsGlobal.quickForm.getElements(newPageList, 'pages.subpages') || [];
			subpageCheckboxes.forEach(generateArrowLinks);
			MorebitsGlobal.checkboxShiftClickSupport(subpageCheckboxes);

			subpagesLoaded = true;

			// Remove "Loading... " text
			$('#dbatch-subpage-loading').remove();

		});

	} else if (!e.target.checked) {

		$.each(TwinkleGlobal.batchdelete.pages, function(i, el) {
			if (el.subgroup) {
				// Remove subgroup after saving its contents in subgroup_
				// so that it can be retrieved easily if user decides to
				// delete the subpages again
				el.subgroup_ = el.subgroup;
				el.subgroup = null;
			}
		});

		newPageList = TwinkleGlobal.batchdelete.generateNewPageList(form);
		$('#twg-dbatch-pages').replaceWith(newPageList);

		pageCheckboxes = MorebitsGlobal.quickForm.getElements(newPageList, 'pages') || [];
		pageCheckboxes.forEach(generateArrowLinks);
		MorebitsGlobal.checkboxShiftClickSupport(pageCheckboxes);

	}
};

TwinkleGlobal.batchdelete.callback.evaluate = function twinklebatchdeleteCallbackEvaluate(event) {
	MorebitsGlobal.wiki.actionCompleted.notice = 'Batch deletion is now complete';

	var form = event.target;

	var numProtected = $(MorebitsGlobal.quickForm.getElements(form, 'pages')).filter(function(index, element) {
		return element.checked && element.nextElementSibling.style.color === 'red';
	}).length;
	if (numProtected > 0 && !confirm('You are about to delete ' + numProtected + ' fully protected page(s). Are you sure?')) {
		return;
	}

	var pages = form.getChecked('pages');
	var subpages = form.getChecked('pages.subpages');
	var reason = form.reason.value;
	var delete_page = form.delete_page.checked;
	var delete_talk, delete_redirects, delete_subpages;
	var delete_subpage_redirects, delete_subpage_talks, unlink_subpages;
	if (delete_page) {
		delete_talk = form.delete_talk.checked;
		delete_redirects = form.delete_redirects.checked;
		delete_subpages = form.delete_subpages.checked;
		if (delete_subpages) {
			delete_subpage_redirects = form.delete_subpage_redirects.checked;
			delete_subpage_talks = form.delete_subpage_talks.checked;
			unlink_subpages = form.unlink_subpages.checked;
		}
	}
	var unlink_page = form.unlink_page.checked;
	var unlink_file = form.unlink_file.checked;
	if (!reason) {
		alert('You need to give a reason, you cabal crony!');
		return;
	}
	MorebitsGlobal.simpleWindow.setButtonsEnabled(false);
	MorebitsGlobal.status.init(form);
	if (!pages) {
		MorebitsGlobal.status.error('Error', 'nothing to delete, aborting');
		return;
	}

	var pageDeleter = new MorebitsGlobal.batchOperation(delete_page ? 'Deleting pages' : 'Initiating requested tasks');
	pageDeleter.setOption('chunkSize', TwinkleGlobal.getPref('batchdeleteChunks'));
	// we only need the initial status lines if we're deleting the pages in the pages array
	pageDeleter.setOption('preserveIndividualStatusLines', delete_page);
	pageDeleter.setPageList(pages);
	pageDeleter.run(function worker(pageName) {
		var params = {
			page: pageName,
			delete_page: delete_page,
			delete_talk: delete_talk,
			delete_redirects: delete_redirects,
			unlink_page: unlink_page,
			unlink_file: unlink_file && /^(File|Image):/i.test(pageName),
			reason: reason,
			pageDeleter: pageDeleter
		};

		var wikipedia_page = new MorebitsGlobal.wiki.page(pageName, 'Deleting page ' + pageName);
		wikipedia_page.setCallbackParameters(params);
		if (delete_page) {
			wikipedia_page.setEditSummary(reason + TwinkleGlobal.getPref('deletionSummaryAd'));
			wikipedia_page.suppressProtectWarning();
			wikipedia_page.deletePage(TwinkleGlobal.batchdelete.callbacks.doExtras, pageDeleter.workerFailure);
		} else {
			TwinkleGlobal.batchdelete.callbacks.doExtras(wikipedia_page);
		}
	}, function postFinish() {
		if (delete_subpages) {
			var subpageDeleter = new MorebitsGlobal.batchOperation('Deleting subpages');
			subpageDeleter.setOption('chunkSize', TwinkleGlobal.getPref('batchdeleteChunks'));
			subpageDeleter.setOption('preserveIndividualStatusLines', true);
			subpageDeleter.setPageList(subpages);
			subpageDeleter.run(function(pageName) {
				var params = {
					page: pageName,
					delete_page: true,
					delete_talk: delete_subpage_talks,
					delete_redirects: delete_subpage_redirects,
					unlink_page: unlink_subpages,
					unlink_file: false,
					reason: reason,
					pageDeleter: subpageDeleter
				};

				var wikipedia_page = new MorebitsGlobal.wiki.page(pageName, 'Deleting subpage ' + pageName);
				wikipedia_page.setCallbackParameters(params);
				wikipedia_page.setEditSummary(reason + TwinkleGlobal.getPref('deletionSummaryAd'));
				wikipedia_page.suppressProtectWarning();
				wikipedia_page.deletePage(TwinkleGlobal.batchdelete.callbacks.doExtras, pageDeleter.workerFailure);
			});
		}
	});
};

TwinkleGlobal.batchdelete.callbacks = {
	// this stupid parameter name is a temporary thing until I implement an overhaul
	// of MorebitsGlobal.wiki.* callback parameters
	doExtras: function(thingWithParameters) {
		var params = thingWithParameters.parent ? thingWithParameters.parent.getCallbackParameters() :
			thingWithParameters.getCallbackParameters();
		// the initial batch operation's job is to delete the page, and that has
		// succeeded by now
		params.pageDeleter.workerSuccess(thingWithParameters);

		var query, wikipedia_api;

		if (params.unlink_page) {
			TwinkleGlobal.batchdelete.unlinkCache = {};
			query = {
				'action': 'query',
				'list': 'backlinks',
				'blfilterredir': 'nonredirects',
				'blnamespace': [0, 100], // main space and portal space only
				'bltitle': params.page,
				'bllimit': 'max'  // 500 is max for normal users, 5000 for bots and sysops
			};
			wikipedia_api = new MorebitsGlobal.wiki.api('Grabbing backlinks', query, TwinkleGlobal.batchdelete.callbacks.unlinkBacklinksMain);
			wikipedia_api.params = params;
			wikipedia_api.post();
		}

		if (params.unlink_file) {
			query = {
				'action': 'query',
				'list': 'imageusage',
				'iutitle': params.page,
				'iulimit': 'max'  // 500 is max for normal users, 5000 for bots and sysops
			};
			wikipedia_api = new MorebitsGlobal.wiki.api('Grabbing file links', query, TwinkleGlobal.batchdelete.callbacks.unlinkImageInstancesMain);
			wikipedia_api.params = params;
			wikipedia_api.post();
		}

		if (params.delete_page) {
			if (params.delete_redirects) {
				query = {
					'action': 'query',
					'titles': params.page,
					'prop': 'redirects',
					'rdlimit': 'max'  // 500 is max for normal users, 5000 for bots and sysops
				};
				wikipedia_api = new MorebitsGlobal.wiki.api('Grabbing redirects', query, TwinkleGlobal.batchdelete.callbacks.deleteRedirectsMain);
				wikipedia_api.params = params;
				wikipedia_api.post();
			}
			if (params.delete_talk) {
				var pageTitle = mw.Title.newFromText(params.page);
				if (pageTitle && pageTitle.namespace % 2 === 0 && pageTitle.namespace !== 2) {
					pageTitle.namespace++;  // now pageTitle is the talk page title!
					query = {
						'action': 'query',
						'titles': pageTitle.toText()
					};
					wikipedia_api = new MorebitsGlobal.wiki.api('Checking whether talk page exists', query, TwinkleGlobal.batchdelete.callbacks.deleteTalk);
					wikipedia_api.params = params;
					wikipedia_api.params.talkPage = pageTitle.toText();
					wikipedia_api.post();
				}
			}
		}
	},
	deleteRedirectsMain: function(apiobj) {
		var xml = apiobj.responseXML;
		var pages = $(xml).find('rd').map(function() {
			return $(this).attr('title');
		}).get();
		if (!pages.length) {
			return;
		}

		var redirectDeleter = new MorebitsGlobal.batchOperation('Deleting redirects to ' + apiobj.params.page);
		redirectDeleter.setOption('chunkSize', TwinkleGlobal.getPref('batchdeleteChunks'));
		redirectDeleter.setPageList(pages);
		redirectDeleter.run(function(pageName) {
			var wikipedia_page = new MorebitsGlobal.wiki.page(pageName, 'Deleting ' + pageName);
			wikipedia_page.setEditSummary('[[WP:CSD#G8|G8]]: Redirect to deleted page "' + apiobj.params.page + '"' + TwinkleGlobal.getPref('deletionSummaryAd'));
			wikipedia_page.deletePage(redirectDeleter.workerSuccess, redirectDeleter.workerFailure);
		});
	},
	deleteTalk: function(apiobj) {
		var xml = apiobj.responseXML;
		var exists = $(xml).find('page:not([missing])').length > 0;

		if (!exists) {
			// no talk page; forget about it
			return;
		}

		var page = new MorebitsGlobal.wiki.page(apiobj.params.talkPage, 'Deleting talk page of article ' + apiobj.params.page);
		page.setEditSummary('[[WP:CSD#G8|G8]]: [[Help:Talk page|Talk page]] of deleted page "' + apiobj.params.page + '"' + TwinkleGlobal.getPref('deletionSummaryAd'));
		page.deletePage();
	},
	unlinkBacklinksMain: function(apiobj) {
		var xml = apiobj.responseXML;
		var pages = $(xml).find('bl').map(function() {
			return $(this).attr('title');
		}).get();
		if (!pages.length) {
			return;
		}

		var unlinker = new MorebitsGlobal.batchOperation('Unlinking backlinks to ' + apiobj.params.page);
		unlinker.setOption('chunkSize', TwinkleGlobal.getPref('batchdeleteChunks'));
		unlinker.setPageList(pages);
		unlinker.run(function(pageName) {
			var wikipedia_page = new MorebitsGlobal.wiki.page(pageName, 'Unlinking on ' + pageName);
			var params = $.extend({}, apiobj.params);
			params.title = pageName;
			params.unlinker = unlinker;
			wikipedia_page.setCallbackParameters(params);
			wikipedia_page.load(TwinkleGlobal.batchdelete.callbacks.unlinkBacklinks);
		});
	},
	unlinkBacklinks: function(pageobj) {
		var params = pageobj.getCallbackParameters();
		if (!pageobj.exists()) {
			// we probably just deleted it, as a recursive backlink
			params.unlinker.workerSuccess(pageobj);
			return;
		}

		var text;
		if (params.title in TwinkleGlobal.batchdelete.unlinkCache) {
			text = TwinkleGlobal.batchdelete.unlinkCache[params.title];
		} else {
			text = pageobj.getPageText();
		}
		var old_text = text;
		var wikiPage = new MorebitsGlobal.wikitext.page(text);
		wikiPage.removeLink(params.page);

		text = wikiPage.getText();
		TwinkleGlobal.batchdelete.unlinkCache[params.title] = text;
		if (text === old_text) {
			// Nothing to do, return
			params.unlinker.workerSuccess(pageobj);
			return;
		}
		pageobj.setEditSummary('Removing link(s) to deleted page ' + params.page + TwinkleGlobal.getPref('deletionSummaryAd'));
		pageobj.setPageText(text);
		pageobj.setCreateOption('nocreate');
		pageobj.setMaxConflictRetries(10);
		pageobj.save(params.unlinker.workerSuccess, params.unlinker.workerFailure);
	},
	unlinkImageInstancesMain: function(apiobj) {
		var xml = apiobj.responseXML;
		var pages = $(xml).find('iu').map(function() {
			return $(this).attr('title');
		}).get();
		if (!pages.length) {
			return;
		}

		var unlinker = new MorebitsGlobal.batchOperation('Unlinking backlinks to ' + apiobj.params.page);
		unlinker.setOption('chunkSize', TwinkleGlobal.getPref('batchdeleteChunks'));
		unlinker.setPageList(pages);
		unlinker.run(function(pageName) {
			var wikipedia_page = new MorebitsGlobal.wiki.page(pageName, 'Removing file usages on ' + pageName);
			var params = $.extend({}, apiobj.params);
			params.title = pageName;
			params.unlinker = unlinker;
			wikipedia_page.setCallbackParameters(params);
			wikipedia_page.load(TwinkleGlobal.batchdelete.callbacks.unlinkImageInstances);
		});
	},
	unlinkImageInstances: function(pageobj) {
		var params = pageobj.getCallbackParameters();
		if (!pageobj.exists()) {
			// we probably just deleted it, as a recursive backlink
			params.unlinker.workerSuccess(pageobj);
			return;
		}

		var image = params.page.replace(/^(?:Image|File):/, '');
		var text;
		if (params.title in TwinkleGlobal.batchdelete.unlinkCache) {
			text = TwinkleGlobal.batchdelete.unlinkCache[params.title];
		} else {
			text = pageobj.getPageText();
		}
		var old_text = text;
		var wikiPage = new MorebitsGlobal.wikitext.page(text);
		wikiPage.commentOutImage(image, 'Commented out because image was deleted');

		text = wikiPage.getText();
		TwinkleGlobal.batchdelete.unlinkCache[params.title] = text;
		if (text === old_text) {
			pageobj.getStatusElement().error('failed to unlink image ' + image + ' from ' + pageobj.getPageName());
			params.unlinker.workerFailure(pageobj);
			return;
		}
		pageobj.setEditSummary('Removing instance of file ' + image + ' that has been deleted because "' + params.reason + '")' + TwinkleGlobal.getPref('deletionSummaryAd'));
		pageobj.setPageText(text);
		pageobj.setCreateOption('nocreate');
		pageobj.setMaxConflictRetries(10);
		pageobj.save(params.unlinker.workerSuccess, params.unlinker.workerFailure);
	}
};
})(jQuery);


// </nowiki>
