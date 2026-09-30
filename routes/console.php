<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

/*
| Tijraa platform maintenance: expire stale AI proposals, refresh commerce
| intelligence and warn about discounts ending soon. Idempotent.
*/
Artisan::command('tijraa:maintain {--store=}', function () {
    $expired = app(\App\Ai\Actions\ActionService::class)->expireStale();
    $stores = \App\Models\Store::query()->when($this->option('store'), fn ($q, $id) => $q->whereKey($id))->get();
    $insights = 0;
    foreach ($stores as $store) {
        try {
            $open = \App\Services\Commerce\CommerceIntelligence::for($store)->refresh();
            $insights += $open->count();
            foreach ($open->where('type', 'discount_expiring') as $i) {
                \App\Services\Notifications\MerchantNotifier::notify($store, 'discount_expiring', ':code ends in :days days', null,
                    ['code' => $i->params['code'] ?? '', 'days' => $i->params['days'] ?? 0], $i->action_url, "discount_expiring:{$i->resource_id}", 72);
            }
        } catch (\Throwable $e) {
            report($e);
            $this->warn("Store {$store->id}: {$e->getMessage()}");
        }
    }
    $this->info("Expired {$expired} proposals; {$insights} open insights across {$stores->count()} stores.");
})->purpose('Expire AI proposals, refresh commerce insights, send discount reminders');

\Illuminate\Support\Facades\Schedule::command('tijraa:maintain')->hourly()->withoutOverlapping();
