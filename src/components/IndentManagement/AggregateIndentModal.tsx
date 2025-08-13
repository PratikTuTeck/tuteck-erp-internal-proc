import React, { useState } from 'react';
import { X, Package, Calendar } from 'lucide-react';

interface AggregateIndentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedIndents: Array<{
    id: string;
    indentNumber: string;
    createdBy: string;
    requestedOn: string;
    warehouseName: string;
    expectedDate: string;
    approvedBy: string;
    approvedOn: string;
    status: string;
    aggregateStatus: string;
    projectName: string;
    noOfItems: number;
    comment: string;
    items: Array<{
      hsnCode: string;
      itemCode: string;
      itemName: string;
      uom: string;
      requiredQty: number;
    }>;
  }>;
}

const AggregateIndentModal: React.FC<AggregateIndentModalProps> = ({ 
  isOpen, 
  onClose, 
  selectedIndents 
}) => {
  const [formData, setFormData] = useState({
    createdDate: new Date().toISOString().split('T')[0],
    expectedDate: ''
  });

  if (!isOpen) return null;

  // Aggregate items from all selected indents
  const aggregatedItems = selectedIndents.reduce((acc, indent) => {
    indent.items.forEach(item => {
      const existingItem = acc.find(aggItem => aggItem.itemCode === item.itemCode);
      if (existingItem) {
        existingItem.requiredQuantity += item.requiredQty;
        existingItem.indentNumbers.push(indent.indentNumber);
      } else {
        acc.push({
          itemCode: item.itemCode,
          itemName: item.itemName,
          uom: item.uom,
          requiredQuantity: item.requiredQty,
          indentNumbers: [indent.indentNumber]
        });
      }
    });
    return acc;
  }, [] as Array<{
    itemCode: string;
    itemName: string;
    uom: string;
    requiredQuantity: number;
    indentNumbers: string[];
  }>);

  const handleSaveAggregate = () => {
    if (!formData.expectedDate) {
      alert('Please select an expected date');
      return;
    }

    // Save aggregation logic
    console.log('Saving aggregated indent:', {
      selectedIndents: selectedIndents.map(i => i.indentNumber),
      aggregatedItems,
      ...formData
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Package className="w-6 h-6 text-green-600" />
            <h2 className="text-xl font-semibold text-gray-900">Aggregate Indents</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Selected Indents Summary */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">Selected Indents for Aggregation</h3>
            <div className="flex flex-wrap gap-2">
              {selectedIndents.map(indent => (
                <span key={indent.id} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {indent.indentNumber}
                </span>
              ))}
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Created Date
              </label>
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  value={formData.createdDate}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expected Date <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  value={formData.expectedDate}
                  onChange={(e) => setFormData({...formData, expectedDate: e.target.value})}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Aggregated Item Details Table */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Aggregated Item Details</h3>
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Item Code</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Item Name</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Indent No.</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">UOM</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Required Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {aggregatedItems.map((item, index) => (
                    <tr key={index} className="border-t border-gray-200">
                      <td className="py-3 px-4 font-medium text-gray-900">{item.itemCode}</td>
                      <td className="py-3 px-4 text-gray-600">{item.itemName}</td>
                      <td className="py-3 px-4 text-gray-600">
                        <div className="flex flex-wrap gap-1">
                          {item.indentNumbers.map(indentNo => (
                            <span key={indentNo} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                              {indentNo}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{item.uom}</td>
                      <td className="py-3 px-4 font-medium text-gray-900">{item.requiredQuantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Total Indents</p>
              <p className="text-2xl font-bold text-gray-900">{selectedIndents.length}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Unique Items</p>
              <p className="text-2xl font-bold text-gray-900">{aggregatedItems.length}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Total Quantity</p>
              <p className="text-2xl font-bold text-gray-900">
                {aggregatedItems.reduce((sum, item) => sum + item.requiredQuantity, 0)}
              </p>
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
            onClick={handleSaveAggregate}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Package className="w-4 h-4" />
            <span>Save and Aggregate</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AggregateIndentModal;