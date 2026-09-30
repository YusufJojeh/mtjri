<?php

namespace App\Http\Controllers\Ai;

use App\Ai\AiBudget;
use App\Ai\AiManager;
use App\Http\Controllers\Controller;
use App\Http\Controllers\Ai\Concerns\ScopesToStore;
use App\Models\Ai\AiUsageRecord;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class UsageController extends Controller
{
    use ScopesToStore;

    public function index(Request $request)
    {
        $store = $this->currentStore($request);
        $from = now()->startOfMonth();
        $base = AiUsageRecord::where('store_id', $store->id)->where('created_at', '>=', $from);

        return Inertia::render('ai/usage', [
            'ai' => app(AiManager::class)->describe(),
            'budget' => app(AiBudget::class)->summary($store),
            'by_feature' => (clone $base)->select('feature', DB::raw('SUM(input_tokens + output_tokens) as tokens'), DB::raw('SUM(cost_usd) as cost'), DB::raw('COUNT(*) as requests'))->groupBy('feature')->get(),
            'daily' => (clone $base)->select(DB::raw('DATE(created_at) as day'), DB::raw('SUM(input_tokens + output_tokens) as tokens'))->groupBy('day')->orderBy('day')->get(),
            'recent' => AiUsageRecord::where('store_id', $store->id)->latest('id')->limit(25)->get(['feature', 'provider', 'model', 'input_tokens', 'output_tokens', 'cost_usd', 'status', 'error_code', 'created_at']),
        ]);
    }
}
