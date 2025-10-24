/**
 * EditPOModal Component - Edit Purchase Order Modal
 *
 * This component integrates with the GET API endpoint to fetch real PO data
 * instead of using dummy data. It fetches complete PO details including:
 * - Purchase order information
 * - Vendor details
 * - Items with their details
 * - Warehouse information
 * - Payment terms
 *
 * API Endpoint: GET ${VITE_API_BASE_URL}/purchase-orders/:id
 *
 * Features:
 * - Loading state during API calls
 * - Error handling with retry functionality
 * - Maps API response to form fields
 * - Fallback to dummy data on API failure
 */

import React, { useState, useEffect } from "react";
import { X, Search, Save, ChevronDown, ChevronRight } from "lucide-react";

interface EditPOModalProps {
  isOpen: boolean;
  onClose: () => void;
  po: {
    id: string;
    poNo: string;
    vendorName: string;
    contactNo: string;
    poDate: string;
    poAmount: number;
    status: string;
    type: string;
    vendorAddress: string;
    warehouseName: string;
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
    paymentTerms: Array<{
      terms: string;
      amount: string;
      reason: string;
    }>;
  };
}

// API Response interfaces
interface APIResponse {
  success: boolean;
  statusCode: number;
  data: {
    purchase_order: {
      id: string;
      po_number: string;
      po_date: string;
      vendor_id: string;
      bank_name: string;
      account_no: string;
      ifsc_code: string;
      sgst: string;
      igst: string;
      cgst: string;
      gst: string;
      total_amount: string;
      po_status: string;
      po_origin_type: string;
      po_origin_id: string;
      po_origin_number: string;
      comments: string;
    };
    vendor_details: {
      business_name: string;
      contact_no: string;
      email: string;
      state: string;
      district: string;
      city: string;
      pincode: string;
      gst_number: string;
      bank_name: string;
      bank_account_number: string;
      ifsc_code: string;
    } | null;
    items: Array<{
      id: string;
      po_id: string;
      item_id: string;
      qty: string;
      rate: string;
      notes: string;
      qs_approved: boolean;
      vendor_id: string;
      warehouse_id: string | null;
      required_qty: string;
      warehouse_code: string | null;
      item_details: {
        id: string;
        item_code: string;
        item_name: string;
        hsn_code: string;
        description: string;
        category_id: string;
        uom_id: string;
        uom_name: string;
      } | null;
    }>;
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
  clientMessage: string;
  devMessage: string;
}

interface EditableItem {
  id: string;
  itemCode: string;
  itemName: string;
  categoryName: string;
  uom: string;
  hsnCode: string;
  rate: number;
  quantity: number;
  total: number;
}

interface WarehouseAllocation {
  id: string;
  warehouse_id: string;
  warehouse_name: string;
  qty: number;
  item_id: string;
  isNew?: boolean; // Track if this is a new allocation
}

interface WarehouseFromAPI {
  id: string;
  warehouse_code: string;
  warehouse_name: string;
  address: string;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
  is_deleted: boolean;
  is_active: boolean;
}

const EditPOModal: React.FC<EditPOModalProps> = ({ isOpen, onClose, po }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [poData, setPOData] = useState<APIResponse["data"] | null>(null);
  const [formData, setFormData] = useState({
    poDate: po.poDate,
    selectedRFQ: po.type === "Quotation" ? "RFQ-001" : "",
    selectedIndent: po.type === "Indent" ? "IND-001" : "",
    selectedVendor: "V001",
    vendorAddress: po.vendorAddress,
    bankName: po.vendorDetails.bankName,
    gstNo: po.gstNo,
    accountNo: po.vendorDetails.accountNo,
    ifscCode: po.vendorDetails.ifscCode,
    igst: po.vendorDetails.igst,
    sgst: po.vendorDetails.sgst,
    cgst: po.vendorDetails.cgst,
  });

  const [items, setItems] = useState<EditableItem[]>(
    po.items.map((item, index) => ({
      id: index.toString(),
      ...item,
    }))
  );

  // Track modified items and saving status
  const [savingItems, setSavingItems] = useState<Set<string>>(new Set());

  // Track original rates from API to detect changes
  const [originalRates, setOriginalRates] = useState<{
    [itemId: string]: number;
  }>({});

  // Warehouse allocation state
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [warehouseAllocations, setWarehouseAllocations] = useState<{
    [itemId: string]: WarehouseAllocation[];
  }>({});

  // Warehouse management state
  const [availableWarehouses, setAvailableWarehouses] = useState<
    WarehouseFromAPI[]
  >([]);

  // Fetch PO data from API
  useEffect(() => {
    const fetchPOData = async () => {
      if (!isOpen || !po.id) return;

      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/purchase-order/${po.id}`
        );
        if (!response.ok) {
          throw new Error(
            `Failed to fetch PO data: ${response.status} ${response.statusText}`
          );
        }

        const apiResponse: APIResponse = await response.json();
        if (apiResponse.success) {
          setPOData(apiResponse.data);

          // Update form data with API response
          const { purchase_order, vendor_details } = apiResponse.data;
          setFormData({
            poDate: new Date(purchase_order.po_date)
              .toISOString()
              .split("T")[0],
            selectedRFQ:
              purchase_order.po_origin_type === "RFQ"
                ? purchase_order.po_origin_number
                : "",
            selectedIndent:
              purchase_order.po_origin_type === "INDENT"
                ? purchase_order.po_origin_number
                : "",
            selectedVendor: purchase_order.vendor_id,
            vendorAddress: vendor_details
              ? `${vendor_details.city}, ${vendor_details.district}, ${vendor_details.state} - ${vendor_details.pincode}`
              : "",
            bankName: purchase_order.bank_name,
            gstNo: purchase_order.gst,
            accountNo: purchase_order.account_no,
            ifscCode: purchase_order.ifsc_code,
            igst: Number(purchase_order.igst) || 0,
            sgst: Number(purchase_order.sgst) || 0,
            cgst: Number(purchase_order.cgst) || 0,
          });

          // Update items
          setItems(
            apiResponse.data.items.map((item, index) => ({
              id: item.item_id, // Use item_id for grouping
              itemCode: item.item_details?.item_code || `ITEM-${index + 1}`,
              itemName: item.item_details?.item_name || "N/A",
              categoryName: "N/A", // This would need to be fetched from category_id
              uom: item.item_details?.uom_name || "N/A",
              hsnCode: item.item_details?.hsn_code || "N/A",
              rate: Number(item.rate) || 0,
              quantity: Number(item.qty) || 0,
              total: (Number(item.rate) || 0) * (Number(item.qty) || 0),
            }))
          );

          // Store original rates for comparison
          const originalRatesMap: { [itemId: string]: number } = {};
          apiResponse.data.items.forEach((item) => {
            originalRatesMap[item.item_id] = Number(item.rate) || 0;
          });
          setOriginalRates(originalRatesMap);

          // Initialize warehouse allocations from API data
          const initialWarehouseAllocations: {
            [itemId: string]: WarehouseAllocation[];
          } = {};
          apiResponse.data.items.forEach((item) => {
            const itemId = item.item_id;
            if (!initialWarehouseAllocations[itemId]) {
              initialWarehouseAllocations[itemId] = [];
            }

            // Find warehouse name from warehouse_details or use warehouse_code
            const warehouseName =
              apiResponse.data.warehouse_details.find(
                (w) => w.id === item.warehouse_id
              )?.warehouse_name ||
              item.warehouse_code ||
              "Unknown";

            // Create warehouse allocation for each API item entry
            initialWarehouseAllocations[itemId].push({
              id: item.id, // Use the API item record id as allocation id
              warehouse_id: item.warehouse_id || "",
              warehouse_name: warehouseName,
              qty: Number(item.qty) || 0,
              item_id: itemId,
              isNew: false, // Mark as existing allocation
            });
          });
          setWarehouseAllocations(initialWarehouseAllocations);
        }
      } catch (error) {
        console.error("Error fetching PO data:", error);
        setError(
          error instanceof Error ? error.message : "Failed to load PO data"
        );
        // Keep using dummy data on error - show a notification or error message
      } finally {
        setLoading(false);
      }
    };

    fetchPOData();
  }, [isOpen, po.id]);

  // Fetch available warehouses from API
  useEffect(() => {
    const fetchWarehouses = async () => {
      if (!isOpen) return;

      try {
        const response = await fetch(
          `${import.meta.env.VITE_IMS_API_BASE_URL}/warehouse`
        );
        if (!response.ok) {
          throw new Error(
            `Failed to fetch warehouses: ${response.status} ${response.statusText}`
          );
        }

        const warehouseData = await response.json();

        // Handle different response formats
        let warehousesList: WarehouseFromAPI[] = [];
        if (Array.isArray(warehouseData)) {
          warehousesList = warehouseData;
        } else if (warehouseData.success && Array.isArray(warehouseData.data)) {
          warehousesList = warehouseData.data;
        } else if (warehouseData.data && Array.isArray(warehouseData.data)) {
          warehousesList = warehouseData.data;
        } else {
          console.warn(
            "Unexpected warehouse API response format:",
            warehouseData
          );
          warehousesList = [];
        }

        // Filter only active warehouses
        const activeWarehouses = warehousesList.filter(
          (wh) => wh.is_active && !wh.is_deleted
        );
        setAvailableWarehouses(activeWarehouses);
      } catch (error) {
        console.error("Error fetching warehouses:", error);
      }
    };

    fetchWarehouses();
  }, [isOpen]);

  if (!isOpen) return null;

  // Use actual RFQ data if available, otherwise use dummy data
  const rfqs =
    poData?.purchase_order?.po_origin_type === "RFQ"
      ? [
        {
          id: poData.purchase_order.po_origin_number || "RFQ-001",
          name: poData.purchase_order.po_origin_number || "Selected RFQ",
        },
      ]
      : [
        { id: "RFQ-001", name: "RFQ-001 - Construction Materials" },
        { id: "RFQ-002", name: "RFQ-002 - IT Equipment" },
      ];

  // Use actual Indent data if available, otherwise use dummy data
  const indents =
    poData?.purchase_order?.po_origin_type === "INDENT"
      ? [
        {
          id: poData.purchase_order.po_origin_number || "IND-001",
          name: poData.purchase_order.po_origin_number || "Selected Indent",
        },
      ]
      : [
        { id: "IND-001", name: "IND-001 - Office Equipment" },
        { id: "IND-002", name: "IND-002 - Construction Materials" },
      ];

  // Use actual vendor data if available, otherwise use dummy data
  const vendors = poData?.vendor_details
    ? [
      {
        id: poData.purchase_order.vendor_id,
        name: poData.vendor_details.business_name,
        address: `${poData.vendor_details.city}, ${poData.vendor_details.district}, ${poData.vendor_details.state} - ${poData.vendor_details.pincode}`,
      },
    ]
    : [
      {
        id: "V001",
        name: "TechCorp Solutions Pvt Ltd",
        address: "123 Tech Street, Bangalore - 560001",
      },
      {
        id: "V002",
        name: "Innovate India Limited",
        address: "456 Innovation Hub, Mumbai - 400001",
      },
    ];

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
      id: `new-${itemId}-${Date.now()}`,
      warehouse_id: "",
      warehouse_name: "",
      qty: 0,
      item_id: itemId,
      isNew: true, // Mark as new allocation
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
            const warehouse = availableWarehouses.find((w) => w.id === value);
            updatedAllocation.warehouse_name = warehouse?.warehouse_name || "";
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

  // Delete warehouse allocation via API if it exists on server, otherwise just remove locally
  const handleDeleteWarehouseAllocation = async (
    itemId: string,
    allocationId: string
  ) => {
    const allocation = warehouseAllocations[itemId]?.find(
      (a) => a.id === allocationId
    );
    if (!allocation) return;

    // Prevent deleting the last warehouse allocation for an item
    const allocationsForItem = warehouseAllocations[itemId] || [];
    const nonDeletedCount = allocationsForItem.filter((a) => a.id !== allocationId).length;
    if (nonDeletedCount === 0) {
      alert(
        "Each item must have at least one warehouse. Please add another warehouse before deleting this one"
      );
      return;
    }

    // If allocation is new/local only, just remove it locally
    if (allocation.isNew || allocationId.toString().startsWith("new-")) {
      removeWarehouseAllocation(itemId, allocationId);
      return;
    }

    // Ask backend to soft-delete the purchase-order-details record
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/purchase-order-details/${allocationId}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to delete allocation: ${response.status} ${response.statusText}`
        );
      }

      const result = await response.json();
      console.log("Delete allocation result:", result);

      // Remove allocation from local state on success
      removeWarehouseAllocation(itemId, allocationId);
      alert("Allocation removed successfully");
    } catch (error) {
      console.error("Error deleting allocation:", error);
      alert(
        `Error deleting allocation: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  };

  const getTotalAllocatedQuantity = (itemId: string): number => {
    const allocations = warehouseAllocations[itemId] || [];
    return allocations.reduce((sum, allocation) => sum + allocation.qty, 0);
  };

  // Save individual warehouse allocation - handles both new and existing
  const handleWarehouseAllocationSave = async (
    itemId: string,
    allocationId: string
  ) => {
    const allocation = warehouseAllocations[itemId]?.find(
      (a) => a.id === allocationId
    );
    if (!allocation || !allocation.warehouse_id || allocation.qty <= 0) {
      alert("Please select a warehouse and enter a valid quantity");
      return;
    }

    // Find the original API item data to get item_id
    const apiItem = poData?.items?.find(
      (apiItem) => apiItem.item_id === itemId
    );
    if (!apiItem) {
      console.error("Cannot find API item data for save");
      return;
    }

    setSavingItems((prev) => new Set(prev).add(allocationId));

    try {
      if (allocation.isNew) {
        // Handle new warehouse allocation - call bulk APIs
        await handleNewWarehouseAllocation(allocation, apiItem);
      } else {
        // Handle existing warehouse allocation - call update API
        await handleExistingWarehouseAllocation(allocation, apiItem);
      }
    } catch (error) {
      console.error("Error saving warehouse allocation:", error);
      alert(
        `Error saving warehouse allocation: ${error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setSavingItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(allocationId);
        return newSet;
      });
    }
  };

