<?php

namespace App\Ai\Tools;

/**
 * A capability the model may request. The backend validates arguments,
 * checks permission and profile, executes, and returns a bounded result.
 * The model never touches the database directly.
 */
abstract class Tool
{
    public const READ = 'read';
    public const ANALYTICS = 'analytics';
    public const RESEARCH = 'research';
    public const KNOWLEDGE = 'knowledge';
    public const GENERATIVE = 'generative';
    public const WRITE_PROPOSAL = 'write_proposal';
    public const ACTION = 'action';

    /** Unique snake_case name the model calls. */
    abstract public function name(): string;

    /** Model-facing description: what it returns and when to use it. */
    abstract public function description(): string;

    /** JSON schema (object) for arguments. */
    public function parameters(): array
    {
        return ['type' => 'object', 'properties' => new \stdClass(), 'additionalProperties' => false];
    }

    abstract public function category(): string;

    /** Merchant-facing progress line (never the tool name). */
    abstract public function progressLabel(): string;

    abstract public function handle(ToolContext $ctx, array $args): ToolResult;

    public function risk(): string
    {
        return $this->category() === self::WRITE_PROPOSAL ? 'medium' : 'low';
    }

    /** Spatie permission the acting user must hold (checked at call time). */
    public function permission(): ?string
    {
        return null;
    }

    /** Agent profiles allowed to use this tool. */
    public function profiles(): array
    {
        return AgentProfiles::ALL;
    }

    /** Proposals never mutate; an approved AgentAction executes later. */
    public function requiresApproval(): bool
    {
        return $this->category() === self::WRITE_PROPOSAL;
    }

    public function timeoutSeconds(): int
    {
        return (int) config('tijraa.agent.tool_timeout_seconds', 10);
    }

    /** Max characters of JSON returned to the model. */
    public function resultLimit(): int
    {
        return 6000;
    }

    public function definition(): array
    {
        return ['name' => $this->name(), 'description' => $this->description(), 'parameters' => $this->parameters()];
    }
}
