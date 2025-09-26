import React from "react";
import { AlertCircle, Package } from "lucide-react";

const UnauthorizedAccess: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="flex items-center justify-center mb-6">
          <div className="p-4 bg-red-100 rounded-lg">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
        <p className="text-gray-600 mb-6">
          You don't have permission to access the Procurement Module. Please
          contact your administrator to request access.
        </p>

        <div className="border-t pt-6">
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <Package className="w-4 h-4" />
            <span>Procurement Pro - Management System</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedAccess;
