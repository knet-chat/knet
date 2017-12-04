#!/bin/sh

if [ "$(id -u)" != "0" ]; then
   echo "This script must be run as root" 1>&2
   exit 1
fi

DEPENDENCIES_LIST="git nodejs curl pgadmin3 postgresql-client-9.3 postgresql-9.3-postgis-2.1 postgresql-9.3 python build-essential tcl8.5 nginx"
for package in $DEPENDENCIES_LIST
do
 result=`dpkg-query -W -f='${Status}\n' $package | head -n1 | awk '{print $3;}'`
 if [ "$result" = "installed" ]; then
  echo "INFO: package $package installed";
 else
  echo "INFO: package $package not installed, aborting installation";
  exit 1;
fi
done

resultPING=`redis-cli ping`
if [ "$resultPING" = "PONG" ]; then
 echo "INFO: package redis installed and running";
else
 echo "INFO: package redis is not running, aborting installation";
 exit 1;
fi

echo "installing:  npm install forever g";
npm install forever g 


SW_PATH=$(pwd);
TIMESTAMP=$(date +"%m_%d_%Y");
echo "creating a back-up of the current config.json as ${TIMESTAMP}config.json";
cp $SW_PATH/server/lib/config.json $SW_PATH/server/lib/${TIMESTAMP}.config.json;
cd $SW_PATH/server/lib/installer;
npm install
node installer.js

echo "creating a back-up of the current /etc/nginx/nginx.conf as ${TIMESTAMP}.nginx.conf";
cp /etc/nginx/nginx.conf /etc/nginx/${TIMESTAMP}.nginx.conf;
cp $SW_PATH/server/lib/installer/nginx.conf /etc/nginx/nginx.conf
/etc/init.d/nginx restart


echo "installing application dependencies ....";
cd $SW_PATH/server;
npm install

