export default function Loading() {
  return (
    <div className="min-h-screen bg-[#f8f9fa] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="h-20 animate-pulse rounded-[2rem] bg-slate-200/70" />
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="h-[360px] animate-pulse rounded-[2rem] bg-slate-200/70" />
          <div className="h-[360px] animate-pulse rounded-[2rem] bg-slate-200/70" />
        </div>
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-[320px] animate-pulse rounded-[1.75rem] bg-slate-200/70" />
          ))}
        </div>
      </div>
    </div>
  )
}
