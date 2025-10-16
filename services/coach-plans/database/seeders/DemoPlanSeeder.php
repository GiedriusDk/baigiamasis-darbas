<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Plan;
use App\Models\PlanWeek;
use App\Models\PlanDay;
use App\Models\PlanDayExercise;

class DemoPlanSeeder extends Seeder
{
    public function run(): void
    {
        $coachId   = 9;
        $productId = 1;

        $plan = Plan::firstOrCreate(
            ['product_id' => $productId, 'coach_id' => $coachId],
            ['title' => 'Demo plan', 'is_active' => true]
        );

        $week1 = PlanWeek::firstOrCreate(
            ['plan_id' => $plan->id, 'week_number' => 1],
            ['title' => 'Week 1']
        );

        $day1 = PlanDay::firstOrCreate(
            ['plan_week_id' => $week1->id, 'day_number' => 1],
            ['title' => 'Day 1']
        );

        $day2 = PlanDay::firstOrCreate(
            ['plan_week_id' => $week1->id, 'day_number' => 2],
            ['title' => 'Day 2']
        );

        PlanDayExercise::updateOrCreate(
            ['plan_id' => $plan->id, 'plan_day_id' => $day1->id, 'order' => 1],
            ['exercise_id' => 101, 'custom_title' => 'Bench Press', 'sets' => 3, 'reps' => 10, 'rest_seconds' => 90]
        );

        PlanDayExercise::updateOrCreate(
            ['plan_id' => $plan->id, 'plan_day_id' => $day1->id, 'order' => 2],
            ['exercise_id' => 102, 'custom_title' => 'Lat Pulldown', 'sets' => 3, 'reps' => 12, 'rest_seconds' => 75]
        );

        PlanDayExercise::updateOrCreate(
            ['plan_id' => $plan->id, 'plan_day_id' => $day2->id, 'order' => 1],
            ['exercise_id' => 201, 'custom_title' => 'Back Squat', 'sets' => 4, 'reps' => 8, 'rest_seconds' => 120]
        );
    }
}