  // Handle new warehouse allocation with bulk APIs
  const handleNewWarehouseAllocation = async (
    allocation: WarehouseAllocation,
    apiItem: NonNullable<typeof poData>["items"][0]
  ) => {
    const currentItem = items.find((i) => i.id === allocation.item_id);
    const rate = currentItem?.rate || 0;
    console.log("po data:", poData);
    // Prepare bulk data for purchase-order-details
    const purchaseOrderDetailsPayload = {
      po_id: poData?.purchase_order?.id || po.id,
      vendor_id: poData?.purchase_order?.vendor_id || "default_vendor",
      item_id: apiItem.item_id,
      qty: allocation.qty,
      rate: rate,
      warehouse_id: allocation.warehouse_id,
      notes: "", // Can be added as a field later if needed
      qs_approved: false,
      required_qty: poData?.items[0].required_qty // For new allocations, required_qty is same as allocated qty
    };

    // Prepare bulk data for purchase-order-warehouse
    const purchaseOrderWarehousePayload = {
      po_id: poData?.purchase_order?.id || po.id,
      warehouse_id: allocation.warehouse_id,
      item_id: apiItem.item_id,
      qty: allocation.qty
    };

    // Call both bulk APIs
    const [detailsResponse, warehouseResponse] = await Promise.all([
      fetch(`${import.meta.env.VITE_API_BASE_URL}/purchase-order-details/bulk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify([purchaseOrderDetailsPayload]),
      }),
      fetch(`${import.meta.env.VITE_API_BASE_URL}/purchase-order-warehouse/bulk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify([purchaseOrderWarehousePayload]),
      })
    ]);

