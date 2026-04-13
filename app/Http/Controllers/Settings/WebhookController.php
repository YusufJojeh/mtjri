<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\Webhook;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class WebhookController extends Controller
{
    private function authorizeWebhookAccess(): void
    {
        abort_unless(auth()->check() && auth()->user()->can('manage-webhook-settings'), 403);
    }

    public function index(): JsonResponse
    {
        $this->authorizeWebhookAccess();
        $webhooks = Webhook::where('user_id', auth()->id())->get();
        return response()->json($webhooks);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorizeWebhookAccess();
        $request->validate([
            'module' => 'required|in:New User',
            'method' => 'required|in:GET,POST',
            'url' => 'required|url',
        ]);

        $webhook = Webhook::create([
            'user_id' => auth()->id(),
            'module' => $request->module,
            'method' => $request->method,
            'url' => $request->url,
        ]);

        return response()->json([
            'webhook' => $webhook,
            'message' => 'Webhook created successfully'
        ]);
    }

    public function update(Request $request, Webhook $webhook): JsonResponse
    {
        $this->authorizeWebhookAccess();
        if ($webhook->user_id !== auth()->id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'module' => 'required|in:New User',
            'method' => 'required|in:GET,POST',
            'url' => 'required|url',
        ]);

        $webhook->update([
            'module' => $request->module,
            'method' => $request->method,
            'url' => $request->url,
        ]);

        return response()->json([
            'webhook' => $webhook,
            'message' => 'Webhook updated successfully'
        ]);
    }

    public function destroy(Webhook $webhook): JsonResponse
    {
        $this->authorizeWebhookAccess();
        if ($webhook->user_id !== auth()->id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $webhook->delete();

        return response()->json(['message' => 'Webhook deleted successfully']);
    }
}