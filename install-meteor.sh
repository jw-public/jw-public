#!/usr/bin/env bash

set -exo pipefail

if [ "$DEV_BUILD" = true ]; then
  # if this is a devbuild, we don't have an app to check the .meteor/release file yet,
  # so just install the latest version of Meteor
  printf "\n[-] Installing the latest version of Meteor...\n\n"
  curl -v https://install.meteor.com/ | sh
else


  # read in the release version in the app
  METEOR_VERSION=$(head $APP_SOURCE_DIR/.meteor/release | dos2unix | cut -d "@" -f 2)

  # install
  printf "\n[-] Installing Meteor $METEOR_VERSION...\n\n"
  # download installer script
  echo curl -v https://install.meteor.com?release=${METEOR_VERSION} -o /tmp/install_meteor.sh
  curl -v https://install.meteor.com?release=${METEOR_VERSION} -o /tmp/install_meteor.sh
  sh /tmp/install_meteor.sh
fi
