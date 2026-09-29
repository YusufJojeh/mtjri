<?php

namespace App\Ai\Runtime;

use App\Models\Ai\AgentEvent;
use App\Models\Ai\AgentRun;
use Illuminate\Support\Facades\DB;

/**
 * Persistent, ordered run events (replayable by sequence id). A live
 * listener lets the SSE endpoint push events as they are written.
 *
 * Payloads are merchant-safe: progress labels and structured results only —
 * never chain-of-thought or raw prompts.
 */
class AgentEvents
{
    /** @var array<int, callable(AgentEvent): void> */
    private static array $listeners = [];

    public static function listen(int $runId, callable $fn): void
    {
        self::$listeners[$runId] = $fn;
    }

    public static function forget(int $runId): void
    {
        unset(self::$listeners[$runId]);
    }

    public static function emit(AgentRun $run, string $type, array $payload = []): AgentEvent
    {
        $event = DB::transaction(function () use ($run, $type, $payload) {
            DB::table('agent_runs')->where('id', $run->id)->increment('last_event_seq');
            $seq = (int) DB::table('agent_runs')->where('id', $run->id)->value('last_event_seq');

            return AgentEvent::create(['agent_run_id' => $run->id, 'seq' => $seq, 'type' => $type, 'payload' => $payload, 'created_at' => now()]);
        });
        $run->last_event_seq = $event->seq;
        if (isset(self::$listeners[$run->id])) {
            (self::$listeners[$run->id])($event);
        }

        return $event;
    }
}
