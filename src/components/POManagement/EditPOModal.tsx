import React, { useState } from 'react';
import { X, Plus, Trash2, Search } from 'lucide-react';

interface EditPOModalProps {
  isOpen: boolean;
  onClose: () => void;
  po: {
    id: string;
    poNo: string;
    vendorName: string;
    contactNo: string;
    poDate: string;
    poAmount: number;
    status: string;
    type: string;
    vendorAddress: string;
    warehouseName: string;
    gstNo: string;
    items: Array<{
      itemCode: string;
      itemName: string;
      categoryName: string;
      uom: string;
      hsnCode: string;
      rate: number;
      quantity: number;
      total: number;
    }>;
    vendorDetails: {
      bankName: string;
      accountNo: string;
      ifscCode: string;
      igst: number;
      sgst: number;
      cgst: number;
    };
    paymentTerms: Array<{
      terms: string;
      amount: string;
      reason: string;
    }>;
  };
}

interface PaymentTerm {
  id: string;
  terms: string;
  amount: string;
  reason: string;
}

interface EditableItem {
  id: string;
  itemCode: string;
  itemName: string;
  categoryName: string;
  uom: string;
  hsnCode: string;
  rate: number;
  quantity: number;
  total: number;
}

const EditPOModal: React.FC<EditPOModalProps> = ({ isOpen, onClose, po }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    poDate: po.poDate,
    selectedRFQ: po.type === 'Quotation' ? 'RFQ-001' : '',
    selectedIndent: po.type === 'Indent' ? 'IND-001' : '',
    selectedVendor: 'V001',
    selectedWarehouses: ['WH-001'] as string[],
    vendorAddress: po.vendorAddress,
    bankName: po.vendorDetails.bankName,
    gstNo: po.gstNo,
    accountNo: po.vendorDetails.accountNo,
    ifscCode: po.vendorDetails.ifscCode,
    igst: po.vendorDetails.igst,
    sgst: po.vendorDetails.sgst,
    cgst: po.vendorDetails.cgst
  });

  const [paymentTerms, setPaymentTerms] = useState<PaymentTerm[]>(
    po.paymentTerms.map((term, index) => ({
      id: index.toString(),
      ...term
    }))
  );

  const [items, setItems] = useState<EditableItem[]>(
    po.items.map((item, index) => ({
      id: index.toString(),
      ...item
    }))
  );

  if (!isOpen) return null;

  const rfqs = [
    { id: 'RFQ-001', name: 'RFQ-001 - Construction Materials' },
    { id: 'RFQ-002', name: 'RFQ-002 - IT Equipment' }
  ];

  const indents = [
    { id: 'IND-001', name: 'IND-001 - Office Equipment' },
    { id: 'IND-002', name: 'IND-002 - Construction Materials' }
  ];

  const vendors = [
    { id: 'V001', name: 'TechCorp Solutions Pvt Ltd', address: '123 Tech Street, Bangalore - 560001' },
    { id: 'V002', name: 'Innovate India Limited', address: '456 Innovation Hub, Mumbai - 400001' }
  ];

  const warehouses = [
    { id: 'WH-001', name: 'Warehouse A' },
    { id: 'WH-002', name: 'Warehouse B' },
    { id: 'WH-003', name: 'Warehouse C' }
  ];

  const handleVendorChange = (vendorId: string) => {
    const vendor = vendors.find(v => v.id === vendorId);
    setFormData({
      ...formData,
      selectedVendor: vendorId,
      vendorAddress: vendor?.address || ''
    });
  };

  const handleWarehouseChange = (warehouseId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedWarehouses: prev.selectedWarehouses.includes(warehouseId)
        ? prev.selectedWarehouses.filter(id => id !== warehouseId)
        : [...prev.selectedWarehouses, warehouseId]
    }));
  };

  const handleAddPaymentTerm = () => {
    const newTerm: PaymentTerm = {
      id: Date.now().toString(),
      terms: '',
      amount: '',
      reason: ''
    };
    setPaymentTerms([...paymentTerms, newTerm]);
  };

  const handleDeletePaymentTerm = (id: string) => {
    setPaymentTerms(paymentTerms.filter(term => term.id !== id));
  };

  const handlePaymentTermChange = (id: string, field: keyof PaymentTerm, value: string) => {
    setPaymentTerms(paymentTerms.map(term =>
      term.id === id ? { ...term, [field]: value } : term
    ));
  };

  const handleItemChange = (itemId: string, field: 'rate' | 'quantity', value: number) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        const updatedItem = { ...item, [field]: value };
        updatedItem.total = updatedItem.rate * updatedItem.quantity;
        return updatedItem;
      }
      return item;
    }));
  };

  const filteredItems = items.filter(item =>
    item.itemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.itemName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalAmount = items.reduce((sum, item) => sum + item.total, 0);

  const handleSave = () => {
    console.log('Updating PO:', {
      poNo: po.poNo,
      formData,
      paymentTerms,
      items,
      totalAmount
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full mx-4 max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-semibold text-gray-900">Edit Purchase Order</h2>
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              {po.poNo}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                PO Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.poDate}
                onChange={(e) => setFormData({...formData, poDate: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {po.type === 'Quotation' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select RFQ <span className="text-red-500">*</span>
                </label>
                <select 
                  value={formData.selectedRFQ}
                  onChange={(e) => setFormData({...formData, selectedRFQ: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select RFQ</option>
                  {rfqs.map(rfq => (
                    <option key={rfq.id} value={rfq.id}>{rfq.name}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Indent <span className="text-red-500">*</span>
                </label>
                <select 
                  value={formData.selectedIndent}
                  onChange={(e) => setFormData({...formData, selectedIndent: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Indent</option>
                  {indents.map(indent => (
                    <option key={indent.id} value={indent.id}>{indent.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Vendor <span className="text-red-500">*</span>
              </label>
              <select 
                value={formData.selectedVendor}
                onChange={(e) => handleVendorChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Vendor</option>
                {vendors.map(vendor => (
                  <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delivery Warehouses
              </label>
              <div className="grid grid-cols-3 gap-4">
                {warehouses.map(warehouse => (
                  <label key={warehouse.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.selectedWarehouses.includes(warehouse.id)}
                      onChange={() => handleWarehouseChange(warehouse.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{warehouse.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vendor Address
              </label>
              <input
                type="text"
                value={formData.vendorAddress}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
              />
            </div>
          </div>

          {/* Vendor Details */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Vendor Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name</label>
                <input
                  type="text"
                  value={formData.bankName}
                  onChange={(e) => setFormData({...formData, bankName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">GST No</label>
                <input
                  type="text"
                  value={formData.gstNo}
                  onChange={(e) => setFormData({...formData, gstNo: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Account Number</label>
                <input
                  type="text"
                  value={formData.accountNo}
                  onChange={(e) => setFormData({...formData, accountNo: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">IFSC Code</label>
                <input
                  type="text"
                  value={formData.ifscCode}
                  onChange={(e) => setFormData({...formData, ifscCode: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">IGST (%)</label>
                <input
                  type="number"
                  value={formData.igst}
                  onChange={(e) => setFormData({...formData, igst: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">SGST (%)</label>
                <input
                  type="number"
                  value={formData.sgst}
                  onChange={(e) => setFormData({...formData, sgst: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">CGST (%)</label>
                <input
                  type="number"
                  value={formData.cgst}
                  onChange={(e) => setFormData({...formData, cgst: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Payment Terms */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Vendor Payment Terms</h3>
              <button 
                onClick={handleAddPaymentTerm}
                className="flex items-center space-x-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Term</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Terms</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Amount</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Reason</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-900">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentTerms.map((term) => (
                    <tr key={term.id} className="border-t border-gray-200">
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={term.terms}
                          onChange={(e) => handlePaymentTermChange(term.id, 'terms', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={term.amount}
                          onChange={(e) => handlePaymentTermChange(term.id, 'amount', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={term.reason}
                          onChange={(e) => handlePaymentTermChange(term.id, 'reason', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleDeletePaymentTerm(term.id)}
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
          </div>

          {/* Item Details */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Item Details</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">HSN Code</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Item Code</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Item Name</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">UOM</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Rate</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Quantity to be Purchased</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Total Price</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="border-t border-gray-200">
                      <td className="py-3 px-4 text-gray-600">{item.hsnCode}</td>
                      <td className="py-3 px-4 font-medium text-gray-900">{item.itemCode}</td>
                      <td className="py-3 px-4 text-gray-600">{item.itemName}</td>
                      <td className="py-3 px-4 text-gray-600">{item.uom}</td>
                      <td className="py-3 px-4">
                        <input
                          type="number"
                          value={item.rate}
                          onChange={(e) => handleItemChange(item.id, 'rate', Number(e.target.value))}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(item.id, 'quantity', Number(e.target.value))}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900">₹{item.total.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Total Amount */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
              <span className="text-2xl font-bold text-gray-900">₹{totalAmount.toLocaleString()}</span>
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
            onClick={handleSave}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditPOModal;