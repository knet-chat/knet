#!/bin/sh

if [ "$(id -u)" != "0" ]; then
   echo "This script must be run as root" 1>&2
   exit 1
fi

SW_PATH=$(pwd);
TIMESTAMP=$(date +"%m_%d_%Y");
echo "creating a back-up of the current config.json as ${TIMESTAMP}config.json";
cp $SW_PATH/server/lib/config.json $SW_PATH/server/lib/${TIMESTAMP}config.json;
cd $SW_PATH/server/lib/installer;
npm install
node installer.js

echo "creating a back-up of the current /etc/nginx/nginx.conf as ${TIMESTAMP}nginx.conf";
cp /etc/nginx/nginx.conf /etc/nginx/${TIMESTAMP}nginx.conf;
cp $SW_PATH/server/lib/installer/nginx.conf /etc/nginx/nginx.conf
