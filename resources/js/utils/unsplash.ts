import { UnsplashImageData } from '@/utils/image-helper';

const triggeredDownloads: { [key: string]: boolean } = {};

export async function triggerUnsplashDownload(imageData: UnsplashImageData | null | undefined, appName: string): Promise<void> {
  if (!imageData || !imageData.download_location || !imageData.unsplash_id) {
    return;
  }

  const cacheKey = `${imageData.unsplash_id}-${appName}`;

  if (triggeredDownloads[cacheKey]) {
    console.log(`Unsplash download for ${imageData.unsplash_id} already triggered recently.`);
    return;
  }

  try {
    const response = await fetch('/api/unsplash/trigger-download', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
      },
      body: JSON.stringify({
        download_location: imageData.download_location,
        unsplash_id: imageData.unsplash_id,
        app_name: appName,
      }),
    });

    if (response.ok) {
      console.log(`Unsplash download triggered successfully for ${imageData.unsplash_id}`);
      triggeredDownloads[cacheKey] = true;
    } else {
      console.error(`Failed to trigger Unsplash download for ${imageData.unsplash_id}:`, await response.json());
    }
  } catch (error) {
    console.error(`Error triggering Unsplash download for ${imageData.unsplash_id}:`, error);
  }
}

export function isUnsplashImage(image: string | UnsplashImageData | null | undefined): image is UnsplashImageData {
  return typeof image === 'object' && image !== null && 'unsplash_id' in image && 'download_location' in image;
}

export function getUnsplashAttributionData(image: UnsplashImageData | null | undefined, appName: string) {
  if (!isUnsplashImage(image)) {
    return null;
  }
  return {
    photographerName: image.photographer_name,
    photographerUsername: image.photographer_username,
    photoPageUrl: image.photo_page_url,
    appName: appName,
  };
}

