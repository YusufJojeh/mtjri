import React from 'react';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WhatsAppShareButtonProps {
  whatsappNumber: string;
  message: string;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'm' | 'lg' | 'icon';
}

/**
 * WhatsApp Share Button Component
 * Generates a WhatsApp link and opens it in a new tab
 */
export function WhatsAppShareButton({
  whatsappNumber,
  message,
  className = '',
  variant = 'default',
  size = 'default',
}: WhatsAppShareButtonProps) {
  // Clean phone number - remove all non-numeric characters
  const cleanNumber = whatsappNumber.replace(/[^0-9]/g, '');
  
  if (!cleanNumber) {
    return null;
  }
  
  // Encode message for URL
  const encodedMessage = encodeURIComponent(message.replace(/%0A/g, '\n'));
  
  // Generate WhatsApp URL
  const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodedMessage}`;
  
  const handleClick = () => {
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };
  
  return (
    <Button
      type='button'
      onClick={handleClick}
      variant={variant}
      size={size}
      className={`bg-[#25D366] hover:bg-[#20BA5A] text-white ${className}`}
    >
      <MessageCircle className='h-4 w-4 mr-2' />
      Share via WhatsApp
    </Button>
  );
}













