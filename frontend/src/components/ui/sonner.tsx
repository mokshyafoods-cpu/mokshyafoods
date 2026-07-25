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
          "--normal-bg": "#fdfbf7",
          "--normal-text": "#1f2937",
          "--normal-border": "rgba(27, 58, 43, 0.15)",
          "--success-bg": "#f5fbf6",
          "--success-text": "#1f5f3a",
          "--success-border": "rgba(31, 95, 58, 0.2)",
          "--error-bg": "#fff6f6",
          "--error-text": "#b42318",
          "--error-border": "rgba(180, 35, 24, 0.2)",
          "--info-bg": "#faf7ef",
          "--info-text": "#7a5b1b",
          "--info-border": "rgba(122, 91, 27, 0.2)",
          "--border-radius": "1rem",
          "--shadow": "0 18px 45px -20px rgba(15, 23, 42, 0.28)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "group toast group-[.toaster]:bg-[var(--normal-bg)] group-[.toaster]:text-[var(--normal-text)] group-[.toaster]:border group-[.toaster]:shadow-lg group-[.toaster]:backdrop-blur-sm",
          title: "text-sm font-semibold",
          description: "text-sm text-slate-600",
          closeButton: "bg-white/80 text-slate-600 hover:bg-white",
          actionButton: "bg-primary text-white",
          cancelButton: "bg-slate-100 text-slate-700",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
