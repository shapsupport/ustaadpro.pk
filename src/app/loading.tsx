import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-[calc(100dvh-5rem)] bg-slate-50" role="status" aria-live="polite" aria-label="Loading page">
      <span className="sr-only">Loading page.</span>

      <div className="border-b border-emerald-100 bg-gradient-to-br from-white via-emerald-50/60 to-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
          <div className="max-w-2xl">
            <Skeleton className="h-4 w-28 bg-emerald-200/70" />
            <Skeleton className="mt-5 h-10 w-full max-w-xl sm:h-12" />
            <Skeleton className="mt-3 h-5 w-full max-w-lg" />
            <Skeleton className="mt-2 h-5 w-4/5 max-w-md" />
            <div className="mt-6 flex gap-3"><Skeleton className="h-11 w-36" /><Skeleton className="h-11 w-28" /></div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <Skeleton className="aspect-[16/9] rounded-none" />
              <div className="p-4 sm:p-5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="mt-4 h-6 w-4/5" />
                <Skeleton className="mt-3 h-4 w-full" />
                <Skeleton className="mt-2 h-4 w-2/3" />
                <div className="mt-5 flex items-center justify-between"><Skeleton className="h-8 w-28" /><Skeleton className="h-10 w-24" /></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
