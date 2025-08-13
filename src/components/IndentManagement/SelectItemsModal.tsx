import React, { useState } from 'react';
import { X } from 'lucide-react';

interface SelectItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onItemsSelected: (items: any[]) => void;
  bomId: string;
}

interface BOMItem {
  itemCode: string;
  itemName: string;
  uom: string;
  rate: number;
  availableQuantity: number;
}

const SelectItemsModal: React.FC<SelectItemsModalProps> = ({ 
  isOpen, 
  onClose, 
  onItemsSelected, 
  bomId 
}) => {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  if (!isOpen) return null;

  // Mock BOM items data - in real app, this would be fetched based on bomId
  const bomItems: BOMItem[] = [
    { itemCode: 'ITM-001', itemName: 'Steel Rod', uom: 'Kg', rate: 300, availableQuantity: 500 },
    { itemCode: 'ITM-002', itemName: 'Steel Plate', uom: 'Kg', rate: 250, availableQuantity: 300 },
    { itemCode: 'ITM-003', itemName: 'Steel Wire', uom: 'Meter', rate: 15, availableQuantity: 1000 },
    { itemCode: 'ITM-004', itemName: 'Bolt M12', uom: 'Piece', rate: 5, availableQuantity: 2000 },
    { itemCode: 'ITM-005', itemName: 'Nut M12', uom: 'Piece', rate: 3, availableQuantity: 2500 },
    { itemCode: 'ITM-006', itemName: 'PVC Pipe', uom: 'Meter', rate: 45, availableQuantity: 200 }
  ];

  const handleItemSelect = (itemCode: string) => {
    setSelectedItems(prev => 
      prev.includes(itemCode) 
        ? prev.filter(code => code !== itemCode)
        : [...prev, itemCode]
    );
  };

  const handleSelectAll = () => {
    setSelectedItems(prev => 
      prev.length === bomItems.length ? [] : bomItems.map(item => item.itemCode)
    );
  };

  const handleSaveItems = () => {
    const selectedItemsData = bomItems
      .filter(item => selectedItems.includes(item.itemCode))
      .map(item => ({
        itemCode: item.itemCode,
        itemName: item.itemName,
        uom: item.uom,
        rate: item.rate,
        availableQty: item.availableQuantity,
        requiredQty: 100, // Default value
        allocatedQty: 50, // Default value
        procureQty: 50 // Default value
      }));

    onItemsSelected(selectedItemsData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Select Items from BOM</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4">
                    <input
                      type="checkbox"
                      checked={selectedItems.length === bomItems.length}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Item Code</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Item Name</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">UOM</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Rate</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Available Quantity</th>
                </tr>
              </thead>
              <tbody>
                {bomItems.map((item) => (
                  <tr key={item.itemCode} className="border-t border-gray-200 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item.itemCode)}
                        onChange={() => handleItemSelect(item.itemCode)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-900">{item.itemCode}</td>
                    <td className="py-3 px-4 text-gray-600">{item.itemName}</td>
                    <td className="py-3 px-4 text-gray-600">{item.uom}</td>
                    <td className="py-3 px-4 text-gray-600">₹{item.rate}</td>
                    <td className="py-3 px-4 text-gray-600">{item.availableQuantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            {selectedItems.length} of {bomItems.length} items selected
          </p>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSaveItems}
              disabled={selectedItems.length === 0}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedItems.length > 0
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Save Items
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectItemsModal;