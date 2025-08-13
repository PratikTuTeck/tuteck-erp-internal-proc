import React, { useState } from 'react';
import { X, Edit, Save } from 'lucide-react';

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
  qtyWeNeed: number;
  totalAmount: number;
  remarks: string;
  paymentTerms: string;
  isEditing: boolean;
}

const SelectVendorsForCSModal: React.FC<SelectVendorsForCSModalProps> = ({ 
  isOpen, 
  onClose, 
  onVendorsSelected,
  item 
}) => {
  const [vendorQuotations, setVendorQuotations] = useState<VendorQuotation[]>([
    {
      vendorName: 'Vendor X',
      canProvideQty: 100,
      rate: 350,
      qtyWeNeed: 50,
      totalAmount: 17500,
      remarks: 'Fast delivery',
      paymentTerms: '50% Advance',
      isEditing: false
    },
    {
      vendorName: 'Vendor Y',
      canProvideQty: 80,
      rate: 340,
      qtyWeNeed: 50,
      totalAmount: 17000,
      remarks: 'Good quality',
      paymentTerms: '30% Advance',
      isEditing: false
    }
  ]);

  if (!isOpen) return null;

  const handleEdit = (vendorName: string) => {
    setVendorQuotations(prev => prev.map(vendor =>
      vendor.vendorName === vendorName ? { ...vendor, isEditing: true } : vendor
    ));
  };

  const handleSave = (vendorName: string) => {
    setVendorQuotations(prev => prev.map(vendor =>
      vendor.vendorName === vendorName ? { ...vendor, isEditing: false } : vendor
    ));
  };

  const handleFieldChange = (vendorName: string, field: keyof VendorQuotation, value: any) => {
    setVendorQuotations(prev => prev.map(vendor => {
      if (vendor.vendorName === vendorName) {
        const updatedVendor = { ...vendor, [field]: value };
        // Recalculate total amount if rate or quantity changes
        if (field === 'rate' || field === 'qtyWeNeed') {
          updatedVendor.totalAmount = updatedVendor.rate * updatedVendor.qtyWeNeed;
        }
        return updatedVendor;
      }
      return vendor;
    }));
  };

  const totalQtyNeeded = vendorQuotations.reduce((sum, vendor) => sum + vendor.qtyWeNeed, 0);
  const isValidQuantity = totalQtyNeeded <= item.requiredQty;

  const handleConfirm = () => {
    if (!isValidQuantity) {
      alert(`Total quantity needed (${totalQtyNeeded}) cannot exceed required quantity (${item.requiredQty})`);
      return;
    }

    onVendorsSelected(vendorQuotations);
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

        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Vendor Name</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Can Provide Qty</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Rate (₹)</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Qty We Need</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Total Amount</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Remarks</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Payment Terms</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900">Action</th>
                </tr>
              </thead>
              <tbody>
                {vendorQuotations.map((vendor) => (
                  <tr key={vendor.vendorName} className="border-t border-gray-200">
                    <td className="py-3 px-4 font-medium text-gray-900">{vendor.vendorName}</td>
                    <td className="py-3 px-4 text-gray-600">{vendor.canProvideQty}</td>
                    <td className="py-3 px-4">
                      {vendor.isEditing ? (
                        <input
                          type="number"
                          value={vendor.rate}
                          onChange={(e) => handleFieldChange(vendor.vendorName, 'rate', Number(e.target.value))}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      ) : (
                        <span className="text-gray-600">₹{vendor.rate}</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {vendor.isEditing ? (
                        <input
                          type="number"
                          value={vendor.qtyWeNeed}
                          onChange={(e) => handleFieldChange(vendor.vendorName, 'qtyWeNeed', Number(e.target.value))}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          max={vendor.canProvideQty}
                        />
                      ) : (
                        <span className="text-gray-600">{vendor.qtyWeNeed}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-900">₹{vendor.totalAmount.toLocaleString()}</td>
                    <td className="py-3 px-4">
                      {vendor.isEditing ? (
                        <input
                          type="text"
                          value={vendor.remarks}
                          onChange={(e) => handleFieldChange(vendor.vendorName, 'remarks', e.target.value)}
                          className="w-32 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      ) : (
                        <span className="text-gray-600">{vendor.remarks}</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {vendor.isEditing ? (
                        <input
                          type="text"
                          value={vendor.paymentTerms}
                          onChange={(e) => handleFieldChange(vendor.vendorName, 'paymentTerms', e.target.value)}
                          className="w-32 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      ) : (
                        <span className="text-gray-600">{vendor.paymentTerms}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {vendor.isEditing ? (
                        <button
                          onClick={() => handleSave(vendor.vendorName)}
                          className="text-green-600 hover:text-green-800 transition-colors"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleEdit(vendor.vendorName)}
                          className="text-blue-600 hover:text-blue-800 transition-colors"
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

          {/* Validation Message */}
          <div className="mt-4 p-3 rounded-lg bg-gray-50">
            <p className="text-sm text-gray-600">
              <strong>Validation:</strong> Sum of "Qty We Need" ({totalQtyNeeded}) must be ≤ Required Qty ({item.requiredQty})
            </p>
            {!isValidQuantity && (
              <p className="text-sm text-red-600 mt-1">
                ⚠️ Total quantity needed exceeds required quantity!
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
            disabled={!isValidQuantity}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isValidQuantity
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