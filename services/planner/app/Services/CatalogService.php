<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class CatalogService
{
    protected string $base;

    public function __construct()
    {
        $this->base = rtrim(config('services.catalog.base', env('CATALOG_BASE', 'http://gateway/catalog/api')), '/');
    }

    public function exercises(array $params = []): array
    {
        $url = $this->base . '/exercises';

        $resp = Http::timeout(8)->acceptJson()->get($url, $params);

        if (!$resp->successful()) {
            throw new \Exception('Catalog service error: ' . $resp->body());
        }

        $json = $resp->json();
        return is_array($json['data'] ?? null) ? $json['data'] : [];
    }

    public function getExercise(int $id): ?array
    {
        $url  = $this->base . '/exercises/' . $id;
        $resp = Http::timeout(8)->acceptJson()->get($url);

        if ($resp->status() === 404) {
            return null;
        }
        if (!$resp->successful()) {
            throw new \Exception('Catalog service error: ' . $resp->body());
        }

        $json = $resp->json();
        return $json['data'] ?? null;
    }

    public function getExercisesByIds(array $ids): array
    {
        $out = [];
        foreach (array_values(array_unique($ids)) as $id) {
            $row = $this->getExercise((int) $id);
            if ($row) $out[] = $row;
        }
        return $out;
    }
    public function byTag(string $tag, array $params = []): array
    {
        $params = array_merge(['tag' => $tag, 'per_page' => 80], $params);
        return $this->exercises($params);
    }
}