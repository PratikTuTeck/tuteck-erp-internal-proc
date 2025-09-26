import React from "react";
import { Package } from "lucide-react";

const LoadingSpinner: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="p-4 bg-blue-600 rounded-lg animate-pulse">
            <Package className="w-8 h-8 text-white" />
          </div>
        </div>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Loading...</h2>
        <p className="text-sm text-gray-500">
          Validating your access permissions
        </p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
