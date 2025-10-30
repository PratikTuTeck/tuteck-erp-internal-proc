import React, { useState, useEffect } from "react";
import {
  X,
  Search,
  Edit,
  AlertTriangle,
  Loader2,
  Plus,
  ShoppingCart,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import axios from "axios";

import useNotifications from '../../hooks/useNotifications';
import { useAuth } from '../../hooks/useAuth';

interface AmendPOModalProps {
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
  };
}

interface ApiPOData {
  purchase_order: {
    id: string;
    po_origin_id: string;
    po_number: string;
    po_date: string;
    vendor_id: string;
    total_amount: string;
    po_status: string;
    po_type: string;
    po_origin_type: string;
    po_origin_number: string;
    bank_name: string;
    account_no: string;
    ifsc_code: string;
    sgst: string;
    cgst: string;
    igst: string;
    gst: string;
  };
  vendor_details: {
    vendor_id: string;
    business_name: string;
    contact_no: string;
    city: string;
    state: string;
    district: string;
    pincode: string;
  } | null;
  items: Array<{
    id: string;
    po_id: string;
    item_id: string;
    qty: string;
    rate: string;
    warehouse_id: string;
    warehouse_code: string;
    required_qty: string;
    item_details: {
      id: string;
      item_code: string;
      item_name: string;
      hsn_code: string;
      uom_value: string;
    } | null;
  }>;
  warehouse_details: Array<{
    id: string;
    po_id: string;
    warehouse_id: string;
    warehouse_code: string;
    warehouse_name: string;
    address: string | null;
  }>;
  payment_terms: Array<{
    payment_terms_type: string;
    charges_amount: string;
    charges_percent: string;
    note: string;
  }>;
}

interface AmendableItem {
  id: string;
  slNo: number;
  hsnCode: string;
  itemCode: string;
  itemName: string;
  uom: string;
  rate: number;
  quantity: number;
  requiredQty?: number;
  totalPrice: number;
  selected: boolean;
  isEditing: boolean;
  isNewItem?: boolean;
}

interface WarehouseAllocation {
  id: string;
  warehouse_id: string;
  warehouse_name: string;
  qty: number;
  item_id: string;
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

interface ApiItem {
  id: string;
  item_code: string;
  item_name: string;
  hsn_code: string;
  uom_value: string;
  category_name?: string;
  description?: string;
  latest_lowest_net_rate: number;
}

const AmendPOModal: React.FC<AmendPOModalProps> = ({ isOpen, onClose, po }) => {
  //----------------------------------------------------------------------------------- For Notification
  const token = localStorage.getItem('auth_token') || '';
  const { user } = useAuth();
  const { sendNotification } = useNotifications(user?.role, token);
  //------------------------------------------------------------------------------------

  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiData, setApiData] = useState<ApiPOData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Warehouse allocation state
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [warehouseAllocations, setWarehouseAllocations] = useState<{
    [itemId: string]: WarehouseAllocation[];
  }>({});

  // Available warehouses for warehouse allocation
  const [availableWarehouses, setAvailableWarehouses] = useState<
    WarehouseFromAPI[]
  >([]);

  // Add Item Modal states
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [availableItems, setAvailableItems] = useState<ApiItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [itemSearchTerm, setItemSearchTerm] = useState("");
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Track removed warehouse entries
  const [removedWarehouseEntries, setRemovedWarehouseEntries] = useState<Set<string>>(new Set());

  const [formData, setFormData] = useState({
    parentPO: "",
    rfq: "",
    indent: "",
    poDate: "",
    vendorAddress: "",
    bankName: "",
    accountNo: "",
    ifscCode: "",
    cgst: 0,
    sgst: 0,
    igst: 0,
    poOriginType: "",
  });

  const [items, setItems] = useState<AmendableItem[]>([]);

  // Fetch PO data from API
  useEffect(() => {
    if (isOpen && po?.id) {
      fetchPOData(po.id);
      fetchAvailableWarehouses();
    }
  }, [isOpen, po?.id]);

  const fetchPOData = async (poId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/purchase-order/${poId}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch purchase order data");
      }

      const result = await response.json();

