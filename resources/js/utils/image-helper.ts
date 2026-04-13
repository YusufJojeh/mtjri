/**
 * Interface for Unsplash image data
 */
export interface UnsplashImageData {
  url: string;
  download_location: string;
  photographer_name: string;
  photographer_username?: string;
  photographer_url: string;
  photo_page_url: string;
  unsplash_id: string;
}

/**
 * Get the full URL for an image path or Unsplash image object
 * 
 * @param image The relative path (e.g., /storage/media/29/avatar.png) or an UnsplashImageData object
 * @returns The full URL
 */
export function getImageUrl(image: string | UnsplashImageData | null | undefined): string {
  if (!image) return '';

  let path: string;
  if (typeof image === 'object' && image !== null) {
    path = image.url;
  } else {
    path = image;
  }
  
  if (path.startsWith('http')) {
    return path;
  }
  
  let baseUrl = '';
  
  // Try app settings first
  try {
    if (typeof window !== 'undefined' && window === window.self) {
      try {
        const appSettings = (window as any).appSettings;
        if (appSettings?.baseUrl) {
          baseUrl = appSettings.baseUrl;
        }
      } catch (e) {
        // Ignore cross-origin errors
      }
    }
  } catch (e) {
    // Ignore errors
  }
  
  // Try global settings from Inertia
  if (!baseUrl) {
    try {
      if (typeof window !== 'undefined' && window === window.self) {
        try {
          const page = (window as any).page;
          const globalSettings = page?.props?.globalSettings;
          if (globalSettings?.base_url) {
            baseUrl = globalSettings.base_url;
          }
        } catch (e) {
          // Ignore cross-origin errors
        }
      }
    } catch (e) {
      // Ignore errors
    }
  }
  
  // Fallback: construct from current URL
  if (!baseUrl) {
    try {
      if (typeof window !== 'undefined' && window.location) {
        const { origin, pathname } = window.location;
        
        // For paths like /product/storego/storego-saas-react-demo/...
        if (pathname.includes('/product/')) {
          const pathParts = pathname.split('/');
          const productIndex = pathParts.indexOf('product');
          if (productIndex >= 0 && pathParts.length > productIndex + 2) {
            // Reconstruct base path: /product/storego/storego-saas-react-demo
            const basePath = pathParts.slice(0, productIndex + 3).join('/');
            baseUrl = origin + basePath;
          }
        }
        
        // Handle any subdirectory by detecting if we're not at root
        if (!baseUrl && pathname !== '/' && !pathname.startsWith('/storage/')) {
          const pathParts = pathname.split('/').filter(part => part);
          // If we have path segments and the first one isn't a known route, it"'s" likely a base path
          if (pathParts.length > 0) {
            // Take the first path segment as potential base path
            const potentialBasePath = '/' + pathParts[0];
            baseUrl = origin + potentialBasePath;
          }
        }
        
        // Final fallback
        if (!baseUrl) {
          baseUrl = origin;
        }
      }
    } catch (e) {
      // Ignore errors accessing window.location
      baseUrl = '';
    }
  }
  
  // Clean up URL construction
  baseUrl = baseUrl.replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  return `${baseUrl}${cleanPath}`;
}