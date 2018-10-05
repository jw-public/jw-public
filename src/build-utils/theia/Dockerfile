FROM theiaide/theia-full:0.3.14
USER root
RUN npm install -g typescript@2.3.4 mocha@2.5.3 typings babel-istanbul@0.11.0 typedoc
RUN apt-get update && apt-get install curl -y
RUN curl -v https://install.meteor.com?release=1.5.1 | sh
ENV PATH="$HOME/.meteor:${PATH}"

RUN apt-get update && apt-get install -y locales && rm -rf /var/lib/apt/lists/* \
	&& localedef -i en_US -c -f UTF-8 -A /usr/share/locale/locale.alias en_US.UTF-8
ENV LANG en_US.utf8

ENV METEOR_ALLOW_SUPERUSER true