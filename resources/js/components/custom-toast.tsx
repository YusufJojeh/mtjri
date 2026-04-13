import { Toaster } from '@/components/ui/sonner';
import { toast as sonnerToast } from 'sonner';
import { router } from '@inertiajs/react';

const isDemoMode = (): boolean => {
  // Check both window.isDemo and page props for demo mode
  return (window as any).isDemo || (window as any).page?.props?.is_demo || false;
};

const sonnerToastWrapper = (message: string | React.ReactNode, options?: any) => {
  if (typeof message === 'object' && message !== null && 'title' in (message as any)) {
    const { title, description, ...rest } = message as any;
    return sonnerToast(title, { description, ...rest });
  }
  return sonnerToast(message, options);
};

export const toast = Object.assign(sonnerToastWrapper, sonnerToast, {
  success: (message: string, options?: any) => {
    return sonnerToast.success(message, { duration: 5000, ...options });
  },
  error: (message: string, options?: any) => {
    return sonnerToast.error(message, { duration: 6000, ...options });
  },
  loading: (message: string, options?: any) => {
    if (isDemoMode() && (message.includes('Delet') || message.includes('Updat') || message.includes('Reset') || message.includes('Modif') || message.includes('Activ') || message.includes('Deactiv'))) {
      return;
    }
    return sonnerToast.loading(message, options);
  },
});

export const CustomToast = () => {
    return <Toaster position='top-right' duration={5000} richColors closeButton />;
};
