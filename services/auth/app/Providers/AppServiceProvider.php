<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        \Illuminate\Auth\Notifications\ResetPassword::toMailUsing(
            function ($notifiable, string $token) {
                $frontend = config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:5173'));
                $url = $frontend.'/reset-password?token='.$token.'&email='.$notifiable->getEmailForPasswordReset();

                return (new \Illuminate\Notifications\Messages\MailMessage)
                    ->subject('Reset your password')
                    ->line('Click the button below to reset your password.')
                    ->action('Reset Password', $url)
                    ->line('If you did not request a password reset, no further action is required.');
            }
        );
    }
}