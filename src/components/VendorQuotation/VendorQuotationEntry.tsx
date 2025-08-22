import React, { useState } from "react";
import { X, Plus, Edit, Save, Trash2, Upload } from "lucide-react";
import axios from "axios";

interface VendorQuotationEntryProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRFQ: string;
}

interface PaymentMilestone {
  id: string;
  type: string;
  paymentType: string;
  amount: string;
  reason: string;
}

interface QuotationItem {
  slNo: number;
  itemCode: string;
  itemName: string;
  uom: string;
  procureQty: number;
  canProvideQty: number;
  rate: number;
  isEditing: boolean;
  itemId?: string; // Store the actual item ID for API submission
  indentItemId?: string; // Store indent_item_id for reference
  indentItemIds?: string[]; // Store all indent item IDs for this item
}

const VendorQuotationEntry: React.FC<VendorQuotationEntryProps> = ({
  isOpen,
  onClose,
  selectedRFQ,
}) => {
  const [rfqDetails, setRfqDetails] = useState<any>(null);
  const [vendors, setVendors] = useState<any[]>([]);
  const [availableRFQs, setAvailableRFQs] = useState<any[]>([]);
  const [availableIndents, setAvailableIndents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingRFQDetails, setFetchingRFQDetails] = useState(false);
  const [fetchingVendorItems, setFetchingVendorItems] = useState(false);
  const [submissionStep, setSubmissionStep] = useState("");

  const [formData, setFormData] = useState({
    rfq: selectedRFQ || "",
    indentId: "",
    vendor: "",
    entryDate: new Date().toISOString().split("T")[0],
    timeOfDelivery: "",
    responseTime: "",
    priceValidity: "",
    deliveryPeriod: "",
    packaging: false,
    freight: false,
    loading: false,
    unloading: false,
    warranty: false,
    comment: "",
  });

  const [paymentMilestones, setPaymentMilestones] = useState<
    PaymentMilestone[]
  >([
    {
      id: "1",
      type: "Advance",
      paymentType: "%",
      amount: "10%",
      reason: "Initial deposit",
    },
  ]);

  const [quotationItems, setQuotationItems] = useState<QuotationItem[]>([]);

  // Fetch RFQs and vendors on component mount
  React.useEffect(() => {
    if (isOpen) {
      fetchAvailableRFQs();
      // Only fetch all vendors if no RFQ is selected initially
      if (!selectedRFQ) {
        fetchVendors();
      }

      // If selectedRFQ is passed, prefill it and fetch its details
      if (selectedRFQ) {
        setFormData((prev) => ({ ...prev, rfq: selectedRFQ }));
        fetchRFQDetailsById(selectedRFQ);
      }
    }
  }, [isOpen, selectedRFQ]);

  // Fetch RFQ details when RFQ selection changes in dropdown
  React.useEffect(() => {
    if (formData.rfq && formData.rfq !== selectedRFQ) {
      fetchRFQDetailsById(formData.rfq);
    }
  }, [formData.rfq]);

  // Fetch vendor items when both vendor and RFQ are selected
  React.useEffect(() => {
    if (formData.vendor && formData.rfq) {
      fetchVendorItems(formData.vendor, formData.rfq);
    }
  }, [formData.vendor, formData.rfq]);

  const fetchAvailableRFQs = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/rfq`
      );
      if (response.data?.data) {
        const mappedRFQs = response.data.data.map((rfq: any) => ({
          id: rfq.id,
          name: rfq.rfq_number,
          rfqNumber: rfq.rfq_number,
        }));
        setAvailableRFQs(mappedRFQs);
      }
    } catch (err) {
      console.error("Error fetching available RFQs:", err);
    }
  };

  const fetchRFQDetailsById = async (rfqId: string) => {
    if (!rfqId) return;

    setFetchingRFQDetails(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/rfq/${rfqId}/details`
      );
      if (response.data?.success && response.data?.data) {
        const rfqData = response.data.data;
        setRfqDetails(rfqData);

        // Map vendors from the RFQ details response
        if (rfqData.vendors && Array.isArray(rfqData.vendors)) {
          const rfqVendors = rfqData.vendors.map((vendor: any) => ({
            id: vendor.vendor_id,
            name: vendor.vendor_name,
            rfqVendorId: vendor.rfq_vendor_id || vendor.vendor_id, // Store rfq_vendor_id for submission
            indentItemId: vendor.indent_item_id, // Store for reference
          }));
          // Remove duplicates based on vendor_id
          const uniqueVendors = rfqVendors.filter(
            (vendor: any, index: number, self: any[]) =>
              index === self.findIndex((v) => v.id === vendor.id)
          );
          setVendors(uniqueVendors);
        }

        // Set available indents
        if (rfqData.indents && Array.isArray(rfqData.indents)) {
          setAvailableIndents(rfqData.indents);
        }

        // Prefill form data based on RFQ details
        setFormData((prev) => ({
          ...prev,
          // Set first indent ID if available
          indentId:
            rfqData.indents && rfqData.indents.length > 0
              ? rfqData.indents[0].indent_number
              : "",
          timeOfDelivery: rfqData.expected_delivery_date
            ? new Date(rfqData.expected_delivery_date)
                .toISOString()
                .split("T")[0]
            : "",
          priceValidity: rfqData.rfq_end_date
            ? new Date(rfqData.rfq_end_date).toISOString().split("T")[0]
            : "",
          deliveryPeriod: rfqData.delivery_period || "",
          comment: rfqData.notes || "",
        }));

        // Note: Items will be loaded when vendor is selected
        // via the fetchVendorItems function
      }
    } catch (err) {
      console.error("Error fetching RFQ details:", err);
      alert("Failed to fetch RFQ details. Please try again.");
    } finally {
      setFetchingRFQDetails(false);
    }
  };

  const fetchVendors = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/vendors?approval_status=APPROVED`
      );
      if (response.data?.data) {
        const mappedVendors = response.data.data.map((vendor: any) => ({
          id: vendor.id,
          name: vendor.vendor_name,
        }));
        setVendors(mappedVendors);
      }
    } catch (err) {
      console.error("Error fetching vendors:", err);
    }
  };

  const fetchVendorItems = async (vendorId: string, rfqId: string) => {
    if (!vendorId || !rfqId) return;

    setFetchingVendorItems(true);
    try {
      const response = await axios.get(
        `${
          import.meta.env.VITE_API_BASE_URL
        }/rfq-vendor/vendor/${vendorId}/rfq/${rfqId}/items`
      );
      if (response.data?.success && response.data?.data) {
        const data = response.data.data;
        const items = data.indent_items || [];
        console.log("Raw items data:", items);

        // Map the items to quotation items format
        // Group items by their core properties to avoid duplicates in UI
        const mappedItems: QuotationItem[] = [];

        items.forEach((item: any, index: number) => {
          const indentItemIds = item.indent_item_ids || [];

          // Create single UI entry per item, but store all indent item IDs
          mappedItems.push({
            slNo: index + 1,
            itemCode: item.item_details?.item_code || "",
            itemName: item.item_details?.item_name || "",
            uom: "", // UOM not provided in current response
            procureQty: parseFloat(item.required_quantity) || 0,
            canProvideQty: parseFloat(item.required_quantity) || 0,
            rate: 0,
            isEditing: false,
            itemId: item.item_details?.item_id || "",
            indentItemId: indentItemIds.length > 0 ? indentItemIds[0] : "", // Use first indent item ID as default
            indentItemIds: indentItemIds, // Store all indent item IDs
          });
        });

        console.log(
          "Mapped quotation items with indent item IDs:",
          mappedItems
        );
        setQuotationItems(mappedItems);
      }
    } catch (err) {
      console.error("Error fetching vendor items:", err);
      alert("Failed to fetch vendor items. Please try again.");
    } finally {
      setFetchingVendorItems(false);
    }
  };

  if (!isOpen) return null;

  const handleRFQChange = (selectedRFQId: string) => {
    // Clear vendor selection when changing RFQ
    setFormData({
      ...formData,
      rfq: selectedRFQId,
      vendor: "", // Clear vendor selection
      indentId: "", // Clear indent ID
      timeOfDelivery: "",
      priceValidity: "",
      deliveryPeriod: "",
      comment: "",
    });
    // Clear vendors, indents, and quotation items until new RFQ details are loaded
    setVendors([]);
    setAvailableIndents([]);
    setQuotationItems([]); // Clear items when RFQ changes
    // The useEffect will handle fetching details when formData.rfq changes
  };

  const handleAddMilestone = () => {
    const newMilestone: PaymentMilestone = {
      id: Date.now().toString(),
      type: "",
      paymentType: "%",
      amount: "",
      reason: "",
    };
    setPaymentMilestones([...paymentMilestones, newMilestone]);
  };

  const handleDeleteMilestone = (id: string) => {
    setPaymentMilestones(
      paymentMilestones.filter((milestone) => milestone.id !== id)
    );
  };

  const handleMilestoneChange = (
    id: string,
    field: keyof PaymentMilestone,
    value: string
  ) => {
    setPaymentMilestones(
      paymentMilestones.map((milestone) =>
        milestone.id === id ? { ...milestone, [field]: value } : milestone
      )
    );
  };

  const handleEditItem = (slNo: number) => {
    setQuotationItems(
      quotationItems.map((item) =>
        item.slNo === slNo ? { ...item, isEditing: true } : item
      )
    );
  };

  const handleSaveItem = (slNo: number) => {
    setQuotationItems(
      quotationItems.map((item) =>
        item.slNo === slNo ? { ...item, isEditing: false } : item
      )
    );
  };

  const handleItemChange = (
    slNo: number,
    field: keyof QuotationItem,
    value: number
  ) => {
    setQuotationItems(
      quotationItems.map((item) =>
        item.slNo === slNo ? { ...item, [field]: value } : item
      )
    );
  };

  const handleSubmitQuotation = async () => {
    if (
      !formData.rfq ||
      !formData.vendor ||
      !formData.timeOfDelivery ||
      !formData.priceValidity ||
      !formData.deliveryPeriod
    ) {
      alert("Please fill all mandatory fields");
      return;
    }

    if (quotationItems.length === 0) {
      alert("Please select vendor items before submitting");
      return;
    }

    // Validate that all items have rates, quantities, and indentItemIds
    const invalidItems = quotationItems.filter(
      (item) =>
        !item.rate ||
        item.rate <= 0 ||
        !item.canProvideQty ||
        item.canProvideQty <= 0 ||
        !item.indentItemIds ||
        item.indentItemIds.length === 0 ||
        item.indentItemIds.some(
          (id) => !id || id === "undefined" || id === "null"
        )
    );

    if (invalidItems.length > 0) {
      alert(
        `Please set valid rates, quantities, and ensure all items have valid indent item IDs. Items with missing data: ${invalidItems
          .map((item) => item.itemName)
          .join(", ")}`
      );
      return;
    }

    // Helper function to clean UUID values
    const cleanUuid = (value: string | null | undefined): string | null => {
      if (
        !value ||
        value.trim() === "" ||
        value === "undefined" ||
        value === "null"
      ) {
        return null;
      }
      return value.trim();
    };

    setLoading(true);
    setSubmissionStep("Creating vendor quotation...");
    try {
      const selectedVendor = vendors.find((v) => v.id === formData.vendor);

      // Calculate total number of entries that will be created
      const totalEntries = quotationItems.reduce((sum, item) => {
        const indentItemIds = item.indentItemIds || [];
        return sum + Math.max(1, indentItemIds.length); // At least 1 entry per item
      }, 0);

      // Step 1: Create vendor quotation
      const vendorQuotationPayload = {
        rfq_id: cleanUuid(formData.rfq),
        rfq_indent_item_id:
          quotationItems.length > 0 &&
          quotationItems[0].indentItemIds &&
          quotationItems[0].indentItemIds.length > 0
            ? cleanUuid(quotationItems[0].indentItemIds[0])
            : null,
        rfq_vendor_id: cleanUuid(selectedVendor?.rfqVendorId),
        required_items: totalEntries,
        propose_quotation_rate: quotationItems.reduce(
          (sum, item) => sum + item.rate * item.canProvideQty,
          0
        ),
        final_quotation_rate: quotationItems.reduce(
          (sum, item) => sum + item.rate * item.canProvideQty,
          0
        ),
        vendor_discount: 0, // Default value
        quotation_sent_date: formData.entryDate
          ? new Date(formData.entryDate + "T00:00:00.000Z").toISOString()
          : new Date().toISOString(),
        due_date: formData.priceValidity
          ? new Date(formData.priceValidity + "T23:59:59.999Z").toISOString()
          : null,
        delivery_time: formData.timeOfDelivery, // Text field, not a date
        status: "PENDING",
        negotiation_count: 0,
        comment: formData.comment || null,
        approval_status: "PENDING",
        approved_by: null,
        approved_on: null,
        vendor_comment: formData.comment || null,
        quotation_type: "REGULAR",
        vendor_id: cleanUuid(formData.vendor),
        note: formData.comment || null,
        response_time: formData.responseTime
          ? parseInt(formData.responseTime)
          : null,
        price_validity_days: 30, // Default to 30 days - this should be a number, not a date
        delivery_period: formData.deliveryPeriod || null,
        is_insurance_included: formData.warranty,
        is_freight_included: formData.freight,
        is_packaging_included: formData.packaging,
        is_loading_included: formData.loading,
        is_unloading_included: formData.unloading,
      };

      console.log("Creating vendor quotation...", vendorQuotationPayload);
      const vendorQuotationResponse = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/vendor-quotation/`,
        vendorQuotationPayload
      );

      if (!vendorQuotationResponse.data.success) {
        throw new Error("Failed to create vendor quotation");
      }

      const vendorQuotationId =
        vendorQuotationResponse.data.data?.id ||
        vendorQuotationResponse.data.data?.vendor_quotation_id;

      if (!vendorQuotationId) {
        throw new Error("Vendor quotation ID not returned from API");
      }
      console.log("Preparing quotation detail for item:----", quotationItems);
      // Step 2: Create quotation details in bulk
      setSubmissionStep("Creating quotation details...");

      // Create separate entries for each indent item ID
      const quotationDetailsPayload: any[] = [];

      quotationItems.forEach((item) => {
        const indentItemIds = item.indentItemIds || [];

        if (indentItemIds.length === 0) {
          // If no indent item IDs, create one entry with null rfq_indent_item_id
          quotationDetailsPayload.push({
            vendor_quotation_id: vendorQuotationId,
            item_id: cleanUuid(item.itemId),
            rfq_indent_item_id: null,
            qty: item.procureQty,
            rate: item.rate,
            notes: formData.comment || null,
            is_cs_approved: false,
            cs_approval_status: null,
            vendor_qty: item.canProvideQty,
          });
        } else {
          // Create separate entries for each indent item ID
          indentItemIds.forEach((indentItemId) => {
            quotationDetailsPayload.push({
              vendor_quotation_id: vendorQuotationId,
              item_id: cleanUuid(item.itemId),
              rfq_indent_item_id: cleanUuid(indentItemId),
              qty: item.procureQty,
              rate: item.rate,
              notes: formData.comment || null,
              is_cs_approved: false,
              cs_approval_status: null,
              vendor_qty: item.canProvideQty,
            });
          });
        }
      });

      console.log("Creating quotation details...", quotationDetailsPayload);
      const quotationDetailsResponse = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/vendor-quotation-details/bulk`,
        quotationDetailsPayload
      );

      if (!quotationDetailsResponse.data.success) {
        throw new Error("Failed to create quotation details");
      }

      // Step 3: Create payment terms in bulk
      setSubmissionStep("Creating payment terms...");
      const paymentTermsPayload = paymentMilestones.map((milestone) => ({
        vendor_quotation_id: vendorQuotationId,
        quotation_payment_terms_type: milestone.type || null,
        charges_amount:
          milestone.paymentType === "Amount" ? parseFloat(milestone.amount) : 0,
        charges_percent:
          milestone.paymentType === "%"
            ? parseFloat(milestone.amount.replace("%", ""))
            : 0,
        note: milestone.reason || null,
      }));

      console.log("Creating payment terms...", paymentTermsPayload);
      const paymentTermsResponse = await axios.post(
        `${
          import.meta.env.VITE_API_BASE_URL
        }/vendor-quotation-payment-terms/bulk`,
        paymentTermsPayload
      );

      if (!paymentTermsResponse.data.success) {
        throw new Error("Failed to create payment terms");
      }

      alert("Vendor quotation submitted successfully!");
      onClose();
    } catch (error) {
      console.error("Error submitting quotation:", error);
      alert(
        `Error submitting quotation: ${
          error instanceof Error ? error.message : "Please try again."
        }`
      );
    } finally {
      setLoading(false);
      setSubmissionStep("");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full mx-4 max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Vendor Quotation Entry
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Header Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select RFQ <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.rfq}
                onChange={(e) => handleRFQChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={fetchingRFQDetails}
              >
                <option value="">Select RFQ</option>
                {availableRFQs.map((rfq: any) => (
                  <option key={rfq.id} value={rfq.id}>
                    {rfq.rfqNumber}
                  </option>
                ))}
              </select>
              {fetchingRFQDetails && (
                <p className="text-sm text-blue-600 mt-1">
                  Loading RFQ details...
                </p>
              )}
              {rfqDetails && (
                <div className="text-sm text-green-600 mt-1">
                  RFQ Details loaded: {rfqDetails.rfq?.rfq_number || "N/A"}(
                  {availableIndents.length} indent
                  {availableIndents.length !== 1 ? "s" : ""}, {vendors.length}{" "}
                  vendor{vendors.length !== 1 ? "s" : ""})
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Indent IDS
              </label>
              <div className="flex flex-wrap gap-2 w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 min-h-[42px]">
                {Array.isArray(availableIndents) &&
                availableIndents.length > 0 ? (
                  availableIndents.map((indent: any, idx: number) => (
                    <span
                      key={indent.indent_id || idx}
                      className="inline-block bg-gray-100 text-black-800 px-3 py-1 rounded-md text-sm font-semibold border border-blue-200"
                    >
                      {indent.indent_number}
                    </span>
                  ))
                ) : (
                  <span>No Indent IDs</span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Vendor <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.vendor}
                onChange={(e) =>
                  setFormData({ ...formData, vendor: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={vendors.length === 0 || fetchingVendorItems}
              >
                <option value="">
                  {vendors.length === 0
                    ? "No vendors available (select RFQ first)"
                    : "Select Vendor"}
                </option>
                {vendors.map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </option>
                ))}
              </select>
              {fetchingVendorItems && (
                <p className="text-sm text-blue-600 mt-1">
                  Loading vendor items...
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Entry Date
              </label>
              <input
                type="date"
                value={formData.entryDate}
                onChange={(e) =>
                  setFormData({ ...formData, entryDate: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time of Delivery <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.timeOfDelivery}
                onChange={(e) =>
                  setFormData({ ...formData, timeOfDelivery: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 2-3 weeks"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Response Time (Days)
              </label>
              <input
                type="number"
                value={formData.responseTime}
                onChange={(e) =>
                  setFormData({ ...formData, responseTime: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price Validity <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.priceValidity}
                onChange={(e) =>
                  setFormData({ ...formData, priceValidity: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delivery Period <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.deliveryPeriod}
                onChange={(e) =>
                  setFormData({ ...formData, deliveryPeriod: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 30 days"
              />
            </div>
          </div>

          {/* Checkboxes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Services Included
            </label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { key: "packaging", label: "Packaging" },
                { key: "freight", label: "Freight" },
                { key: "loading", label: "Loading" },
                { key: "unloading", label: "Unloading" },
                { key: "warranty", label: "Warranty" },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData[key as keyof typeof formData] as boolean}
                    onChange={(e) =>
                      setFormData({ ...formData, [key]: e.target.checked })
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comment
            </label>
            <textarea
              rows={3}
              value={formData.comment}
              onChange={(e) =>
                setFormData({ ...formData, comment: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter any additional comments"
            />
          </div>

          {/* Payment Milestones */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Payment Milestones
              </h3>
              <button
                onClick={handleAddMilestone}
                className="flex items-center space-x-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Milestone</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Type
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Payment Type
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Amount/%
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Reason
                    </th>
                    <th className="text-center py-3 px-4 font-medium text-gray-900">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paymentMilestones.map((milestone) => (
                    <tr key={milestone.id} className="border-t border-gray-200">
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={milestone.type}
                          onChange={(e) =>
                            handleMilestoneChange(
                              milestone.id,
                              "type",
                              e.target.value
                            )
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={milestone.paymentType}
                          onChange={(e) =>
                            handleMilestoneChange(
                              milestone.id,
                              "paymentType",
                              e.target.value
                            )
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="%">%</option>
                          <option value="Amount">Amount</option>
                        </select>
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={milestone.amount}
                          onChange={(e) =>
                            handleMilestoneChange(
                              milestone.id,
                              "amount",
                              e.target.value
                            )
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={milestone.reason}
                          onChange={(e) =>
                            handleMilestoneChange(
                              milestone.id,
                              "reason",
                              e.target.value
                            )
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleDeleteMilestone(milestone.id)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* <div className="flex items-center space-x-3 mt-4">
              <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors">
                SUBMIT Payment
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                RESET
              </button>
            </div> */}
          </div>

          {/* Quotation Items */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Quotation Item Table
              </h3>
              {quotationItems.length > 0 && (
                <span className="text-sm text-green-600">
                  {quotationItems.length} item
                  {quotationItems.length !== 1 ? "s" : ""} loaded
                </span>
              )}
            </div>

            {quotationItems.length === 0 && !fetchingVendorItems && (
              <div className="text-center py-8 text-gray-500">
                {formData.vendor && formData.rfq
                  ? "No items found for this vendor-RFQ combination"
                  : "Select both RFQ and Vendor to load items"}
              </div>
            )}

            {fetchingVendorItems && (
              <div className="text-center py-8 text-blue-600">
                Loading vendor items...
              </div>
            )}

            {quotationItems.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">
                        Sl. No
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
                        Procure Qty
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">
                        Can Provide Qty
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">
                        Rate (₹)
                      </th>
                      <th className="text-center py-3 px-4 font-medium text-gray-900">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {quotationItems.map((item) => (
                      <tr key={item.slNo} className="border-t border-gray-200">
                        <td className="py-3 px-4 text-gray-600">{item.slNo}</td>
                        <td className="py-3 px-4 font-medium text-gray-900">
                          {item.itemCode}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {item.itemName}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {item.uom || "N/A"}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {item.procureQty}
                        </td>
                        <td className="py-3 px-4">
                          {item.isEditing ? (
                            <input
                              type="number"
                              value={item.canProvideQty}
                              onChange={(e) =>
                                handleItemChange(
                                  item.slNo,
                                  "canProvideQty",
                                  Number(e.target.value)
                                )
                              }
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          ) : (
                            <span className="text-gray-600">
                              {item.canProvideQty}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {item.isEditing ? (
                            <input
                              type="number"
                              value={item.rate}
                              onChange={(e) =>
                                handleItemChange(
                                  item.slNo,
                                  "rate",
                                  Number(e.target.value)
                                )
                              }
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          ) : (
                            <span className="text-gray-600">{item.rate}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {item.isEditing ? (
                            <button
                              onClick={() => handleSaveItem(item.slNo)}
                              className="text-green-600 hover:text-green-800 transition-colors mr-2"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleEditItem(item.slNo)}
                              className="text-blue-600 hover:text-blue-800 transition-colors mr-2"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              File Upload
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">
                Drag and drop files here, or{" "}
                <span className="text-blue-600 cursor-pointer">browse</span>
              </p>
              <input type="file" multiple className="hidden" />
            </div>
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
            onClick={handleSubmitQuotation}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            {loading
              ? submissionStep || "Submitting..."
              : "SUBMIT Vendor Quotation"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VendorQuotationEntry;
