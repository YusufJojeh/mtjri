<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\File;
use App\Models\LandingPageSetting;
use App\Models\LandingPageCustomPage;

class DocumentationController extends Controller
{
    /**
     * Get documentation articles organized by category
     */
    private function getDocumentationArticles($locale = 'en')
    {
        $docsPath = resource_path("docs/{$locale}");
        
        if (!File::exists($docsPath)) {
            // Fallback to English if locale doesn't exist
            $docsPath = resource_path("docs/en");
        }
        
        if (!File::exists($docsPath)) {
            return [];
        }
        
        $categories = [];
        $directories = File::directories($docsPath);
        
        foreach ($directories as $directory) {
            $categoryName = basename($directory);
            $articles = [];
            
            $files = File::files($directory);
            foreach ($files as $file) {
                if ($file->getExtension() === 'json') {
                    $content = json_decode(File::get($file->getPathname()), true);
                    if ($content) {
                        $articles[] = $content;
                    }
                }
            }
            
            // Sort articles by order
            usort($articles, function($a, $b) {
                return ($a['order'] ?? 999) <=> ($b['order'] ?? 999);
            });
            
            if (!empty($articles)) {
                $categories[$categoryName] = $articles;
            }
        }
        
        return $categories;
    }
    
    /**
     * Get a single documentation article
     */
    private function getDocumentationArticle($slug, $locale = 'en')
    {
        $docsPath = resource_path("docs/{$locale}");
        
        if (!File::exists($docsPath)) {
            $docsPath = resource_path("docs/en");
        }
        
        if (!File::exists($docsPath)) {
            return null;
        }
        
        // Search through all category directories
        $directories = File::directories($docsPath);
        
        foreach ($directories as $directory) {
            $filePath = $directory . '/' . $slug . '.json';
            
            if (File::exists($filePath)) {
                $content = json_decode(File::get($filePath), true);
                if ($content) {
                    return $content;
                }
            }
        }
        
        return null;
    }
    
    /**
     * Get category information
     */
    private function getCategoryInfo($category)
    {
        $categoryMap = [
            'getting-started' => ['name' => 'Getting Started', 'icon' => 'rocket'],
            'store-management' => ['name' => 'Store Management', 'icon' => 'store'],
            'product-management' => ['name' => 'Product Management', 'icon' => 'package'],
            'orders-customers' => ['name' => 'Orders & Customers', 'icon' => 'shopping-cart'],
            'payment-checkout' => ['name' => 'Payment & Checkout', 'icon' => 'credit-card'],
            'content-design' => ['name' => 'Content & Design', 'icon' => 'palette'],
            'marketing-sales' => ['name' => 'Marketing & Sales', 'icon' => 'trending-up'],
            'advanced-features' => ['name' => 'Advanced Features', 'icon' => 'settings'],
            'account-settings' => ['name' => 'Account & Settings', 'icon' => 'user'],
            'troubleshooting' => ['name' => 'Troubleshooting', 'icon' => 'help-circle'],
        ];
        
        return $categoryMap[$category] ?? ['name' => ucfirst(str_replace('-', ' ', $category)), 'icon' => 'file'];
    }
    
    /**
     * Get all articles for navigation
     */
    private function getAllArticles($locale = 'en')
    {
        $categories = $this->getDocumentationArticles($locale);
        $allArticles = [];
        
        foreach ($categories as $category => $articles) {
            foreach ($articles as $article) {
                $allArticles[] = [
                    'slug' => $article['slug'],
                    'title' => $article['title'],
                    'category' => $category,
                    'categoryInfo' => $this->getCategoryInfo($category),
                ];
            }
        }
        
        return $allArticles;
    }
    
