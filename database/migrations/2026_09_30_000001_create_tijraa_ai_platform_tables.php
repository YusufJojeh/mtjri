<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tijraa AI platform: agent runtime, governed actions, commerce intelligence,
 * merchant knowledge (RAG), notifications, onboarding and AI usage ledger.
 * Every table is store-scoped; queries must filter by store_id first.
 */
return new class extends Migration
{
    public function up(): void
    {
        // ---------------------------------------------------------------- Agent runtime
        Schema::create('agent_runs', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('store_id')->constrained('stores')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('profile', 40);
            $table->string('title')->nullable();
            // queued | running | waiting_for_approval | completed | failed | cancelled
            $table->string('status', 32)->default('queued')->index();
            $table->string('provider', 40)->nullable();
            $table->string('model', 80)->nullable();
            $table->string('prompt_version', 20)->nullable();
            $table->json('context')->nullable(); // e.g. {"resource_type":"product","resource_id":3}
            $table->unsignedInteger('step_count')->default(0);
            $table->unsignedInteger('tool_call_count')->default(0);
            $table->unsignedInteger('input_tokens')->default(0);
            $table->unsignedInteger('output_tokens')->default(0);
            $table->string('error_code', 60)->nullable();
            $table->text('error_message')->nullable();
            $table->string('lease_owner', 64)->nullable();
            $table->timestamp('lease_expires_at')->nullable();
            $table->unsignedInteger('last_event_seq')->default(0);
            $table->string('trace_id', 64)->index();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
            $table->index(['store_id', 'user_id', 'updated_at']);
        });

        Schema::create('agent_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('agent_run_id')->constrained('agent_runs')->cascadeOnDelete();
            $table->unsignedInteger('position');
            // user | assistant | tool | system_note
            $table->string('role', 20);
            $table->longText('content')->nullable();
            $table->json('tool_calls')->nullable();   // assistant tool requests [{id,name,arguments}]
            $table->string('tool_call_id', 80)->nullable(); // for role=tool
            $table->json('answer')->nullable();       // structured final answer (assistant)
            $table->timestamps();
            $table->unique(['agent_run_id', 'position']);
        });

        Schema::create('agent_tool_calls', function (Blueprint $table) {
            $table->id();
            $table->foreignId('agent_run_id')->constrained('agent_runs')->cascadeOnDelete();
            $table->foreignId('store_id')->constrained('stores')->cascadeOnDelete();
            $table->string('call_id', 80);
            $table->string('tool', 80);
            $table->string('category', 30);
            $table->json('arguments')->nullable();
            $table->string('arguments_hash', 64);
            // completed | failed | denied | duplicate | proposed
            $table->string('status', 20);
            $table->json('result')->nullable();
            $table->text('summary')->nullable();
            $table->string('error_code', 60)->nullable();
            $table->unsignedInteger('duration_ms')->default(0);
            $table->unsignedInteger('step');
            $table->timestamps();
            $table->index(['agent_run_id', 'tool', 'arguments_hash']);
        });

        Schema::create('agent_actions', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('store_id')->constrained('stores')->cascadeOnDelete();
            $table->foreignId('agent_run_id')->nullable()->constrained('agent_runs')->nullOnDelete();
            $table->foreignId('agent_tool_call_id')->nullable()->constrained('agent_tool_calls')->nullOnDelete();
            $table->string('source', 30)->default('copilot'); // copilot | content_studio
            $table->string('type', 60)->index();
            $table->string('tool', 80)->nullable();
            $table->string('resource_type', 60)->nullable();
            $table->unsignedBigInteger('resource_id')->nullable();
            $table->string('resource_label')->nullable();
            $table->string('goal')->nullable();
            $table->text('rationale')->nullable();
            $table->json('payload');
            $table->string('payload_hash', 64);
            $table->json('preview');
            $table->json('knowledge_used')->nullable();
            $table->string('risk', 10)->default('low');
            // pending | executing | executed | rejected | expired | failed | cancelled
            $table->string('status', 20)->default('pending')->index();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('decided_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('decided_at')->nullable();
            $table->text('decision_note')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('executed_at')->nullable();
            $table->json('execution_result')->nullable();
            $table->text('failure_reason')->nullable();
            $table->boolean('edited')->default(false);
            $table->string('trace_id', 64)->index();
            $table->timestamps();
            $table->index(['store_id', 'status', 'created_at']);
        });

        Schema::create('agent_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('agent_run_id')->constrained('agent_runs')->cascadeOnDelete();
            $table->unsignedInteger('seq');
            $table->string('type', 40);
            $table->json('payload')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->unique(['agent_run_id', 'seq']);
        });

        // ---------------------------------------------------------------- Commerce intelligence
        Schema::create('commerce_insights', function (Blueprint $table) {
            $table->id();
            $table->foreignId('store_id')->constrained('stores')->cascadeOnDelete();
            $table->string('type', 60);
            $table->string('fingerprint', 120);
            $table->string('severity', 12); // critical | high | medium | low | positive
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('metric', 60)->nullable();
            $table->decimal('previous_value', 16, 2)->nullable();
            $table->decimal('current_value', 16, 2)->nullable();
            $table->decimal('estimated_impact', 16, 2)->nullable();
            $table->string('resource_type', 60)->nullable();
            $table->unsignedBigInteger('resource_id')->nullable();
            $table->json('evidence')->nullable();
            $table->json('params')->nullable(); // interpolation values for translated copy
            $table->string('action_url')->nullable();
            $table->timestamp('detected_at');
            $table->timestamp('last_seen_at');
            $table->timestamp('resolved_at')->nullable();
            $table->timestamp('dismissed_at')->nullable();
            $table->timestamps();
            $table->index(['store_id', 'resolved_at', 'dismissed_at']);
            $table->index(['store_id', 'fingerprint']);
        });

        // ---------------------------------------------------------------- Knowledge (RAG)
        Schema::create('knowledge_collections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('store_id')->constrained('stores')->cascadeOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('knowledge_documents', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('store_id')->constrained('stores')->cascadeOnDelete();
            $table->foreignId('collection_id')->nullable()->constrained('knowledge_collections')->nullOnDelete();
            $table->string('title');
            $table->string('doc_type', 40)->default('other');
            // copilot = usable by AI; internal = stored only
            $table->string('visibility', 20)->default('copilot');
            $table->string('source_filename')->nullable();
            $table->string('mime', 120)->nullable();
            $table->unsignedBigInteger('size_bytes')->default(0);
            $table->string('checksum', 64)->nullable();
            // uploading | processing | ready | failed | inactive
            $table->string('status', 20)->default('uploading')->index();
            $table->unsignedInteger('current_version')->default(0);
            $table->unsignedInteger('chunk_count')->default(0);
            $table->text('error')->nullable();
            $table->json('metadata')->nullable();
            $table->unsignedInteger('usage_count')->default(0);
            $table->timestamp('last_used_at')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['store_id', 'status']);
        });

        Schema::create('knowledge_document_versions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('document_id')->constrained('knowledge_documents')->cascadeOnDelete();
            $table->unsignedInteger('version');
            $table->string('checksum', 64);
            $table->string('storage_path')->nullable();
            $table->longText('extracted_text')->nullable();
            $table->unsignedInteger('char_count')->default(0);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->unique(['document_id', 'version']);
        });

        Schema::create('knowledge_chunks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('store_id')->constrained('stores')->cascadeOnDelete();
            $table->foreignId('document_id')->constrained('knowledge_documents')->cascadeOnDelete();
            $table->foreignId('version_id')->constrained('knowledge_document_versions')->cascadeOnDelete();
            $table->unsignedInteger('chunk_index');
            $table->string('heading')->nullable();
            $table->text('content');
            $table->unsignedInteger('token_count')->default(0);
            $table->longText('embedding')->nullable(); // base64 float32 vector
            $table->string('embedding_model', 80)->nullable();
            $table->boolean('active')->default(true);
            $table->timestamps();
            // Store isolation happens in the index-supported WHERE, before scoring.
            $table->index(['store_id', 'active', 'document_id']);
        });

        Schema::create('knowledge_ingestion_runs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('document_id')->constrained('knowledge_documents')->cascadeOnDelete();
            $table->foreignId('version_id')->nullable()->constrained('knowledge_document_versions')->nullOnDelete();
            $table->string('status', 20); // running | completed | failed
            $table->string('stage', 30)->nullable(); // validation | extraction | chunking | embedding | indexing
            $table->text('error')->nullable();
            $table->json('metrics')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('finished_at')->nullable();
            $table->timestamps();
        });

        // ---------------------------------------------------------------- Notifications
        Schema::create('merchant_notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('store_id')->constrained('stores')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('type', 60);
            $table->string('category', 30); // orders | inventory | ai | knowledge | discounts | system
            $table->string('severity', 12)->default('info');
            $table->string('title');
            $table->text('body')->nullable();
            $table->json('params')->nullable();
            $table->string('url')->nullable();
            $table->string('dedupe_key', 160)->nullable();
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
            $table->index(['user_id', 'store_id', 'read_at']);
            $table->index(['user_id', 'dedupe_key']);
        });

        // ---------------------------------------------------------------- Onboarding
        Schema::create('store_onboarding_steps', function (Blueprint $table) {
            $table->id();
            $table->foreignId('store_id')->constrained('stores')->cascadeOnDelete();
            $table->string('step', 40);
            $table->string('status', 20); // completed | skipped
            $table->json('data')->nullable();
            $table->foreignId('completed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->unique(['store_id', 'step']);
        });

        // ---------------------------------------------------------------- AI usage ledger
        Schema::create('ai_usage_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('store_id')->nullable()->constrained('stores')->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('agent_run_id')->nullable()->constrained('agent_runs')->nullOnDelete();
            $table->string('feature', 40);
            $table->string('provider', 40);
            $table->string('model', 80)->nullable();
            $table->string('prompt_version', 20)->nullable();
            $table->unsignedInteger('input_tokens')->default(0);
            $table->unsignedInteger('output_tokens')->default(0);
            $table->decimal('cost_usd', 12, 6)->default(0);
            $table->unsignedInteger('tool_calls')->default(0);
            $table->unsignedInteger('knowledge_searches')->default(0);
            $table->unsignedInteger('latency_ms')->default(0);
            $table->boolean('fallback')->default(false);
            $table->string('status', 20)->default('ok'); // ok | error | budget_blocked
            $table->string('error_code', 60)->nullable();
            $table->string('trace_id', 64)->nullable()->index();
            $table->timestamp('created_at')->useCurrent();
            $table->index(['store_id', 'created_at']);
        });

        Schema::table('plans', function (Blueprint $table) {
            if (! Schema::hasColumn('plans', 'ai_monthly_tokens')) {
                $table->unsignedBigInteger('ai_monthly_tokens')->nullable()->after('enable_chatgpt');
            }
        });
    }

    public function down(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            if (Schema::hasColumn('plans', 'ai_monthly_tokens')) {
                $table->dropColumn('ai_monthly_tokens');
            }
        });
        foreach ([
            'ai_usage_records', 'store_onboarding_steps', 'merchant_notifications', 'knowledge_ingestion_runs',
            'knowledge_chunks', 'knowledge_document_versions', 'knowledge_documents', 'knowledge_collections',
            'commerce_insights', 'agent_events', 'agent_actions', 'agent_tool_calls', 'agent_messages', 'agent_runs',
        ] as $t) {
            Schema::dropIfExists($t);
        }
    }
};
