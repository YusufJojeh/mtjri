import { DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { UserInfo } from '@/components/user-info';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { type User } from '@/types';
import { Link } from '@inertiajs/react';
import { LogOut, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface UserMenuContentProps {
    user: User;
    position: 'left' | 'right';
}

export function UserMenuContent({ user, position }: UserMenuContentProps) {
    const { t } = useTranslation();
    const cleanup = useMobileNavigation();

    return (
        <>
            <DropdownMenuLabel className='p-0 font-normal'>
                <div className='flex items-center gap-2 px-1 py-1.5 text-start text-sm'>
                    <UserInfo user={user} showEmail={true} position={position} />
                </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                    <Link className='w-full' href={route('profile')} as='button' prefetch onClick={cleanup}>
                        <Settings />
                        {t('Profile')}
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
                <Link className='w-full' method='post' href={route('logout')} as='button' onClick={cleanup}>
                    <LogOut />
                    {t('Log out')}
                </Link>
            </DropdownMenuItem>
        </>
    );
}
