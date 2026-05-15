import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md border text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "border-[#c89b3a] bg-[#d89b2b] text-[#2f2513] hover:bg-[#c98c1d]",
        destructive: "border-[#d8b19f] bg-[#f6e1d8] text-[#8a4f2a] hover:bg-[#efd2c6]",
        outline: "border-[#d7c7a8] bg-[#fffaf0] text-[#315f3b] hover:bg-[#f4ead6] hover:text-[#274631]",
        secondary: "border-[#23402b] bg-[#315f3b] text-[#fff3d7] hover:bg-[#274631]",
        ghost: "border-transparent text-[#315f3b] hover:bg-[#f3e7cd] hover:text-[#274631]",
        link: "border-transparent p-0 text-[#315f3b] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
