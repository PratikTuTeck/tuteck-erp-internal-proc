import React, { useState, useEffect } from 'react';
import { X, Search, Edit, Save, AlertTriangle, Loader2, Plus, ShoppingCart } from 'lucide-react';
import axios from 'axios';

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
    po_origin_id: string;
    po_number: string;
    po_date: string;
    vendor_id: string;
    total_amount: string;
    po_status: string;
    po_type: string;
    po_origin_type: string;
    po_origin_number: string;
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
    warehouse_id: string;
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
  isNewItem?: boolean;
}

interface ApiItem {
  id: string;
  item_code: string;
  item_name: string;
  hsn_code: string;
  uom_value: string;
  category_name?: string;
  description?: string;
  latest_lowest_net_rate: number;
}

const AmendPOModal: React.FC<AmendPOModalProps> = ({ isOpen, onClose, po }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiData, setApiData] = useState<ApiPOData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showWarehouseSelector, setShowWarehouseSelector] = useState(false);
  const [allWarehouses, setAllWarehouses] = useState<Array<{ warehouse_id: string; warehouse_name: string; address: string }>>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');

  // Add Item Modal states
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [availableItems, setAvailableItems] = useState<ApiItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [itemSearchTerm, setItemSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const [formData, setFormData] = useState({
    parentPO: '',
    rfq: '',
    indent: '',
    poDate: '',
    deliveryLocation: '',
    vendorAddress: '',
    bankName: '',
    accountNo: '',
    ifscCode: '',
    cgst: 0,
    sgst: 0,
    igst: 0,
    poOriginType: '',
    warehouseDetails: [] as Array<{ warehouse_id: string; warehouse_name: string; address: string }>
  });

  const [items, setItems] = useState<AmendableItem[]>([]);

  // Fetch PO data from API
  useEffect(() => {
    if (isOpen && po?.id) {
      fetchPOData(po.id);
      fetchAllWarehouses();
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

  const fetchAllWarehouses = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_IMS_API_BASE_URL}/warehouse`);
      if (!response.ok) throw new Error('Failed to fetch warehouses');
      const result = await response.json();
      if (result.success) {
        setAllWarehouses(
          (result.data || []).map((warehouse: any) => ({
            ...warehouse,
            warehouse_id: warehouse.id,
          }))
        );
      }
    } catch (err) {
      console.error('Error fetching warehouses:', err);
      setError('Failed to load warehouse list');
    }
  };

  // Fetch available items from API
  const fetchAvailableItems = async () => {
    try {
      setLoadingItems(true);
      // Replace with your actual API endpoint for fetching items
      const response = await fetch(`${import.meta.env.VITE_IMS_API_BASE_URL}/item`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch items');
      }
      
      const result = await response.json();
      
      if (result.success) {
        setAvailableItems(result.data || []);
      } else {
        throw new Error(result.clientMessage || 'Failed to fetch items');
      }
    } catch (err) {
      console.error('Error fetching items:', err);
      setError('Failed to load items list');
    } finally {
      setLoadingItems(false);
    }
  };

  const mapApiDataToFormData = (data: ApiPOData) => {
    const { purchase_order, vendor_details, items: apiItems, warehouse_details } = data;
    
    setFormData({
      parentPO: purchase_order.po_number,
      rfq: purchase_order.po_origin_type === 'RFQ' ? purchase_order.po_origin_number : '',
      indent: purchase_order.po_origin_type === 'INDENT' ? purchase_order.po_origin_number : '',
      poDate: purchase_order.po_date ? new Date(purchase_order.po_date).toISOString().split('T')[0] : '',
      deliveryLocation: warehouse_details?.map(warehouse => warehouse.warehouse_name).join(', ') || '',
      vendorAddress: vendor_details ? `${vendor_details.city}, ${vendor_details.state}, ${vendor_details.district} - ${vendor_details.pincode}` : '',
      bankName: purchase_order.bank_name || '',
      accountNo: purchase_order.account_no || '',
      ifscCode: purchase_order.ifsc_code || '',
      cgst: Number(purchase_order.cgst) || 0,
      sgst: Number(purchase_order.sgst) || 0,
      igst: Number(purchase_order.igst) || 0,
      poOriginType: purchase_order.po_origin_type || '',
      warehouseDetails: warehouse_details || []
    });

    const mappedItems: AmendableItem[] = apiItems.map((item, index) => ({
      id: item.item_id,
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

  const handleAddWarehouse = () => {
    if (!selectedWarehouseId) {
      alert('Please select a warehouse');
      return;
    }

    const selectedWarehouse = allWarehouses.find(wh => wh.warehouse_id === selectedWarehouseId);
    if (selectedWarehouse && !formData.warehouseDetails.some(wh => wh.warehouse_id === selectedWarehouseId)) {
      const updatedWarehouses = [...formData.warehouseDetails, selectedWarehouse];
      setFormData(prev => ({
        ...prev,
        warehouseDetails: updatedWarehouses,
        deliveryLocation: updatedWarehouses.map(wh => wh.warehouse_name).join(', ')
      }));
      setSelectedWarehouseId('');
      setShowWarehouseSelector(false);
    } else if (!selectedWarehouse) {
      alert('Invalid warehouse selected');
    } else {
      alert('Warehouse already added');
    }
  };

  // Add Item Modal functions
  const handleOpenAddItemModal = () => {
    setShowAddItemModal(true);
    setSelectedItems(new Set());
    setItemSearchTerm('');
    fetchAvailableItems();
  };

  const handleCloseAddItemModal = () => {
    setShowAddItemModal(false);
    setSelectedItems(new Set());
    setItemSearchTerm('');
  };

  const handleItemSelection = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleSelectAllItems = () => {
    const filteredAvailableItems = availableItems.filter(item => 
      !items.some(existingItem => existingItem.itemCode === item.item_code) &&
      (item.item_name.toLowerCase().includes(itemSearchTerm.toLowerCase()) ||
       item.item_code.toLowerCase().includes(itemSearchTerm.toLowerCase()))
    );

    if (selectedItems.size === filteredAvailableItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredAvailableItems.map(item => item.id)));
    }
  };

  const handleAddSelectedItems = () => {
    const itemsToAdd = availableItems.filter(item => selectedItems.has(item.id));
    
    const newItems: AmendableItem[] = itemsToAdd.map((item, index) => ({
      id: item.id,
      slNo: items.length + index + 1,
      hsnCode: item.hsn_code || '',
      itemCode: item.item_code,
      itemName: item.item_name,
      uom: item.uom_value || '',
      rate: item.latest_lowest_net_rate,
      quantity: 1,
      totalPrice: 0,
      selected: false,
      isEditing: true,
      isNewItem: true
    }));

    setItems(prev => [...prev, ...newItems]);
    handleCloseAddItemModal();
  };

  const handleDeleteItem = (itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
    // Renumber the remaining items
    setItems(prev => prev.map((item, index) => ({ ...item, slNo: index + 1 })));
  };

  if (!isOpen) return null;

  const parentPOs = apiData ? [
    { id: apiData.purchase_order.po_number, name: apiData.purchase_order.po_number }
  ] : [
    { id: formData.parentPO, name: formData.parentPO || 'Loading...' }
  ];

  const handleDeleteWarehouse = (warehouse_id: string) => {
    const updatedWarehouses = formData.warehouseDetails.filter(wh => wh.warehouse_id !== warehouse_id);
    setFormData(prev => ({
      ...prev,
      warehouseDetails: updatedWarehouses,
      deliveryLocation: updatedWarehouses.map(wh => wh.warehouse_name).join(', ')
    }));
  };

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

  const filteredAvailableItems = availableItems.filter(item => 
    !items.some(existingItem => existingItem.itemCode === item.item_code) &&
    (item.item_name.toLowerCase().includes(itemSearchTerm.toLowerCase()) ||
     item.item_code.toLowerCase().includes(itemSearchTerm.toLowerCase()))
  );

  const subtotalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const cgstAmount = (subtotalAmount * formData.cgst) / 100;
  const sgstAmount = (subtotalAmount * formData.sgst) / 100;
  const igstAmount = (subtotalAmount * formData.igst) / 100;
  const totalAmount = subtotalAmount + cgstAmount + sgstAmount + igstAmount;

  const handleSave = async () => {
    if (items.length === 0) {
      alert('Please select at least one item to amend');
      return;
    }

    try {
      setLoading(true);

      console.log('Saving amended PO with data:', { formData, items });
      // Step 1: Amend Purchase Order
      const poPayload = {
        po_origin_id: apiData?.purchase_order.po_origin_id || '',
        po_origin_type: formData.poOriginType,
        po_number: formData.parentPO,
        po_uri: null,
        vendor_id: apiData?.purchase_order.vendor_id || po.vendorName, // fallback to vendorName if id not present
        approved_by: null,
        is_mailed: false,
        mail_sent: null,
        comments: null,
        reference_purchase_id: po.id,
        po_type: apiData?.purchase_order.po_type || 'STANDARD',
        po_date: formData.poDate,
        bank_name: formData.bankName,
        account_no: formData.accountNo,
        ifsc_code: formData.ifscCode,
        sgst: parseFloat(formData.sgst.toString()),
        igst: parseFloat(formData.igst.toString()),
        project_id: null,
        lookup_approval_status: null,
        approved_on: null,
        gst: po.gstNo || '',
        total_amount: totalAmount,
        cgst: parseFloat(formData.cgst.toString()),
        inspection_status: false,
        po_status: 'AMENDED'
      };

      const poResponse = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/purchase-order/amended`,
        poPayload
      );

      if (!poResponse.data.success) {
        alert('Failed to amend Purchase Order');
        setLoading(false);
        return;
      }

      const poId = poResponse.data.data.id || poResponse.data.data.po_id || po.id;

      // Step 2: Update Purchase Order Details in bulk
      const poDetailsPayload = items.map((item) => ({
        po_id: poId,
        vendor_id: apiData?.purchase_order.vendor_id || po.vendorName,
        item_id: item.id,
        qty: item.quantity,
        rate: item.rate,
        notes: '',
        qs_approved: false,
      }));

      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/purchase-order-details/bulk`,
        poDetailsPayload
      );

      // Step 3: Update Purchase Order Warehouse mappings in bulk
      if (formData.warehouseDetails.length > 0) {
        const warehousePayload = formData.warehouseDetails.map((wh) => ({
          po_id: poId,
          warehouse_id: wh.warehouse_id,
        }));

        try {
          await axios.post(
            `${import.meta.env.VITE_API_BASE_URL}/purchase-order-warehouse/bulk`,
            warehousePayload
          );
        } catch (warehouseError) {
          console.error('Error creating warehouse mappings:', warehouseError);
        }
      }

      alert('Purchase Order amended successfully!');
      onClose();
    } catch (err) {
      setError('Failed to save amended Purchase Order');
      console.error('Error saving amended PO:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
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
            {loading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <span className="ml-3 text-gray-600">Loading purchase order data...</span>
              </div>
            )}

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

            {!loading && !error && (
              <>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Header Section</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Parent PO / PO
                      </label>
                      <input
                          type="text"
                          value={formData.parentPO}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                        />
                    </div>

                    {formData.poOriginType === 'RFQ' && (
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
                    )}

                    {formData.poOriginType === 'INDENT' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          INDENT
                        </label>
                        <input
                          type="text"
                          value={formData.indent}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        PO Date
                      </label>
                      <input
                        type="text"
                        value={formData.poDate}
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

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Warehouse Details
                      </label>
                      <div className="space-y-2">
                        {formData.warehouseDetails.length > 0 ? (
                          formData.warehouseDetails.map((wh, idx) => (
                            <div key={wh.warehouse_id} className="p-2 bg-gray-100 rounded flex items-center justify-between">
                              <div>
                                <div className="font-medium text-gray-800">{wh.warehouse_name}</div>
                                <div className="text-gray-600 text-sm">{wh.address}</div>
                              </div>
                              <button
                                type="button"
                                className="ml-4 text-red-600 hover:text-red-800"
                                onClick={() => handleDeleteWarehouse(wh.warehouse_id)}
                                title="Delete Warehouse"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))
                        ) : (
                          <div className="text-gray-600 text-sm">No warehouses added</div>
                        )}
                        <div className="mt-2">
                          <button
                            type="button"
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            onClick={() => setShowWarehouseSelector(!showWarehouseSelector)}
                          >
                            {showWarehouseSelector ? 'Cancel' : 'Add Warehouse'}
                          </button>
                          {showWarehouseSelector && (
                            <div className="mt-2 flex items-center space-x-2">
                              <select
                                value={selectedWarehouseId}
                                onChange={(e) => setSelectedWarehouseId(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="">Select a warehouse</option>
                                {allWarehouses
                                  .filter(wh => !formData.warehouseDetails.some(existing => existing.warehouse_id === wh.warehouse_id))
                                  .map(warehouse => (
                                    <option key={warehouse.warehouse_id} value={warehouse.warehouse_id}>
                                      {warehouse.warehouse_name} - {warehouse.address}
                                    </option>
                                  ))}
                              </select>
                              <button
                                onClick={handleAddWarehouse}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                                disabled={!selectedWarehouseId}
                              >
                                Add
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

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

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Item Details Table</h3>
                    <div className="flex items-center space-x-3">
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
                      <button
                        onClick={handleOpenAddItemModal}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Items</span>
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full border border-gray-200 rounded-lg">
                      <thead className="bg-gray-50">
                        <tr>
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
                          <tr key={item.id} className={`border-t border-gray-200 ${item.isNewItem ? 'bg-green-50' : ''}`}>
                            <td className="py-3 px-4 text-gray-600">{item.slNo}</td>
                            <td className="py-3 px-4 text-gray-600">{item.hsnCode}</td>
                            <td className="py-3 px-4 font-medium text-gray-900">
                              {item.itemCode}
                              {item.isNewItem && (
                                <span className="ml-2 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  New
                                </span>
                              )}
                            </td>
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
                              <div className="flex items-center justify-center space-x-2">
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
                                {
                                  <button
                                    onClick={() => handleDeleteItem(item.id)}
                                    className="text-red-600 hover:text-red-800 transition-colors"
                                    title="Delete Item"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                }
                              </div>
                            </td>
                          </tr>
                        ))}
                        {filteredItems.length === 0 && (
                          <tr>
                            <td colSpan={9} className="py-8 text-center text-gray-500">
                              No items found. Click "Add Items" to add new items.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Subtotal:</span>
                      <span className="text-sm font-medium text-gray-900">₹{subtotalAmount.toLocaleString()}</span>
                    </div>
                    
                    {formData.cgst > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600">CGST ({formData.cgst}%):</span>
                        <span className="text-sm font-medium text-gray-900">₹{cgstAmount.toLocaleString()}</span>
                      </div>
                    )}
                    
                    {formData.sgst > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600">SGST ({formData.sgst}%):</span>
                        <span className="text-sm font-medium text-gray-900">₹{sgstAmount.toLocaleString()}</span>
                      </div>
                    )}
                    
                    {formData.igst > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600">IGST ({formData.igst}%):</span>
                        <span className="text-sm font-medium text-gray-900">₹{igstAmount.toLocaleString()}</span>
                      </div>
                    )}
                    
                    <hr className="border-gray-300" />
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
                      <span className="text-2xl font-bold text-gray-900">₹{totalAmount.toLocaleString()}</span>
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

      {/* Add Item Modal */}
      {showAddItemModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[999]">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <ShoppingCart className="w-6 h-6 text-green-600" />
                <h2 className="text-xl font-semibold text-gray-900">Add Items to Purchase Order</h2>
              </div>
              <button
                onClick={handleCloseAddItemModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {loadingItems && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <span className="ml-3 text-gray-600">Loading available items...</span>
                </div>
              )}

              {!loadingItems && (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search items by name or code..."
                          value={itemSearchTerm}
                          onChange={(e) => setItemSearchTerm(e.target.value)}
                          className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-80"
                        />
                      </div>
                      <span className="text-sm text-gray-600">
                        {filteredAvailableItems.length} items available
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={handleSelectAllItems}
                        className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        {selectedItems.size === filteredAvailableItems.length ? 'Deselect All' : 'Select All'}
                      </button>
                      <span className="text-sm text-gray-600">
                        {selectedItems.size} selected
                      </span>
                    </div>
                  </div>

                  <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                    <table className="w-full">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">
                            <input
                              type="checkbox"
                              checked={selectedItems.size === filteredAvailableItems.length && filteredAvailableItems.length > 0}
                              onChange={handleSelectAllItems}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                          </th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Item Code</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Item Name</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">HSN Code</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">UOM</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Category</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAvailableItems.map((item) => (
                          <tr 
                            key={item.id} 
                            className={`border-t border-gray-200 hover:bg-gray-50 cursor-pointer ${
                              selectedItems.has(item.id) ? 'bg-blue-50' : ''
                            }`}
                            onClick={() => handleItemSelection(item.id)}
                          >
                            <td className="py-3 px-4">
                              <input
                                type="checkbox"
                                checked={selectedItems.has(item.id)}
                                onChange={() => handleItemSelection(item.id)}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </td>
                            <td className="py-3 px-4 font-medium text-gray-900">{item.item_code}</td>
                            <td className="py-3 px-4 text-gray-600">{item.item_name}</td>
                            <td className="py-3 px-4 text-gray-600">{item.hsn_code || 'N/A'}</td>
                            <td className="py-3 px-4 text-gray-600">{item.uom_value || 'N/A'}</td>
                            <td className="py-3 px-4 text-gray-600">{item.category_name || 'N/A'}</td>
                          </tr>
                        ))}
                        {filteredAvailableItems.length === 0 && (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-gray-500">
                              {itemSearchTerm ? 'No items found matching your search.' : 'No items available.'}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {selectedItems.size > 0 && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-blue-800">
                          {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} selected
                        </span>
                        <div className="text-xs text-blue-600">
                          Note: Selected items will be added with default rate of ₹0 and quantity of 1. You can edit these values after adding.
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={handleCloseAddItemModal}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSelectedItems}
                disabled={selectedItems.size === 0}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Add {selectedItems.size} Item{selectedItems.size !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AmendPOModal;