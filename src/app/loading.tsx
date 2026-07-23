import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-10 sm:px-6 lg:px-8" role="status" aria-label="Loading page">
      <span className="sr-only">Loading page…</span>
      <Skeleton className="h-5 w-32" />
      <Skeleton className="mt-5 h-11 max-w-2xl" />
      <Skeleton className="mt-3 h-5 max-w-xl" />
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="rounded-3xl border border-slate-200 bg-white p-4">
            <Skeleton className="aspect-[4/3] rounded-2xl" />
            <Skeleton className="mt-5 h-6 w-4/5" />
            <Skeleton className="mt-3 h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-2/3" />
          </div>
        ))}
      </div>
    </main>
  );
}
