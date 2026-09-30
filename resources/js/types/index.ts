import { LucideIcon } from 'lucide-react';

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    type?: string;
    current_store?: number | string;
    email_verified_at?: string | null;
}

export interface SharedData {
    auth: {
        user: User | null;
    };
    stores?: {
        id: string;
        name: string;
        slug: string;
        theme: string;
    }[];
    [key: string]: any;
}

export interface NavItem {
    title: string;
    href?: string;
    icon?: LucideIcon;
    permission?: string;
    children?: NavItem[];
    target?: string;
}

export interface BreadcrumbItem {
    title: string;
    href?: string;
}

export interface PageAction {
    label: string;
    icon: React.ReactNode;
    variant: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    onClick: () => void;
}