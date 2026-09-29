<?php

namespace App\Ai\Tools;

/** One runtime, several policies. */
final class AgentProfiles
{
    public const COMMERCE = 'commerce_copilot';
    public const CONTENT = 'content_copilot';
    public const GROWTH = 'growth_copilot';
    public const OPERATIONS = 'operations_copilot';
    public const READ_ONLY = 'read_only';

    public const ALL = [self::COMMERCE, self::CONTENT, self::GROWTH, self::OPERATIONS, self::READ_ONLY];

    /** Profiles that may prepare write proposals. */
    public const PROPOSERS = [self::COMMERCE, self::CONTENT, self::GROWTH];

    public static function isValid(string $profile): bool
    {
        return in_array($profile, self::ALL, true);
    }

    /** Role statement appended to the shared system prompt. */
    public static function focus(string $profile): string
    {
        return match ($profile) {
            self::CONTENT => 'You specialise in product copy, SEO metadata and brand-consistent content. Use Tijraa Knowledge for brand voice when available.',
            self::GROWTH => 'You specialise in sales growth: demand, pricing, discounts and customer retention, grounded in store data.',
            self::OPERATIONS => 'You specialise in operations: orders, fulfilment backlog, payments and inventory risk. You do not prepare changes.',
            self::READ_ONLY => 'You answer questions from store data and knowledge only. You never prepare changes.',
            default => 'You are the merchant\'s commerce copilot across sales, catalogue, inventory, customers, discounts and content.',
        };
    }
}
