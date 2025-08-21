import React, { useState } from "react";
import { X, Plus, Trash2, Search } from "lucide-react";
import axios from "axios";
import { Select, MenuItem, Chip, FormControl, Box } from "@mui/material";

interface CreatePOModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PaymentTerm {
  id: string;
  terms: string;
  amount: string;
  reason: string;
  isFromQuotation?: boolean; // Flag to identify if term is from quotation API
}

interface POItem {
  id: string;
  hsnCode: string;
  itemCode: string;
  itemName: string;
  uom: string;
  rate: number;
  quantity: number;
  totalPrice: number;
}

const CreatePOModal: React.FC<CreatePOModalProps> = ({ isOpen, onClose }) => {
  const [sourceType, setSourceType] = useState<"quotation" | "indent">(
    "quotation"
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [rfqs, setRfqs] = useState<any[]>([]);
  const [indents, setIndents] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    poDate: new Date().toISOString().split("T")[0],
    selectedRFQ: "",
    selectedIndent: "",
    selectedVendor: "",
    selectedWarehouses: [] as string[],
    vendorAddress: "",
    bankName: "",
    gstNo: "",
    accountNo: "",
    ifscCode: "",
    igst: 0,
    sgst: 0,
    cgst: 0,
  });

  const [paymentTerms, setPaymentTerms] = useState<PaymentTerm[]>([]);

  const [items, setItems] = useState<POItem[]>([]);

  // Fetch data on component mount
  React.useEffect(() => {
    if (isOpen) {
      if (sourceType === "quotation") {
        fetchApprovedRFQs();
      } else {
        fetchWarehouses();
        fetchApprovedIndents();
      }
    }
  }, [isOpen, sourceType]);

  const fetchApprovedRFQs = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/rfq?approval_status=APPROVED`
      );
      if (response.data?.data) {
        const mappedRFQs = response.data.data.map((rfq: any) => ({
          id: rfq.id,
          name: `${rfq.rfq_number} - ${rfq.note || "RFQ"}`,
          vendors: rfq.vendors || [],
          warehouses: rfq.warehouses || [],
        }));
        setRfqs(mappedRFQs);
      }
    } catch (err) {
      console.error("Error fetching RFQs:", err);
    }
  };

  const fetchApprovedIndents = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/indent?approval_status=APPROVED`
      );
      if (response.data?.data) {
        const mappedIndents = response.data.data.map((indent: any) => ({
          id: indent.id,
          name: `${indent.indent_number} - ${
            indent.association_type || "Project"
          }`,
        }));
        setIndents(mappedIndents);
      }
    } catch (err) {
      console.error("Error fetching indents:", err);
    }
  };

  const fetchRFQVendors = async (rfqId: string) => {
    try {
      // Get vendors from the already fetched RFQ data
      const selectedRFQ = rfqs.find((rfq) => rfq.id === rfqId);
      if (selectedRFQ && selectedRFQ.vendors) {
        // Get unique vendors from the RFQ response
        const uniqueVendors = selectedRFQ.vendors.reduce(
          (acc: any[], vendor: any) => {
            const existingVendor = acc.find((v) => v.id === vendor.vendor_id);
            if (!existingVendor) {
              acc.push({
                id: vendor.vendor_id,
                name: vendor.business_name,
                address: "", // Address not available in RFQ vendor response
                bankName: vendor.bank_name || "",
                gstNumber: vendor.gst_number || "",
                accountNumber: vendor.bank_account_number || "",
                ifscCode: vendor.ifsc_code || "",
                panNumber: vendor.pan_number || "",
                tanNumber: vendor.tan_number || "",
                branchName: vendor.branch_name || "",
              });
            }
            return acc;
          },
          []
        );
        setVendors(uniqueVendors);

        // Also update warehouses for selected RFQ
        if (selectedRFQ.warehouses) {
          const mappedWarehouses = selectedRFQ.warehouses.map(
            (warehouse: any) => ({
              id: warehouse.warehouse_id,
              name: warehouse.warehouse_name,
              address: warehouse.address || "",
            })
          );
          setWarehouses(mappedWarehouses);
        }
      }
    } catch (err) {
      console.error("Error processing RFQ vendors:", err);
    }
  };

  const fetchApprovedVendors = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/vendors?approval_status=APPROVED`
      );
      if (response.data?.data) {
        const mappedVendors = response.data.data.map((vendor: any) => ({
          id: vendor.id,
          name: vendor.vendor_name,
          address: vendor.address || "",
        }));
        setVendors(mappedVendors);
      }
    } catch (err) {
      console.error("Error fetching vendors:", err);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/warehouse`
      );
      if (response.data?.data) {
        const mappedWarehouses = response.data.data.map((warehouse: any) => ({
          id: warehouse.id,
          name: warehouse.warehouse_name,
        }));
        setWarehouses(mappedWarehouses);
      }
    } catch (err) {
      console.error("Error fetching warehouses:", err);
    }
  };

  const fetchVendorQuotationDetails = async (
    vendorId: string,
    rfqId: string
  ) => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${
          import.meta.env.VITE_API_BASE_URL
        }/vendor-quotation/vendor-quotation-with-cs`,
        {
          params: {
            vendor_id: vendorId,
            rfq_id: rfqId,
          },
        }
      );

      if (response.data?.success && response.data?.data) {
        const { payment_terms, cs_details } = response.data.data;

        // Populate payment terms if available (non-editable)
        if (payment_terms && payment_terms.length > 0) {
          const mappedPaymentTerms = payment_terms.map((term: any) => ({
            id: term.id,
            terms: term.quotation_payment_terms_type || "",
            amount: term.charges_percent
              ? `${term.charges_percent}%`
              : term.charges_amount
              ? `₹${term.charges_amount}`
              : "",
            reason: term.note || "",
            isFromQuotation: true, // Mark as from quotation for non-editable display
          }));
          setPaymentTerms(mappedPaymentTerms);
        } else {
          // No payment terms in successful response, clear the state
          setPaymentTerms([]);
        }

        // Populate items from cs_details if available
        if (cs_details && cs_details.length > 0) {
          const mappedItems = cs_details.map((item: any, index: number) => ({
            id: item.item_id || `item-${index}`,
            hsnCode: item.hsn_code || "",
            itemCode: item.item_code || "",
            itemName: item.item_name || "",
            uom: item.uom_name || "",
            rate: parseFloat(item.rate) || 0,
            quantity: parseInt(item.selected_qty) || 0,
            totalPrice:
              (parseFloat(item.rate) || 0) * (parseInt(item.selected_qty) || 0),
          }));
          setItems(mappedItems);
        } else {
          // No items in successful response, clear the state
          setItems([]);
        }
      } else {
        // API returned unsuccessful response (404, etc.) - clear payment terms and items for quotation source
        console.log("No vendor quotation data found or API returned error");
        setPaymentTerms([]);
        setItems([]);
      }
    } catch (error) {
      console.error("Error fetching vendor quotation details:", error);
      // Clear payment terms and items when API call fails for quotation source
      setPaymentTerms([]);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Handle RFQ selection to fetch vendors
  const handleRFQChange = (rfqId: string) => {
    setFormData({
      ...formData,
      selectedRFQ: rfqId,
      selectedVendor: "", // Reset vendor selection
    });

    // Reset payment terms and items to empty when changing RFQ
    setPaymentTerms([]);
    setItems([]);

    if (rfqId) {
      fetchRFQVendors(rfqId);
    }
  };

  // Handle source type change
  const handleSourceTypeChange = (type: "quotation" | "indent") => {
    setSourceType(type);
    setFormData({
      ...formData,
      selectedRFQ: "",
      selectedIndent: "",
      selectedVendor: "",
    });
    setVendors([]);

    // Reset payment terms and items to empty when changing source type
    setPaymentTerms([]);
    setItems([]);

    if (type === "indent") {
      fetchApprovedVendors();
    }
  };

  const handleVendorChange = async (vendorId: string) => {
    const vendor = vendors.find((v) => v.id === vendorId);
    setFormData({
      ...formData,
      selectedVendor: vendorId,
      vendorAddress: vendor?.address || "",
      // Auto-populate vendor bank details from RFQ data
      bankName: vendor?.bankName || "",
      gstNo: vendor?.gstNumber || "",
      accountNo: vendor?.accountNumber || "",
      ifscCode: vendor?.ifscCode || "",
      // Keep tax fields empty for user input
      igst: 0,
      sgst: 0,
      cgst: 0,
    });

    // If source type is quotation, fetch vendor quotation details
    if (sourceType === "quotation" && formData.selectedRFQ && vendorId) {
      await fetchVendorQuotationDetails(vendorId, formData.selectedRFQ);
    }
  };

  const handleWarehouseChange = (warehouseId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedWarehouses: prev.selectedWarehouses.includes(warehouseId)
        ? prev.selectedWarehouses.filter((id) => id !== warehouseId)
        : [...prev.selectedWarehouses, warehouseId],
    }));
  };

  const handleAddPaymentTerm = () => {
    // Only allow adding new terms if not using quotation payment terms
    const hasQuotationTerms = paymentTerms.some((term) => term.isFromQuotation);
    if (hasQuotationTerms && sourceType === "quotation") {
      return; // Don't allow adding terms when using quotation terms
    }

    const newTerm: PaymentTerm = {
      id: Date.now().toString(),
      terms: "",
      amount: "",
      reason: "",
      isFromQuotation: false,
    };
    setPaymentTerms([...paymentTerms, newTerm]);
  };

  const handleDeletePaymentTerm = (id: string) => {
    // Don't allow deleting quotation terms
    const termToDelete = paymentTerms.find((term) => term.id === id);
    if (termToDelete?.isFromQuotation) {
      return;
    }
    setPaymentTerms(paymentTerms.filter((term) => term.id !== id));
  };

  const handlePaymentTermChange = (
    id: string,
    field: keyof PaymentTerm,
    value: string
  ) => {
    setPaymentTerms(
      paymentTerms.map((term) => {
        if (term.id === id && !term.isFromQuotation) {
          return { ...term, [field]: value };
        }
        return term;
      })
    );
  };

  const handleItemChange = (
    itemId: string,
    field: "rate" | "quantity",
    value: number
  ) => {
    setItems(
      items.map((item) => {
        if (item.id === itemId) {
          const updatedItem = { ...item, [field]: value };
          updatedItem.totalPrice = updatedItem.rate * updatedItem.quantity;
          return updatedItem;
        }
        return item;
      })
    );
  };

  const filteredItems = items.filter(
    (item) =>
      item.itemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.itemName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);

  const handleSave = async () => {
    if (!formData.selectedVendor || items.length === 0) {
      alert("Please select vendor and ensure items are available");
      return;
    }

    // For quotation source type, validate warehouse selection
    if (
      sourceType === "quotation" &&
      formData.selectedWarehouses.length === 0
    ) {
      alert("Please select at least one delivery warehouse");
      return;
    }

    if (sourceType === "quotation") {
      await handleSaveQuotationPO();
    } else {
      await handleSaveIndentPO();
    }
  };

  const handleSaveQuotationPO = async () => {
    setLoading(true);
    try {
      // Step 1: Create PO record
      const poPayload = {
        po_origin_id: formData.selectedRFQ,
        po_origin_type: "RFQ",
        po_uri: "",
        vendor_id: formData.selectedVendor,
        approved_by: null,
        is_mailed: false,
        mail_sent: null,
        comments: "",
        reference_purchase_id: null,
        po_type: "",
        po_date: formData.poDate,
        bank_name: formData.bankName,
        account_no: formData.accountNo,
        ifsc_code: formData.ifscCode,
        sgst: formData.sgst,
        igst: formData.igst,
        project_id: null,
        lookup_approval_status: null,
        approved_on: null,
        gst: formData.gstNo,
        total_amount: totalAmount,
        cgst: formData.cgst,
        inspection_status: false,
        cs_id: null,
      };

      console.log("Creating PO with payload:", poPayload);
      const poResponse = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/purchase-order`,
        poPayload
      );

      if (!poResponse.data.success) {
        throw new Error("Failed to create PO");
      }

      const createdPO = poResponse.data.data;
      const poId = createdPO.id;
      console.log("PO created successfully with ID:", poId);

      // Step 2: Create PO warehouse records for all selected warehouses
      if (formData.selectedWarehouses.length > 0) {
        const warehousePayload = formData.selectedWarehouses.map(
          (warehouseId) => ({
            po_id: poId,
            warehouse_id: warehouseId,
          })
        );

        console.log("Creating PO warehouses with payload:", warehousePayload);
        const warehouseResponse = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/purchase-order-warehouse/bulk`,
          warehousePayload
        );

        if (!warehouseResponse.data.success) {
          throw new Error("Failed to create PO warehouse records");
        }
        console.log("PO warehouses created successfully");
      }

      // Step 3: Create PO item records for all items
      const itemsPayload = items.map((item) => ({
        po_id: poId,
        item_id: item.id,
        qty: item.quantity,
        rate: item.rate,
        notes: "",
        qs_approved: false,
      }));

      console.log("Creating PO items with payload:", itemsPayload);
      const itemsResponse = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/purchase-order-details/bulk`,
        itemsPayload
      );

      if (!itemsResponse.data.success) {
        throw new Error("Failed to create PO item records");
      }
      console.log("PO items created successfully");

      alert("Purchase Order created successfully!");
      onClose();
    } catch (error) {
      console.error("Error creating PO:", error);
      alert("Error creating Purchase Order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveIndentPO = async () => {
    setLoading(true);
    try {
      const payload = {
        po_origin_type: "INDENT",
        po_origin_id: formData.selectedIndent,
        po_date: formData.poDate,
        vendor_id: formData.selectedVendor,
        bank_name: formData.bankName,
        gst: formData.gstNo,
        account_no: formData.accountNo,
        ifsc_code: formData.ifscCode,
        igst: formData.igst.toString(),
        sgst: formData.sgst.toString(),
        cgst: formData.cgst.toString(),
        total_amount: totalAmount,
      };

      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/po`,
        payload
      );

      if (response.data.success) {
        alert("Purchase Order created successfully!");
        onClose();
      } else {
        alert("Failed to create Purchase Order");
      }
    } catch (error) {
      console.error("Error creating PO:", error);
      alert("Error creating Purchase Order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Filter vendors based on RFQ selection (won vendors only)
  const availableVendors = vendors;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full mx-4 max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Create Purchase Order
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Source Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Source Type
            </label>
            <div className="flex space-x-6">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="quotation"
                  checked={sourceType === "quotation"}
                  onChange={(e) =>
                    handleSourceTypeChange(e.target.value as "quotation")
                  }
                  className="mr-2"
                />
                <span>Quotation</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="indent"
                  checked={sourceType === "indent"}
                  onChange={(e) =>
                    handleSourceTypeChange(e.target.value as "indent")
                  }
                  className="mr-2"
                />
                <span>Indent Details</span>
              </label>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                PO Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.poDate}
                onChange={(e) =>
                  setFormData({ ...formData, poDate: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {sourceType === "quotation" ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select RFQ <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.selectedRFQ}
                  onChange={(e) => handleRFQChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select RFQ</option>
                  {rfqs.map((rfq) => (
                    <option key={rfq.id} value={rfq.id}>
                      {rfq.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Indent <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.selectedIndent}
                  onChange={(e) =>
                    setFormData({ ...formData, selectedIndent: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Indent</option>
                  {indents.map((indent) => (
                    <option key={indent.id} value={indent.id}>
                      {indent.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Vendor <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.selectedVendor}
                onChange={(e) => handleVendorChange(e.target.value)}
                disabled={
                  (sourceType === "quotation" && !formData.selectedRFQ) ||
                  loading
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              >
                <option value="">
                  {loading ? "Loading..." : "Select Vendor"}
                </option>
                {availableVendors.map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </option>
                ))}
              </select>
              {loading &&
                sourceType === "quotation" &&
                formData.selectedVendor && (
                  <p className="text-sm text-blue-600 mt-1">
                    Loading quotation details...
                  </p>
                )}
            </div>

            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delivery Warehouse
              </label>
              <FormControl fullWidth>
                <Select
                  multiple
                  value={formData.selectedWarehouses}
                  onChange={(e) => {
                    const values =
                      typeof e.target.value === "string"
                        ? e.target.value.split(",")
                        : e.target.value;
                    setFormData((prev) => ({
                      ...prev,
                      selectedWarehouses: values,
                    }));
                  }}
                  renderValue={(selected) => (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {selected.map((value) => {
                        const warehouse = warehouses.find(
                          (w) => w.id === value
                        );
                        return (
                          <Chip
                            key={value}
                            label={warehouse?.name}
                            onDelete={() => handleWarehouseChange(value)}
                            size="small"
                          />
                        );
                      })}
                    </Box>
                  )}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "8px",
                    },
                  }}
                >
                  {warehouses.map((warehouse) => (
                    <MenuItem key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>
          </div>

          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vendor Address
            </label>
            <input
              type="text"
              value={formData.vendorAddress}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
            />
          </div>

          {/* Warehouse Delivery Addresses */}
          {formData.selectedWarehouses.length > 0 && (
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Warehouse Delivery Addresses
              </label>
              <div className="space-y-2">
                {formData.selectedWarehouses.map((warehouseId) => {
                  const warehouse = warehouses.find(
                    (w) => w.id === warehouseId
                  );
                  return (
                    <div
                      key={warehouseId}
                      className="p-3 bg-gray-50 rounded-lg"
                    >
                      <p className="font-medium text-gray-900">
                        {warehouse?.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {warehouse?.address || "Address not available"}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Vendor Details */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Vendor Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bank Name
              </label>
              <input
                type="text"
                value={formData.bankName}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GST No
              </label>
              <input
                type="text"
                value={formData.gstNo}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Number
              </label>
              <input
                type="text"
                value={formData.accountNo}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                IFSC Code
              </label>
              <input
                type="text"
                value={formData.ifscCode}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                IGST (%)
              </label>
              <input
                type="number"
                value={formData.igst}
                onChange={(e) =>
                  setFormData({ ...formData, igst: Number(e.target.value) })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SGST (%)
              </label>
              <input
                type="number"
                value={formData.sgst}
                onChange={(e) =>
                  setFormData({ ...formData, sgst: Number(e.target.value) })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CGST (%)
              </label>
              <input
                type="number"
                value={formData.cgst}
                onChange={(e) =>
                  setFormData({ ...formData, cgst: Number(e.target.value) })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Payment Terms */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Vendor Payment Terms
              {paymentTerms.some((term) => term.isFromQuotation) && (
                <span className="ml-2 text-sm text-blue-600 font-normal">
                  (From Quotation)
                </span>
              )}
            </h3>
            {(!paymentTerms.some((term) => term.isFromQuotation) ||
              sourceType !== "quotation") && (
              <button
                onClick={handleAddPaymentTerm}
                className="flex items-center space-x-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Term</span>
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            {paymentTerms.length > 0 ? (
              <table className="w-full border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Terms
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Amount
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
                  {paymentTerms.map((term) => (
                    <tr key={term.id} className="border-t border-gray-200">
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={term.terms}
                          onChange={(e) =>
                            handlePaymentTermChange(
                              term.id,
                              "terms",
                              e.target.value
                            )
                          }
                          readOnly={term.isFromQuotation}
                          className={`w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                            term.isFromQuotation
                              ? "bg-gray-50 text-gray-600 cursor-not-allowed"
                              : ""
                          }`}
                        />
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={term.amount}
                          onChange={(e) =>
                            handlePaymentTermChange(
                              term.id,
                              "amount",
                              e.target.value
                            )
                          }
                          readOnly={term.isFromQuotation}
                          className={`w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                            term.isFromQuotation
                              ? "bg-gray-50 text-gray-600 cursor-not-allowed"
                              : ""
                          }`}
                        />
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={term.reason}
                          onChange={(e) =>
                            handlePaymentTermChange(
                              term.id,
                              "reason",
                              e.target.value
                            )
                          }
                          readOnly={term.isFromQuotation}
                          className={`w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                            term.isFromQuotation
                              ? "bg-gray-50 text-gray-600 cursor-not-allowed"
                              : ""
                          }`}
                        />
                      </td>
                      <td className="py-3 px-4 text-center">
                        {!term.isFromQuotation ? (
                          <button
                            onClick={() => handleDeletePaymentTerm(term.id)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-gray-400 text-xs">N/A</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-8 text-gray-500 border border-gray-200 rounded-lg bg-gray-50">
                <p>No payment terms available</p>
                <p className="text-sm mt-1">
                  {sourceType === "quotation"
                    ? "Select a vendor to load payment terms from quotation"
                    : "Click 'Add Term' to add payment terms"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Item Details */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Item Details
            </h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            {filteredItems.length > 0 ? (
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
                      Rate
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Quantity to be Purchased
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Total Price
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="border-t border-gray-200">
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
                      <td className="py-3 px-4">
                        <input
                          type="number"
                          value={item.rate}
                          onChange={(e) =>
                            handleItemChange(
                              item.id,
                              "rate",
                              Number(e.target.value)
                            )
                          }
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemChange(
                              item.id,
                              "quantity",
                              Number(e.target.value)
                            )
                          }
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900">
                        ₹{item.totalPrice.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-8 text-gray-500 border border-gray-200 rounded-lg bg-gray-50">
                <p>No items available</p>
                <p className="text-sm mt-1">
                  {sourceType === "quotation"
                    ? "Select a vendor to load items from quotation"
                    : "Items will be loaded based on indent selection"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Total Amount */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-gray-900">
              Total Amount:
            </span>
            <span className="text-2xl font-bold text-gray-900">
              ₹{totalAmount.toLocaleString()}
            </span>
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
          onClick={handleSave}
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          {loading ? "Saving..." : "SAVE"}
        </button>
      </div>
    </div>
  );
};

export default CreatePOModal;
