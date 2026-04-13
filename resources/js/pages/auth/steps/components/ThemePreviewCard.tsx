import React from 'react';
import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ThemePreviewCardProps {
  theme: {
    id: string;
    name: string;
    description: string;
    thumbnail: string;
  };
  isSelected: boolean;
  onSelect: (themeId: string) => void;
  isAvailable: boolean;
}

export const ThemePreviewCard: React.FC<ThemePreviewCardProps> = ({
  theme,
  isSelected,
  onSelect,
  isAvailable,
}) => {
  const { t } = useTranslation();

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    (e.target as HTMLImageElement).src = `https://placehold.co/300x180?text=${encodeURIComponent(theme.name)}`;
  };

  return (
    <div
      key={theme.id}
      className={`cursor-pointer rounded-lg border-2 p-1 transition-all duration-200 ${
        isSelected ? 'border-primary' : 'border-gray-200 hover:border-gray-300'
      } ${!isAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={() => isAvailable && onSelect(theme.id)}
    >
      <div className='relative aspect-video overflow-hidden rounded-md theme-preview-container'>
        <img
          src={theme.thumbnail}
          alt={theme.name}
          className='h-full w-full object-cover theme-preview-image'
          onError={handleImageError}
        />
        {isSelected && (
          <div className='absolute inset-0 flex items-center justify-center bg-primary/20'>
            <div className='rounded-full bg-primary p-1'>
              <Check className='h-4 w-4 text-white' />
            </div>
          </div>
        )}
      </div>
      <div className='p-2'>
        <h3 className='font-medium text-sm'>{t(theme.name)}</h3>
        <p className='text-xs text-muted-foreground line-clamp-2'>
          {t(theme.description)}
        </p>
      </div>
    </div>
  );
};

