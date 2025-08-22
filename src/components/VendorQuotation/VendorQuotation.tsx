import React, { useState } from "react";
import { Plus, Search, Eye, Edit, CheckCircle, Filter } from "lucide-react";
import axios from "axios";
import CreateRFQModal from "./CreateRFQModal";
import ApproveRFQModal from "./ApproveRFQModal";
import VendorQuotationEntry from "./VendorQuotationEntry";
import ApproveQuotationModal from "./ApproveQuotationModal";
import ViewQuotationModal from "./ViewQuotationModal";
import GenerateCSTab from "./GenerateCSTab";
import ApproveCSTab from "./ApproveCSTab";

interface RFQ {
  id: string;
  rfqNo: string;
  deliveryLocation: string;
  vendorOptions: string[];
  rfqDate: string;
  endDate: string;
  approvedBy: string;
  approvedOn: string;
  status: "pending" | "approved" | "rejected";
  items: any[];
  indents: any[];
}

interface VendorQuotation {
  id: string;
  quotationNo: string;
  rfqId: string;
  rfqNo: string;
  requestedBy: string;
  requestedOn: string;
  vendor: string;
  approvedBy: string;
  approvedOn: string;
  status: "pending" | "approved" | "rejected";
  details?: any; // Additional details from API response
}

const VendorQuotation: React.FC = () => {
  const [activeTab, setActiveTab] = useState("rfq");
  const [showCreateRFQ, setShowCreateRFQ] = useState(false);
  const [showApproveRFQ, setShowApproveRFQ] = useState(false);
  const [showQuotationEntry, setShowQuotationEntry] = useState(false);
  const [showApproveQuotation, setShowApproveQuotation] = useState(false);
  const [showViewQuotation, setShowViewQuotation] = useState(false);
  const [selectedRFQ, setSelectedRFQ] = useState<RFQ | null>(null);
  const [selectedQuotation, setSelectedQuotation] =
    useState<VendorQuotation | null>(null);
  const [selectedQuotationForView, setSelectedQuotationForView] =
    useState<VendorQuotation | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRFQForQuotation, setSelectedRFQForQuotation] = useState("");
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [approvedRFQs, setApprovedRFQs] = useState<RFQ[]>([]); // For Vendor Quotation section
  const [quotations, setQuotations] = useState<VendorQuotation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch RFQs on component mount and when activeTab changes
  React.useEffect(() => {
    if (activeTab === "rfq") {
      fetchRFQs();
    } else if (activeTab === "quotation") {
      fetchApprovedRFQs();
      fetchQuotations();
    }
  }, [activeTab]);
  // Fetch only approved RFQs for Vendor Quotation section
  const fetchApprovedRFQs = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get(
        `${
          import.meta.env.VITE_API_BASE_URL
        }/rfq/filter?approval_status=APPROVED`
      );
      if (response.data?.data) {
        const mappedRFQs = response.data.data.map((rfq: any) => ({
          id: rfq.id,
          rfqNo: rfq.rfq_number,
          deliveryLocation: "N/A",
          vendorOptions: [],
          rfqDate: rfq.rfq_date
            ? new Date(rfq.rfq_date).toISOString().split("T")[0]
            : "",
          endDate: rfq.rfq_end_date
            ? new Date(rfq.rfq_end_date).toISOString().split("T")[0]
            : "",
          approvedBy: rfq.approved_by || "",
          approvedOn: rfq.approved_on
            ? new Date(rfq.approved_on).toISOString().split("T")[0]
            : "",
          status: rfq.approval_status?.toLowerCase() || "pending",
        }));
        setApprovedRFQs(mappedRFQs);
      }
    } catch (err) {
      console.error("Error fetching approved RFQs:", err);
      setError("Failed to fetch approved RFQs");
    } finally {
      setLoading(false);
    }
  };

  const fetchRFQs = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/rfq`
      );
      if (response.data?.data) {
        const mappedRFQs = response.data.data.map((rfq: any) => ({
          id: rfq.id,
          rfqNo: rfq.rfq_number,
          deliveryLocation: "N/A", // Will be fetched from warehouse relation
          vendorOptions: Array.from(
            new Set((rfq.vendors || []).map((v: any) => v.business_name))
          ), // Unique business names from vendors array
          rfqDate: rfq.rfq_date
            ? new Date(rfq.rfq_date).toISOString().split("T")[0]
            : "",
          endDate: rfq.rfq_end_date
            ? new Date(rfq.rfq_end_date).toISOString().split("T")[0]
            : "",
          approvedBy: rfq.approved_by || "",
          approvedOn: rfq.approved_on
            ? new Date(rfq.approved_on).toISOString().split("T")[0]
            : "",
          status: rfq.approval_status?.toLowerCase() || "pending",
        }));
        setRfqs(mappedRFQs);
      }
    } catch (err) {
      console.error("Error fetching RFQs:", err);
      setError("Failed to fetch RFQs");
    } finally {
      setLoading(false);
    }
  };

  const fetchQuotations = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/vendor-quotation`
      );
      if (response.data?.data) {
        const mappedQuotations = response.data.data.map((quotation: any) => ({
          id: quotation.id,
          quotationNo: `VQ-${quotation.id.slice(0, 8)}`, // Generate display number
          rfqId: quotation.rfq_id || quotation.rfq?.id, // RFQ ID for filtering
          rfqNo: quotation.rfq_number || "N/A", // From joined RFQ table
          requestedBy: quotation.created_by || "System",
          requestedOn: quotation.created_at
            ? new Date(quotation.created_at).toISOString().split("T")[0]
            : "",
          vendor: quotation.vendor_name || "N/A", // From joined vendor table
          approvedBy: quotation.approved_by || "",
          approvedOn: quotation.approved_on
            ? new Date(quotation.approved_on).toISOString().split("T")[0]
            : "",
          status: quotation.approval_status?.toLowerCase() || "pending",
        }));
        setQuotations(mappedQuotations);
      }
    } catch (err) {
      console.error("Error fetching quotations:", err);
      setError("Failed to fetch quotations");
    } finally {
      setLoading(false);
    }
  };

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

  const handleApproveRFQ = async (rfq: RFQ) => {
    try {
      setLoading(true);
      setError("");

      // Fetch RFQ details from the API
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/rfq/${rfq.id}`
      );

      if (response.data?.data) {
        const apiData = response.data.data;

        // Format the data as required
        const formattedRFQ: RFQ = {
          id: apiData.id,
          rfqNo: apiData.rfq_number,
          rfqDate: apiData.rfq_date
            ? new Date(apiData.rfq_date).toISOString().split("T")[0]
            : "",
          endDate: apiData.rfq_end_date
            ? new Date(apiData.rfq_end_date).toISOString().split("T")[0]
            : "",
          approvedBy: apiData.approved_by || "",
          approvedOn: apiData.approved_on
            ? new Date(apiData.approved_on).toISOString().split("T")[0]
            : "",
          status: apiData.approval_status?.toLowerCase() || "pending",
          deliveryLocation:
            apiData.warehouses
              .map((warehouse: any) => warehouse.warehouse_name)
              .join(", ") || "N/A",
          vendorOptions: Array.from(
            new Set(apiData.vendors.map((vendor: any) => vendor.business_name))
          ),
          items: apiData.items || [],
          indents: apiData.indents || [],
        };

        // Update the state with the formatted data
        setSelectedRFQ(formattedRFQ);
        setShowApproveRFQ(true);
      }
    } catch (err) {
      console.error("Error fetching RFQ details:", err);
      setError("Failed to fetch RFQ details");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveQuotation = async (quotation: VendorQuotation) => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/vendor-quotation/${quotation.id}`
      );
      console.log("API Response:", response.data); // Debug log
      if (response.data) {
        // Map the API response to the quotation object with detailed data
        const quotationWithDetails = {
          ...quotation,
          details: response.data, // Store the entire response
        };
        setSelectedQuotation(quotationWithDetails);
        setShowApproveQuotation(true);
      } else {
        console.error("No data received from API");
        setError("No quotation data received");
      }
    } catch (err) {
      console.error("Error fetching quotation details:", err);
      setError("Failed to fetch quotation details");
    } finally {
      setLoading(false);
    }
  };

  const handleViewQuotation = async (quotation: VendorQuotation) => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/vendor-quotation/${quotation.id}`
      );
      console.log("API Response for view:", response.data); // Debug log
      if (response.data) {
        // Map the API response to the quotation object with detailed data
        const quotationWithDetails = {
          ...quotation,
          details: response.data, // Store the entire response
        };
        setSelectedQuotationForView(quotationWithDetails);
        setShowViewQuotation(true);
      } else {
        console.error("No data received from API");
        setError("No quotation data received");
      }
    } catch (err) {
      console.error("Error fetching quotation details:", err);
      setError("Failed to fetch quotation details");
    } finally {
      setLoading(false);
    }
  };

  const handleViewRFQ = async (rfq: RFQ) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/rfq/${rfq.id}`
      );
      if (response.data?.data) {
        setSelectedRFQ({
          ...rfq,
          deliveryLocation:
            response.data.data.warehouse_names?.join(", ") || "N/A",
          vendorOptions: response.data.data.vendor_names || [],
        });
        // TODO: Create ViewRFQModal component
      }
    } catch (err) {
      console.error("Error fetching RFQ details:", err);
      alert("Failed to fetch RFQ details");
    }
  };

  const filteredRFQs = rfqs.filter(
    (rfq) =>
      rfq.rfqNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rfq.deliveryLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rfq.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredQuotations = quotations.filter(
    (quotation) =>
      !selectedRFQForQuotation || quotation.rfqId === selectedRFQForQuotation
  );

  const renderRFQManagement = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowCreateRFQ(true)}
            disabled={loading}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              loading
                ? "bg-gray-400 text-white cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Create RFQ</span>
          </button>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Filter RFQs by RFQ Number, Delivery Location, Status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-80 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">RFQ List</h3>

          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="flex flex-col items-center space-y-3">
                <div className="relative">
                  <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                </div>
                <div className="text-gray-600 font-medium">Loading RFQs...</div>
              </div>
            </div>
          )}

          {error && !loading && (
            <div className="flex justify-center items-center py-8">
              <div className="text-red-600">{error}</div>
            </div>
          )}

          {!loading && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      RFQ No.
                    </th>
                    {/* <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Delivery Location
                    </th> */}
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Vendor Options
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      RFQ Date
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      End Date
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
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {!loading && filteredRFQs.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center">
                        <div className="flex flex-col items-center space-y-3">
                          <FileText className="w-12 h-12 text-gray-300" />
                          <div className="text-gray-500 font-medium">
                            No RFQs found
                          </div>
                          <div className="text-gray-400 text-sm">
                            {searchTerm
                              ? "Try adjusting your search criteria"
                              : "Create your first RFQ to get started"}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                  {!loading &&
                    filteredRFQs.map((rfq) => (
                      <tr
                        key={rfq.id}
                        className="border-b border-gray-200 hover:bg-gray-50"
                      >
                        <td className="py-4 px-4 font-medium text-gray-900">
                          {rfq.rfqNo}
                        </td>
                        {/* <td className="py-4 px-4 text-gray-600">
                      {rfq.deliveryLocation}
                    </td> */}
                        <td className="py-4 px-4 text-gray-600">
                          {rfq.vendorOptions.join(", ")}
                        </td>
                        <td className="py-4 px-4 text-gray-600">
                          {rfq.rfqDate}
                        </td>
                        <td className="py-4 px-4 text-gray-600">
                          {rfq.endDate}
                        </td>
                        <td className="py-4 px-4 text-gray-600">
                          {rfq.approvedBy || "-"}
                        </td>
                        <td className="py-4 px-4 text-gray-600">
                          {rfq.approvedOn || "-"}
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              rfq.status
                            )}`}
                          >
                            {rfq.status.charAt(0).toUpperCase() +
                              rfq.status.slice(1)}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => handleViewRFQ(rfq)}
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
                            {rfq.status === "pending" && (
                              <button
                                onClick={() => handleApproveRFQ(rfq)}
                                disabled={loading}
                                className={`p-1 transition-colors ${
                                  loading
                                    ? "text-gray-400 cursor-not-allowed"
                                    : "text-green-600 hover:text-green-800"
                                }`}
                                title="Approve"
                              >
                                {loading ? (
                                  <div className="w-4 h-4 border-2 border-gray-300 border-t-green-600 rounded-full animate-spin"></div>
                                ) : (
                                  <CheckCircle className="w-4 h-4" />
                                )}
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
      </div>
    </div>
  );

  const renderVendorQuotation = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <select
              value={selectedRFQForQuotation}
              onChange={(e) => setSelectedRFQForQuotation(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select RFQ*</option>
              {approvedRFQs.map((rfq) => (
                <option key={rfq.id} value={rfq.id}>
                  {rfq.rfqNo}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setShowQuotationEntry(true)}
            disabled={!selectedRFQForQuotation}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedRFQForQuotation
                ? "bg-green-600 text-white hover:bg-green-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Vendor Quotation Entry</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Vendor Quotation List
          </h3>

          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="flex flex-col items-center space-y-3">
                <div className="relative">
                  <div className="w-10 h-10 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
                </div>
                <div className="text-gray-600 font-medium">
                  Loading quotations...
                </div>
              </div>
            </div>
          )}

          {error && !loading && (
            <div className="flex justify-center items-center py-8">
              <div className="text-red-600">{error}</div>
            </div>
          )}

          {!loading && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Quotation No.
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      RFQ No.
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Requested By/On
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Vendor
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Approved By/On
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
                  {!loading && filteredQuotations.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center">
                        <div className="flex flex-col items-center space-y-3">
                          <FileText className="w-12 h-12 text-gray-300" />
                          <div className="text-gray-500 font-medium">
                            No quotations found
                          </div>
                          <div className="text-gray-400 text-sm">
                            {selectedRFQForQuotation
                              ? "No quotations for selected RFQ"
                              : "Select an RFQ to view quotations"}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                  {!loading &&
                    filteredQuotations.map((quotation) => (
                      <tr
                        key={quotation.id}
                        className="border-b border-gray-200 hover:bg-gray-50"
                      >

                        <td className="py-4 px-4 font-medium text-gray-900">
                          {quotation.quotationNo}
                        </td>
                        <td className="py-4 px-4 text-gray-600">
                          {quotation.rfqNo}
                        </td>
                        <td className="py-4 px-4 text-gray-600">
                          {quotation.requestedBy} / {quotation.requestedOn}
                        </td>
                        <td className="py-4 px-4 text-gray-600">
                          {quotation.vendor}
                        </td>
                        <td className="py-4 px-4 text-gray-600">
                          {quotation.approvedBy
                            ? `${quotation.approvedBy} / ${quotation.approvedOn}`
                            : "-"}
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              quotation.status
                            )}`}
                          >
                             {quotation.status.charAt(0).toUpperCase() +
                          quotation.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleViewQuotation(quotation)}
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
                        {quotation.status === "pending" && (
                          <button
                            onClick={() => handleApproveQuotation(quotation)}
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
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Vendor Quotation Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage RFQs, vendor quotations, and comparative statements
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex space-x-8 px-6">
            {[
              { id: "rfq", label: "RFQ Management" },
              { id: "quotation", label: "Vendor Quotation" },
              { id: "generate-cs", label: "Generate CS" },
              { id: "approve-cs", label: "Approve CS" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {activeTab === "rfq" && renderRFQManagement()}
          {activeTab === "quotation" && renderVendorQuotation()}
          {activeTab === "generate-cs" && <GenerateCSTab />}
          {activeTab === "approve-cs" && <ApproveCSTab />}
        </div>
      </div>

      {/* Modals */}
      {showCreateRFQ && (
        <CreateRFQModal
          isOpen={showCreateRFQ}
          onClose={() => {
            setShowCreateRFQ(false);
            fetchRFQs(); // Refresh RFQs after creating
          }}
        />
      )}

      {showApproveRFQ && selectedRFQ && (
        <ApproveRFQModal
          isOpen={showApproveRFQ}
          onClose={() => {
            setShowApproveRFQ(false);
            setSelectedRFQ(null);
          }}
          rfq={selectedRFQ}
        />
      )}

      {showQuotationEntry && (
        <VendorQuotationEntry
          isOpen={showQuotationEntry}
          onClose={() => {
            setShowQuotationEntry(false);
            // Refresh quotations list after closing the modal
            if (activeTab === "quotation") {
              fetchQuotations();
            }
          }}
          selectedRFQ={selectedRFQForQuotation}
        />
      )}

      {showApproveQuotation && selectedQuotation && (
        <ApproveQuotationModal
          isOpen={showApproveQuotation}
          onClose={() => {
            setShowApproveQuotation(false);
            setSelectedQuotation(null);
            // Refresh quotations list after approval/rejection
            if (activeTab === "quotation") {
              fetchQuotations();
            }
          }}
          quotation={selectedQuotation}
        />
      )}

      {/* View Quotation Modal */}
      {showViewQuotation && selectedQuotationForView && (
        <ViewQuotationModal
          isOpen={showViewQuotation}
          onClose={() => {
            setShowViewQuotation(false);
            setSelectedQuotationForView(null);
          }}
          quotation={selectedQuotationForView}
        />
      )}
    </div>
  );
};

export default VendorQuotation;
