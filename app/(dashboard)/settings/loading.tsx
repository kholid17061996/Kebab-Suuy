export default function SettingsLoading() {
  return (
    <div className="p-6 w-full max-w-5xl mx-auto animate-pulse">
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-6"></div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar Navigation Skeleton */}
        <div className="md:col-span-1 space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
          ))}
        </div>

        {/* Form Content Skeleton */}
        <div className="md:col-span-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 space-y-8">
          
          <div className="flex items-center gap-6 border-b border-gray-100 dark:border-gray-700 pb-6">
            <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full shrink-0"></div>
            <div className="space-y-3 w-full">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-40"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                  <div className="h-11 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                </div>
              ))}
            </div>

            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                <div className="h-11 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
              </div>
            ))}
          </div>
          
          <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
