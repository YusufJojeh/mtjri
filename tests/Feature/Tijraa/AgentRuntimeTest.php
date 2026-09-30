<?php

use App\Ai\AiManager;
use App\Ai\Providers\AiProviderException;
use App\Ai\Providers\QueuedProvider;
use App\Models\Ai\AgentAction;
use App\Models\Ai\AgentEvent;
use App\Models\Ai\AgentRun;
use App\Models\Ai\AgentToolCall;
use Tests\Feature\Tijraa\Setup;

/*
 * Agent runtime evals with a queued (deterministic) model: dynamic tool
 * selection, approval pause, same-run resume, reject, duplicate/unknown
 * tools, provider failure, budget exhaustion and store isolation.
 */
beforeEach(function () {
    [$this->user, $this->store] = Setup::merchant();
    [$this->otherUser, $this->otherStore] = Setup::merchant();
    $this->product = Setup::product($this->store);
    $this->model = new QueuedProvider;
    app(AiManager::class)->fake($this->model);
});

function startRun($test, string $message = 'Improve my lamp description'): array
{
    $res = $test->actingAs($test->user)->postJson(route('copilot.runs.store'), ['message' => $message, 'sync' => true])->assertCreated();

    return $res->json('run');
}

test('model-selected tools run, a proposal pauses the run, approval resumes the same run', function () {
    $pid = $this->product->id;
    $this->model
        ->push(QueuedProvider::tool('get_product', ['product_id' => $pid]))
        ->push(function ($messages, $tools) use ($pid) {
            // The runtime sent the tool result back to the model.
            expect(collect($messages)->last()['role'])->toBe('tool');
            expect(collect($messages)->last()['content'])->toContain('Brass Lamp');

            return QueuedProvider::tool('propose_product_copy', ['product_id' => $pid, 'field' => 'description', 'text' => 'A hand-finished brass lamp with a warm, even glow for reading corners.', 'goal' => 'Richer copy', 'rationale' => 'Description is one word.']);
        })
        ->push(function ($messages) {
            expect(collect($messages)->last()['content'])->toContain('APPROVED');

            return QueuedProvider::final('Done — the new description is live.');
        });

    $run = startRun($this);
    expect($run['status'])->toBe('waiting_for_approval');
    expect($run['actions'])->toHaveCount(1);
    $action = $run['actions'][0];
    expect($action['status'])->toBe('pending');
    expect($this->product->fresh()->description)->toBe('Lamp.'); // nothing mutated while proposing

    $this->actingAs($this->user)->postJson(route('ai-actions.approve', $action['id']), ['payload_hash' => $action['payload_hash']])
        ->assertOk()->assertJsonPath('action.status', 'executed');

    expect($this->product->fresh()->description)->toContain('hand-finished brass lamp');
    $fresh = AgentRun::where('uuid', $run['id'])->first();
    expect($fresh->status)->toBe('completed');
    expect(AgentRun::count())->toBe(1); // same run, no new conversation
    $types = AgentEvent::where('agent_run_id', $fresh->id)->orderBy('seq')->pluck('type')->all();
    expect($types)->toContain('action_proposed', 'waiting_for_approval', 'action_approved', 'action_completed', 'agent_resumed', 'agent_completed');
    expect(AgentEvent::where('agent_run_id', $fresh->id)->orderBy('seq')->pluck('seq')->all())->toBe(range(1, count($types)));
});

test('approval requires the reviewed payload hash and can only happen once', function () {
    $this->model->push(QueuedProvider::tool('propose_product_copy', ['product_id' => $this->product->id, 'field' => 'description', 'text' => 'A hand-finished brass lamp with a warm glow.', 'goal' => 'Copy']))
        ->push(QueuedProvider::final('ok'))->push(QueuedProvider::final('ok'));
    $action = startRun($this)['actions'][0];

    $this->actingAs($this->user)->postJson(route('ai-actions.approve', $action['id']), ['payload_hash' => str_repeat('a', 64)])->assertStatus(409)->assertJsonPath('error', 'payload_mismatch');
    $this->actingAs($this->user)->postJson(route('ai-actions.approve', $action['id']), ['payload_hash' => $action['payload_hash']])->assertOk();
    $this->actingAs($this->user)->postJson(route('ai-actions.approve', $action['id']), ['payload_hash' => $action['payload_hash']])->assertStatus(409);
});

