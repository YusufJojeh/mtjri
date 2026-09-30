<?php

namespace App\Http\Controllers\Ai\Concerns;

use App\Models\Store;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

/** Every Tijraa AI record is looked up inside the merchant's current store. */
trait ScopesToStore
{
    protected function currentStore(Request $request): Store
    {
        $id = getCurrentStoreId($request->user());
        abort_unless($id, 404);

        return Store::findOrFail($id);
    }

    /** 404 (not 403) so other stores' ids are not confirmed to exist. */
    protected function ensureStore(Request $request, Model $model): void
    {
        abort_unless((int) $model->store_id === (int) $this->currentStore($request)->id, 404);
    }
}
