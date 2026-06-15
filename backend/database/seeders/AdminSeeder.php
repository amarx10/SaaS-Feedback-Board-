<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        // Admin account
        User::updateOrCreate(
            ['email' => 'amar@gmail.com'],
            [
                'name'          => 'Amar',
                'username'      => 'amar',
                'email'         => 'amar@gmail.com',
                'password'      => Hash::make('Amar@23'),
                'is_admin'      => true,
                'bio'           => 'Platform administrator. Building better products through user feedback.',
                'date_of_birth' => '1990-01-01',
            ]
        );

        // Named seed users (kept for backward compatibility with FeedbackSeeder)
        $namedUsers = [
            ['name' => 'Sarah Chen',   'username' => 'sarahchen',   'email' => 'sarah@example.com'],
            ['name' => 'Mike Johnson', 'username' => 'mikejohnson', 'email' => 'mike@example.com'],
            ['name' => 'David Wilson', 'username' => 'davidwilson', 'email' => 'david@example.com'],
            ['name' => 'Anna Lee',     'username' => 'annalee',     'email' => 'anna@example.com'],
            ['name' => 'Tom King',     'username' => 'tomking',     'email' => 'tom@example.com'],
        ];

        foreach ($namedUsers as $user) {
            User::updateOrCreate(
                ['email' => $user['email']],
                array_merge($user, [
                    'password' => Hash::make('Password@123'),
                    'is_admin' => false,
                    'bio'      => 'Product enthusiast and feedback contributor.',
                ])
            );
        }

        // Generate 95 additional users to reach 100 total (excluding admin)
        $firstNames = [
            'James', 'Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'William', 'Sophia',
            'Benjamin', 'Isabella', 'Lucas', 'Mia', 'Henry', 'Charlotte', 'Alexander',
            'Amelia', 'Mason', 'Harper', 'Ethan', 'Evelyn', 'Daniel', 'Luna', 'Logan',
            'Aria', 'Jackson', 'Ella', 'Sebastian', 'Scarlett', 'Jack', 'Grace',
            'Aiden', 'Chloe', 'Owen', 'Victoria', 'Samuel', 'Riley', 'Joseph', 'Zoey',
            'Wyatt', 'Nora', 'John', 'Lily', 'David', 'Eleanor', 'Luke', 'Hannah',
            'Julian', 'Lillian', 'Ryan', 'Addison', 'Nathan', 'Aubrey', 'Isaiah',
            'Ellie', 'Eli', 'Stella', 'Aaron', 'Natalie', 'Charles', 'Zoe',
            'Thomas', 'Leah', 'Nicholas', 'Hazel', 'Caleb', 'Violet', 'Joshua',
            'Aurora', 'Christian', 'Savannah', 'Hunter', 'Audrey', 'Connor', 'Brooklyn',
            'Jaxon', 'Bella', 'Levi', 'Claire', 'Andrew', 'Skylar', 'Adrian', 'Lucy',
            'Jonathan', 'Paisley', 'Nolan', 'Everly', 'Jeremiah', 'Anna', 'Easton',
            'Caroline', 'Elias', 'Nova', 'Colton', 'Genesis', 'Cameron',
        ];

        $lastNames = [
            'Smith', 'Jones', 'Williams', 'Brown', 'Taylor', 'Davies', 'Evans',
            'Wilson', 'Thomas', 'Roberts', 'Johnson', 'Lewis', 'Walker', 'Robinson',
            'Wood', 'Thompson', 'White', 'Watson', 'Jackson', 'Wright', 'Green',
            'Harris', 'Cooper', 'King', 'Lee', 'Martin', 'Clarke', 'James',
            'Morgan', 'Hughes', 'Edwards', 'Hill', 'Moore', 'Clark', 'Harrison',
            'Scott', 'Young', 'Morris', 'Hall', 'Ward', 'Turner', 'Carter',
            'Phillips', 'Mitchell', 'Patel', 'Adams', 'Campbell', 'Anderson',
            'Allen', 'Cook', 'Bailey', 'Parker', 'Murphy', 'Collins', 'Rogers',
        ];

        $bios = [
            'UX designer with a passion for clean interfaces.',
            'Backend developer focused on performance.',
            'Product manager who loves data-driven decisions.',
            'Frontend engineer and open source contributor.',
            'QA engineer dedicated to bug-free software.',
            'Startup founder interested in growth tools.',
            'Designer who believes feedback drives great products.',
            'Full-stack developer and coffee enthusiast.',
            'Customer success advocate and power user.',
            'Software architect exploring new technologies.',
        ];

        $generated = 0;
        $index     = 0;

        while ($generated < 95) {
            $firstName = $firstNames[$index % count($firstNames)];
            $lastName  = $lastNames[intdiv($index, count($firstNames)) % count($lastNames)];
            $suffix    = $index > 0 && ($index % count($firstNames) === 0) ? '' : ($index >= count($firstNames) ? ($index + 1) : '');
            $username  = strtolower($firstName . $lastName . ($index >= count($firstNames) ? ($index + 1) : ''));
            $email     = strtolower($firstName . '.' . $lastName . ($index >= count($firstNames) ? ($index + 1) : '') . '@testmail.com');

            // Skip if username/email conflicts with named users
            if (User::where('email', $email)->orWhere('username', $username)->exists()) {
                $index++;
                continue;
            }

            User::create([
                'name'     => "$firstName $lastName",
                'username' => $username,
                'email'    => $email,
                'password' => Hash::make('Password@123'),
                'is_admin' => false,
                'bio'      => $bios[$generated % count($bios)],
            ]);

            $generated++;
            $index++;
        }
    }
}