    if (!detailsResponse.ok) {
      throw new Error(
        `Failed to create purchase order details: ${detailsResponse.status} ${detailsResponse.statusText}`
      );
    }

    if (!warehouseResponse.ok) {
      throw new Error(
        `Failed to create purchase order warehouse: ${warehouseResponse.status} ${warehouseResponse.statusText}`
      );
    }

    const detailsResult = await detailsResponse.json();
    const warehouseResult = await warehouseResponse.json();

    console.log("Bulk creation successful:", { detailsResult, warehouseResult });
    alert("New warehouse allocation created successfully!");

    // Mark allocation as no longer new and update with real ID if available
    setWarehouseAllocations((prev) => ({
      ...prev,
      [allocation.item_id]: prev[allocation.item_id]?.map((alloc) =>
        alloc.id === allocation.id
          ? { ...alloc, isNew: false, id: detailsResult.data?.[0]?.id || alloc.id }
          : alloc
      ) || [],
    }));
  };

  // Handle existing warehouse allocation with update API
  const handleExistingWarehouseAllocation = async (
    allocation: WarehouseAllocation,
    apiItem: NonNullable<typeof poData>["items"][0]
  ) => {
    const currentItem = items.find((i) => i.id === allocation.item_id);
    const rate = currentItem?.rate || 0;

    const payload = {
      po_id: poData?.purchase_order?.id || po.id,
      vendor_id: poData?.purchase_order?.vendor_id || "default_vendor",
      item_id: apiItem.item_id,
      qty: allocation.qty,
      rate: rate,
      warehouse_id: allocation.warehouse_id,
    };

    // Use the record id for updating a specific purchase-order-details entry
    if (!allocation.id) {
      throw new Error("Cannot determine purchase-order-details record id for update");
    }

    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/purchase-order-details/${allocation.id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to update warehouse allocation: ${response.status} ${response.statusText}`
      );
    }

    const result = await response.json();
    console.log("Warehouse allocation update successful:", result);
    alert("Warehouse allocation updated successfully!");
  };

  // Handle rate update for items
  const handleRateUpdate = async (itemId: string, newRate: number) => {
    // Update the local state first
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === itemId
          ? { ...item, rate: newRate, total: newRate * item.quantity }
          : item
      )
    );

    // Find the original API item data to get item_id
    const apiItem = poData?.items?.find(
      (apiItem) => apiItem.item_id === itemId
    );
    if (!apiItem) {
      console.error("Cannot find API item data for rate update");
      return;
    }

    setSavingItems((prev) => new Set(prev).add(itemId));

    try {
      const payload = {
        po_id: poData?.purchase_order?.id || po.id,
        vendor_id: poData?.purchase_order?.vendor_id || "default_vendor",
        item_id: apiItem.item_id,
        qty: Number(apiItem.qty) || 0,
        rate: newRate,
      };
      console.log("api item:", apiItem);

      // Ensure we have the specific purchase-order-details record id from API data
      if (!apiItem.id) {
        throw new Error("Cannot determine purchase-order-details record id for rate update");
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/purchase-order-details/${apiItem.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to update item rate: ${response.status} ${response.statusText}`
        );
      }

      const result = await response.json();
      console.log("Rate update successful:", result);
      alert("Item rate updated successfully!");

      // Update the original rate to reflect the new saved rate
      setOriginalRates((prev) => ({
        ...prev,
        [itemId]: newRate,
      }));
    } catch (error) {
      console.error("Error updating item rate:", error);
      alert(
        `Error updating item rate: ${error instanceof Error ? error.message : "Unknown error"
        }`
      );
      // Revert the local state change on error
      const originalItem = items.find((item) => item.id === itemId);
      if (originalItem) {
        setItems((prevItems) =>
          prevItems.map((item) =>
            item.id === itemId
              ? { ...item, rate: originalItem.rate, total: originalItem.total }
              : item
          )
        );
      }
    } finally {
      setSavingItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  // Group items by item_id similar to ViewPOModal
  const groupedItems = (poData?.items || []).reduce((acc, item) => {
    // Skip items without item_details or item_id
    if (!item.item_details || !item.item_id) {
      return acc;
    }

    const itemId = item.item_id;
    if (!acc[itemId]) {
      acc[itemId] = {
        item_details: item.item_details,
        entries: [],
      };
    }
    acc[itemId].entries.push(item);
    return acc;
  }, {} as Record<string, { item_details: NonNullable<NonNullable<typeof poData>["items"][0]["item_details"]>; entries: Array<NonNullable<typeof poData>["items"][0]> }>);

  // Filter grouped items based on search term
  const filteredGroupedItems = Object.fromEntries(
    Object.entries(groupedItems).filter(
      ([, itemGroup]) =>
        itemGroup.item_details?.item_code
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        itemGroup.item_details?.item_name
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase())
    )
  );

  // Helper function to calculate totals for a grouped item
  const calculateItemTotals = (
    entries: Array<{ rate?: string; qty?: string }>,
    itemId: string
  ) => {
    const totalQty = entries.reduce(
      (sum, entry) => sum + parseFloat(entry.qty || "0"),
      0
    );

    // Get the current rate from local state if available, otherwise use API rate
    const currentItem = items.find((item) => item.id === itemId);
    const rate = currentItem?.rate || parseFloat(entries[0]?.rate || "0");

    // Calculate total based on allocated quantities instead of required quantities
    const allocatedQty = getTotalAllocatedQuantity(itemId);
    const totalValue = allocatedQty * rate; // Use allocated qty instead of total qty

    return { totalQty, totalValue, rate, allocatedQty };
  };

  const totalAmount = Object.entries(groupedItems).reduce(
    (sum, [itemId, itemGroup]) => {
      const { totalValue } = calculateItemTotals(itemGroup.entries, itemId);
      return sum + totalValue;
    },
    0
  );

  const determinePOStatus = (): 'PENDING' | 'DRAFT' => {
    // Get all unique item IDs from the PO data
    const allItemIds = Object.keys(groupedItems);
    
    // Check if all items have at least one warehouse allocation with valid data
    const allItemsAllocated = allItemIds.every((itemId) => {
      const allocations = warehouseAllocations[itemId] || [];
      // Item is considered allocated if it has at least one valid allocation
      return allocations.some(allocation => 
        allocation.warehouse_id && 
        allocation.qty > 0 && 
        !allocation.isNew // Only count saved allocations, not new unsaved ones
      );
    });

    return allItemsAllocated ? 'PENDING' : 'DRAFT';
  };
  
  const handleSave = async () => {
    const poStatus = determinePOStatus();

    const updateData = {
      bank_name: formData.bankName,
      gst: formData.gstNo,
      account_no: formData.accountNo,
      ifsc_code: formData.ifscCode,
      igst: formData.igst,
      sgst: formData.sgst,
      cgst: formData.cgst,
      total_amount: totalAmount,
      po_status: poStatus,
    };

    console.log("Updating PO:", updateData);

    try {
      // Update PO data
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/purchase-order/${po.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update PO");
      }

      const result = await response.json();
      console.log("Update successful:", result);

      onClose();
    } catch (error) {
      console.error("Error updating PO:", error);
      alert(
        `Error: ${error instanceof Error ? error.message : "Unknown error occurred"
        }`
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full mx-4 max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-semibold text-gray-900">
              Edit Purchase Order
            </h2>
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              {poData?.purchase_order?.po_number || po.poNo}
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
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading PO data...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="text-red-600 mb-4">
                <X className="w-12 h-12" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Failed to Load PO Data
              </h3>
              <p className="text-gray-600 text-center mb-4">{error}</p>
              <button
                onClick={() => {
                  setError(null);
                  // Retry the fetch by re-triggering the useEffect
                  const fetchPOData = async () => {
                    setLoading(true);
                    setError(null);
                    try {
                      const response = await fetch(
                        `${import.meta.env.VITE_API_BASE_URL}/purchase-orders/${po.id
                        }`
                      );
                      if (!response.ok) {
                        throw new Error(
                          `Failed to fetch PO data: ${response.status} ${response.statusText}`
                        );
                      }

                      const apiResponse: APIResponse = await response.json();
                      if (apiResponse.success) {
                        setPOData(apiResponse.data);

                        // Update form data with API response
                        const { purchase_order, vendor_details } =
                          apiResponse.data;
                        setFormData({
                          poDate: new Date(purchase_order.po_date)
                            .toISOString()
                            .split("T")[0],
                          selectedRFQ:
                            purchase_order.po_origin_type === "RFQ"
                              ? purchase_order.po_origin_number
                              : "",
                          selectedIndent:
                            purchase_order.po_origin_type === "INDENT"
                              ? purchase_order.po_origin_number
                              : "",
                          selectedVendor: purchase_order.vendor_id,
                          vendorAddress: vendor_details
                            ? `${vendor_details.city}, ${vendor_details.district}, ${vendor_details.state} - ${vendor_details.pincode}`
                            : "",
                          bankName: purchase_order.bank_name,
                          gstNo: purchase_order.gst,
                          accountNo: purchase_order.account_no,
                          ifscCode: purchase_order.ifsc_code,
                          igst: Number(purchase_order.igst) || 0,
                          sgst: Number(purchase_order.sgst) || 0,
                          cgst: Number(purchase_order.cgst) || 0,
                        });

                        // Update items
                        setItems(
                          apiResponse.data.items.map((item, index) => ({
                            id: item.item_id,
                            itemCode:
                              item.item_details?.item_code ||
                              `ITEM-${index + 1}`,
                            itemName: item.item_details?.item_name || "N/A",
                            categoryName: "N/A", // This would need to be fetched from category_id
                            uom: item.item_details?.uom_name || "N/A", // This would need to be fetched from uom_id
                            hsnCode: item.item_details?.hsn_code || "N/A",
                            rate: Number(item.rate) || 0,
                            quantity: Number(item.qty) || 0,
                            total:
                              (Number(item.rate) || 0) *
                              (Number(item.qty) || 0),
                          }))
                        );
                      }
                    } catch (error) {
                      console.error("Error fetching PO data:", error);
                      setError(
                        error instanceof Error
                          ? error.message
                          : "Failed to load PO data"
                      );
                    } finally {
                      setLoading(false);
                    }
                  };
                  fetchPOData();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : (
            <>
              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    PO Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.poDate}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                  />
                </div>

                {poData?.purchase_order?.po_origin_type === "RFQ" ||
                  po.type === "Quotation" ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select RFQ <span className="text-red-500">*</span>
                    </label>
                    <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed flex items-center min-h-[42px]">
                      {(() => {
                        const selected = rfqs.find(
                          (rfq) => rfq.id === formData.selectedRFQ
                        );
                        console.log("selected", selected);

                        return selected ? selected.id : "Select RFQ";
                      })()}
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Indent <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.selectedIndent}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
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
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                  >
                    <option value="">Select Vendor</option>
                    {vendors.map((vendor) => (
                      <option key={vendor.id} value={vendor.id}>
                        {vendor.name}
                      </option>
                    ))}
                  </select>
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
                      onChange={(e) =>
                        setFormData({ ...formData, bankName: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      GST No
                    </label>
                    <input
                      type="text"
                      value={formData.gstNo}
                      onChange={(e) =>
                        setFormData({ ...formData, gstNo: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Account Number
                    </label>
                    <input
                      type="text"
                      value={formData.accountNo}
                      onChange={(e) =>
                        setFormData({ ...formData, accountNo: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      IFSC Code
                    </label>
                    <input
                      type="text"
                      value={formData.ifscCode}
                      onChange={(e) =>
                        setFormData({ ...formData, ifscCode: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        setFormData({
                          ...formData,
                          igst: Number(e.target.value),
                        })
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
                        setFormData({
                          ...formData,
                          sgst: Number(e.target.value),
                        })
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
                        setFormData({
                          ...formData,
                          cgst: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Terms */}
              {/* <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Vendor Payment Terms</h3>
              <button 
                onClick={handleAddPaymentTerm}
                className="flex items-center space-x-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Term</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Terms</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Amount</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Reason</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-900">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentTerms.map((term) => (
                    <tr key={term.id} className="border-t border-gray-200">
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={term.terms}
                          onChange={(e) => handlePaymentTermChange(term.id, 'terms', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={term.amount}
                          onChange={(e) => handlePaymentTermChange(term.id, 'amount', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={term.reason}
                          onChange={(e) => handlePaymentTermChange(term.id, 'reason', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleDeletePaymentTerm(term.id)}
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
          </div> */}

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
                  {Object.keys(filteredGroupedItems).length > 0 ? (
                    <div className="space-y-2">
                      {/* Header Row */}
                      <div className="grid grid-cols-9 gap-4 text-sm font-medium text-gray-500 px-4 py-2 bg-gray-50 rounded-lg">
                        <div>Item Code</div>
                        <div>Item Name</div>
                        <div>UOM</div>
                        <div>HSN Code</div>
                        <div>Rate</div>
                        <div>Required Quantity</div>
                        <div>Allocated Quantity</div>
                        <div>Total Value</div>
                        <div>Actions</div>
                      </div>

                      {Object.entries(filteredGroupedItems).map(
                        ([itemId, itemGroup]) => {
                          // Safety check for item_details
                          if (!itemGroup.item_details) {
                            return null;
                          }
                          console.log("fetched daya:", itemGroup)
                          const isExpanded = expandedItems.has(itemId);
                          const allocations =
                            warehouseAllocations[itemId] || [];
                          const { totalValue } = calculateItemTotals(
                            itemGroup.entries,
                            itemId
                          );
                          const totalAllocatedQty =
                            getTotalAllocatedQuantity(itemId);
                          const remainingQty = Number(itemGroup.entries[0].required_qty) - totalAllocatedQty;

                          return (
                            <div
                              key={itemId}
                              className="border border-gray-200 rounded-lg"
                            >
                              {/* Main Item Row */}
                              <div
                                className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                                onClick={() => toggleItemExpansion(itemId)}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3 w-full">
                                    {isExpanded ? (
                                      <ChevronDown className="w-4 h-4 text-gray-500" />
                                    ) : (
                                      <ChevronRight className="w-4 h-4 text-gray-500" />
                                    )}
                                    <div className="grid grid-cols-9 gap-4 flex-1">
                                      <div>
                                        <p className="font-medium text-gray-900">
                                          {itemGroup.item_details.item_code ||
                                            "N/A"}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-gray-600">
                                          {itemGroup.item_details.item_name ||
                                            "N/A"}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-gray-600">
                                          {itemGroup.item_details.uom_name ||
                                            "N/A"}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-gray-600">
                                          {itemGroup.item_details.hsn_code ||
                                            "N/A"}
                                        </p>
                                      </div>
                                      <div>
                                        <div className="flex items-center space-x-2">
                                          <input
                                            type="number"
                                            value={
                                              items.find((i) => i.id === itemId)
                                                ?.rate || 0
                                            }
                                            onChange={(e) => {
                                              const newRate =
                                                parseFloat(e.target.value) || 0;
                                              setItems((prevItems) =>
                                                prevItems.map((item) =>
                                                  item.id === itemId
                                                    ? {
                                                      ...item,
                                                      rate: newRate,
                                                      total:
                                                        newRate *
                                                        item.quantity,
                                                    }
                                                    : item
                                                )
                                              );
                                            }}
                                            className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            min="0"
                                            step="0.01"
                                            onClick={(e) => e.stopPropagation()}
                                          />
                                        </div>
                                      </div>
                                      <div>
                                        <p className="text-gray-600">
                                          {itemGroup.entries[0].required_qty}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-gray-600">
                                          {totalAllocatedQty}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="font-medium text-gray-900">
                                          ₹{totalValue.toLocaleString()}
                                        </p>
                                      </div>
                                      <div>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            const currentItem = items.find(
                                              (i) => i.id === itemId
                                            );
                                            if (currentItem) {
                                              handleRateUpdate(
                                                itemId,
                                                currentItem.rate
                                              );
                                            }
                                          }}
                                          disabled={
                                            savingItems.has(itemId) ||
                                            items.find((i) => i.id === itemId)
                                              ?.rate === originalRates[itemId]
                                          }
                                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                                        >
                                          {savingItems.has(itemId) ? (
                                            <div className="flex items-center space-x-1">
                                              <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                                              <span>Saving...</span>
                                            </div>
                                          ) : (
                                            "Update Rate"
                                          )}
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Expanded Details - Warehouse Allocations */}
                              {isExpanded && (
                                <div className="border-t border-gray-200 bg-gray-50">
                                  <div className="p-4">
                                    <div className="flex items-center justify-between mb-3">
                                      <h4 className="text-sm font-medium text-gray-700">
                                        Warehouse Distribution:
                                      </h4>
                                      <div className="text-sm text-gray-600">
                                        <span className="text-green-600 font-medium">
                                          {totalAllocatedQty}
                                        </span>
                                        <span className="text-gray-400 mx-1">
                                          /
                                        </span>
                                        <span>{itemGroup.entries[0].required_qty}</span>
                                        {remainingQty > 0 && (
                                          <span className="text-orange-600 ml-2">
                                            ({remainingQty} remaining)
                                          </span>
                                        )}
                                      </div>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          addWarehouseAllocation(itemId);
                                        }}
                                        className="text-green-600 hover:text-green-800 border border-green-200 rounded px-2 py-1 text-sm"
                                        title="Add warehouse allocation"
                                      >
                                        + Add Warehouse
                                      </button>
                                    </div>

                                    <div className="overflow-x-auto">
                                      {/* Show existing warehouse entries from API */}
                                      {/* <h5 className="text-sm font-medium text-gray-700 mb-2">
                                        Current Allocations:
                                      </h5> */}
                                      {/* <table className="w-full mb-4">
                                        <thead>
                                          <tr className="text-sm text-gray-600">
                                            <th className="text-left py-2 px-3">
                                              Warehouse
                                            </th>
                                            <th className="text-left py-2 px-3">
                                              Quantity
                                            </th>
                                            <th className="text-left py-2 px-3">
                                              Rate
                                            </th>
                                            <th className="text-left py-2 px-3">
                                              Total
                                            </th>
                                            <th className="text-left py-2 px-3">
                                              Notes
                                            </th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {itemGroup.entries.map((entry) => {
                                            const entryTotal =
                                              parseFloat(entry?.rate || "0") *
                                              parseFloat(entry?.qty || "0");
                                            return (
                                              <tr
                                                key={entry.id}
                                                className="text-sm border-t border-gray-200"
                                              >
                                                <td className="py-2 px-3 text-gray-600">
                                                  {getWarehouseName(
                                                    entry.warehouse_id,
                                                    entry.warehouse_code
                                                  )}
                                                </td>
                                                <td className="py-2 px-3 text-gray-600">
                                                  {entry.qty || "0"}
                                                </td>
                                                <td className="py-2 px-3 text-gray-600">
                                                  ₹
                                                  {parseFloat(
                                                    entry?.rate || "0"
                                                  ).toLocaleString()}
                                                </td>
                                                <td className="py-2 px-3 text-gray-600">
                                                  ₹{entryTotal.toLocaleString()}
                                                </td>
                                                <td className="py-2 px-3 text-gray-600">
                                                  {entry.notes || "-"}
                                                </td>
                                              </tr>
                                            );
                                          })}
                                        </tbody>
                                      </table> */}

                                      {/* Add/Edit new warehouse allocations */}
                                      {allocations.length > 0 && (
                                        <>
                                          {/* <h5 className="text-sm font-medium text-gray-700 mb-2">
                                            Add New Allocations:
                                          </h5> */}
                                          <table className="w-full">
                                            <thead>
                                              <tr className="text-sm text-gray-600">
                                                <th className="text-left py-2 px-3">
                                                  Warehouse
                                                </th>
                                                <th className="text-left py-2 px-3">
                                                  Quantity
                                                </th>
                                                <th className="text-left py-2 px-3">
                                                  Actions
                                                </th>
                                                <th className="text-left py-2 px-3">
                                                  Save
                                                </th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {allocations.map((allocation) => (
                                                <tr
                                                  key={allocation.id}
                                                  className="text-sm border-t border-gray-200"
                                                >
                                                  <td className="py-2 px-3">
                                                    <select
                                                      value={
                                                        allocation.warehouse_id
                                                      }
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
                                                      <option value="">
                                                        Select Warehouse
                                                      </option>
                                                      {availableWarehouses.map(
                                                        (warehouse) => (
                                                          <option
                                                            key={warehouse.id}
                                                            value={warehouse.id}
                                                          >
                                                            {
                                                              warehouse.warehouse_name
                                                            }{" "}
                                                            (
                                                            {
                                                              warehouse.warehouse_code
                                                            }
                                                            )
                                                          </option>
                                                        )
                                                      )}
                                                    </select>
                                                  </td>
                                                  <td className="py-2 px-3">
                                                    <input
                                                      type="number"
                                                      value={allocation.qty}
                                                      onChange={(e) =>
                                                        updateWarehouseAllocation(
                                                          itemId,
                                                          allocation.id,
                                                          "qty",
                                                          parseInt(
                                                            e.target.value
                                                          ) || 0
                                                        )
                                                      }
                                                      className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                      min="0"
                                                      max={itemGroup.entries[0].required_qty}
                                                    />
                                                  </td>
                                                  <td className="py-2 px-3">
                                                    <button
                                                      onClick={() =>
                                                        handleDeleteWarehouseAllocation(
                                                          itemId,
                                                          allocation.id
                                                        )
                                                      }
                                                      className="text-red-600 hover:text-red-800 border border-red-200 rounded px-2 py-1 text-sm"
                                                      title="Remove warehouse allocation"
                                                    >
                                                      Remove
                                                    </button>
                                                  </td>
                                                  <td className="py-2 px-3">
                                                    <button
                                                      onClick={() =>
                                                        handleWarehouseAllocationSave(
                                                          itemId,
                                                          allocation.id
                                                        )
                                                      }
                                                      disabled={
                                                        savingItems.has(
                                                          allocation.id
                                                        ) ||
                                                        !allocation.warehouse_id ||
                                                        allocation.qty <= 0
                                                      }
                                                      className={`px-3 py-1 rounded text-sm font-medium transition-colors ${allocation.warehouse_id &&
                                                        allocation.qty > 0
                                                        ? "bg-blue-600 text-white hover:bg-blue-700"
                                                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                                        } ${savingItems.has(
                                                          allocation.id
                                                        )
                                                          ? "opacity-50 cursor-not-allowed"
                                                          : ""
                                                        }`}
                                                    >
                                                      {savingItems.has(
                                                        allocation.id
                                                      ) ? (
                                                        <div className="flex items-center space-x-1">
                                                          <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                                                          <span>Saving</span>
                                                        </div>
                                                      ) : (
                                                        <div className="flex items-center space-x-1">
                                                          <Save className="w-3 h-3" />
                                                          <span>Save</span>
                                                        </div>
                                                      )}
                                                    </button>
                                                  </td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        }
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 border border-gray-200 rounded-lg bg-gray-50">
                      <p>No items available</p>
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
            </>
          )}
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
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditPOModal;
