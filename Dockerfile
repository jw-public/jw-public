FROM alpine:20210804 as prepare
COPY src/build/src.tar.gz /bundle/meteor.tar.gz
WORKDIR /tmp
RUN tar xvf /bundle/meteor.tar.gz

FROM node:14
COPY --from=prepare /tmp/bundle /bundle
WORKDIR /bundle/programs/server/
RUN npm install fibers && npm install
WORKDIR /bundle
CMD [ "node", "main.js" ]
EXPOSE 8080
ENV PORT 8080