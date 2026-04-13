import React from 'react';

interface UnsplashAttributionProps {
  photographerName: string;
  photographerUsername?: string;
  photoPageUrl: string;
  appName: string;
  className?: string;
}

export const UnsplashAttribution: React.FC<UnsplashAttributionProps> = ({
  photographerName,
  photographerUsername,
  photoPageUrl,
  appName,
  className = '',
}) => {
  if (!photographerName || !photoPageUrl || !appName) {
    return null;
  }

  const utmParams = `utm_source=${appName}&utm_medium=referral`;
  
  const unsplashProfileUrl = photographerUsername 
    ? `https://unsplash.com/@${photographerUsername}?${utmParams}`
    : `${photoPageUrl}?${utmParams}`; // Changed this line to use photoPageUrl as a fallback

  const unsplashWebsiteUrl = `https://unsplash.com/?${utmParams}`;

  return (
    <div className={`absolute bottom-2 right-2 z-30 text-xs text-white/80 p-1 rounded bg-black/50 ${className}`}>
      Photo by{' '}
      <a
        href={unsplashProfileUrl}
        target='_blank'
        rel='noopener noreferrer'
        className='underline hover:text-white'
      >
        {photographerName}
      </a>{' '}
      on{' '}
      <a
        href={unsplashWebsiteUrl}
        target='_blank'
        rel='noopener noreferrer'
        className='underline hover:text-white'
      >
        Unsplash
      </a>
    </div>
  );
};

export default UnsplashAttribution;

