import React, { useState, useEffect, useRef } from 'react';
import { useForm } from '@inertiajs/react';
import { PageTemplate } from '@/components/page-template';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Save, ArrowLeft, Plus, Trash2, RefreshCw } from 'lucide-react';
import { toast } from '@/components/custom-toast';
import { useTranslation } from 'react-i18next';
import { router } from '@inertiajs/react';
import MediaLibraryButton from '@/components/MediaLibraryButton';
import { getImageUrl } from '@/utils/image-helper';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import axios from 'axios';
import { getThemeComponents } from '@/config/theme-registry';
import { CartProvider } from '@/contexts/CartContext';
import { WishlistProvider } from '@/contexts/WishlistContext';
import StoreLayout from '@/layouts/StoreLayout';

interface Store {
  id: number;
  name: string;
  logo?: string;
  slug?: string;
}

interface Props {
  store: Store;
  settings: Record<string, any>;
  theme?: string;
  contentGenerationStatus?: string;
  contentGeneratedAt?: string;
  // Preview data props
  categories?: Array<any>;
  featuredProducts?: Array<any>;
  trendingProducts?: Array<any>;
  blogPosts?: Array<any>;
  storeSettings?: Record<string, any>;
  currencies?: Array<any>;
}

export default function StoreContentEdit({
  store,
  settings,
  theme = 'default',
  contentGenerationStatus: initialStatus,
  contentGeneratedAt: initialGeneratedAt,
  categories = [],
  featuredProducts = [],
  trendingProducts = [],
  blogPosts = [],
  storeSettings = {},
  currencies = []
}: Props) {
  const { t } = useTranslation();

  // Ensure all data is always an array (safety check for Inertia serialization)
  const safeCategories = Array.isArray(categories) ? categories : [];
  const safeFeaturedProducts = Array.isArray(featuredProducts) ? featuredProducts : [];
  const safeTrendingProducts = Array.isArray(trendingProducts) ? trendingProducts : [];
  const safeBlogPosts = Array.isArray(blogPosts) ? blogPosts : [];
  const safeCurrencies = Array.isArray(currencies) ? currencies : [];
  const safeStoreSettings = storeSettings && typeof storeSettings === 'object' ? storeSettings : {};

  const getSectionTabs = () => {
    const sections = Object.keys(settings || {});
    const sectionTabs = sections.map(sectionKey => ({
      key: sectionKey,
      label: sectionKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      sections: [sectionKey]
    }));

    // Add a Preview Settings tab if not present
    if (!sections.includes('preview_settings')) {
      sectionTabs.push({
        key: 'preview_settings',
        label: t('Preview Settings'),
        sections: ['preview_settings']
      });
    }

    return sectionTabs;
  };

  const tabs = getSectionTabs();
  const [contentGenerationStatus, setContentGenerationStatus] = useState(initialStatus || 'completed');
  const [contentGeneratedAt, setContentGeneratedAt] = useState(initialGeneratedAt);
  const [activeTabKey, setActiveTabKey] = useState(tabs[0]?.key);
  const [previewMode, setPreviewMode] = useState<'tab' | 'full'>('tab'); // 'tab' or 'full'

  // Scroll to top of preview when header tab is selected
  useEffect(() => {
    if (activeTabKey === 'header') {
      const previewContainer = document.querySelector('.preview-container');
      if (previewContainer) {
        previewContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [activeTabKey]);
  const [regenerationProgress, setRegenerationProgress] = useState<number>(0);
  const [regenerationStep, setRegenerationStep] = useState<string>('');
  const [regenerationError, setRegenerationError] = useState<{ code: string; message: string } | null>(null);
  const [currentRegeneratingSection, setCurrentRegeneratingSection] = useState<string | null>(null);
  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const loadingToastIdRef = useRef<string | number | null>(null);
  const previousStatusRef = useRef<string>(initialStatus || 'completed');
  const isInitialMountRef = useRef<boolean>(true);
  const [showFailedMessage, setShowFailedMessage] = useState(false);

  const isGenerating = contentGenerationStatus === 'pending' || contentGenerationStatus === 'processing' || currentRegeneratingSection !== null;

  // Check if we have actual content to display (not just empty or preview_settings only)
  const hasContent = settings && Object.keys(settings).length > 0 &&
    Object.keys(settings).some(key => key !== 'preview_settings' && settings[key] &&
      (typeof settings[key] === 'object' ? Object.keys(settings[key]).length > 0 : true));

  const { data, setData, put, processing } = useForm({
    content: {
      ...settings,
      preview_settings: settings.preview_settings || {
        use_custom_image: false,
        custom_preview_image: ''
      }
    },
    theme: theme
  });

  // Track status changes to show failed message only when status changes from pending/processing to failed
  // Don't show on initial load if status is already 'failed'
  useEffect(() => {
    const previousStatus = previousStatusRef.current;
    const currentStatus = contentGenerationStatus;
    const isInitialMount = isInitialMountRef.current;

    // On initial mount, never show the message (even if status is 'failed')
    if (isInitialMount) {
      isInitialMountRef.current = false;
      setShowFailedMessage(false);
      previousStatusRef.current = currentStatus;
      return;
    }

    // Only show failed message if status changed from pending/processing to failed
    // This ensures we don't show it on initial page load
    if ((previousStatus === 'pending' || previousStatus === 'processing') && currentStatus === 'failed') {
      setShowFailedMessage(true);
    } else {
      setShowFailedMessage(false);
    }

    previousStatusRef.current = currentStatus;
  }, [contentGenerationStatus]);

  useEffect(() => {
    if (contentGenerationStatus === 'pending' || contentGenerationStatus === 'processing') {
      const interval = setInterval(() => {
        // Poll backend to check content generation status
        router.reload({
          only: ['settings', 'contentGenerationStatus', 'contentGeneratedAt'],
          onSuccess: (page) => {
            const newStatus = (page.props as any).contentGenerationStatus;
            const newGeneratedAt = (page.props as any).contentGeneratedAt;
            const newSettings = (page.props as any).settings;

            // Always update settings if available, even if status hasn't changed
            if (newSettings && Object.keys(newSettings).length > 0) {
              setData('content', {
                ...newSettings,
                preview_settings: newSettings.preview_settings || data.content.preview_settings || {
                  use_custom_image: false,
                  custom_preview_image: ''
                }
              });
            }

            if (newStatus && newStatus !== contentGenerationStatus) {
              setContentGenerationStatus(newStatus);
              setContentGeneratedAt(newGeneratedAt);

              if (newStatus === 'completed') {
                if (newSettings && Object.keys(newSettings).length > 0) {
                  setData('content', {
                    ...newSettings,
                    preview_settings: newSettings.preview_settings || data.content.preview_settings || {
                      use_custom_image: false,
                      custom_preview_image: ''
                    }
                  });
                }
                toast(t('Content Generation Complete'), {
                  description: t('Your store content has been successfully generated.'),
                });
              } else if (newStatus === 'failed') {
                setShowFailedMessage(true);
                toast.error(t('Content Generation Failed'), {
                  description: t('Failed to generate custom content. Default content will be used.'),
                });
              }
            }
          },
          onError: () => {
            // Continue polling even on error
            console.error('Error polling content status');
          }
        });
      }, 3000); // Poll every 3 seconds for faster updates

      return () => clearInterval(interval);
    }
  }, [contentGenerationStatus, data.content.preview_settings]);

  const updateNestedField = (path: string[], value: any) => {
    const newContent = { ...data.content };
    let current: Record<string, any> = newContent as Record<string, any>;

    for (let i = 0; i < path.length - 1; i++) {
      if (!current[path[i]]) current[path[i]] = {};
      current = current[path[i]] as Record<string, any>;
    }

    current[path[path.length - 1]] = value;
    setData('content', newContent as typeof data.content);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    put(route('stores.content.update', store.id));
  };

  // Cleanup polling and toast on unmount
  useEffect(() => {
    return () => {
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
        pollTimeoutRef.current = null;
      }
      if (loadingToastIdRef.current) {
        toast.dismiss(loadingToastIdRef.current);
        loadingToastIdRef.current = null;
      }
    };
  }, []);

  const pollJobStatus = async (jobId: string, sectionKey: string, initialDelay: number = 2000) => {
    let currentDelay = initialDelay;
    let pollCount = 0;
    const maxInterval = 15000;

    const poll = async () => {
      try {
        const response = await axios.get<any>(
          route('stores.content.regeneration-status', { storeId: store.id, jobId })
        );

        const status = response.data.status;
        const progress = response.data.progress ?? 0;
        const step = response.data.current_step ?? '';
        const errorCode = response.data.error_code;
        const errorMessage = response.data.error_message;
        const content = response.data.content;

        // Update progress state
        setRegenerationProgress(progress);
        setRegenerationStep(step);

        if (status === 'completed') {
          // Dismiss loading toast
          if (loadingToastIdRef.current) {
            toast.dismiss(loadingToastIdRef.current);
            loadingToastIdRef.current = null;
          }

          // Job completed successfully
          if (content) {
            setData('content', { ...data.content, [sectionKey]: content });
          } else {
            // Reload settings from server to get latest content
            router.reload({
              only: ['settings'],
              onSuccess: (page) => {
                const newSettings = (page.props as any).settings;
                if (newSettings && newSettings[sectionKey]) {
                  setData('content', {
                    ...data.content,
                    [sectionKey]: newSettings[sectionKey]
                  });
                }
              }
            });
          }

          setContentGenerationStatus('completed');
          setCurrentRegeneratingSection(null);
          setRegenerationProgress(100);
          setRegenerationError(null);

          toast.success(t('Success'), {
            description: t('Content for {{section}} section regenerated successfully!', { section: sectionKey }),
          });

          // Stop polling
          if (pollTimeoutRef.current) {
            clearTimeout(pollTimeoutRef.current);
            pollTimeoutRef.current = null;
          }
        } else if (status === 'failed') {
          // Dismiss loading toast
          if (loadingToastIdRef.current) {
            toast.dismiss(loadingToastIdRef.current);
            loadingToastIdRef.current = null;
          }

          // Job failed
          setContentGenerationStatus('failed');
          setCurrentRegeneratingSection(null);
          setRegenerationProgress(0);

          // Store error details
          if (errorCode || errorMessage) {
            setRegenerationError({
              code: errorCode || 'GENERATION_FAILED',
              message: errorMessage || t('Failed to regenerate content.')
            });

            // Show user-friendly error message based on error code
            let userMessage = errorMessage || t('Failed to regenerate content for {{section}} section.', { section: sectionKey });

            if (errorCode === 'OPENAI_KEY_MISSING') {
              userMessage = t('OpenAI API key is not configured. Please configure it in settings.');
            } else if (errorCode === 'OPENAI_RATE_LIMIT') {
              userMessage = t('Rate limit exceeded. Please wait a moment and try again.');
            } else if (errorCode === 'TIMEOUT') {
              userMessage = t('Generation timed out. Please try again.');
            }

            toast.error(t('Error'), {
              description: userMessage,
            });
          } else {
            toast.error(t('Error'), {
              description: t('Failed to regenerate content for {{section}} section.', { section: sectionKey }),
            });
          }

          // Stop polling
          if (pollTimeoutRef.current) {
            clearTimeout(pollTimeoutRef.current);
            pollTimeoutRef.current = null;
          }
        } else if (status === 'processing' || status === 'pending') {
          // Still processing - continue polling with exponential backoff
          pollCount++;

          // Exponential backoff: start at 2s, then 5s, then 10s, max 15s
          if (pollCount <= 3) {
            currentDelay = 2000; // First 3 polls: 2 seconds
          } else if (pollCount <= 8) {
            currentDelay = 5000; // Next 5 polls: 5 seconds
          } else {
            currentDelay = Math.min(currentDelay + 1000, maxInterval); // Then increase by 1s up to 15s max
          }

          if (pollTimeoutRef.current) {
            clearTimeout(pollTimeoutRef.current);
          }
          pollTimeoutRef.current = setTimeout(() => {
            poll();
          }, currentDelay);
        }
      } catch (error: any) {
        console.error('Error polling job status:', error);

        // Continue polling on network errors, but increase delay
        pollCount++;
        currentDelay = Math.min(currentDelay * 1.5, maxInterval);

        if (pollTimeoutRef.current) {
          clearTimeout(pollTimeoutRef.current);
        }
        pollTimeoutRef.current = setTimeout(() => {
          poll();
        }, currentDelay);
      }
    };

    // Start polling after initial delay
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
    }
    pollTimeoutRef.current = setTimeout(() => {
      poll();
    }, initialDelay);
  };

  const handleRegenerate = async (sectionKey: string) => {
    // Clear any existing polling
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }

    // Reset state
    setCurrentRegeneratingSection(sectionKey);
    setContentGenerationStatus('processing');
    setRegenerationProgress(0);
    setRegenerationStep(t('Starting regeneration...'));
    setRegenerationError(null);

    // Dismiss any existing loading toast
    if (loadingToastIdRef.current) {
      toast.dismiss(loadingToastIdRef.current);
    }

    // Store the loading toast ID so we can dismiss it later
    const loadingToastId = toast.loading(t('Regenerating content...'), {
      description: t('Please wait while AI generates new content for {{section}} section.', { section: sectionKey }),
    });
    loadingToastIdRef.current = loadingToastId;

    try {
      const response = await axios.post(route('stores.content.regenerate-section', store.id), {
        section: sectionKey,
        theme: data.theme
      });

      if (response.data.success && response.data.job_id) {
        // Start polling for job status
        pollJobStatus(response.data.job_id, sectionKey, 2000);
      } else {
        // Dismiss loading toast on error
        if (loadingToastIdRef.current) {
          toast.dismiss(loadingToastIdRef.current);
          loadingToastIdRef.current = null;
        }
        setContentGenerationStatus('failed');
        setCurrentRegeneratingSection(null);
        toast.error(t('Error'), {
          description: response.data.message || t('Failed to start regeneration job.'),
        });
      }
    } catch (error: any) {
      // Dismiss loading toast on error
      if (loadingToastIdRef.current) {
        toast.dismiss(loadingToastIdRef.current);
        loadingToastIdRef.current = null;
      }
      setContentGenerationStatus('failed');
      setCurrentRegeneratingSection(null);
      setRegenerationError({
        code: 'NETWORK_ERROR',
        message: error.response?.data?.message || t('An error occurred while starting content regeneration.')
      });
      toast.error(t('Error'), {
        description: error.response?.data?.message || t('An error occurred during content regeneration.'),
      });
      console.error('Regeneration error:', error);
    }
  };


  const renderField = (key: string, value: any, path: string[] = []) => {
    const currentPath = [...path, key];
    const fieldId = currentPath.join('_');

    if (value === undefined) return null;
    if (value === null) value = '';

    // Boolean fields
    if (typeof value === 'boolean') {
      return (
        <div key={fieldId} className='flex items-center space-x-3'>
          <Switch
            id={fieldId}
            checked={value}
            onCheckedChange={(checked) => updateNestedField(currentPath, checked)}
            className='data-[state=checked]:bg-primary'
          />
          <Label htmlFor={fieldId} className='text-sm font-medium leading-none cursor-pointer'>
            {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </Label>
        </div>
      );
    }

    // String fields
    if (typeof value === 'string') {
      const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      // Check if this is an image field based on key name, value content, or if it from theme config with type 'image'
      const isImage = key.includes('image') || key.includes('logo') ||
                     (typeof value === 'string' && value.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i)) ||
                     (typeof value === 'string' && value.includes('unsplash.com'));
      const isLongText = !isImage && (value.length > 100 || key.includes('description') || key.includes('ubtitle'));

      return (
        <div key={fieldId} className='space-y-2.5'>
          <Label htmlFor={fieldId} className='text-sm font-bold text-foreground/90'>{label}</Label>
          {isLongText ? (
            <Textarea
              id={fieldId}
              value={value}
              onChange={(e) => updateNestedField(currentPath, e.target.value)}
              placeholder={t('Enter {{field}}', { field: label.toLowerCase() })}
              className='min-h-[100px] resize-none focus-visible:ring-primary shadow-sm'
            />
          ) : (
            <div className={isImage ? 'space-y-3' : ''}>
              <div className={isImage ? 'flex gap-2 items-center' : ''}>
                <Input
                  id={fieldId}
                  value={value}
                  onChange={(e) => updateNestedField(currentPath, e.target.value)}
                  placeholder={t('Enter {{field}}', { field: label.toLowerCase() })}
                  className='focus-visible:ring-primary shadow-sm'
                />
                {isImage && (
                  <MediaLibraryButton
                    onSelect={(url) => updateNestedField(currentPath, url)}
                    selectedUrl={value}
                  />
                )}
              </div>
              {isImage && value && (
                <div className='relative group w-fit'>
                  <img
                    key={value}
                    src={getImageUrl(value)}
                    alt={label}
                    className='w-32 h-20 object-contain rounded-lg border-2 border-muted bg-white shadow-sm transition-transform group-hover:scale-105'
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    // Array fields
    if (Array.isArray(value)) {
      return (
        <div key={fieldId} className='space-y-4'>
          <div className='flex justify-between items-center'>
            <Label className='text-base font-medium'>
              {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Label>
            {(key !== 'info_boxes' || value.length < 3) && (
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() => {
                let newItem: Record<string, any> = {};
                if (value.length > 0) {
                  newItem = { ...value[0] };
                  Object.keys(newItem).forEach(k => {
                    if (typeof newItem[k] === 'string') newItem[k] = '';
                    if (typeof newItem[k] === 'boolean') newItem[k] = false;
                  });
                } else {
                  if (key === 'info_boxes') {
                    newItem = { icon: 'truck', title: 'New Feature', description: 'Description here' };
                  } else if (key === 'logos') {
                    newItem = { name: 'Brand Name', image: '/storage/brands/logo.png' };
                  } else if (key === 'links') {
                    newItem = { name: 'Link Name', href: '/page-url' };
                  } else if (key === 'social_links') {
                    newItem = { platform: 'facebook', url: 'https://facebook.com/yourpage' };
                  } else {
                    newItem = { title: 'New Item', description: 'Description' };
                  }
                }
                  updateNestedField(currentPath, [...value, newItem]);
                }}
              >
                <Plus className='h-4 w-4 mr-1' />
                {t('Add Item')}
              </Button>
            )}
          </div>
          {value.map((item: any, index: number) => (
            <div key={index} className='border rounded-lg p-4 space-y-3'>
              <div className='flex justify-between items-center'>
                <h4 className='font-medium'>{t('Item {{number}}', { number: index + 1 })}</h4>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => {
                    const newArray = value.filter((_: any, i: number) => i !== index);
                    updateNestedField(currentPath, newArray);
                  }}
                >
                  <Trash2 className='h-4 w-4' />
                </Button>
              </div>
              {key === 'social_links' ? (
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                  {Object.entries(item).filter(([itemKey]) => itemKey !== 'type' && itemKey !== 'max_items').map(([itemKey, itemValue]) =>
                    renderField(itemKey, itemValue, [...currentPath, index.toString()])
                  )}
                </div>
              ) : (
                <div className='grid grid-cols-1 gap-3'>
                  {Object.entries(item).filter(([itemKey]) => itemKey !== 'type' && itemKey !== 'max_items').map(([itemKey, itemValue]) =>
                    renderField(itemKey, itemValue, [...currentPath, index.toString()])
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      );
    }

    // Object fields
    if (typeof value === 'object' && value !== null) {
      return (
        <div key={fieldId} className='space-y-6 pt-6 border-t first:border-t-0 mt-6 first:mt-0'>
          <Label className='text-lg font-bold text-foreground flex items-center gap-2'>
            <span className='w-1.5 h-1.5 rounded-full bg-primary' />
            {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </Label>
          <div className='grid gap-6 pl-4 border-l-2 border-muted-foreground/10 ml-1'>
            {Object.entries(value).map(([subKey, subValue]) =>
              renderField(subKey, subValue, currentPath)
            )}
          </div>
        </div>
      );
    }

    return null;
  };

  const renderSection = (sectionKey: string, sectionData: any) => {
    const sectionTitle = sectionKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    return (
      <div key={sectionKey} className='space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl'>
        <div className='space-y-2'>
          <h2 className='text-4xl font-extrabold tracking-tight text-foreground'>{sectionTitle}</h2>
          <p className='text-muted-foreground text-base'>
            {t('Configure {{section}} content', { section: sectionTitle.toLowerCase() })}
          </p>
        </div>

        <div className='space-y-10 pt-4'>
          {Object.entries(sectionData).map(([key, value]) =>
            renderField(key, value, [sectionKey])
          )}
        </div>

        {sectionKey !== 'preview_settings' && (
          <div className='pt-10 space-y-4 border-t border-dashed'>
            {/* Progress indicator when regenerating this section */}
            {currentRegeneratingSection === sectionKey && (
              <Card className='bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'>
                <CardContent className='pt-6'>
                  <div className='space-y-3'>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-3'>
                        <RefreshCw className='h-5 w-5 text-blue-600 dark:text-blue-400 animate-spin' />
                        <div>
                          <p className='font-semibold text-blue-900 dark:text-blue-100'>
                            {t('Regenerating {{section}}...', { section: sectionKey.replace(/_/g, ' ') })}
                          </p>
                          {regenerationStep && (
                            <p className='text-sm text-blue-700 dark:text-blue-300'>{regenerationStep}</p>
                          )}
                        </div>
                      </div>
                      <span className='text-sm font-medium text-blue-900 dark:text-blue-100'>
                        {regenerationProgress}%
                      </span>
                    </div>
                    <div className='w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2'>
                      <div
                        className='bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-300'
                        style={{ width: `${regenerationProgress}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Error display */}
            {regenerationError && currentRegeneratingSection === sectionKey && (
              <Card className='bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'>
                <CardContent className='pt-6'>
                  <div className='space-y-3'>
                    <div className='flex items-start gap-3'>
                      <div className='flex-shrink-0 w-5 h-5 rounded-full bg-red-600 flex items-center justify-center mt-0.5'>
                        <span className='text-white text-xs font-bold'>!</span>
                      </div>
                      <div className='flex-1'>
                        <p className='font-semibold text-red-900 dark:text-red-100 mb-1'>
                          {t('Regeneration Failed')}
                        </p>
                        <p className='text-sm text-red-700 dark:text-red-300 mb-3'>
                          {regenerationError.message}
                        </p>
                        <Button
                          type='button'
                          variant='outline'
                          size='sm'
                          onClick={() => handleRegenerate(sectionKey)}
                          className='border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/40'
                        >
                          <RefreshCw className='h-4 w-4 mr-2' />
                          {t('Retry')}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className='flex gap-4'>
              <Button
                type='button'
                variant='outline'
                size='lg'
                onClick={() => handleRegenerate(sectionKey)}
                disabled={processing || isGenerating || currentRegeneratingSection === sectionKey}
                className='bg-background hover:bg-muted shadow-sm px-6'
              >
                <RefreshCw className={`h-5 w-5 mr-2 ${currentRegeneratingSection === sectionKey ? 'animate-spin' : ''}`} />
                {currentRegeneratingSection === sectionKey ? t('Regenerating...') : t('Regenerate')}
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const pageActions = [
    {
      label: t('Back'),
      icon: <ArrowLeft className='h-4 w-4 mr-2' />,
      variant: 'outline' as const,
      onClick: () => router.visit(route('stores.content.index')),
      className: 'px-6 py-5 rounded-lg shadow-sm font-semibold transition-all hover:bg-muted'
    },
    {
      label: processing || isGenerating ? t('Saving...') : t('Save Changes'),
      icon: <Save className='h-4 w-4 mr-2' />,
      variant: 'default' as const,
      onClick: (e?: React.MouseEvent | React.FormEvent) => {
        e?.preventDefault?.();
        handleSubmit(e as React.FormEvent);
      },
      disabled: processing || isGenerating,
      className: 'bg-primary hover:bg-primary/90 text-white shadow-md px-8 py-5 rounded-lg font-bold text-base transition-all hover:scale-[1.02] active:scale-[0.98]'
    }
  ];

  // Render preview using real React components
  const renderPreview = () => {
    const contentToPreview: Record<string, any> = data.content as Record<string, any>;
    if (!contentToPreview) {
      return (
        <div className='flex items-center justify-center min-h-[400px] text-muted-foreground'>
          <p>{t('No content to preview')}</p>
        </div>
      );
    }

    // Ensure header and footer are always included in contentToPreview for StoreLayout
    // StoreLayout will use content.header and content.footer automatically
    if (!contentToPreview.header) {
      contentToPreview.header = {};
    }
    if (!contentToPreview.footer) {
      contentToPreview.footer = {};
    }

    // Check for custom preview image
    if (contentToPreview.preview_settings?.use_custom_image && contentToPreview.preview_settings?.custom_preview_image) {
      const imageUrl = getImageUrl(contentToPreview.preview_settings.custom_preview_image);
      return (
        <div className='w-full'>
          <img src={imageUrl} alt='Custom Preview' className='w-full h-auto' />
        </div>
      );
    }

    // Get theme components
    const actualTheme = theme || 'default';
    const components = getThemeComponents(actualTheme);
    const {
      HeroSection,
      CategorySection,
      FeaturedProductsSection,
      NewsletterSection,
      TrendingProductsSection,
      BrandLogoSlider,
      InfoBoxesSection,
      CTASection,
      BlogSection,
      Footer
    } = components;

    // Use state-based active tab key or all sections for full page view
    const activeTab = tabs.find(t => t.key === activeTabKey) || tabs[0];
    // In full page mode, show all sections in the same order as real store page
    // In tab mode, show only active tab sections
    // Note: header and footer are always rendered by StoreLayout using storeContent.header and storeContent.footer
    // They don't need to be in activeSectionKeys to be displayed
    const allSectionsOrder = ['header', 'hero', 'categories', 'featured_products', 'info_boxes', 'cta_section', 'trending_products', 'brand_logos', 'newsletter', 'blog', 'footer'];
    const activeSectionKeys = previewMode === 'full'
      ? allSectionsOrder.filter(sectionKey => {
          // Only include sections that exist in the content and are not header/footer (they're always shown)
          // Header and footer are always rendered by StoreLayout, so we filter them out here
          return sectionKey !== 'header' && sectionKey !== 'footer' &&
                 contentToPreview[sectionKey] && tabs.some(tab => tab.sections.includes(sectionKey));
        })
      : (activeTab?.sections || []).filter(sectionKey => sectionKey !== 'header' && sectionKey !== 'footer');

    // Map section keys to component names
    const sectionComponentMap: Record<string, React.ComponentType<any> | null> = {
      'hero': HeroSection,
      'categories': CategorySection,
      'featured_products': FeaturedProductsSection,
      'trending_products': TrendingProductsSection,
      'newsletter': NewsletterSection,
      'info_boxes': InfoBoxesSection || null,
      'cta_section': CTASection || null,
      'blog': BlogSection,
      'brand_logos': BrandLogoSlider,
      'footer': Footer
    };

    const renderedSections = activeSectionKeys
      .map(sectionKey => {
        const sectionData = contentToPreview[sectionKey];
        if (!sectionData) return null;

        // Header and footer are always rendered by StoreLayout
        // But if the active tab is header or footer, we should still render something
        // to indicate that the preview is showing the header/footer
        if (sectionKey === 'header') {
          // Header is rendered by StoreLayout at the top
          // Return null here but header will be shown by StoreLayout
          return null;
        }

        if (sectionKey === 'footer') {
          // Footer is handled via customFooter prop
          // Return null here but footer will be shown by StoreLayout
          return null;
        }

        // Handle about section (generic rendering)
        if (sectionKey === 'about') {
          const imageUrl = sectionData.image && (typeof sectionData.image === 'string' ? sectionData.image : sectionData.image.url);
          return (
            <div key={sectionKey} className='py-8 sm:py-12 lg:py-16 px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row gap-8 lg:gap-12 items-center max-w-6xl mx-auto'>
              <div className='flex-1 w-full'>
                <h2 className='text-2xl sm:text-3xl font-bold text-slate-900 mb-4 sm:mb-6'>{sectionData.title || ''}</h2>
                <div className='text-slate-600 leading-relaxed text-base sm:text-lg whitespace-pre-wrap'>
                  {sectionData.content || sectionData.description || ''}
                </div>
              </div>
              {imageUrl && (
                <div className='flex-1 w-full'>
                  <img src={getImageUrl(sectionData.image)} alt='About' className='w-full h-auto rounded-xl shadow-lg' />
                </div>
              )}
            </div>
          );
        }

        // Handle features section (generic rendering)
        if (sectionKey === 'features') {
          const items = Array.isArray(sectionData.items) ? sectionData.items : [];
          return (
            <div key={sectionKey} className='py-8 sm:py-12 lg:py-16 px-4 sm:px-6 lg:px-8 bg-slate-50'>
              <div className='max-w-6xl mx-auto'>
                <h2 className='text-center text-2xl sm:text-3xl font-bold text-slate-900 mb-8 sm:mb-12'>{sectionData.title || ''}</h2>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8'>
                  {items.map((item: any, index: number) => (
                    <div key={index} className='p-4 sm:p-6 lg:p-8 rounded-xl bg-white shadow-md'>
                      <h3 className='text-lg sm:text-xl font-semibold text-slate-900 mb-2 sm:mb-4'>{item.title || ''}</h3>
                      {item.description && (
                        <p className='text-sm sm:text-base text-slate-600'>{item.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        }

        // Get the component for this section
        const SectionComponent = sectionComponentMap[sectionKey];

        if (!SectionComponent) {
          // Fallback for unknown sections
          return (
            <div key={sectionKey} className='py-8 sm:py-12 lg:py-16 px-4 sm:px-6 lg:px-8 border-t border-slate-200'>
              <div className='max-w-6xl mx-auto'>
                <h3 className='text-xs text-slate-500 uppercase tracking-wider mb-4'>
                  {sectionKey.replace(/_/g, ' ')}
                </h3>
                <div className='p-4 sm:p-6 bg-slate-100 rounded-lg text-slate-700 text-sm sm:text-base'>
                  {Object.entries(sectionData).map(([key, value]) => {
                    if (typeof value === 'string') {
                      return <p key={key} className='mb-2'><strong>{key.replace(/_/g, ' ')}:</strong> {value}</p>;
                    }
                    if (typeof value === 'boolean') {
                      return <p key={key} className='mb-2'><strong>{key.replace(/_/g, ' ')}:</strong> {value ? 'Yes' : 'No'}</p>;
                    }
                    return null;
                  })}
                </div>
              </div>
            </div>
          );
        }

        // Render the actual theme component with real data
        // Match exact props structure from real store page (resources/js/pages/store/index.tsx)
        const props: any = {};

        // Set props exactly as they are in the real store page
        if (sectionKey === 'hero') {
          props.content = sectionData;
          props.baseUrl = '';
        } else if (sectionKey === 'categories') {
          props.categories = safeCategories;
          props.content = sectionData;
        } else if (sectionKey === 'featured_products') {
          props.products = safeFeaturedProducts;
          props.content = sectionData;
          props.storeSettings = safeStoreSettings;
          props.currencies = safeCurrencies;
        } else if (sectionKey === 'trending_products') {
          props.products = safeTrendingProducts;
          props.content = sectionData;
          props.stats = (contentToPreview as any).trending_stats;
          props.designProcess = (contentToPreview as any).design_process;
          props.storeSettings = safeStoreSettings;
          props.currencies = safeCurrencies;
        } else if (sectionKey === 'info_boxes') {
          props.content = sectionData;
          props.storeSettings = safeStoreSettings;
          props.currencies = safeCurrencies;
        } else if (sectionKey === 'cta_section') {
          props.content = sectionData;
          props.ctaBoxes = sectionData?.cta_boxes || (contentToPreview as any).cta_boxes || [];
          props.bottomSection = sectionData?.cta_bottom_section || (contentToPreview as any).cta_bottom_section || sectionData?.cta_bottom || (contentToPreview as any).cta_bottom || null;
        } else if (sectionKey === 'blog') {
          props.posts = safeBlogPosts;
          props.content = sectionData;
          props.storeSlug = store.slug || store.name?.toLowerCase().replace(/\s+/g, '-') || '';
        } else if (sectionKey === 'brand_logos') {
          props.content = {
            ...sectionData,
            stats: sectionData?.stats || (contentToPreview as any).stats_section?.stats
          };
        } else if (sectionKey === 'newsletter') {
          props.content = sectionData;
        } else if (sectionKey === 'footer') {
          props.storeName = store.name;
          props.logo = store.logo || '';
          props.content = sectionData;
        } else {
          // Default: pass content prop for any other sections
          props.content = sectionData;
        }

        try {
          return <SectionComponent key={sectionKey} {...props} />;
        } catch (error) {
          console.error(`Error rendering ${sectionKey}:`, error);
          return (
            <div key={sectionKey} className='py-8 px-4 border-t border-red-200 bg-red-50'>
              <p className='text-red-600 text-sm'>Error rendering {sectionKey} section</p>
            </div>
          );
        }
      })
      .filter(Boolean);

    // Check if active tab is header or footer
    // If so, always show StoreLayout even if renderedSections is empty
    // because header/footer are rendered by StoreLayout itself
    const isHeaderOrFooterTab = activeTabKey === 'header' || activeTabKey === 'footer';
    
    // If no sections to render and not header/footer tab, show message
    if (renderedSections.length === 0 && !isHeaderOrFooterTab) {
      return (
        <div className='flex items-center justify-center min-h-[400px] text-muted-foreground'>
          <p>{t('No sections to preview for this tab')}</p>
        </div>
      );
    }

    // Use StoreLayout to render with real theme styles, just like the actual store page
    // StoreLayout will automatically render header with contentToPreview.header
    // and footer with contentToPreview.footer (or customFooter if provided)
    // Get Footer component for custom footer rendering (matching real store page)
    const FooterComponent = components.Footer;
    const hasFooterSection = (contentToPreview as any).footer && Object.keys((contentToPreview as any).footer).length > 0;

    // Ensure header and footer content are always passed to StoreLayout
    // StoreLayout will automatically render header with content.header
    // We pass footer as customFooter if it exists
    return (
      <StoreLayout
        storeName={store.name}
        logo={store.logo || ''}
        cartCount={0}
        wishlistCount={0}
        isLoggedIn={false}
        customPages={[]}
        storeId={store.id}
        storeContent={contentToPreview}
        theme={actualTheme}
        customFooter={hasFooterSection ? (
          <FooterComponent
            storeName={store.name}
            logo={store.logo || ''}
            content={(contentToPreview as any).footer}
          />
        ) : undefined}
      >
        {renderedSections}
      </StoreLayout>
    );
  };

  return (
    <>
    <PageTemplate
      title={t('Manage Content - {{storeName}}', { storeName: store.name })}
      url={`/stores/content/${store.id}`}
      actions={pageActions}
      breadcrumbs={[
        { title: 'Dashboard', href: route('dashboard') },
        { title: 'Store Management', href: route('stores.index') },
        { title: 'Store Content', href: route('stores.content.index') },
        { title: store.name }
      ]}
    >
      {showFailedMessage && !hasContent && (
        <div className='mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-red-800 dark:text-red-200'>
          {t('Content generation failed. Please try editing manually or contact support.')}
        </div>
      )}
      <form onSubmit={handleSubmit} className='space-y-8'>
        <Tabs value={activeTabKey} onValueChange={setActiveTabKey} className='w-full'>
          <div className='border-b mb-8'>
            <TabsList className='flex w-full overflow-x-auto scrollbar-hide justify-start bg-transparent p-0 h-auto gap-8'>
              {tabs.map(tab => (
                <TabsTrigger
                  key={tab.key}
                  value={tab.key}
                  disabled={isGenerating && !hasContent}
                  className='whitespace-nowrap px-0 py-4 bg-transparent border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary rounded-none shadow-none text-muted-foreground font-medium transition-all hover:text-foreground'
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {tabs.map(tab => (
            <TabsContent key={tab.key} value={tab.key} className='space-y-0 outline-none p-0 mt-0'>
              {isGenerating && !hasContent ? (
                <Card className='animate-pulse border-none shadow-none bg-muted/20'>
                  <CardHeader className='flex flex-row items-center justify-between'>
                    <div>
                      <CardTitle>{t('Generating Content...')}</CardTitle>
                      <CardDescription>{t('Your store content is being generated by AI. This may take a moment.')}</CardDescription>
                    </div>
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      onClick={() => {
                        // Reload page to get current content (even if generation is still in progress)
                        router.reload({
                          only: ['settings', 'contentGenerationStatus', 'contentGeneratedAt'],
                          onSuccess: (page) => {
                            const newSettings = (page.props as any).settings;
                            const newStatus = (page.props as any).contentGenerationStatus;

                            // Update content with whatever is available
                            if (newSettings && Object.keys(newSettings).length > 0) {
                              setData('content', {
                                ...newSettings,
                                preview_settings: newSettings.preview_settings || data.content.preview_settings || {
                                  use_custom_image: false,
                                  custom_preview_image: ''
                                }
                              });
                            }

                            // Set status to completed to show content
                            setContentGenerationStatus('completed');

                            toast(t('Content Loaded'), {
                              description: t('You can now edit the content manually.'),
                            });
                          }
                        });
                      }}
                    >
                      {t('Stop & Edit Manually')}
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className='h-32 bg-muted rounded-md'></div>
                    <div className='mt-4 space-y-2'>
                      <div className='h-4 bg-muted rounded-md w-3/4'></div>
                      <div className='h-4 bg-muted rounded-md'></div>
                      <div className='h-4 bg-muted rounded-md w-1/2'></div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 items-start'>
                  {isGenerating && hasContent && (
                    <div className='lg:col-span-2 mb-4'>
                      <Card className='bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'>
                        <CardContent className='pt-6'>
                          <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
                            <div className='flex items-center gap-3'>
                              <RefreshCw className='h-5 w-5 text-blue-600 dark:text-blue-400 animate-spin' />
                              <div>
                                <p className='font-semibold text-blue-900 dark:text-blue-100'>
                                  {t('Content Generation in Progress')}
                                </p>
                                <p className='text-sm text-blue-700 dark:text-blue-300'>
                                  {t('Your content is being updated. Changes will appear automatically.')}
                                </p>
                              </div>
                            </div>
                            <Button
                              type='button'
                              variant='outline'
                              size='sm'
                              onClick={() => {
                                router.reload({
                                  only: ['settings', 'contentGenerationStatus', 'contentGeneratedAt'],
                                  onSuccess: (page) => {
                                    const newSettings = (page.props as any).settings;
                                    if (newSettings && Object.keys(newSettings).length > 0) {
                                      setData('content', {
                                        ...newSettings,
                                        preview_settings: newSettings.preview_settings || data.content.preview_settings || {
                                          use_custom_image: false,
                                          custom_preview_image: ''
                                        }
                                      });
                                    }
                                    setContentGenerationStatus('completed');
                                  }
                                });
                              }}
                            >
                              {t('Stop Polling')}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                  <div className='space-y-4 sm:space-y-6 order-2 lg:order-1'>
                    {tab.sections.map(sectionKey => {
                      const content = data.content as Record<string, any>;
                      return content[sectionKey] ? renderSection(sectionKey, content[sectionKey]) : null;
                    })}
                  </div>

                  <div id='live-preview-section' className='lg:sticky lg:top-6 space-y-3 sm:space-y-4 order-1 lg:order-2'>
                    <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2'>
                      <div className='flex items-center gap-3'>
                        <h3 className='text-base sm:text-lg font-semibold'>{t('Live Preview')}</h3>
                        <div className='flex items-center gap-2 bg-muted rounded-lg p-1'>
                          <Button
                            type='button'
                            variant={previewMode === 'tab' ? 'default' : 'ghost'}
                            size='sm'
                            onClick={() => setPreviewMode('tab')}
                            className='h-7 px-3 text-xs'
                          >
                            {t('Tab View')}
                          </Button>
                          <Button
                            type='button'
                            variant={previewMode === 'full' ? 'default' : 'ghost'}
                            size='sm'
                            onClick={() => setPreviewMode('full')}
                            className='h-7 px-3 text-xs'
                          >
                            {t('Full Page')}
                          </Button>
                        </div>
                      </div>
                      {data.content.preview_settings?.use_custom_image && (
                        <Badge variant='outline' className='text-primary border-primary text-xs'>
                          {t('Custom Image')}
                        </Badge>
                      )}
                    </div>
                    <Card className='overflow-hidden border-2 border-primary/10 shadow-lg bg-white dark:bg-zinc-950'>
                      <div className='bg-muted/50 p-2 border-b flex items-center space-x-2'>
                        <div className='flex space-x-1.5 flex-shrink-0'>
                          <div className='w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-red-400'></div>
                          <div className='w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-yellow-400'></div>
                          <div className='w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-green-400'></div>
                        </div>
                        <div className='bg-background px-2 sm:px-3 py-0.5 rounded text-[9px] sm:text-[10px] text-muted-foreground flex-grow text-center truncate font-mono'>
                          {store.name.toLowerCase().replace(/\s+/g, '-')}.matjri.com
                        </div>
                      </div>
                      <div className='relative bg-white overflow-auto max-h-[500px] sm:max-h-[600px] lg:max-h-[700px] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100'>
                        <div className='preview-container min-h-[300px] sm:min-h-[400px] w-full'>
                          {renderPreview()}
                        </div>
                      </div>
                    </Card>
                    <p className='text-xs text-muted-foreground text-center italic px-2'>
                      {t('This is a real-time preview of your store content.')}
                    </p>
                  </div>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </form>

      {/* Spacing for mobile layout */}
      <div className='h-12 lg:hidden' />

      {/* Mobile Sticky Actions */}
      <div className='fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/80 backdrop-blur-md border-t md:hidden flex gap-2'>
        <Button
          className='flex-1 shadow-lg'
          onClick={handleSubmit}
          disabled={processing || isGenerating}
        >
          {processing || isGenerating ? <RefreshCw className='h-4 w-4 mr-2 animate-spin' /> : <Save className='h-4 w-4 mr-2' />}
          {t('Save')}
        </Button>
      </div>

      {/* Padding for sticky bar */}
      <div className='h-20 md:hidden' />
    </PageTemplate>
    </>
  );
}
