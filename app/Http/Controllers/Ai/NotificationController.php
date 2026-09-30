<?php

namespace App\Http\Controllers\Ai;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Ai\Concerns\ScopesToStore;
use App\Models\Ai\MerchantNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class NotificationController extends Controller
{
    use ScopesToStore;

    public function index(Request $request)
    {
        $filter = in_array($request->query('filter'), ['unread', 'orders', 'inventory', 'ai', 'knowledge', 'discounts', 'system'], true) ? $request->query('filter') : 'all';
        $page = $this->query($request, $filter)->paginate(25)->withQueryString();

        return Inertia::render('notifications/index', [
            'filter' => $filter,
            'notifications' => ['data' => collect($page->items())->map(fn ($n) => $this->present($n)), 'current_page' => $page->currentPage(), 'last_page' => $page->lastPage(), 'total' => $page->total(), 'per_page' => $page->perPage(), 'from' => $page->firstItem(), 'to' => $page->lastItem()],
            'unread' => $this->query($request, 'unread')->count(),
        ]);
    }

    /** Lightweight feed for the header bell (polled). */
    public function feed(Request $request): JsonResponse
    {
        return response()->json([
            'unread' => $this->query($request, 'unread')->count(),
            'items' => $this->query($request, 'all')->limit(8)->get()->map(fn ($n) => $this->present($n)),
        ]);
    }

    public function read(Request $request, MerchantNotification $notification)
    {
        abort_unless($notification->user_id === $request->user()->id, 404);
        $this->ensureStore($request, $notification);
        $notification->update(['read_at' => $notification->read_at ?? now()]);

        return $request->wantsJson() ? response()->json(['ok' => true]) : ($notification->url ? redirect($notification->url) : back());
    }

    public function readAll(Request $request)
    {
        $this->query($request, 'unread')->update(['read_at' => now()]);

        return $request->wantsJson() ? response()->json(['ok' => true]) : back();
    }

    private function query(Request $request, string $filter)
    {
        $q = MerchantNotification::where('user_id', $request->user()->id)->where('store_id', $this->currentStore($request)->id)->latest('id');

        return match ($filter) {
            'all' => $q,
            'unread' => $q->whereNull('read_at'),
            default => $q->where('category', $filter),
        };
    }

    private function present(MerchantNotification $n): array
    {
        return [
            'id' => $n->id, 'type' => $n->type, 'category' => $n->category, 'severity' => $n->severity,
            'title' => $n->title, 'body' => $n->body, 'params' => $n->params ?? [],
            'url' => $n->url, 'read' => $n->read_at !== null, 'created_at' => $n->created_at?->toIso8601String(),
        ];
    }
}
