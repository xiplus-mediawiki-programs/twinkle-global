// <nowiki>


(function($) {


/*
 ****************************************
 *** twinklefluff.js: Revert/rollback module
 ****************************************
 * Mode of invocation:     Links on contributions, recent changes, history, and diff pages
 * Active on:              Diff pages, history pages, Special:RecentChanges(Linked),
                           and Special:Contributions
 */

/**
 Twinklefluff revert and antivandalism utility
 */

TwinkleGlobal.fluff = function twinklefluff() {
	var disabledWikis = $.map(TwinkleGlobal.getPref('fluffDisabledWikis'), function(el) {
		return el.value.trim();
	});

	if (disabledWikis.indexOf(mw.config.get('wgDBname')) !== -1) {
		return;
	}

	// Only proceed if the user can actually edit the page in question
	// (see #632 for contribs issue).  wgIsProbablyEditable should take
	// care of namespace/contentModel restrictions as well as explicit
	// protections; it won't take care of cascading or TitleBlacklist.
	if (mw.config.get('wgIsProbablyEditable')) {
		// wgDiffOldId included for clarity in if else loop [[phab:T214985]]
		if (mw.config.get('wgDiffNewId') || mw.config.get('wgDiffOldId')) {
			// Reload alongside the revision slider
			mw.hook('wikipage.diff').add(function () {
				TwinkleGlobal.fluff.addLinks.diff();
			});
		} else if (mw.config.get('wgAction') === 'view' && mw.config.get('wgRevisionId') && mw.config.get('wgCurRevisionId') !== mw.config.get('wgRevisionId')) {
			TwinkleGlobal.fluff.addLinks.oldid();
		} else if (mw.config.get('wgAction') === 'history' && mw.config.get('wgArticleId')) {
			TwinkleGlobal.fluff.addLinks.history();
		}
	} else if (mw.config.get('wgNamespaceNumber') === -1) {
		TwinkleGlobal.fluff.skipTalk = !TwinkleGlobal.getPref('openTalkPageOnAutoRevert');
		TwinkleGlobal.fluff.rollbackInPlace = TwinkleGlobal.getPref('rollbackInPlace');

		if (mw.config.get('wgCanonicalSpecialPageName') === 'Contributions') {
			TwinkleGlobal.fluff.addLinks.contributions();
		} else if (mw.config.get('wgCanonicalSpecialPageName') === 'Recentchanges' || mw.config.get('wgCanonicalSpecialPageName') === 'Recentchangeslinked') {
			// Reload with recent changes updates
			// structuredChangeFilters.ui.initialized is just on load
			mw.hook('wikipage.content').add(function(item) {
				if (item.is('div')) {
					TwinkleGlobal.fluff.addLinks.recentchanges();
				}
			});
		}
	}
};

// A list of usernames, usually only bots, that vandalism revert is jumped
// over; that is, if vandalism revert was chosen on such username, then its
// target is on the revision before.  This is for handling quick bots that
// makes edits seconds after the original edit is made.  This only affects
// vandalism rollback; for good faith rollback, it will stop, indicating a bot
// has no faith, and for normal rollback, it will rollback that edit.
TwinkleGlobal.fluff.trustedBots = [];
TwinkleGlobal.fluff.skipTalk = null;
TwinkleGlobal.fluff.rollbackInPlace = null;
// String to insert when a username is hidden
TwinkleGlobal.fluff.hiddenName = 'an unknown user';

// Consolidated construction of fluff links
TwinkleGlobal.fluff.linkBuilder = {
	spanTag: function(className, content) {
		var span = document.createElement('span');
		span.setAttribute('class', className);
		span.appendChild(document.createTextNode(content));
		return span;
	},

	buildLink: function(className, text) {
		var link = document.createElement('a');
		link.appendChild(TwinkleGlobal.fluff.linkBuilder.spanTag('twg-rollback-link-wrapper', '['));
		link.appendChild(TwinkleGlobal.fluff.linkBuilder.spanTag('twg-rollback-link-' + className + '-text', text));
		link.appendChild(TwinkleGlobal.fluff.linkBuilder.spanTag('twg-rollback-link-wrapper', ']'));
		link.href = '#';
		return link;
	},

	/**
	 * @param {string} [vandal=null] - Username of the editor being reverted
	 * Provide a falsey value if the username is hidden, defaults to null
	 * @param {boolean} inline - True to create two links in a span, false
	 * to create three links in a div (optional)
	 * @param {number|string} [rev=wgCurRevisionId] - Revision ID being reverted (optional)
	 * @param {string} [page=wgPageName] - Page being reverted (optional)
	 */
	rollbackLinks: function(vandal, inline, rev, page) {
		vandal = vandal || null;

		var elem = inline ? 'span' : 'div';
		var revNode = document.createElement(elem);

		rev = parseInt(rev, 10);
		if (rev) {
			revNode.setAttribute('id', 'tw-revert' + rev);
		} else {
			revNode.setAttribute('id', 'tw-revert');
		}

		var separator = inline ? ' ' : ' || ';
		var sepNode1 = document.createElement('span');
		var sepText = document.createTextNode(separator);
		sepNode1.setAttribute('class', 'twg-rollback-link-separator');
		sepNode1.appendChild(sepText);

		var sepNode2 = sepNode1.cloneNode(true);

		var normNode = document.createElement('span');
		var vandNode = document.createElement('span');

		var normLink = TwinkleGlobal.fluff.linkBuilder.buildLink('normal', 'rollback');
		var vandLink = TwinkleGlobal.fluff.linkBuilder.buildLink('vandalism', 'vandalism');

		normLink.style.fontWeight = 'bold';
		vandLink.style.fontWeight = 'bold';

		$(normLink).click(function() {
			TwinkleGlobal.fluff.revert('norm', vandal, rev, page);
			TwinkleGlobal.fluff.disableLinks(revNode);
		});
		$(vandLink).click(function() {
			TwinkleGlobal.fluff.revert('vand', vandal, rev, page);
			TwinkleGlobal.fluff.disableLinks(revNode);
		});

		normNode.setAttribute('class', 'twg-rollback-link-normal');
		vandNode.setAttribute('class', 'twg-rollback-link-vandalism');

		if (inline) {
			normNode.appendChild(sepNode1);
		}
		vandNode.appendChild(sepNode2);

		normNode.appendChild(normLink);
		vandNode.appendChild(vandLink);

		revNode.appendChild(normNode);
		if (TwinkleGlobal.getPref('showVandRollbackLink')) {
			revNode.appendChild(vandNode);
		}

		return revNode;
	},

	// Build [restore this revision] links
	restoreThisRevisionLink: function(revisionRef, inline) {
		// If not a specific revision number, should be wgDiffNewId/wgDiffOldId/wgRevisionId
		revisionRef = typeof revisionRef === 'number' ? revisionRef : mw.config.get(revisionRef);

		var elem = inline ? 'span' : 'div';
		var revertToRevisionNode = document.createElement(elem);

		revertToRevisionNode.setAttribute('id', 'tw-revert-to-' + revisionRef);
		revertToRevisionNode.setAttribute('class', 'twg-rollback-link-revert-to');
		revertToRevisionNode.style.fontWeight = 'bold';

		var revertToRevisionLink = TwinkleGlobal.fluff.linkBuilder.buildLink('revert-to', 'restore this version');
		$(revertToRevisionLink).click(function() {
			TwinkleGlobal.fluff.revertToRevision(revisionRef);
		});

		if (inline) {
			revertToRevisionNode.appendChild(document.createTextNode(' '));
		}
		revertToRevisionNode.appendChild(revertToRevisionLink);
		return revertToRevisionNode;
	}
};


TwinkleGlobal.fluff.addLinks = {
	contributions: function() {
		// $('sp-contributions-footer-anon-range') relies on the fmbox
		// id in [[MediaWiki:Sp-contributions-footer-anon-range]] and
		// is used to show rollback/vandalism links for IP ranges
		var isRange = !!$('#sp-contributions-footer-anon-range')[0];
		if (mw.config.exists('wgRelevantUserName') || isRange) {
			// Get the username these contributions are for
			var username = mw.config.get('wgRelevantUserName');
			if (TwinkleGlobal.getPref('showRollbackLinks').indexOf('contribs') !== -1 ||
				(mw.config.get('wgUserName') !== username && TwinkleGlobal.getPref('showRollbackLinks').indexOf('others') !== -1) ||
				(mw.config.get('wgUserName') === username && TwinkleGlobal.getPref('showRollbackLinks').indexOf('mine') !== -1)) {
				var $list = $('#mw-content-text').find('ul li:has(span.mw-uctop):has(.mw-changeslist-diff)');

				$list.each(function(key, current) {
					// revid is also available in the href of both
					// .mw-changeslist-date or .mw-changeslist-diff
					var page = $(current).find('.mw-contributions-title').text();

					// Get username for IP ranges (wgRelevantUserName is null)
					if (isRange) {
						// The :not is possibly unnecessary, as it appears that
						// .mw-userlink is simply not present if the username is hidden
						username = $(current).find('.mw-userlink:not(.history-deleted)').text();
					}

					// It's unlikely, but we can't easily check for revdel'd usernames
					// since only a strong element is provided, with no easy selector [[phab:T255903]]
					current.appendChild(TwinkleGlobal.fluff.linkBuilder.rollbackLinks(username, true, current.dataset.mwRevid, page));
				});
			}
		}
	},

	recentchanges: function() {
		if (TwinkleGlobal.getPref('showRollbackLinks').indexOf('recent') !== -1) {
			// Latest and revertable (not page creations, logs, categorizations, etc.)
			var $list = $('.mw-changeslist .mw-changeslist-last.mw-changeslist-src-mw-edit');
			// Exclude top-level header if "group changes" preference is used
			// and find only individual lines or nested lines
			$list = $list.not('.mw-rcfilters-ui-highlights-enhanced-toplevel').find('.mw-changeslist-line-inner, td.mw-enhanced-rc-nested');

			$list.each(function(key, current) {
				// The :not is possibly unnecessary, as it appears that
				// .mw-userlink is simply not present if the username is hidden
				var vandal = $(current).find('.mw-userlink:not(.history-deleted)').text();
				var href = $(current).find('.mw-changeslist-diff').attr('href');
				var rev = mw.util.getParamValue('diff', href);
				var page = current.dataset.targetPage;
				current.appendChild(TwinkleGlobal.fluff.linkBuilder.rollbackLinks(vandal, true, rev, page));
			});
		}
	},

	history: function() {
		if (TwinkleGlobal.getPref('showRollbackLinks').indexOf('history') !== -1) {
			// All revs
			var histList = $('#pagehistory li').toArray();

			// On first page of results, so add revert/rollback
			// links to the top revision
			if (!$('a.mw-firstlink').length) {
				var first = histList.shift();
				var vandal = $(first).find('.mw-userlink:not(.history-deleted)').text();

				// Check for first username different than the top user,
				// only apply rollback links if/when found
				// for faster than every
				for (var i = 0; i < histList.length; i++) {
					if ($(histList[i]).find('.mw-userlink').text() !== vandal) {
						first.appendChild(TwinkleGlobal.fluff.linkBuilder.rollbackLinks(vandal, true));
						break;
					}
				}
			}

			// oldid
			histList.forEach(function(rev) {
				// From restoreThisRevision, non-transferable
				// If the text has been revdel'd, it gets wrapped in a span with .history-deleted,
				// and href will be undefined (and thus oldid is NaN)
				var href = rev.querySelector('.mw-changeslist-date').href;
				var oldid = parseInt(mw.util.getParamValue('oldid', href), 10);
				if (!isNaN(oldid)) {
					rev.appendChild(TwinkleGlobal.fluff.linkBuilder.restoreThisRevisionLink(oldid, true));
				}
			});


		}
	},

	diff: function() {
		// Autofill user talk links on diffs with vanarticle for easy warning, but don't autowarn
		var warnFromTalk = function(xtitle) {
			var talkLink = $('#mw-diff-' + xtitle + '2 .mw-usertoollinks a').first();
			if (talkLink.length) {
				var extraParams = 'vanarticle=' + mw.util.rawurlencode(MorebitsGlobal.pageNameNorm) + '&' + 'noautowarn=true';
				// diffIDs for vanarticlerevid
				extraParams += '&vanarticlerevid=';
				extraParams += xtitle === 'otitle' ? mw.config.get('wgDiffOldId') : mw.config.get('wgDiffNewId');

				var href = talkLink.attr('href');
				if (href.indexOf('?') === -1) {
					talkLink.attr('href', href + '?' + extraParams);
				} else {
					talkLink.attr('href', href + '&' + extraParams);
				}
			}
		};

		// Older revision
		warnFromTalk('otitle'); // Add quick-warn link to user talk link
		// Don't load if there's a single revision or weird diff (cur on latest)
		if (mw.config.get('wgDiffOldId') && (mw.config.get('wgDiffOldId') !== mw.config.get('wgDiffNewId'))) {
			// Add a [restore this revision] link to the older revision
			var oldTitle = document.getElementById('mw-diff-otitle1').parentNode;
			oldTitle.insertBefore(TwinkleGlobal.fluff.linkBuilder.restoreThisRevisionLink('wgDiffOldId'), oldTitle.firstChild);
		}

		// Newer revision
		warnFromTalk('ntitle'); // Add quick-warn link to user talk link
		// Add either restore or rollback links to the newer revision
		// Don't show if there's a single revision or weird diff (prev on first)
		if (document.getElementById('differences-nextlink')) {
			// Not latest revision, add [restore this revision] link to newer revision
			var newTitle = document.getElementById('mw-diff-ntitle1').parentNode;
			newTitle.insertBefore(TwinkleGlobal.fluff.linkBuilder.restoreThisRevisionLink('wgDiffNewId'), newTitle.firstChild);
		} else if (TwinkleGlobal.getPref('showRollbackLinks').indexOf('diff') !== -1 && mw.config.get('wgDiffOldId') && (mw.config.get('wgDiffOldId') !== mw.config.get('wgDiffNewId') || document.getElementById('differences-prevlink'))) {
			// Normally .mw-userlink is a link, but if the
			// username is hidden, it will be a span with
			// .history-deleted as well. When a sysop views the
			// hidden content, the span contains the username in a
			// link element, which will *just* have
			// .mw-userlink. The below thus finds the first
			// instance of the class, which if hidden is the span
			// and thus text returns undefined. Technically, this
			// is a place where sysops *could* have more
			// information available to them (as above, via
			// &unhide=1), since the username will be available by
			// checking a.mw-userlink instead, but revert() will
			// need reworking around userHidden
			var vandal = $('#mw-diff-ntitle2').find('.mw-userlink')[0];
			// See #1337
			vandal = vandal ? vandal.text : '';
			var ntitle = document.getElementById('mw-diff-ntitle1').parentNode;

			ntitle.insertBefore(TwinkleGlobal.fluff.linkBuilder.rollbackLinks(vandal), ntitle.firstChild);
		}
	},

	oldid: function() { // Add a [restore this revision] link on old revisions
		var revisionInfo = document.getElementById('mw-revision-info');
		if (revisionInfo) {
			var title = revisionInfo.parentNode;
			title.insertBefore(TwinkleGlobal.fluff.linkBuilder.restoreThisRevisionLink('wgRevisionId'), title.firstChild);
		}
	}
};

TwinkleGlobal.fluff.disableLinks = function disablelinks(parentNode) {
	// Array.from not available in IE11 :(
	$(parentNode).children().each(function(_ix, node) {
		node.innerHTML = node.textContent; // Feels like cheating
		$(node).css('font-weight', 'normal').css('color', 'darkgray');
	});
};


TwinkleGlobal.fluff.revert = function revertPage(type, vandal, rev, page) {
	if (mw.util.isIPv6Address(vandal)) {
		vandal = MorebitsGlobal.ip.sanitizeIPv6(vandal);
	}

	var pagename = page || mw.config.get('wgPageName');
	var revid = rev || mw.config.get('wgCurRevisionId');

	if (TwinkleGlobal.fluff.rollbackInPlace) {
		var notifyStatus = document.createElement('span');
		mw.notify(notifyStatus, {
			autoHide: false,
			title: 'Rollback on ' + page,
			tag: 'twinklefluff_' + rev // Shouldn't be necessary given disableLink
		});
		MorebitsGlobal.status.init(notifyStatus);
	} else {
		MorebitsGlobal.status.init(document.getElementById('mw-content-text'));
		$('#catlinks').remove();
	}

	var params = {
		type: type,
		user: vandal,
		userHidden: !vandal, // Keep track of whether the username was hidden
		pagename: pagename,
		revid: revid
	};

	var query = {
		action: 'query',
		prop: ['info', 'revisions', 'flagged'],
		titles: pagename,
		inprop: 'watched',
		intestactions: 'edit',
		rvlimit: TwinkleGlobal.getPref('revertMaxRevisions'),
		rvprop: [ 'ids', 'timestamp', 'user' ],
		curtimestamp: '',
		meta: 'tokens',
		type: 'csrf',
		format: 'json'
	};
	var wikipedia_api = new MorebitsGlobal.wiki.api('Grabbing data of earlier revisions', query, TwinkleGlobal.fluff.callbacks.main);
	wikipedia_api.params = params;
	wikipedia_api.post();
};

TwinkleGlobal.fluff.revertToRevision = function revertToRevision(oldrev) {

	MorebitsGlobal.status.init(document.getElementById('mw-content-text'));

	var query = {
		action: 'query',
		prop: ['info', 'revisions'],
		titles: mw.config.get('wgPageName'),
		inprop: 'watched',
		rvlimit: 1,
		rvstartid: oldrev,
		rvprop: [ 'ids', 'user' ],
		curtimestamp: '',
		meta: 'tokens',
		type: 'csrf',
		format: 'json'
	};
	var wikipedia_api = new MorebitsGlobal.wiki.api('Grabbing data of the earlier revision', query, TwinkleGlobal.fluff.callbacks.toRevision);
	wikipedia_api.params = { rev: oldrev };
	wikipedia_api.post();
};

TwinkleGlobal.fluff.callbacks = {
	toRevision: function(apiobj) {
		var response = apiobj.getResponse();

		var loadtimestamp = response.curtimestamp;
		var csrftoken = response.query.tokens.csrftoken;

		var page = response.query.pages[0];
		var lastrevid = parseInt(page.lastrevid, 10);
		var touched = page.touched;

		var rev = page.revisions[0];
		var revertToRevID = parseInt(rev.revid, 10);
		var revertToUser = rev.user;
		var revertToUserHidden = !!rev.userhidden;

		if (revertToRevID !== apiobj.params.rev) {
			apiobj.statelem.error('The retrieved revision does not match the requested revision. Stopping revert.');
			return;
		}

		var optional_summary = prompt('Please specify a reason for the revert:                                ', '');  // padded out to widen prompt in Firefox
		if (optional_summary === null) {
			apiobj.statelem.error('Aborted by user.');
			return;
		}

		var summary = TwinkleGlobal.fluff.formatSummary('Restored revision ' + revertToRevID + ' by $USER',
			revertToUserHidden ? null : revertToUser, optional_summary);

		var query = {
			action: 'edit',
			title: mw.config.get('wgPageName'),
			summary: summary,
			tags: TwinkleGlobal.changeTags,
			token: csrftoken,
			undo: lastrevid,
			undoafter: revertToRevID,
			basetimestamp: touched,
			starttimestamp: loadtimestamp,
			minor: TwinkleGlobal.getPref('markRevertedPagesAsMinor').indexOf('torev') !== -1 ? true : undefined,
			format: 'json'
		};
		// Handle watching, possible expiry
		if (TwinkleGlobal.getPref('watchRevertedPages').indexOf('torev') !== -1) {
			var watchOrExpiry = TwinkleGlobal.getPref('watchRevertedExpiry');

			if (!watchOrExpiry || watchOrExpiry === 'no') {
				query.watchlist = 'nochange';
			} else if (watchOrExpiry === 'default' || watchOrExpiry === 'preferences') {
				query.watchlist = 'preferences';
			} else {
				query.watchlist = 'watch';
				// number allowed but not used in TwinkleGlobal.config.watchlistEnums
				if ((!page.watched || page.watchlistexpiry) && typeof watchOrExpiry === 'string' && watchOrExpiry !== 'yes') {
					query.watchlistexpiry = watchOrExpiry;
				}
			}
		}

		MorebitsGlobal.wiki.actionCompleted.redirect = mw.config.get('wgPageName');
		MorebitsGlobal.wiki.actionCompleted.notice = 'Reversion completed';

		var wikipedia_api = new MorebitsGlobal.wiki.api('Saving reverted contents', query, TwinkleGlobal.fluff.callbacks.complete, apiobj.statelem);
		wikipedia_api.params = apiobj.params;
		wikipedia_api.post();
	},
	main: function(apiobj) {
		var response = apiobj.getResponse();

		var loadtimestamp = response.curtimestamp;
		var csrftoken = response.query.tokens.csrftoken;

		var page = response.query.pages[0];
		if (!page.actions.edit) {
			apiobj.statelem.error("Unable to edit the page, it's probably protected.");
			return;
		}

		var lastrevid = parseInt(page.lastrevid, 10);
		var touched = page.touched;

		var revs = page.revisions;

		var statelem = apiobj.statelem;
		var params = apiobj.params;

		if (revs.length < 1) {
			statelem.error('We have less than one additional revision, thus impossible to revert.');
			return;
		}
		var top = revs[0];
		var lastuser = top.user;

		if (lastrevid < params.revid) {
			MorebitsGlobal.status.error('Error', [ 'The most recent revision ID received from the server, ', MorebitsGlobal.htmlNode('strong', lastrevid), ', is less than the ID of the displayed revision. This could indicate that the current revision has been deleted, the server is lagging, or that bad data has been received. Stopping revert.' ]);
			return;
		}

		// Used for user-facing alerts, messages, etc., not edits or summaries
		var userNorm = params.user || TwinkleGlobal.fluff.hiddenName;
		var index = 1;
		if (params.revid !== lastrevid) {
			MorebitsGlobal.status.warn('Warning', [ 'Latest revision ', MorebitsGlobal.htmlNode('strong', lastrevid), ' doesn\'t equal our revision ', MorebitsGlobal.htmlNode('strong', params.revid) ]);
			// Treat ipv6 users on same 64 block as the same
			if (lastuser === params.user || (mw.util.isIPv6Address(params.user) && MorebitsGlobal.ip.get64(lastuser) === MorebitsGlobal.ip.get64(params.user))) {
				switch (params.type) {
					case 'vand':
						var diffUser = lastuser !== params.user;
						MorebitsGlobal.status.info('Info', [ 'Latest revision was ' + (diffUser ? '' : 'also ') + 'made by ', MorebitsGlobal.htmlNode('strong', userNorm),
							diffUser ? ', which is on the same /64 subnet' : '', '. As we assume vandalism, we will proceed to revert.' ]);
						break;
					default:
						MorebitsGlobal.status.warn('Notice', [ 'Latest revision was made by ', MorebitsGlobal.htmlNode('strong', userNorm), ', but we will stop the revert.' ]);
						return;
				}
			} else if (params.type === 'vand' &&
					// Okay to test on user since it will either fail or sysop will correctly access it
					// Besides, none of the trusted bots are going to be revdel'd
					TwinkleGlobal.fluff.trustedBots.indexOf(top.user) !== -1 && revs.length > 1 &&
					revs[1].revid === params.revid) {
				MorebitsGlobal.status.info('Info', [ 'Latest revision was made by ', MorebitsGlobal.htmlNode('strong', lastuser), ', a trusted bot, and the revision before was made by our vandal, so we will proceed with the revert.' ]);
				index = 2;
			} else {
				MorebitsGlobal.status.error('Error', [ 'Latest revision was made by ', MorebitsGlobal.htmlNode('strong', lastuser), ', so it might have already been reverted, we will stop the revert.']);
				return;
			}

		} else {
			// Expected revision is the same, so the users must match;
			// this allows sysops to know whether the users are the same
			params.user = lastuser;
			userNorm = params.user || TwinkleGlobal.fluff.hiddenName;
		}

		if (TwinkleGlobal.fluff.trustedBots.indexOf(params.user) !== -1) {
			switch (params.type) {
				case 'vand':
					MorebitsGlobal.status.info('Info', [ 'Vandalism revert was chosen on ', MorebitsGlobal.htmlNode('strong', userNorm), '. As this is a trusted bot, we assume you wanted to revert vandalism made by the previous user instead.' ]);
					index = 2;
					params.user = revs[1].user;
					params.userHidden = !!revs[1].userhidden;
					break;
				case 'norm':
				/* falls through */
				default:
					var cont = confirm('Normal revert was chosen, but the most recent edit was made by a trusted bot (' + userNorm + '). Do you want to revert the revision before instead?');
					if (cont) {
						MorebitsGlobal.status.info('Info', [ 'Normal revert was chosen on ', MorebitsGlobal.htmlNode('strong', userNorm), '. This is a trusted bot, and per confirmation, we\'ll revert the previous revision instead.' ]);
						index = 2;
						params.user = revs[1].user;
						params.userHidden = !!revs[1].userhidden;
						userNorm = params.user || TwinkleGlobal.fluff.hiddenName;
					} else {
						MorebitsGlobal.status.warn('Notice', [ 'Normal revert was chosen on ', MorebitsGlobal.htmlNode('strong', userNorm), '. This is a trusted bot, but per confirmation, revert on selected revision will proceed.' ]);
					}
					break;
			}
		}
		var found = false;
		var count = 0;
		var seen64 = false;

		for (var i = index; i < revs.length; ++i) {
			++count;
			if (revs[i].user !== params.user) {
				// Treat ipv6 users on same 64 block as the same
				if (mw.util.isIPv6Address(revs[i].user) && MorebitsGlobal.ip.get64(revs[i].user) === MorebitsGlobal.ip.get64(params.user)) {
					if (!seen64) {
						new MorebitsGlobal.status('Note', 'Treating consecutive IPv6 addresses in the same /64 as the same user');
						seen64 = true;
					}
					continue;
				}
				found = i;
				break;
			}
		}

		if (!found) {
			statelem.error([ 'No previous revision found. Perhaps ', MorebitsGlobal.htmlNode('strong', userNorm), ' is the only contributor, or they have made more than ' + mw.language.convertNumber(TwinkleGlobal.getPref('revertMaxRevisions')) + ' edits in a row.' ]);
			return;
		}

		if (!count) {
			MorebitsGlobal.status.error('Error', 'As it is not possible to revert zero revisions, we will stop this revert. It could be that the edit has already been reverted, but the revision ID was still the same.');
			return;
		}

		var good_revision = revs[found];
		var userHasAlreadyConfirmedAction = false;
		if (params.type !== 'vand' && count > 1) {
			if (!confirm(userNorm + ' has made ' + mw.language.convertNumber(count) + ' edits in a row. Are you sure you want to revert them all?')) {
				MorebitsGlobal.status.info('Notice', 'Stopping revert.');
				return;
			}
			userHasAlreadyConfirmedAction = true;
		}

		params.count = count;

		params.goodid = good_revision.revid;
		params.gooduser = good_revision.user;
		params.gooduserHidden = !!good_revision.userhidden;

		statelem.status([ ' revision ', MorebitsGlobal.htmlNode('strong', params.goodid), ' that was made ', MorebitsGlobal.htmlNode('strong', mw.language.convertNumber(count)), ' revisions ago by ', MorebitsGlobal.htmlNode('strong', params.gooduserHidden ? TwinkleGlobal.fluff.hiddenName : params.gooduser) ]);

		var summary, extra_summary;
		switch (params.type) {
			case 'vand':
				summary = TwinkleGlobal.fluff.formatSummary('Reverted ' + params.count + (params.count > 1 ? ' edits' : ' edit') + ' by $USER to last revision by ' +
					(params.gooduserHidden ? TwinkleGlobal.fluff.hiddenName : params.gooduser), params.userHidden ? null : params.user);
				break;

			case 'norm':
			/* falls through */
			default:
				if (TwinkleGlobal.getPref('offerReasonOnNormalRevert')) {
					extra_summary = prompt('An optional comment for the edit summary:                              ', '');  // padded out to widen prompt in Firefox
					if (extra_summary === null) {
						statelem.error('Aborted by user.');
						return;
					}
					userHasAlreadyConfirmedAction = true;
				}

				summary = TwinkleGlobal.fluff.formatSummary('Reverted ' + params.count + (params.count > 1 ? ' edits' : ' edit') + ' by $USER',
					params.userHidden ? null : params.user, extra_summary);
				break;
		}

		if ((TwinkleGlobal.getPref('confirmOnFluff') ||
			// Mobile user agent taken from [[en:MediaWiki:Gadget-confirmationRollback-mobile.js]]
			(TwinkleGlobal.getPref('confirmOnMobileFluff') && /Android|webOS|iPhone|iPad|iPod|BlackBerry|Mobile|Opera Mini/i.test(navigator.userAgent))) &&
			!userHasAlreadyConfirmedAction && !confirm('Reverting page: are you sure?')) {
			statelem.error('Aborted by user.');
			return;
		}

		// Decide whether to notify the user on success
		if (!TwinkleGlobal.fluff.skipTalk && TwinkleGlobal.getPref('openTalkPage').indexOf(params.type) !== -1 &&
				!params.userHidden && mw.config.get('wgUserName') !== params.user) {
			params.notifyUser = true;
			// Pass along to the warn module
			params.vantimestamp = top.timestamp;
		}

		// figure out whether we need to/can review the edit
		var flagged = page.flagged;
		if ((MorebitsGlobal.userIsInGroup('reviewer') || MorebitsGlobal.userIsSysop) &&
				!!flagged &&
				flagged.stable_revid >= params.goodid &&
				!!flagged.pending_since) {
			params.reviewRevert = true;
			params.csrftoken = csrftoken;
		}

		var query = {
			action: 'edit',
			title: params.pagename,
			summary: summary,
			tags: TwinkleGlobal.changeTags,
			token: csrftoken,
			undo: lastrevid,
			undoafter: params.goodid,
			basetimestamp: touched,
			starttimestamp: loadtimestamp,
			minor: TwinkleGlobal.getPref('markRevertedPagesAsMinor').indexOf(params.type) !== -1 ? true : undefined,
			format: 'json'
		};
		// Handle watching, possible expiry
		if (TwinkleGlobal.getPref('watchRevertedPages').indexOf(params.type) !== -1) {
			var watchOrExpiry = TwinkleGlobal.getPref('watchRevertedExpiry');

			if (!watchOrExpiry || watchOrExpiry === 'no') {
				query.watchlist = 'nochange';
			} else if (watchOrExpiry === 'default' || watchOrExpiry === 'preferences') {
				query.watchlist = 'preferences';
			} else {
				query.watchlist = 'watch';
				// number allowed but not used in TwinkleGlobal.config.watchlistEnums
				if ((!page.watched || page.watchlistexpiry) && typeof watchOrExpiry === 'string' && watchOrExpiry !== 'yes') {
					query.watchlistexpiry = watchOrExpiry;
				}
			}
		}

		if (!TwinkleGlobal.fluff.rollbackInPlace) {
			MorebitsGlobal.wiki.actionCompleted.redirect = params.pagename;
		}
		MorebitsGlobal.wiki.actionCompleted.notice = 'Reversion completed';

		var wikipedia_api = new MorebitsGlobal.wiki.api('Saving reverted contents', query, TwinkleGlobal.fluff.callbacks.complete, statelem);
		wikipedia_api.params = params;
		wikipedia_api.post();

	},
	complete: function (apiobj) {
		// TODO Most of this is copy-pasted from MorebitsGlobal.wiki.page#fnSaveSuccess. Unify it
		var response = apiobj.getResponse();
		var edit = response.edit;

		if (edit.captcha) {
			apiobj.statelem.error('Could not rollback, because the wiki server wanted you to fill out a CAPTCHA.');
		} else if (edit.nochange) {
			apiobj.statelem.error('Revision we are reverting to is identical to current revision, stopping revert.');
		} else {
			apiobj.statelem.info('done');
			var params = apiobj.params;

			if (params.notifyUser && !params.userHidden) { // notifyUser only from main, not from toRevision
				MorebitsGlobal.status.info('Info', [ 'Opening user talk page edit form for user ', MorebitsGlobal.htmlNode('strong', params.user) ]);

				var windowQuery = {
					title: 'User talk:' + params.user,
					action: 'edit',
					preview: 'yes',
					vanarticle: params.pagename.replace(/_/g, ' '),
					vanarticlerevid: params.revid,
					vantimestamp: params.vantimestamp,
					vanarticlegoodrevid: params.goodid,
					type: params.type,
					count: params.count
				};

				switch (TwinkleGlobal.getPref('userTalkPageMode')) {
					case 'tab':
						window.open(mw.util.getUrl('', windowQuery), '_blank');
						break;
					case 'blank':
						window.open(mw.util.getUrl('', windowQuery), '_blank',
							'location=no,toolbar=no,status=no,directories=no,scrollbars=yes,width=1200,height=800');
						break;
					case 'window':
					/* falls through */
					default:
						window.open(mw.util.getUrl('', windowQuery),
							window.name === 'twinklewarnwindow' ? '_blank' : 'twinklewarnwindow',
							'location=no,toolbar=no,status=no,directories=no,scrollbars=yes,width=1200,height=800');
						break;
				}
			}


			// review the revert, if needed
			if (apiobj.params.reviewRevert) {
				var query = {
					action: 'review',
					revid: edit.newrevid,
					token: apiobj.params.csrftoken,
					comment: 'Automatically reviewing reversion' + TwinkleGlobal.summaryAd // until the below
					// 'tags': TwinkleGlobal.changeTags // flaggedrevs tag support: [[phab:T247721]]
				};
				var wikipedia_api = new MorebitsGlobal.wiki.api('Automatically accepting your changes', query);
				wikipedia_api.post();
			}
		}
	}
};

// If builtInString contains the string "$USER", it will be replaced
// by an appropriate user link if a user name is provided
TwinkleGlobal.fluff.formatSummary = function(builtInString, userName, customString) {
	var result = builtInString;

	// append user's custom reason
	if (customString) {
		result += ': ' + MorebitsGlobal.string.toUpperCaseFirstChar(customString);
	}
	result += TwinkleGlobal.getPref('summaryAd');

	// find number of UTF-8 bytes the resulting string takes up, and possibly add
	// a contributions or contributions+talk link if it doesn't push the edit summary
	// over the 499-byte limit
	if (/\$USER/.test(builtInString)) {
		if (userName) {
			var resultLen = unescape(encodeURIComponent(result.replace('$USER', ''))).length;
			var contribsLink = '[[Special:Contributions/' + userName + '|' + userName + ']]';
			var contribsLen = unescape(encodeURIComponent(contribsLink)).length;
			if (resultLen + contribsLen <= 499) {
				var talkLink = ' ([[User talk:' + userName + '|talk]])';
				if (resultLen + contribsLen + unescape(encodeURIComponent(talkLink)).length <= 499) {
					result = MorebitsGlobal.string.safeReplace(result, '$USER', contribsLink + talkLink);
				} else {
					result = MorebitsGlobal.string.safeReplace(result, '$USER', contribsLink);
				}
			} else {
				result = MorebitsGlobal.string.safeReplace(result, '$USER', userName);
			}
		} else {
			result = MorebitsGlobal.string.safeReplace(result, '$USER', TwinkleGlobal.fluff.hiddenName);
		}
	}

	return result;
};

TwinkleGlobal.addInitCallback(TwinkleGlobal.fluff, 'fluff');
})(jQuery);


// </nowiki>
