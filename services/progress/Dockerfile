# services/progress/Dockerfile
FROM php:8.3-cli-alpine

# Sisteminės priklausomybės ir PHP plėtiniai
RUN apk add --no-cache \
      bash git unzip \
      libpq postgresql-dev \
      libzip-dev \
      icu-dev \
      freetype-dev libpng-dev libjpeg-turbo-dev \
  && docker-php-ext-configure gd --with-freetype --with-jpeg \
  && docker-php-ext-install -j$(nproc) \
      pdo pdo_pgsql zip intl gd bcmath \
  && rm -rf /var/cache/apk/*

# Composer (kad prireikus galėtum paleisti composer install konteineryje)
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# (Pasirinktinai) jei nori turėti numatytą php.ini
# COPY ./docker/php.ini /usr/local/etc/php/conf.d/app.ini

# Laravel reikalauja APP_KEY – jį sugeneruosi per docker-compose command
# (kaip ir kituose servisuose).

# Numatyta komanda – TIK jeigu nepersirašysi docker-compose.yml `command` laukelyje.
CMD ["php", "-S", "0.0.0.0:9000", "-t", "public"]