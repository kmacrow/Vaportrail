##
## VaporTrail is built with the Closure Javascript Compiler from Google
## http://code.google.com/closure/compiler/
##
CLOSURE_URL=http://closure-compiler.googlecode.com/files/compiler-latest.zip
CLOSURE_PATH = /home/kalan/closure
USAGE = "\nYou need the Closure Javascript Compiler from Google to build VaporTrail.\n\n\t- http://code.google.com/closure/compiler/\n\n\
		You'll also need to configure CLOSURE_PATH in this Makefile. Then run make build.\n"

default:
	@echo $(USAGE)

build:
	java -jar $(CLOSURE_PATH)/compiler.jar --js=timeline.js --js=timeline.ui.js --js=timeline.data.js --js_output_file=timeline.min.js
	
