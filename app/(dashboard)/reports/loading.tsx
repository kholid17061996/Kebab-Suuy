export default function ReportsLoading() {
  return (
    <div className="p-6 w-full animate-pulse">
      <div className="flex justify-between items-center mb-6">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-40"></div>
        <div className="flex gap-2">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col gap-3">
             <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
             <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mt-2"></div>
          </div>
        ))}
      </div>

      {/* Table Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
        </div>
        <div className="h-10 bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700 px-6 flex items-center justify-between">
           <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
           <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
           <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/5"></div>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-6 flex items-center justify-between">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/5"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
