#!/bin/bash

function findProcess() {
  port=$1
  pid=`netstat -anp 2>/dev/null | grep -w ":${port}" | awk '{print $7}'`
  pid=${pid%/*}
  echo $pid
}


masterPID=`findProcess 5555`
workerPID=`findProcess 8888`

if [[ -n ${masterPID} ]]; then
  echo "Killing master node process"
  kill ${masterPID}
fi

if [[ -n ${workerPID} ]]; then
  echo "Killing worker node process"
  kill ${workerPID}
fi
