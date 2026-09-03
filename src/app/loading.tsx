export default function MenuLoading() {
  return (
    <div className="p-6 w-full animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/4 mb-6 dark:bg-gray-700"></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-4 h-72 flex flex-col justify-between">
            <div className="w-full h-32 bg-gray-200 dark:bg-gray-700 rounded-md mb-4"></div>
            <div className="space-y-3 mb-4">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
            <div className="flex justify-between items-center mt-auto">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
