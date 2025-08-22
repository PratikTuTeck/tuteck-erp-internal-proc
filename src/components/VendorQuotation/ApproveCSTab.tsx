import React, { useState, useEffect } from "react";
import { Eye, CheckCircle } from "lucide-react";
import axios from "axios";
import ViewCSDetailsModal from "./ViewCSDetailsModal";

// API Response Interfaces
interface ItemIndentDetail {
  item_indent_id: string;
  id: string;
  rfq_id: string;
  rate: string;
  selected_qty: string;
  is_po_generated: boolean;
  approved_by: string | null;
  approved_on: string | null;
  approval_status: string | null;
  created_at: string;
  created_by: string;
  updated_at: string | null;
  updated_by: string | null;
  is_deleted: boolean;
  is_active: boolean;
  cs_id: string;
  required_qty: string;
  can_provide_qty: string;
  total_amount: number;
}

interface ItemDetail {
  item_id: string;
  item_code: string;
  item_name: string;
  item_total_amount: number;
  item_indent_details: ItemIndentDetail[];
}

interface APICSVendor {
  rfq_id: string;
  rfq_number: string;
  vendor_id: string;
  vendor_number: string;
  business_name: string;
  contact_no: string;
  vendor_total_amount: number;
  details: ItemDetail[];
}

interface APIResponse {
  success: boolean;
  statusCode: number;
  data: APICSVendor[];
  clientMessage: string;
  devMessage: string;
}

interface CSVendor {
  rfqNo: string;
  vendorNo: string;
  vendorName: string;
  contactNo: string;
  status: "pending" | "approved" | "rejected";
  totalAmount: number;
  rfq_id: string; // Add rfq_id for API calls
  vendor_id: string; // Add vendor_id for API calls
  items: Array<{
    itemCode: string;
    itemName: string;
    requiredQty: number;
    canProvideQty: number;
    rate: number;
    qtySelected: number;
    totalAmount: number;
  }>;
}

