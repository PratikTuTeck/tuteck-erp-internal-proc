import React from "react";
import { X, Calendar, FileText, Building, Package, Users } from "lucide-react";
import { Chip, Box } from "@mui/material";

interface ViewRFQModalProps {
  isOpen: boolean;
  onClose: () => void;
  rfqData: any; // The API response data
}

const ViewRFQModal: React.FC<ViewRFQModalProps> = ({
  isOpen,
  onClose,
  rfqData,
}) => {
  if (!isOpen || !rfqData) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <FileText className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                RFQ Details - {rfqData.rfqNo}
              </h2>
              <p className="text-sm text-gray-500">
                Created on {formatDate(rfqData.rfqDate)}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                rfqData.approval_status
              )}`}
            >
              {rfqData.approval_status}
            </span>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <h3 className="font-medium text-gray-900">RFQ Date</h3>
              </div>
              <p className="text-gray-600">{formatDate(rfqData.rfqDate)}</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="w-4 h-4 text-red-600" />
                <h3 className="font-medium text-gray-900">End Date</h3>
              </div>
              <p className="text-gray-600">{formatDate(rfqData.endDate)}</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="w-4 h-4 text-green-600" />
                <h3 className="font-medium text-gray-900">Approved On</h3>
              </div>
              <p className="text-gray-600">
                {rfqData.approvedOn
                  ? formatDate(rfqData.approvedOn)
                  : "Not approved yet"}
              </p>
            </div>
          </div>

          {/* Description/Note */}
          {rfqData.note && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Description</h3>
              <p className="text-gray-700">{rfqData.note}</p>
            </div>
          )}

          {/* Associated Indents */}
          {rfqData.indents && rfqData.indents.length > 0 && (
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <FileText className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-medium text-gray-900">
                  Associated Indents ({rfqData.indents.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rfqData.indents.map((indent: any) => (
                  <div
                    key={indent.id}
                    className="bg-purple-50 border border-purple-200 p-4 rounded-lg"
                  >
                    <h4 className="font-medium text-purple-900">
                      {indent.indent_number}
                    </h4>
                    <p className="text-sm text-purple-700 mt-1">
                      Created: {formatDate(indent.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Associated Warehouses */}
          {rfqData.warehouses && rfqData.warehouses.length > 0 && (
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Building className="w-5 h-5 text-orange-600" />
                <h3 className="text-lg font-medium text-gray-900">
                  Associated Warehouses ({rfqData.warehouses.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rfqData.warehouses.map((warehouse: any) => (
                  <div
                    key={warehouse.id}
                    className="bg-orange-50 border border-orange-200 p-4 rounded-lg"
                  >
                    <h4 className="font-medium text-orange-900">
                      {warehouse.warehouse_name}
                    </h4>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Items Table */}
          {rfqData.items && rfqData.items.length > 0 && (
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Package className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-medium text-gray-900">
                  Items from RFQ ({rfqData.items.length})
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-700 border-b">
                        Item Code
                      </th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-700 border-b">
                        Item Name
                      </th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-700 border-b">
                        HSN Code
                      </th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-700 border-b">
                        Total Qty
                      </th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-700 border-b">
                        Material Type
                      </th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-700 border-b">
                        Associated Vendors
                      </th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-700 border-b">
                        Unit Price
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rfqData.items.map((item: any) => (
                      <tr key={item.item_id} className="hover:bg-gray-50">
                        <td className="py-3 px-4 text-gray-900 border-b">
                          {item.details.item_code}
                        </td>
                        <td className="py-3 px-4 text-gray-900 border-b">
                          <div>
                            <p className="font-medium">{item.details.item_name}</p>
                            {item.details.description && (
                              <p className="text-sm text-gray-500 mt-1">
                                {item.details.description}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600 border-b">
                          {item.details.hsn_code}
                        </td>
                        <td className="py-3 px-4 text-gray-600 border-b">
                          <span className="font-medium text-green-600">
                            {item.total_required_quantity}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600 border-b">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            item.details.material_type === 'HIGH SIDE SUPPLY' 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {item.details.material_type}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600 border-b">
                          <div className="space-y-1">
                            {item.associatedVendors.map((vendor: any, index: number) => (
                              <div key={vendor.id} className="flex items-center justify-between">
                                <span className="text-sm">{vendor.business_name}</span>
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs text-gray-500">
                                    Qty: {vendor.required_quantity}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600 border-b">
                          <div className="text-sm">
                            <p>₹{item.details.unit_price || "N/A"}</p>
                            {item.details.installation_rate && (
                              <p className="text-xs text-gray-500">
                                Install: ₹{item.details.installation_rate}
                              </p>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
             
            </div>
          )}
        </div>

        <div className="flex items-center justify-end p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewRFQModal;