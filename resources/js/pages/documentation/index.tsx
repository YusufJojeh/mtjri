import React, { useState, useRef } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import DocumentationLayout from '@/components/documentation/DocumentationLayout';
import { resolvePublicBrandColors } from '@/lib/public-brand';
import { 
  Rocket, 
  Store, 
  Package, 
  ShoppingCart, 
  CreditCard, 
  Palette, 
  TrendingUp, 
  Settings, 
  User, 
  HelpCircle,
  BookOpen,
  Search,
  ArrowRight
} from 'lucide-react';

interface Category {
  key: string;
  name: string;
  icon: string;
  articles: Array<{
    slug: string;
    title: string;
    description?: string;
    category: string;
  }>;
  count: number;
}

interface PageProps {
  categories: Category[];
  allArticles: Array<{
    slug: string;
    title: string;
    category: string;
  }>;
  locale: string;
  settings: {
    company_name: string;
    config_sections?: {
      colors?: {
        primary?: string;
        secondary?: string;
        accent?: string;
      };
    };
    [key: string]: any;
  };
  customPages?: Array<{ id: number; title: string; slug: string }>;
}

const iconMap: Record<string, any> = {
  rocket: Rocket,
  store: Store,
  package: Package,
  'shopping-cart': ShoppingCart,
  'credit-card': CreditCard,
  palette: Palette,
  'trending-up': TrendingUp,
  settings: Settings,
  user: User,
  'help-circle': HelpCircle,
  'file': BookOpen,
};