const ApproveCSTab: React.FC = () => {
  const [selectedRFQ, setSelectedRFQ] = useState("");
  const [showViewDetails, setShowViewDetails] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<CSVendor | null>(null);
  const [selectedVendorForApproval, setSelectedVendorForApproval] =
    useState<CSVendor | null>(null);
  const [csVendors, setCsVendors] = useState<CSVendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rfqs, setRfqs] = useState<Array<{ id: string; name: string }>>([]);
  const [loadingRFQs, setLoadingRFQs] = useState(false);

  // Function to fetch available RFQs
  const fetchRFQs = async () => {
    setLoadingRFQs(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/rfq`
      );
      if (response.data?.data) {
        const mappedRFQs = response.data.data.map((rfq: any) => ({
          id: rfq.id,
          name: rfq.rfq_number,
        }));
        setRfqs(mappedRFQs);
      }
    } catch (err) {
      console.error("Error fetching RFQs:", err);
    } finally {
      setLoadingRFQs(false);
    }
  };

  // Fetch RFQs on component mount
  useEffect(() => {
    fetchRFQs();
  }, []);

  // Function to fetch CS data for a specific RFQ
  const fetchCSData = async (rfqId: string) => {
    if (!rfqId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get<APIResponse>(
        `${import.meta.env.VITE_API_BASE_URL}/cs/rfq/${rfqId}`
      );

      if (response.data.success && response.data.data) {
        // Transform API data to match our UI structure
        const transformedData: CSVendor[] = response.data.data.map(
          (vendor: APICSVendor) => {
            // Determine vendor status based on approval status of all items
            const allItems = vendor.details.flatMap(
              (item) => item.item_indent_details
            );
            const hasApprovedItems = allItems.some(
              (item) => item.approval_status === "approved"
            );
            const hasRejectedItems = allItems.some(
              (item) => item.approval_status === "rejected"
            );
            const hasPendingItems = allItems.some(
              (item) =>
                !item.approval_status || item.approval_status === "pending"
            );

            let status: "pending" | "approved" | "rejected" = "pending";
            if (hasRejectedItems) {
              status = "rejected";
            } else if (hasApprovedItems && !hasPendingItems) {
              status = "approved";
            } else if (hasApprovedItems || hasPendingItems) {
              status = "pending";
            }

            // Group and aggregate items to prevent duplicates
            const itemsMap = new Map();
            vendor.details.forEach((item) => {
              const itemKey = `${item.item_code}-${item.item_name}`;

              if (!itemsMap.has(itemKey)) {
                itemsMap.set(itemKey, {
                  itemCode: item.item_code,
                  itemName: item.item_name,
                  requiredQty: 0,
                  canProvideQty: 0, // Will be set from first occurrence, not aggregated
                  rate: 0,
                  qtySelected: 0,
                  totalAmount: 0,
                  detailsCount: 0,
                  isFirstOccurrence: true,
                });
              }

              const aggregatedItem = itemsMap.get(itemKey);
              item.item_indent_details.forEach((indentDetail) => {
                aggregatedItem.requiredQty += parseInt(
                  indentDetail.required_qty
                );
                // Only set canProvideQty from first occurrence, don't aggregate
                if (aggregatedItem.isFirstOccurrence) {
                  aggregatedItem.canProvideQty = parseInt(
                    indentDetail.can_provide_qty
                  );
                  aggregatedItem.isFirstOccurrence = false;
                }
                aggregatedItem.qtySelected += parseInt(
                  indentDetail.selected_qty
                );
                aggregatedItem.totalAmount += indentDetail.total_amount;
                aggregatedItem.detailsCount += 1;
              });

              // Calculate average rate
              aggregatedItem.rate =
                aggregatedItem.totalAmount / aggregatedItem.qtySelected || 0;
            });

            return {
              rfqNo: vendor.rfq_number,
              vendorNo: vendor.vendor_number,
              vendorName: vendor.business_name,
              contactNo: vendor.contact_no,
              status: vendor.details[0].item_indent_details[0].approval_status,
              totalAmount: vendor.vendor_total_amount,
              rfq_id: vendor.rfq_id, // Add rfq_id from API response
              vendor_id: vendor.vendor_id, // Add vendor_id from API response
              items: Array.from(itemsMap.values()).map((item) => ({
                itemCode: item.itemCode,
                itemName: item.itemName,
                requiredQty: item.requiredQty,
                canProvideQty: item.canProvideQty,
                rate: item.rate,
                qtySelected: item.qtySelected,
                totalAmount: item.totalAmount,
              })),
            };
          }
        );

        setCsVendors(transformedData);
      }
    } catch (err: any) {
      console.error("Error fetching CS data:", err);
      // Clear previous data when there's an error
      setCsVendors([]);

      // Handle different error types
      if (err.response?.status === 404) {
        setError("No data found for this RFQ.");
      } else if (err.response?.status >= 400 && err.response?.status < 500) {
        setError(
          `Error: ${err.response?.data?.clientMessage || "Invalid request"}`
        );
      } else if (err.response?.status >= 500) {
        setError("Server error. Please try again later.");
      } else {
        setError("Failed to fetch CS data. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when RFQ is selected
  useEffect(() => {
    // Clear previous error state when RFQ changes
    setError(null);

    if (selectedRFQ) {
      fetchCSData(selectedRFQ);
    } else {
      setCsVendors([]);
    }
  }, [selectedRFQ]);

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

  // Since we fetch data for specific RFQ, no need to filter
  const filteredVendors = csVendors;

  const handleViewDetails = (vendor: CSVendor) => {
    setSelectedVendor(vendor);
    setShowViewDetails(true);
  };

  const handleApprove = (vendor: CSVendor) => {
    setSelectedVendorForApproval(vendor);
    setShowApprovalModal(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Approve Comparative Statement
        </h2>
        <p className="text-gray-600">
          Approve generated comparative statements per vendor.
        </p>
      </div>

      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select RFQ <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedRFQ}
            onChange={(e) => setSelectedRFQ(e.target.value)}
            className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading || loadingRFQs}
          >
            <option value="">
              {loadingRFQs ? "Loading RFQs..." : "Select an RFQ"}
            </option>
            {rfqs.map((rfq) => (
              <option key={rfq.id} value={rfq.id}>
                {rfq.name}
              </option>
            ))}
          </select>
          {loading && (
            <p className="text-sm text-blue-600 mt-2">Loading CS data...</p>
          )}
          {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
        </div>

        {/* CS Vendor-Wise Summary Table */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            CS Vendor-Wise Summary
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">
                    RFQ No.
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">
                    Vendor No.
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">
                    Vendor Name
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">
                    Contact No.
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">
                    Total Amount
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">
                    Status
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {console.log("Filtered Vendors:", filteredVendors)}{" "}
                {/* Debug log */}
                {filteredVendors.map((vendor, index) => (
                  <tr
                    key={index}
                    className="border-t border-gray-200 hover:bg-gray-50"
                  >
                    <td className="py-4 px-4 font-medium text-gray-900">
                      {vendor.rfqNo}
                    </td>
                    <td className="py-4 px-4 text-gray-600">
                      {vendor.vendorNo}
                    </td>
                    <td className="py-4 px-4 text-gray-600">
                      {vendor.vendorName}
                    </td>
                    <td className="py-4 px-4 text-gray-600">
                      {vendor.contactNo}
                    </td>
                    <td className="py-4 px-4 font-medium text-gray-900">
                      ₹{vendor.totalAmount.toLocaleString()}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          vendor.status
                        )}`}
                      >
                        {vendor.status.charAt(0).toUpperCase() +
                          vendor.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleViewDetails(vendor)}
                          className="flex items-center space-x-1 px-2 py-1 text-blue-600 hover:text-blue-800 transition-colors text-sm"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {vendor.status === "PENDING" && (
                          <button
                            onClick={() => handleApprove(vendor)}
                            className="flex items-center space-x-1 px-2 py-1 text-green-600 hover:text-green-800 transition-colors text-sm"
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

          {filteredVendors.length === 0 && !loading && (
            <div className="text-center py-8">
              {error ? (
                <div className="text-red-500">
                  <p className="text-lg font-medium">⚠️ {error}</p>
                  {error.includes("No data found") && (
                    <p className="text-sm text-gray-500 mt-2">
                      Please select a different RFQ or check if the RFQ has any
                      comparative statements.
                    </p>
                  )}
                </div>
              ) : selectedRFQ ? (
                <div className="text-gray-500">
                  <p>No comparative statements found for the selected RFQ.</p>
                </div>
              ) : (
                <div className="text-gray-500">
                  <p>Please select an RFQ to view comparative statements.</p>
                </div>
              )}
            </div>
          )}

          {loading && (
            <div className="text-center py-8 text-gray-500">
              <div className="inline-flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-500"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Loading comparative statements...
              </div>
            </div>
          )}
        </div>
      </div>

      {/* View Details Modal */}
      {showViewDetails && selectedVendor && (
        <ViewCSDetailsModal
          isOpen={showViewDetails}
          onClose={() => {
            setShowViewDetails(false);
            setSelectedVendor(null);
          }}
          onRefresh={() => fetchCSData(selectedRFQ)}
          vendor={selectedVendor}
          mode="view"
        />
      )}

      {/* Approval Modal */}
      {showApprovalModal && selectedVendorForApproval && (
        <ViewCSDetailsModal
          isOpen={showApprovalModal}
          onClose={() => {
            setShowApprovalModal(false);
            setSelectedVendorForApproval(null);
          }}
          onRefresh={() => fetchCSData(selectedRFQ)}
          vendor={selectedVendorForApproval}
          mode="approve"
        />
      )}
    </div>
  );
};

export default ApproveCSTab;
