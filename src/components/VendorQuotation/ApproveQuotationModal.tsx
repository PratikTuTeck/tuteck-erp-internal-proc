import React, { useState } from 'react';
import { X, FileText, User, Calendar, Package, CheckCircle, XCircle } from 'lucide-react';

interface ApproveQuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotation: {
    id: string;
    quotationNo: string;
    rfqNo: string;
    requestedBy: string;
    requestedOn: string;
    vendor: string;
    approvedBy: string;
    approvedOn: string;
    status: string;
  };
}

const ApproveQuotationModal: React.FC<ApproveQuotationModalProps> = ({ 
  isOpen, 
  onClose, 
  quotation 
}) => {
  const [comment, setComment] = useState('');

  if (!isOpen) return null;

  // Mock quotation details
  const quotationDetails = {
    indentId: 'IND-001',
    entryDate: '2024-07-12',
    timeOfDelivery: '2-3 weeks',
    responseTime: '5 days',
    priceValidity: '2024-08-12',
    deliveryPeriod: '30 days',
    services: {
      packaging: true,
      freight: true,
      loading: false,
      unloading: true,
      warranty: true
    },
    paymentMilestones: [
      { type: 'Advance', paymentType: '%', amount: '10%', reason: 'Initial deposit' },
      { type: 'On Delivery', paymentType: '%', amount: '90%', reason: 'Final payment' }
    ],
    items: [
      {
        slNo: 1,
        itemCode: 'ITM-001',
        itemName: 'Steel Rod',
        uom: 'Kg',
        procureQty: 100,
        canProvideQty: 100,
        rate: 350,
        totalAmount: 35000
      },
      {
        slNo: 2,
        itemCode: 'ITM-002',
        itemName: 'Steel Plate',
        uom: 'Kg',
        procureQty: 50,
        canProvideQty: 50,
        rate: 250,
        totalAmount: 12500
      }
    ],
    totalQuotationValue: 47500
  };

  const handleApprove = () => {
    console.log('Approving quotation:', quotation.quotationNo, 'with comment:', comment);
    onClose();
  };

  const handleReject = () => {
    console.log('Rejecting quotation:', quotation.quotationNo, 'with comment:', comment);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <FileText className="w-6 h-6 text-orange-600" />
            <h2 className="text-xl font-semibold text-gray-900">Approve Vendor Quotation</h2>
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
          {/* Header Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Quotation No.</p>
                  <p className="font-medium text-gray-900">{quotation.quotationNo}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">RFQ No.</p>
                  <p className="font-medium text-gray-900">{quotation.rfqNo}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Indent ID</p>
                  <p className="font-medium text-gray-900">{quotationDetails.indentId}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Vendor</p>
                  <p className="font-medium text-gray-900">{quotation.vendor}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Entry Date</p>
                  <p className="font-medium text-gray-900">{quotationDetails.entryDate}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Price Validity</p>
                  <p className="font-medium text-gray-900">{quotationDetails.priceValidity}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Package className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Time of Delivery</p>
                  <p className="font-medium text-gray-900">{quotationDetails.timeOfDelivery}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Package className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Delivery Period</p>
                  <p className="font-medium text-gray-900">{quotationDetails.deliveryPeriod}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Response Time</p>
                  <p className="font-medium text-gray-900">{quotationDetails.responseTime}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Services Included */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Services Included</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(quotationDetails.services).map(([key, value]) => (
                <div key={key} className="flex items-center space-x-2">
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                    value ? 'bg-green-500 border-green-500' : 'border-gray-300'
                  }`}>
                    {value && <span className="text-white text-xs">✓</span>}
                  </div>
                  <span className="text-sm text-gray-700 capitalize">{key}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Milestones */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Milestones</h3>
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Type</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Payment Type</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Amount/%</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {quotationDetails.paymentMilestones.map((milestone, index) => (
                    <tr key={index} className="border-t border-gray-200">
                      <td className="py-3 px-4 text-gray-600">{milestone.type}</td>
                      <td className="py-3 px-4 text-gray-600">{milestone.paymentType}</td>
                      <td className="py-3 px-4 text-gray-600">{milestone.amount}</td>
                      <td className="py-3 px-4 text-gray-600">{milestone.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quotation Items */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quotation Items</h3>
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Sl. No</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Item Code</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Item Name</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">UOM</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Procure Qty</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Can Provide Qty</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Rate (₹)</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Total Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {quotationDetails.items.map((item) => (
                    <tr key={item.slNo} className="border-t border-gray-200">
                      <td className="py-3 px-4 text-gray-600">{item.slNo}</td>
                      <td className="py-3 px-4 font-medium text-gray-900">{item.itemCode}</td>
                      <td className="py-3 px-4 text-gray-600">{item.itemName}</td>
                      <td className="py-3 px-4 text-gray-600">{item.uom}</td>
                      <td className="py-3 px-4 text-gray-600">{item.procureQty}</td>
                      <td className="py-3 px-4 text-gray-600">{item.canProvideQty}</td>
                      <td className="py-3 px-4 text-gray-600">{item.rate}</td>
                      <td className="py-3 px-4 font-medium text-gray-900">₹{item.totalAmount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={7} className="py-3 px-4 font-medium text-gray-900 text-right">
                      Total Quotation Value:
                    </td>
                    <td className="py-3 px-4 font-bold text-gray-900">
                      ₹{quotationDetails.totalQuotationValue.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Approval Comment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Approval Comment
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
        </div>
      </div>
    </div>
  );
};

export default ApproveQuotationModal;