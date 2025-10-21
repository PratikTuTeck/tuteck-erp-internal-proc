import React, { useState, useEffect } from "react";
import { Users } from "lucide-react";
import axios from "axios";
import SelectVendorsForCSModal from "./SelectVendorsForCSModal";

import useNotifications from '../../hooks/useNotifications';
import { useAuth } from '../../hooks/useAuth';

interface CSItem {
  itemCode: string;
  itemName: string;
  vendorOptions: any[];
  selectedVendors: any[]; // Changed from string[] to any[] to store full vendor objects
  requiredQty: number;
  itemId?: string;
  indentItemId?: any[];
}

interface RFQData {
  id: string;
  rfq_number: string;
  rfq_date: string;
  rfq_end_date: string;
  warehouses: Array<{
    warehouse_name: string;
    warehouse_address?: string;
  }>;
  vendors: Array<{
    business_name: string;
  }>;
  items: Array<{
    item_code: string;
    item_name: string;
    required_quantity: number;
  }>;
}

const GenerateCSTab: React.FC = () => {
  //----------------------------------------------------------------------------------- For Notification
  const token = localStorage.getItem('auth_token') || '';
  const { user } = useAuth();
  const { sendNotification } = useNotifications(user?.role, token);
  //------------------------------------------------------------------------------------

  const [showSelectVendors, setShowSelectVendors] = useState(false);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(
    null
  );
  const [selectedRFQ, setSelectedRFQ] = useState("");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rfqs, setRfqs] = useState<Array<{ id: string; name: string }>>([]);

  const [formData, setFormData] = useState({
    rfqDate: "",
    endDate: "",
    warehouseName: "",
    warehouseAddress: "",
  });

  const [csItems, setCSItems] = useState<CSItem[]>([
    {
      itemCode: "ITM-001",
      itemName: "Steel Rod",
      vendorOptions: [
        { business_name: "Vendor X" },
        { business_name: "Vendor Y" },
      ],
      selectedVendors: [],
      requiredQty: 100,
      itemId: "",
      indentItemId: [],
    },
    {
      itemCode: "ITM-002",
      itemName: "Steel Plate",
      vendorOptions: [
        { business_name: "Vendor A" },
        { business_name: "Vendor B" },
        { business_name: "Vendor C" },
      ],
      selectedVendors: [],
      requiredQty: 50,
      itemId: "",
      indentItemId: [],
    },
  ]);

  // Fetch RFQs from API
  useEffect(() => {
    fetchRFQs();
  }, []);

  const fetchRFQs = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/rfq`
      );
      if (response.data?.data) {
        const mappedRFQs = response.data.data
          .filter((rfq: any) => rfq.approval_status === "APPROVED")
          .map((rfq: any) => ({
            id: rfq.id,
            name: rfq.rfq_number,
          }));
        setRfqs(mappedRFQs);
      }
    } catch (err) {
      console.error("Error fetching RFQs:", err);
      setError("Failed to fetch RFQs. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRFQChange = async (rfqId: string) => {
    setSelectedRFQ(rfqId);
    setSelectedItems([]); // Clear selected items when changing RFQ
    if (rfqId) {
      await fetchRFQDetails(rfqId);
    } else {
      // Reset form data and items when no RFQ is selected
      setFormData({
        rfqDate: "",
        endDate: "",
        warehouseName: "",
        warehouseAddress: "",
      });
      setCSItems([]);
    }
  };

  const fetchRFQDetails = async (rfqId: string) => {
    try {
      setLoading(true);
      setError("");
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/rfq/${rfqId}`
      );
      if (response.data?.data) {
        const rfqData: RFQData = response.data.data;

        // Update form data with RFQ details
        setFormData({
          rfqDate: rfqData.rfq_date
            ? new Date(rfqData.rfq_date).toISOString().split("T")[0]
            : "",
          endDate: rfqData.rfq_end_date
            ? new Date(rfqData.rfq_end_date).toISOString().split("T")[0]
            : "",
          warehouseName:
            rfqData.warehouses?.map((w) => w.warehouse_name).join(", ") || "",
          warehouseAddress:
            rfqData.warehouses
              ?.map((w) => w.warehouse_address)
              .filter(Boolean)
              .join(", ") || "",
        });

        // Update CS items with vendor options from the RFQ
        if (rfqData.items && rfqData.items.length > 0) {
          // Create CS items from RFQ items
          const rfqItems = rfqData.items.map((item: any) => ({
            itemCode: item.details?.item_code || "",
            itemName: item.details?.item_name || "",
            vendorOptions: item.associatedVendors || [],
            selectedVendors: [],
            requiredQty: Number(item.total_required_quantity) || 0,
            itemId: item.details?.id || item.id || "",
            indentItemId:
              Array.from(
                new Set(
                  (item.associatedVendors || []).map(
                    (vendor: any) => vendor.indent_item_id
                  )
                )
              ) || [],
          }));
          setCSItems(rfqItems);
        } else {
          // If no items in RFQ, update existing items with vendor options
          const updatedItems = csItems.map((item) => ({
            ...item,
            vendorOptions: rfqData.vendors || [],
            selectedVendors: [],
          }));
          setCSItems(updatedItems);
        }
      }
    } catch (err) {
      console.error("Error fetching RFQ details:", err);
      setError("Failed to fetch RFQ details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectVendors = (itemIndex: number) => {
    setSelectedItemIndex(itemIndex);
    setShowSelectVendors(true);
  };

  const handleVendorsSelected = (selectedVendorData: any[]) => {
    console.log("********Selected vendors:", selectedVendorData);
    if (selectedItemIndex !== null) {
      const updatedItems = [...csItems];
      // Store the full vendor data instead of just vendor names
      updatedItems[selectedItemIndex].selectedVendors = selectedVendorData;
      setCSItems(updatedItems);
    }
    setShowSelectVendors(false);
    setSelectedItemIndex(null);
  };

  const handleItemSelect = (itemCode: string) => {
    setSelectedItems((prev) =>
      prev.includes(itemCode)
        ? prev.filter((code) => code !== itemCode)
        : [...prev, itemCode]
    );
  };

  const handleSelectAllItems = () => {
    setSelectedItems((prev) =>
      prev.length === csItems.length ? [] : csItems.map((item) => item.itemCode)
    );
  };

  const handleSubmitCS = async () => {
    if (!selectedRFQ) {
      alert("Please select an RFQ");
      return;
    }

    if (selectedItems.length === 0) {
      alert("Please select at least one item");
      return;
    }

    const hasUnselectedVendors = csItems
      .filter((item) => selectedItems.includes(item.itemCode))
      .some((item) => item.selectedVendors.length === 0);

    if (hasUnselectedVendors) {
      alert("Please select vendors for all selected items");
      return;
    }

    try {
      setLoading(true);
      setError("");

      // Step 1: Create the comparative statement record
      const csResponse = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/cs`,
        {
          rfq_id: selectedRFQ,
        }
      );

      if (!csResponse.data.success) {
        throw new Error(
          csResponse.data.clientMessage ||
            "Failed to create comparative statement"
        );
      }

      const csId = csResponse.data.data.id;
      console.log("Created CS with ID:", csId);

      // Step 2: Prepare bulk payload for CS details
      const bulkPayload = [];

      // Get selected items with their vendor data
      const selectedItemsData = csItems.filter((item) =>
        selectedItems.includes(item.itemCode)
      );

      console.log("Selected items data:", selectedItemsData);

      for (const item of selectedItemsData) {
        const indentItemIds = item.indentItemId || [];

        // Use the full vendor data stored when vendors are selected
        for (const selectedVendor of item.selectedVendors) {
          let qtyToProcure = selectedVendor.qtyToProcure;

          for (const indentItemId of indentItemIds) {
            const requiredQty = Number(
              item.vendorOptions.filter(
                (option) =>
                  option.vendor_id == selectedVendor.vendorId &&
                  option.indent_item_id == indentItemId
              )[0]?.required_quantity || 0
            );

            let selectRequiredQty = requiredQty;

            if (qtyToProcure <= requiredQty) {
              selectRequiredQty = qtyToProcure;
            } else {
              selectRequiredQty = requiredQty;
              qtyToProcure -= selectRequiredQty;
            }

            bulkPayload.push({
              item_id: item.itemId,
              indent_item_id: indentItemId,
              vendor_id: selectedVendor.vendorId,
              rfq_id: selectedRFQ,
              rate: selectedVendor.rate,
              is_po_generated: false,
              cs_id: csId,
              selected_qty: selectRequiredQty,
              required_qty: requiredQty,
              can_provide_qty: selectedVendor.canProvideQty,
            });
          }
        }
      }

      console.log("Bulk payload prepared:", bulkPayload);

      // Step 3: Create CS details in bulk
      if (bulkPayload.length > 0) {
        const bulkResponse = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/cs-details/bulk`,
          bulkPayload
        );

        if (!bulkResponse.data.success) {
          throw new Error(
            bulkResponse.data.clientMessage || "Failed to create CS details"
          );
        }

        console.log("CS details created successfully:", bulkResponse.data.data);
      }

      // ------------------------------------------------------------------------------------------For notifications
      try {
        const selectedRFQData = rfqs.find((rfq) => rfq.id === selectedRFQ);
        const rfqNumber = selectedRFQData?.name || selectedRFQ || 'RFQ';
        const csNumber = csResponse.data.data?.cs_number || csId || 'CS';
        
        await sendNotification({
          receiver_ids: ['admin'],
          title: `Comparative Statement Submitted: ${csNumber}`,
          message: `New Comparative Statement ${csNumber} has been submitted for RFQ ${rfqNumber} by ${user?.name || 'a user'} with ${selectedItems.length} items`,
          service_type: 'PROC',
          link: '',
          sender_id: user?.role || 'user',
          access: {
            module: "PROC",
            menu: "Vendor Quotation Management",
          }
        });
        console.log(`Notification sent for Comparative Statement Submitted: ${csNumber}`);
      } catch (notifError) {
        console.error('Failed to send notification:', notifError);
        // Continue with the flow even if notification fails
      }
      // ------------------------------------------------------------------------------------------

      alert("Comparative Statement submitted successfully!");

      // Reset form or redirect as needed
      // You might want to navigate to a different page or reset the form here
    } catch (error: any) {
      console.error("Error submitting CS:", error);
      setError(
        error.message ||
          "Failed to submit comparative statement. Please try again."
      );
      alert("Failed to submit comparative statement. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Generate Comparative Statement
        </h2>
        <p className="text-gray-600">
          Compare vendor quotations per item and generate a comparative
          statement.
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Header Fields */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="pb-4 border-b border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select RFQ <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedRFQ}
              onChange={(e) => handleRFQChange(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">
                {loading ? "Loading RFQs..." : "Select RFQ"}
              </option>
              {rfqs.map((rfq) => (
                <option key={rfq.id} value={rfq.id}>
                  {rfq.name}
                </option>
              ))}
            </select>
          </div>

          {/* <div className="flex items-end">
            <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Eye className="w-4 h-4" />
              <span>View Project Details</span>
            </button>
          </div> */}
        </div>

        {selectedRFQ && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                RFQ Date
              </label>
              <input
                type="text"
                value={formData.rfqDate}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="text"
                value={formData.endDate}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Warehouse Name
              </label>
              <input
                type="text"
                value={formData.warehouseName}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
              />
            </div>

            {/* <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Warehouse Address
              </label>
              <input
                type="text"
                value={formData.warehouseAddress}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
              />
            </div> */}
          </div>
        )}
      </div>

      {/* Item-Wise Quotation Comparison */}
      {selectedRFQ && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Item-Wise Quotation Comparison
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4">
                    <input
                      type="checkbox"
                      checked={
                        selectedItems.length === csItems.length &&
                        csItems.length > 0
                      }
                      onChange={handleSelectAllItems}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">
                    Item (Code + Name)
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">
                    Vendor Options
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">
                    Selected Vendors
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading && selectedRFQ ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500">
                      Loading RFQ items...
                    </td>
                  </tr>
                ) : csItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500">
                      {selectedRFQ
                        ? "No items found for this RFQ"
                        : "Please select an RFQ to view items"}
                    </td>
                  </tr>
                ) : (
                  csItems.map((item, index) => (
                    <tr
                      key={item.itemCode}
                      className="border-t border-gray-200 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(item.itemCode)}
                          onChange={() => handleItemSelect(item.itemCode)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900">
                        {item.itemCode} - {item.itemName}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {[...new Set(item.vendorOptions
                          .map((vendor) => vendor.business_name || vendor))]
                          .join(", ")}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {item.selectedVendors.length > 0
                          ? item.selectedVendors
                              .map((v: any) => v.vendorName || v)
                              .join(", ")
                          : "No vendors selected"}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleSelectVendors(index)}
                          className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                        >
                          <Users className="w-4 h-4" />
                          <span>Select Vendors</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSubmitCS}
              disabled={selectedItems.length === 0 || !selectedRFQ}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                selectedItems.length > 0 && selectedRFQ
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              SUBMIT Comparative Statement
            </button>
          </div>
        </div>
      )}

      {/* Select Vendors Modal */}
      {showSelectVendors && selectedItemIndex !== null && (
        <SelectVendorsForCSModal
          isOpen={showSelectVendors}
          onClose={() => {
            setShowSelectVendors(false);
            setSelectedItemIndex(null);
          }}
          onVendorsSelected={handleVendorsSelected}
          rfqId={selectedRFQ}
          item={csItems[selectedItemIndex]}
        />
      )}
    </div>
  );
};

export default GenerateCSTab;
