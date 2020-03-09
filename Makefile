default: test

jshint:
	@echo "jshint"
	@./node_modules/.bin/jshint .

circular:
	@echo "circular"
	@./node_modules/.bin/madge --circular --format amd --exclude "madge|source-map" .

mocha:
	@echo "mocha (unit test)"
	#@TZ=UTC ./node_modules/.bin/mocha test/*.js
	@echo

test: jshint mocha circular
	@echo "test"
	@echo

outdated:
	@echo "outdated modules?"
	@npm outdated
