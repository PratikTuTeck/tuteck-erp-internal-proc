import React, { useState } from 'react';
import { X } from 'lucide-react';

interface SelectVendorsForCSModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVendorsSelected: (vendors: any[]) => void;
  item: {
    itemCode: string;
    itemName: string;
    requiredQty: number;
    vendorOptions: string[];
  };
}

interface VendorQuotation {
  vendorName: string;
  canProvideQty: number;
  rate: number;
  selected: boolean;
}

interface SelectedVendor {
  vendorName: string;
  rate: number;
  qtyToProcure: number;
  totalAmount: number;
}

const SelectVendorsForCSModal: React.FC<SelectVendorsForCSModalProps> = ({ 
  isOpen, 
  onClose, 
  onVendorsSelected,
  item 
}) => {
  const [submittedVendors] = useState<VendorQuotation[]>([
    {
      vendorName: 'Vendor X',
      canProvideQty: 100,
      rate: 350,
      selected: false
    },
    {
      vendorName: 'Vendor Y',
      canProvideQty: 80,
      rate: 340,
      selected: false
    }
  ]);

  const [selectedVendors, setSelectedVendors] = useState<SelectedVendor[]>([]);

  if (!isOpen) return null;

  const handleVendorSelect = (vendorName: string) => {
    const vendor = submittedVendors.find(v => v.vendorName === vendorName);
    if (!vendor) return;

    if (selectedVendors.find(v => v.vendorName === vendorName)) {
      // Remove from selected
      setSelectedVendors(prev => prev.filter(v => v.vendorName !== vendorName));
    } else {
      // Add to selected
      const newSelectedVendor: SelectedVendor = {
        vendorName: vendor.vendorName,
        rate: vendor.rate,
        qtyToProcure: 0,
        totalAmount: 0
      };
      setSelectedVendors(prev => [...prev, newSelectedVendor]);
    }
  };

  const handleSelectedVendorChange = (vendorName: string, field: 'rate' | 'qtyToProcure', value: number) => {
    setSelectedVendors(prev => prev.map(vendor => {
      if (vendor.vendorName === vendorName) {
        const updatedVendor = { ...vendor, [field]: value };
        updatedVendor.totalAmount = updatedVendor.rate * updatedVendor.qtyToProcure;
        return updatedVendor;
      }
      return vendor;
    }));
  };

  const totalQtyToProcure = selectedVendors.reduce((sum, vendor) => sum + vendor.qtyToProcure, 0);
  const isValidQuantity = totalQtyToProcure <= item.requiredQty;

  const handleConfirm = () => {
    if (!isValidQuantity) {
      alert(`Total quantity to procure (${totalQtyToProcure}) cannot exceed required quantity (${item.requiredQty})`);
      return;
    }

    if (selectedVendors.length === 0) {
      alert('Please select at least one vendor');
      return;
    }

    onVendorsSelected(selectedVendors);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Select Vendors for Comparative Statement</h2>
            <div className="mt-2 text-sm text-gray-600">
              <p><strong>Item Name:</strong> {item.itemName}</p>
              <p><strong>Item Code:</strong> {item.itemCode}</p>
              <p><strong>Required Quantity:</strong> {item.requiredQty}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Submitted Vendor Quotation Table */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Submitted Vendor Quotation Table</h3>
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        disabled
                      />
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Vendor Name</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Rate (₹)</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Can Provide Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {submittedVendors.map((vendor) => (
                    <tr key={vendor.vendorName} className="border-t border-gray-200">
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={selectedVendors.some(v => v.vendorName === vendor.vendorName)}
                          onChange={() => handleVendorSelect(vendor.vendorName)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900">{vendor.vendorName}</td>
                      <td className="py-3 px-4 text-gray-600">₹{vendor.rate}</td>
                      <td className="py-3 px-4 text-gray-600">{vendor.canProvideQty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Selected Vendors to Procure From Table */}
          {selectedVendors.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Selected Vendors to Procure From Table</h3>
              <div className="overflow-x-auto">
                <table className="w-full border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Vendor Name</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Rate (₹)</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Qty to Procure</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Total Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedVendors.map((vendor) => (
                      <tr key={vendor.vendorName} className="border-t border-gray-200">
                        <td className="py-3 px-4 font-medium text-gray-900">{vendor.vendorName}</td>
                        <td className="py-3 px-4">
                          <input
                            type="number"
                            value={vendor.rate}
                            onChange={(e) => handleSelectedVendorChange(vendor.vendorName, 'rate', Number(e.target.value))}
                            className="w-24 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="number"
                            value={vendor.qtyToProcure}
                            onChange={(e) => handleSelectedVendorChange(vendor.vendorName, 'qtyToProcure', Number(e.target.value))}
                            className="w-24 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            max={item.requiredQty}
                          />
                        </td>
                        <td className="py-3 px-4 font-medium text-gray-900">₹{vendor.totalAmount.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Validation Message */}
          <div className="mt-4 p-3 rounded-lg bg-gray-50">
            <p className="text-sm text-gray-600">
              <strong>Validation:</strong> Sum of "Qty to Procure" ({totalQtyToProcure}) must be ≤ Required Qty ({item.requiredQty})
            </p>
            {!isValidQuantity && (
              <p className="text-sm text-red-600 mt-1">
                ⚠️ Total quantity to procure exceeds required quantity!
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            CANCEL
          </button>
          <button 
            onClick={handleConfirm}
            disabled={!isValidQuantity || selectedVendors.length === 0}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isValidQuantity && selectedVendors.length > 0
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            CONFIRM
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelectVendorsForCSModal;