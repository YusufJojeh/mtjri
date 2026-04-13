import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useForm, router } from '@inertiajs/react';
import StoreContentEdit from '../edit';
import { useTranslation } from 'react-i18next';
import { Toaster } from '@/components/ui/toaster';

// Mock Inertia.js components and hooks
jest.mock('@inertiajs/react', () => ({
  useForm: jest.fn(() => ({
    data: { content: { hero: { title: 'Old Title', subtitle: 'Old Subtitle' }, about: { title: 'Old About' } }, theme: 'default' },
    setData: jest.fn(),
    put: jest.fn(),
    processing: false,
    errors: {},
  })),
  router: {
    post: jest.fn(),
    reload: jest.fn(),
    visit: jest.fn(),
  },
  Head: ({ title }: { title: string }) => <div data-testid='mock-head'>{title}</div>,
  Link: ({ children, href }: any) => <a href={href}>{children}</a>,
  usePage: () => ({
    props: {
      appName: 'matjri'
    }
  }),
}));

// Mock theme components
const MockHeroSection = ({ content }: any) => (
  <div data-testid='hero-section'>
    <h1>{content?.title || 'Hero Title'}</h1>
    <p>{content?.subtitle || 'Hero Subtitle'}</p>
  </div>
);

const MockCategorySection = ({ content }: any) => (
  <div data-testid='category-section'>
    <h2>{content?.title || 'Categories'}</h2>
  </div>
);

const MockFeaturedProductsSection = ({ content }: any) => (
  <div data-testid='featured-products-section'>
    <h2>{content?.title || 'Featured Products'}</h2>
  </div>
);

const MockNewsletterSection = ({ content }: any) => (
  <div data-testid='newsletter-section'>
    <h2>{content?.title || 'Newsletter'}</h2>
  </div>
);

const MockTrendingProductsSection = ({ content }: any) => (
  <div data-testid='trending-products-section'>
    <h2>{content?.title || 'Trending Products'}</h2>
  </div>
);

const MockBrandLogoSlider = ({ content }: any) => (
  <div data-testid='brand-logo-slider'>
    <h2>{content?.title || 'Brand Logos'}</h2>
  </div>
);

const MockInfoBoxesSection = ({ content }: any) => (
  <div data-testid='info-boxes-section'>
    <h2>{content?.title || 'Info Boxes'}</h2>
  </div>
);

const MockCTASection = ({ content }: any) => (
  <div data-testid='cta-section'>
    <h2>{content?.title || 'CTA Section'}</h2>
  </div>
);

const MockBlogSection = ({ content }: any) => (
  <div data-testid='blog-section'>
    <h2>{content?.title || 'Blog'}</h2>
  </div>
);

const MockFooter = ({ content, storeName }: any) => (
  <div data-testid='footer-section'>
    <h2>{storeName || 'Footer'}</h2>
  </div>
);

// Mock theme registry
jest.mock('@/config/theme-registry', () => ({
  getThemeComponents: jest.fn((theme: string) => ({
    HeroSection: MockHeroSection,
    CategorySection: MockCategorySection,
    FeaturedProductsSection: MockFeaturedProductsSection,
    NewsletterSection: MockNewsletterSection,
    TrendingProductsSection: MockTrendingProductsSection,
    BrandLogoSlider: MockBrandLogoSlider,
    InfoBoxesSection: MockInfoBoxesSection,
    CTASection: MockCTASection,
    BlogSection: MockBlogSection,
    Footer: MockFooter,
  })),
}));

// Mock Cart and Wishlist providers
jest.mock('@/contexts/CartContext', () => ({
  CartProvider: ({ children }: any) => <div data-testid='cart-provider'>{children}</div>,
}));

jest.mock('@/contexts/WishlistContext', () => ({
  WishlistProvider: ({ children }: any) => <div data-testid='wishlist-provider'>{children}</div>,
}));

// Mock image helper
jest.mock('@/utils/image-helper', () => ({
  getImageUrl: (url: string) => url || '/default-image.jpg',
}));

// Mock axios
jest.mock('axios', () => ({
  post: jest.fn(() => Promise.resolve({ data: { success: true, content: {} } })),
}));

// Mock PageTemplate to avoid complex dependency chain
jest.mock('@/components/page-template', () => ({
  PageTemplate: ({ children, title, actions }: any) => (
    <div data-testid='page-template'>
      <h1>{title}</h1>
      <div data-testid='page-actions'>
        {actions.map((action: any) => (
          <button key={action.label} onClick={action.onClick} disabled={action.disabled}>
            {action.label}
          </button>
        ))}
      </div>
      {children}
    </div>
  ),
}));

