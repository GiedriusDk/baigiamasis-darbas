<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        
        $admin = Role::firstOrCreate(['name' => 'admin']);
        $coach = Role::firstOrCreate(['name' => 'coach']);
        $user  = Role::firstOrCreate(['name' => 'user']);

        
        $firstUser = User::orderBy('id')->first();

        if ($firstUser) {
            
            $firstUser->roles()->sync([$admin->id]);
            $this->command->info("Admin role assigned to first user: {$firstUser->email}");
        } else {
            $this->command->warn("No users found. Admin role will be assigned automatically when first user registers.");
        }
    }
}