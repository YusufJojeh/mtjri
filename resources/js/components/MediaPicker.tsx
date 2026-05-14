import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import MediaLibraryModal from './MediaLibraryModal';
import { Image as ImageIcon, X } from 'lucide-react';
import { getImageUrl } from '@/utils/image-helper';

interface MediaPickerProps {
  label?: string;
  value?: string;
  onChange: (value: string) => void;
  multiple?: boolean;
  placeholder?: string;
  showPreview?: boolean;
}

export default function MediaPicker({ 
  label, 
  value = '', 
  onChange, 
  multiple = false,
  placeholder = 'Select image...',
  showPreview = true
}: MediaPickerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSelect = (selectedUrl: string) => {
    // Convert absolute URL to relative path before storing
    const relativePath = convertToRelativePath(selectedUrl);
    onChange(relativePath);
  };

  const getAllowedHosts = (): Set<string> => {
    const hosts = new Set(['localhost', '127.0.0.1', '::1']);

    try {
      if (typeof window !== 'undefined' && window.location?.hostname) {
        hosts.add(window.location.hostname.toLowerCase());
      }

      const page = (window as any)?.page;
      const baseUrl = page?.props?.globalSettings?.base_url || page?.props?.base_url;
      if (baseUrl) {
        hosts.add(new URL(baseUrl, window.location.origin).hostname.toLowerCase());
      }
    } catch (e) {
      // Ignore host discovery errors
    }

    return hosts;
  };
  
  // Function to convert absolute URL to relative path
  const convertToRelativePath = (url: string): string => {
    if (!url) return '';
    
    if (url.startsWith('/')) {
      return url.replace(/\/{2,}/g, '/');
    }

    try {
      const parsed = new URL(url);
      const allowedHosts = getAllowedHosts();

      if (!allowedHosts.has(parsed.hostname)) {
        return '';
      }

      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    } catch {
      // Fall through to the regex-based extraction below.
    }
    
    // Extract the path after /storage from the full URL
    const storagePattern = /(\/(?:storage|media)\/.*)$/;
    const matches = url.match(storagePattern);
    
    if (matches && matches[0]) {
      return matches[0]; // Return /storage/path/to/file.jpg
    }
    
    return url.startsWith('storage/') ? `/${url}` : '';
  };
  
  // Function to convert relative path to full URL for display
  const getFullUrl = (path: string): string => {
    return getImageUrl(path);
  };

  const handleClear = () => {
    onChange('');
  };

  const imageUrls = value ? value.split(',').filter(Boolean) : [];

  return (
    <div className='space-y-2'>
      {label && <Label>{label}</Label>}
      
      <div className='flex gap-2'>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          readOnly={multiple}
        />
        <Button
          type='button'
          variant='outline'
          onClick={() => setIsModalOpen(true)}
        >
          <ImageIcon className='h-4 w-4 mr-2' />
          Browse
        </Button>
        {value && (
          <Button
            type='button'
            variant='outline'
            size='icon'
            onClick={handleClear}
          >
            <X className='h-4 w-4' />
          </Button>
        )}
      </div>

      {/* Preview */}
      {showPreview && imageUrls.length > 0 && (
        <div className='grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2'>
          {imageUrls.map((url, index) => (
            <div key={index} className='relative'>
              <img
                src={getFullUrl(url)}
                alt={`Preview ${index + 1}`}
                className='w-full h-20 object-cover rounded border'
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgNzBMMTMwIDEwMEgxMTBWMTMwSDkwVjEwMEg3MEwxMDAgNzBaIiBmaWxsPSIjOUI5QkEwIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTUwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOUI5QkEwIiBmb250LXNpemU9IjEyIj5JbWFnZSBub3QgZm91bmQ8L3RleHQ+Cjwvc3ZnPgo=';
                }}
              />
            </div>
          ))}
        </div>
      )}

      <MediaLibraryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleSelect}
        multiple={multiple}
      />
    </div>
  );
}