      if (result.success) {
        setApiData(result.data);
        mapApiDataToFormData(result.data);
      } else {
        throw new Error(
          result.clientMessage || "Failed to fetch purchase order data"
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching PO data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch available warehouses from API
  const fetchAvailableWarehouses = async () => {
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

  const removeCurrentWarehouseEntry = (entryId: string) => {
    setRemovedWarehouseEntries((prev) => new Set(prev).add(entryId));
    // Also remove from local editing states if present
    setEditingWarehouseQty((prev) => {
      const newSet = new Set(prev);
      newSet.delete(entryId);
      return newSet;
    });
    setLocalWarehouseQty((prev) => {
      const newQty = { ...prev };
      delete newQty[entryId];
      return newQty;
    });
  };

  const getTotalAllocatedQuantity = (itemId: string): number => {
    // Get additional allocations
    const allocations = warehouseAllocations[itemId] || [];
    const additionalAllocatedQty = allocations.reduce((sum, allocation) => sum + allocation.qty, 0);

    // Get existing allocations from API data
    const itemGroup = groupedItems[itemId];
    const existingAllocatedQty = itemGroup ? itemGroup.entries.reduce(
      (sum, entry) => {
        const qty = localWarehouseQty[entry.id] ?? parseFloat(entry.qty || "0");
        return sum + qty;
      },
      0
    ) : 0;

    return existingAllocatedQty + additionalAllocatedQty;
  };

  // Group items by item_id similar to EditPOModal
  const groupedItems = (() => {
    // Start with API items
    const apiGroupedItems = (apiData?.items || []).reduce((acc, item) => {
      // Skip items without item_details or item_id, or if entry is removed
      if (!item.item_details || !item.item_id || removedWarehouseEntries.has(item.id)) {
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
    }, {} as Record<string, { item_details: NonNullable<NonNullable<typeof apiData>["items"][0]["item_details"]>; entries: Array<NonNullable<typeof apiData>["items"][0]> }>);

    // Add newly added items to the grouped items
    items.forEach((item) => {
      if (item.isNewItem) {
        const itemId = item.id;
        if (!apiGroupedItems[itemId]) {
          // Create item details for new items without any warehouse entries
          apiGroupedItems[itemId] = {
            item_details: {
              id: item.id,
              item_code: item.itemCode,
              item_name: item.itemName,
              hsn_code: item.hsnCode,
              uom_value: item.uom,
            },
            entries: [] // No warehouse entries by default for new items
          };
        }
      }
    });

    // Clean up items that have no entries left (but keep new items that start with empty entries)
    Object.keys(apiGroupedItems).forEach(itemId => {
      if (apiGroupedItems[itemId].entries.length === 0) {
        // Only remove if it's not a new item (new items are supposed to have empty entries)
        const isNewItem = items.some(item => item.id === itemId && item.isNewItem);
        if (!isNewItem) {
          delete apiGroupedItems[itemId];
        }
      }
    });

    return apiGroupedItems;
  })();

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

  // Helper function to get warehouse name from warehouse details
  const getWarehouseName = (
    warehouseId: string | null,
    warehouseCode: string | null
  ) => {
    if (!warehouseId) return "Unassigned";
    const warehouse = apiData?.warehouse_details?.find(
      (w) => w.warehouse_id === warehouseId
    );
    return warehouse
      ? `${warehouse.warehouse_name} (${warehouse.warehouse_code})`
      : warehouseCode || "Unknown";
  };

  // Track editing state for rates and warehouse quantities
  const [editingRates, setEditingRates] = useState<Set<string>>(new Set());
  const [editingWarehouseQty, setEditingWarehouseQty] = useState<Set<string>>(
    new Set()
  );
  const [localRates, setLocalRates] = useState<{ [itemId: string]: number }>(
    {}
  );
  const [localWarehouseQty, setLocalWarehouseQty] = useState<{
    [entryId: string]: number;
  }>({});

  // Save rate for an item
  const saveItemRate = (itemId: string) => {
    const newRate = localRates[itemId];
    if (newRate !== undefined) {
      // Update the local state (in real implementation, this would also call API)
      console.log(`Saving rate for item ${itemId}: ${newRate}`);
      // Remove from editing state
      setEditingRates((prev) => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  // Save warehouse quantity for an entry
  const saveWarehouseQuantity = (entryId: string) => {
    const newQty = localWarehouseQty[entryId];
    if (newQty !== undefined) {
      // Update the local state (in real implementation, this would also call API)
      console.log(`Saving quantity for entry ${entryId}: ${newQty}`);
      // Remove from editing state
      setEditingWarehouseQty((prev) => {
        const newSet = new Set(prev);
        newSet.delete(entryId);
        return newSet;
      });
    }
  };

  // Helper function to calculate totals for a grouped item
  const calculateItemTotals = (
    entries: Array<{ id: string; rate?: string; qty?: string }>,
    itemId: string
  ) => {
    // Check if this is a new item with no warehouse entries
    const currentItem = items.find((item) => item.id === itemId);

    let totalQty = 0;
    let rate = 0;

    if (entries.length === 0 && currentItem?.isNewItem) {
      // For new items with no warehouse entries, use the item's original quantity
      totalQty = currentItem.quantity;
      rate = localRates[itemId] ?? currentItem.rate ?? 0;
    } else {
      // For existing items with warehouse entries
      totalQty = entries.reduce(
        (sum, entry) => {
          const qty = localWarehouseQty[entry.id] ?? parseFloat(entry.qty || "0");
          return sum + qty;
        },
        0
      );
      rate = localRates[itemId] ?? currentItem?.rate ?? parseFloat(entries[0]?.rate || "0");
    }

    const totalValue = totalQty * rate;
    return { totalQty, totalValue, rate };
  };

  // Fetch available items from API
  const fetchAvailableItems = async () => {
    try {
      setLoadingItems(true);
      // Replace with your actual API endpoint for fetching items
      const response = await fetch(
        `${import.meta.env.VITE_IMS_API_BASE_URL}/item`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch items");
      }

      const result = await response.json();

      if (result.success) {
        setAvailableItems(result.data || []);
      } else {
        throw new Error(result.clientMessage || "Failed to fetch items");
      }
    } catch (err) {
      console.error("Error fetching items:", err);
      setError("Failed to load items list");
    } finally {
      setLoadingItems(false);
    }
  };

  const mapApiDataToFormData = (data: ApiPOData) => {
    const { purchase_order, vendor_details, items: apiItems } = data;

    setFormData({
      parentPO: purchase_order.po_number,
      rfq:
        purchase_order.po_origin_type === "RFQ"
          ? purchase_order.po_origin_number
          : "",
      indent:
        purchase_order.po_origin_type === "INDENT"
          ? purchase_order.po_origin_number
          : "",
      poDate: purchase_order.po_date
        ? new Date(purchase_order.po_date).toISOString().split("T")[0]
        : "",
      vendorAddress: vendor_details
        ? `${vendor_details.city}, ${vendor_details.state}, ${vendor_details.district} - ${vendor_details.pincode}`
        : "",
      bankName: purchase_order.bank_name || "",
      accountNo: purchase_order.account_no || "",
      ifscCode: purchase_order.ifsc_code || "",
      cgst: Number(purchase_order.cgst) || 0,
      sgst: Number(purchase_order.sgst) || 0,
      igst: Number(purchase_order.igst) || 0,
      poOriginType: purchase_order.po_origin_type || "",
    });

    const mappedItems: AmendableItem[] = apiItems.map((item, index) => ({
      id: item.item_id,
      slNo: index + 1,
      hsnCode: item.item_details?.hsn_code || "",
      itemCode: item.item_details?.item_code || "",
      itemName: item.item_details?.item_name || "",
      uom: item.item_details?.uom_value || "",
      rate: Number(item.rate) || 0,
      quantity: Number(item.qty) || 0,
      totalPrice: (Number(item.rate) || 0) * (Number(item.qty) || 0),
      requiredQty: Number(item.required_qty) || 0,
      selected: false,
      isEditing: false,
    }));

    setItems(mappedItems);
  };

  // Add Item Modal functions
  const handleOpenAddItemModal = () => {
    setShowAddItemModal(true);
    setSelectedItems(new Set());
    setItemSearchTerm("");
    fetchAvailableItems();
  };

  const handleCloseAddItemModal = () => {
    setShowAddItemModal(false);
    setSelectedItems(new Set());
    setItemSearchTerm("");
  };

  const handleItemSelection = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleSelectAllItems = () => {
    const filteredAvailableItems = availableItems.filter(
      (item) =>
        !items.some(
          (existingItem) => existingItem.itemCode === item.item_code
        ) &&
        (item.item_name.toLowerCase().includes(itemSearchTerm.toLowerCase()) ||
          item.item_code.toLowerCase().includes(itemSearchTerm.toLowerCase()))
    );

    if (selectedItems.size === filteredAvailableItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredAvailableItems.map((item) => item.id)));
    }
  };

  const handleAddSelectedItems = () => {
    const itemsToAdd = availableItems.filter((item) =>
      selectedItems.has(item.id)
    );

    const newItems: AmendableItem[] = itemsToAdd.map((item, index) => ({
      id: item.id,
      slNo: items.length + index + 1,
      hsnCode: item.hsn_code || "",
      itemCode: item.item_code,
      itemName: item.item_name,
      uom: item.uom_value || "",
      rate: item.latest_lowest_net_rate,
      quantity: 1,
      totalPrice: 0,
      selected: false,
      isEditing: true,
      isNewItem: true,
    }));

    setItems((prev) => [...prev, ...newItems]);
    handleCloseAddItemModal();
  };

  const handleRemoveItem = (itemId: string) => {
    // Check if it's a new item or existing item
    const currentItem = items.find(item => item.id === itemId);

    if (currentItem?.isNewItem) {
      // For new items, remove from items state
      setItems((prev) => prev.filter(item => item.id !== itemId));
    } else {
      // For existing items, mark all their warehouse entries as removed
      const itemGroup = groupedItems[itemId];
      if (itemGroup) {
        const entryIds = itemGroup.entries.map(entry => entry.id);
        setRemovedWarehouseEntries((prev) => {
          const newSet = new Set(prev);
          entryIds.forEach(id => newSet.add(id));
          return newSet;
        });
      }
    }

    // Clean up related states
    setEditingRates((prev) => {
      const newSet = new Set(prev);
      newSet.delete(itemId);
      return newSet;
    });
    setLocalRates((prev) => {
      const newRates = { ...prev };
      delete newRates[itemId];
      return newRates;
    });
    setWarehouseAllocations((prev) => {
      const newAllocations = { ...prev };
      delete newAllocations[itemId];
      return newAllocations;
    });
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      newSet.delete(itemId);
      return newSet;
    });
  };

  if (!isOpen) return null;

  const filteredAvailableItems = availableItems.filter(
    (item) =>
      !items.some((existingItem) => existingItem.itemCode === item.item_code) &&
      (item.item_name.toLowerCase().includes(itemSearchTerm.toLowerCase()) ||
        item.item_code.toLowerCase().includes(itemSearchTerm.toLowerCase()))
  );

  const subtotalAmount = Object.entries(groupedItems).reduce(
    (sum, [itemId, itemGroup]) => {
      const { totalValue } = calculateItemTotals(itemGroup.entries, itemId);
      return sum + totalValue;
    },
    0
  );
  const cgstAmount = (subtotalAmount * formData.cgst) / 100;
  const sgstAmount = (subtotalAmount * formData.sgst) / 100;
  const igstAmount = (subtotalAmount * formData.igst) / 100;
  const totalAmount = subtotalAmount + cgstAmount + sgstAmount + igstAmount;

  const handleSave = async () => {
    if (Object.keys(groupedItems).length === 0) {
      alert("Please select at least one item to amend");
      return;
    }

    // Validate warehouse allocations (only check for obvious errors)
    const itemsWithErrors = Object.entries(groupedItems).filter(([itemId, _itemGroup]) => {
      const allocations = warehouseAllocations[itemId] || [];
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

    const originType = formData.poOriginType || apiData?.purchase_order.po_origin_type;
    if (originType === "RFQ") {
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
        po_origin_id: apiData?.purchase_order.po_origin_id || "",
        po_origin_type: formData.poOriginType,
        po_number: formData.parentPO,
        po_uri: null,
        vendor_id: apiData?.purchase_order.vendor_id || po.vendorName, // fallback to vendorName if id not present
        approved_by: null,
        is_mailed: false,
        mail_sent: null,
        comments: "",
        reference_purchase_id: po.id,
        po_type: apiData?.purchase_order.po_type || "STANDARD",
        po_date: formData.poDate,
        bank_name: formData.bankName,
        account_no: formData.accountNo,
        ifsc_code: formData.ifscCode,
        sgst: parseFloat(formData.sgst.toString()),
        igst: parseFloat(formData.igst.toString()),
        project_id: null,
        lookup_approval_status: null,
        approved_on: null,
        gst: po.gstNo || "",
        total_amount: totalAmount,
        cgst: parseFloat(formData.cgst.toString()),
        inspection_status: false,
        cs_id: null,
        po_status: "AMENDED",
      };

      console.log("Creating amended PO with payload:", poPayload);
      const poResponse = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/purchase-order/amended`,
        poPayload
      );

      if (!poResponse.data.success) {
        throw new Error("Failed to create amended PO");
      }

      const createdPO = poResponse.data.data;
      const poId = createdPO.id || createdPO.po_id;
      console.log("Amended PO created successfully with ID:", poId);

      // Step 2: Create PO item records with warehouse allocations
      console.log(
        "Creating PO items with warehouse allocations for amended PO ID:",
        poId
      );

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

      Object.entries(groupedItems).forEach(([itemId, itemGroup]) => {
        const allocations = warehouseAllocations[itemId] || [];
        const { rate } = calculateItemTotals(itemGroup.entries, itemId);

        if (allocations.length > 0) {
          // Create separate PO detail records for each warehouse allocation
          allocations.forEach((allocation) => {
            if (allocation.warehouse_id && allocation.qty > 0) {
              poDetailsPayload.push({
                po_id: poId,
                vendor_id: apiData?.purchase_order.vendor_id || po.vendorName,
                item_id: itemId,
                qty: allocation.qty,
                rate: rate,
                notes: "",
                qs_approved: false,
                warehouse_id: allocation.warehouse_id,
              });
            }
          });
        } else {
          // If no warehouse allocations, create records based on original entries
          itemGroup.entries.forEach((entry) => {
            poDetailsPayload.push({
              po_id: poId,
              vendor_id: apiData?.purchase_order.vendor_id || po.vendorName,
              item_id: itemId,
              qty: parseFloat(entry.qty || "0"),
              rate: rate,
              notes: "",
              qs_approved: false,
              warehouse_id: entry.warehouse_id || null,
            });
          });
        }
      });

      console.log("Creating amended PO items with payload:", poDetailsPayload);
      const itemsResponse = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/purchase-order-details/bulk`,
        poDetailsPayload
      );

      if (!itemsResponse.data.success) {
        throw new Error("Failed to create amended PO item records");
      }
      console.log("Amended PO items created successfully");

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
            `${import.meta.env.VITE_API_BASE_URL
            }/purchase-order-warehouse/bulk`,
            warehousePayload
          );
          console.log("Amended Purchase Order warehouse mappings created successfully");
        } catch (warehouseError) {
          console.error("Error creating warehouse mappings:", warehouseError);
          // Continue execution as warehouse mapping is not critical for PO creation
        }
      }

      // ------------------------------------------------------------------------------------------For notifications
      try {
        const amendedPONumber = createdPO?.po_number || poId || 'Amended PO';
        const selectedItemsCount = Object.keys(groupedItems).length;

        await sendNotification({
          receiver_ids: ['admin'],
          title: `Purchase Order Amended: ${amendedPONumber}`,
          message: `Purchase Order ${po.poNo} has been amended and new PO ${amendedPONumber} created for vendor ${po.vendorName} by ${user?.name || 'a user'} with ${selectedItemsCount} items (RFQ Source)`,
          service_type: 'PROC',
          link: '',
          sender_id: user?.role || 'user',
          access: {
            module: "PROC",
            menu: "PO Management",
          }
        });
        console.log(`Notification sent for Purchase Order Amended (RFQ): ${amendedPONumber}`);
      } catch (notifError) {
        console.error('Failed to send notification:', notifError);
        // Continue with the flow even if notification fails
      }
      // ------------------------------------------------------------------------------------------

      alert("Purchase Order amended successfully!");
      onClose();
    } catch (error) {
      console.error("Error amending PO:", error);
      alert("Error amending Purchase Order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveIndentPO = async () => {
    setLoading(true);
    try {
      // Step 1: Create Amended Purchase Order
      const poPayload = {
        po_origin_id: apiData?.purchase_order.po_origin_id || "",
        po_origin_type: formData.poOriginType,
        po_number: formData.parentPO,
        po_uri: null,
        vendor_id: apiData?.purchase_order.vendor_id || po.vendorName,
        approved_by: null,
        is_mailed: false,
        mail_sent: null,
        comments: null,
        reference_purchase_id: po.id,
        po_type: apiData?.purchase_order.po_type || "STANDARD",
        po_date: formData.poDate,
        bank_name: formData.bankName,
        account_no: formData.accountNo,
        ifsc_code: formData.ifscCode,
        sgst: parseFloat(formData.sgst.toString()),
        igst: parseFloat(formData.igst.toString()),
        project_id: null,
        lookup_approval_status: null,
        approved_on: null,
        gst: po.gstNo || "",
        total_amount: totalAmount,
        cgst: parseFloat(formData.cgst.toString()),
        inspection_status: false,
        po_status: "AMENDED",
      };

      const poResponse = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/purchase-order/amended`,
        poPayload
      );

      if (!poResponse.data.success) {
        alert("Failed to amend Purchase Order");
        return;
      }

      const poId = poResponse.data.data.id || poResponse.data.data.po_id;

      // Step 2: Create Purchase Order Details in bulk with warehouse allocations
      console.log("Creating Purchase Order Details for amended PO ID:", poId);

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

      Object.entries(groupedItems).forEach(([itemId, itemGroup]) => {
        const allocations = warehouseAllocations[itemId] || [];
        const { rate } = calculateItemTotals(itemGroup.entries, itemId);

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
                vendor_id: apiData?.purchase_order.vendor_id || po.vendorName,
                item_id: itemId,
                qty: allocation.qty,
                rate: rate,
                notes: "",
                qs_approved: false,
                warehouse_id: allocation.warehouse_id,
              });
            });

            // If there's remaining quantity after allocations, create a fallback entry
            const totalItemQty = itemGroup.entries.reduce((sum, entry) => sum + parseFloat(entry.qty || "0"), 0);
            const remainingQty = totalItemQty - totalAllocated;
            if (remainingQty > 0) {
              poDetailsPayload.push({
                po_id: poId,
                vendor_id: apiData?.purchase_order.vendor_id || po.vendorName,
                item_id: itemId,
                qty: remainingQty,
                rate: rate,
                notes: "",
                qs_approved: false,
                warehouse_id: null,
              });
            }
          } else {
            // No valid allocations, create fallback entry for full quantity
            itemGroup.entries.forEach((entry) => {
              poDetailsPayload.push({
                po_id: poId,
                vendor_id: apiData?.purchase_order.vendor_id || po.vendorName,
                item_id: itemId,
                qty: parseFloat(entry.qty || "0"),
                rate: rate,
                notes: "",
                qs_approved: false,
                warehouse_id: entry.warehouse_id || null,
              });
            });
          }
        } else {
          // If no warehouse allocations, create a single detail entry (fallback)
          itemGroup.entries.forEach((entry) => {
            poDetailsPayload.push({
              po_id: poId,
              vendor_id: apiData?.purchase_order.vendor_id || po.vendorName,
              item_id: itemId,
              qty: parseFloat(entry.qty || "0"),
              rate: rate,
              notes: "",
              qs_approved: false,
              warehouse_id: entry.warehouse_id || null,
            });
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
            `${import.meta.env.VITE_API_BASE_URL
            }/purchase-order-warehouse/bulk`,
            warehousePayload
          );
          console.log(
            "Amended Purchase Order warehouse mappings created successfully"
          );
        } catch (warehouseError) {
          console.error("Error creating warehouse mappings:", warehouseError);
          // Continue execution as warehouse mapping is not critical for PO creation
        }
      }

      if (detailsResponse.data.success) {
        // ------------------------------------------------------------------------------------------For notifications
        try {
          const amendedPONumber = poResponse.data.data?.po_number || poId || 'Amended PO';
          const selectedItemsCount = Object.keys(groupedItems).length;

          await sendNotification({
            receiver_ids: ['admin'],
            title: `Purchase Order Amended: ${amendedPONumber}`,
            message: `Purchase Order ${po.poNo} has been amended and new PO ${amendedPONumber} created for vendor ${po.vendorName} by ${user?.name || 'a user'} with ${selectedItemsCount} items (Indent Source)`,
            service_type: 'PROC',
            link: '',
            sender_id: user?.role || 'user',
            access: {
              module: "PROC",
              menu: "PO Management",
            }
          });
          console.log(`Notification sent for Purchase Order Amended (Indent): ${amendedPONumber}`);
        } catch (notifError) {
          console.error('Failed to send notification:', notifError);
          // Continue with the flow even if notification fails
        }
        // ------------------------------------------------------------------------------------------
        alert("Purchase Order amended successfully!");
        onClose();
      } else {
        alert("Purchase Order amended but failed to add item details");
      }
    } catch (error) {
      console.error("Error amending PO:", error);
      alert("Error amending Purchase Order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full mx-4 max-h-[95vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <Edit className="w-6 h-6 text-purple-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                Amend Purchase Order
              </h2>
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                {apiData?.purchase_order?.po_number || po.poNo || "Loading..."}
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
            {loading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <span className="ml-3 text-gray-600">
                  Loading purchase order data...
                </span>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <div>
                    <h4 className="text-sm font-medium text-red-800">
                      Error Loading Data
                    </h4>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                    <button
                      onClick={() => fetchPOData(po.id)}
                      className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              </div>
            )}

            {!loading && !error && (
              <>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Header Section
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Parent PO / PO
                      </label>
                      <input
                        type="text"
                        value={formData.parentPO}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                      />
                    </div>

                    {formData.poOriginType === "RFQ" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          RFQ
                        </label>
                        <input
                          type="text"
                          value={formData.rfq}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                        />
                      </div>
                    )}

                    {formData.poOriginType === "INDENT" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          INDENT
                        </label>
                        <input
                          type="text"
                          value={formData.indent}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        PO Date
                      </label>
                      <input
                        type="text"
                        value={formData.poDate}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                      />
                    </div>

                    <div className="md:col-span-2">
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
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Bank Details Section
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
                        Account No
                      </label>
                      <input
                        type="text"
                        value={formData.accountNo}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            accountNo: e.target.value,
                          })
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
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Tax Details Section
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Item Details Table
                    </h3>
                    <div className="flex items-center space-x-3">
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
                      <button
                        onClick={handleOpenAddItemModal}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Items</span>
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    {Object.keys(filteredGroupedItems).length > 0 ? (
                      <div className="space-y-2">
                        {/* Header Row */}
                        <div className="grid grid-cols-8 gap-4 text-sm font-medium text-gray-500 px-4 py-2 bg-gray-50 rounded-lg">
                          <div>Item Code</div>
                          <div>Item Name</div>
                          <div>UOM</div>
                          <div>HSN Code</div>
                          <div>Rate</div>
                          <div>Total Quantity</div>
                          <div>Total Value</div>
                          <div>Actions</div>
                        </div>

                        {Object.entries(filteredGroupedItems).map(
                          ([itemId, itemGroup]) => {
                            // Safety check for item_details
                            if (!itemGroup.item_details) {
                              return null;
                            }

                            const isExpanded = expandedItems.has(itemId);
                            const allocations =
                              warehouseAllocations[itemId] || [];
                            const { totalQty, totalValue } =
                              calculateItemTotals(itemGroup.entries, itemId);
                            const totalAllocatedQty =
                              getTotalAllocatedQuantity(itemId);
                            const remainingQty = totalQty - totalAllocatedQty;

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
                                      <div className="grid grid-cols-8 gap-4 flex-1">
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
                                            {itemGroup.item_details.uom_value ||
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
                                          <span className="font-medium">
                                            ₹
                                            {(
                                              localRates[itemId] ??
                                              items.find(
                                                (i) => i.id === itemId
                                              )?.rate ??
                                              0
                                            ).toLocaleString()}
                                          </span>
                                        </div>
                                        <div>
                                          <p className="text-gray-600">
                                            {totalQty}
                                          </p>
                                        </div>
                                        <div>
                                          <p className="font-medium text-gray-900">
                                            ₹{totalValue.toLocaleString()}
                                          </p>
                                        </div>
                                        <div>
                                          <div className="flex space-x-1">
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                // Enable rate editing for this item
                                                setEditingRates((prev) =>
                                                  new Set(prev).add(itemId)
                                                );
                                                setLocalRates((prev) => ({
                                                  ...prev,
                                                  [itemId]:
                                                    items.find(
                                                      (i) => i.id === itemId
                                                    )?.rate ?? 0,
                                                }));
                                                // Expand the item if not already expanded
                                                if (!isExpanded)
                                                  toggleItemExpansion(itemId);
                                              }}
                                              className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                                            >
                                              Edit
                                            </button>
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleRemoveItem(itemId);
                                              }}
                                              className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                                              title="Remove item"
                                            >
                                              Remove
                                            </button>
                                          </div>
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
                                        <div className="flex items-center space-x-3">
                                          <button
                                            onClick={() => addWarehouseAllocation(itemId)}
                                            className="text-green-600 hover:text-green-800 border border-green-200 rounded px-3 py-1 text-sm"
                                            title="Add warehouse allocation"
                                          >
                                            + Add Warehouse
                                          </button>
                                          <div className="text-sm text-gray-600">
                                            <span className="text-green-600 font-medium">
                                              {totalAllocatedQty}
                                            </span>
                                            <span className="text-gray-400 mx-1">
                                              /
                                            </span>
                                            <span>{items.find((i) => i.id === itemId)?.requiredQty || 0}</span>
                                            {remainingQty > 0 && (
                                              <span className="text-orange-600 ml-2">
                                                ({remainingQty} remaining)
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>

                                      {/* Rate Editing Section */}
                                      {editingRates.has(itemId) && (
                                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                          <h5 className="text-sm font-medium text-gray-700 mb-2">
                                            Edit Item Rate:
                                          </h5>
                                          <div className="flex items-center space-x-3">
                                            <label className="text-sm text-gray-600">Rate:</label>
                                            <input
                                              type="number"
                                              value={
                                                localRates[itemId] ??
                                                items.find(
                                                  (i) => i.id === itemId
                                                )?.rate ??
                                                0
                                              }
                                              onChange={(e) => {
                                                const newRate =
                                                  parseFloat(e.target.value) || 0;
                                                setLocalRates((prev) => ({
                                                  ...prev,
                                                  [itemId]: newRate,
                                                }));
                                              }}
                                              className="w-32 px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                              min="0"
                                              step="0.01"
                                              placeholder="Enter rate"
                                            />
                                            <button
                                              onClick={() => saveItemRate(itemId)}
                                              className="px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                                            >
                                              Save Rate
                                            </button>
                                            <button
                                              onClick={() => {
                                                setEditingRates((prev) => {
                                                  const newSet = new Set(prev);
                                                  newSet.delete(itemId);
                                                  return newSet;
                                                });
                                                setLocalRates((prev) => {
                                                  const newRates = { ...prev };
                                                  delete newRates[itemId];
                                                  return newRates;
                                                });
                                              }}
                                              className="px-3 py-2 bg-gray-400 text-white text-sm rounded hover:bg-gray-500"
                                            >
                                              Cancel
                                            </button>
                                          </div>
                                        </div>
                                      )}

                                      <div className="overflow-x-auto">
                                        {/* Show existing warehouse entries from API */}
                                        <h5 className="text-sm font-medium text-gray-700 mb-2">
                                          Current Allocations:
                                        </h5>
                                        <table className="w-full mb-4">
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
                                                Actions
                                              </th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {itemGroup.entries.length > 0 ? (
                                              itemGroup.entries.map((entry) => {
                                                const currentQty =
                                                  localWarehouseQty[entry.id] ??
                                                  parseFloat(entry?.qty || "0");
                                                const currentRate =
                                                  localRates[itemId] ??
                                                  parseFloat(entry?.rate || "0");
                                                const entryTotal =
                                                  currentRate * currentQty;
                                                const isEditingQty =
                                                  editingWarehouseQty.has(
                                                    entry.id
                                                  );

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
                                                      {isEditingQty ? (
                                                        <input
                                                          type="number"
                                                          value={currentQty}
                                                          onChange={(e) => {
                                                            const newQty =
                                                              parseFloat(
                                                                e.target.value
                                                              ) || 0;
                                                            setLocalWarehouseQty(
                                                              (prev) => ({
                                                                ...prev,
                                                                [entry.id]:
                                                                  newQty,
                                                              })
                                                            );
                                                          }}
                                                          className="w-16 px-1 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                                          min="0"
                                                        />
                                                      ) : (
                                                        currentQty
                                                      )}
                                                    </td>
                                                    <td className="py-2 px-3 text-gray-600">
                                                      ₹
                                                      {currentRate.toLocaleString()}
                                                    </td>
                                                    <td className="py-2 px-3 text-gray-600">
                                                      ₹
                                                      {entryTotal.toLocaleString()}
                                                    </td>
                                                    <td className="py-2 px-3">
                                                      {isEditingQty ? (
                                                        <div className="flex space-x-1">
                                                          <button
                                                            onClick={() =>
                                                              saveWarehouseQuantity(
                                                                entry.id
                                                              )
                                                            }
                                                            className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                                                          >
                                                            Save
                                                          </button>
                                                          <button
                                                            onClick={() => {
                                                              setEditingWarehouseQty(
                                                                (prev) => {
                                                                  const newSet =
                                                                    new Set(prev);
                                                                  newSet.delete(
                                                                    entry.id
                                                                  );
                                                                  return newSet;
                                                                }
                                                              );
                                                              setLocalWarehouseQty(
                                                                (prev) => {
                                                                  const newQty = {
                                                                    ...prev,
                                                                  };
                                                                  delete newQty[
                                                                    entry.id
                                                                  ];
                                                                  return newQty;
                                                                }
                                                              );
                                                            }}
                                                            className="px-2 py-1 bg-gray-400 text-white text-xs rounded hover:bg-gray-500"
                                                          >
                                                            Cancel
                                                          </button>
                                                        </div>
                                                      ) : (
                                                        <div className="flex space-x-1">
                                                          <button
                                                            onClick={() => {
                                                              setEditingWarehouseQty(
                                                                (prev) =>
                                                                  new Set(prev).add(
                                                                    entry.id
                                                                  )
                                                              );
                                                              setLocalWarehouseQty(
                                                                (prev) => ({
                                                                  ...prev,
                                                                  [entry.id]:
                                                                    parseFloat(
                                                                      entry?.qty ||
                                                                      "0"
                                                                    ),
                                                                })
                                                              );
                                                            }}
                                                            className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                                                          >
                                                            Edit
                                                          </button>
                                                          <button
                                                            onClick={() => removeCurrentWarehouseEntry(entry.id)}
                                                            className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                                                            title="Remove warehouse allocation"
                                                          >
                                                            Remove
                                                          </button>
                                                        </div>
                                                      )}
                                                    </td>
                                                  </tr>
                                                );
                                              })
                                            ) : (
                                              <tr>
                                                <td colSpan={5} className="py-4 text-center text-gray-500 text-sm">
                                                  No warehouse allocations yet. Click "+ Add Warehouse" above to add allocations.
                                                </td>
                                              </tr>
                                            )}
                                          </tbody>
                                        </table>

                                        {/* Add/Edit new warehouse allocations */}
                                        {allocations.length > 0 && (
                                          <>
                                            <h5 className="text-sm font-medium text-gray-700 mb-2">
                                              Additional Allocations:
                                            </h5>
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
                                                </tr>
                                              </thead>
                                              <tbody>
                                                {allocations.map(
                                                  (allocation) => (
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
                                                                key={
                                                                  warehouse.id
                                                                }
                                                                value={
                                                                  warehouse.id
                                                                }
                                                              >
                                                                {
                                                                  warehouse.warehouse_name
                                                                }
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
                                                          max={totalQty}
                                                        />
                                                      </td>
                                                      <td className="py-2 px-3">
                                                        <button
                                                          onClick={() =>
                                                            removeWarehouseAllocation(
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
                                                    </tr>
                                                  )
                                                )}
                                              </tbody>
                                            </table>
                                          </>
                                        )}
                                        {allocations.length === 0 && (
                                          <div className="text-center py-4 text-gray-500 text-sm">
                                            No additional warehouse allocations
                                            yet. Click "+ Add Warehouse" button above to
                                            add allocations.
                                          </div>
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

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">
                        Subtotal:
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        ₹{subtotalAmount.toLocaleString()}
                      </span>
                    </div>

                    {formData.cgst > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600">
                          CGST ({formData.cgst}%):
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          ₹{cgstAmount.toLocaleString()}
                        </span>
                      </div>
                    )}

                    {formData.sgst > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600">
                          SGST ({formData.sgst}%):
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          ₹{sgstAmount.toLocaleString()}
                        </span>
                      </div>
                    )}

                    {formData.igst > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600">
                          IGST ({formData.igst}%):
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          ₹{igstAmount.toLocaleString()}
                        </span>
                      </div>
                    )}

                    <hr className="border-gray-300" />
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
              </>
            )}
          </div>

          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              CANCEL
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              SAVE
            </button>
          </div>
        </div>
      </div>

      {/* Add Item Modal */}
      {showAddItemModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[999]">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <ShoppingCart className="w-6 h-6 text-green-600" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Add Items to Purchase Order
                </h2>
              </div>
              <button
                onClick={handleCloseAddItemModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {loadingItems && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <span className="ml-3 text-gray-600">
                    Loading available items...
                  </span>
                </div>
              )}

              {!loadingItems && (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search items by name or code..."
                          value={itemSearchTerm}
                          onChange={(e) => setItemSearchTerm(e.target.value)}
                          className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-80"
                        />
                      </div>
                      <span className="text-sm text-gray-600">
                        {filteredAvailableItems.length} items available
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={handleSelectAllItems}
                        className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        {selectedItems.size === filteredAvailableItems.length
                          ? "Deselect All"
                          : "Select All"}
                      </button>
                      <span className="text-sm text-gray-600">
                        {selectedItems.size} selected
                      </span>
                    </div>
                  </div>

                  <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                    <table className="w-full">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">
                            <input
                              type="checkbox"
                              checked={
                                selectedItems.size ===
                                filteredAvailableItems.length &&
                                filteredAvailableItems.length > 0
                              }
                              onChange={handleSelectAllItems}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                          </th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">
                            Item Code
                          </th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">
                            Item Name
                          </th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">
                            HSN Code
                          </th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">
                            UOM
                          </th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">
                            Category
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAvailableItems.map((item) => (
                          <tr
                            key={item.id}
                            className={`border-t border-gray-200 hover:bg-gray-50 cursor-pointer ${selectedItems.has(item.id) ? "bg-blue-50" : ""
                              }`}
                            onClick={() => handleItemSelection(item.id)}
                          >
                            <td className="py-3 px-4">
                              <input
                                type="checkbox"
                                checked={selectedItems.has(item.id)}
                                onChange={() => handleItemSelection(item.id)}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </td>
                            <td className="py-3 px-4 font-medium text-gray-900">
                              {item.item_code}
                            </td>
                            <td className="py-3 px-4 text-gray-600">
                              {item.item_name}
                            </td>
                            <td className="py-3 px-4 text-gray-600">
                              {item.hsn_code || "N/A"}
                            </td>
                            <td className="py-3 px-4 text-gray-600">
                              {item.uom_value || "N/A"}
                            </td>
                            <td className="py-3 px-4 text-gray-600">
                              {item.category_name || "N/A"}
                            </td>
                          </tr>
                        ))}
                        {filteredAvailableItems.length === 0 && (
                          <tr>
                            <td
                              colSpan={6}
                              className="py-8 text-center text-gray-500"
                            >
                              {itemSearchTerm
                                ? "No items found matching your search."
                                : "No items available."}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {selectedItems.size > 0 && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-blue-800">
                          {selectedItems.size} item
                          {selectedItems.size !== 1 ? "s" : ""} selected
                        </span>
                        <div className="text-xs text-blue-600">
                          Note: Selected items will be added with default rate
                          of ₹0 and quantity of 1. You can edit these values
                          after adding.
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={handleCloseAddItemModal}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSelectedItems}
                disabled={selectedItems.size === 0}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Add {selectedItems.size} Item
                {selectedItems.size !== 1 ? "s" : ""}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AmendPOModal;
