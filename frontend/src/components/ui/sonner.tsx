"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-4" />
        ),
        info: (
          <InfoIcon className="size-4" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4" />
        ),
        error: (
          <OctagonXIcon className="size-4" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--success-bg": "color-mix(in srgb, var(--primary) 12%, white 88%)",
          "--success-text": "var(--primary)",
          "--success-border": "color-mix(in srgb, var(--primary) 25%, var(--border))",
          "--error-bg": "color-mix(in srgb, var(--destructive) 12%, white 88%)",
          "--error-text": "var(--destructive)",
          "--error-border": "color-mix(in srgb, var(--destructive) 25%, var(--border))",
          "--info-bg": "color-mix(in srgb, var(--accent) 12%, white 88%)",
          "--info-text": "var(--accent)",
          "--info-border": "color-mix(in srgb, var(--accent) 25%, var(--border))",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
