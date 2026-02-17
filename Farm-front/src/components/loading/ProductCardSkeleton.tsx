import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton loader for ProductCard component
 */
const ProductCardSkeleton = () => {
  return (
    <div className="card-elevated overflow-hidden">
      <Skeleton className="w-full h-48" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
};

export default ProductCardSkeleton;







