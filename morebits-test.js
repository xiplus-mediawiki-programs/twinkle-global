/* global TwinkleGlobal, MorebitsGlobal */

// Script depends on jQuery dialog widget, loaded through jquery.ui after
// T219604 (1.35-wmf.2 circa 22 Oct 2019)
mw.loader.using('jquery.ui', function() {
	// Construct object (to prevent namespace conflicts)
	TwinkleGlobal.morebitsTest = {

		launchDialog: function(userInterface) {
			userInterface.dialog('open');
		},

		initSimpleWindow: function() {
			var Window = new MorebitsGlobal.simpleWindow(600, 400);
			Window.setTitle('Test morebits.js');
			Window.display();
			var form = new MorebitsGlobal.quickForm(null);
			form.append({
				type: 'select',
				name: 'main_group',
				event: null
			});
			var result = form.render();
			Window.setContent(result);
			Window.display();
			result.main_group.root = result;
			MorebitsGlobal.status.init(result);
			MorebitsGlobal.wiki.actionCompleted.redirect = mw.config.get('wgPageName');
			MorebitsGlobal.wiki.actionCompleted.notice = 'Test complete, reloading talk page in a few seconds';
		},

		setPageOptions: function(page) {
			page.setEditSummary($('#editSummary').val());
			if ($('#runTestForm input[name="followRedirect"]').attr('checked')) {
				page.setFollowRedirect(true);
			}
			if ($('#runTestForm input[name="minorEdit"]').attr('checked')) {
				page.setMinorEdit(true);
			}
			if ($('#runTestForm input[name="watchlist"]').attr('checked')) {
				page.setWatchlist(true);
			}
			if ($('#runTestForm input[name="watchlistFromPreferences"]').attr('checked')) {
				page.setWatchlistFromPreferences(true);
			}
			if ($('#runTestForm input[name="noRetries"]').attr('checked')) {
				page.setMaxConflictRetries(0);
				page.setMaxRetries(0);
			}
			var section = $('#runTestForm input[name="sectionNumber"]').val();
			if (section !== '') {
				page.setPageSection(Number(section));
			}
			page.setCreateOption(window.morebits_test_createOption);

			if ($('#runTestForm input[name="lookupCreation"]').attr('checked')) {
				page.lookupCreation(TwinkleGlobal.morebitsTest.lookupCreationCallback);
			}
		},

		loadCallbackInsert: function(page) {
			var params = page.getCallbackParameters();
			var text = page.getPageText();
			var pos = text.indexOf(params.beforeText);
			if (pos === -1) {
				alert('Search text "' + params.beforeText + '" not found!');
				return;
			}
			page.setPageText(text.substr(0, pos) + params.newText + text.substr(pos));
			page.save(TwinkleGlobal.morebitsTest.finalSaveCallback);
		},

		loadCallbackReplace: function(page) {
			var params = page.getCallbackParameters();
			page.setPageText(params.newText);
			page.save(TwinkleGlobal.morebitsTest.finalSaveCallback);
		},

		lookupCreationCallback: function(page) {
			alert('Page was created by: ' + page.getCreator() + ' at: ' + page.getCreationTimestamp());
		},

		finalSaveCallback: function(page) {
			MorebitsGlobal.wiki.actionCompleted.redirect = page.getPageName(); // get result of redirects
		},

		initialize: function() {

			// Define runTest interface
			// Can also use alternative syntax new to jQuery 1.4:
			//    $('<div style="margin-top:0.4em;"></div>').html( 'Text to be added:' )
			//  → $('<div/>', { css: { 'margin-top': '0.4em' }, text: 'Text to be added:' } )

			window.morebits_test_createOption = null;

			TwinkleGlobal.morebitsTest.$runTests = $('<div id="runTestForm" style="position:relative;"></div>')
				.append($('<div style="margin-top:0.4em;"></div>').html('Text to be added:<br/>').append($('<textarea id="message" id="runTestMessage" style="width:99%" rows="4" cols="60"></textarea>')))
				.append($('<div style="margin-top:0.4em;"></div>').html('Insert text before (for insert mode only):<br/>').append($('<textarea id="beforeText" style="width:99%" rows="4" cols="60"></textarea>')))
				.append($('<div style="margin-top:0.4em;"></div>').html('Edit summary:<br/>').append($('<textarea id="editSummary" style="width:99%" rows="4" cols="60"></textarea>')))
				.append($('<div style="margin-top:0.4em;"></div>').html('Section number: <input type="text" name="sectionNumber" size="3">'))
				.append($('<div style="margin-top:0.4em;"></div>').html('<input type="checkbox" name="followRedirect"/> Follow redirect'))
				.append($('<div style="margin-top:0.4em;"></div>').html('<input type="checkbox" name="minorEdit"/> Minor edit'))
				.append($('<div style="margin-top:0.4em;"></div>').html('<input type="checkbox" name="watchlist"/> Add to watchlist'))
				.append($('<div style="margin-top:0.4em;"></div>').html('<input type="checkbox" name="watchlistFromPreferences"/> Add to watchlist based on preference settings'))
				.append($('<div style="margin-top:0.4em;"></div>').html('<input type="checkbox" name="noRetries"/> Disable retries'))
				.append($('<div style="margin-top:0.4em;"></div>').html('<input type="checkbox" name="lookupCreation"/> Lookup page creator and timestamp<hr/>'))
				.append($('<div style="margin-top:0.4em;"></div>').html('<input type="radio" name="createOption" value="" onclick="window.morebits_test_createOption=value" checked/> Create page if needed, unless deleted since loaded<br>'))
				.append($('<div style="margin-top:0.4em;"></div>').html('<input type="radio" name="createOption" value="recreate" onclick="window.morebits_test_createOption=value"/> Create page if needed<br>'))
				.append($('<div style="margin-top:0.4em;"></div>').html('<input type="radio" name="createOption" value="createonly" onclick="window.morebits_test_createOption=value"/> Only create a new page<br>'))
				.append($('<div style="margin-top:0.4em;"></div>').html('<input type="radio" name="createOption" value="nocreate" onclick="window.morebits_test_createOption=value"/> Do not create a new page<br>'))
				.dialog({
					width: 500,
					autoOpen: false,
					title: 'Test MorebitsGlobal.wiki.page class',
					modal: true,
					buttons: {
						'Append': function() {
							$(this).dialog('close');
							TwinkleGlobal.morebitsTest.initSimpleWindow();

							var page = new MorebitsGlobal.wiki.page(mw.config.get('wgPageName'));
							page.setAppendText($('#message').val());
							TwinkleGlobal.morebitsTest.setPageOptions(page);
							page.append(TwinkleGlobal.morebitsTest.finalSaveCallback);
						},
						'Prepend': function() {
							$(this).dialog('close');
							TwinkleGlobal.morebitsTest.initSimpleWindow();

							var page = new MorebitsGlobal.wiki.page(mw.config.get('wgPageName'));
							page.setPrependText($('#message').val());
							TwinkleGlobal.morebitsTest.setPageOptions(page);
							page.prepend(TwinkleGlobal.morebitsTest.finalSaveCallback);
						},
						'Insert': function() {
							if ($('#beforeText').val() === '') {
								alert('Text to insert before must be specified!');
								return;
							}
							$(this).dialog('close');
							TwinkleGlobal.morebitsTest.initSimpleWindow();

							var page = new MorebitsGlobal.wiki.page(mw.config.get('wgPageName'));
							page.setCallbackParameters({
								beforeText: $('#beforeText').val(),
								newText: $('#message').val()
							});
							TwinkleGlobal.morebitsTest.setPageOptions(page);
							page.load(TwinkleGlobal.morebitsTest.loadCallbackInsert);
						},
						'Replace': function() {
							$(this).dialog('close');
							TwinkleGlobal.morebitsTest.initSimpleWindow();

							var page = new MorebitsGlobal.wiki.page(mw.config.get('wgPageName'));
							page.setCallbackParameters({
								newText: $('#message').val()
							});
							TwinkleGlobal.morebitsTest.setPageOptions(page);
							page.load(TwinkleGlobal.morebitsTest.loadCallbackReplace);
						}
					}
				}); // close .dialog

		} // close initialize function

	}; // close Twinkle.morebitsTest object

	TwinkleGlobal.morebitsTest.initialize();
}); // close mw.loader

TwinkleGlobal.morebitsTestInit = function () {
	if (mw.config.get('wgAction') === 'view' && mw.config.get('skin') === 'vector' && mw.config.get('wgNamespaceNumber') >= 0) {
		TwinkleGlobal.addPortlet('javascript:Twinkle.morebitsTest.launchDialog(Twinkle.morebitsTest.$runTests)', 'Test', 'twg-test', 'Test morebits.js', '');
	}
};

// register initialization callback
var TwinkleGlobal;
if (typeof TwinkleGlobal === 'undefined') {
	throw new Error('Attempt to load module "morebits-test" without having loaded Twinkle previously.');
}
TwinkleGlobal.addInitCallback(TwinkleGlobal.morebitsTestInit);