export default function DocumentationIndex({
  categories,
  allArticles,
  locale,
  settings,
  customPages = [],
}: PageProps) {
  const { t, i18n } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const redirectingRef = useRef(false);

  // Get current frontend language
  const currentLang = i18n.language || locale || 'en';

  // Sync locale parameter with frontend language if they don't match
  // Only redirect if URL locale doesn't match current language (avoid redirect loops)
  React.useEffect(() => {
    // Prevent redirect loops
    if (redirectingRef.current) {
      return;
    }

    // Skip if i18n is not ready yet
    if (!i18n.language) {
      return;
    }

    // Get current URL locale parameter (read fresh each time)
    const urlParams = new URLSearchParams(window.location.search);
    const urlLocale = urlParams.get('locale');

    // Only redirect if URL locale parameter doesn't match current language
    // This prevents forcing Arabic when user changes to another language
    if (urlLocale && urlLocale !== currentLang) {
      // URL locale doesn't match current language - update URL to match current language
      redirectingRef.current = true;
      router.get(window.location.pathname, { locale: currentLang }, {
        preserveState: true,
        preserveScroll: true,
        onFinish: () => {
          redirectingRef.current = false;
        }
      });
    } else if (!urlLocale && currentLang && currentLang !== 'ar') {
      // No locale in URL but user has selected a non-Arabic language - add it to URL
      // Only add if it's not Arabic to avoid unnecessary redirects
      redirectingRef.current = true;
      router.get(window.location.pathname, { locale: currentLang }, {
        preserveState: true,
        preserveScroll: true,
        onFinish: () => {
          redirectingRef.current = false;
        }
      });
    }
    // Don't redirect if:
    // - URL locale matches current language (already in sync)
    // - No URL locale and current language is Arabic (default, no need to add to URL)
    // - We're already redirecting (prevent loops)
    // - i18n is not ready yet
  }, [currentLang, i18n.language]);

  const { primary: primaryColor } = resolvePublicBrandColors(settings);

  // Filter categories and articles based on search
  const filteredCategories = categories.map(category => {
    const filteredArticles = category.articles.filter(article =>
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (article.description && article.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return {
      ...category,
      articles: filteredArticles,
    };
  }).filter(category => category.articles.length > 0 || !searchQuery);

  const filteredAllArticles = allArticles.filter(article =>
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Head title={t('documentation.title', 'Documentation')} />
      
      <DocumentationLayout categories={categories} settings={settings} customPages={customPages}>
        {/* Hero Section */}
        <div className="mb-10 rounded-2xl border border-slate-200/80 bg-white/90 p-8 shadow-sm backdrop-blur-sm md:p-10">
          <div className="mb-4 flex items-center gap-3">
            <BookOpen className="h-8 w-8" style={{ color: primaryColor }} />
            <h1 className="text-4xl font-bold tracking-tight text-slate-900">
              {t('documentation.title', 'Documentation')}
            </h1>
          </div>
          <p className="max-w-3xl text-lg leading-relaxed text-slate-600">
            {t('documentation.description', 'Learn how to use Tijraa to create and manage your online stores. Find guides, tutorials, and answers to common questions.')}
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder={t('documentation.navigation.search', 'Search documentation...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="public-focus-ring w-full rounded-xl border-2 border-slate-200 bg-white/90 py-3 pl-12 pr-4 text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0"
              style={{
                borderColor: searchQuery ? primaryColor : undefined,
                ['--tw-ring-color' as string]: primaryColor,
              }}
            />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mb-12 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200/80 bg-white/90 p-4 shadow-sm backdrop-blur-sm">
            <div className="text-2xl font-bold text-slate-900">{categories.length}</div>
            <div className="mt-1 text-sm text-slate-600">
              {t('documentation.stats.categories', 'Categories')}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200/80 bg-white/90 p-4 shadow-sm backdrop-blur-sm">
            <div className="text-2xl font-bold text-slate-900">{allArticles.length}</div>
            <div className="mt-1 text-sm text-slate-600">
              {t('documentation.stats.articles', 'Articles')}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200/80 bg-white/90 p-4 shadow-sm backdrop-blur-sm">
            <div className="text-2xl font-bold text-slate-900">{filteredAllArticles.length}</div>
            <div className="mt-1 text-sm text-slate-600">
              {searchQuery ? t('documentation.stats.results', 'Results') : t('documentation.stats.total', 'Total Articles')}
            </div>
          </div>
        </div>

        {/* Categories Grid */}
        {!searchQuery && (
          <div className="space-y-12">
            {filteredCategories.map((category) => {
              const IconComponent = iconMap[category.icon] || BookOpen;
              
              return (
                <div
                  key={category.key}
                  className="rounded-2xl border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur-sm"
                >
                  {/* Category Header */}
                  <div className="flex items-center gap-3 mb-6">
                    <div 
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: `${primaryColor}10` }}
                    >
                      <IconComponent className="h-6 w-6" style={{ color: primaryColor }} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">
                        {t(`documentation.categories.${category.key}`, category.name)}
                      </h2>
                      <p className="mt-1 text-sm text-slate-600">
                        {category.count} {t('documentation.articles', 'articles')}
                      </p>
                    </div>
                  </div>

                  {/* Articles Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {category.articles.map((article) => (
                      <Link
                        key={article.slug}
                        href={route('documentation.show', article.slug) + `?locale=${currentLang}`}
                        className="group rounded-xl border border-slate-200/90 p-4 transition-all hover:border-slate-300 hover:shadow-md"
                      >
                        <h3 className="mb-2 font-semibold text-slate-900 transition-colors decoration-slate-900/30 group-hover:underline">
                          {article.title}
                        </h3>
                        {article.description && (
                          <p className="mb-3 line-clamp-2 text-sm text-slate-600">
                            {article.description}
                          </p>
                        )}
                        <div className="flex items-center text-sm font-medium group-hover:translate-x-1 transition-transform" style={{ color: primaryColor }}>
                          {t('documentation.readMore', 'Read more')}
                          <ArrowRight className="h-4 w-4 ml-1" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Search Results */}
        {searchQuery && (
          <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur-sm">
            <h2 className="mb-6 text-2xl font-bold text-slate-900">
              {t('documentation.searchResults', 'Search Results')} ({filteredAllArticles.length})
            </h2>
            
            {filteredAllArticles.length > 0 ? (
              <div className="space-y-4">
                {filteredAllArticles.map((article) => {
                  const category = categories.find(c => c.key === article.category);
                  
                  return (
                    <Link
                      key={article.slug}
                      href={route('documentation.show', article.slug) + `?locale=${currentLang}`}
                      className="group block rounded-xl border border-slate-200/90 p-4 transition-all hover:border-slate-300 hover:shadow-md"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {category && (
                              <span 
                                className="text-xs font-medium px-2 py-1 rounded"
                                style={{ 
                                  backgroundColor: `${primaryColor}10`,
                                  color: primaryColor 
                                }}
                              >
                                {t(`documentation.categories.${category.key}`, category.name)}
                              </span>
                            )}
                          </div>
                          <h3 className="mb-1 font-semibold text-slate-900 transition-colors group-hover:underline">
                            {article.title}
                          </h3>
                        </div>
                        <ArrowRight className="h-5 w-5 text-slate-400 transition-colors group-hover:text-slate-600" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">
                  {t('documentation.noResults', 'No articles found')}
                </p>
                <p className="text-sm">
                  {t('documentation.tryDifferent', 'Try different keywords or browse categories above')}
                </p>
              </div>
            )}
          </div>
        )}
      </DocumentationLayout>
    </>
  );
}

