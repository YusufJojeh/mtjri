# Translation Import Template Structure

## Article JSON Structure

Each translated article must follow this structure:

```json
{
  "slug": "article-slug",           // MUST match English version
  "title": "Translated Title",       // REQUIRED - translate this
  "category": "category-name",        // MUST match English version
  "description": "Translated desc",  // REQUIRED - translate this
  "content": "<h1>HTML...</h1>",     // REQUIRED - translate HTML content
  "meta_description": "Meta...",     // REQUIRED - translate this
  "order": 1,                         // MUST match English version
  "updated_at": "2026-01-11",        // Set to translation date
  "reading_time": 3                   // Should match or adjust
}
```

## Translation Guidelines

1. **slug**: Keep exactly as English (do not translate)
2. **category**: Keep exactly as English (do not translate)
3. **title**: Translate to target language
4. **description**: Translate to target language
5. **content**: Translate HTML content, preserve all HTML tags and structure
6. **meta_description**: Translate to target language (150-160 chars ideal)
7. **order**: Keep exactly as English
8. **updated_at**: Set to translation completion date
9. **reading_time**: Keep or adjust based on language

## Categories and Articles

### account-settings

Total articles: 6

| Slug | Title (EN) | Description (EN) |
|------|------------|------------------|
| company-settings | Company Settings | Learn how to configure company information, branding, and ac |
| language-settings | Language Settings | Learn how to configure language preferences for your account |
| notification-settings | Notification Settings | Learn how to configure email, SMS, and push notifications to |
| roles-permissions | Roles & Permissions | Learn how to create custom roles, assign permissions, and co |
| security-settings | Security Settings | Learn how to configure security settings, enable two-factor  |
| ... | ... (1 more) | ... |

### advanced-features

Total articles: 8

| Slug | Title (EN) | Description (EN) |
|------|------------|------------------|
| ai-content-generation | AI Content Generation | Learn how to use AI-powered content generation to create pro |
| analytics-reports | Analytics & Reports | Learn how to use analytics and reports to track store perfor |
| api-integrations | API Integrations | Learn how to integrate Matjrii with third-party services usi |
| custom-domain-setup | Custom Domain Setup | Complete guide to setting up a custom domain for your store, |
| multi-language-stores | Multi-Language Stores | Learn how to create multi-language stores, translate content |
| ... | ... (3 more) | ... |

### content-design

Total articles: 4

| Slug | Title (EN) | Description (EN) |
|------|------------|------------------|
| custom-pages | Custom Pages | Learn how to create custom pages for your store, including A |
| seo-settings | SEO Settings | Complete guide to SEO settings for improving your store's se |
| store-themes-overview | Store Themes Overview | Overview of all available store themes in Matjrii, including |
| theme-customization | Theme Customization | Learn how to customize your store theme, including colors, f |

### getting-started

Total articles: 6

| Slug | Title (EN) | Description (EN) |
|------|------------|------------------|
| account-creation | Account Creation & Registration | Step-by-step guide to creating your Matjrii account and comp |
| dashboard-overview | Dashboard Overview | Learn how to navigate the Matjrii dashboard and understand i |
| first-store-setup | Creating Your First Store | Complete guide to setting up your first online store in Matj |
| introduction | Introduction to Matjrii | Learn about Matjrii, a comprehensive multi-store e-commerce  |
| platform-navigation | Platform Navigation Guide | Learn how to navigate the Matjrii platform, understand the d |
| ... | ... (1 more) | ... |

### marketing-sales

Total articles: 6

| Slug | Title (EN) | Description (EN) |
|------|------------|------------------|
| coupon-system | Coupon System | Learn how to create and manage discount coupons, promotional |
| customer-engagement | Customer Engagement | Learn strategies and tools for engaging customers, building  |
| express-checkout | Express Checkout | Learn how to set up and use express checkout options like on |
| newsletter-management | Newsletter Management | Learn how to manage newsletter subscribers, send email campa |
| promotions-discounts | Promotions & Discounts | Learn how to create promotional campaigns, flash sales, seas |
| ... | ... (1 more) | ... |

### orders-customers

Total articles: 5

| Slug | Title (EN) | Description (EN) |
|------|------------|------------------|
| customer-accounts | Customer Accounts Management | Learn how to manage customer accounts, enable guest checkout |
| customer-management | Customer Management | Learn how to manage customers, view customer profiles, and t |
| order-management | Order Management | Learn how to manage customer orders, update order status, an |
| order-processing-workflow | Order Processing Workflow | Complete guide to processing orders from receipt to fulfillm |
| order-tracking | Order Tracking | Learn how to track orders, add tracking numbers, and provide |

### payment-checkout

Total articles: 5

| Slug | Title (EN) | Description (EN) |
|------|------------|------------------|
| checkout-process | Checkout Process | Learn about the checkout process and how customers complete  |
| order-payments | Order Payments Management | Learn how to manage order payments, process refunds, handle  |
| payment-configuration | Payment Configuration | Learn how to configure payment gateways, set up payment meth |
| payment-gateway-setup | Payment Gateway Setup | Learn how to configure payment gateways in Matjrii to accept |
| payment-methods-overview | Payment Methods Overview | Overview of all available payment methods in Matjrii, includ |

### product-management

Total articles: 7

| Slug | Title (EN) | Description (EN) |
|------|------------|------------------|
| adding-products | Adding Products to Your Store | Learn how to add products to your Matjrii store with detaile |
| bulk-product-operations | Bulk Product Operations | Learn how to perform bulk operations on multiple products at |
| inventory-management | Inventory Management | Learn how to track inventory, set stock levels, and manage p |
| product-attributes | Product Attributes | Learn how to define and use product attributes to organize a |
| product-images-media | Product Images & Media | Learn how to upload, manage, and optimize product images for |
| ... | ... (2 more) | ... |

### store-management

Total articles: 7

| Slug | Title (EN) | Description (EN) |
|------|------------|------------------|
| creating-store | Creating Your First Store | Step-by-step guide to creating your first online store in Ma |
| store-content-management | Store Content Management | Learn how to manage store content including homepage section |
| store-customization | Store Customization | Learn how to customize your store's appearance, branding, an |
| store-domain-setup | Custom Domain Setup | Learn how to set up a custom domain for your store, includin |
| store-seo-settings | Store SEO Settings | Configure SEO settings to improve your store's visibility in |
| ... | ... (2 more) | ... |

### troubleshooting

Total articles: 6

| Slug | Title (EN) | Description (EN) |
|------|------------|------------------|
| common-issues | Common Issues and Solutions | Solutions to common issues you might encounter while using M |
| contact-support | Contact Support | Learn how to contact Matjrii support, get help with issues,  |
| payment-issues | Payment Issues | Common payment issues and solutions, including failed paymen |
| product-import-issues | Product Import Issues | Common product import problems and solutions, including CSV  |
| store-setup-issues | Store Setup Issues | Troubleshoot common store setup issues including theme probl |
| ... | ... (1 more) | ... |

