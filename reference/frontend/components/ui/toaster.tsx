"use client";

import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

export function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-[#1a1614] group-[.toaster]:text-[#e8e0d5] group-[.toaster]:border-[#3d2b1f] group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-[#a89f94]",
          actionButton: "group-[.toast]:bg-[#d4af37] group-[.toast]:text-[#1a1614]",
          cancelButton: "group-[.toast]:bg-[#3d2b1f] group-[.toast]:text-[#a89f94]",
          success: "group-[.toaster]:border-green-500/30",
          error: "group-[.toaster]:border-red-500/30",
          warning: "group-[.toaster]:border-yellow-500/30",
          info: "group-[.toaster]:border-blue-500/30",
        },
      }}
      {...props}
    />
  );
}
