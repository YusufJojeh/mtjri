<?php

namespace App\Http\Controllers\LandingPage;

use App\Http\Controllers\Controller;
use App\Models\Newsletter;
use Illuminate\Http\Request;
use Inertia\Inertia;

class NewsletterController extends Controller
{
    public function index(Request $request)
    {
        $query = Newsletter::orderBy('created_at', 'desc');

        // Search functionality
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where('email', 'like', "%{$search}%");
        }

        // Status filter
        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        $newsletters = $query->paginate(15)->withQueryString();

        return Inertia::render('landing-page/newsletters/index', [
            'newsletters' => $newsletters,
            'filters' => $request->only(['search', 'status']),
            'stats' => [
                'total' => Newsletter::count(),
                'active' => Newsletter::active()->count(),
                'unsubscribed' => Newsletter::unsubscribed()->count(),
            ]
        ]);
    }

    public function show(Newsletter $newsletter)
    {
        return Inertia::render('landing-page/newsletters/show', [
            'newsletter' => $newsletter
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'email' => 'required|email|unique:newsletters,email'
        ]);

        Newsletter::create([
            'email' => $request->email,
            'status' => 'active',
            'subscribed_at' => now()
        ]);

        return back()->with('success', __('Newsletter subscription added successfully!'));
    }

    public function update(Request $request, Newsletter $newsletter)
    {
        $request->validate([
            'status' => 'required|in:active,unsubscribed'
        ]);

        $updateData = ['status' => $request->status];
        
        if ($request->status === 'unsubscribed' && $newsletter->status === 'active') {
            $updateData['unsubscribed_at'] = now();
        } elseif ($request->status === 'active' && $newsletter->status === 'unsubscribed') {
            $updateData['subscribed_at'] = now();
            $updateData['unsubscribed_at'] = null;
        }

        $newsletter->update($updateData);

        return back()->with('success', __('Newsletter subscription updated successfully!'));
    }

    public function destroy(Newsletter $newsletter)
    {
        $newsletter->delete();

        return back()->with('success', __('Newsletter subscription deleted successfully!'));
    }

    public function bulkAction(Request $request)
    {
        $request->validate([
            'action' => 'required|in:delete,activate,unsubscribe',
            'ids' => 'required|array',
            'ids.*' => 'exists:newsletters,id'
        ]);

        $newsletters = Newsletter::whereIn('id', $request->ids);

        switch ($request->action) {
            case 'delete':
                $newsletters->delete();
                $message = __('Selected subscriptions deleted successfully!');
                break;
            case 'activate':
                $newsletters->update([
                    'status' => 'active',
                    'subscribed_at' => now(),
                    'unsubscribed_at' => null
                ]);
                $message = __('Selected subscriptions activated successfully!');
                break;
            case 'unsubscribe':
                $newsletters->update([
                    'status' => 'unsubscribed',
                    'unsubscribed_at' => now()
                ]);
                $message = __('Selected subscriptions unsubscribed successfully!');
                break;
        }

        return back()->with('success', $message);
    }
}