#!/bin/sh

SW_PATH="/home/node-7/visible/platforms/node"

cd $SW_PATH;
git stash;
git fetch;
git reset --hard origin/master;
cd $SW_PATH/lib;
sleep 1;
cp Config.js Config.js.org ;
cp Config.js.bkp Config.js;
sleep 1;
su - node-7 -c "forever stopall"
sleep 3;
cd $SW_PATH;
su - node-7 -c "forever start -l $SW_PATH/instance_0.log -a $SW_PATH/server.js --instanceNumber=0 & "
su - node-7 -c "forever start -l $SW_PATH/instance_1.log -a $SW_PATH/server.js --instanceNumber=1 & "
su - node-7 -c "forever start -l $SW_PATH/instance_2.log -a $SW_PATH/server.js --instanceNumber=2 & "

su - node-7 -c "forever start -l $SW_PATH/instance_3.log -a $SW_PATH/server.js --instanceNumber=3 & "
su - node-7 -c "forever start -l $SW_PATH/instance_4.log -a $SW_PATH/server.js --instanceNumber=4 & "

sleep 3;
su - node-7 -c "tail -f $SW_PATH/instance_?.log "
