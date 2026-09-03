export default function TransactionsLoading() {
  return (
    <div className="p-6 w-full animate-pulse">
      <div className="flex justify-between items-center mb-6">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {/* Table Header */}
        <div className="h-12 bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700 px-6 flex items-center justify-between">
           <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/6"></div>
           <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
           <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/6"></div>
           <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
        </div>
        
        {/* Table Body */}
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="p-6 flex items-center justify-between">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/6"></div>
              <div className="flex flex-col gap-2 w-1/4">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
              </div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/6"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-20"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
