import React from "react";

const AllocationSummaryModal = ({ isOpen, onClose, summary }) => {
  if (!isOpen || !summary) {
    return null; // Don't render if not open
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-lg w-full relative">
        
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          ✕
        </button>

        <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
          Allocation Summary
        </h2>

        <div className="flex flex-wrap gap-4 justify-center">
          <div className="flex items-center space-x-2">
            <span className="bg-green-200 text-green-800 px-3 py-1 rounded-full">
              Perfect: {summary.automatic_count}
            </span>
          </div>

          {summary.domain_matched_count ? (
  <div className="flex items-center space-x-2">
    <span className="bg-blue-200 text-blue-800 px-3 py-1 rounded-full">
      Domain Matched: {summary.domain_matched_count}
    </span>
  </div>
) : null}


          <div className="flex items-center space-x-2">
            <span className="bg-red-200 text-red-800 px-3 py-1 rounded-full">
              Manual: {summary.manual_count}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="bg-gray-300 text-gray-900 px-3 py-1 rounded-full">
              Total: {summary.total_groups}
            </span>
          </div>
        </div>

        <p className="text-gray-600 mt-6 text-center">{summary.message}</p>
      </div>
    </div>
  );
};

export default AllocationSummaryModal;