test('rejection resumes the run with the rejection and changes nothing', function () {
    $this->model->push(QueuedProvider::tool('propose_product_copy', ['product_id' => $this->product->id, 'field' => 'description', 'text' => 'A hand-finished brass lamp with a warm glow.', 'goal' => 'Copy']))
        ->push(function ($messages) {
            expect(collect($messages)->last()['content'])->toContain('REJECTED');

            return QueuedProvider::final('Understood.');
        });
    $run = startRun($this);
    $this->actingAs($this->user)->postJson(route('ai-actions.reject', $run['actions'][0]['id']), ['note' => 'Too plain'])->assertOk()->assertJsonPath('action.status', 'rejected');
    expect($this->product->fresh()->description)->toBe('Lamp.');
    expect(AgentRun::where('uuid', $run['id'])->value('status'))->toBe('completed');
});

test('unknown tools and duplicate calls are handled by the runtime, not executed', function () {
    $this->model
        ->push(QueuedProvider::tool('run_sql', ['query' => 'DELETE FROM products']))
        ->push(QueuedProvider::tool('get_store_summary'))
        ->push(QueuedProvider::tool('get_store_summary'))
        ->push(QueuedProvider::final('Summary ready.'));
    $run = startRun($this, 'How is my store doing?');
    expect($run['status'])->toBe('completed');
    $calls = AgentToolCall::orderBy('id')->get();
    expect($calls->pluck('status')->all())->toBe(['failed', 'completed', 'duplicate']);
    expect($calls[0]->error_code)->toBe('unknown_tool');
    expect(\App\Models\Product::count())->toBeGreaterThan(0);
});

test('provider failure fails the run with a merchant-safe code', function () {
    $this->model->push(new AiProviderException('rate_limited', 'slow down'));
    $run = startRun($this);
    expect($run['status'])->toBe('failed')->and($run['error_code'])->toBe('rate_limited');
    expect(AgentEvent::where('type', 'agent_failed')->exists())->toBeTrue();
});

test('exhausted budget blocks the model call', function () {
    config(['tijraa.budget.default_monthly_tokens' => 0]);
    $run = startRun($this);
    expect($run['status'])->toBe('failed')->and($run['error_code'])->toBe('budget_exhausted');
    expect($this->model->requests)->toBeEmpty();
});

test('step limit forces a final answer', function () {
    config(['tijraa.agent.max_steps' => 2]);
    $this->model->push(QueuedProvider::tool('get_store_summary'))->push(QueuedProvider::tool('get_order_summary'))
        ->push(function ($messages, $tools) {
            expect(array_column($tools, 'name'))->toBe(['respond_to_merchant']);

            return QueuedProvider::final('Here is what I found.');
        });
    expect(startRun($this)['status'])->toBe('completed');
});

test('runs, actions and streams are isolated per store and user', function () {
    $this->model->push(QueuedProvider::tool('propose_product_copy', ['product_id' => $this->product->id, 'field' => 'description', 'text' => 'A hand-finished brass lamp with a warm glow.', 'goal' => 'Copy']));
    $run = startRun($this);
    $action = $run['actions'][0];

    $this->actingAs($this->otherUser)->getJson(route('copilot.runs.state', $run['id']))->assertNotFound();
    $this->actingAs($this->otherUser)->get(route('copilot.runs.stream', $run['id']))->assertNotFound();
    $this->actingAs($this->otherUser)->postJson(route('ai-actions.approve', $action['id']), ['payload_hash' => $action['payload_hash']])->assertNotFound();
    expect(AgentAction::first()->status)->toBe('pending');
});

test('a model cannot propose changes to another store\'s product', function () {
    $foreign = Setup::product($this->otherStore, 'Foreign Lamp');
    $this->model->push(QueuedProvider::tool('propose_product_copy', ['product_id' => $foreign->id, 'field' => 'description', 'text' => 'A hand-finished brass lamp with a warm glow.', 'goal' => 'Copy']))
        ->push(QueuedProvider::final('Could not.'));
    $run = startRun($this);
    expect($run['status'])->toBe('completed')->and($run['actions'])->toBeEmpty();
    expect(AgentToolCall::first()->status)->toBe('failed');
});

test('SSE stream replays only events after Last-Event-ID', function () {
    $this->model->push(QueuedProvider::tool('get_store_summary'))->push(QueuedProvider::final('ok'));
    $run = startRun($this);
    $total = AgentEvent::count();
    $body = $this->actingAs($this->user)->withHeaders(['Last-Event-ID' => '2'])->get(route('copilot.runs.stream', $run['id']))->assertOk()->streamedContent();
    expect($body)->not->toContain("id: 1\n")->not->toContain("id: 2\n")->toContain("id: 3\n")->toContain("id: {$total}\n")->toContain('event: stream_end');
    expect($body)->not->toContain('get_store_summary'); // no raw tool names
});
