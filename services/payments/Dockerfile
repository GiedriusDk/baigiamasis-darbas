FROM php:8.3-cli

RUN apt-get update && apt-get install -y \
    libpq-dev \
    libzip-dev \
    unzip \
 && docker-php-ext-configure zip \
 && docker-php-ext-install pdo pdo_pgsql zip

WORKDIR /var/www/html

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

COPY composer.json composer.lock ./
RUN composer install --no-interaction --prefer-dist --no-scripts

COPY . .
RUN composer install --no-interaction --prefer-dist

RUN mkdir -p storage/framework/{cache,sessions,views} storage/logs \
  && chown -R www-data:www-data storage bootstrap/cache || true

CMD ["php", "-S", "0.0.0.0:9000", "-t", "public"]