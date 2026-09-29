<?php

use App\Ai\AiPermissions as P;
use App\Http\Controllers\Ai\ActionCenterController;
use App\Http\Controllers\Ai\ContentStudioController;
use App\Http\Controllers\Ai\CopilotController;
use App\Http\Controllers\Ai\KnowledgeController;
use App\Http\Controllers\Ai\NotificationController;
use App\Http\Controllers\Ai\OnboardingController;
use App\Http\Controllers\Ai\UsageController;
use Illuminate\Support\Facades\Route;

/*
| Tijraa AI platform routes. Loaded inside the authenticated, plan-checked
| group in routes/web.php. Every model lookup is scoped to the current store
| in the controllers (404 for other stores' records).
*/

// Tijraa Copilot
Route::middleware('permission:' . P::USE_COPILOT)->group(function () {
    Route::get('copilot', [CopilotController::class, 'index'])->name('copilot.index');
    Route::get('copilot/{run}', [CopilotController::class, 'show'])->name('copilot.show');
    Route::post('copilot/runs', [CopilotController::class, 'store'])->middleware('throttle:20,1')->name('copilot.runs.store');
    Route::post('copilot/runs/{run}/messages', [CopilotController::class, 'message'])->middleware('throttle:30,1')->name('copilot.runs.message');
    Route::get('copilot/runs/{run}/state', [CopilotController::class, 'state'])->name('copilot.runs.state');
    Route::get('copilot/runs/{run}/stream', [CopilotController::class, 'stream'])->name('copilot.runs.stream');
    Route::post('copilot/runs/{run}/cancel', [CopilotController::class, 'cancel'])->name('copilot.runs.cancel');
    Route::get('copilot/runs/{run}/trace', [CopilotController::class, 'trace'])->name('copilot.runs.trace');
});

// AI Action Center
Route::middleware('permission:' . P::VIEW_ACTIONS)->group(function () {
    Route::get('ai-actions', [ActionCenterController::class, 'index'])->name('ai-actions.index');
    Route::get('ai-actions/{action}', [ActionCenterController::class, 'show'])->name('ai-actions.show');
    Route::post('ai-actions/{action}/approve', [ActionCenterController::class, 'approve'])->middleware('permission:' . P::APPROVE_ACTIONS)->name('ai-actions.approve');
    Route::post('ai-actions/{action}/reject', [ActionCenterController::class, 'reject'])->middleware('permission:' . P::APPROVE_ACTIONS)->name('ai-actions.reject');
});

// Tijraa Knowledge
Route::middleware('permission:' . P::VIEW_KNOWLEDGE)->group(function () {
    Route::get('knowledge', [KnowledgeController::class, 'index'])->name('knowledge.index');
    Route::get('knowledge/{document}', [KnowledgeController::class, 'show'])->name('knowledge.show');
    Route::get('knowledge/{document}/status', [KnowledgeController::class, 'status'])->name('knowledge.status');
    Route::post('knowledge/search', [KnowledgeController::class, 'search'])->middleware('throttle:60,1')->name('knowledge.search');
    Route::middleware('permission:' . P::MANAGE_KNOWLEDGE)->group(function () {
        Route::post('knowledge', [KnowledgeController::class, 'store'])->middleware('throttle:30,1')->name('knowledge.store');
        Route::post('knowledge/{document}/versions', [KnowledgeController::class, 'version'])->name('knowledge.versions.store');
        Route::post('knowledge/{document}/deactivate', [KnowledgeController::class, 'deactivate'])->name('knowledge.deactivate');
        Route::post('knowledge/{document}/activate', [KnowledgeController::class, 'activate'])->name('knowledge.activate');
        Route::post('knowledge/{document}/retry', [KnowledgeController::class, 'retry'])->name('knowledge.retry');
        Route::delete('knowledge/{document}', [KnowledgeController::class, 'destroy'])->name('knowledge.destroy');
    });
});

// AI Content Studio
Route::middleware('permission:' . P::USE_CONTENT_STUDIO)->group(function () {
    Route::get('ai/studio', [ContentStudioController::class, 'index'])->name('ai.studio');
    Route::post('ai/content/draft', [ContentStudioController::class, 'draft'])->middleware('throttle:30,1')->name('ai.content.draft');
    Route::post('ai/content/apply', [ContentStudioController::class, 'apply'])->middleware('permission:' . P::APPROVE_ACTIONS)->name('ai.content.apply');
});

Route::get('ai/usage', [UsageController::class, 'index'])->middleware('permission:' . P::VIEW_AI_USAGE)->name('ai.usage');

// Notifications
Route::middleware('permission:' . P::VIEW_NOTIFICATIONS)->group(function () {
    Route::get('notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::get('notifications/feed', [NotificationController::class, 'feed'])->name('notifications.feed');
    Route::post('notifications/read-all', [NotificationController::class, 'readAll'])->name('notifications.read-all');
    Route::post('notifications/{notification}/read', [NotificationController::class, 'read'])->name('notifications.read');
});

// Onboarding
Route::middleware('permission:' . P::MANAGE_ONBOARDING)->group(function () {
    Route::get('onboarding', [OnboardingController::class, 'index'])->name('onboarding.index');
    Route::post('onboarding/{step}/skip', [OnboardingController::class, 'skip'])->name('onboarding.skip');
    Route::post('onboarding/{step}/complete', [OnboardingController::class, 'complete'])->name('onboarding.complete');
    Route::post('onboarding/{step}/reopen', [OnboardingController::class, 'reopen'])->name('onboarding.reopen');
    Route::post('onboarding/identity', [OnboardingController::class, 'identity'])->name('onboarding.identity');
    Route::post('onboarding/go-live', [OnboardingController::class, 'goLive'])->name('onboarding.go-live');
});
