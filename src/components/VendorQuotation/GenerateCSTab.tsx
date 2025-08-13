import React, { useState } from 'react';
import { Eye, Users } from 'lucide-react';
import SelectVendorsForCSModal from './SelectVendorsForCSModal';

interface CSItem {
  itemCode: string;
  itemName: string;
  vendorOptions: string[];
  selectedVendors: string[];
  requiredQty: number;
}

const GenerateCSTab: React.FC = () => {
  const [showSelectVendors, setShowSelectVendors] = useState(false);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
  const [selectedRFQ, setSelectedRFQ] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    rfqDate: '2024-07-10',
    endDate: '2024-07-20',
    warehouseName: 'Warehouse A',
    warehouseAddress: '123 Industrial Area, Sector 5, City - 400001'
  });

  const [csItems, setCSItems] = useState<CSItem[]>([
    {
      itemCode: 'ITM-001',
      itemName: 'Steel Rod',
      vendorOptions: ['Vendor X', 'Vendor Y'],
      selectedVendors: [],
      requiredQty: 100
    },
    {
      itemCode: 'ITM-002',
      itemName: 'Steel Plate',
      vendorOptions: ['Vendor A', 'Vendor B', 'Vendor C'],
      selectedVendors: [],
      requiredQty: 50
    }
  ]);

  const rfqs = [
    { id: 'RFQ-001', name: 'RFQ-001' },
    { id: 'RFQ-002', name: 'RFQ-002' }
  ];

  const handleRFQChange = (rfqId: string) => {
    setSelectedRFQ(rfqId);
    // In real implementation, this would fetch RFQ details and update form data
  };

  const handleSelectVendors = (itemIndex: number) => {
    setSelectedItemIndex(itemIndex);
    setShowSelectVendors(true);
  };

  const handleVendorsSelected = (selectedVendorData: any[]) => {
    if (selectedItemIndex !== null) {
      const updatedItems = [...csItems];
      updatedItems[selectedItemIndex].selectedVendors = selectedVendorData.map(v => v.vendorName);
      setCSItems(updatedItems);
    }
    setShowSelectVendors(false);
    setSelectedItemIndex(null);
  };

  const handleItemSelect = (itemCode: string) => {
    setSelectedItems(prev => 
      prev.includes(itemCode) 
        ? prev.filter(code => code !== itemCode)
        : [...prev, itemCode]
    );
  };

  const handleSelectAllItems = () => {
    setSelectedItems(prev => 
      prev.length === csItems.length ? [] : csItems.map(item => item.itemCode)
    );
  };

  const handleSubmitCS = () => {
    if (!selectedRFQ) {
      alert('Please select an RFQ');
      return;
    }

    if (selectedItems.length === 0) {
      alert('Please select at least one item');
      return;
    }

    const hasUnselectedVendors = csItems
      .filter(item => selectedItems.includes(item.itemCode))
      .some(item => item.selectedVendors.length === 0);

    if (hasUnselectedVendors) {
      alert('Please select vendors for all selected items');
      return;
    }

    console.log('Submitting Comparative Statement:', {
      selectedRFQ,
      selectedItems,
      csItems: csItems.filter(item => selectedItems.includes(item.itemCode))
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Generate Comparative Statement</h2>
        <p className="text-gray-600">Compare vendor quotations per item and generate a comparative statement.</p>
      </div>

      {/* Header Fields */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select RFQ <span className="text-red-500">*</span>
            </label>
            <select 
              value={selectedRFQ}
              onChange={(e) => handleRFQChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select RFQ</option>
              {rfqs.map(rfq => (
                <option key={rfq.id} value={rfq.id}>{rfq.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Eye className="w-4 h-4" />
              <span>View Project Details</span>
            </button>
          </div>
        </div>

        {selectedRFQ && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">RFQ Date</label>
              <input
                type="text"
                value={formData.rfqDate}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input
                type="text"
                value={formData.endDate}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Warehouse Name</label>
              <input
                type="text"
                value={formData.warehouseName}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Warehouse Address</label>
              <input
                type="text"
                value={formData.warehouseAddress}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
              />
            </div>
          </div>
        )}
      </div>

      {/* Item-Wise Quotation Comparison */}
      {selectedRFQ && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Item-Wise Quotation Comparison</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4">
                    <input
                      type="checkbox"
                      checked={selectedItems.length === csItems.length && csItems.length > 0}
                      onChange={handleSelectAllItems}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Item (Code + Name)</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Vendor Options</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Selected Vendors</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900">Action</th>
                </tr>
              </thead>
              <tbody>
                {csItems.map((item, index) => (
                  <tr key={item.itemCode} className="border-t border-gray-200 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item.itemCode)}
                        onChange={() => handleItemSelect(item.itemCode)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-900">
                      {item.itemCode} - {item.itemName}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {item.vendorOptions.join(', ')}
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
                        className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                      >
                        <Users className="w-4 h-4" />
                        <span>Select Vendors</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex justify-end">
            <button 
              onClick={handleSubmitCS}
              disabled={selectedItems.length === 0 || !selectedRFQ}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                selectedItems.length > 0 && selectedRFQ
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              SUBMIT Comparative Statement
            </button>
          </div>
        </div>
      )}

      {/* Select Vendors Modal */}
      {showSelectVendors && selectedItemIndex !== null && (
        <SelectVendorsForCSModal
          isOpen={showSelectVendors}
          onClose={() => {
            setShowSelectVendors(false);
            setSelectedItemIndex(null);
          }}
          onVendorsSelected={handleVendorsSelected}
          item={csItems[selectedItemIndex]}
        />
      )}
    </div>
  );
};

export default GenerateCSTab;