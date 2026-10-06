import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'

import { cn } from '@/lib/utils'
import { useModalStack } from '@/contexts/ModalStackContext'

function Dialog({
  onOpenChange,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Root>) {
  const handleOpenChange = (open: boolean) => {
    // Only allow manual close, not auto-close from focus loss
    if (!open && onOpenChange) {
      // Add a small delay to prevent immediate close when another modal opens
      setTimeout(() => {
        if (onOpenChange) onOpenChange(open);
      }, 100);
    } else if (open && onOpenChange) {
      onOpenChange(open);
    }
  };

  return (
    <DialogPrimitive.Root {...props} modal={false} onOpenChange={handleOpenChange} />
  );
}
Dialog.displayName = 'Dialog'

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay> & { modalId?: string }
>(({ className, modalId, ...props }, ref) => {
  const { getZIndex } = useModalStack();
  const zIndex = modalId ? getZIndex(modalId) : 50;
  
  return (
    <DialogPrimitive.Overlay
      ref={ref}
      className={cn(
        'fixed inset-0 bg-black/50 duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 dark:bg-black/70',
        className
      )}
      style={{ zIndex }}
      {...props}
    />
  );
})
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { modalId?: string }
>(({ className, children, modalId, onPointerDownOutside, ...props }, ref) => {
  const { registerModal, unregisterModal, getZIndex } = useModalStack();
  const [currentModalId] = React.useState(() => modalId || `modal-${Date.now()}-${Math.random()}`);
  
  React.useEffect(() => {
    registerModal(currentModalId);
    return () => unregisterModal(currentModalId);
  }, [currentModalId, registerModal, unregisterModal]);
  
  const zIndex = getZIndex(currentModalId);
  
  return (
    <DialogPortal>
      <DialogOverlay modalId={currentModalId} />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          'fixed left-[50%] top-[50%] grid w-[calc(100%-2rem)] max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 rounded-xl border bg-background p-6 shadow-pop ease-out data-[state=open]:animate-in data-[state=open]:duration-200 data-[state=closed]:animate-out data-[state=closed]:duration-150 data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-[0.97] data-[state=open]:zoom-in-[0.97]',
          className
        )}
        style={{ zIndex: zIndex + 1 }}
        onPointerDownOutside={(e) => {
          e.preventDefault();
          if (onPointerDownOutside) onPointerDownOutside(e);
        }}
        onFocusOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className='absolute end-3 top-3 inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none'>
          <X className='h-4 w-4' />
          <span className='sr-only'>Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
})
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col gap-1.5 text-center sm:text-start',
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = 'DialogHeader'

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end',
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = 'DialogFooter'

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      'text-lg font-semibold leading-tight tracking-tight',
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}