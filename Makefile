
PROVE := perl extlib/bin/prove

JOBS:=4

PORT := 2012

all: meta compiler doc web

## compiler stuff

compiler: src/doc.jsx
	rm -f bin/jsx
	node tool/bootstrap-compiler.js --executable node --output bin/jsx src/jsx-node-front.jsx
	cp -f "$$PWD/tool/jsx.pl" bin/jsx-with-server

src/doc.jsx: src/_doc.jsx
	submodules/picotemplate/picotemplate.pl $<

meta:
	if [ -e .git ] ; then \
		git submodule update --init ; \
		tool/make-meta package.json src/meta.jsx ; \
	fi

doc: compiler
	rm -rf doc
	find lib -name '*.jsx' | xargs -n 1 -- bin/jsx --mode doc --output doc

bootstrap-compiler: compiler
	bin/jsx --disable-type-check --executable node --output bin/jsx src/jsx-node-front.jsx # again
	cp bin/jsx tool/bootstrap-compiler.js

## test stuff

# e.g. make test JOBS=2

test: all test-debug test-optimized

test-debug:
	$(MAKE) test-core
	$(MAKE) test-misc-core

test-optimized:
	JSX_OPTS="--optimize release --disable-optimize no-log,no-assert" $(MAKE) test-core

test-core:
	$(PROVE) --jobs "$(JOBS)" t/run/*.jsx t/compile_error/*.jsx t/lib/*.jsx t/src/*.jsx t/web/*.jsx t/optimize/*.jsx t/complete/*.jsx

test-misc-core:
	$(PROVE) --jobs "$(JOBS)" t/*.t

v8bench: compiler
	cd submodules/v8bench && make

optimize-bench:
	$(PROVE) -v xt/optimize-bench/*.jsx

## web stuff

web: compiler
	perl web/build.pl

server: web
	node web/server.js $(PORT)

# for authors
web.jsx:
	idl2jsx/build.pl
	idl2jsx/maketest.pl > t/lib/010.web.jsx
	bin/jsx --test t/lib/010.web.jsx


show-todo:
	find t -name '*.todo.*' | grep -v '*~'

update-assets: update-bootstrap update-codemirror

update-codemirror:
	rm -rf codemirror*
	curl -LO http://codemirror.net/codemirror.zip
	unzip -o codemirror.zip
	cp codemirror-*/lib/codemirror.css            web/assets/css
	cp codemirror-*/lib/codemirror.js             web/assets/js
	cp codemirror-*/addon/hint/show-hint.css    web/assets/css
	cp codemirror-*/addon/hint/show-hint.js     web/assets/js
	cp codemirror-*/mode/javascript/javascript.js web/assets/js/mode
	cp codemirror-*/mode/clike/clike.js           web/assets/js/mode

update-bootstrap:
	curl -LO http://twitter.github.com/bootstrap/assets/bootstrap.zip
	unzip -o bootstrap.zip
	cp bootstrap/css/*.* web/assets/css
	cp bootstrap/img/*.* web/assets/img
	cp bootstrap/js/*.*  web/assets/js

## cleanup

clean:
	rm -rf CodeMirror-* codemirror.zip
	rm -rf bootstrap*
	rm -rf bin/*
	rm -rf jsx-*.tgz

.PHONY: setup test test-debug test-release test-core test-misc-core web server doc meta
