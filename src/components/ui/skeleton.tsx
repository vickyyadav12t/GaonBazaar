import { cn } from "@/lib/utils";

/**
 * Skeleton Component for Loading States
 * 
 * Displays placeholder content while data is loading
 */
interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

const Skeleton = ({ className, ...props }: SkeletonProps) => {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
};

export { Skeleton };
