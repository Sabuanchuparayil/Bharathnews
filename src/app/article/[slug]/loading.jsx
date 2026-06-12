export default function Loading() {
  return (
    <div className="min-h-screen bg-surface-1 dark:bg-dark-surface-0">
      <div className="h-16" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded-full mb-4 animate-pulse" />
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg mb-2 animate-pulse" />
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg w-3/4 mb-6 animate-pulse" />
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
          <div className="space-y-1.5">
            <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        </div>
        <div className="aspect-[16/9] bg-gray-200 dark:bg-gray-700 rounded-2xl mb-8 animate-pulse" />
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" style={{ width: `${85 + Math.random() * 15}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}
