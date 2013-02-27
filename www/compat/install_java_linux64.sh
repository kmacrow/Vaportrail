#! /bin/bash

wget -O jre-6u31-linux-x64.bin http://javadl.sun.com/webapps/download/AutoDL?BundleId=59623

chmod a+x jre-6u31-linux-x64.bin
./jre-6u31-linux-x64.bin

mkdir $HOME/.mozilla/plugins
ln -s $PWD/jre1.6.0_31/lib/amd64/libnpjp2.so ~/.mozilla/plugins/ 
