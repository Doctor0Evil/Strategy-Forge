FROM php:8.2-fpm-alpine

WORKDIR /var/www/html/strategyforge

RUN apk add --no-cache \
    git \
    autoconf \
    gcc \
    g++ \
    make \
    libpq \
    postgresql-dev \
    sqlite-dev \
    libzip-dev \
    zeromq-dev \
    curl-dev \
    linux-headers

RUN docker-php-ext-install pdo pdo_pgsql pgsql pdo_sqlite sockets

RUN pecl install redis \
    && docker-php-ext-enable redis

RUN git clone https://github.com/zeromq/php-zmq.git /tmp/php-zmq \
    && cd /tmp/php-zmq \
    && phpize \
    && ./configure \
    && make -j"$(nproc)" \
    && make install \
    && echo "extension=zmq" > /usr/local/etc/php/conf.d/zmq.ini \
    && rm -rf /tmp/php-zmq

COPY game_api.php ./game_api.php
COPY did_client.php ./did_client.php

ENV STRATEGYFORGE_BASE_DIR=/var/www/html/strategyforge
ENV REDIS_HOST=redis
ENV REDIS_PORT=6379
ENV POSTGRES_HOST=postgres
ENV POSTGRES_PORT=5432
ENV POSTGRES_DB=strategyforge
ENV POSTGRES_USER=strategyforge
ENV POSTGRES_PASSWORD=
ENV ZMQ_ENDPOINT=tcp://socket-gateway:5557
ENV GAME_CORS_ORIGIN=*

CMD ["php-fpm"]
