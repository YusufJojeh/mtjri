import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Link, router, usePage } from '@inertiajs/react';
import { LogOut, User, CreditCard } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePermissions } from '@/hooks/usePermissions';
import ReactCountryFlag from 'react-country-flag';
import languageData from '@/../../resources/lang/language.json';

export function ProfileMenu() {
  const { t, i18n } = useTranslation();
  const { auth } = usePage().props as any;
  const user = auth?.user;
  const { hasPermission } = usePermissions();
  const permissions = auth?.permissions || [];

  const handleLogout = () => {
    router.post(route('logout'));
  };

  const initials = user?.name
    ? String(user.name)
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
    : 'U';

  const currentLanguage = React.useMemo(() => 
    languageData.find(lang => lang.code === i18n.language) || languageData[0],
    [i18n.language]
  );

  const handleLanguageChange = async (languageCode: string) => {
    // Save to localStorage FIRST to ensure it persists
    localStorage.setItem('i18nextLng', languageCode);
    
    // Change language (translations are already loaded from local files)
    await i18n.changeLanguage(languageCode);
    
    // Save language preference to backend (non-blocking, don't wait for it)
    setTimeout(() => {
      router.post(route('user.language.update'), {
        language: languageCode
      }, {
        preserveScroll: true,
        preserveState: true,
        only: [],
        onError: () => {}
      });
    }, 0);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' className='flex items-center gap-2 h-8 rounded-md'>
          <span className='text-sm font-medium hidden md:inline-block'>{user?.name}</span>
          <Avatar className='h-8 w-8'>
            <AvatarImage src={user?.avatar} alt={user?.name} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-56' align='end' forceMount>
        <DropdownMenuLabel className='font-normal'>
          <div className='flex flex-col space-y-1'>
            <p className='text-sm font-medium leading-none'>{user?.name}</p>
            <p className='text-xs leading-none text-muted-foreground'>
              {user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href={route('profile')}>
              <User className='mr-2 h-4 w-4' />
              <span>{t('Profile')}</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        {(hasPermission(permissions, 'view-plans') || hasPermission(permissions, 'manage-plans') || 
          hasPermission(permissions, 'manage-plan-requests') || hasPermission(permissions, 'view-plan-requests') ||
          hasPermission(permissions, 'manage-plan-orders') || hasPermission(permissions, 'view-plan-orders')) && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel>{t('Plans')}</DropdownMenuLabel>
              {(hasPermission(permissions, 'view-plans') || hasPermission(permissions, 'manage-plans')) && (
                <DropdownMenuItem asChild>
                  <Link href={route('plans.index')}>
                    <CreditCard className='mr-2 h-4 w-4' />
                    <span>{t('Plan')}</span>
                  </Link>
                </DropdownMenuItem>
              )}
              {(hasPermission(permissions, 'manage-plan-requests') || hasPermission(permissions, 'view-plan-requests')) && (
                <DropdownMenuItem asChild>
                  <Link href={route('plan-requests.index')}>
                    <CreditCard className='mr-2 h-4 w-4' />
                    <span>{t('My Plan Request')}</span>
                  </Link>
                </DropdownMenuItem>
              )}
              {(hasPermission(permissions, 'manage-plan-orders') || hasPermission(permissions, 'view-plan-orders')) && (
                <DropdownMenuItem asChild>
                  <Link href={route('plan-orders.index')}>
                    <CreditCard className='mr-2 h-4 w-4' />
                    <span>{t('My Plan Orders')}</span>
                  </Link>
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className='mr-2 h-4 w-4' />
          <span>{t('Log out')}</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>{t('Language')}</DropdownMenuLabel>
          {languageData.map((language) => (
            <DropdownMenuItem
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              className='flex items-center gap-2'
            >
              <ReactCountryFlag
                countryCode={language.countryCode}
                svg
                style={{
                  width: '1.2em',
                  height: '1.2em',
                }}
              />
              <span className={currentLanguage.code === language.code ? 'font-semibold' : ''}>
                {language.name}
              </span>
            </DropdownMenuItem>
          ))}
          {hasPermission(permissions, 'manage-language') && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={route('manage-language')} className='justify-center text-primary font-semibold'>
                  {t('Manage Language')}
                </Link>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}