LNURL:=http://apache.skazkaforyou.com//lucene/java/3.3.0/lucene-3.3.0-src.tgz
LNBASE:=lucene-3.3.0
LNOUT:=$(LNBASE)/build/lucene-core-3.3-SNAPSHOT.jar

default:
	$(MAKE) clean
	$(MAKE) get
	$(MAKE) build

get: $(LNBASE)

.dl:
	mkdir -p $@

# Download and unpack Lucene src
$(LNBASE): | .dl
	wget --continue -O .dl/lucene.dl $(LNURL)
	tar -zxvf .dl/lucene.dl && rm .dl/lucene.dl

build: | $(LNBASE)
	# Link applet code into the src tree for static linking
	cp -f -r src/org/ubc/ $(LNBASE)/src/java/org/

	# Tweak build.xml to include additional plugin.jar
	cp -f $(LNBASE)/build.xml $(LNBASE)/build.xml.bak
	sed $(LNBASE)/build.xml -i -e 's@\(<path id="classpath">\s*$$\)@\1<pathelement location="$${java.home}/lib/plugin.jar" />@'

	# Apply patches to make Lucene compatible with the applet environment
	cp -f src/org/apache/lucene/analysis/standard/StandardAnalyzer.java $(LNBASE)/src/java/org/apache/lucene/analysis/standard/
	cp -f src/org/apache/lucene/util/Constants.java $(LNBASE)/src/java/org/apache/lucene/util/

	# Build lucene core and the applet
	ant -f $(LNBASE)/build.xml
	mkdir build
	mv -f "$(LNOUT)" build/SearchApplet.jar

clean:
	if [ -e $(LNBASE)/build.xml.bak ]; then mv $(LNBASE)/build.xml.bak $(LNBASE)/build.xml; fi
	rm -f -r $(LNBASE)/src/java/org/ubc
	rm -f -r build

.PHONY: default get build clean
