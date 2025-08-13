import React, { useState } from 'react';
import { X, Search } from 'lucide-react';
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

const CreateRFQModal: React.FC<CreateRFQModalProps> = ({ isOpen, onClose }) => {
  const [showSelectVendors, setShowSelectVendors] = useState(false);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    selectedIndent: '',
    deliveryLocation: '',
    rfqDate: new Date().toISOString().split('T')[0],
    endDate: '',
    description: ''
  });

  const [itemDetails, setItemDetails] = useState<ItemDetail[]>([
    {
      itemCode: 'ITM-001',
      itemName: 'Steel Rod',
      uom: 'Kg',
      procureQty: 100,
      selectedVendors: []
    },
    {
      itemCode: 'ITM-002',
      itemName: 'Steel Plate',
      uom: 'Kg',
      procureQty: 50,
      selectedVendors: []
    }
  ]);

  if (!isOpen) return null;

  const indents = [
    { id: 'IND-001', name: 'IND-001 - Office Equipment', location: 'Warehouse A' },
    { id: 'IND-002', name: 'IND-002 - IT Infrastructure', location: 'Warehouse B' },
    { id: 'IND-003', name: 'IND-003 - Safety Equipment', location: 'Warehouse C' }
  ];

  const handleIndentChange = (indentId: string) => {
    const selectedIndentData = indents.find(indent => indent.id === indentId);
    setFormData({
      ...formData,
      selectedIndent: indentId,
      deliveryLocation: selectedIndentData?.location || ''
    });
  };

  const handleSelectVendors = (itemIndex: number) => {
    setSelectedItemIndex(itemIndex);
    setShowSelectVendors(true);
  };

  const handleVendorsSelected = (vendors: string[]) => {
    if (selectedItemIndex !== null) {
      const updatedItems = [...itemDetails];
      updatedItems[selectedItemIndex].selectedVendors = vendors;
      setItemDetails(updatedItems);
    }
    setShowSelectVendors(false);
    setSelectedItemIndex(null);
  };

  const handleSaveRFQ = () => {
    if (!formData.selectedIndent || !formData.endDate) {
      alert('Please fill all mandatory fields');
      return;
    }

    const hasUnselectedVendors = itemDetails.some(item => item.selectedVendors.length === 0);
    if (hasUnselectedVendors) {
      alert('Please select vendors for all items');
      return;
    }

    console.log('Saving RFQ:', { formData, itemDetails });
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
                  Select Indent <span className="text-red-500">*</span>
                </label>
                <select 
                  value={formData.selectedIndent}
                  onChange={(e) => handleIndentChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Indent</option>
                  {indents.map(indent => (
                    <option key={indent.id} value={indent.id}>{indent.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delivery Location
                </label>
                <input
                  type="text"
                  value={formData.deliveryLocation}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  RFQ Date
                </label>
                <input
                  type="date"
                  value={formData.rfqDate}
                  onChange={(e) => setFormData({...formData, rfqDate: e.target.value})}
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
                  onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter RFQ description"
              />
            </div>

            {/* Item Details Table */}
            {formData.selectedIndent && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Item Details from Indent</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Item</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">UOM</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Procure Qty</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Vendor Option</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-900">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {itemDetails.map((item, index) => (
                        <tr key={index} className="border-t border-gray-200">
                          <td className="py-3 px-4 font-medium text-gray-900">
                            {item.itemCode} - {item.itemName}
                          </td>
                          <td className="py-3 px-4 text-gray-600">{item.uom}</td>
                          <td className="py-3 px-4 text-gray-600">{item.procureQty}</td>
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
              disabled={!formData.selectedIndent || !formData.endDate}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                formData.selectedIndent && formData.endDate
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
          itemName={itemDetails[selectedItemIndex].itemName}
        />
      )}
    </>
  );
};

export default CreateRFQModal;