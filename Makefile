all:

deploy:
	node scripts/deploy.js ${ARGS}

.PHONY: deploy all
