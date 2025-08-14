import React, { useState, useEffect } from "react";
import { Plus, Search, Eye, Edit, CheckCircle } from "lucide-react";
import axios from "axios";
import RaiseIndentModal from "./RaiseIndentModal";
import ViewIndentModal from "./ViewIndentModal";
import ApproveIndentModal from "./ApproveIndentModal";

interface Indent {
  id: string;
  indentNumber: string;
  createdBy: string;
  requestedOn: string;
  warehouseName: string;
  expectedDate: string;
  approvedBy: string;
  approvedOn: string;
  status: "pending" | "approved" | "rejected";
  aggregateStatus?: string;
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
}

const IndentManagement: React.FC = () => {
  const [showRaiseModal, setShowRaiseModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [selectedIndent, setSelectedIndent] = useState<Indent | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [indents, setIndents] = useState<Indent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch indents when component mounts
  useEffect(() => {
    fetchIndents();
  }, []);

  const fetchIndents = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/indent`
      );
      if (response.data.success) {
        // Transform API response to match UI interface
        const transformedIndents = (response.data.data || []).map(
          (apiIndent: any) => ({
            id: apiIndent.id,
            indentNumber: apiIndent.indent_number,
            createdBy: apiIndent.created_by || "System", // Default if not provided
            requestedOn: apiIndent.request_date
              ? new Date(apiIndent.request_date).toISOString().split("T")[0]
              : "",
            warehouseName: apiIndent.recieving_warehouse || "N/A",
            expectedDate: apiIndent.expected_date
              ? new Date(apiIndent.expected_date).toISOString().split("T")[0]
              : "",
            approvedBy: apiIndent.approved_by || "",
            approvedOn: apiIndent.approved_on
              ? new Date(apiIndent.approved_on).toISOString().split("T")[0]
              : "",
            status: apiIndent.status?.toLowerCase() || "pending",
            aggregateStatus: apiIndent.approval_status || "PENDING",
            projectName:
              apiIndent.association_type === "Lead"
                ? "Lead Project"
                : "Warehouse Project", // Default project name
            noOfItems: 0, // This would need to come from indent details API
            comment: apiIndent.comment || "",
            items: [], // This would need to come from indent details API
          })
        );
        setIndents(transformedIndents);
      } else {
        setError("Failed to fetch indents");
      }
    } catch (err) {
      console.error("Error fetching indents:", err);
      setError("Error fetching indents");
    } finally {
      setLoading(false);
    }
  };

  const handleIndentCreated = () => {
    // Refresh indents after creating a new one
    fetchIndents();
  };

  // Mock data for fallback (can be removed once API is integrated)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleViewIndent = (indent: Indent) => {
    setSelectedIndent(indent);
    setShowViewModal(true);
  };

  const handleApproveIndent = (indent: Indent) => {
    setSelectedIndent(indent);
    setShowApproveModal(true);
  };

  const filteredIndents = indents.filter(
    (indent) =>
      (indent.indentNumber || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (indent.status || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (indent.createdBy || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Indent Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage indents and approvals</p>
        </div>
      </div>

      {/* Top Bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setShowRaiseModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Raise Indent</span>
          </button>

          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search Indents by number, status, created by..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-80 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-8">
            <div className="text-gray-600">Loading indents...</div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="flex justify-center items-center py-8">
            <div className="text-red-600">{error}</div>
          </div>
        )}

        {/* Indent List Table */}
        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">
                    Indent Number
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">
                    Created By
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">
                    Requested On
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">
                    Expected Date
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">
                    Approved By
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">
                    Approved On
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">
                    Status
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredIndents.map((indent) => (
                  <tr
                    key={indent.id}
                    className="border-b border-gray-200 hover:bg-gray-50"
                  >
                    <td className="py-4 px-4 font-medium text-gray-900">
                      {indent.indentNumber}
                    </td>
                    <td className="py-4 px-4 text-gray-600">
                      {indent.createdBy}
                    </td>
                    <td className="py-4 px-4 text-gray-600">
                      {indent.requestedOn}
                    </td>
                    <td className="py-4 px-4 text-gray-600">
                      {indent.expectedDate}
                    </td>
                    <td className="py-4 px-4 text-gray-600">
                      {indent.approvedBy || "-"}
                    </td>
                    <td className="py-4 px-4 text-gray-600">
                      {indent.approvedOn || "-"}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          indent.status
                        )}`}
                      >
                        {indent.status.charAt(0).toUpperCase() +
                          indent.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleViewIndent(indent)}
                          className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          className="p-1 text-gray-600 hover:text-gray-800 transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {indent.status === "pending" && (
                          <button
                            onClick={() => handleApproveIndent(indent)}
                            className="p-1 text-green-600 hover:text-green-800 transition-colors"
                            title="Approve"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {showRaiseModal && (
        <RaiseIndentModal
          isOpen={showRaiseModal}
          onClose={() => setShowRaiseModal(false)}
          onIndentCreated={handleIndentCreated}
        />
      )}

      {showViewModal && selectedIndent && (
        <ViewIndentModal
          isOpen={showViewModal}
          onClose={() => {
            setShowViewModal(false);
            setSelectedIndent(null);
          }}
          indent={{
            ...selectedIndent,
            aggregateStatus: selectedIndent.aggregateStatus || "N/A",
          }}
        />
      )}

      {showApproveModal && selectedIndent && (
        <ApproveIndentModal
          isOpen={showApproveModal}
          onClose={() => {
            setShowApproveModal(false);
            setSelectedIndent(null);
          }}
          indent={{
            ...selectedIndent,
            aggregateStatus: selectedIndent.aggregateStatus || "N/A",
          }}
        />
      )}
    </div>
  );
};

export default IndentManagement;
