import React, { useState, useEffect } from 'react';
import { X, Search, Edit, Save, AlertTriangle, Loader2 } from 'lucide-react';

interface AmendPOModalProps {
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
  };
}

interface ApiPOData {
  purchase_order: {
    id: string;
    po_number: string;
    po_date: string;
    vendor_id: string;
    total_amount: string;
    po_status: string;
    po_type: string;
    bank_name: string;
    account_no: string;
    ifsc_code: string;
    sgst: string;
    cgst: string;
    igst: string;
    gst: string;
  };
  vendor_details: {
    vendor_id: string;
    business_name: string;
    contact_no: string;
    city: string;
    state: string;
    district: string;
    pincode: string;
  } | null;
  items: Array<{
    id: string;
    po_id: string;
    item_id: string;
    qty: string;
    rate: string;
    item_details: {
      id: string;
      item_code: string;
      item_name: string;
      hsn_code: string;
      uom_value: string;
    } | null;
  }>;
  warehouse_details: Array<{
    warehouse_name: string;
    address: string;
  }>;
  payment_terms: Array<{
    payment_terms_type: string;
    charges_amount: string;
    charges_percent: string;
    note: string;
  }>;
}

interface AmendableItem {
  id: string;
  slNo: number;
  hsnCode: string;
  itemCode: string;
  itemName: string;
  uom: string;
  rate: number;
  quantity: number;
  totalPrice: number;
  selected: boolean;
  isEditing: boolean;
}

