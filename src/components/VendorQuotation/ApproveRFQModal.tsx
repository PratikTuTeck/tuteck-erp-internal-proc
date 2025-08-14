import React, { useState } from 'react';
import { X, FileText, MapPin, Calendar, Users, CheckCircle, XCircle } from 'lucide-react';
import axios from 'axios';

interface ApproveRFQModalProps {
  isOpen: boolean;
  onClose: () => void;
  rfq: {
    id: string;
    rfqNo: string;
    deliveryLocation: string;
    vendorOptions: string[];
    rfqDate: string;
    endDate: string;
    approvedBy: string;
    approvedOn: string;
    status: string;
  };
}

const ApproveRFQModal: React.FC<ApproveRFQModalProps> = ({ isOpen, onClose, rfq }) => {
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  // Mock data for RFQ details
  const rfqDetails = {
    indentId: 'IND-001',
    warehouseName: rfq.deliveryLocation,
    warehouseAddress: '123 Industrial Area, Sector 5, City - 400001',
    associatedVendors: rfq.vendorOptions,
    items: [
      {
        itemCode: 'ITM-001',
        itemName: 'Steel Rod',
        vendorOptions: ['Vendor X', 'Vendor Y'],
        uom: 'Kg',
        procureQty: 100
      },
      {
        itemCode: 'ITM-002',
        itemName: 'Steel Plate',
        vendorOptions: ['Vendor X', 'Vendor Y'],
        uom: 'Kg',
        procureQty: 50
      }
    ]
  };

  const handleApprove = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/rfq/decision/${rfq.id}`, {
        decision: 'APPROVED',
        comment: comment
      });
      
      if (response.data.success) {
        alert('RFQ approved successfully!');
        onClose();
      } else {
        alert('Failed to approve RFQ');
      }
    } catch (error) {
      console.error('Error approving RFQ:', error);
      alert('Error approving RFQ. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/rfq/decision/${rfq.id}`, {
        decision: 'REJECTED',
        comment: comment
      });
      
      if (response.data.success) {
        alert('RFQ rejected successfully!');
        onClose();
      } else {
        alert('Failed to reject RFQ');
      }
    } catch (error) {
      console.error('Error rejecting RFQ:', error);
      alert('Error rejecting RFQ. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <FileText className="w-6 h-6 text-orange-600" />
            <h2 className="text-xl font-semibold text-gray-900">Approve RFQ</h2>
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              Pending Approval
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
          {/* RFQ Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">RFQ ID</p>
                  <p className="font-medium text-gray-900">{rfq.rfqNo}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Indent ID</p>
                  <p className="font-medium text-gray-900">{rfqDetails.indentId}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Warehouse Name</p>
                  <p className="font-medium text-gray-900">{rfqDetails.warehouseName}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Users className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Associated Vendors</p>
                  <p className="font-medium text-gray-900">{rfqDetails.associatedVendors.join(', ')}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">RFQ Date</p>
                  <p className="font-medium text-gray-900">{rfq.rfqDate}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">End Date</p>
                  <p className="font-medium text-gray-900">{rfq.endDate}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-500">Warehouse Address</p>
                  <p className="font-medium text-gray-900">{rfqDetails.warehouseAddress}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Items</h3>
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Item Code</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Item Name</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Vendor Option</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">UOM</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Procure Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {rfqDetails.items.map((item, index) => (
                    <tr key={index} className="border-t border-gray-200">
                      <td className="py-3 px-4 font-medium text-gray-900">{item.itemCode}</td>
                      <td className="py-3 px-4 text-gray-600">{item.itemName}</td>
                      <td className="py-3 px-4 text-gray-600">{item.vendorOptions.join(', ')}</td>
                      <td className="py-3 px-4 text-gray-600">{item.uom}</td>
                      <td className="py-3 px-4 text-gray-600">{item.procureQty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Approval Comment */}
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
        </div>

        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleReject}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <XCircle className="w-4 h-4" />
            <span>{loading ? 'Processing...' : 'Reject'}</span>
          </button>
          <button
            onClick={handleApprove}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <CheckCircle className="w-4 h-4" />
            <span>{loading ? 'Processing...' : 'Approve'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApproveRFQModal;