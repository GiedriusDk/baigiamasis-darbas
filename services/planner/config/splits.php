<?php

return [

  'equipment_policy' => [
    'gym'       => ['*'], 
    'dumbbells' => ['dumbbell','body weight','kettlebell'],
    'home'      => ['body weight','band','dumbbell'],
    'travel'    => ['body weight','band'],
  ],

  'known_tags' => [
    'horizontal_push','vertical_push','horizontal_pull','vertical_pull',
    'hinge','squat','lunge','carry',
    'core_anti_extension','core_rotation',
    'conditioning','cardio',
  ],

  'blueprints' => [

    'muscle_gain' => [

      3 => [
        [
          'name' => 'Push',
          'slots' => [
            ['tag' => 'horizontal_push',  'count' => 2, 'min_compound' => 1],
            ['tag' => 'vertical_push',    'count' => 1],
            ['tag' => 'core_anti_extension','count' => 1],
          ],
        ],
        [
          'name' => 'Pull',
          'slots' => [
            ['tag' => 'horizontal_pull',  'count' => 2, 'min_compound' => 1],
            ['tag' => 'vertical_pull',    'count' => 1],
            ['tag' => 'core_rotation',    'count' => 1],
          ],
        ],
        [
          'name' => 'Legs',
          'slots' => [
            ['tag' => 'hinge',            'count' => 1, 'min_compound' => 1],
            ['tag' => 'squat',            'count' => 1, 'min_compound' => 1],
            ['tag' => 'lunge',            'count' => 1],
            ['tag' => 'core_anti_extension','count' => 1],
          ],
        ],
      ],

      4 => [
        [
          'name' => 'Upper A',
          'slots' => [
            ['tag'=>'horizontal_push','count'=>1,'min_compound'=>1],
            ['tag'=>'vertical_push',  'count'=>1],
            ['tag'=>'horizontal_pull','count'=>1,'min_compound'=>1],
            ['tag'=>'vertical_pull',  'count'=>1],
            ['tag'=>'core_rotation',  'count'=>1],
          ],
        ],
        [
          'name' => 'Lower A',
          'slots' => [
            ['tag'=>'hinge','count'=>1,'min_compound'=>1],
            ['tag'=>'squat','count'=>1,'min_compound'=>1],
            ['tag'=>'lunge','count'=>1],
            ['tag'=>'core_anti_extension','count'=>1],
          ],
        ],
        [
          'name' => 'Upper B',
          'slots' => [
            ['tag'=>'horizontal_push','count'=>1],
            ['tag'=>'vertical_push',  'count'=>1,'min_compound'=>1],
            ['tag'=>'horizontal_pull','count'=>1],
            ['tag'=>'vertical_pull',  'count'=>1,'min_compound'=>1],
            ['tag'=>'core_rotation',  'count'=>1],
          ],
        ],
        [
          'name' => 'Lower B',
          'slots' => [
            ['tag'=>'squat','count'=>1,'min_compound'=>1],
            ['tag'=>'hinge','count'=>1],
            ['tag'=>'lunge','count'=>1],
            ['tag'=>'core_anti_extension','count'=>1],
          ],
        ],
      ],
    ],

    'general_fitness' => [

      3 => [
        [
          'name' => 'Full Body A',
          'slots' => [
            ['tag'=>'hinge',            'count'=>1,'min_compound'=>1],
            ['tag'=>'push',             'count'=>1, 'fallback'=>['horizontal_push','vertical_push']],
            ['tag'=>'pull',             'count'=>1, 'fallback'=>['horizontal_pull','vertical_pull']],
            ['tag'=>'core_anti_extension','count'=>1],
          ],
        ],
        [
          'name' => 'Full Body B',
          'slots' => [
            ['tag'=>'squat',            'count'=>1,'min_compound'=>1],
            ['tag'=>'push',             'count'=>1, 'fallback'=>['horizontal_push','vertical_push']],
            ['tag'=>'pull',             'count'=>1, 'fallback'=>['horizontal_pull','vertical_pull']],
            ['tag'=>'core_rotation',    'count'=>1],
          ],
        ],
        [
          'name' => 'Conditioning',
          'slots' => [
            ['tag'=>'conditioning',     'count'=>1],
            ['tag'=>'cardio',           'count'=>1],
            ['tag'=>'carry',            'count'=>1],
          ],
        ],
      ],

      4 => [
        [
          'name'=>'Upper',
          'slots'=>[
            ['tag'=>'horizontal_push','count'=>1],
            ['tag'=>'vertical_pull',  'count'=>1],
            ['tag'=>'core_rotation',  'count'=>1],
          ],
        ],
        [
          'name'=>'Lower',
          'slots'=>[
            ['tag'=>'squat','count'=>1],
            ['tag'=>'hinge','count'=>1],
            ['tag'=>'core_anti_extension','count'=>1],
          ],
        ],
        [
          'name'=>'Upper + Conditioning',
          'slots'=>[
            ['tag'=>'vertical_push','count'=>1],
            ['tag'=>'horizontal_pull','count'=>1],
            ['tag'=>'conditioning','count'=>1],
          ],
        ],
        [
          'name'=>'Lower + Conditioning',
          'slots'=>[
            ['tag'=>'lunge','count'=>1],
            ['tag'=>'hinge','count'=>1],
            ['tag'=>'conditioning','count'=>1],
          ],
        ],
      ],
    ],

    'fat_loss' => [

      3 => [
        [
          'name'=>'Full Body A',
          'slots'=>[
            ['tag'=>'squat','count'=>1,'min_compound'=>1],
            ['tag'=>'horizontal_push','count'=>1],
            ['tag'=>'horizontal_pull','count'=>1],
            ['tag'=>'core_anti_extension','count'=>1],
          ],
        ],
        [
          'name'=>'Full Body B',
          'slots'=>[
            ['tag'=>'hinge','count'=>1,'min_compound'=>1],
            ['tag'=>'vertical_push','count'=>1],
            ['tag'=>'vertical_pull','count'=>1],
            ['tag'=>'core_rotation','count'=>1],
          ],
        ],
        [
          'name'=>'Cardio / Metcon',
          'slots'=>[
            ['tag'=>'conditioning','count'=>1],
            ['tag'=>'cardio','count'=>1],
          ],
        ],
      ],
    ],

    'performance' => [
      4 => [
        [
          'name'=>'Speed/Power Upper',
          'slots'=>[
            ['tag'=>'horizontal_push','count'=>1,'min_compound'=>1],
            ['tag'=>'vertical_pull','count'=>1,'min_compound'=>1],
            ['tag'=>'core_rotation','count'=>1],
          ],
        ],
        [
          'name'=>'Speed/Power Lower',
          'slots'=>[
            ['tag'=>'hinge','count'=>1,'min_compound'=>1],
            ['tag'=>'squat','count'=>1,'min_compound'=>1],
            ['tag'=>'carry','count'=>1],
          ],
        ],
        [
          'name'=>'Upper Volume',
          'slots'=>[
            ['tag'=>'vertical_push','count'=>1],
            ['tag'=>'horizontal_pull','count'=>1],
            ['tag'=>'core_anti_extension','count'=>1],
          ],
        ],
        [
          'name'=>'Lower Volume + Conditioning',
          'slots'=>[
            ['tag'=>'lunge','count'=>1],
            ['tag'=>'hinge','count'=>1],
            ['tag'=>'conditioning','count'=>1],
          ],
        ],
      ],
    ],
  ],

  'alternation_rules' => [
    'muscle_gain:3' => [
      'biweekly_legs' => true,
    ],
  ],
];