import React from 'react';
import StoreLayout from '@/layouts/StoreLayout';
import type { Store } from '@/types/store';
import { Head } from '@inertiajs/react';
import storeTheme from '@/config/store-theme';
import { getThemeComponents } from '@/config/theme-registry';
import { WishlistProvider } from '@/contexts/WishlistContext';
import { CartProvider } from '@/contexts/CartContext';
import { useStoreFavicon } from '@/hooks/use-store-favicon';

interface StoreHomepageProps {
  store?: Store | Record<string, any>;
  storeContent?: Record<string, any>;
  storeSettings?: Record<string, any>;
  currencies?: Array<{ code: string; symbol: string; name?: string }>;
  theme?: string;
  categories?: Array<{ id: number; name: string; [key: string]: any }>;
  featuredProducts?: any[];
  trendingProducts?: any[];
  blogPosts?: any[];
  customPages?: Array<{ id: number; name: string; href: string }>;
  cartCount?: number;
  wishlistCount?: number;
  isLoggedIn?: boolean;
  baseUrl?: string;
}

export default function StoreHomepage({ store = {} as Store, storeContent = {}, storeSettings = {}, currencies = [], theme = 'default', categories = [], featuredProducts = [], trendingProducts = [], blogPosts = [], customPages = [], cartCount = 0, wishlistCount = 0, isLoggedIn = false, baseUrl = '' }: StoreHomepageProps) {
  useStoreFavicon();
  
  const content = (storeContent && Object.keys(storeContent).length > 0) ? storeContent as any : storeTheme as any;
  const actualTheme = store?.theme || theme;
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
  
  return (
    <>
      <Head title={`${store.name || storeTheme.store.name} - Store`} />
      
      <CartProvider storeId={store.id || 0} isLoggedIn={!!isLoggedIn}>
        <WishlistProvider>
          <StoreLayout
            storeName={store.name || content.store?.name || storeTheme.store.name}
            logo={store.logo || content.store?.logo || storeTheme.store.logo}
            cartCount={cartCount}
            wishlistCount={wishlistCount}
            isLoggedIn={isLoggedIn}
            customPages={customPages}
            storeId={store.id}
            storeContent={content}
            customFooter={<Footer storeName={store.name || storeTheme.store.name} logo={store.logo || storeTheme.store.logo} content={content.footer} />}
          >
            <HeroSection content={content.hero} baseUrl={baseUrl} />
            <CategorySection categories={categories} content={content.categories} />
            <FeaturedProductsSection products={featuredProducts} content={content.featured_products} storeSettings={storeSettings} currencies={currencies} />
            {InfoBoxesSection && <InfoBoxesSection content={content.info_boxes} storeSettings={storeSettings} currencies={currencies} />}
            {CTASection && <CTASection content={content.cta_section} ctaBoxes={content.cta_section?.cta_boxes || content.cta_boxes} bottomSection={content.cta_section?.cta_bottom_section || content.cta_bottom_section || content.cta_section?.cta_bottom || content.cta_bottom} />}
            <TrendingProductsSection products={trendingProducts} content={content.trending_products} stats={content.trending_stats} designProcess={content.design_process} storeSettings={storeSettings} currencies={currencies} />
            <BrandLogoSlider content={{...content.brand_logos, stats: content.brand_logos?.stats || content.stats_section?.stats}} />
            <NewsletterSection content={content.newsletter} />
            <BlogSection posts={blogPosts} content={content.blog} storeSlug={store.slug || ''} />
          </StoreLayout>
        </WishlistProvider>
      </CartProvider>
    </>
  );
}