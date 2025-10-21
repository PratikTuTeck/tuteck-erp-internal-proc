import React, { useState } from "react";
import {
  X,
  FileText,
  User,
  Calendar,
  Package,
  CheckCircle,
  XCircle,
} from "lucide-react";


import useNotifications from '../../hooks/useNotifications';
import { useAuth } from '../../hooks/useAuth';

interface ApproveIndentModalProps {
  isOpen: boolean;
  onClose: () => void;
  indent: {
    id: string;
    indentNumber: string;
    createdBy: string;
    requestedOn: string;
    warehouseName: string;
    expectedDate: string;
    approvedBy: string;
    approvedOn: string;
    status: string;
    aggregateStatus: string;
    projectName: string;
    noOfItems: number;
    comment: string;
    items: Array<{
      hsnCode: string;
      itemCode: string;
      itemName: string;
      uom: string;
      requiredQty: number;
    }>;
  };
}

const ApproveIndentModal: React.FC<ApproveIndentModalProps> = ({
  isOpen,
  onClose,
  indent,
}) => {
  
  //----------------------------------------------------------------------------------- For Notification
  const token = localStorage.getItem('auth_token') || '';
  const { user } = useAuth();
  const { sendNotification } = useNotifications(user?.role, token);
  //------------------------------------------------------------------------------------

  const [approvalComment, setApprovalComment] = useState("");

  if (!isOpen) return null;

  const handleApprove = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/indent/${
          indent.id
        }/decision?status=approved`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error approving indent:", errorData);
        alert(errorData.clientMessage || "Failed to approve the indent.");
        return;
      }

      const result = await response.json();

      // ------------------------------------------------------------------------------------------For notifications
      try {
        await sendNotification({
          receiver_ids: ['admin'],
          title: `Indent Approved : ${result.data.data.indent_number || 'Indent'}`,
          message: `Indent ${result.data.data.indent_number || 'Indent'} successfully Approved by ${user?.name || 'a user'}`,
          service_type: 'PROC',
          link: '',
          sender_id: user?.role || 'user',
          access: {
            module: "PROC",
            menu: "Indent Management",
          }
        });
        console.log(`Notification sent for Indent Approved ${result.data.data.indent_number || 'Indent'}`);
      } catch (notifError) {
        console.error('Failed to send notification:', notifError);
        // Continue with the flow even if notification fails
      }
      // ------------------------------------------------------------------------------------------

      console.log("Indent approved successfully:", result);
      alert("Indent approved successfully!");
      onClose();
    } catch (error) {
      console.error("Error approving indent:", error);
      alert("An error occurred while approving the indent.");
    }
  };

  const handleReject = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/indent/${
          indent.id
        }/decision?status=rejected`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error rejecting indent:", errorData);
        alert(errorData.clientMessage || "Failed to reject the indent.");
        return;
      }

      const result = await response.json();
      // ------------------------------------------------------------------------------------------For notifications
      try {
        await sendNotification({
          receiver_ids: ['admin'],
          title: `Indent Rejected : ${result.data.data.indent_number || 'Indent'}`,
          message: `Indent ${result.data.data.indent_number || 'Indent'} successfully Rejected by ${user?.name || 'a user'}`,
          service_type: 'PROC',
          link: '',
          sender_id: user?.role || 'user',
          access: {
            module: "PROC",
            menu: "Indent Management",
          }
        });
        console.log(`Notification sent for Indent Rejection ${result.data.data.indent_number || 'Indent'}`);
      } catch (notifError) {
        console.error('Failed to send notification:', notifError);
        // Continue with the flow even if notification fails
      }
      // ------------------------------------------------------------------------------------------
      console.log("Indent rejected successfully:", result);
      alert("Indent rejected successfully!");
      onClose();
    } catch (error) {
      console.error("Error rejecting indent:", error);
      alert("An error occurred while rejecting the indent.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <FileText className="w-6 h-6 text-orange-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Approve Indent
            </h2>
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              Pending Approval
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Indent Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Indent Number</p>
                  <p className="font-medium text-gray-900">
                    {indent.indentNumber}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Package className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Project Name</p>
                  <p className="font-medium text-gray-900">
                    {indent.projectName}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Created By</p>
                  <p className="font-medium text-gray-900">
                    {indent.createdBy}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Package className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">No Of Items</p>
                  <p className="font-medium text-gray-900">
                    {indent.noOfItems}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Requested Date</p>
                  <p className="font-medium text-gray-900">
                    {indent.requestedOn}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Expected Date</p>
                  <p className="font-medium text-gray-900">
                    {indent.expectedDate}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Package className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Warehouse</p>
                  <p className="font-medium text-gray-900">
                    {indent.warehouseName}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Pending
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Original Comment Section */}
          {indent.comment && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Original Comment
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-600">{indent.comment}</p>
              </div>
            </div>
          )}

          {/* Item Details Table */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Item Details
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      HSN Code
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Item Code
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Item Name
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      UOM
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Required Qty
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {indent.items.map((item, index) => (
                    <tr key={index} className="border-t border-gray-200">
                      <td className="py-3 px-4 text-gray-600">
                        {item.hsnCode}
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900">
                        {item.itemCode}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {item.itemName}
                      </td>
                      <td className="py-3 px-4 text-gray-600">{item.uom}</td>
                      <td className="py-3 px-4 text-gray-600">
                        {item.requiredQty}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Approval Comment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Approval Comment
            </label>
            <textarea
              rows={4}
              value={approvalComment}
              onChange={(e) => setApprovalComment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your approval or rejection comments..."
            />
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleReject}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <XCircle className="w-4 h-4" />
            <span>Reject</span>
          </button>
          <button
            onClick={handleApprove}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Approve</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApproveIndentModal;
