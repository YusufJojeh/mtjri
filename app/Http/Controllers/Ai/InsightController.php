<?php

namespace App\Http\Controllers\Ai;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Ai\Concerns\ScopesToStore;
use App\Models\Ai\CommerceInsight;
use Illuminate\Http\Request;

class InsightController extends Controller
{
    use ScopesToStore;

    /** Hide an insight until the underlying signal changes (a new fingerprint). */
    public function dismiss(Request $request, CommerceInsight $insight)
    {
        $this->ensureStore($request, $insight);
        $insight->update(['dismissed_at' => now()]);

        return $request->wantsJson() ? response()->json(['ok' => true]) : back();
    }
}
