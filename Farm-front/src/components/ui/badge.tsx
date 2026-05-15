import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-[#d2b06b] bg-[#efe2bc] text-[#315f3b] hover:bg-[#e8d8a7]",
        secondary: "border-[#c89b3a] bg-[#d89b2b] text-[#2f2513] hover:bg-[#c98c1d]",
        destructive: "border-[#d8b19f] bg-[#f6e1d8] text-[#8a4f2a] hover:bg-[#efd2c6]",
        outline: "border-[#d7c7a8] bg-[#fffaf0] text-[#314837]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
