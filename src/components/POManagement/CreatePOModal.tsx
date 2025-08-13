import React, { useState } from 'react';
import { X, Plus, Trash2, Search } from 'lucide-react';

interface CreatePOModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PaymentTerm {
  id: string;
  terms: string;
  amount: string;
  reason: string;
}

interface POItem {
  id: string;
  hsnCode: string;
  itemCode: string;
  itemName: string;
  uom: string;
  rate: number;
  quantity: number;
  totalPrice: number;
  selected: boolean;
}

const CreatePOModal: React.FC<CreatePOModalProps> = ({ isOpen, onClose }) => {
  const [sourceType, setSourceType] = useState<'quotation' | 'indent'>('quotation');
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    poDate: new Date().toISOString().split('T')[0],
    selectedRFQ: '',
    selectedIndent: '',
    selectedVendor: '',
    receivedLocation: '',
    vendorAddress: '',
    bankName: '',
    gstNo: '',
    accountNo: '',
    ifscCode: '',
    igst: 18,
    sgst: 9,
    cgst: 9
  });

  const [paymentTerms, setPaymentTerms] = useState<PaymentTerm[]>([
    {
      id: '1',
      terms: 'Advance',
      amount: '30%',
      reason: 'Material booking'
    }
  ]);

  const [items, setItems] = useState<POItem[]>([
    {
      id: '1',
      hsnCode: '7215',
      itemCode: 'ITM-001',
      itemName: 'Steel Rod',
      uom: 'Kg',
      rate: 350,
      quantity: 100,
      totalPrice: 35000,
      selected: false
    },
    {
      id: '2',
      hsnCode: '7216',
      itemCode: 'ITM-002',
      itemName: 'Steel Plate',
      uom: 'Kg',
      rate: 250,
      quantity: 80,
      totalPrice: 20000,
      selected: false
    },
    {
      id: '3',
      hsnCode: '8471',
      itemCode: 'ITM-003',
      itemName: 'IT Equipment',
      uom: 'Piece',
      rate: 85000,
      quantity: 10,
      totalPrice: 850000,
      selected: false
    }
  ]);

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

  const handleVendorChange = (vendorId: string) => {
    const vendor = vendors.find(v => v.id === vendorId);
    setFormData({
      ...formData,
      selectedVendor: vendorId,
      vendorAddress: vendor?.address || '',
      // Auto-populate vendor details (in real app, fetch from API)
      bankName: 'HDFC Bank',
      gstNo: '29ABCDE1234F1Z5',
      accountNo: '1234567890',
      ifscCode: 'HDFC0001234'
    });
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

  const handleItemSelect = (itemId: string) => {
    setItems(items.map(item =>
      item.id === itemId ? { ...item, selected: !item.selected } : item
    ));
  };

  const handleItemChange = (itemId: string, field: 'rate' | 'quantity', value: number) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        const updatedItem = { ...item, [field]: value };
        updatedItem.totalPrice = updatedItem.rate * updatedItem.quantity;
        return updatedItem;
      }
      return item;
    }));
  };

  const filteredItems = items.filter(item =>
    item.itemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.itemName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedItems = items.filter(item => item.selected);
  const totalAmount = selectedItems.reduce((sum, item) => sum + item.totalPrice, 0);

  const handleSave = () => {
    if (!formData.selectedVendor || selectedItems.length === 0) {
      alert('Please select vendor and at least one item');
      return;
    }

    console.log('Creating PO:', {
      sourceType,
      formData,
      paymentTerms,
      selectedItems,
      totalAmount
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full mx-4 max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Create Purchase Order</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Source Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Source Type</label>
            <div className="flex space-x-6">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="quotation"
                  checked={sourceType === 'quotation'}
                  onChange={(e) => setSourceType(e.target.value as 'quotation')}
                  className="mr-2"
                />
                <span>Quotation</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="indent"
                  checked={sourceType === 'indent'}
                  onChange={(e) => setSourceType(e.target.value as 'indent')}
                  className="mr-2"
                />
                <span>Indent Details</span>
              </label>
            </div>
          </div>

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

            {sourceType === 'quotation' ? (
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Received Location
              </label>
              <input
                type="text"
                value={formData.receivedLocation}
                onChange={(e) => setFormData({...formData, receivedLocation: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter delivery location"
              />
            </div>

            <div className="md:col-span-2">
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
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setItems(items.map(item => ({ ...item, selected: checked })));
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
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
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={item.selected}
                          onChange={() => handleItemSelect(item.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
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
                      <td className="py-3 px-4 font-medium text-gray-900">₹{item.totalPrice.toLocaleString()}</td>
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
            SAVE
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreatePOModal;