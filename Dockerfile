FROM alpine:20220328 as prepare
COPY src/build/src.tar.gz /bundle/meteor.tar.gz
WORKDIR /tmp
RUN tar xvf /bundle/meteor.tar.gz

FROM node:20
COPY --from=prepare /tmp/bundle /bundle

# renovate: datasource=npm depName=fibers
ENV FIBERS_VERSION=4.0.3
# renovate: datasource=npm depName=bcrypt
ENV BCRYPT_VERSION=5.0.1

WORKDIR /bundle/programs/server/npm/node_modules/meteor/accounts-password/
RUN npm install bcrypt@${BCRYPT_VERSION}

WORKDIR /bundle/programs/server/

RUN npm install fibers@${FIBERS_VERSION} && npm install bcrypt@${BCRYPT_VERSION} && npm install
WORKDIR /bundle
CMD [ "node", "main.js" ]
EXPOSE 8080
ENV PORT 8080