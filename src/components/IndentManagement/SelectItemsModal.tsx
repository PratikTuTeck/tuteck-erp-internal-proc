import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import axios from "axios";

interface SelectItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onItemsSelected: (items: any[]) => void;
  bomId: string;
}

interface BOMItem {
  bom_detail_id: string;
  required_quantity: number | null;
  item: {
    id: string;
    item_code: string;
    item_name: string;
    hsn_code?: string;
    unit_price: number;
    installation_rate: number;
    latest_lowest_net_rate: number;
    uom_id: string;
    safety_stock: number;
  };
}

const SelectItemsModal: React.FC<SelectItemsModalProps> = ({
  isOpen,
  onClose,
  onItemsSelected,
  bomId,
}) => {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [bomItems, setBomItems] = useState<BOMItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && bomId) {
      setLoading(true);
      setError("");
      axios
        .get(`${import.meta.env.VITE_API_BASE_URL}/indent/bom/details`)
        .then((res) => {
          const selectedBOM = res.data.data.find(
            (bom: any) => bom.id === bomId
          );
          if (selectedBOM && selectedBOM.items) {
            // Filter out items that have actual item data (not null)
            const validItems = selectedBOM.items.filter(
              (item: any) => item.item !== null
            );
            setBomItems(validItems);
          } else {
            setBomItems([]);
          }
        })
        .catch(() => {
          setError("Failed to load BOM items");
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, bomId]);

  if (!isOpen) return null;

  const handleItemSelect = (itemId: string) => {
    setSelectedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAll = () => {
    setSelectedItems((prev) =>
      prev.length === bomItems.length
        ? []
        : bomItems.map((item) => item.item.id)
    );
  };

  const handleSaveItems = () => {
    const selectedItemsData = bomItems
      .filter((item) => selectedItems.includes(item.item.id))
      .map((item) => ({
        itemId: item.item.id,
        itemCode: item.item.item_code,
        itemName: item.item.item_name,
        uom: item.item.uom_id, // This might need to be resolved to actual UOM name
        rate: item.item.unit_price || item.item.latest_lowest_net_rate || 0,
        availableQty: item.item.safety_stock || 0,
        requiredQty: item.required_quantity ?? 0,
        allocatedQty: 50, // Default value - can be made configurable
        procureQty: item.required_quantity ?? 0, // Prefill with required quantity
      }));

    onItemsSelected(selectedItemsData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Select Items from BOM
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="text-gray-600">Loading BOM items...</div>
            </div>
          ) : error ? (
            <div className="flex justify-center items-center py-8">
              <div className="text-red-600">{error}</div>
            </div>
          ) : bomItems.length === 0 ? (
            <div className="flex justify-center items-center py-8">
              <div className="text-gray-600">No items found for this BOM</div>
            </div>
          ) : (
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
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Item Code
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Item Name
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      HSN Code
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Unit Price
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Installation Rate
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Safety Stock
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {bomItems.map((bomItem) => (
                    <tr
                      key={bomItem.item.id}
                      className="border-t border-gray-200 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(bomItem.item.id)}
                          onChange={() => handleItemSelect(bomItem.item.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900">
                        {bomItem.item.item_code}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {bomItem.item.item_name}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {bomItem.item.hsn_code || "N/A"}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        ₹
                        {bomItem.item.unit_price ||
                          bomItem.item.latest_lowest_net_rate ||
                          0}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        ₹{bomItem.item.installation_rate || 0}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {bomItem.item.safety_stock}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
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
