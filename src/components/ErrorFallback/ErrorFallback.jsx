import { Fragment } from 'react';

export function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div className="p-8 flex flex-col items-center justify-center text-center space-y-4 bg-white dark:bg-[#161f30] rounded-xl border border-[#e7ebf3] dark:border-[#2a3447] m-4">
      <div className="size-12 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500">
        <span className="material-symbols-outlined text-[24px]">error</span>
      </div>
      
      <div className="space-y-1">
        <h3 className="text-lg font-bold text-[#0d121b] dark:text-white">Something went wrong</h3>
        <p className="text-sm text-[#4c669a] dark:text-gray-400 max-w-md">
          {error.message || 'An unexpected error occurred while loading this section.'}
        </p>
      </div>

      <button
        onClick={resetErrorBoundary}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors shadow-md shadow-primary/20"
      >
        <span className="material-symbols-outlined text-[18px]">refresh</span>
        Try Again
      </button>
    </div>
  );
}
