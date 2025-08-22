import React from "react";
import { X, FileText, User, Calendar, Package, MapPin } from "lucide-react";

interface ViewPOModalProps {
  isOpen: boolean;
  onClose: () => void;
  po: {
    id: string;
    poNo: string;
    parentPO?: string;
    vendorName: string;
    contactNo: string;
    poDate: string;
    poAmount: number;
    approvedBy?: string;
    approvedOn?: string;
    status: string;
    type: string;
    vendorAddress: string;
    warehouseName?: string;
    gstNo: string;
    items: Array<{
      itemCode: string;
      itemName: string;
      categoryName: string;
      uom: string;
      hsnCode: string;
      rate: number;
      quantity: number;
      total: number;
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
  if (!isOpen) return null;

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

  const totalAmount = po.items.reduce((sum, item) => sum + item.total, 0);

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
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Item Code
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Item Name
                    </th>
                    {/* <th className="text-left py-3 px-4 font-medium text-gray-900">Category Name</th> */}
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      UOM
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      HSN Code
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Rate
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Quantity to be Purchased
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Total (Rate * Quantity)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {po.items.map((item, index) => (
                    <tr key={index} className="border-t border-gray-200">
                      <td className="py-3 px-4 font-medium text-gray-900">
                        {item.itemCode}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {item.itemName}
                      </td>
                      {/* <td className="py-3 px-4 text-gray-600">
                        {item.categoryName}
                      </td> */}
                      <td className="py-3 px-4 text-gray-600">{item.uom}</td>
                      <td className="py-3 px-4 text-gray-600">
                        {item.hsnCode}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        ₹{item.rate.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {item.quantity}
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900">
                        ₹{item.total.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td
                      colSpan={7}
                      className="py-3 px-4 font-medium text-gray-900 text-right"
                    >
                      Total Amount:
                    </td>
                    <td className="py-3 px-4 font-bold text-gray-900">
                      ₹{totalAmount.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
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
