export default function Loading() {
  return (
    <div className="min-h-screen bg-surface-1 dark:bg-dark-surface-0">
      <div className="h-16" />
      <div className="h-9 bg-gray-100 dark:bg-gray-800/50 animate-pulse" />
      <div className="py-4 border-b border-gray-100 dark:border-gray-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center flex-shrink-0 w-[4.5rem]">
                <div className="w-14 h-14 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
                <div className="mt-3 h-3 w-12 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="h-64 sm:h-80 bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse" />
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800/50 rounded-2xl overflow-hidden">
              <div className="h-40 bg-gray-200 dark:bg-gray-700 animate-pulse" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
