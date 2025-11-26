<?php


namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class EnsureAdminController extends Controller
{
    protected function ensureAdmin(Request $request)
    {
        $u = $request->user();

        if (!$u || !$u->roles()->where('name', 'admin')->exists()) {
            abort(403, 'Forbidden');
        }
    }
}