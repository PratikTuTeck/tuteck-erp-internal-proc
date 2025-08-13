import React from 'react';
import { X, FileText, User, Calendar, Package } from 'lucide-react';

interface ViewIndentModalProps {
  isOpen: boolean;
  onClose: () => void;
  indent: {
    id: string;
    indentNumber: string;
    createdBy: string;
    requestedOn: string;
    warehouseName: string;
    expectedDate: string;
    approvedBy: string;
    approvedOn: string;
    status: string;
    aggregateStatus: string;
    projectName: string;
    noOfItems: number;
    comment: string;
    items: Array<{
      hsnCode: string;
      itemCode: string;
      itemName: string;
      uom: string;
      requiredQty: number;
    }>;
  };
}

const ViewIndentModal: React.FC<ViewIndentModalProps> = ({ isOpen, onClose, indent }) => {
  if (!isOpen) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <FileText className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Indent Details</h2>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(indent.status)}`}>
              {indent.status.charAt(0).toUpperCase() + indent.status.slice(1)}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Indent Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Indent Number</p>
                  <p className="font-medium text-gray-900">{indent.indentNumber}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Package className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Project Name</p>
                  <p className="font-medium text-gray-900">{indent.projectName}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Created By</p>
                  <p className="font-medium text-gray-900">{indent.createdBy}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Package className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">No Of Items</p>
                  <p className="font-medium text-gray-900">{indent.noOfItems}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Requested Date</p>
                  <p className="font-medium text-gray-900">{indent.requestedOn}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Expected Date</p>
                  <p className="font-medium text-gray-900">{indent.expectedDate}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(indent.status)}`}>
                    {indent.status.charAt(0).toUpperCase() + indent.status.slice(1)}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Package className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Aggregated Indent IDs</p>
                  <p className="font-medium text-gray-900">
                    {indent.aggregateStatus === 'aggregated' ? 'AGG-001, AGG-002' : 'Not Aggregated'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Comment Section */}
          {indent.comment && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Comment</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-600">{indent.comment}</p>
              </div>
            </div>
          )}

          {/* Item Details Table */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Item Details</h3>
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">HSN Code</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Item Code</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Item Name</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">UOM</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Required Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {indent.items.map((item, index) => (
                    <tr key={index} className="border-t border-gray-200">
                      <td className="py-3 px-4 text-gray-600">{item.hsnCode}</td>
                      <td className="py-3 px-4 font-medium text-gray-900">{item.itemCode}</td>
                      <td className="py-3 px-4 text-gray-600">{item.itemName}</td>
                      <td className="py-3 px-4 text-gray-600">{item.uom}</td>
                      <td className="py-3 px-4 text-gray-600">{item.requiredQty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Approval Information */}
          {indent.status === 'approved' && (
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-green-800 mb-2">Approval Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-green-600">Approved By</p>
                  <p className="font-medium text-green-800">{indent.approvedBy}</p>
                </div>
                <div>
                  <p className="text-sm text-green-600">Approved On</p>
                  <p className="font-medium text-green-800">{indent.approvedOn}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewIndentModal;