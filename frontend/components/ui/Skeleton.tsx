export function CalendarSkeleton() {
  return (
    <div className="animate-fadeInUp">
      <div className="h-7 w-32 bg-gray-200 rounded-lg mx-auto mb-6 animate-pulse" />
      <div className="max-w-md mx-auto bg-card rounded-2xl shadow-lg border border-border overflow-hidden">
        {/* Month nav */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="w-9 h-9 rounded-xl bg-gray-100 animate-pulse" />
          <div className="h-6 w-36 bg-gray-200 rounded-lg animate-pulse" />
          <div className="w-9 h-9 rounded-xl bg-gray-100 animate-pulse" />
        </div>
        {/* Day labels */}
        <div className="grid grid-cols-7 px-3 pt-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex justify-center py-2">
              <div className="h-4 w-5 bg-gray-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
        {/* Calendar grid */}
        <div className="grid grid-cols-7 px-3 pb-4 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="h-11 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function TimeSlotsSkeleton() {
  return (
    <div className="animate-fadeInUp">
      <div className="h-7 w-28 bg-gray-200 rounded-lg mx-auto mb-6 animate-pulse" />
      <div className="max-w-md mx-auto grid grid-cols-3 gap-3">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="h-[52px] rounded-xl bg-gray-100 animate-pulse"
            style={{ animationDelay: `${i * 50}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

export function BookingsSkeleton() {
  return (
    <div className="max-w-md mx-auto space-y-6 animate-fadeInUp">
      <div className="flex items-center justify-between">
        <div className="h-7 w-28 bg-gray-200 rounded-lg animate-pulse" />
        <div className="w-6 h-6 bg-gray-100 rounded animate-pulse" />
      </div>
      <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="bg-card rounded-2xl p-4 border-2 border-gray-100">
          <div className="flex justify-between items-start mb-3">
            <div className="h-4 w-12 bg-gray-100 rounded animate-pulse" />
            <div className="space-y-2 text-right">
              <div className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
              <div className="h-6 w-16 bg-gray-100 rounded animate-pulse ml-auto" />
            </div>
          </div>
          <div className="border-t border-border pt-3 flex gap-2">
            <div className="flex-1 h-10 rounded-xl bg-gray-100 animate-pulse" />
            <div className="flex-1 h-10 rounded-xl bg-gray-100 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div className="relative w-full h-44 md:h-52 rounded-2xl overflow-hidden mx-auto max-w-2xl bg-gray-200 animate-pulse border border-gray-100" />
  );
}
