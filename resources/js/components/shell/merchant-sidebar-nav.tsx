import { Link, usePage } from '@inertiajs/react';
import { useMemo } from 'react';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    useSidebar,
} from '@/components/ui/sidebar';
import { activeNavId, pathOf, type MerchantNavGroup } from './merchant-nav';

export function MerchantSidebarNav({ groups }: { groups: MerchantNavGroup[] }) {
    const page = usePage();
    const { isMobile, setOpenMobile } = useSidebar();
    const currentPath = page.url.split('?')[0];
    const activeId = useMemo(() => activeNavId(groups, currentPath), [groups, currentPath]);

    const close = () => {
        if (isMobile) setOpenMobile(false);
    };

    return (
        <nav aria-label="Main" className="flex flex-col gap-0.5 py-1">
            {groups.map((group) => (
                <SidebarGroup key={group.id} className="py-1">
                    {group.label && (
                        <SidebarGroupLabel className="text-sidebar-foreground/55 h-7 px-2 text-[11px] font-semibold tracking-wide uppercase">
                            {group.label}
                        </SidebarGroupLabel>
                    )}
                    <SidebarMenu className="gap-px">
                        {group.items.map((item) => {
                            const active = item.id === activeId;
                            const Icon = item.icon;
                            return (
                                <SidebarMenuItem key={item.id}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={active}
                                        tooltip={item.title}
                                        className="text-sidebar-foreground/85 data-[active=true]:text-sidebar-accent-foreground h-8 gap-2.5 text-start text-[13px] font-medium data-[active=true]:bg-sidebar-accent data-[active=true]:font-semibold"
                                    >
                                        <Link href={item.href} prefetch onClick={close} aria-current={active ? 'page' : undefined}>
                                            <Icon className={active ? 'text-foreground' : 'opacity-70'} />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                    {item.children && active && (
                                        <SidebarMenuSub className="me-0 border-s-sidebar-border">
                                            {item.children.map((c) => {
                                                const childActive = currentPath === pathOf(c.href) || currentPath.startsWith(pathOf(c.href) + '/');
                                                return (
                                                    <SidebarMenuSubItem key={c.id}>
                                                        <SidebarMenuSubButton asChild isActive={childActive} className="h-7 text-[13px]">
                                                            <Link href={c.href} onClick={close} aria-current={childActive ? 'page' : undefined}>
                                                                <span>{c.title}</span>
                                                            </Link>
                                                        </SidebarMenuSubButton>
                                                    </SidebarMenuSubItem>
                                                );
                                            })}
                                        </SidebarMenuSub>
                                    )}
                                </SidebarMenuItem>
                            );
                        })}
                    </SidebarMenu>
                </SidebarGroup>
            ))}
        </nav>
    );
}
