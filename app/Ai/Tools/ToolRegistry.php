<?php

namespace App\Ai\Tools;

use App\Models\User;

/**
 * The one authoritative list of tools. The runtime offers the model only
 * the tools allowed for the run's profile AND the user's permissions, and
 * re-checks both at execution time.
 */
class ToolRegistry
{
    /** @var array<string, Tool> */
    private array $tools = [];

    public const CLASSES = [
        Commerce\GetStoreSummary::class,
        Commerce\GetDashboardMetrics::class,
        Commerce\GetRevenueTrend::class,
        Commerce\GetOrderSummary::class,
        Commerce\GetRecentOrders::class,
        Commerce\GetOrder::class,
        Commerce\SearchProducts::class,
        Commerce\GetProduct::class,
        Commerce\GetProductPerformance::class,
        Commerce\GetTopProducts::class,
        Commerce\GetDecliningProducts::class,
        Commerce\GetInventoryStatus::class,
        Commerce\GetLowStockProducts::class,
        Commerce\SearchCustomers::class,
        Commerce\GetCustomer::class,
        Commerce\GetCustomerSummary::class,
        Commerce\GetDiscountPerformance::class,
        Commerce\GetStoreSetupStatus::class,
        Commerce\GetContentStatus::class,
        Commerce\GetSeoStatus::class,
        Commerce\GetRecentActivity::class,
        Commerce\GetCommerceInsights::class,
        Commerce\DismissInsight::class,
        Knowledge\SearchKnowledge::class,
        Content\DraftProductCopy::class,
        Proposals\ProposeProductCopy::class,
        Proposals\ProposeDiscount::class,
        Proposals\ProposeBlogSeo::class,
        Proposals\ProposePageSeo::class,
    ];

    public function __construct()
    {
        foreach (self::CLASSES as $cls) {
            $tool = new $cls();
            if (isset($this->tools[$tool->name()])) {
                throw new \LogicException("Duplicate tool name {$tool->name()}");
            }
            $this->tools[$tool->name()] = $tool;
        }
    }

    /** @return array<string, Tool> */
    public function all(): array
    {
        return $this->tools;
    }

    public function get(string $name): ?Tool
    {
        return $this->tools[$name] ?? null;
    }

    public function allows(Tool $tool, string $profile, User $user): bool
    {
        if (! in_array($profile, $tool->profiles(), true)) {
            return false;
        }
        if ($tool->category() === Tool::WRITE_PROPOSAL && ! in_array($profile, AgentProfiles::PROPOSERS, true)) {
            return false;
        }

        return ! $tool->permission() || $user->can($tool->permission());
    }

    /** @return Tool[] */
    public function forProfile(string $profile, User $user): array
    {
        return array_values(array_filter($this->tools, fn (Tool $t) => $this->allows($t, $profile, $user)));
    }
}
