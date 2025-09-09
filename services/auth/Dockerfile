FROM php:8.3-cli

RUN apt-get update && apt-get install -y libpq-dev unzip \
    && docker-php-ext-install pdo pdo_pgsql

WORKDIR /var/www/html
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# 1 žingsnis – tik composer failai
COPY composer.json composer.lock ./
RUN composer install --no-interaction --prefer-dist --no-scripts

# 2 žingsnis – likęs kodas
COPY . .
RUN composer install --no-interaction --prefer-dist

RUN chown -R www-data:www-data storage bootstrap/cache

CMD ["php", "-S", "0.0.0.0:9000", "-t", "public"]