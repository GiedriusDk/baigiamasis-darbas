FROM php:8.3-cli

# Sisteminiai paketai ir ext
RUN apt-get update && apt-get install -y \
    git unzip libpq-dev && docker-php-ext-install pdo pdo_pgsql

# Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html
COPY . .

RUN composer install --no-interaction --prefer-dist

# Laravel teisės
RUN mkdir -p storage/framework/{cache,sessions,views} storage/logs \
  && chown -R www-data:www-data storage bootstrap/cache

EXPOSE 9000
CMD sh -lc "php artisan key:generate --force && php -S 0.0.0.0:9000 -t public"