/**
 * Get the current CSRF token from various sources
 */
export function getCsrfToken(): string | null {
  // Try to get from Inertia's page data first (most reliable after login)
  try {
    if (typeof window !== 'undefined' && window === window.self) {
      try {
        const page = (window as any).page;
        if (page?.props?.csrf_token) {
          return page.props.csrf_token;
        }
      } catch (e) {
        // Ignore errors accessing window.page (cross-origin issues)
      }
    }
  } catch (e) {
    // Ignore errors accessing window
  }
  
  // Fallback to meta tag
  try {
    const token = document.head.querySelector('meta[name="csrf-token"]');
    if (token) {
      return (token as HTMLMetaElement).content;
    }
  } catch (e) {
    // Ignore errors accessing document
  }
  
  return null;
}

/**
 * Update the global CSRF token in axios defaults
 */
export function updateAxiosCsrfToken(): void {
  const token = getCsrfToken();
  if (token) {
    // Update axios default headers if axios is available
    try {
      if (typeof window !== 'undefined' && window === window.self) {
        try {
          const axios = (window as any).axios;
          if (axios && axios.defaults && axios.defaults.headers) {
            axios.defaults.headers.common['X-CSRF-TOKEN'] = token;
          }
        } catch (e) {
          // Ignore errors accessing window.axios (cross-origin issues)
        }
      }
    } catch (e) {
      // Ignore errors accessing window
    }
  }
}