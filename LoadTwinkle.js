/**
 * +-------------------------------------------------------------------------+
 * |                              === 警告 ===                               |
 * |      本工具有一些新穎的修改，雖本人會經過測試，但不能保證不會出錯            |
 * |               強烈建議在使用後複查編輯，特別是那些新功能                    |
 * +-------------------------------------------------------------------------+
 */

// 複製並修改自 https://zh.wikipedia.org/w/index.php?oldid=45972864 作者為 User:逆襲的天邪鬼

// 載入自己修改的Twinkle

(function() {

var VERSION = '{{subst:#time:YmdHis}}';
var PREFIX = 'User:Xiplus/Twinkle/';
var rebuildcache = localStorage.Twinkle_global_xiplus_version !== VERSION;
var tests = [];
var api;
if (mw.config.get('wgServer') === '//meta.wikimedia.org') {
	api = new mw.Api();
} else {
	api = new mw.ForeignApi('https://meta.wikimedia.org/w/api.php');
}

var ajax = function(title) {
	return api.get({
		'action': 'query',
		'format': 'json',
		'prop': 'revisions',
		'titles': title,
		'rvprop': 'content'
	}).then(function(data) {
		for (var key in data.query.pages) { // eslint-disable-line guard-for-in
			return data.query.pages[key].revisions[0]['*'];
		}
	});
};

var load = function(p) {
	var done = function(data) {
		if (rebuildcache || !localStorage['Twinkle_global_xiplus_' + p.name]) {
			localStorage['Twinkle_global_xiplus_' + p.name] = data;
		}
	};
	if (localStorage['Twinkle_global_xiplus_' + p.name] && !rebuildcache) {
		return $.Deferred().resolve(localStorage['Twinkle_global_xiplus_' + p.name]);
	}
	if (p.test) {
		return ajax(PREFIX + p.name).done(done);
	}
	return ajax('MediaWiki:Gadget-' + p.name).done(done);
};

var message = function(text) {
	console.log('[Twinkle_global_xiplus]', text);  // eslint-disable-line no-console
	//    $('#simpleSearch input[type="search"]').attr('placeHolder', text);
};

tests.push({ name: 'morebits.js', test: true });
tests.push({ name: 'twinkle.js', test: true });
tests.push({ name: 'modules/twinklearv.js', test: true });
// tests.push({name: 'modules/twinklewarn.js',          test: true});
// tests.push({name: 'modules/friendlyshared.js',       test: true});
// tests.push({name: 'modules/friendlytag.js',          test: true});
// tests.push({name: 'modules/friendlytalkback.js',     test: true});
// tests.push({name: 'modules/twinklebatchdelete.js',   test: true});
// tests.push({name: 'modules/twinklebatchundelete.js', test: true});
// tests.push({name: 'modules/twinkleblock.js',         test: true});
// tests.push({name: 'modules/twinkleclose.js',         test: true});
tests.push({ name: 'modules/twinkleconfig.js', test: true });
// tests.push({name: 'modules/twinklecopyvio.js',       test: true});
// tests.push({name: 'modules/twinkledelimages.js',     test: true});
tests.push({ name: 'modules/twinklediff.js', test: true });
tests.push({ name: 'modules/twinklefluff.js', test: true });
// tests.push({name: 'modules/twinkleimage.js',         test: true});
// tests.push({name: 'modules/twinkleprotect.js',       test: true});
tests.push({ name: 'modules/twinklespeedy.js', test: true });
// tests.push({name: 'modules/twinklestub.js',          test: true});
// tests.push({name: 'modules/twinkleunlink.js',        test: true});
// tests.push({name: 'modules/twinklexfd.js',           test: true});


function main() {
	mw.loader.load('https://meta.wikimedia.org/w/index.php?title=User:Xiplus/Twinkle/morebits.css&action=raw&ctype=text/css', 'text/css');

	var i = 0;
	var finished = 0;
	var code = [];

	// all
	message('Loading Twinkle_global_xiplus...');
	var promises = [];
	var done = function(x) {
		return function(data) {
			finished++;
			message('Loading Twinkle_global_xiplus... (' + finished + '/' + tests.length + ')');
			code[x] = data;
		};
	};
	for (i = 0; i < tests.length; i++) {
		promises.push(load(tests[i]).done(done(i)));
	}
	$.when.apply($, promises).done(function() {
		localStorage.Twinkle_global_xiplus_version = VERSION;
		eval(code.join('\n;\n'));
		message('Twinkle Done');
		if ($('#twinkleglobal-config-titlebar').length) {
			$('#twinkleglobal-config-titlebar').append('--Version: Xiplus ' + localStorage.Twinkle_global_xiplus_version);
			$('#twinkleglobal-config-titlebar').append('<button onclick="localStorage.Twinkle_global_xiplus_version = \'\';location.reload();">Purge</button>');
		}
	});
}

mw.loader.using(['mediawiki.user', 'mediawiki.util', 'mediawiki.notify', 'mediawiki.Title', 'jquery.ui', 'jquery.tipsy', 'mediawiki.ForeignApi']).done(function() {
	main();
});

})();
