FROM kadirahq/meteord:base
COPY ./build/meteor.tar.gz /bundle/meteor.tar.gz
EXPOSE 80
ENV PORT 80
