/** Shape of the dashboard command-center payload (DashboardController::getCommandCenter). */
export interface CommandCenterData {
    periodDays: number;
    kpis: Record<'sales' | 'orders' | 'aov' | 'newCustomers', { current: number; previous: number }>;
    topProducts: Array<{ id: number; name: string; units: number; revenue: number; stock: number | null }>;
    buyers: { total: number; repeat: number };
    catalog: { products: number; active: number; lowStockThreshold: number };
}
