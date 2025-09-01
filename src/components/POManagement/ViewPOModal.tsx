import React, { useState } from "react";
import {
  X,
  FileText,
  User,
  Calendar,
  Package,
  MapPin,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

interface ViewPOModalProps {
  isOpen: boolean;
  onClose: () => void;
  po: {
    // Purchase order basic info
    id: string;
    poNo: string;
    parentPO?: string;
    poDate: string;
    poAmount: number;
    approvedBy?: string;
    approvedOn?: string;
    status: string;
    type: string;
    gstNo: string;
    // Vendor info
    vendorName: string;
    contactNo: string;
    vendorAddress: string;
    warehouseName?: string;
    // Items from API
    items: Array<{
      id: string;
      po_id: string;
      item_id: string;
      qty: string;
      rate: string;
      notes: string;
      qs_approved: boolean;
      vendor_id: string;
      warehouse_id: string | null;
      warehouse_code: string | null;
      item_details: {
        id: string;
        item_code: string;
        item_name: string;
        hsn_code: string;
        description: string;
        material_type: string;
        category_id: string;
        brand_id: string;
        uom_id: string;
        installation_rate: string;
        unit_price: string;
        uom_value: string;
        is_capital_item: boolean;
        is_scrap_item: boolean;
        uom_name: string | null;
      };
    }>;
    vendorDetails: {
      bankName: string;
      accountNo: string;
      ifscCode: string;
      igst: number;
      sgst: number;
      cgst: number;
    };
    warehouse_details: Array<{
      id: string;
      warehouse_code: string;
      warehouse_name: string;
      address: string;
    }>;
    payment_terms: Array<{
      id: string;
      payment_terms_type: string;
      charges_amount: string;
      charges_percent: string;
      note: string;
    }>;
  };
}

const ViewPOModal: React.FC<ViewPOModalProps> = ({ isOpen, onClose, po }) => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  // Debug log to check data structure
  console.log("PO Data:", po);
  console.log("PO Items:", po.items);
  console.log("Items length:", po.items?.length);
  console.log("First item:", po.items?.[0]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      case "GRN_COMPLETE":
        return "bg-blue-100 text-blue-800";
      case "AMENDED":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Group items by item_id to show unique items
  const groupedItems = (po.items || []).reduce((acc, item) => {
    // Skip items without item_details or item_id
    if (!item.item_details || !item.item_id) {
      return acc;
    }

    const itemId = item.item_id;
    if (!acc[itemId]) {
      acc[itemId] = {
        item_details: item.item_details,
        entries: [],
      };
    }
    acc[itemId].entries.push(item);
    return acc;
  }, {} as Record<string, { item_details: (typeof po.items)[0]["item_details"]; entries: typeof po.items }>);

  // Calculate total amount from all items
  const totalAmount =
    po.items?.reduce((sum, item) => {
      const rate = parseFloat(item?.rate || "0") || 0;
      const qty = parseFloat(item?.qty || "0") || 0;
      return sum + rate * qty;
    }, 0) || 0;

  const toggleItemExpansion = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const getWarehouseName = (
    warehouseId: string | null,
    warehouseCode: string | null
  ) => {
    if (!warehouseId || !warehouseCode) return "Unassigned";
    const warehouse = po.warehouse_details.find((w) => w.id === warehouseId);
    return warehouse
      ? `${warehouse.warehouse_name} (${warehouse.warehouse_code})`
      : warehouseCode;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <FileText className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Purchase Order Details
            </h2>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                po.status
              )}`}
            >
              {po.status.replace("_", " ")}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Header Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Header Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">PO Number</p>
                    <p className="font-medium text-gray-900">{po.poNo}</p>
                  </div>
                </div>

                {po.parentPO && (
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Parent PO</p>
                      <p className="font-medium text-gray-900">{po.parentPO}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">PO Date</p>
                    <p className="font-medium text-gray-900">{po.poDate}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Package className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Type</p>
                    <p className="font-medium text-gray-900">{po.type}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Vendor Name</p>
                    <p className="font-medium text-gray-900">{po.vendorName}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">
                      Vendor Contact Number
                    </p>
                    <p className="font-medium text-gray-900">{po.contactNo}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Package className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Warehouse(s)</p>
                    <div className="space-y-1">
                      {po.warehouse_details &&
                      po.warehouse_details.length > 0 ? (
                        po.warehouse_details.map((warehouse) => (
                          <div
                            key={warehouse.id}
                            className="font-medium text-gray-900"
                          >
                            {warehouse.warehouse_name} (
                            {warehouse.warehouse_code})
                            <p className="text-xs text-gray-500">
                              {warehouse.address}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="font-medium text-gray-900">
                          {po.warehouseName}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">GST No</p>
                    <p className="font-medium text-gray-900">{po.gstNo}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">PO Amount</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ₹{po.poAmount.toLocaleString()}
                    </p>
                  </div>
                </div>

                {po.approvedBy && (
                  <div className="flex items-center space-x-3">
                    <User className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Approved By</p>
                      <p className="font-medium text-gray-900">
                        {po.approvedBy}
                      </p>
                    </div>
                  </div>
                )}

                {po.approvedOn && (
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Approved On</p>
                      <p className="font-medium text-gray-900">
                        {po.approvedOn}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Vendor Address</p>
                    <p className="font-medium text-gray-900">
                      {po.vendorAddress}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tax Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Tax Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500">IGST</p>
                <p className="text-xl font-bold text-gray-900">
                  {po.vendorDetails.igst}%
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500">SGST</p>
                <p className="text-xl font-bold text-gray-900">
                  {po.vendorDetails.sgst}%
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500">CGST</p>
                <p className="text-xl font-bold text-gray-900">
                  {po.vendorDetails.cgst}%
                </p>
              </div>
            </div>
          </div>

          {/* Payment Terms */}
          {/* <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Payment Terms
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Payment Type
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Percentage
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Amount
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Note
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {po.payment_terms && po.payment_terms.length > 0 ? (
                    po.payment_terms.map((term) => (
                      <tr key={term.id} className="border-t border-gray-200">
                        <td className="py-3 px-4 font-medium text-gray-900">
                          {term.payment_terms_type}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {term.charges_percent}%
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          ₹{parseFloat(term.charges_amount).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-gray-600">{term.note}</td>
                      </tr>
                    ))
                  ) : (
                    <tr className="border-t border-gray-200">
                      <td
                        colSpan={4}
                        className="py-3 px-4 text-center text-gray-500"
                      >
                        No payment terms available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div> */}

          {/* Item Details */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Item Details
            </h3>

            {/* Header Row */}
            <div className="mb-2">
              <div className="grid grid-cols-7 gap-4 text-sm font-medium text-gray-500 px-4 py-2 bg-gray-50 rounded-lg">
                <div>Item Code</div>
                <div>Item Name</div>
                <div>UOM</div>
                <div>HSN Code</div>
                <div>Rate</div>
                <div>Total Quantity</div>
                <div>Total Value</div>
              </div>
            </div>

            <div className="space-y-2">
              {Object.keys(groupedItems).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No items found in this purchase order.
                </div>
              ) : (
                Object.entries(groupedItems).map(([itemId, itemGroup]) => {
                  // Safety check for item_details
                  if (!itemGroup.item_details) {
                    return null;
                  }

                  const isExpanded = expandedItems.has(itemId);
                  const totalQty = itemGroup.entries.reduce(
                    (sum, entry) => sum + parseFloat(entry.qty),
                    0
                  );
                  const totalValue = itemGroup.entries.reduce((sum, entry) => {
                    const rate = parseFloat(entry.rate) || 0;
                    const qty = parseFloat(entry.qty) || 0;
                    return sum + rate * qty;
                  }, 0);

                  return (
                    <div
                      key={itemId}
                      className="border border-gray-200 rounded-lg"
                    >
                      {/* Main Item Row */}
                      <div
                        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => toggleItemExpansion(itemId)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-gray-500" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-gray-500" />
                            )}
                            <div className="grid grid-cols-7 gap-4 flex-1">
                              <div>
                                <p className="font-medium text-gray-900">
                                  {itemGroup.item_details?.item_code || "N/A"}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-600">
                                  {itemGroup.item_details?.item_name || "N/A"}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-600">
                                  {itemGroup.item_details?.uom_name || "N/A"}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-600">
                                  {itemGroup.item_details?.hsn_code || "N/A"}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-600">
                                  ₹
                                  {parseFloat(
                                    itemGroup.entries[0]?.rate || "0"
                                  ).toLocaleString()}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-600">{totalQty}</p>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  ₹{totalValue.toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="border-t border-gray-200 bg-gray-50">
                          <div className="p-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-3">
                              Warehouse Distribution:
                            </h4>
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead>
                                  <tr className="text-sm text-gray-600">
                                    <th className="text-left py-2 px-3">
                                      Warehouse
                                    </th>
                                    <th className="text-left py-2 px-3">
                                      Quantity
                                    </th>
                                    <th className="text-left py-2 px-3">
                                      Rate
                                    </th>
                                    <th className="text-left py-2 px-3">
                                      Total
                                    </th>
                                    <th className="text-left py-2 px-3">
                                      Notes
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {itemGroup.entries.map((entry) => {
                                    const entryTotal =
                                      parseFloat(entry?.rate || "0") *
                                      parseFloat(entry?.qty || "0");
                                    return (
                                      <tr key={entry.id} className="text-sm">
                                        <td className="py-2 px-3 text-gray-600">
                                          {getWarehouseName(
                                            entry.warehouse_id,
                                            entry.warehouse_code
                                          )}
                                        </td>
                                        <td className="py-2 px-3 text-gray-600">
                                          {entry.qty || "0"}
                                        </td>
                                        <td className="py-2 px-3 text-gray-600">
                                          ₹
                                          {parseFloat(
                                            entry?.rate || "0"
                                          ).toLocaleString()}
                                        </td>
                                        <td className="py-2 px-3 text-gray-600">
                                          ₹{entryTotal.toLocaleString()}
                                        </td>
                                        <td className="py-2 px-3 text-gray-600">
                                          {entry.notes || "-"}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Total Amount */}
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-900">Total Amount:</span>
                <span className="font-bold text-gray-900 text-lg">
                  ₹{totalAmount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Bank Details */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Bank Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-500">Bank Name</p>
                <p className="font-medium text-gray-900">
                  {po.vendorDetails.bankName}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Account Number</p>
                <p className="font-medium text-gray-900">
                  {po.vendorDetails.accountNo}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">IFSC Code</p>
                <p className="font-medium text-gray-900">
                  {po.vendorDetails.ifscCode}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewPOModal;
