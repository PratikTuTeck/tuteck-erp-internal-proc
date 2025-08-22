/**
 * EditPOModal Component - Edit Purchase Order Modal
 * 
 * This component integrates with the GET API endpoint to fetch real PO data
 * instead of using dummy data. It fetches complete PO details including:
 * - Purchase order information
 * - Vendor details 
 * - Items with their details
 * - Warehouse information
 * - Payment terms
 * 
 * API Endpoint: GET ${VITE_API_BASE_URL}/purchase-orders/:id
 * 
 * Features:
 * - Loading state during API calls
 * - Error handling with retry functionality
 * - Maps API response to form fields
 * - Fallback to dummy data on API failure
 */

import React, { useState, useEffect } from 'react';
import { X, Search, Save, Plus } from 'lucide-react';

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

// API Response interfaces
interface APIResponse {
  success: boolean;
  statusCode: number;
  data: {
    purchase_order: {
      id: string;
      po_number: string;
      po_date: string;
      vendor_id: string;
      bank_name: string;
      account_no: string;
      ifsc_code: string;
      sgst: string;
      igst: string;
      cgst: string;
      gst: string;
      total_amount: string;
      po_status: string;
      po_origin_type: string;
      po_origin_id: string;
      po_origin_number: string;
      comments: string;
    };
    vendor_details: {
      business_name: string;
      contact_no: string;
      email: string;
      state: string;
      district: string;
      city: string;
      pincode: string;
      gst_number: string;
      bank_name: string;
      bank_account_number: string;
      ifsc_code: string;
    } | null;
    items: Array<{
      id: string;
      po_id: string;
      item_id: string;
      qty: string;
      rate: string;
      notes: string;
      item_details: {
        id: string;
        item_code: string;
        item_name: string;
        hsn_code: string;
        description: string;
        category_id: string;
        uom_id: string;
      } | null;
    }>;
    warehouse_details: Array<{
      id: string;
      warehouse_code: string;
      warehouse_name: string;
      address: string;
    }>;
    payment_terms: Array<{
      id: string;
      payment_terms_type: string;
      charges_amount: string;
      charges_percent: string;
      note: string;
    }>;
  };
  clientMessage: string;
  devMessage: string;
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

interface WarehouseFromAPI {
  id: string;
  warehouse_code: string;
  warehouse_name: string;
  address: string;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
  is_deleted: boolean;
  is_active: boolean;
}

const EditPOModal: React.FC<EditPOModalProps> = ({ isOpen, onClose, po }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [poData, setPOData] = useState<APIResponse['data'] | null>(null);
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

  // Track modified items and saving status
  const [modifiedItems, setModifiedItems] = useState<Set<string>>(new Set());
  const [savingItems, setSavingItems] = useState<Set<string>>(new Set());

  // Warehouse management state
  const [availableWarehouses, setAvailableWarehouses] = useState<WarehouseFromAPI[]>([]);
  const [warehouseLoading, setWarehouseLoading] = useState(false);
  const [warehouseError, setWarehouseError] = useState<string | null>(null);
  const [showAddWarehouse, setShowAddWarehouse] = useState(false);
  const [newWarehousesToAdd, setNewWarehousesToAdd] = useState<string[]>([]);
  const [selectedWarehouseToAdd, setSelectedWarehouseToAdd] = useState<string>("");
  const [deletingWarehouses, setDeletingWarehouses] = useState<Set<string>>(new Set());

  // Fetch PO data from API
  useEffect(() => {
    const fetchPOData = async () => {
      if (!isOpen || !po.id) return;
      
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/purchase-order/${po.id}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch PO data: ${response.status} ${response.statusText}`);
        }
        
        const apiResponse: APIResponse = await response.json();
        if (apiResponse.success) {
          setPOData(apiResponse.data);
          
          // Update form data with API response
          const { purchase_order, vendor_details } = apiResponse.data;
          setFormData({
            poDate: new Date(purchase_order.po_date).toISOString().split('T')[0],
            selectedRFQ: purchase_order.po_origin_type === 'RFQ' ? purchase_order.po_origin_number : '',
            selectedIndent: purchase_order.po_origin_type === 'INDENT' ? purchase_order.po_origin_number : '',
            selectedVendor: purchase_order.vendor_id,
            selectedWarehouses: apiResponse.data.warehouse_details.map(w => w.id),
            vendorAddress: vendor_details ? 
              `${vendor_details.city}, ${vendor_details.district}, ${vendor_details.state} - ${vendor_details.pincode}` : '',
            bankName: purchase_order.bank_name,
            gstNo: purchase_order.gst,
            accountNo: purchase_order.account_no,
            ifscCode: purchase_order.ifsc_code,
            igst: Number(purchase_order.igst) || 0,
            sgst: Number(purchase_order.sgst) || 0,
            cgst: Number(purchase_order.cgst) || 0
          });

          // Update payment terms
          setPaymentTerms(apiResponse.data.payment_terms.map(term => ({
            id: term.id,
            terms: term.payment_terms_type,
            amount: term.charges_amount || `${term.charges_percent}%`,
            reason: term.note
          })));

          // Update items
          setItems(apiResponse.data.items.map((item, index) => ({
            id: item.id,
            itemCode: item.item_details?.item_code || `ITEM-${index + 1}`,
            itemName: item.item_details?.item_name || 'N/A',
            categoryName: 'N/A', // This would need to be fetched from category_id
            uom: 'N/A', // This would need to be fetched from uom_id
            hsnCode: item.item_details?.hsn_code || 'N/A',
            rate: Number(item.rate) || 0,
            quantity: Number(item.qty) || 0,
            total: (Number(item.rate) || 0) * (Number(item.qty) || 0)
          })));
        }
      } catch (error) {
        console.error('Error fetching PO data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load PO data');
        // Keep using dummy data on error - show a notification or error message
      } finally {
        setLoading(false);
      }
    };

    fetchPOData();
  }, [isOpen, po.id]);

  // Fetch available warehouses from API
  useEffect(() => {
    const fetchWarehouses = async () => {
      if (!isOpen) return;
      
      setWarehouseLoading(true);
      setWarehouseError(null);
      try {
        const response = await fetch(`${import.meta.env.VITE_IMS_API_BASE_URL}/warehouse`);
        if (!response.ok) {
          throw new Error(`Failed to fetch warehouses: ${response.status} ${response.statusText}`);
        }
        
        const warehouseData = await response.json();
        
        // Handle different response formats
        let warehousesList: WarehouseFromAPI[] = [];
        if (Array.isArray(warehouseData)) {
          warehousesList = warehouseData;
        } else if (warehouseData.success && Array.isArray(warehouseData.data)) {
          warehousesList = warehouseData.data;
        } else if (warehouseData.data && Array.isArray(warehouseData.data)) {
          warehousesList = warehouseData.data;
        } else {
          console.warn('Unexpected warehouse API response format:', warehouseData);
          warehousesList = [];
        }
        
        // Filter only active warehouses
        const activeWarehouses = warehousesList.filter(wh => wh.is_active && !wh.is_deleted);
        setAvailableWarehouses(activeWarehouses);
      } catch (error) {
        console.error('Error fetching warehouses:', error);
        setWarehouseError(error instanceof Error ? error.message : 'Failed to load warehouses');
      } finally {
        setWarehouseLoading(false);
      }
    };

    fetchWarehouses();
  }, [isOpen]);

  if (!isOpen) return null;

  // Use actual RFQ data if available, otherwise use dummy data
  const rfqs = poData?.purchase_order?.po_origin_type === 'RFQ' ? [
    { 
      id: poData.purchase_order.po_origin_number || 'RFQ-001', 
      name: poData.purchase_order.po_origin_number || 'Selected RFQ'
    }
  ] : [
    { id: 'RFQ-001', name: 'RFQ-001 - Construction Materials' },
    { id: 'RFQ-002', name: 'RFQ-002 - IT Equipment' }
  ];

  // Use actual Indent data if available, otherwise use dummy data  
  const indents = poData?.purchase_order?.po_origin_type === 'INDENT' ? [
    { 
      id: poData.purchase_order.po_origin_number || 'IND-001', 
      name: poData.purchase_order.po_origin_number || 'Selected Indent'
    }
  ] : [
    { id: 'IND-001', name: 'IND-001 - Office Equipment' },
    { id: 'IND-002', name: 'IND-002 - Construction Materials' }
  ];

  // Use actual vendor data if available, otherwise use dummy data
  const vendors = poData?.vendor_details ? [
    { 
      id: poData.purchase_order.vendor_id, 
      name: poData.vendor_details.business_name,
      address: `${poData.vendor_details.city}, ${poData.vendor_details.district}, ${poData.vendor_details.state} - ${poData.vendor_details.pincode}`
    }
  ] : [
    { id: 'V001', name: 'TechCorp Solutions Pvt Ltd', address: '123 Tech Street, Bangalore - 560001' },
    { id: 'V002', name: 'Innovate India Limited', address: '456 Innovation Hub, Mumbai - 400001' }
  ];

  // Use actual warehouse data if available, otherwise use dummy data
  const warehouses = poData?.warehouse_details?.length ? 
    poData.warehouse_details.map(warehouse => ({
      id: warehouse.id,
      name: warehouse.warehouse_name
    })) : [
    { id: 'WH-001', name: 'Warehouse A' },
    { id: 'WH-002', name: 'Warehouse B' },
    { id: 'WH-003', name: 'Warehouse C' }
  ];

  // Handle deleting warehouse from PO
  const handleDeleteWarehouse = async (warehouseId: string) => {
    setDeletingWarehouses(prev => new Set(prev).add(warehouseId));
    
    try {
      const poId = poData?.purchase_order?.id || po.id;
      const payload = {
        is_active: false
      };

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/purchase-order-warehouse/status?po_id=${poId}&warehouse_id=${warehouseId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Failed to delete warehouse: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('Warehouse deleted successfully:', result);
        console.log(result.clientMessage);

        // Update local state to remove the warehouse
        setFormData(prev => ({
          ...prev,
          selectedWarehouses: prev.selectedWarehouses.filter(id => id !== warehouseId)
        }));
      } else {
        throw new Error(result.clientMessage || 'Failed to delete warehouse');
      }

    } catch (error) {
      console.error('Error deleting warehouse:', error);
      alert(`Error deleting warehouse: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setDeletingWarehouses(prev => {
        const newSet = new Set(prev);
        newSet.delete(warehouseId);
        return newSet;
      });
    }
  };

  const handleItemChange = (itemId: string, field: 'rate' | 'quantity', value: number) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        const updatedItem = { ...item, [field]: value };
        updatedItem.total = updatedItem.rate * updatedItem.quantity;
        
        // Mark item as modified
        setModifiedItems(prev => new Set(prev).add(itemId));
        
        return updatedItem;
      }
      return item;
    }));
  };

  const handleItemSave = async (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    // Find the original API item data to get item_id
    const apiItem = poData?.items?.find(apiItem => apiItem.id === itemId);
    if (!apiItem) {
      console.error('Cannot find API item data for save');
      return;
    }

    setSavingItems(prev => new Set(prev).add(itemId));

    try {
      const payload = {
        po_id: poData?.purchase_order?.id || po.id,
        vendor_id: poData?.purchase_order?.vendor_id || 'default_vendor', // Get vendor_id from purchase_order
        item_id: apiItem.item_id,
        qty: item.quantity,
        rate: item.rate
      };

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/purchase-order-details/update-qty-rate`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Failed to update item: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Item update successful:', result);

      // Remove from modified items after successful save
      setModifiedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });

    } catch (error) {
      console.error('Error updating item:', error);
      // You can add toast notification here for error handling
    } finally {
      setSavingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  const filteredItems = items.filter(item =>
    item.itemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.itemName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalAmount = items.reduce((sum, item) => sum + item.total, 0);

  const handleSave = async () => {
    const updateData = {
      bank_name: formData.bankName,
      gst: formData.gstNo,
      account_no: formData.accountNo,
      ifsc_code: formData.ifscCode,
      igst: formData.igst,
      sgst: formData.sgst,
      cgst: formData.cgst,
      total_amount: totalAmount
    };

    console.log('Updating PO:', updateData);

    try {
      // Update PO data
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/purchase-order/${po.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update PO');
      }
      
      const result = await response.json();
      console.log('Update successful:', result);

      // Save newly added warehouses if any
      if (newWarehousesToAdd.length > 0) {
        const warehouseRecords = newWarehousesToAdd.map(warehouseId => ({
          po_id: poData?.purchase_order?.id || po.id,
          warehouse_id: warehouseId
        }));

        const warehouseResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/purchase-order-warehouse/bulk`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(warehouseRecords)
        });

        if (!warehouseResponse.ok) {
          throw new Error('Failed to save warehouses');
        }

        const warehouseResult = await warehouseResponse.json();
        
        if (warehouseResult.success) {
          console.log('Warehouses saved successfully:', warehouseResult);
          console.log(warehouseResult.clientMessage);
        } else {
          throw new Error(warehouseResult.clientMessage || 'Failed to save warehouses');
        }
      }
      
      onClose();
    } catch (error) {
      console.error('Error updating PO:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full mx-4 max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-semibold text-gray-900">Edit Purchase Order</h2>
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              {poData?.purchase_order?.po_number || po.poNo}
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
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading PO data...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="text-red-600 mb-4">
                <X className="w-12 h-12" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load PO Data</h3>
              <p className="text-gray-600 text-center mb-4">{error}</p>
              <button
                onClick={() => {
                  setError(null);
                  // Retry the fetch by re-triggering the useEffect
                  const fetchPOData = async () => {
                    setLoading(true);
                    setError(null);
                    try {
                      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/purchase-orders/${po.id}`);
                      if (!response.ok) {
                        throw new Error(`Failed to fetch PO data: ${response.status} ${response.statusText}`);
                      }
                      
                      const apiResponse: APIResponse = await response.json();
                      if (apiResponse.success) {
                        setPOData(apiResponse.data);
                        
                        // Update form data with API response
                        const { purchase_order, vendor_details } = apiResponse.data;
                        setFormData({
                          poDate: new Date(purchase_order.po_date).toISOString().split('T')[0],
                          selectedRFQ: purchase_order.po_origin_type === 'RFQ' ? purchase_order.po_origin_number : '',
                          selectedIndent: purchase_order.po_origin_type === 'INDENT' ? purchase_order.po_origin_number : '',
                          selectedVendor: purchase_order.vendor_id,
                          selectedWarehouses: apiResponse.data.warehouse_details.map(w => w.id),
                          vendorAddress: vendor_details ? 
                            `${vendor_details.city}, ${vendor_details.district}, ${vendor_details.state} - ${vendor_details.pincode}` : '',
                          bankName: purchase_order.bank_name,
                          gstNo: purchase_order.gst,
                          accountNo: purchase_order.account_no,
                          ifscCode: purchase_order.ifsc_code,
                          igst: Number(purchase_order.igst) || 0,
                          sgst: Number(purchase_order.sgst) || 0,
                          cgst: Number(purchase_order.cgst) || 0
                        });

                        // Update payment terms
                        setPaymentTerms(apiResponse.data.payment_terms.map(term => ({
                          id: term.id,
                          terms: term.payment_terms_type,
                          amount: term.charges_amount || `${term.charges_percent}%`,
                          reason: term.note
                        })));

                        // Update items
                        setItems(apiResponse.data.items.map((item, index) => ({
                          id: item.id,
                          itemCode: item.item_details?.item_code || `ITEM-${index + 1}`,
                          itemName: item.item_details?.item_name || 'N/A',
                          categoryName: 'N/A', // This would need to be fetched from category_id
                          uom: 'N/A', // This would need to be fetched from uom_id
                          hsnCode: item.item_details?.hsn_code || 'N/A',
                          rate: Number(item.rate) || 0,
                          quantity: Number(item.qty) || 0,
                          total: (Number(item.rate) || 0) * (Number(item.qty) || 0)
                        })));
                      }
                    } catch (error) {
                      console.error('Error fetching PO data:', error);
                      setError(error instanceof Error ? error.message : 'Failed to load PO data');
                    } finally {
                      setLoading(false);
                    }
                  };
                  fetchPOData();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : (
            <>
              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                PO Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.poDate}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
              />
            </div>

            {(poData?.purchase_order?.po_origin_type === 'RFQ' || po.type === 'Quotation') ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select RFQ <span className="text-red-500">*</span>
                </label>
                <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed flex items-center min-h-[42px]">
                  {(() => {
                    const selected = rfqs.find(rfq => rfq.id === formData.selectedRFQ);
                    console.log("selected", selected);
                    
                    return selected ? selected.id : 'Select RFQ';
                  })()}
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Indent <span className="text-red-500">*</span>
                </label>
                <select 
                  value={formData.selectedIndent}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
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
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
              >
                <option value="">Select Vendor</option>
                {vendors.map(vendor => (
                  <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delivery Warehouse
              </label>
              
              {/* Existing Warehouses */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Current Warehouses</h4>
                {formData.selectedWarehouses.length > 0 ? (
                  <div className="space-y-2">
                    {formData.selectedWarehouses.map(warehouseId => {
                      const warehouse = warehouses.find(w => w.id === warehouseId);
                      const isDeleting = deletingWarehouses.has(warehouseId);
                      
                      return (
                        <div key={warehouseId} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">{warehouse?.name}</p>
                            <p className="text-sm text-gray-600">ID: {warehouseId}</p>
                          </div>
                          <button
                            onClick={() => handleDeleteWarehouse(warehouseId)}
                            disabled={isDeleting}
                            className="inline-flex items-center px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed transition-colors"
                            title="Delete warehouse"
                          >
                            {isDeleting ? (
                              <>
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                                Deleting...
                              </>
                            ) : (
                              'Delete'
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No warehouses assigned</p>
                )}
              </div>

              {/* Add Warehouse Section */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-900">Add Warehouses</h4>
                  <button
                    onClick={() => setShowAddWarehouse(!showAddWarehouse)}
                    className="inline-flex items-center px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus size={16} className="mr-1" />
                    {showAddWarehouse ? 'Cancel' : 'Add Warehouse'}
                  </button>
                </div>

                {showAddWarehouse && (
                  <div className="space-y-3">
                    {warehouseLoading ? (
                      <div className="text-center py-4">
                        <div className="inline-flex items-center text-gray-600">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                          Loading warehouses...
                        </div>
                      </div>
                    ) : warehouseError ? (
                      <div className="text-center py-4 text-red-600">
                        <p>Error loading warehouses: {warehouseError}</p>
                        <button
                          onClick={() => window.location.reload()}
                          className="mt-2 text-sm underline hover:no-underline"
                        >
                          Retry
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <select 
                          value={selectedWarehouseToAdd}
                          onChange={(e) => {
                            setSelectedWarehouseToAdd(e.target.value);
                            if (e.target.value && !newWarehousesToAdd.includes(e.target.value)) {
                              setNewWarehousesToAdd(prev => [...prev, e.target.value]);
                              setSelectedWarehouseToAdd(""); // Reset dropdown
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select a warehouse to add</option>
                          {availableWarehouses
                            .filter(warehouse => 
                              !formData.selectedWarehouses.includes(warehouse.id) && 
                              !newWarehousesToAdd.includes(warehouse.id)
                            )
                            .map(warehouse => (
                              <option key={warehouse.id} value={warehouse.id}>
                                {warehouse.warehouse_name} ({warehouse.warehouse_code})
                              </option>
                            ))}
                        </select>

                        {/* Show newly selected warehouses */}
                        {newWarehousesToAdd.length > 0 && (
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Newly Added Warehouses:</h5>
                            <div className="space-y-2">
                              {newWarehousesToAdd.map(warehouseId => {
                                const warehouse = availableWarehouses.find(w => w.id === warehouseId);
                                if (!warehouse) {
                                  console.log(`Warehouse not found for ID: ${warehouseId}`, availableWarehouses);
                                  return (
                                    <div key={warehouseId} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                      <p className="text-red-600">Warehouse not found (ID: {warehouseId})</p>
                                    </div>
                                  );
                                }
                                return (
                                  <div key={warehouseId} className="flex items-center justify-between p-1 bg-green-50 border border-blue-200 rounded-lg">
                                    <div>
                                      <p className="font-medium text-gray-900">{warehouse.warehouse_name}</p>
                                      <p className="text-sm text-gray-600">{warehouse.warehouse_code}</p>
                                      <p className="text-xs text-gray-500">{warehouse.address}</p>
                                    </div>
                                    <button
                                      onClick={() => setNewWarehousesToAdd(prev => prev.filter(id => id !== warehouseId))}
                                      className="text-red-600 hover:text-red-800 p-1"
                                      title="Remove warehouse"
                                    >
                                      ×
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        
                        {/* Debug information - remove this after testing */}
                        {/* {process.env.NODE_ENV === 'development' && (
                          <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                            <p>Debug Info:</p>
                            <p>Available warehouses: {availableWarehouses.length}</p>
                            <p>New warehouses to add: {JSON.stringify(newWarehousesToAdd)}</p>
                            <p>Selected warehouses: {JSON.stringify(formData.selectedWarehouses)}</p>
                          </div>
                        )} */}
                      </div>
                    )}
                  </div>
                )}
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

            {/* Warehouse Delivery Addresses */}
            {formData.selectedWarehouses.length > 0 && (
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Warehouse Delivery Addresses
                </label>
                <div className="space-y-2">
                  {formData.selectedWarehouses.map(warehouseId => {
                    const warehouse = warehouses.find(w => w.id === warehouseId);
                    // Use actual warehouse address if available, otherwise use mock address
                    const address = poData?.warehouse_details?.find(w => w.id === warehouseId)?.address || 
                      `${warehouse?.name} - 123 Industrial Area, Sector ${warehouseId.slice(-1)}, City - 40000${warehouseId.slice(-1)}`;
                    return (
                      <div key={warehouseId} className="p-3 bg-gray-50 rounded-lg">
                        <p className="font-medium text-gray-900">{warehouse?.name}</p>
                        <p className="text-sm text-gray-600">{address}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
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
          {/* <div>
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
          </div> */}

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
                    <th className="text-center py-3 px-4 font-medium text-gray-900">Action</th>
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
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleItemSave(item.id)}
                          disabled={savingItems.has(item.id) || !modifiedItems.has(item.id)}
                          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                            modifiedItems.has(item.id)
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          } ${savingItems.has(item.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {savingItems.has(item.id) ? (
                            <div className="flex items-center space-x-2">
                              <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                              <span>Saving</span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-1">
                              <Save className="w-3 h-3" />
                              <span>Save</span>
                            </div>
                          )}
                        </button>
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
          </>
          )}
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