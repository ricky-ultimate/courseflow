"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const SWIPE_THRESHOLD = 80

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { onSwipeDown?: () => void }
>(({ className, children, onSwipeDown, ...props }, ref) => {
  const touchStartY = React.useRef<number | null>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY
  }
  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current === null || !onSwipeDown) return
    const delta = e.touches[0].clientY - touchStartY.current
    if (delta > SWIPE_THRESHOLD) {
      onSwipeDown()
      touchStartY.current = null
    }
  }
  const handleTouchEnd = () => {
    touchStartY.current = null
  }

  return (
  <DialogPortal>
    <DialogOverlay className="bg-black/50" />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed z-50 grid w-full gap-0 border bg-background p-0 shadow-2xl",
        "max-sm:left-0 max-sm:right-0 max-sm:top-auto max-sm:bottom-0 max-sm:max-h-[90vh] max-sm:translate-y-0 max-sm:rounded-t-[20px] max-sm:rounded-b-none max-sm:duration-300 max-sm:ease-out max-sm:data-[state=open]:animate-in max-sm:data-[state=closed]:animate-out max-sm:data-[state=closed]:slide-out-to-bottom max-sm:data-[state=open]:slide-in-from-bottom",
        "sm:left-[50%] sm:top-[50%] sm:max-w-lg sm:max-h-[90vh] sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-2xl sm:duration-150 sm:data-[state=open]:animate-in sm:data-[state=closed]:animate-out sm:data-[state=closed]:fade-out-0 sm:data-[state=open]:fade-in-0 sm:data-[state=closed]:zoom-out-95 sm:data-[state=open]:zoom-in-95 sm:data-[state=closed]:slide-out-to-left-1/2 sm:data-[state=closed]:slide-out-to-top-[48%] sm:data-[state=open]:slide-in-from-left-1/2 sm:data-[state=open]:slide-in-from-top-[48%]",
        "overflow-y-auto flex flex-col",
        className
      )}
      {...props}
    >
      {/* Mobile-only drag handle: 40×4px, gray-300, margin-top 12px */}
      <div className="hidden max-sm:block w-10 h-1 mx-auto mt-3 mb-1 rounded-full bg-gray-300 flex-shrink-0" aria-hidden />
      <div
        className="flex-1 min-h-0 overflow-y-auto px-6 pt-6 pb-2 flex flex-col gap-4"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
      <DialogPrimitive.Close className="absolute right-4 top-4 size-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-2 focus:outline-indigo-600 focus:outline-offset-2 touch-manipulation data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        <X className="h-5 w-5" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
)})
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left border-b border-gray-200 pb-4",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2 pt-4 px-6 pb-[max(16px,env(safe-area-inset-bottom))] border-t border-gray-200 -mx-6",
      "max-sm:[&>button]:w-full max-sm:[&>button]:h-11 max-sm:[&>a]:w-full max-sm:[&>a]:h-11",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
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
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
