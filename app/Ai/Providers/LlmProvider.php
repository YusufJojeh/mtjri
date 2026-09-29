<?php

namespace App\Ai\Providers;

/**
 * Provider-neutral chat interface with tool calling.
 *
 * Messages: [{role: system|user|assistant|tool, content?: string,
 *             tool_calls?: [{id,name,arguments}], tool_call_id?: string}]
 * Tools:    [{name, description, parameters: JSON schema}]
 */
interface LlmProvider
{
    public function name(): string;

    public function model(): string;

    /**
     * @param array<int, array<string, mixed>> $messages
     * @param array<int, array{name:string,description:string,parameters:array}> $tools
     * @param array{max_tokens?:int,temperature?:float,timeout?:int} $options
     *
     * @throws AiProviderException
     */
    public function chat(array $messages, array $tools = [], array $options = []): LlmResponse;
}
