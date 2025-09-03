FROM php:8.3-cli

# Reikalingi paketai ir PHP plėtiniai (Postgres)
RUN apt-get update && apt-get install -y libpq-dev unzip \
    && docker-php-ext-install pdo pdo_pgsql

# Darbo katalogas
WORKDIR /var/www/html

# Composer iš oficialaus composer image
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# 1 žingsnis: tik composer failai → install BE skriptų (kad nebandytų kviesti artisan)
COPY composer.json composer.lock ./
RUN composer install --no-interaction --prefer-dist --no-scripts

# 2 žingsnis: likęs kodas (čia atsiranda 'artisan')
COPY . .

# 3 žingsnis: pakartotinis install (arba package:discover)
RUN composer install --no-interaction --prefer-dist
# (nebūtina, bet jei norėsi atskirai:)
# RUN php artisan package:discover --ansi || true

# Teisės Laravel cache’ams
RUN chown -R www-data:www-data storage bootstrap/cache