    /**
     * Get previous and next articles
     */
    private function getAdjacentArticles($currentSlug, $currentCategory, $locale = 'en')
    {
        $allArticles = $this->getAllArticles($locale);
        $previous = null;
        $next = null;
        $found = false;
        
        foreach ($allArticles as $index => $article) {
            if ($article['slug'] === $currentSlug && $article['category'] === $currentCategory) {
                $found = true;
                
                // Get previous article
                if ($index > 0) {
                    $previous = $allArticles[$index - 1];
                }
                
                // Get next article
                if ($index < count($allArticles) - 1) {
                    $next = $allArticles[$index + 1];
                }
                
                break;
            }
        }
        
        return ['previous' => $previous, 'next' => $next];
    }
    
    /**
     * Display documentation index page
     */
    public function index(Request $request)
    {
        $locale = $request->get('locale', app()->getLocale());
        
        // Normalize locale (e.g., zh-CN -> zh-CN, but zh -> en if not exists)
        $availableLocales = ['en', 'ar', 'es', 'da', 'de', 'fr', 'it', 'ja', 'nl', 'pl', 'pt', 'pt-BR', 'ru', 'tr', 'zh', 'he', 'fa', 'et', 'id', 'ro', 'th', 'zh-CN', 'zh-TW'];
        
        if (!in_array($locale, $availableLocales)) {
            $locale = 'en';
        }
        
        $categories = $this->getDocumentationArticles($locale);
        $allArticles = $this->getAllArticles($locale);
        
        // Get landing page settings for header/footer
        $landingSettings = LandingPageSetting::getSettings();
        
        // Organize categories with metadata
        $organizedCategories = [];
        foreach ($categories as $category => $articles) {
            $categoryInfo = $this->getCategoryInfo($category);
            $organizedCategories[] = [
                'key' => $category,
                'name' => $categoryInfo['name'],
                'icon' => $categoryInfo['icon'],
                'articles' => $articles,
                'count' => count($articles),
            ];
        }
        
        return Inertia::render('documentation/index', [
            'categories' => $organizedCategories,
            'allArticles' => $allArticles,
            'locale' => $locale,
            'settings' => $landingSettings,
            'customPages' => LandingPageCustomPage::active()->ordered()->get() ?? [],
        ]);
    }
    
    /**
     * Display a single documentation article
     */
    public function show(Request $request, $slug)
    {
        $locale = $request->get('locale', app()->getLocale());
        
        // Normalize locale
        $availableLocales = ['en', 'ar', 'es', 'da', 'de', 'fr', 'it', 'ja', 'nl', 'pl', 'pt', 'pt-BR', 'ru', 'tr', 'zh', 'he', 'fa', 'et', 'id', 'ro', 'th', 'zh-CN', 'zh-TW'];
        
        if (!in_array($locale, $availableLocales)) {
            $locale = 'en';
        }
        
        $article = $this->getDocumentationArticle($slug, $locale);
        
        if (!$article) {
            abort(404, 'Documentation article not found');
        }
        
        $categories = $this->getDocumentationArticles($locale);
        $allArticles = $this->getAllArticles($locale);
        $adjacent = $this->getAdjacentArticles($slug, $article['category'], $locale);
        
        // Get landing page settings for header/footer
        $landingSettings = LandingPageSetting::getSettings();
        
        // Organize categories with metadata
        $organizedCategories = [];
        foreach ($categories as $category => $articles) {
            $categoryInfo = $this->getCategoryInfo($category);
            $organizedCategories[] = [
                'key' => $category,
                'name' => $categoryInfo['name'],
                'icon' => $categoryInfo['icon'],
                'articles' => $articles,
                'count' => count($articles),
            ];
        }
        
        return Inertia::render('documentation/show', [
            'article' => $article,
            'categories' => $organizedCategories,
            'allArticles' => $allArticles,
            'previous' => $adjacent['previous'],
            'next' => $adjacent['next'],
            'locale' => $locale,
            'settings' => $landingSettings,
            'customPages' => LandingPageCustomPage::active()->ordered()->get() ?? [],
        ]);
    }
}

