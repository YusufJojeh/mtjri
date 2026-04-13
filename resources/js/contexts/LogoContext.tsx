import { useBrand } from '@/contexts/BrandContext';

interface LogoContextType {
  logoLight: string;
  logoDark: string;
  favicon: string;
  updateLogos: (logos: { logoLight?: string; logoDark?: string; favicon?: string }) => void;
}

export const useLogos = (): LogoContextType => {
  const { logoLight, logoDark, favicon, updateBrandSettings } = useBrand();
  
  const updateLogos = (newLogos: { logoLight?: string; logoDark?: string; favicon?: string }) => {
    updateBrandSettings(newLogos);
  };
  
  return {
    logoLight,
    logoDark,
    favicon,
    updateLogos
  };
}