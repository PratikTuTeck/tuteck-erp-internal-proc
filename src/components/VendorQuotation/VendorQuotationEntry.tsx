import React, { useState } from 'react';
import { X, Plus, Edit, Save, Trash2, Upload } from 'lucide-react';

interface VendorQuotationEntryProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRFQ: string;
}

interface PaymentMilestone {
  id: string;
  type: string;
  paymentType: string;
  amount: string;
  reason: string;
}

interface QuotationItem {
  slNo: number;
  itemCode: string;
  itemName: string;
  uom: string;
  procureQty: number;
  canProvideQty: number;
  rate: number;
  isEditing: boolean;
}

const VendorQuotationEntry: React.FC<VendorQuotationEntryProps> = ({ 
  isOpen, 
  onClose, 
  selectedRFQ 
}) => {
  const [formData, setFormData] = useState({
    rfq: selectedRFQ,
    indentId: 'IND-001',
    vendor: '',
    entryDate: new Date().toISOString().split('T')[0],
    timeOfDelivery: '',
    responseTime: '',
    priceValidity: '',
    deliveryPeriod: '',
    packaging: false,
    freight: false,
    loading: false,
    unloading: false,
    warranty: false,
    comment: ''
  });

  const [paymentMilestones, setPaymentMilestones] = useState<PaymentMilestone[]>([
    {
      id: '1',
      type: 'Advance',
      paymentType: '%',
      amount: '10%',
      reason: 'Initial deposit'
    }
  ]);

  const [quotationItems, setQuotationItems] = useState<QuotationItem[]>([
    {
      slNo: 1,
      itemCode: 'ITM-001',
      itemName: 'Steel Rod',
      uom: 'Kg',
      procureQty: 100,
      canProvideQty: 100,
      rate: 350,
      isEditing: false
    },
    {
      slNo: 2,
      itemCode: 'ITM-002',
      itemName: 'Steel Plate',
      uom: 'Kg',
      procureQty: 50,
      canProvideQty: 50,
      rate: 250,
      isEditing: false
    }
  ]);

  if (!isOpen) return null;

  const vendors = [
    { id: 'V001', name: 'Vendor X' },
    { id: 'V002', name: 'Vendor Y' },
    { id: 'V003', name: 'Vendor A' }
  ];

  const rfqs = [
    { id: 'RFQ-001', name: 'RFQ-001' },
    { id: 'RFQ-002', name: 'RFQ-002' }
  ];

  const handleAddMilestone = () => {
    const newMilestone: PaymentMilestone = {
      id: Date.now().toString(),
      type: '',
      paymentType: '%',
      amount: '',
      reason: ''
    };
    setPaymentMilestones([...paymentMilestones, newMilestone]);
  };

  const handleDeleteMilestone = (id: string) => {
    setPaymentMilestones(paymentMilestones.filter(milestone => milestone.id !== id));
  };

  const handleMilestoneChange = (id: string, field: keyof PaymentMilestone, value: string) => {
    setPaymentMilestones(paymentMilestones.map(milestone =>
      milestone.id === id ? { ...milestone, [field]: value } : milestone
    ));
  };

  const handleEditItem = (slNo: number) => {
    setQuotationItems(quotationItems.map(item =>
      item.slNo === slNo ? { ...item, isEditing: true } : item
    ));
  };

  const handleSaveItem = (slNo: number) => {
    setQuotationItems(quotationItems.map(item =>
      item.slNo === slNo ? { ...item, isEditing: false } : item
    ));
  };

  const handleItemChange = (slNo: number, field: keyof QuotationItem, value: number) => {
    setQuotationItems(quotationItems.map(item =>
      item.slNo === slNo ? { ...item, [field]: value } : item
    ));
  };

  const handleSubmitQuotation = () => {
    if (!formData.vendor || !formData.timeOfDelivery || !formData.priceValidity || !formData.deliveryPeriod) {
      alert('Please fill all mandatory fields');
      return;
    }

    console.log('Submitting quotation:', { formData, paymentMilestones, quotationItems });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full mx-4 max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Vendor Quotation Entry</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Header Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select RFQ <span className="text-red-500">*</span>
              </label>
              <select 
                value={formData.rfq}
                onChange={(e) => setFormData({...formData, rfq: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select RFQ</option>
                {rfqs.map(rfq => (
                  <option key={rfq.id} value={rfq.id}>{rfq.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Indent ID
              </label>
              <input
                type="text"
                value={formData.indentId}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Vendor <span className="text-red-500">*</span>
              </label>
              <select 
                value={formData.vendor}
                onChange={(e) => setFormData({...formData, vendor: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Vendor</option>
                {vendors.map(vendor => (
                  <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Entry Date
              </label>
              <input
                type="date"
                value={formData.entryDate}
                onChange={(e) => setFormData({...formData, entryDate: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time of Delivery <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.timeOfDelivery}
                onChange={(e) => setFormData({...formData, timeOfDelivery: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 2-3 weeks"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Response Time (Days)
              </label>
              <input
                type="number"
                value={formData.responseTime}
                onChange={(e) => setFormData({...formData, responseTime: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price Validity <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.priceValidity}
                onChange={(e) => setFormData({...formData, priceValidity: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delivery Period <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.deliveryPeriod}
                onChange={(e) => setFormData({...formData, deliveryPeriod: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 30 days"
              />
            </div>
          </div>

          {/* Checkboxes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Services Included</label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { key: 'packaging', label: 'Packaging' },
                { key: 'freight', label: 'Freight' },
                { key: 'loading', label: 'Loading' },
                { key: 'unloading', label: 'Unloading' },
                { key: 'warranty', label: 'Warranty' }
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData[key as keyof typeof formData] as boolean}
                    onChange={(e) => setFormData({...formData, [key]: e.target.checked})}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comment
            </label>
            <textarea
              rows={3}
              value={formData.comment}
              onChange={(e) => setFormData({...formData, comment: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter any additional comments"
            />
          </div>

          {/* Payment Milestones */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Payment Milestones</h3>
              <button 
                onClick={handleAddMilestone}
                className="flex items-center space-x-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Milestone</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Type</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Payment Type</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Amount/%</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Reason</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-900">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentMilestones.map((milestone) => (
                    <tr key={milestone.id} className="border-t border-gray-200">
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={milestone.type}
                          onChange={(e) => handleMilestoneChange(milestone.id, 'type', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={milestone.paymentType}
                          onChange={(e) => handleMilestoneChange(milestone.id, 'paymentType', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="%">%</option>
                          <option value="Amount">Amount</option>
                        </select>
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={milestone.amount}
                          onChange={(e) => handleMilestoneChange(milestone.id, 'amount', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={milestone.reason}
                          onChange={(e) => handleMilestoneChange(milestone.id, 'reason', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleDeleteMilestone(milestone.id)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center space-x-3 mt-4">
              <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors">
                SUBMIT Payment
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                RESET
              </button>
            </div>
          </div>

          {/* Quotation Items */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quotation Item Table</h3>
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
                    <th className="text-center py-3 px-4 font-medium text-gray-900">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {quotationItems.map((item) => (
                    <tr key={item.slNo} className="border-t border-gray-200">
                      <td className="py-3 px-4 text-gray-600">{item.slNo}</td>
                      <td className="py-3 px-4 font-medium text-gray-900">{item.itemCode}</td>
                      <td className="py-3 px-4 text-gray-600">{item.itemName}</td>
                      <td className="py-3 px-4 text-gray-600">{item.uom}</td>
                      <td className="py-3 px-4 text-gray-600">{item.procureQty}</td>
                      <td className="py-3 px-4">
                        {item.isEditing ? (
                          <input
                            type="number"
                            value={item.canProvideQty}
                            onChange={(e) => handleItemChange(item.slNo, 'canProvideQty', Number(e.target.value))}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        ) : (
                          <span className="text-gray-600">{item.canProvideQty}</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {item.isEditing ? (
                          <input
                            type="number"
                            value={item.rate}
                            onChange={(e) => handleItemChange(item.slNo, 'rate', Number(e.target.value))}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        ) : (
                          <span className="text-gray-600">{item.rate}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {item.isEditing ? (
                          <button
                            onClick={() => handleSaveItem(item.slNo)}
                            className="text-green-600 hover:text-green-800 transition-colors mr-2"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleEditItem(item.slNo)}
                            className="text-blue-600 hover:text-blue-800 transition-colors mr-2"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              File Upload
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">
                Drag and drop files here, or <span className="text-blue-600 cursor-pointer">browse</span>
              </p>
              <input type="file" multiple className="hidden" />
            </div>
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
            onClick={handleSubmitQuotation}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            SUBMIT Vendor Quotation
          </button>
        </div>
      </div>
    </div>
  );
};

export default VendorQuotationEntry;