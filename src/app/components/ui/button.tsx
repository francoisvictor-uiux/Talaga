import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-1",
  {
    variants: {
      variant: {
        default:    "bg-blue-600 text-white hover:bg-blue-700 shadow-sm",
        destructive:"bg-red-500 text-white hover:bg-red-600 shadow-sm",
        outline:    "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300",
        secondary:  "bg-gray-100 text-gray-700 hover:bg-gray-200",
        ghost:      "text-gray-600 hover:bg-gray-100 hover:text-gray-800",
        link:       "text-blue-600 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm:      "h-8 rounded-lg gap-1.5 px-3 has-[>svg]:px-2.5",
        lg:      "h-10 rounded-lg px-6 has-[>svg]:px-4",
        icon:    "size-9 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        data-slot="button"
        ref={ref as React.Ref<HTMLButtonElement>}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";

export { Button, buttonVariants };
