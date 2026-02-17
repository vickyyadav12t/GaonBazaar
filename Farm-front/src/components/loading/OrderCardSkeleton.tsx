import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton loader for OrderCard component
 */
const OrderCardSkeleton = () => {
  return (
    <div className="card-elevated p-4">
      <div className="flex gap-4">
        <Skeleton className="w-20 h-20 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-3 w-1/4" />
          <div className="flex gap-2 mt-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-24" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderCardSkeleton;







