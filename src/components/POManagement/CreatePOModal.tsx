import React, { useState } from "react";
import { X, Search } from "lucide-react";
import axios from "axios";

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
  item_id: string;
  hsnCode: string;
  itemCode: string;
  itemName: string;
  uom: string;
  rate: number;
  quantity: number;
  totalPrice: number;
  cs_id?: string; // CS ID for quotation-sourced items
}

interface WarehouseAllocation {
  id: string;
  warehouse_id: string;
  warehouse_name: string;
  qty: number;
  item_id: string;
}

const CreatePOModal: React.FC<CreatePOModalProps> = ({ isOpen, onClose }) => {
  const [sourceType, setSourceType] = useState<"quotation" | "indent">(
    "quotation"
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [rfqs, setRfqs] = useState<any[]>([]);
  const [indents, setIndents] = useState<any[]>([]);
  const [vendors, setVendors] = useState<
    {
      id: string;
      name: string;
      address: string;
      bankName: string;
      gstNumber: string;
      accountNumber: string;
      ifscCode: string;
    }[]
  >([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    poDate: new Date().toISOString().split("T")[0],
    selectedRFQ: "",
    selectedIndent: "",
    selectedVendor: "",
    vendorAddress: "",
    bankName: "",
    gstNo: "",
    accountNo: "",
    ifscCode: "",
    igst: 18,
    sgst: 9,
    cgst: 9,
  });

  const [paymentTerms, setPaymentTerms] = useState<PaymentTerm[]>([
    {
      id: "1",
      terms: "Advance",
      amount: "30%",
      reason: "Material booking",
    },
  ]);

  const [items, setItems] = useState<POItem[]>([]);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [warehouseAllocations, setWarehouseAllocations] = useState<{
    [itemId: string]: WarehouseAllocation[];
  }>({});

  // Fetch data on component mount
  React.useEffect(() => {
    if (isOpen) {
      fetchWarehouses();
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
                address: `${vendor.city}, ${vendor.district}, ${vendor.state}, ${vendor.pincode}`,
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
        `${
          import.meta.env.VITE_CRM_API_BASE_URL
        }/vendor/filter?approval_status=APPROVED`
      );
      if (response.data?.data) {
        const mappedVendors = response.data.data.map((vendor: any) => ({
          id: vendor.vendor_id,
          name: vendor.business_name,
          address: `${vendor.city}, ${vendor.district}, ${vendor.state}, ${vendor.pincode}`,
          bankName: vendor.bank_name,
          gstNumber: vendor.gst_number,
          accountNumber: vendor.bank_account_number,
          ifscCode: vendor.ifsc_code,
        }));
        setVendors(mappedVendors);
        console.log("Fetched Approved Vendors:", mappedVendors);
      }
    } catch (err) {
      console.error("Error fetching vendors:", err);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_IMS_API_BASE_URL}/warehouse`
      );
      if (response.data?.data) {
        const mappedWarehouses = response.data.data.map((warehouse: any) => ({
          id: warehouse.id,
          name: warehouse.warehouse_name,
          address: warehouse.address || "",
        }));
        setWarehouses(mappedWarehouses);
      }
    } catch (err) {
      console.error("Error fetching warehouses:", err);
    }
  };

  const fetchIndentItems = async (indentId: string) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/indent/${indentId}`
      );
      if (response.data?.data?.items) {
        const mappedItems = response.data.data.items.map((item: any) => ({
          item_id: item.item_id,
          hsnCode: item.hsn_code || "",
          itemCode: item.item_code || "",
          itemName: item.item_name || "",
          uom: item.uom_name || "",
          rate: item.latest_lowest_net_rate || 0,
          quantity: item.required_quantity || 0,
          totalPrice:
            (item.latest_lowest_net_rate || 0) * (item.required_quantity || 0),
        }));
        setItems(mappedItems);
        console.log("Fetched mapped Indent Items:", mappedItems);
      }
    } catch (err) {
      console.error("Error fetching indent items:", err);
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
            item_id: item.item_id || `item-${index}`,
            hsnCode: item.hsn_code || "",
            itemCode: item.item_code || "",
            itemName: item.item_name || "",
            uom: item.uom_name || "",
            rate: parseFloat(item.rate) || 0,
            quantity: parseInt(item.selected_qty) || 0,
            totalPrice:
              (parseFloat(item.rate) || 0) * (parseInt(item.selected_qty) || 0),
            cs_id: item.cs_id || "", // Capture CS ID for updating is_po_generated status
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

  // Handle indent selection to fetch items
  const handleIndentChange = (indentId: string) => {
    setFormData({ ...formData, selectedIndent: indentId });
    // Reset warehouse allocations when changing indent
    setWarehouseAllocations({});
    setExpandedItems(new Set());

    if (indentId) {
      fetchIndentItems(indentId);
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
        if (item.item_id === itemId) {
          const updatedItem = { ...item, [field]: value };
          updatedItem.totalPrice = updatedItem.rate * updatedItem.quantity;
          return updatedItem;
        }
        return item;
      })
    );
  };

  // Warehouse allocation functions
  const toggleItemExpansion = (itemId: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const addWarehouseAllocation = (itemId: string) => {
    const newAllocation: WarehouseAllocation = {
      id: `${itemId}-${Date.now()}`,
      warehouse_id: "",
      warehouse_name: "",
      qty: 0,
      item_id: itemId,
    };

    setWarehouseAllocations((prev) => ({
      ...prev,
      [itemId]: [...(prev[itemId] || []), newAllocation],
    }));
  };

  const updateWarehouseAllocation = (
    itemId: string,
    allocationId: string,
    field: "warehouse_id" | "qty",
    value: string | number
  ) => {
    setWarehouseAllocations((prev) => ({
      ...prev,
      [itemId]: (prev[itemId] || []).map((allocation) => {
        if (allocation.id === allocationId) {
          const updatedAllocation = { ...allocation, [field]: value };
          if (field === "warehouse_id") {
            const warehouse = warehouses.find((w) => w.id === value);
            updatedAllocation.warehouse_name = warehouse?.name || "";
          }
          return updatedAllocation;
        }
        return allocation;
      }),
    }));
  };

  const removeWarehouseAllocation = (itemId: string, allocationId: string) => {
    setWarehouseAllocations((prev) => ({
      ...prev,
      [itemId]: (prev[itemId] || []).filter(
        (allocation) => allocation.id !== allocationId
      ),
    }));
  };

  const getTotalAllocatedQuantity = (itemId: string): number => {
    const allocations = warehouseAllocations[itemId] || [];
    return allocations.reduce((sum, allocation) => sum + allocation.qty, 0);
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

    // For both source types, validate warehouse allocations (only check for obvious errors)
    const itemsWithErrors = items.filter((item) => {
      const allocations = warehouseAllocations[item.item_id] || [];
      // Only check for allocations that have empty warehouses or zero/negative quantities
      const hasInvalidAllocations = allocations.some(
        (allocation) =>
          (allocation.warehouse_id && allocation.qty <= 0) ||
          (!allocation.warehouse_id && allocation.qty > 0)
      );
      return hasInvalidAllocations;
    });

    if (itemsWithErrors.length > 0) {
      alert(
        `Please fix warehouse allocations: ${itemsWithErrors.length} item(s) have allocations with missing warehouse selection or invalid quantities.`
      );
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

      // Step 2: Create PO item records with warehouse allocations
      console.log(
        "Creating PO items with warehouse allocations for PO ID:",
        poId
      );

      // Create PO details for each warehouse allocation
      interface PODetailPayload {
        po_id: string;
        vendor_id: string;
        item_id: string;
        qty: number;
        rate: number;
        notes: string;
        qs_approved: boolean;
        warehouse_id: string | null;
      }

      const poDetailsPayload: PODetailPayload[] = [];

      items.forEach((item) => {
        const allocations = warehouseAllocations[item.item_id] || [];

        if (allocations.length > 0) {
          // Create separate PO detail records for each warehouse allocation
          allocations.forEach((allocation) => {
            if (allocation.warehouse_id && allocation.qty > 0) {
              poDetailsPayload.push({
                po_id: poId,
                vendor_id: formData.selectedVendor,
                item_id: item.item_id,
                qty: allocation.qty,
                rate: item.rate,
                notes: "",
                qs_approved: false,
                warehouse_id: allocation.warehouse_id,
              });
            }
          });
        } else {
          // If no warehouse allocations, create a single record without warehouse
          poDetailsPayload.push({
            po_id: poId,
            vendor_id: formData.selectedVendor,
            item_id: item.item_id,
            qty: item.quantity,
            rate: item.rate,
            notes: "",
            qs_approved: false,
            warehouse_id: null,
          });
        }
      });

      console.log("Creating PO items with payload:", poDetailsPayload);
      const itemsResponse = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/purchase-order-details/bulk`,
        poDetailsPayload
      );

      if (!itemsResponse.data.success) {
        throw new Error("Failed to create PO item records");
      }
      console.log("PO items created successfully");

      // Step 3: Create Purchase Order Warehouse mappings for unique warehouses
      const uniqueWarehouseIds = Array.from(
        new Set(
          poDetailsPayload.map((detail) => detail.warehouse_id).filter(Boolean)
        )
      );

      if (uniqueWarehouseIds.length > 0) {
        const warehousePayload = uniqueWarehouseIds.map((warehouseId) => ({
          po_id: poId,
          warehouse_id: warehouseId,
        }));

        try {
          await axios.post(
            `${
              import.meta.env.VITE_API_BASE_URL
            }/purchase-order-warehouse/bulk`,
            warehousePayload
          );
          console.log("Purchase Order warehouse mappings created successfully");
        } catch (warehouseError) {
          console.error("Error creating warehouse mappings:", warehouseError);
          // Continue execution as warehouse mapping is not critical for PO creation
        }
      }

      // Step 3: Update is_po_generated status in CS details for quotation source type
      if (sourceType === "quotation") {
        const csUpdatePromises = items
          .filter((item) => item.cs_id) // Only items with cs_id (from quotation)
          .map(async (item) => {
            try {
              const updateResponse = await axios.patch(
                `${import.meta.env.VITE_API_BASE_URL}/cs-details/${
                  item.cs_id
                }/po-status`,
                { is_po_generated: true }
              );

              if (!updateResponse.data.success) {
                console.warn(
                  `Failed to update PO status for CS ID: ${item.cs_id}`
                );
              } else {
                console.log(
                  `PO status updated successfully for CS ID: ${item.cs_id}`
                );
              }
            } catch (updateError) {
              console.error(
                `Error updating PO status for CS ID: ${item.cs_id}`,
                updateError
              );
              // Don't throw error here to prevent rollback of successful PO creation
            }
          });

        // Wait for all updates to complete
        if (csUpdatePromises.length > 0) {
          await Promise.allSettled(csUpdatePromises);
          console.log("CS details PO status updates completed");
        }
      }

      // // Step 5: Create payment terms records if any payment terms exist
      // if (paymentTerms.length > 0 && sourceType === "quotation") {
      //   try {
      //     const paymentTermsPayload = paymentTerms.map((term) => {
      //       // Parse amount to determine if it's percentage or fixed amount
      //       let charges_amount = 0;
      //       let charges_percent = 0;

      //       if (term.amount.includes('%')) {
      //         charges_percent = parseFloat(term.amount.replace('%', '')) || 0;
      //       } else if (term.amount.includes('₹')) {
      //         charges_amount = parseFloat(term.amount.replace('₹', '').replace(',', '')) || 0;
      //       } else {
      //         // Try to parse as number, assume it's amount if no special characters
      //         const numValue = parseFloat(term.amount) || 0;
      //         charges_amount = numValue;
      //       }

      //       return {
      //         po_id: poId,
      //         payment_terms_type: term.terms,
      //         charges_amount,
      //         charges_percent,
      //         note: term.reason || ""
      //       };
      //     });

      //     console.log("Creating payment terms with payload:", paymentTermsPayload);
      //     const paymentTermsResponse = await axios.post(
      //       `${import.meta.env.VITE_API_BASE_URL}/purchase-order-payment-terms/bulk`,
      //       paymentTermsPayload
      //     );

      //     if (!paymentTermsResponse.data.success) {
      //       console.warn("Failed to create payment terms:", paymentTermsResponse.data.devMessage);
      //       // Don't throw error to prevent rollback of successful PO creation
      //     } else {
      //       console.log("Payment terms created successfully:", paymentTermsResponse.data.data);
      //     }
      //   } catch (paymentTermsError) {
      //     console.error("Error creating payment terms:", paymentTermsError);
      //     // Don't throw error here to prevent rollback of successful PO creation
      //   }
      // }

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
      // For Indent Details section - use new API structure
      if (sourceType === "indent") {
        // Step 1: Create Purchase Order
        const poPayload = {
          po_origin_id: formData.selectedIndent,
          po_origin_type: "INDENT",
          po_number: null,
          po_uri: null,
          vendor_id: formData.selectedVendor,
          approved_by: null,
          is_mailed: false,
          mail_sent: null,
          comments: null,
          reference_purchase_id: null,
          po_type: "STANDARD",
          po_date: formData.poDate,
          bank_name: formData.bankName,
          account_no: formData.accountNo,
          ifsc_code: formData.ifscCode,
          sgst: parseFloat(formData.sgst.toString()),
          igst: parseFloat(formData.igst.toString()),
          project_id: null,
          lookup_approval_status: null,
          approved_on: null,
          gst: formData.gstNo,
          total_amount: totalAmount,
          cgst: parseFloat(formData.cgst.toString()),
          inspection_status: false,
        };

        const poResponse = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/purchase-order`,
          poPayload
        );

        if (!poResponse.data.success) {
          alert("Failed to create Purchase Order");
          return;
        }

        const poId = poResponse.data.data.id || poResponse.data.data.po_id;

        // Step 2: Create Purchase Order Details in bulk with warehouse allocations
        console.log("Creating Purchase Order Details for PO ID:", items);
        console.log("selectedVendor:---", formData.selectedVendor);

        // Create PO details for each warehouse allocation
        interface PODetailPayload {
          po_id: string;
          vendor_id: string;
          item_id: string;
          qty: number;
          rate: number;
          notes: string;
          qs_approved: boolean;
          warehouse_id: string | null;
        }

        const poDetailsPayload: PODetailPayload[] = [];

        items.forEach((item) => {
          const allocations = warehouseAllocations[item.item_id] || [];

          if (allocations.length > 0) {
            // If warehouse allocations exist, create details for each valid allocation
            const validAllocations = allocations.filter(
              (allocation) => allocation.warehouse_id && allocation.qty > 0
            );

            if (validAllocations.length > 0) {
              const totalAllocated = validAllocations.reduce(
                (sum, allocation) => sum + allocation.qty,
                0
              );

              // Create entries for valid allocations
              validAllocations.forEach((allocation) => {
                poDetailsPayload.push({
                  po_id: poId,
                  vendor_id: formData.selectedVendor,
                  item_id: item.item_id,
                  qty: allocation.qty,
                  rate: item.rate,
                  notes: "",
                  qs_approved: false,
                  warehouse_id: allocation.warehouse_id,
                });
              });

              // If there's remaining quantity after allocations, create a fallback entry
              const remainingQty = item.quantity - totalAllocated;
              if (remainingQty > 0) {
                poDetailsPayload.push({
                  po_id: poId,
                  vendor_id: formData.selectedVendor,
                  item_id: item.item_id,
                  qty: remainingQty,
                  rate: item.rate,
                  notes: "",
                  qs_approved: false,
                  warehouse_id: null,
                });
              }
            } else {
              // No valid allocations, create fallback entry for full quantity
              poDetailsPayload.push({
                po_id: poId,
                vendor_id: formData.selectedVendor,
                item_id: item.item_id,
                qty: item.quantity,
                rate: item.rate,
                notes: "",
                qs_approved: false,
                warehouse_id: null,
              });
            }
          } else {
            // If no warehouse allocations, create a single detail entry (fallback)
            poDetailsPayload.push({
              po_id: poId,
              vendor_id: formData.selectedVendor,
              item_id: item.item_id,
              qty: item.quantity,
              rate: item.rate,
              notes: "",
              qs_approved: false,
              warehouse_id: null,
            });
          }
        });

        const detailsResponse = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/purchase-order-details/bulk`,
          poDetailsPayload
        );

        // Step 3: Create Purchase Order Warehouse mappings for unique warehouses
        const uniqueWarehouseIds = Array.from(
          new Set(
            poDetailsPayload
              .map((detail) => detail.warehouse_id)
              .filter(Boolean)
          )
        );

        if (uniqueWarehouseIds.length > 0) {
          const warehousePayload = uniqueWarehouseIds.map((warehouseId) => ({
            po_id: poId,
            warehouse_id: warehouseId,
          }));

          try {
            await axios.post(
              `${
                import.meta.env.VITE_API_BASE_URL
              }/purchase-order-warehouse/bulk`,
              warehousePayload
            );
            console.log(
              "Purchase Order warehouse mappings created successfully"
            );
          } catch (warehouseError) {
            console.error("Error creating warehouse mappings:", warehouseError);
            // Continue execution as warehouse mapping is not critical for PO creation
          }
        }

        if (detailsResponse.data.success) {
          alert("Purchase Order created successfully!");
          onClose();
        } else {
          alert("Purchase Order created but failed to add item details");
        }
      } else {
        // For Quotation section - keep existing logic unchanged
        const payload = {
          po_origin_type: "RFQ",
          po_origin_id: formData.selectedRFQ,
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
                  onChange={(e) => handleIndentChange(e.target.value)}
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
        {/* <div>
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
// <<<<<<< feature/mijanur/po
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
// =======
                          readOnly={term.isFromQuotation}
                          className={`w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                            term.isFromQuotation
                              ? "bg-gray-50 text-gray-600 cursor-not-allowed"
                              : ""
                          }`}
// >>>>>>> main
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
// <<<<<<< feature/mijanur/po
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
// =======
                          readOnly={term.isFromQuotation}
                          className={`w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                            term.isFromQuotation
                              ? "bg-gray-50 text-gray-600 cursor-not-allowed"
                              : ""
                          }`}
// >>>>>>> main
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
// <<<<<<< feature/mijanur/po
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
// =======
                          readOnly={term.isFromQuotation}
                          className={`w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                            term.isFromQuotation
                              ? "bg-gray-50 text-gray-600 cursor-not-allowed"
                              : ""
                          }`}
// >>>>>>> main
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
// <<<<<<< feature/mijanur/po
        )}
// =======
        </div> */}
        {/* // >>>>>>> main */}

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
            {sourceType === "indent" ? (
              filteredItems.length > 0 ? (
                <div className="space-y-2">
                  {/* Accordion Parent Header Row */}
                  <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-gray-500 uppercase bg-gray-100 rounded-t-lg px-4 py-2">
                    <div className="col-span-2">Item</div>
                    <div className="col-span-1">HSN Code</div>
                    <div className="col-span-1">UOM</div>
                    <div className="col-span-1">Rate</div>
                    <div className="col-span-1">Total Qty</div>
                    <div className="col-span-2">Allocated Qty</div>
                    <div className="col-span-2">Warehouses</div>
                    <div className="col-span-1">Total Price</div>
                    <div className="col-span-1">Actions</div>
                  </div>
                  {filteredItems.map((item) => {
                    const itemId = item.item_id;
                    const isExpanded = expandedItems.has(itemId);
                    const allocations = warehouseAllocations[itemId] || [];
                    const totalAllocatedQty = getTotalAllocatedQuantity(itemId);
                    const remainingQty = item.quantity - totalAllocatedQty;

                    // Get unique warehouses for bullet list
                    const warehouseList = Array.from(
                      new Set(
                        allocations
                          .map((allocation) => allocation.warehouse_name)
                          .filter(Boolean)
                      )
                    );

                    return (
                      <div
                        key={itemId}
                        className="border border-gray-200 rounded-lg"
                      >
                        {/* Parent Row (Accordion Header) */}
                        <div
                          className="bg-gray-50 p-4 cursor-pointer"
                          onClick={() => toggleItemExpansion(itemId)}
                        >
                          <div className="grid grid-cols-12 gap-4 items-center text-sm">
                            {/* Item (Double Width) */}
                            <div className="col-span-2">
                              <div className="font-bold text-gray-900">
                                {item.itemName}
                              </div>
                              <div className="text-xs text-gray-600">
                                {item.itemCode}
                              </div>
                            </div>
                            {/* HSN Code */}
                            <div className="col-span-1">
                              <div className="font-medium text-gray-900">
                                {item.hsnCode}
                              </div>
                            </div>
                            {/* UOM */}
                            <div className="col-span-1">
                              <div className="font-medium text-gray-900">
                                {item.uom}
                              </div>
                            </div>
                            {/* Rate */}
                            <div className="col-span-1">
                              <input
                                type="number"
                                value={item.rate}
                                onChange={(e) =>
                                  handleItemChange(
                                    item.item_id,
                                    "rate",
                                    Number(e.target.value)
                                  )
                                }
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                            {/* Total Quantity */}
                            <div className="col-span-1">
                              <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) =>
                                  handleItemChange(
                                    item.item_id,
                                    "quantity",
                                    Number(e.target.value)
                                  )
                                }
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                            {/* Allocated Quantity */}
                            <div className="col-span-2">
                              <div className="font-medium text-gray-900">
                                <span className="text-green-600">
                                  {totalAllocatedQty}
                                </span>
                                <span className="text-gray-400 mx-1">/</span>
                                <span>{item.quantity}</span>
                                {remainingQty > 0 && (
                                  <span className="text-orange-600 text-xs ml-2">
                                    ({remainingQty} remaining)
                                  </span>
                                )}
                              </div>
                            </div>
                            {/* Warehouses (bullet list) */}
                            <div className="col-span-2">
                              <ul className="text-xs text-gray-500 list-disc ml-4">
                                {warehouseList.length > 0 ? (
                                  warehouseList.map((w, i) => (
                                    <li key={i}>{w}</li>
                                  ))
                                ) : (
                                  <li className="text-gray-400">
                                    No allocations
                                  </li>
                                )}
                              </ul>
                            </div>
                            {/* Total Price */}
                            <div className="col-span-1">
                              <div className="font-medium text-gray-900">
                                ₹{item.totalPrice.toLocaleString()}
                              </div>
                            </div>
                            {/* Action: Add warehouse allocation */}
                            <div className="col-span-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  addWarehouseAllocation(itemId);
                                  if (!isExpanded) toggleItemExpansion(itemId);
                                }}
                                className="text-green-600 hover:text-green-800 border border-green-200 rounded px-2 py-1"
                                title="Add warehouse allocation"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                        {/* Accordion Child Rows (Expanded) */}
                        {isExpanded && (
                          <div className="bg-white border-t border-gray-200 py-4 pl-[3.5rem]">
                            {/* Child Header */}
                            <div className="bg-gray-100 p-2">
                              <div className="grid grid-cols-4 gap-4 text-xs font-medium text-gray-500 uppercase">
                                <div className="col-span-2">Warehouse</div>
                                <div className="col-span-1">Quantity</div>
                                <div className="col-span-1">Actions</div>
                              </div>
                            </div>
                            {/* Child Rows */}
                            {allocations.length === 0 && (
                              <div className="p-4 text-xs text-gray-400">
                                No warehouse allocations yet. Click + to add.
                              </div>
                            )}
                            {allocations.map((allocation) => (
                              <div
                                key={allocation.id}
                                className="p-2 border-t border-gray-100"
                              >
                                <div className="grid grid-cols-4 gap-4 items-center text-sm">
                                  {/* Warehouse */}
                                  <div className="col-span-2">
                                    <select
                                      value={allocation.warehouse_id}
                                      onChange={(e) =>
                                        updateWarehouseAllocation(
                                          itemId,
                                          allocation.id,
                                          "warehouse_id",
                                          e.target.value
                                        )
                                      }
                                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                      <option value="">Select Warehouse</option>
                                      {warehouses.map((warehouse) => (
                                        <option
                                          key={warehouse.id}
                                          value={warehouse.id}
                                        >
                                          {warehouse.name}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  {/* Quantity */}
                                  <div className="col-span-1">
                                    <input
                                      type="number"
                                      value={allocation.qty}
                                      onChange={(e) =>
                                        updateWarehouseAllocation(
                                          itemId,
                                          allocation.id,
                                          "qty",
                                          parseInt(e.target.value) || 0
                                        )
                                      }
                                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                      min="0"
                                      max={item.quantity}
                                    />
                                  </div>
                                  {/* Actions */}
                                  <div className="col-span-1">
                                    <button
                                      onClick={() =>
                                        removeWarehouseAllocation(
                                          itemId,
                                          allocation.id
                                        )
                                      }
                                      className="text-red-600 hover:text-red-800 border border-red-200 rounded px-1 py-1"
                                      title="Remove warehouse allocation"
                                    >
                                      -
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 border border-gray-200 rounded-lg bg-gray-50">
                  <p>No items available</p>
                  <p className="text-sm mt-1">
                    Items will be loaded based on indent selection
                  </p>
                </div>
              )
            ) : filteredItems.length > 0 ? (
              <div className="space-y-2">
                {/* Accordion Parent Header Row */}
                <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-gray-500 uppercase bg-gray-100 rounded-t-lg px-4 py-2">
                  <div className="col-span-2">Item</div>
                  <div className="col-span-1">HSN Code</div>
                  <div className="col-span-1">UOM</div>
                  <div className="col-span-1">Rate</div>
                  <div className="col-span-1">Total Qty</div>
                  <div className="col-span-2">Allocated Qty</div>
                  <div className="col-span-2">Warehouses</div>
                  <div className="col-span-1">Total Price</div>
                  <div className="col-span-1">Actions</div>
                </div>
                {filteredItems.map((item) => {
                  const itemId = item.item_id;
                  const isExpanded = expandedItems.has(itemId);
                  const allocations = warehouseAllocations[itemId] || [];
                  const totalAllocatedQty = getTotalAllocatedQuantity(itemId);
                  const remainingQty = item.quantity - totalAllocatedQty;

                  // Get unique warehouses for bullet list
                  const warehouseList = Array.from(
                    new Set(
                      allocations
                        .map((allocation) => allocation.warehouse_name)
                        .filter(Boolean)
                    )
                  );

                  return (
                    <div
                      key={itemId}
                      className="border border-gray-200 rounded-lg"
                    >
                      {/* Parent Row (Accordion Header) */}
                      <div
                        className="bg-gray-50 p-4 cursor-pointer"
                        onClick={() => toggleItemExpansion(itemId)}
                      >
                        <div className="grid grid-cols-12 gap-4 items-center text-sm">
                          {/* Item (Double Width) */}
                          <div className="col-span-2">
                            <div className="font-bold text-gray-900">
                              {item.itemName}
                            </div>
                            <div className="text-xs text-gray-600">
                              {item.itemCode}
                            </div>
                          </div>
                          {/* HSN Code */}
                          <div className="col-span-1">
                            <div className="font-medium text-gray-900">
                              {item.hsnCode}
                            </div>
                          </div>
                          {/* UOM */}
                          <div className="col-span-1">
                            <div className="font-medium text-gray-900">
                              {item.uom}
                            </div>
                          </div>
                          {/* Rate */}
                          <div className="col-span-1">
                            <input
                              type="number"
                              value={item.rate}
                              onChange={(e) =>
                                handleItemChange(
                                  item.item_id,
                                  "rate",
                                  Number(e.target.value)
                                )
                              }
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                          {/* Total Quantity */}
                          <div className="col-span-1">
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) =>
                                handleItemChange(
                                  item.item_id,
                                  "quantity",
                                  Number(e.target.value)
                                )
                              }
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                          {/* Allocated Quantity */}
                          <div className="col-span-2">
                            <div className="font-medium text-gray-900">
                              <span className="text-green-600">
                                {totalAllocatedQty}
                              </span>
                              <span className="text-gray-400 mx-1">/</span>
                              <span>{item.quantity}</span>
                              {remainingQty > 0 && (
                                <span className="text-orange-600 text-xs ml-2">
                                  ({remainingQty} remaining)
                                </span>
                              )}
                            </div>
                          </div>
                          {/* Warehouses (bullet list) */}
                          <div className="col-span-2">
                            <ul className="text-xs text-gray-500 list-disc ml-4">
                              {warehouseList.length > 0 ? (
                                warehouseList.map((w, i) => (
                                  <li key={i}>{w}</li>
                                ))
                              ) : (
                                <li className="text-gray-400">
                                  No allocations
                                </li>
                              )}
                            </ul>
                          </div>
                          {/* Total Price */}
                          <div className="col-span-1">
                            <div className="font-medium text-gray-900">
                              ₹{item.totalPrice.toLocaleString()}
                            </div>
                          </div>
                          {/* Action: Add warehouse allocation */}
                          <div className="col-span-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                addWarehouseAllocation(itemId);
                                if (!isExpanded) toggleItemExpansion(itemId);
                              }}
                              className="text-green-600 hover:text-green-800 border border-green-200 rounded px-2 py-1"
                              title="Add warehouse allocation"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                      {/* Accordion Child Rows (Expanded) */}
                      {isExpanded && (
                        <div className="bg-white border-t border-gray-200 py-4 pl-[3.5rem]">
                          {/* Child Header */}
                          <div className="bg-gray-100 p-2">
                            <div className="grid grid-cols-4 gap-4 text-xs font-medium text-gray-500 uppercase">
                              <div className="col-span-2">Warehouse</div>
                              <div className="col-span-1">Quantity</div>
                              <div className="col-span-1">Actions</div>
                            </div>
                          </div>
                          {/* Child Rows */}
                          {allocations.length === 0 && (
                            <div className="p-4 text-xs text-gray-400">
                              No warehouse allocations yet. Click + to add.
                            </div>
                          )}
                          {allocations.map((allocation) => (
                            <div
                              key={allocation.id}
                              className="p-2 border-t border-gray-100"
                            >
                              <div className="grid grid-cols-4 gap-4 items-center text-sm">
                                {/* Warehouse */}
                                <div className="col-span-2">
                                  <select
                                    value={allocation.warehouse_id}
                                    onChange={(e) =>
                                      updateWarehouseAllocation(
                                        itemId,
                                        allocation.id,
                                        "warehouse_id",
                                        e.target.value
                                      )
                                    }
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  >
                                    <option value="">Select Warehouse</option>
                                    {warehouses.map((warehouse) => (
                                      <option
                                        key={warehouse.id}
                                        value={warehouse.id}
                                      >
                                        {warehouse.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                {/* Quantity */}
                                <div className="col-span-1">
                                  <input
                                    type="number"
                                    value={allocation.qty}
                                    onChange={(e) =>
                                      updateWarehouseAllocation(
                                        itemId,
                                        allocation.id,
                                        "qty",
                                        parseInt(e.target.value) || 0
                                      )
                                    }
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    min="0"
                                    max={item.quantity}
                                  />
                                </div>
                                {/* Actions */}
                                <div className="col-span-1">
                                  <button
                                    onClick={() =>
                                      removeWarehouseAllocation(
                                        itemId,
                                        allocation.id
                                      )
                                    }
                                    className="text-red-600 hover:text-red-800 border border-red-200 rounded px-1 py-1"
                                    title="Remove warehouse allocation"
                                  >
                                    -
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 border border-gray-200 rounded-lg bg-gray-50">
                <p>No items available</p>
                <p className="text-sm mt-1">
                  Select a vendor to load items from quotation
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
