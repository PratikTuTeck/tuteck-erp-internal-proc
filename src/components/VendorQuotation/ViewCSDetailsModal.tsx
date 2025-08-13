import React, { useState } from 'react';
import { X, FileText, User, Phone, CheckCircle, XCircle } from 'lucide-react';

interface ViewCSDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendor: {
    rfqNo: string;
    vendorNo: string;
    vendorName: string;
    contactNo: string;
    status: string;
    totalAmount: number;
    items: Array<{
      itemCode: string;
      itemName: string;
      requiredQty: number;
      canProvideQty: number;
      rate: number;
      qtySelected: number;
      totalAmount: number;
    }>;
  };
}

const ViewCSDetailsModal: React.FC<ViewCSDetailsModalProps> = ({ 
  isOpen, 
  onClose, 
  vendor 
}) => {
  const [comment, setComment] = useState('');

  if (!isOpen) return null;

  const handleApprove = () => {
    console.log('Approving CS for vendor:', vendor.vendorName, 'with comment:', comment);
    onClose();
  };

  const handleReject = () => {
    console.log('Rejecting CS for vendor:', vendor.vendorName, 'with comment:', comment);
    onClose();
  };

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
            <h2 className="text-xl font-semibold text-gray-900">View CS Details</h2>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(vendor.status)}`}>
              {vendor.status.charAt(0).toUpperCase() + vendor.status.slice(1)}
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
          {/* Header Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">RFQ Number</p>
                  <p className="font-medium text-gray-900">{vendor.rfqNo}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Vendor ID</p>
                  <p className="font-medium text-gray-900">{vendor.vendorNo}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Vendor Name</p>
                  <p className="font-medium text-gray-900">{vendor.vendorName}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Contact Number</p>
                  <p className="font-medium text-gray-900">{vendor.contactNo}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Vendor CS Item Details */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Vendor CS Item Details</h3>
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Item (Code + Name)</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Required Qty</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Can Provide Qty</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Rate</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Qty Selected</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Total Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {vendor.items.map((item, index) => (
                    <tr key={index} className="border-t border-gray-200">
                      <td className="py-3 px-4 font-medium text-gray-900">
                        {item.itemCode} - {item.itemName}
                      </td>
                      <td className="py-3 px-4 text-gray-600">{item.requiredQty}</td>
                      <td className="py-3 px-4 text-gray-600">{item.canProvideQty}</td>
                      <td className="py-3 px-4 text-gray-600">₹{item.rate}</td>
                      <td className="py-3 px-4 text-gray-600">{item.qtySelected}</td>
                      <td className="py-3 px-4 font-medium text-gray-900">₹{item.totalAmount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={5} className="py-3 px-4 font-medium text-gray-900 text-right">
                      Total CS Value:
                    </td>
                    <td className="py-3 px-4 font-bold text-gray-900">
                      ₹{vendor.totalAmount.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Comment Section (only for pending status) */}
          {vendor.status === 'pending' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comment
              </label>
              <textarea
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your approval or rejection comments..."
              />
            </div>
          )}

          {/* Status Information (for approved/rejected) */}
          {vendor.status !== 'pending' && (
            <div className={`rounded-lg p-4 ${
              vendor.status === 'approved' ? 'bg-green-50' : 'bg-red-50'
            }`}>
              <h3 className={`text-lg font-semibold mb-2 ${
                vendor.status === 'approved' ? 'text-green-800' : 'text-red-800'
              }`}>
                {vendor.status === 'approved' ? 'Approved' : 'Rejected'}
              </h3>
              <p className={`text-sm ${
                vendor.status === 'approved' ? 'text-green-600' : 'text-red-600'
              }`}>
                This comparative statement has been {vendor.status}.
              </p>
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
          {vendor.status === 'pending' && (
            <>
              <button
                onClick={handleReject}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <XCircle className="w-4 h-4" />
                <span>Reject</span>
              </button>
              <button
                onClick={handleApprove}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Approve</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewCSDetailsModal;