import React from 'react';

const SkeletonLoader = ({ type = 'list' }) => {
  if (type === 'list') {
    return (
      <div className="space-y-4 p-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4 animate-pulse">
            <div className="w-12 h-12 bg-gray-700 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-700 rounded w-1/3" />
              <div className="h-3 bg-gray-700 rounded w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'chat') {
    return (
      <div className="flex-1 p-4 space-y-4 overflow-hidden">
        {[1, 2, 3, 4, 5].map((i) => (
          <div 
            key={i} 
            className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`h-16 bg-gray-700 rounded-lg ${i % 2 === 0 ? 'w-1/3' : 'w-1/2'}`}
            />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'history') {
    return (
      <div className="p-8 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-[#202c33] p-4 rounded-lg border border-gray-700 animate-pulse">
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <div className="h-4 bg-gray-700 rounded w-32" />
                <div className="h-3 bg-gray-700 rounded w-24" />
              </div>
              <div className="h-6 bg-gray-700 rounded w-16" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'video') {
    return (
      <div className="grid grid-cols-2 gap-4 p-10 h-full">
        <div className="bg-gray-800 rounded-xl border border-gray-700 animate-pulse">
          <div className="flex items-center justify-center h-full">
            <div className="w-16 h-16 bg-gray-700 rounded-full" />
          </div>
        </div>
        <div className="bg-gray-800 rounded-xl border border-green-500 animate-pulse">
          <div className="flex items-center justify-center h-full">
            <div className="w-16 h-16 bg-gray-700 rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default SkeletonLoader;
