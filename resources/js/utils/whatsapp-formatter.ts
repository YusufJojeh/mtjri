import { formatCurrency } from './currency-formatter';

interface CartItem {
  id: number;
  name: string;
  quantity: number;
  price: number | string;
  sale_price?: number | string;
}

interface CartSummary {
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
}

interface ShippingInfo {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

interface Store {
  name?: string;
  title?: string;
}

interface CurrencySettings {
  defaultCurrency?: string;
  decimalFormat?: string;
  decimalSeparator?: string;
  thousandsSeparator?: string;
  currencySymbolPosition?: string;
  currencySymbolSpace?: boolean | string;
  floatNumber?: boolean | string;
}

interface Currency {
  code: string;
  symbol: string;
  name: string;
}

/**
 * Format cart/order details as a WhatsApp message
 */
export function formatCartToWhatsAppMessage(
  cartItems: CartItem[],
  cartSummary: CartSummary,
  shippingInfo: ShippingInfo,
  store: Store,
  storeSettings: CurrencySettings = {},
  currencies: Currency[] = []
): string {
  const storeName = store.name || store.title || 'Store';
  
  // Build message parts
  const parts: string[] = [];
  
  // Header
  parts.push(`*${storeName} - Order Details*`);
  parts.push(''); // Empty line
  
  // Items section
  parts.push('*Items:*');
  cartItems.forEach((item) => {
    const itemPrice = item.sale_price || item.price;
    const priceNum = typeof itemPrice === 'string' ? parseFloat(itemPrice) : itemPrice;
    const totalPrice = priceNum * item.quantity;
    const formattedPrice = formatCurrency(totalPrice, storeSettings, currencies);
    parts.push(`- ${item.name} x${item.quantity} = ${formattedPrice}`);
  });
  
  parts.push(''); // Empty line
  
  // Order Summary
  parts.push('*Order Summary:*');
  parts.push(`Subtotal: ${formatCurrency(cartSummary.subtotal, storeSettings, currencies)}`);
  
  if (cartSummary.discount > 0) {
    parts.push(`Discount: -${formatCurrency(cartSummary.discount, storeSettings, currencies)}`);
  }
  
  if (cartSummary.shipping > 0) {
    parts.push(`Shipping: ${formatCurrency(cartSummary.shipping, storeSettings, currencies)}`);
  } else {
    parts.push('Shipping: Free');
  }
  
  if (cartSummary.tax > 0) {
    parts.push(`Tax: ${formatCurrency(cartSummary.tax, storeSettings, currencies)}`);
  }
  
  parts.push(`*Total: ${formatCurrency(cartSummary.total, storeSettings, currencies)}*`);
  parts.push(''); // Empty line
  
  // Shipping Information
  if (shippingInfo.firstName || shippingInfo.lastName || shippingInfo.email || 
      shippingInfo.phone || shippingInfo.street || shippingInfo.city || 
      shippingInfo.state || shippingInfo.zip || shippingInfo.country) {
    parts.push('*Shipping Information:*');
    
    if (shippingInfo.firstName || shippingInfo.lastName) {
      const fullName = [shippingInfo.firstName, shippingInfo.lastName].filter(Boolean).join(' ');
      if (fullName) parts.push(`Name: ${fullName}`);
    }
    
    if (shippingInfo.email) {
      parts.push(`Email: ${shippingInfo.email}`);
    }
    
    if (shippingInfo.phone) {
      parts.push(`Phone: ${shippingInfo.phone}`);
    }
    
    if (shippingInfo.street) {
      parts.push(`Address: ${shippingInfo.street}`);
    }
    
    if (shippingInfo.city || shippingInfo.state || shippingInfo.zip) {
      const cityParts = [shippingInfo.city, shippingInfo.state, shippingInfo.zip].filter(Boolean);
      if (cityParts.length > 0) {
        parts.push(`City: ${cityParts.join(', ')}`);
      }
    }
    
    if (shippingInfo.country) {
      parts.push(`Country: ${shippingInfo.country}`);
    }
  }
  
  // Join with %0A (URL-encoded newline for WhatsApp)
  return parts.join('%0A');
}













