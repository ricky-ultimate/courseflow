"use client"

import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastProvider,
  ToastViewport,
  VARIANT_ICONS,
  VARIANT_ICON_CLASSES,
} from "@/components/ui/toast"
import { cn } from "@/lib/utils"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        const Icon = VARIANT_ICONS[variant ?? "default"]
        const iconClass = VARIANT_ICON_CLASSES[variant ?? "default"]
        const message = description ?? title ?? ""

        return (
          <Toast key={id} variant={variant} {...props}>
            <Icon className={cn("h-5 w-5 shrink-0", iconClass)} aria-hidden />
            <span className="min-w-0 flex-1 text-sm text-foreground">
              {message}
            </span>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
