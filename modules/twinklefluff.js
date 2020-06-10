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

	// A list of usernames, usually only bots, that vandalism revert is jumped over; that is,
	// if vandalism revert was chosen on such username, then its target is on the revision before.
	// This is for handling quick bots that makes edits seconds after the original edit is made.
	// This only affects vandalism rollback; for good faith rollback, it will stop, indicating a bot
	// has no faith, and for normal rollback, it will rollback that edit.
	TwinkleGlobal.fluff.whiteList = [
		'AnomieBOT',
		'SineBot'
	];

	if (mw.config.get('wgIsProbablyEditable')) {
		// Only proceed if the user can actually edit the page
		// in question (ignored for contributions, see #632).
		// wgIsProbablyEditable should take care of
		// namespace/contentModel restrictions as well as
		// explicit protections; it won't take care of
		// cascading or TitleBlacklist restrictions
		if (mw.config.get('wgDiffNewId') || mw.config.get('wgDiffOldId')) { // wgDiffOldId included for clarity in if else loop [[phab:T214985]]
			mw.hook('wikipage.diff').add(function () { // Reload alongside the revision slider
				TwinkleGlobal.fluff.addLinks.diff();
			});
		} else if (mw.config.get('wgAction') === 'view' && mw.config.get('wgCurRevisionId') !== mw.config.get('wgRevisionId')) {
			TwinkleGlobal.fluff.addLinks.oldid();
		} else if (mw.config.get('wgAction') === 'history') {
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

TwinkleGlobal.fluff.skipTalk = null;
TwinkleGlobal.fluff.rollbackInPlace = null;

// Consolidated construction of fluff links
TwinkleGlobal.fluff.linkBuilder = {
	spanTag: function(color, content) {
		var span = document.createElement('span');
		span.style.color = color;
		span.appendChild(document.createTextNode(content));
		return span;
	},

	buildLink: function(color, text) {
		var link = document.createElement('a');
		link.appendChild(TwinkleGlobal.fluff.linkBuilder.spanTag('Black', '['));
		link.appendChild(TwinkleGlobal.fluff.linkBuilder.spanTag(color, text));
		link.appendChild(TwinkleGlobal.fluff.linkBuilder.spanTag('Black', ']'));
		link.href = '#';
		return link;
	},

	/**
	 * @param {string} vandal - Username of the editor being reverted (required)
	 * @param {boolean} inline - True to create two links in a span, false
	 * to create three links in a div (optional)
	 * @param {number|string} [rev=wgCurRevisionId] - Revision ID being reverted (optional)
	 * @param {string} [page=wgPageName] - Page being reverted (optional)
	 */
	rollbackLinks: function(vandal, inline, rev, page) {
		var elem = inline ? 'span' : 'div';
		var revNode = document.createElement(elem);

		rev = parseInt(rev, 10);
		if (rev) {
			revNode.setAttribute('id', 'tw-revert' + rev);
		} else {
			revNode.setAttribute('id', 'tw-revert');
		}

		var normNode = document.createElement('strong');
		var vandNode = document.createElement('strong');

		var normLink = TwinkleGlobal.fluff.linkBuilder.buildLink('SteelBlue', 'rollback');
		var vandLink = TwinkleGlobal.fluff.linkBuilder.buildLink('Red', 'vandalism');

		$(normLink).click(function() {
			TwinkleGlobal.fluff.revert('norm', vandal, rev, page);
			TwinkleGlobal.fluff.disableLinks(revNode);
		});
		$(vandLink).click(function() {
			TwinkleGlobal.fluff.revert('vand', vandal, rev, page);
			TwinkleGlobal.fluff.disableLinks(revNode);
		});

		vandNode.appendChild(vandLink);
		normNode.appendChild(normLink);

		var separator = inline ? ' ' : ' || ';

		if (!inline) {
			var agfNode = document.createElement('strong');
			var agfLink = TwinkleGlobal.fluff.linkBuilder.buildLink('DarkOliveGreen', 'rollback (AGF)');
			$(agfLink).click(function() {
				TwinkleGlobal.fluff.revert('agf', vandal, rev, page);
				// TwinkleGlobal.fluff.disableLinks(revNode); // rollbackInPlace not relevant for any inline situations
			});
			agfNode.appendChild(agfLink);
			revNode.appendChild(agfNode);
		}
		revNode.appendChild(document.createTextNode(separator));
		revNode.appendChild(normNode);
		revNode.appendChild(document.createTextNode(separator));
		revNode.appendChild(vandNode);

		return revNode;

	},

	// Build [restore this revision] links
	restoreThisRevisionLink: function(revisionRef, inline) {
		// If not a specific revision number, should be wgDiffNewId/wgDiffOldId/wgRevisionId
		revisionRef = typeof revisionRef === 'number' ? revisionRef : mw.config.get(revisionRef);

		var elem = inline ? 'span' : 'div';
		var revertToRevisionNode = document.createElement(elem);

		revertToRevisionNode.setAttribute('id', 'tw-revert-to-' + revisionRef);
		revertToRevisionNode.style.fontWeight = 'bold';

		var revertToRevisionLink = TwinkleGlobal.fluff.linkBuilder.buildLink('SaddleBrown', 'restore this version');
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
		if (mw.config.exists('wgRelevantUserName') || !!$('#sp-contributions-footer-anon-range')[0]) {
			// Get the username these contributions are for
			var username = mw.config.get('wgRelevantUserName');
			if (TwinkleGlobal.getPref('showRollbackLinks').indexOf('contribs') !== -1 ||
				(mw.config.get('wgUserName') !== username && TwinkleGlobal.getPref('showRollbackLinks').indexOf('others') !== -1) ||
				(mw.config.get('wgUserName') === username && TwinkleGlobal.getPref('showRollbackLinks').indexOf('mine') !== -1)) {
				var list = $('#mw-content-text').find('ul li:has(span.mw-uctop):has(.mw-changeslist-diff)');

				list.each(function(key, current) {
					// revid is also available in the href of both
					// .mw-changeslist-date or .mw-changeslist-diff
					var page = $(current).find('.mw-contributions-title').text();
					current.appendChild(TwinkleGlobal.fluff.linkBuilder.rollbackLinks(username, true, current.dataset.mwRevid, page));
				});
			}
		}
	},

	recentchanges: function() {
		if (TwinkleGlobal.getPref('showRollbackLinks').indexOf('recent') !== -1) {
			// Latest and revertable (not page creations, logs, categorizations, etc.)
			var list = $('.mw-changeslist .mw-changeslist-last.mw-changeslist-src-mw-edit');
			// Exclude top-level header if "group changes" preference is used
			// and find only individual lines or nested lines
			list = list.not('.mw-rcfilters-ui-highlights-enhanced-toplevel').find('.mw-changeslist-line-inner, td.mw-enhanced-rc-nested');

			list.each(function(key, current) {
				var vandal = $(current).find('.mw-userlink').text();
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
			if (!$('.mw-firstlink').length) {
				var first = histList.shift();
				var vandal = first.querySelector('.mw-userlink').text;

				first.appendChild(TwinkleGlobal.fluff.linkBuilder.rollbackLinks(vandal, true));
			}

			// oldid
			histList.forEach(function(rev) {
				// From restoreThisRevision, non-transferable

				var href = rev.querySelector('.mw-changeslist-date').href;
				var oldid = parseInt(mw.util.getParamValue('oldid', href), 10);

				rev.appendChild(TwinkleGlobal.fluff.linkBuilder.restoreThisRevisionLink(oldid, true));
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
			var vandal = $('#mw-diff-ntitle2').find('a').first().text();
			var ntitle = document.getElementById('mw-diff-ntitle1').parentNode;

			ntitle.insertBefore(TwinkleGlobal.fluff.linkBuilder.rollbackLinks(vandal), ntitle.firstChild);
		}
	},

	oldid: function() { // Add a [restore this revision] link on old revisions
		var title = document.getElementById('mw-revision-info').parentNode;
		title.insertBefore(TwinkleGlobal.fluff.linkBuilder.restoreThisRevisionLink('wgRevisionId'), title.firstChild);
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
		vandal = MorebitsGlobal.sanitizeIPv6(vandal);
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
		pagename: pagename,
		revid: revid
	};
	var query = {
		'action': 'query',
		'prop': ['info', 'revisions', 'flagged'],
		'titles': pagename,
		'intestactions': 'edit',
		'rvlimit': 50, // intentionally limited
		'rvprop': [ 'ids', 'timestamp', 'user', 'comment' ],
		'curtimestamp': '',
		'meta': 'tokens',
		'type': 'csrf'
	};
	var wikipedia_api = new MorebitsGlobal.wiki.api('Grabbing data of earlier revisions', query, TwinkleGlobal.fluff.callbacks.main);
	wikipedia_api.params = params;
	wikipedia_api.post();
};

TwinkleGlobal.fluff.revertToRevision = function revertToRevision(oldrev) {

	MorebitsGlobal.status.init(document.getElementById('mw-content-text'));

	var query = {
		'action': 'query',
		'prop': ['info', 'revisions'],
		'titles': mw.config.get('wgPageName'),
		'rvlimit': 1,
		'rvstartid': oldrev,
		'rvprop': [ 'ids', 'timestamp', 'user', 'comment' ],
		'format': 'xml',
		'curtimestamp': '',
		'meta': 'tokens',
		'type': 'csrf'
	};
	var wikipedia_api = new MorebitsGlobal.wiki.api('Grabbing data of the earlier revision', query, TwinkleGlobal.fluff.callbacks.toRevision);
	wikipedia_api.params = { rev: oldrev };
	wikipedia_api.post();
};

TwinkleGlobal.fluff.userIpLink = function(user) {
	return (mw.util.isIPAddress(user) ? '[[Special:Contributions/' : '[[:User:') + user + '|' + user + ']]';
};

TwinkleGlobal.fluff.callbacks = {
	toRevision: function(apiobj) {
		var xmlDoc = apiobj.responseXML;

		var lastrevid = parseInt($(xmlDoc).find('page').attr('lastrevid'), 10);
		var touched = $(xmlDoc).find('page').attr('touched');
		var loadtimestamp = $(xmlDoc).find('api').attr('curtimestamp');
		var csrftoken = $(xmlDoc).find('tokens').attr('csrftoken');
		var revertToRevID = parseInt($(xmlDoc).find('rev').attr('revid'), 10);
		var revertToUser = $(xmlDoc).find('rev').attr('user');

		if (revertToRevID !== apiobj.params.rev) {
			apiobj.statelem.error('The retrieved revision does not match the requested revision. Stopping revert.');
			return;
		}

		var optional_summary = prompt('Please specify a reason for the revert:                                ', '');  // padded out to widen prompt in Firefox
		if (optional_summary === null) {
			apiobj.statelem.error('Aborted by user.');
			return;
		}
		var summary = TwinkleGlobal.fluff.formatSummary('Reverted to revision ' + revertToRevID + ' by $USER', revertToUser, optional_summary);

		var query = {
			'action': 'edit',
			'title': mw.config.get('wgPageName'),
			'summary': summary,
			'token': csrftoken,
			'undo': lastrevid,
			'undoafter': revertToRevID,
			'basetimestamp': touched,
			'starttimestamp': loadtimestamp,
			'watchlist': TwinkleGlobal.getPref('watchRevertedPages').indexOf('torev') !== -1 ? 'watch' : undefined,
			'minor': TwinkleGlobal.getPref('markRevertedPagesAsMinor').indexOf('torev') !== -1 ? true : undefined
		};

		MorebitsGlobal.wiki.actionCompleted.redirect = mw.config.get('wgPageName');
		MorebitsGlobal.wiki.actionCompleted.notice = 'Reversion completed';

		var wikipedia_api = new MorebitsGlobal.wiki.api('Saving reverted contents', query, TwinkleGlobal.fluff.callbacks.complete, apiobj.statelem);
		wikipedia_api.params = apiobj.params;
		wikipedia_api.post();

	},
	main: function(apiobj) {
		var xmlDoc = apiobj.responseXML;

		if (typeof $(xmlDoc).find('actions').attr('edit') === 'undefined') {
			self.statelem.error("Unable to edit the page, it's probably protected.");
			return;
		}

		var lastrevid = parseInt($(xmlDoc).find('page').attr('lastrevid'), 10);
		var touched = $(xmlDoc).find('page').attr('touched');
		var loadtimestamp = $(xmlDoc).find('api').attr('curtimestamp');
		var csrftoken = $(xmlDoc).find('tokens').attr('csrftoken');
		var lastuser = $(xmlDoc).find('rev').attr('user');

		var revs = $(xmlDoc).find('rev');

		var statelem = apiobj.statelem;
		var params = apiobj.params;

		if (revs.length < 1) {
			statelem.error('We have less than one additional revision, thus impossible to revert.');
			return;
		}
		var top = revs[0];
		if (lastrevid < params.revid) {
			MorebitsGlobal.status.error('Error', [ 'The most recent revision ID received from the server, ', MorebitsGlobal.htmlNode('strong', lastrevid), ', is less than the ID of the displayed revision. This could indicate that the current revision has been deleted, the server is lagging, or that bad data has been received. Stopping revert.' ]);
			return;
		}
		var index = 1;
		if (params.revid !== lastrevid) {
			MorebitsGlobal.status.warn('Warning', [ 'Latest revision ', MorebitsGlobal.htmlNode('strong', lastrevid), ' doesn\'t equal our revision ', MorebitsGlobal.htmlNode('strong', params.revid) ]);
			if (lastuser === params.user) {
				switch (params.type) {
					case 'vand':
						MorebitsGlobal.status.info('Info', [ 'Latest revision was made by ', MorebitsGlobal.htmlNode('strong', params.user), '. As we assume vandalism, we will proceed to revert.' ]);
						break;
					case 'agf':
						MorebitsGlobal.status.warn('Warning', [ 'Latest revision was made by ', MorebitsGlobal.htmlNode('strong', params.user), '. As we assume good faith, we will stop the revert, as the problem might have been fixed.' ]);
						return;
					default:
						MorebitsGlobal.status.warn('Notice', [ 'Latest revision was made by ', MorebitsGlobal.htmlNode('strong', params.user), ', but we will stop the revert.' ]);
						return;
				}
			} else if (params.type === 'vand' &&
					TwinkleGlobal.fluff.whiteList.indexOf(top.getAttribute('user')) !== -1 && revs.length > 1 &&
					revs[1].getAttribute('pageId') === params.revid) {
				MorebitsGlobal.status.info('Info', [ 'Latest revision was made by ', MorebitsGlobal.htmlNode('strong', lastuser), ', a trusted bot, and the revision before was made by our vandal, so we will proceed with the revert.' ]);
				index = 2;
			} else {
				MorebitsGlobal.status.error('Error', [ 'Latest revision was made by ', MorebitsGlobal.htmlNode('strong', lastuser), ', so it might have already been reverted, we will stop the revert.']);
				return;
			}

		}

		if (TwinkleGlobal.fluff.whiteList.indexOf(params.user) !== -1) {
			switch (params.type) {
				case 'vand':
					MorebitsGlobal.status.info('Info', [ 'Vandalism revert was chosen on ', MorebitsGlobal.htmlNode('strong', params.user), '. As this is a whitelisted bot, we assume you wanted to revert vandalism made by the previous user instead.' ]);
					index = 2;
					params.user = revs[1].getAttribute('user');
					break;
				case 'agf':
					MorebitsGlobal.status.warn('Notice', [ 'Good faith revert was chosen on ', MorebitsGlobal.htmlNode('strong', params.user), '. This is a whitelisted bot and thus AGF rollback will not proceed.' ]);
					return;
				case 'norm':
				/* falls through */
				default:
					var cont = confirm('Normal revert was chosen, but the most recent edit was made by a whitelisted bot (' + params.user + '). Do you want to revert the revision before instead?');
					if (cont) {
						MorebitsGlobal.status.info('Info', [ 'Normal revert was chosen on ', MorebitsGlobal.htmlNode('strong', params.user), '. This is a whitelisted bot, and per confirmation, we\'ll revert the previous revision instead.' ]);
						index = 2;
						params.user = revs[1].getAttribute('user');
					} else {
						MorebitsGlobal.status.warn('Notice', [ 'Normal revert was chosen on ', MorebitsGlobal.htmlNode('strong', params.user), '. This is a whitelisted bot, but per confirmation, revert on selected revision will proceed.' ]);
					}
					break;
			}
		}
		var found = false;
		var count = 0;

		for (var i = index; i < revs.length; ++i) {
			++count;
			if (revs[i].getAttribute('user') !== params.user) {
				found = i;
				break;
			}
		}

		if (!found) {
			statelem.error([ 'No previous revision found. Perhaps ', MorebitsGlobal.htmlNode('strong', params.user), ' is the only contributor, or that the user has made more than ' + TwinkleGlobal.getPref('revertMaxRevisions') + ' edits in a row.' ]);
			return;
		}

		if (!count) {
			MorebitsGlobal.status.error('Error', 'As it is not possible to revert zero revisions, we will stop this revert. It could be that the edit has already been reverted, but the revision ID was still the same.');
			return;
		}

		var good_revision = revs[found];
		var userHasAlreadyConfirmedAction = false;
		if (params.type !== 'vand' && count > 1) {
			if (!confirm(params.user + ' has made ' + count + ' edits in a row. Are you sure you want to revert them all?')) {
				MorebitsGlobal.status.info('Notice', 'Stopping revert.');
				return;
			}
			userHasAlreadyConfirmedAction = true;
		}

		params.count = count;

		params.goodid = good_revision.getAttribute('revid');
		params.gooduser = good_revision.getAttribute('user');

		statelem.status([ ' revision ', MorebitsGlobal.htmlNode('strong', params.goodid), ' that was made ', MorebitsGlobal.htmlNode('strong', count), ' revisions ago by ', MorebitsGlobal.htmlNode('strong', params.gooduser) ]);

		var summary, extra_summary;
		switch (params.type) {
			case 'agf':
				extra_summary = prompt('An optional comment for the edit summary:                              ', '');  // padded out to widen prompt in Firefox
				if (extra_summary === null) {
					statelem.error('Aborted by user.');
					return;
				}
				userHasAlreadyConfirmedAction = true;

				summary = TwinkleGlobal.fluff.formatSummary('Reverted good faith edits by $USER', params.user, extra_summary);
				break;

			case 'vand':

				summary = 'Reverted ' + params.count + (params.count > 1 ? ' edits' : ' edit') + ' by [[Special:Contributions/' +
				params.user + '|' + params.user + ']] ([[User talk:' + params.user + '|talk]]) to last revision by ' +
				params.gooduser + TwinkleGlobal.getPref('summaryAd');
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

				summary = TwinkleGlobal.fluff.formatSummary('Reverted ' + params.count + (params.count > 1 ? ' edits' : ' edit') +
				' by $USER', params.user, extra_summary);
				break;
		}

		if (TwinkleGlobal.getPref('confirmOnFluff') && !userHasAlreadyConfirmedAction && !confirm('Reverting page: are you sure?')) {
			statelem.error('Aborted by user.');
			return;
		}

		// Decide whether to notify the user on success
		if (!TwinkleGlobal.fluff.skipTalk && TwinkleGlobal.getPref('openTalkPage').indexOf(self.params.type) !== -1 &&
				mw.config.get('wgUserName') !== params.user) {
			params.notifyUser = true;
		}

		// figure out whether we need to/can review the edit
		var $flagged = $(xmlDoc).find('flagged');
		if ((MorebitsGlobal.userIsInGroup('reviewer') || MorebitsGlobal.userIsSysop) &&
				$flagged.length &&
				$flagged.attr('stable_revid') >= params.goodid &&
				$flagged.attr('pending_since')) {
			params.reviewRevert = true;
			params.csrftoken = csrftoken;
		}

		var query = {
			'action': 'edit',
			'title': params.pagename,
			'summary': summary,
			'token': csrftoken,
			'undo': lastrevid,
			'undoafter': params.goodid,
			'basetimestamp': touched,
			'starttimestamp': loadtimestamp,
			'watchlist': TwinkleGlobal.getPref('watchRevertedPages').indexOf(params.type) !== -1 ? 'watch' : undefined,
			'minor': TwinkleGlobal.getPref('markRevertedPagesAsMinor').indexOf(params.type) !== -1 ? true : undefined
		};

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
		var xml = apiobj.getXML();
		var $edit = $(xml).find('edit');

		if ($(xml).find('captcha').length > 0) {
			apiobj.statelem.error('Could not rollback, because the wiki server wanted you to fill out a CAPTCHA.');
		} else if ($edit.attr('nochange') === '') {
			apiobj.statelem.warn('Revision we are reverting to is identical to current revision, stopping revert.');
		} else {
			apiobj.statelem.info('done');
			var params = apiobj.params;

			if (params.notifyUser) { // Only from main, not from toRevision
				MorebitsGlobal.status.info('Info', [ 'Opening user talk page edit form for user ', MorebitsGlobal.htmlNode('strong', params.user) ]);

				var windowQuery = {
					'title': 'User talk:' + params.user,
					'action': 'edit',
					'preview': 'yes',
					'vanarticle': params.pagename.replace(/_/g, ' '),
					'vanarticlerevid': params.revid,
					'vanarticlegoodrevid': params.goodid,
					'type': params.type,
					'count': params.count
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
					'action': 'review',
					'revid': $edit.attr('newrevid'),
					'token': apiobj.params.csrftoken,
					'comment': TwinkleGlobal.getPref('summaryAd').trim()
				};
				var wikipedia_api = new MorebitsGlobal.wiki.api('Automatically accepting your changes', query);
				wikipedia_api.post();
			}
		}
	}
};

// builtInString should contain the string "$USER", which will be replaced
// by an appropriate user link
TwinkleGlobal.fluff.formatSummary = function(builtInString, userName, userString) {
	var result = builtInString;

	// append user's custom reason
	if (userString) {
		result += ': ' + MorebitsGlobal.string.toUpperCaseFirstChar(userString);
	}
	result += TwinkleGlobal.getPref('summaryAd');

	// find number of UTF-8 bytes the resulting string takes up, and possibly add
	// a contributions or contributions+talk link if it doesn't push the edit summary
	// over the 255-byte limit
	var resultLen = unescape(encodeURIComponent(result.replace('$USER', ''))).length;
	var contribsLink = '[[Special:Contributions/' + userName + '|' + userName + ']]';
	var contribsLen = unescape(encodeURIComponent(contribsLink)).length;
	if (resultLen + contribsLen <= 255) {
		var talkLink = ' ([[User talk:' + userName + '|talk]])';
		if (resultLen + contribsLen + unescape(encodeURIComponent(talkLink)).length <= 255) {
			result = MorebitsGlobal.string.safeReplace(result, '$USER', contribsLink + talkLink);
		} else {
			result = MorebitsGlobal.string.safeReplace(result, '$USER', contribsLink);
		}
	} else {
		result = MorebitsGlobal.string.safeReplace(result, '$USER', userName);
	}

	return result;
};
})(jQuery);


// </nowiki>
