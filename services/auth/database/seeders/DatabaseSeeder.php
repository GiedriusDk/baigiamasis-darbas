<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $admin = Role::firstOrCreate(['name' => 'admin']);
        $coach = Role::firstOrCreate(['name' => 'coach']);
        $user  = Role::firstOrCreate(['name' => 'user']);

        $u = User::firstOrCreate(
            ['email' => 'admin@fitplans.local'],
            ['name' => 'Admin', 'password' => Hash::make('secret123')]
        );

        $u->roles()->sync([$admin->id, $user->id]);
    }
}