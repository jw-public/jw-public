FROM node:6.3.1 as typescriptnode
RUN npm install -g typescript@2.3.4 mocha@2.5.3 typings babel-istanbul@0.11.0 typedoc

FROM typescriptnode as compile
WORKDIR /src
COPY ./src/package.json /src
RUN npm install
COPY ./src /src
RUN npm install && tsc

FROM ubuntu:trusty-20180807 as package
WORKDIR /src
ENV APP_SOURCE_DIR /src
ENV METEOR_ALLOW_SUPERUSER true
RUN apt update && apt install curl -y
ADD ./install-meteor.sh /scripts/install-meteor.sh
COPY --from=compile /src/.meteor/release /src/.meteor/release
RUN chmod +x /scripts/install-meteor.sh && /scripts/install-meteor.sh
COPY --from=compile /src /src
RUN export METEOR_PROFILE=100 && mkdir /build && meteor build --allow-superuser --architecture=os.linux.x86_64 /build

FROM kadirahq/meteord:base
COPY --from=package /build/src.tar.gz /bundle/meteor.tar.gz
EXPOSE 80
ENV PORT 80
