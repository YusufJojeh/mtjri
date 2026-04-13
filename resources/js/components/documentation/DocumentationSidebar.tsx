import React, { useState } from 'react';
import { Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
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
  ChevronDown,
  ChevronRight,
  BookOpen,
  Search
} from 'lucide-react';

interface Category {
  key: string;
  name: string;
  icon: string;
  articles: Array<{
    slug: string;
    title: string;
    category: string;
  }>;
  count: number;
}

interface DocumentationSidebarProps {
  categories: Category[];
  currentArticle?: {
    slug: string;
    category: string;
  };
  primaryColor?: string;
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

export default function DocumentationSidebar({
  categories,
  currentArticle,
  primaryColor = '#3b82f6',
}: DocumentationSidebarProps) {
  const { t, i18n } = useTranslation();

  // Get current frontend language
  const currentLang = i18n.language || 'en';

  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(() => {
    // Open the current article's category by default
    if (currentArticle?.category) {
      return { [currentArticle.category]: true };
    }
    return { 'getting-started': true };
  });
  const [searchQuery, setSearchQuery] = useState('');

  const toggleCategory = (categoryKey: string) => {
    setOpenCategories(prev => ({
      ...prev,
      [categoryKey]: !prev[categoryKey],
    }));
  };

  // Filter categories and articles based on search
  const filteredCategories = categories.map(category => {
    const filteredArticles = category.articles.filter(article =>
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.slug.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return {
      ...category,
      articles: filteredArticles,
    };
  }).filter(category => category.articles.length > 0 || !searchQuery);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      {/* Home Link */}
      <Link
        href={route('documentation.index') + `?locale=${currentLang}`}
        className="flex items-center gap-2 px-3 py-2 mb-4 rounded-md hover:bg-gray-50 transition-colors group"
        style={{
          backgroundColor: !currentArticle ? `${primaryColor}10` : 'transparent',
          color: !currentArticle ? primaryColor : 'inherit',
        }}
      >
        <BookOpen className="h-5 w-5" />
        <span className="font-medium">{t('documentation.navigation.home', 'Documentation Home')}</span>
      </Link>

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder={t('documentation.navigation.search', 'Search documentation...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-offset-0 focus:outline-none text-sm"
            style={{
              focusRingColor: primaryColor,
            }}
          />
        </div>
      </div>

      {/* Categories */}
      <nav className="space-y-1">
        {filteredCategories.map((category) => {
          const IconComponent = iconMap[category.icon] || BookOpen;
          const isOpen = openCategories[category.key];
          const isActiveCategory = currentArticle?.category === category.key;

          return (
            <div key={category.key} className="mb-2">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category.key)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-gray-50 transition-colors group ${
                  isActiveCategory ? 'bg-gray-50' : ''
                }`}
                style={{
                  color: isActiveCategory ? primaryColor : 'inherit',
                }}
              >
                <div className="flex items-center gap-2">
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  )}
                  <IconComponent className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {t(`documentation.categories.${category.key}`, category.name)}
                  </span>
                  <span className="text-xs text-gray-500 ml-1">({category.count})</span>
                </div>
              </button>

              {/* Category Articles */}
              {isOpen && (
                <div className="ml-6 mt-1 space-y-1">
                  {category.articles.map((article) => {
                    const isActive = currentArticle?.slug === article.slug;
                    return (
                      <Link
                        key={article.slug}
                        href={route('documentation.show', article.slug) + `?locale=${currentLang}`}
                        className={`block px-3 py-1.5 rounded-md text-sm transition-colors ${
                          isActive
                            ? 'font-medium'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                        style={{
                          backgroundColor: isActive ? `${primaryColor}10` : 'transparent',
                          color: isActive ? primaryColor : 'inherit',
                        }}
                      >
                        {article.title}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* No Results */}
      {searchQuery && filteredCategories.length === 0 && (
        <div className="text-center py-8 text-gray-500 text-sm">
          {t('documentation.noResults', 'No articles found')}
        </div>
      )}
    </div>
  );
}

