import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 aria-invalid:border-destructive flex field-sizing-content min-h-24 w-full rounded-lg border bg-field px-4 py-3 text-[13px] shadow-xs transition-[color,box-shadow,border-color] duration-fast outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-[var(--opacity-disabled)]",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
