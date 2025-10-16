
FROM php:8.3-cli-alpine

RUN apk add --no-cache git unzip libpq-dev $PHPIZE_DEPS \
  && docker-php-ext-install pdo pdo_pgsql

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

RUN mkdir -p storage bootstrap/cache \
  && chmod -R 775 storage bootstrap/cache || true

EXPOSE 9000

CMD ["php", "-S", "0.0.0.0:9000", "-t", "public"]