import * as React from "react"

import { cn } from "@/lib/utils"

function Input({
  className,
  type,
  ...props
}) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-gray-400 selection:bg-indigo-600 selection:text-white dark:bg-input/30 border-gray-300 h-10 w-full min-w-0 rounded-lg border-2 bg-white px-4 py-2 text-base shadow-md transition-all duration-200 outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm hover:border-indigo-400 hover:shadow-lg",
        "focus-visible:border-indigo-600 focus-visible:ring-indigo-600/20 focus-visible:ring-4",
        "aria-invalid:ring-red-500/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-red-500",
        className
      )}
      {...props} />
  );
}

export { Input }
