import { useState, useEffect } from 'react';
import { Brain } from 'lucide-react';
import { ChatGptModal } from '@/components/chatgpt';
import { Button } from '@/components/ui/button';
import { usePage } from '@inertiajs/react';

export function FloatingChatGpt() {
  const { auth } = usePage().props as any;
  const [isOpen, setIsOpen] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');

  // All hooks must be called before any conditional returns
  useEffect(() => {
    // Effect logic (currently empty but hook must be called unconditionally)
  }, [isOpen]);

  // New access model: available to all authenticated users.
  const canUseChatGPT = Boolean(auth?.user);

  // Don't render if user doesn't have access
  if (!canUseChatGPT) {
    return null;
  }

  const handleGenerate = (content: string) => {
    setGeneratedContent(content);
    // You can add additional logic here if needed
  };

  const handleModalOpen = () => {
    setIsOpen(true);
  };

  const handleModalClose = () => {
    setIsOpen(false);
  };

  return (
    <>
      <div
        className='fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[9999]'
        onClickCapture={(e) => {
          e.preventDefault();
          e.stopPropagation();
          e.nativeEvent.stopImmediatePropagation();
          handleModalOpen();
        }}
        onMouseDownCapture={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <Button
          data-testid='floating-chatgpt-trigger'
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleModalOpen();
          }}
          className='h-12 w-12 sm:h-14 sm:w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow'
          size='lg'
        >
          <Brain className='h-5 w-5 sm:h-6 sm:w-6' />
        </Button>
      </div>

      <ChatGptModal
        isOpen={isOpen}
        onClose={handleModalClose}
        onGenerate={handleGenerate}
        title='AI Assistant'
        placeholder='What would you like me to help you generate?'
      />
    </>
  );
}
