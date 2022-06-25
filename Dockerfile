FROM openjdk:18-jdk
LABEL MAINTAINER="contact@lichess.org"
WORKDIR /opt/docker
COPY target/docker/stage/2/opt /opt
COPY target/docker/stage/4/opt /opt
RUN mkdir /opt/docker/logs

EXPOSE 9663
ENTRYPOINT /opt/docker/bin/lila -Dconfig.file=prod.conf
