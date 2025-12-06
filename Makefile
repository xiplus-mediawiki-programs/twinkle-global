all:

modules = src/modules/twinklearv.js \
		  src/modules/twinklebatchdelete.js \
		  src/modules/twinklebatchprotect.js \
		  src/modules/twinklebatchundelete.js \
		  src/modules/twinkleblock.js \
		  src/modules/twinkleconfig.js \
		  src/modules/twinkledeprod.js \
		  src/modules/twinklediff.js \
		  src/modules/twinklerollback.js \
		  src/modules/twinkleimage.js \
		  src/modules/twinkleprod.js \
		  src/modules/twinkleprotect.js \
		  src/modules/twinklespeedy.js \
		  src/modules/twinkleunlink.js \
		  src/modules/twinklewarn.js \
		  src/modules/twinklexfd.js \
		  src/modules/twinkleshared.js \
		  src/modules/twinkletag.js \
		  src/modules/twinkletalkback.js \
		  src/modules/twinklewelcome.js

deploy: src/twinkle.js src/twinkle.css src/twinkle-pagestyles.css src/morebits.js src/morebits.css $(modules)
	./sync.pl ${ARGS} --deploy $^

.PHONY: deploy all
