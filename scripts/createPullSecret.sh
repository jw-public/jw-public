#! /bin/bash

USERNAME="icereed"
TOKEN="xxxxxx"

AUTH=$(echo -n "${USERNAME}:${TOKEN}" | base64)
echo "{\"auths\":{\"docker.pkg.github.com\":{\"auth\":\"${AUTH}\"}}}" | kubectl create secret -n jw-public generic dockerconfigjson-github-com --type=kubernetes.io/dockerconfigjson --from-file=.dockerconfigjson=/dev/stdin