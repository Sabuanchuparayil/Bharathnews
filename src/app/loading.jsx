export default function Loading() {
  return (
    <div className="min-h-screen bg-surface-1 dark:bg-dark-surface-0 flex flex-col items-center justify-center">
      <img
        src="/logo-mark.png"
        alt="Loading"
        width={80}
        height={80}
        className="w-20 h-20 rounded-2xl animate-pulse mb-4"
      />
      <p className="text-sm text-gray-400 dark:text-gray-500 font-medium tracking-wide">Loading...</p>
    </div>
  );
}
