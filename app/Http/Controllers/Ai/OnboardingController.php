<?php

namespace App\Http\Controllers\Ai;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Ai\Concerns\ScopesToStore;
use App\Services\Commerce\StoreOnboarding;
use Illuminate\Http\Request;
use Inertia\Inertia;

class OnboardingController extends Controller
{
    use ScopesToStore;

    public function index(Request $request)
    {
        $store = $this->currentStore($request);
        $flow = StoreOnboarding::for($store);

        return Inertia::render('onboarding/index', [
            'steps' => $flow->steps(),
            'progress' => $flow->progress(),
            'store' => ['id' => $store->id, 'name' => $store->name, 'description' => $store->description, 'is_active' => (bool) $store->is_active, 'slug' => $store->slug],
            'ai_preferences' => $flow->aiPreferences(),
        ]);
    }

    public function skip(Request $request, string $step)
    {
        StoreOnboarding::for($this->currentStore($request))->skip($step, $request->user());

        return back();
    }

    public function complete(Request $request, string $step)
    {
        $data = $step === 'ai_preferences' ? $request->validate([
            'tone' => 'required|in:friendly,professional,playful,luxury,concise',
            'language' => 'required|in:auto,English,Arabic',
            'emoji' => 'boolean',
        ]) : [];
        StoreOnboarding::for($this->currentStore($request))->complete($step, $request->user(), $data);

        return back()->with('success', __('Saved.'));
    }

    public function reopen(Request $request, string $step)
    {
        abort_unless(in_array($step, StoreOnboarding::STEPS, true), 404);
        StoreOnboarding::for($this->currentStore($request))->reopen($step);

        return back();
    }

    public function identity(Request $request)
    {
        abort_unless($request->user()->can('edit-stores') || $request->user()->type === 'company', 403);
        $data = $request->validate(['name' => 'required|string|max:120', 'description' => 'required|string|max:1000']);
        $this->currentStore($request)->update($data);

        return back()->with('success', __('Store details saved.'));
    }

    public function goLive(Request $request)
    {
        $store = $this->currentStore($request);
        $ready = collect(StoreOnboarding::for($store)->steps())->firstWhere('id', 'go_live')['detail']['ready'] ?? false;
        if (! $ready) {
            return back()->withErrors(['go_live' => __('Finish the required steps before going live.')]);
        }
        $store->update(['is_active' => true]);

        return back()->with('success', __('Your store is live.'));
    }
}
