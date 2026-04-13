import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { router } from '@inertiajs/react';
import { Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import languageData from '@/../../resources/lang/language.json';
import ReactCountryFlag from 'react-country-flag';

export function LanguageSelector() {
  const { i18n } = useTranslation();

  const currentLanguage = React.useMemo(() =>
    languageData.find(lang => lang.code === i18n.language) || languageData[0],
    [i18n.language]
  );

  const handleLanguageChange = async (languageCode: string) => {
    localStorage.setItem('i18nextLng', languageCode);
    await i18n.changeLanguage(languageCode);
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
        <Button variant='ghost' size='icon' className='h-9 w-9'>
          <ReactCountryFlag
            countryCode={currentLanguage.countryCode}
            svg
            style={{
              width: '1.5em',
              height: '1.5em',
            }}
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-48'>
        {languageData.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            className='flex items-center gap-2 cursor-pointer'
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
