<?php

namespace App\Ai\Tools;

use App\Models\Ai\AgentRun;
use App\Models\Store;
use App\Models\User;

final class ToolContext
{
    public function __construct(
        public readonly Store $store,
        public readonly User $user,
        public readonly string $profile,
        public readonly ?AgentRun $run = null,
        public readonly ?string $callId = null,
        public readonly ?int $toolCallId = null,
    ) {}
}
