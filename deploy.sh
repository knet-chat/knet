#!/bin/sh

if [ "$(id -u)" != "0" ]; then
   echo "This script must be run as root" 1>&2; 
   exit 1; 
fi

SW_PATH=$(pwd);

git stash;
git fetch;
git reset --hard origin/master;


forever stopall; 
sleep 3;


SERVER_IP_ADDRESS=`cat $SW_PATH/server/lib/installer/SERVER_IP_ADDRESS.dat`; 

sed "s/TO_BE_REPLACED_BY_INSTALLER_HERE_ipServerAuth/$SERVER_IP_ADDRESS/g" $SW_PATH/client/js/config.js > temp ;
mv temp $SW_PATH/client/js/config.js;

targetCnt=`cat $SW_PATH/server/lib/installer/NUMBER_OF_INSTANCES.dat`;
NUMBER_OF_INSTANCES=$(($targetCnt + 0)); 
COUNTER=0; 
while [  $COUNTER -lt $NUMBER_OF_INSTANCES ]; do
  forever start -l $SW_PATH/server/log/instance_$COUNTER.log -a $SW_PATH/server/server.js --instanceNumber=$COUNTER &  
  let COUNTER=COUNTER+1
done
sleep 3;

tail -f $SW_PATH/server/log/instance_*.log; 