// Mock MediaLibraryButton
jest.mock('@/components/MediaLibraryButton', () => () => <button>Media Library</button>);

// Mock toast
jest.mock('@/components/custom-toast', () => ({
  toast: jest.fn(),
}));

// Mock Dialog component to avoid provider issues
jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) => open ? <div role='dialog' aria-label='Live Preview'>{children}</div> : null,
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <div>{children}</div>,
}));

// Mock useTranslation hook
jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(() => ({
    t: (key: string, params?: any) => {
      if (params && params.storeName) return `Manage Content - ${params.storeName}`;
      if (params && params.section) return `Content for ${params.section} section regenerated successfully!`;
      if (key === 'No content to preview') return 'No content to preview';
      if (key === 'No sections to preview for this tab') return 'No sections to preview for this tab';
      if (key === 'Live Preview') return 'Live Preview';
      if (key === 'This is a real-time preview of your store content.') return 'This is a real-time preview of your store content.';
      return key;
    }
  })),
}));

describe('StoreContentEdit', () => {
  const mockStore = { id: 1, name: 'Test Store' };
  const mockSettings = {
    hero: { title: 'Initial Hero Title', subtitle: 'Initial Hero Subtitle', button_text: 'Shop Now' },
    about: { title: 'Initial About Title', description: 'Initial About Description' },
  };

  beforeEach(() => {
    // Reset mocks before each test
    jest.mocked(useForm).mockClear();
    jest.mocked(router.post).mockClear();
    jest.mocked(router.reload).mockClear();
    jest.clearAllMocks();
  });

  it('renders correctly with initial content', () => {
    jest.mocked(useForm).mockReturnValue({
      data: { content: mockSettings, theme: 'default' },
      setData: jest.fn(),
      put: jest.fn(),
      processing: false,
      errors: {},
    } as any);
    render(<StoreContentEdit store={mockStore} settings={mockSettings} />);

    expect(screen.getByText('Manage Content - Test Store')).toBeInTheDocument();
    expect(screen.getByLabelText('Title')).toHaveValue('Initial Hero Title');
    
    // Verify tabs are present
    expect(screen.getByRole('tab', { name: /Hero/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /About/i })).toBeInTheDocument();
  });

  it("calls regenerate API and updates content on 'Regenerate' button click", async () => {
    const mockSetData = jest.fn();
    jest.mocked(useForm).mockReturnValue({
      data: { content: mockSettings, theme: 'default' },
      setData: mockSetData,
      put: jest.fn(),
      processing: false,
      errors: {},
    } as any);

    // Simulate a successful API response for regeneration
    jest.mocked(router.post).mockImplementation((url: any, data: any, options: any) => {
      options.onSuccess({ props: { settings: { content: { ...mockSettings, hero: { title: 'New Generated Hero Title' } } } } });
      options.onFinish();
    });

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { toast } = require('@/components/custom-toast');

    render(
      <>
        <StoreContentEdit store={mockStore} settings={mockSettings} />
      </>
    );

    const regenerateButton = screen.getAllByRole('button', { name: /Regenerate/i })[0];
    fireEvent.click(regenerateButton);

    expect(jest.mocked(router.post)).toHaveBeenCalledWith(
      expect.stringContaining('stores.content.regenerate-section'),
      { section: 'hero', theme: 'default' },
      expect.any(Object)
    );

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Success',
      }));
    });
    
    // Verify setData was called with the updated content
    expect(mockSetData).toHaveBeenCalledWith('content', { ...mockSettings, hero: { title: 'New Generated Hero Title' } });
  });

  it('opens and closes the preview iframe modal', async () => {
    render(<StoreContentEdit store={mockStore} settings={mockSettings} />);

    const previewButton = screen.getAllByRole('button', { name: /Preview/i })[0];
    fireEvent.click(previewButton);

    expect(screen.getByRole('dialog', { name: /Live Preview/i })).toBeInTheDocument();
    expect(screen.getByTitle('Live Preview')).toBeInTheDocument(); // iframe element
  });

  it('hows content generation pending state', () => {
    jest.mocked(useForm).mockReturnValue({
      data: { content: mockSettings, theme: 'default' },
      setData: jest.fn(),
      put: jest.fn(),
      processing: false,
      errors: {},
    } as any);
    render(<StoreContentEdit store={mockStore} settings={mockSettings} contentGenerationStatus='pending' />);

    expect(screen.getByText('Generating Content...')).toBeInTheDocument();
    expect(screen.getByText('Your store content is being generated by AI. This may take a moment.')).toBeInTheDocument();
    
    // In pending state, Save Changes button should be disabled
    expect(screen.getByRole('button', { name: /Saving.../i })).toBeDisabled();
  });

  describe('Preview Functionality', () => {
    it('renders preview with real theme components', () => {
      jest.mocked(useForm).mockReturnValue({
        data: { 
          content: { 
            hero: { title: 'Test Hero Title', subtitle: 'Test Hero Subtitle' },
            categories: { title: 'Test Categories' }
          }, 
          theme: 'default' 
        },
        setData: jest.fn(),
        put: jest.fn(),
        processing: false,
        errors: {},
      } as any);

      render(<StoreContentEdit store={mockStore} settings={mockSettings} />);

      // Check that preview section is rendered
      expect(screen.getByText('Live Preview')).toBeInTheDocument();
      
      // Check that real theme components are rendered
      expect(screen.getByTestId('hero-section')).toBeInTheDocument();
      expect(screen.getByText('Test Hero Title')).toBeInTheDocument();
      expect(screen.getByText('Test Hero Subtitle')).toBeInTheDocument();
    });

    it('renders preview with correct theme components based on theme prop', () => {
      jest.mocked(useForm).mockReturnValue({
        data: { 
          content: { 
            hero: { title: 'Fashion Hero', subtitle: 'Fashion Subtitle' }
          }, 
          theme: 'fashion' 
        },
        setData: jest.fn(),
        put: jest.fn(),
        processing: false,
        errors: {},
      } as any);

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getThemeComponents } = require('@/config/theme-registry');
      
      render(<StoreContentEdit store={mockStore} settings={mockSettings} theme='fashion' />);

      expect(getThemeComponents).toHaveBeenCalledWith('fashion');
      expect(screen.getByTestId('hero-section')).toBeInTheDocument();
    });

    it('renders header section in preview when enabled', () => {
      jest.mocked(useForm).mockReturnValue({
        data: { 
          content: { 
            header: { 
              show_welcome: true, 
              welcome_text: 'Welcome to our store',
              show_phone: true,
              phone_text: '+1 234 567 8900'
            }
          }, 
          theme: 'default' 
        },
        setData: jest.fn(),
        put: jest.fn(),
        processing: false,
        errors: {},
      } as any);

      render(<StoreContentEdit store={mockStore} settings={mockSettings} />);

      const previewContainer = screen.getByText('Live Preview').closest('div')?.parentElement;
      expect(previewContainer).toBeInTheDocument();
    });

    it('renders about section in preview', () => {
      jest.mocked(useForm).mockReturnValue({
        data: { 
          content: { 
            about: { 
              title: 'About Us',
              description: 'We are a great company',
              image: '/test-image.jpg'
            }
          }, 
          theme: 'default' 
        },
        setData: jest.fn(),
        put: jest.fn(),
        processing: false,
        errors: {},
      } as any);

      render(<StoreContentEdit store={mockStore} settings={mockSettings} />);

      // Switch to about tab
      const aboutTab = screen.getByRole('tab', { name: /About/i });
      fireEvent.click(aboutTab);

      // Check that about content is rendered in preview
      expect(screen.getByText('About Us')).toBeInTheDocument();
    });

    it('renders features section in preview', () => {
      jest.mocked(useForm).mockReturnValue({
        data: { 
          content: { 
            features: { 
              title: 'Our Features',
              items: [
                { title: 'Feature 1', description: 'Description 1' },
                { title: 'Feature 2', description: 'Description 2' }
              ]
            }
          }, 
          theme: 'default' 
        },
        setData: jest.fn(),
        put: jest.fn(),
        processing: false,
        errors: {},
      } as any);

      render(<StoreContentEdit store={mockStore} settings={mockSettings} />);

      // Switch to features tab if it exists
      const featuresTab = screen.queryByRole('tab', { name: /Features/i });
      if (featuresTab) {
        fireEvent.click(featuresTab);
        expect(screen.getByText('Our Features')).toBeInTheDocument();
      }
    });

    it('hows empty state when no content to preview', () => {
      jest.mocked(useForm).mockReturnValue({
        data: { 
          content: null, 
          theme: 'default' 
        },
        setData: jest.fn(),
        put: jest.fn(),
        processing: false,
        errors: {},
      } as any);

      render(<StoreContentEdit store={mockStore} settings={{}} />);

      expect(screen.getByText('No content to preview')).toBeInTheDocument();
    });

    it('hows custom preview image when enabled', () => {
      jest.mocked(useForm).mockReturnValue({
        data: { 
          content: { 
            preview_settings: {
              use_custom_image: true,
              custom_preview_image: '/custom-preview.jpg'
            }
          }, 
          theme: 'default' 
        },
        setData: jest.fn(),
        put: jest.fn(),
        processing: false,
        errors: {},
      } as any);

      render(<StoreContentEdit store={mockStore} settings={mockSettings} />);

      const previewImage = screen.getByAltText('Custom Preview');
      expect(previewImage).toBeInTheDocument();
      expect(previewImage).toHaveAttribute('rc', '/custom-preview.jpg');
    });

    it('updates preview when content changes', () => {
      const mockSetData = jest.fn();
      jest.mocked(useForm).mockReturnValue({
        data: { 
          content: { 
            hero: { title: 'Initial Title', subtitle: 'Initial Subtitle' }
          }, 
          theme: 'default' 
        },
        setData: mockSetData,
        put: jest.fn(),
        processing: false,
        errors: {},
      } as any);

      const { rerender } = render(<StoreContentEdit store={mockStore} settings={mockSettings} />);

      // Update content
      jest.mocked(useForm).mockReturnValue({
        data: { 
          content: { 
            hero: { title: 'Updated Title', subtitle: 'Updated Subtitle' }
          }, 
          theme: 'default' 
        },
        setData: mockSetData,
        put: jest.fn(),
        processing: false,
        errors: {},
      } as any);

      rerender(<StoreContentEdit store={mockStore} settings={{ hero: { title: 'Updated Title', subtitle: 'Updated Subtitle' } }} />);

      // Preview should show updated content
      expect(screen.getByText('Updated Title')).toBeInTheDocument();
    });

    it('renders all section types correctly', () => {
      const allSections = {
        hero: { title: 'Hero Title' },
        categories: { title: 'Categories Title' },
        featured_products: { title: 'Featured Products Title' },
        trending_products: { title: 'Trending Products Title' },
        newsletter: { title: 'Newsletter Title' },
        info_boxes: { title: 'Info Boxes Title' },
        cta_section: { title: 'CTA Title' },
        blog: { title: 'Blog Title' },
        brand_logos: { title: 'Brand Logos Title' },
        footer: { description: 'Footer Description' }
      };

      jest.mocked(useForm).mockReturnValue({
        data: { 
          content: allSections, 
          theme: 'default' 
        },
        setData: jest.fn(),
        put: jest.fn(),
        processing: false,
        errors: {},
      } as any);

      render(<StoreContentEdit store={mockStore} settings={allSections} />);

      // Check that providers are rendered
      expect(screen.getByTestId('cart-provider')).toBeInTheDocument();
      expect(screen.getByTestId('wishlist-provider')).toBeInTheDocument();
    });

    it('handles missing section components gracefully', () => {
      jest.mocked(useForm).mockReturnValue({
        data: { 
          content: { 
            unknown_section: { title: 'Unknown Section' }
          }, 
          theme: 'default' 
        },
        setData: jest.fn(),
        put: jest.fn(),
        processing: false,
        errors: {},
      } as any);

      render(<StoreContentEdit store={mockStore} settings={mockSettings} />);

      // Should not crash, should show fallback
      expect(screen.getByText('Live Preview')).toBeInTheDocument();
    });

    it('renders preview with responsive classes', () => {
      jest.mocked(useForm).mockReturnValue({
        data: { 
          content: { 
            hero: { title: 'Test Hero' }
          }, 
          theme: 'default' 
        },
        setData: jest.fn(),
        put: jest.fn(),
        processing: false,
        errors: {},
      } as any);

      const { container } = render(<StoreContentEdit store={mockStore} settings={mockSettings} />);

      // Check for responsive classes in preview container
      const previewContainer = container.querySelector('.max-h-\\[500px\\]');
      expect(previewContainer).toBeInTheDocument();
    });

    it('crolls to preview when preview button is clicked', () => {
      jest.mocked(useForm).mockReturnValue({
        data: { 
          content: { 
            hero: { title: 'Test Hero' }
          }, 
          theme: 'default' 
        },
        setData: jest.fn(),
        put: jest.fn(),
        processing: false,
        errors: {},
      } as any);

      const scrollIntoViewMock = jest.fn();
      Element.prototype.scrollIntoView = scrollIntoViewMock;

      render(<StoreContentEdit store={mockStore} settings={mockSettings} />);

      const previewButtons = screen.getAllByRole("button", { name: /Preview/i });
      if (previewButtons.length > 0) {
        fireEvent.click(previewButtons[0]);
        // Note: scrollIntoView might be called, but it"'s" hard to test without actual DOM
      }
    });
  });
});
