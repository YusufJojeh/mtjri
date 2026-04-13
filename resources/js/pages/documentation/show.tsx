import React, { useRef } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import DocumentationLayout from '@/components/documentation/DocumentationLayout';
import { resolvePublicBrandColors } from '@/lib/public-brand';
import { ArrowLeft, ArrowRight, Calendar, Clock } from 'lucide-react';
import { sanitizeHtml } from '@/utils/sanitize';

interface Article {
  slug: string;
  title: string;
  category: string;
  content: string;
  meta_description?: string;
  order: number;
  updated_at?: string;
  reading_time?: number;
}

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

interface PageProps {
  article: Article;
  categories: Category[];
  allArticles: Array<{
    slug: string;
    title: string;
    category: string;
  }>;
  previous?: {
    slug: string;
    title: string;
    category: string;
  };
  next?: {
    slug: string;
    title: string;
    category: string;
  };
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

export default function DocumentationShow({
  article,
  categories,
  allArticles,
  previous,
  next,
  locale,
  settings,
  customPages = [],
}: PageProps) {
  const { t, i18n } = useTranslation();
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

  const [tableOfContents, setTableOfContents] = React.useState<Array<{ id: string; text: string; level: number }>>([]);
  const [processedContent, setProcessedContent] = React.useState<string>('');

  React.useEffect(() => {
    // Process content and add IDs to headings
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = article.content;
    
    const headings = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const toc: Array<{ id: string; text: string; level: number }> = [];
    
    headings.forEach((heading, index) => {
      const id = `heading-${index}`;
      heading.id = id;
      toc.push({
        id,
        text: heading.textContent || '',
        level: parseInt(heading.tagName.charAt(1)),
      });
    });
    
    setTableOfContents(toc);
    setProcessedContent(tempDiv.innerHTML);

    // After content is rendered, add IDs to actual DOM headings
    const timer = setTimeout(() => {
      const renderedHeadings = document.querySelectorAll('.prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6');
      renderedHeadings.forEach((heading, index) => {
        if (!heading.id) {
          heading.id = `heading-${index}`;
        }
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [article.content]);

  // Scroll to heading when clicking TOC
  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(locale, { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch {
      return dateString;
    }
  };

  const category = categories.find(c => c.key === article.category);

  return (
    <>
      <Head 
        title={`${article.title} - ${t('documentation.title', 'Documentation')}`}
        meta={[
          {
            name: 'description',
            content: article.meta_description || article.title,
          },
        ]}
      />
      
      <DocumentationLayout
        categories={categories}
        customPages={customPages}
        currentArticle={{
          slug: article.slug,
          category: article.category,
        }}
        settings={settings}
      >
        <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur-sm md:p-10">
        {/* Breadcrumbs */}
        <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm text-slate-600">
          <Link
            href={route('documentation.index') + `?locale=${currentLang}`}
            className="transition-colors hover:text-slate-900"
          >
            {t('documentation.navigation.home', 'Documentation')}
          </Link>
          <span>/</span>
          {category && (
            <>
              <span>{t(`documentation.categories.${category.key}`, category.name)}</span>
              <span>/</span>
            </>
          )}
          <span className="font-medium text-slate-900">{article.title}</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <article className="flex-1 min-w-0">
            {/* Article Header */}
            <header className="mb-8">
              {category && (
                <div className="mb-4">
                  <span 
                    className="text-xs font-medium px-3 py-1 rounded-full inline-block"
                    style={{ 
                      backgroundColor: `${primaryColor}10`,
                      color: primaryColor 
                    }}
                  >
                    {t(`documentation.categories.${category.key}`, category.name)}
                  </span>
                </div>
              )}
              <h1 className="mb-4 text-4xl font-bold tracking-tight text-slate-900">
                {article.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                {article.updated_at && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{t('documentation.updated', 'Updated')}: {formatDate(article.updated_at)}</span>
                  </div>
                )}
                {article.reading_time && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{article.reading_time} {t('documentation.minRead', 'min read')}</span>
                  </div>
                )}
              </div>
            </header>

            {/* Article Content */}
            <div
              className="doc-prose-content prose prose-lg max-w-none prose-headings:font-bold prose-headings:text-slate-900 prose-p:text-slate-700 prose-p:leading-relaxed prose-strong:text-slate-900 prose-ul:text-slate-700 prose-ol:text-slate-700 prose-li:text-slate-700 prose-code:rounded prose-code:bg-slate-100 prose-code:px-1 prose-code:py-0.5 prose-code:text-slate-900 prose-pre:bg-slate-900 prose-pre:text-slate-100"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(processedContent || article.content || '') }}
            />

            {/* Navigation */}
            <div className="mt-12 border-t border-slate-200 pt-8">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {previous && (
                  <Link
                    href={route('documentation.show', previous.slug) + `?locale=${currentLang}`}
                    className="group rounded-xl border border-slate-200/90 p-4 transition-all hover:border-slate-300 hover:shadow-md"
                  >
                    <div className="mb-2 flex items-center gap-2 text-sm text-slate-600">
                      <ArrowLeft className="h-4 w-4" />
                      <span>{t('documentation.previous', 'Previous')}</span>
                    </div>
                    <div className="font-semibold text-slate-900 transition-colors group-hover:underline">
                      {previous.title}
                    </div>
                  </Link>
                )}
                {next && (
                  <Link
                    href={route('documentation.show', next.slug) + `?locale=${currentLang}`}
                    className="group rounded-xl border border-slate-200/90 p-4 transition-all hover:border-slate-300 hover:shadow-md md:text-right"
                  >
                    <div className="mb-2 flex items-center gap-2 text-sm text-slate-600 md:justify-end">
                      <span>{t('documentation.next', 'Next')}</span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                    <div className="font-semibold text-slate-900 transition-colors group-hover:underline">
                      {next.title}
                    </div>
                  </Link>
                )}
              </div>
            </div>
          </article>

          {/* Table of Contents */}
          {tableOfContents.length > 0 && (
            <aside className="hidden w-64 flex-shrink-0 lg:block">
              <div className="sticky top-24 rounded-xl border border-slate-200/80 bg-white/95 p-4 shadow-sm backdrop-blur-sm">
                <h3 className="mb-4 font-semibold text-slate-900">
                  {t('documentation.tableOfContents', 'Table of Contents')}
                </h3>
                <nav className="space-y-2">
                  {tableOfContents.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => scrollToHeading(item.id)}
                      className={`public-focus-ring block w-full rounded-md text-left text-sm transition-colors hover:opacity-90 ${
                        item.level === 1 ? 'font-medium text-slate-900' : 
                        item.level === 2 ? 'pl-4 text-slate-700' : 
                        'pl-8 text-slate-600'
                      }`}
                      style={{ ['--tw-ring-color' as string]: primaryColor }}
                    >
                      {item.text}
                    </button>
                  ))}
                </nav>
              </div>
            </aside>
          )}
        </div>
        </div>
      </DocumentationLayout>
    </>
  );
}

