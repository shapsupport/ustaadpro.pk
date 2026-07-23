import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-xl bg-slate-200/80", className)}
      {...props}
    />
  );
}

export function ProductGridSkeleton({ count = 9 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-label="Loading products" role="status">
      <span className="sr-only">Loading products…</span>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
          <Skeleton className="aspect-square rounded-none" />
          <div className="space-y-3 p-4">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-6 w-4/5" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-8 w-36" />
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-11 flex-1" />
              <Skeleton className="h-11 w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
