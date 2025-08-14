import React, { useState } from 'react';
import { X } from 'lucide-react';
import axios from 'axios';
import { Select, MenuItem, Chip, FormControl, InputLabel, Box, OutlinedInput } from '@mui/material';
import SelectVendorsModal from './SelectVendorsModal';

interface CreateRFQModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ItemDetail {
  itemCode: string;
  itemName: string;
  uom: string;
  procureQty: number;
  selectedVendors: string[];
}

interface AggregatedItem {
  itemCode: string;
  itemName: string;
  uom: string;
  totalProcureQty: number;
  selectedVendors: string[];
  sourceIndents: string[];
}

const CreateRFQModal: React.FC<CreateRFQModalProps> = ({ isOpen, onClose }) => {
  const [showSelectVendors, setShowSelectVendors] = useState(false);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
  const [selectedIndents, setSelectedIndents] = useState<string[]>([]);
  const [selectedWarehouses, setSelectedWarehouses] = useState<string[]>([]);
  const [indents, setIndents] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    rfqDate: new Date().toISOString().split('T')[0],
    endDate: '',
    description: ''
  });

  const [aggregatedItems, setAggregatedItems] = useState<AggregatedItem[]>([]);

  // Fetch data on component mount
  React.useEffect(() => {
    if (isOpen) {
      fetchIndents();
      fetchWarehouses();
    }
  }, [isOpen]);

  const fetchIndents = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/indent?approval_status=APPROVED`);
      if (response.data?.data) {
        const mappedIndents = response.data.data.map((indent: any) => ({
          id: indent.indent_id,
          name: `${indent.indent_number} - ${indent.project_name || 'Project'}`
        }));
        setIndents(mappedIndents);
      }
    } catch (err) {
      console.error('Error fetching indents:', err);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/warehouse`);
      if (response.data?.data) {
        const mappedWarehouses = response.data.data.map((warehouse: any) => ({
          id: warehouse.warehouse_id,
          name: warehouse.warehouse_name
        }));
        setWarehouses(mappedWarehouses);
      }
    } catch (err) {
      console.error('Error fetching warehouses:', err);
    }
  };

  if (!isOpen) return null;

  // Mock data for indent items
  const indentItems = {
    'IND-001': [
      { itemCode: 'ITM-001', itemName: 'Steel Rod', uom: 'Kg', procureQty: 10 },
      { itemCode: 'ITM-002', itemName: 'Steel Plate', uom: 'Kg', procureQty: 10 }
    ],
    'IND-002': [
      { itemCode: 'ITM-001', itemName: 'Steel Rod', uom: 'Kg', procureQty: 10 },
      { itemCode: 'ITM-003', itemName: 'Steel Wire', uom: 'Meter', procureQty: 2 }
    ],
    'IND-003': [
      { itemCode: 'ITM-004', itemName: 'Safety Helmet', uom: 'Piece', procureQty: 5 }
    ]
  };

  const aggregateItems = (indentIds: string[]) => {
    const itemMap = new Map<string, AggregatedItem>();
    
    indentIds.forEach(indentId => {
      const items = indentItems[indentId as keyof typeof indentItems] || [];
      items.forEach(item => {
        const key = item.itemCode;
        if (itemMap.has(key)) {
          const existing = itemMap.get(key)!;
          existing.totalProcureQty += item.procureQty;
          existing.sourceIndents.push(indentId);
        } else {
          itemMap.set(key, {
            itemCode: item.itemCode,
            itemName: item.itemName,
            uom: item.uom,
            totalProcureQty: item.procureQty,
            selectedVendors: [],
            sourceIndents: [indentId]
          });
        }
      });
    });
    
    return Array.from(itemMap.values());
  };

  const handleIndentChange = (indentId: string) => {
    const newSelectedIndents = selectedIndents.includes(indentId) 
      ? selectedIndents.filter(id => id !== indentId)
      : [...selectedIndents, indentId];
    
    setSelectedIndents(newSelectedIndents);
    
    // Aggregate items from selected indents
    if (newSelectedIndents.length > 0) {
      const aggregated = aggregateItems(newSelectedIndents);
      setAggregatedItems(aggregated);
    } else {
      setAggregatedItems([]);
    }
  };

  const handleRemoveIndent = (indentId: string) => {
    const newSelectedIndents = selectedIndents.filter(id => id !== indentId);
    setSelectedIndents(newSelectedIndents);
    
    if (newSelectedIndents.length > 0) {
      const aggregated = aggregateItems(newSelectedIndents);
      setAggregatedItems(aggregated);
    } else {
      setAggregatedItems([]);
    }
  };

  const handleWarehouseChange = (warehouseId: string) => {
    setSelectedWarehouses(prev => 
      prev.includes(warehouseId) 
        ? prev.filter(id => id !== warehouseId)
        : [...prev, warehouseId]
    );
  };

  const handleRemoveWarehouse = (warehouseId: string) => {
    setSelectedWarehouses(prev => prev.filter(id => id !== warehouseId));
  };

  const handleSelectVendors = (itemIndex: number) => {
    setSelectedItemIndex(itemIndex);
    setShowSelectVendors(true);
  };

  const handleVendorsSelected = (vendors: string[]) => {
    if (selectedItemIndex !== null) {
      const updatedItems = [...aggregatedItems];
      updatedItems[selectedItemIndex].selectedVendors = vendors;
      setAggregatedItems(updatedItems);
    }
    setShowSelectVendors(false);
    setSelectedItemIndex(null);
  };

  const handleSaveRFQ = async () => {
    if (selectedIndents.length === 0 || !formData.endDate) {
      alert('Please select at least one indent and fill all mandatory fields');
      return;
    }

    const hasUnselectedVendors = aggregatedItems.some(item => item.selectedVendors.length === 0);
    if (hasUnselectedVendors) {
      alert('Please select vendors for all items');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        indent_ids: selectedIndents,
        warehouse_ids: selectedWarehouses,
        rfq_date: formData.rfqDate,
        end_date: formData.endDate,
        description: formData.description,
        items: aggregatedItems.map(item => ({
          item_id: item.itemCode, // This should be the actual item ID
          selected_vendor_ids: item.selectedVendors
        }))
      };

      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/rfq`, payload);
      
      if (response.data.success) {
        alert('RFQ created successfully!');
        onClose();
      } else {
        alert('Failed to create RFQ');
      }
    } catch (error) {
      console.error('Error creating RFQ:', error);
      alert('Error creating RFQ. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Create RFQ</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Indents <span className="text-red-500">*</span>
                </label>
                <FormControl fullWidth>
                  <Select
                    multiple
                    value={selectedIndents}
                    onChange={(e) => {
                      const values = typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value;
                      setSelectedIndents(values);
                      if (values.length > 0) {
                        const aggregated = aggregateItems(values);
                        setAggregatedItems(aggregated);
                      } else {
                        setAggregatedItems([]);
                      }
                    }}
                    input={<OutlinedInput />}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => {
                          const indent = indents.find(i => i.id === value);
                          return (
                            <Chip
                              key={value}
                              label={indent?.name}
                              onDelete={() => handleRemoveIndent(value)}
                              size="small"
                            />
                          );
                        })}
                      </Box>
                    )}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '8px',
                      }
                    }}
                  >
                    {indents.map(indent => (
                      <MenuItem key={indent.id} value={indent.id}>
                        {indent.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Warehouses
                </label>
                <FormControl fullWidth>
                  <Select
                    multiple
                    value={selectedWarehouses}
                    onChange={(e) => {
                      const values = typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value;
                      setSelectedWarehouses(values);
                    }}
                    input={<OutlinedInput />}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => {
                          const warehouse = warehouses.find(w => w.id === value);
                          return (
                            <Chip
                              key={value}
                              label={warehouse?.name}
                              onDelete={() => handleRemoveWarehouse(value)}
                              size="small"
                            />
                          );
                        })}
                      </Box>
                    )}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '8px',
                      }
                    }}
                  >
                    {warehouses.map(warehouse => (
                      <MenuItem key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  RFQ Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.rfqDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, rfqDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter RFQ description..."
              />
            </div>

            {/* Aggregated Items Table */}
            {aggregatedItems.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Items from Selected Indents</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="py-3 px-4 text-left text-sm font-medium text-gray-700 border-b">Item Code</th>
                        <th className="py-3 px-4 text-left text-sm font-medium text-gray-700 border-b">Item Name</th>
                        <th className="py-3 px-4 text-left text-sm font-medium text-gray-700 border-b">UOM</th>
                        <th className="py-3 px-4 text-left text-sm font-medium text-gray-700 border-b">Total Qty</th>
                        <th className="py-3 px-4 text-left text-sm font-medium text-gray-700 border-b">Source Indents</th>
                        <th className="py-3 px-4 text-left text-sm font-medium text-gray-700 border-b">Selected Vendors</th>
                        <th className="py-3 px-4 text-center text-sm font-medium text-gray-700 border-b">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {aggregatedItems.map((item, index) => (
                        <tr key={item.itemCode} className="hover:bg-gray-50">
                          <td className="py-3 px-4 text-gray-900 border-b">{item.itemCode}</td>
                          <td className="py-3 px-4 text-gray-900 border-b">{item.itemName}</td>
                          <td className="py-3 px-4 text-gray-600 border-b">{item.uom}</td>
                          <td className="py-3 px-4 text-gray-600 border-b">{item.totalProcureQty}</td>
                          <td className="py-3 px-4 text-gray-600 border-b">
                            <div className="flex flex-wrap gap-1">
                              {item.sourceIndents.map(indentId => (
                                <span key={indentId} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                  {indentId}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-600 border-b">
                            {item.selectedVendors.length > 0 
                              ? item.selectedVendors.join(', ')
                              : 'No vendors selected'
                            }
                          </td>
                          <td className="py-3 px-4 text-center border-b">
                            <button
                              onClick={() => handleSelectVendors(index)}
                              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                            >
                              Select Vendors
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
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
              onClick={handleSaveRFQ}
              disabled={selectedIndents.length === 0 || !formData.endDate || loading}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedIndents.length > 0 && formData.endDate && !loading
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {loading ? 'Saving...' : 'Save RFQ'}
            </button>
          </div>
        </div>
      </div>

      {showSelectVendors && selectedItemIndex !== null && (
        <SelectVendorsModal
          isOpen={showSelectVendors}
          onClose={() => {
            setShowSelectVendors(false);
            setSelectedItemIndex(null);
          }}
          onVendorsSelected={handleVendorsSelected}
          itemName={aggregatedItems[selectedItemIndex].itemName}
        />
      )}
    </>
  );
};

export default CreateRFQModal;