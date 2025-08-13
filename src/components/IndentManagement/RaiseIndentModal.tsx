import React, { useState } from 'react';
import { X, Upload, Download, Plus } from 'lucide-react';
import SelectItemsModal from './SelectItemsModal';

interface RaiseIndentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SelectedItem {
  itemCode: string;
  itemName: string;
  uom: string;
  rate: number;
  availableQty: number;
  requiredQty: number;
  allocatedQty: number;
  procureQty: number;
}

const RaiseIndentModal: React.FC<RaiseIndentModalProps> = ({ isOpen, onClose }) => {
  const [showSelectItems, setShowSelectItems] = useState(false);
  const [selectedBOM, setSelectedBOM] = useState('');
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [formData, setFormData] = useState({
    indentId: 'IND-' + String(Date.now()).slice(-6),
    requestDate: new Date().toISOString().split('T')[0],
    expectedDate: '',
    comment: ''
  });

  if (!isOpen) return null;

  const boms = [
    { id: 'BOM-001', name: 'Construction BOM - Phase 1', project: 'Project Alpha', lead: 'Lead-001' },
    { id: 'BOM-002', name: 'Maintenance BOM - Q1', project: 'Project Beta', lead: 'Lead-002' },
    { id: 'BOM-003', name: 'Infrastructure BOM', project: null, lead: 'Lead-003' }
  ];

  const handleBOMChange = (bomId: string) => {
    setSelectedBOM(bomId);
  };

  const handleAddItems = () => {
    if (selectedBOM) {
      setShowSelectItems(true);
    }
  };

  const handleItemsSelected = (items: SelectedItem[]) => {
    setSelectedItems(items);
    setShowSelectItems(false);
  };

  const handleItemChange = (index: number, field: keyof SelectedItem, value: number) => {
    const updatedItems = [...selectedItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setSelectedItems(updatedItems);
  };

  const handleRemoveItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const handleSaveIndent = () => {
    // Validate form
    if (!formData.expectedDate || selectedItems.length === 0) {
      alert('Please fill all mandatory fields and add at least one item');
      return;
    }
    
    // Save indent logic here
    console.log('Saving indent:', { formData, selectedItems });
    onClose();
  };

  const selectedBOMData = boms.find(bom => bom.id === selectedBOM);

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Raise Indent</h2>
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
                  Indent ID
                </label>
                <input
                  type="text"
                  value={formData.indentId}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Request Date
                </label>
                <input
                  type="date"
                  value={formData.requestDate}
                  onChange={(e) => setFormData({...formData, requestDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expected Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.expectedDate}
                  onChange={(e) => setFormData({...formData, expectedDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Template Upload Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template Upload
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    id="template-upload"
                  />
                  <label
                    htmlFor="template-upload"
                    className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload File</span>
                  </label>
                  <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <Download className="w-4 h-4" />
                    <span>Download Template</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select BOM
                </label>
                <select 
                  value={selectedBOM}
                  onChange={(e) => handleBOMChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select BOM</option>
                  {boms.map(bom => (
                    <option key={bom.id} value={bom.id}>{bom.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Associated Projects/Leads */}
            {selectedBOMData && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Associated Projects/Leads
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Lead</label>
                    <input
                      type="text"
                      value={selectedBOMData.lead}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                    />
                  </div>
                  {selectedBOMData.project && (
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Project</label>
                      <input
                        type="text"
                        value={selectedBOMData.project}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Comment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comment
              </label>
              <textarea
                rows={3}
                value={formData.comment}
                onChange={(e) => setFormData({...formData, comment: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter any additional comments"
              />
            </div>

            {/* Add Items Button */}
            <div className="flex justify-center">
              <button 
                onClick={handleAddItems}
                disabled={!selectedBOM}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                  selectedBOM 
                    ? 'bg-green-600 text-white hover:bg-green-700' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>Add Items</span>
              </button>
            </div>

            {/* Selected Items Table */}
            {selectedItems.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Selected Items</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Item (Code + Name)</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">UOM</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Available Qty</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Required Qty</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Already Allocated</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Procure Qty</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-900">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedItems.map((item, index) => (
                        <tr key={index} className="border-t border-gray-200">
                          <td className="py-3 px-4 font-medium text-gray-900">
                            {item.itemCode} - {item.itemName}
                          </td>
                          <td className="py-3 px-4 text-gray-600">{item.uom}</td>
                          <td className="py-3 px-4 text-gray-600">{item.availableQty}</td>
                          <td className="py-3 px-4 text-gray-600">{item.requiredQty}</td>
                          <td className="py-3 px-4 text-gray-600">{item.allocatedQty}</td>
                          <td className="py-3 px-4">
                            <input
                              type="number"
                              value={item.procureQty}
                              onChange={(e) => handleItemChange(index, 'procureQty', Number(e.target.value))}
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => handleRemoveItem(index)}
                              className="text-red-600 hover:text-red-800 transition-colors"
                            >
                              <X className="w-4 h-4" />
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
              onClick={handleSaveIndent}
              disabled={selectedItems.length === 0}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedItems.length > 0
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Save Indent
            </button>
          </div>
        </div>
      </div>

      {showSelectItems && (
        <SelectItemsModal
          isOpen={showSelectItems}
          onClose={() => setShowSelectItems(false)}
          onItemsSelected={handleItemsSelected}
          bomId={selectedBOM}
        />
      )}
    </>
  );
};

export default RaiseIndentModal;