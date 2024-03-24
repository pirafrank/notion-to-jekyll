FROM node:20-bookworm-slim

# going headless
ENV DEBIAN_FRONTEND=noninteractive

COPY . /app/
COPY ./entrypoint.sh /entrypoint.sh

RUN cd /app && npm install

ENTRYPOINT ["/entrypoint.sh"]
