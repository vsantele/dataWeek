#!/bin/bash
set -ex

read_var() {
  VAR=$(grep $1 $2 | xargs)
  IFS="=" read -ra VAR <<< "$VAR"
  echo ${VAR[1]}
}

USERNAME=wolfvic.azurecr.io
IMAGE=dataweek
VERSION=$(read_var VERSION .env)


docker push $USERNAME/$IMAGE:$VERSION