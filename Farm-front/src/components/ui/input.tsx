import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-[#d7c7a8] bg-[#fffef8] px-3 py-2 text-base text-[#314837] ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[#314837] placeholder:text-[#8a7a5b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d89b2b] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