const AmendPOModal: React.FC<AmendPOModalProps> = ({ isOpen, onClose, po }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiData, setApiData] = useState<ApiPOData | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    parentPO: '',
    rfq: '',
    rfqDate: '',
    deliveryLocation: '',
    vendorAddress: '',
    bankName: '',
    accountNo: '',
    ifscCode: '',
    cgst: 0,
    sgst: 0,
    igst: 0
  });

  const [items, setItems] = useState<AmendableItem[]>([]);

  // Fetch PO data from API
  useEffect(() => {
    if (isOpen && po?.id) {
      fetchPOData(po.id);
    }
  }, [isOpen, po?.id]);

  const fetchPOData = async (poId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/purchase-order/${poId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch purchase order data');
      }
      
      const result = await response.json();
      
      if (result.success) {
        setApiData(result.data);
        mapApiDataToFormData(result.data);
      } else {
        throw new Error(result.clientMessage || 'Failed to fetch purchase order data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching PO data:', err);
    } finally {
      setLoading(false);
    }
  };

  const mapApiDataToFormData = (data: ApiPOData) => {
    const { purchase_order, vendor_details, items: apiItems, warehouse_details } = data;
    
    // Update form data
    setFormData({
      parentPO: purchase_order.po_number,
      rfq: purchase_order.po_type === 'RFQ' ? purchase_order.po_number : '',
      rfqDate: purchase_order.po_date ? new Date(purchase_order.po_date).toISOString().split('T')[0] : '',
      deliveryLocation: warehouse_details[0]?.warehouse_name || '',
      vendorAddress: vendor_details ? `${vendor_details.city}, ${vendor_details.state}, ${vendor_details.district} - ${vendor_details.pincode}` : '',
      bankName: purchase_order.bank_name || '',
      accountNo: purchase_order.account_no || '',
      ifscCode: purchase_order.ifsc_code || '',
      cgst: Number(purchase_order.cgst) || 0,
      sgst: Number(purchase_order.sgst) || 0,
      igst: Number(purchase_order.igst) || 0
    });

    // Map items
    const mappedItems: AmendableItem[] = apiItems.map((item, index) => ({
      id: item.id,
      slNo: index + 1,
      hsnCode: item.item_details?.hsn_code || '',
      itemCode: item.item_details?.item_code || '',
      itemName: item.item_details?.item_name || '',
      uom: item.item_details?.uom_value || '',
      rate: Number(item.rate) || 0,
      quantity: Number(item.qty) || 0,
      totalPrice: (Number(item.rate) || 0) * (Number(item.qty) || 0),
      selected: false,
      isEditing: false
    }));

    setItems(mappedItems);
  };

  if (!isOpen) return null;

  const parentPOs = apiData ? [
    { id: apiData.purchase_order.po_number, name: apiData.purchase_order.po_number }
  ] : [
    { id: formData.parentPO, name: formData.parentPO || 'Loading...' }
  ];

  const handleItemSelect = (itemId: string) => {
    setItems(items.map(item =>
      item.id === itemId ? { ...item, selected: !item.selected } : item
    ));
  };

  const handleSelectAll = () => {
    const allSelected = items.every(item => item.selected);
    setItems(items.map(item => ({ ...item, selected: !allSelected })));
  };

  const handleEditItem = (itemId: string) => {
    setItems(items.map(item =>
      item.id === itemId ? { ...item, isEditing: true } : item
    ));
  };

  const handleSaveItem = (itemId: string) => {
    setItems(items.map(item =>
      item.id === itemId ? { ...item, isEditing: false } : item
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
    if (selectedItems.length === 0) {
      alert('Please select at least one item to amend');
      return;
    }

    console.log('Amending PO:', {
      originalPO: po.poNo,
      formData,
      selectedItems,
      totalAmount
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full mx-4 max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Edit className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-semibold text-gray-900">Amend Purchase Order</h2>
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              {apiData?.purchase_order?.po_number || po.poNo || 'Loading...'}
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
          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-600">Loading purchase order data...</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <div>
                  <h4 className="text-sm font-medium text-red-800">Error Loading Data</h4>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                  <button
                    onClick={() => fetchPOData(po.id)}
                    className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Content - Show only when not loading and no error */}
          {!loading && !error && (
            <>
              {/* Header Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Header Section</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Parent PO / PO
                </label>
                <select 
                  value={formData.parentPO}
                  onChange={(e) => setFormData({...formData, parentPO: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {parentPOs.map(parentPO => (
                    <option key={parentPO.id} value={parentPO.id}>{parentPO.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  RFQ
                </label>
                <input
                  type="text"
                  value={formData.rfq}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  RFQ Date
                </label>
                <input
                  type="text"
                  value={formData.rfqDate}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delivery Location
                </label>
                <input
                  type="text"
                  value={formData.deliveryLocation}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
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
          </div>

          {/* Bank Details Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Bank Details Section</h3>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Account No</label>
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
            </div>
          </div>

          {/* Tax Details Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tax Details Section</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">CGST (%)</label>
                <input
                  type="number"
                  value={formData.cgst}
                  onChange={(e) => setFormData({...formData, cgst: Number(e.target.value)})}
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
                <label className="block text-sm font-medium text-gray-700 mb-2">IGST (%)</label>
                <input
                  type="number"
                  value={formData.igst}
                  onChange={(e) => setFormData({...formData, igst: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Item Details Table */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Item Details Table</h3>
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
                    <th className="text-left py-3 px-4">
                      <input
                        type="checkbox"
                        checked={items.length > 0 && items.every(item => item.selected)}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Sl. No.</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">HSN Code</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Item Code</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Item Name</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">UOM</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Rate</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Quantity to be Purchased</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Total Price</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-900">Action</th>
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
                      <td className="py-3 px-4 text-gray-600">{item.slNo}</td>
                      <td className="py-3 px-4 text-gray-600">{item.hsnCode}</td>
                      <td className="py-3 px-4 font-medium text-gray-900">{item.itemCode}</td>
                      <td className="py-3 px-4 text-gray-600">{item.itemName}</td>
                      <td className="py-3 px-4 text-gray-600">{item.uom}</td>
                      <td className="py-3 px-4">
                        {item.isEditing ? (
                          <input
                            type="number"
                            value={item.rate}
                            onChange={(e) => handleItemChange(item.id, 'rate', Number(e.target.value))}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        ) : (
                          <span className="text-gray-600">₹{item.rate}</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {item.isEditing ? (
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(item.id, 'quantity', Number(e.target.value))}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        ) : (
                          <span className="text-gray-600">{item.quantity}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900">₹{item.totalPrice.toLocaleString()}</td>
                      <td className="py-3 px-4 text-center">
                        {item.isEditing ? (
                          <button
                            onClick={() => handleSaveItem(item.id)}
                            className="text-green-600 hover:text-green-800 transition-colors"
                            title="Save"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleEditItem(item.id)}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                            title="Edit Rate and Quantity"
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

          {/* Total Amount */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
              <span className="text-2xl font-bold text-gray-900">₹{totalAmount.toLocaleString()}</span>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-yellow-800">Disclaimer</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  The Items You Want To Send Please Select Them. Only selected items will be included in the amended PO.
                </p>
              </div>
            </div>
          </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            CANCEL
          </button>
          <button 
            onClick={handleSave}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
          >
            SAVE
          </button>
        </div>
      </div>
    </div>
  );
};

export default AmendPOModal;