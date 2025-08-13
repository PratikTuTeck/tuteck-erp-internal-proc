import React, { useState } from 'react';
import { X, Search } from 'lucide-react';
import { Select, MenuItem, Chip, FormControl, InputLabel, Box } from '@mui/material';
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
  const [formData, setFormData] = useState({
    rfqDate: new Date().toISOString().split('T')[0],
    endDate: '',
    description: ''
  });

  const [aggregatedItems, setAggregatedItems] = useState<AggregatedItem[]>([]);

  if (!isOpen) return null;

  const indents = [
    { id: 'IND-001', name: 'IND-001 - Office Equipment' },
    { id: 'IND-002', name: 'IND-002 - IT Infrastructure' },
    { id: 'IND-003', name: 'IND-003 - Safety Equipment' }
  ];

  const warehouses = [
    { id: 'WH-001', name: 'Warehouse A' },
    { id: 'WH-002', name: 'Warehouse B' },
    { id: 'WH-003', name: 'Warehouse C' }
  ];

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

  const handleSaveRFQ = () => {
    if (selectedIndents.length === 0 || !formData.endDate) {
      alert('Please select at least one indent and fill all mandatory fields');
      return;
    }

    const hasUnselectedVendors = aggregatedItems.some(item => item.selectedVendors.length === 0);
    if (hasUnselectedVendors) {
      alert('Please select vendors for all items');
      return;
    }

    console.log('Saving RFQ:', { selectedIndents, selectedWarehouses, formData, aggregatedItems });
    onClose();
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
                <select 
                  multiple
                  value={selectedIndents}
                  onChange={(e) => {
                    const values = Array.from(e.target.selectedOptions, option => option.value);
                    setSelectedIndents(values);
                    if (values.length > 0) {
                      const aggregated = aggregateItems(values);
                      setAggregatedItems(aggregated);
                    } else {
                      setAggregatedItems([]);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
                >
                  {indents.map(indent => (
                    <option key={indent.id} value={indent.id}>{indent.name}</option>
                  ))}
                </select>
                
                {/* Selected Indents Capsules */}
                {selectedIndents.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedIndents.map(indentId => {
                      const indent = indents.find(i => i.id === indentId);
                      return (
                        <span key={indentId} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                          {indent?.name}
                          <button
                            onClick={() => handleRemoveIndent(indentId)}
                            className="ml-2 text-blue-600 hover:text-blue-800"
                          >
                            ×
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Warehouses
                </label>
                <select 
                  multiple
                  value={selectedWarehouses}
                  onChange={(e) => {
                    const values = Array.from(e.target.selectedOptions, option => option.value);
                    setSelectedWarehouses(values);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
                >
                  {warehouses.map(warehouse => (
                    <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
                  ))}
                </select>
                
                {/* Selected Warehouses Capsules */}
                {selectedWarehouses.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedWarehouses.map(warehouseId => {
                      const warehouse = warehouses.find(w => w.id === warehouseId);
                      return (
                        <span key={warehouseId} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                          {warehouse?.name}
                          <button
                            onClick={() => handleRemoveWarehouse(warehouseId)}
                            className="ml-2 text-green-600 hover:text-green-800"
                          >
                            ×
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
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
                          <td className="py-3 px-4 text-gray-600">
                            <div className="flex flex-wrap gap-1">
                              {item.sourceIndents.map(indentId => (
                                <span key={indentId} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                  {indentId}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-600">
                            {item.selectedVendors.length > 0 
                              ? item.selectedVendors.join(', ')
                              : 'No vendors selected'
                            }
                          </td>
                          <td className="py-3 px-4 text-center">
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
              disabled={selectedIndents.length === 0 || !formData.endDate}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedIndents.length > 0 && formData.endDate
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Save RFQ
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