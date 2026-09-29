<?php

namespace App\Ai;

/**
 * Permissions for the Tijraa AI platform. Kept in one place so the seeder,
 * the upgrade migration and route middleware agree.
 */
final class AiPermissions
{
    public const USE_COPILOT = 'use-ai-copilot';
    public const APPROVE_ACTIONS = 'approve-ai-actions';
    public const VIEW_ACTIONS = 'view-ai-actions';
    public const MANAGE_KNOWLEDGE = 'manage-knowledge';
    public const VIEW_KNOWLEDGE = 'view-knowledge';
    public const USE_CONTENT_STUDIO = 'use-content-studio';
    public const VIEW_AI_USAGE = 'view-ai-usage';
    public const VIEW_NOTIFICATIONS = 'view-notifications';
    public const MANAGE_ONBOARDING = 'manage-onboarding';

    /** @return array<int, array{name:string,module:string,label:string,description:string}> */
    public static function definitions(): array
    {
        return [
            ['name' => self::USE_COPILOT, 'module' => 'ai', 'label' => 'Use Tijraa Copilot', 'description' => 'Ask Tijraa Copilot about store data'],
            ['name' => self::VIEW_ACTIONS, 'module' => 'ai', 'label' => 'View AI Actions', 'description' => 'See AI-proposed changes'],
            ['name' => self::APPROVE_ACTIONS, 'module' => 'ai', 'label' => 'Approve AI Actions', 'description' => 'Approve or reject AI-proposed changes'],
            ['name' => self::USE_CONTENT_STUDIO, 'module' => 'ai', 'label' => 'Use AI Content Studio', 'description' => 'Generate and apply AI content drafts'],
            ['name' => self::VIEW_AI_USAGE, 'module' => 'ai', 'label' => 'View AI Usage', 'description' => 'See AI usage and budget'],
            ['name' => self::VIEW_KNOWLEDGE, 'module' => 'knowledge', 'label' => 'View Tijraa Knowledge', 'description' => 'View knowledge documents'],
            ['name' => self::MANAGE_KNOWLEDGE, 'module' => 'knowledge', 'label' => 'Manage Tijraa Knowledge', 'description' => 'Upload, deactivate and delete knowledge documents'],
            ['name' => self::VIEW_NOTIFICATIONS, 'module' => 'notifications', 'label' => 'View Notifications', 'description' => 'Receive store notifications'],
            ['name' => self::MANAGE_ONBOARDING, 'module' => 'onboarding', 'label' => 'Manage Onboarding', 'description' => 'Complete store setup steps'],
        ];
    }

    /** @return string[] */
    public static function names(): array
    {
        return array_column(self::definitions(), 'name');
    }
}
