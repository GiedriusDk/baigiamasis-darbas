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

        $adminUser = User::firstOrCreate(
            ['email' => 'admin@gmail.com'],
            [
                'first_name' => 'Admin',
                'last_name'  => 'User',
                'password'   => Hash::make('admin'),
            ]
        );

        $adminUser->roles()->sync([$admin->id]);

        $this->command->info("Admin user created/updated: admin@fitplans.local");
    }
}