import request from "./apiClient";

const safeRequest = async (executor) => {
  try {
    return await executor();
  } catch (error) {
    return { success: false, error: error.message };
  }
};

const mapPart = (part = {}) => {
  const minStock = 5;
  const maxStock = Math.max((part.stock || 0) + 20, 20);
  let status = "In Stock";
  if ((part.stock || 0) === 0) status = "Out of Stock";
  else if ((part.stock || 0) <= Math.ceil(minStock * 0.6)) status = "Critical";
  else if ((part.stock || 0) <= minStock) status = "Low Stock";

  return {
    id: part.id,
    name: part.name,
    itemName: part.name,
    category: "Bike Spare Parts",
    sku: `PART-${part.id}`,
    brand: "Generic",
    model: "Standard",
    currentStock: Number(part.stock || 0),
    minStock,
    maxStock,
    unitPrice: Number(part.price || 0),
    totalValue: Number(part.stock || 0) * Number(part.price || 0),
    supplier: "Default Supplier",
    location: "Main Store",
    status,
    severity: status === "Out of Stock" ? "critical" : status === "Critical" ? "high" : "medium",
    lastRestocked: new Date().toISOString(),
    description: part.name,
  };
};

const applyFilters = (rows, filters = {}) => {
  let list = [...rows];
  if (filters.category && filters.category !== "All") {
    list = list.filter((item) => item.category === filters.category);
  }
  if (filters.status && filters.status !== "All") {
    list = list.filter((item) => item.status === filters.status);
  }
  if (filters.search) {
    const search = filters.search.toLowerCase();
    list = list.filter(
      (item) =>
        item.name.toLowerCase().includes(search) ||
        item.sku.toLowerCase().includes(search) ||
        item.category.toLowerCase().includes(search)
    );
  }
  return list;
};

export const inventoryApi = {
  getAllItems: async (filters = {}) => {
    return safeRequest(async () => {
      const response = await request("/inventory/parts?limit=100");
      const rows = (response.data?.rows || []).map(mapPart);
      const filtered = applyFilters(rows, filters);
      return { success: true, data: filtered, total: filtered.length };
    });
  },

  getItemById: async (itemId) => {
    const all = await inventoryApi.getAllItems();
    if (!all.success) return all;
    const item = all.data.find((i) => String(i.id) === String(itemId));
    if (!item) return { success: false, error: "Item not found" };
    return { success: true, data: item };
  },

  addItem: async (itemData) => {
    return safeRequest(async () => {
      const response = await request("/inventory/parts", {
        method: "POST",
        body: JSON.stringify({
          name: itemData.name,
          stock: Number(itemData.currentStock || 0),
          price: Number(itemData.unitPrice || 0),
        }),
      });
      return { success: true, data: mapPart(response.data?.part || {}), message: "Item added successfully" };
    });
  },

  updateItem: async (itemId, updateData) => {
    return safeRequest(async () => {
      const response = await request("/inventory/parts", {
        method: "POST",
        body: JSON.stringify({
          id: Number(itemId),
          name: updateData.name,
          stock: Number(updateData.currentStock || 0),
          price: Number(updateData.unitPrice || 0),
        }),
      });
      return { success: true, data: mapPart(response.data?.part || {}), message: "Item updated successfully" };
    });
  },

  deleteItem: async () => {
    return { success: false, error: "Delete item endpoint not available" };
  },

  restockItem: async (itemId, quantity) => {
    return safeRequest(async () => {
      const current = await inventoryApi.getItemById(itemId);
      if (!current.success) return current;
      const newStock = current.data.currentStock + Number(quantity || 0);
      const response = await request("/inventory/parts", {
        method: "POST",
        body: JSON.stringify({
          id: Number(itemId),
          stock: newStock,
        }),
      });
      return {
        success: true,
        data: mapPart(response.data?.part || {}),
        message: `Successfully restocked ${quantity} units`,
      };
    });
  },

  getLowStockAlerts: async () => {
    const response = await inventoryApi.getAllItems();
    if (!response.success) return response;
    const alerts = response.data.filter((item) => item.currentStock <= item.minStock);
    return { success: true, data: alerts, count: alerts.length };
  },

  getInventoryAlerts: async () => {
    const response = await inventoryApi.getLowStockAlerts();
    if (!response.success) return response;
    return {
      success: true,
      data: response.data.map((item) => ({
        id: item.id,
        itemName: item.name,
        currentStock: item.currentStock,
        minStock: item.minStock,
        severity: item.severity,
      })),
    };
  },

  getSuppliers: async () => {
    return {
      success: true,
      data: [
        {
          id: "SUP001",
          name: "Default Supplier",
          contact: "+91 9000000000",
          email: "supplier@example.com",
          address: "Local Market",
          rating: 4.4,
          deliveryTime: "2-3 days",
        },
      ],
    };
  },

  getReorderSuggestions: async () => {
    const response = await inventoryApi.getLowStockAlerts();
    if (!response.success) return response;

    const suggestions = response.data.map((item) => ({
      ...item,
      suggestedQuantity: Math.max(item.maxStock - item.currentStock, item.minStock),
      urgency: item.currentStock === 0 ? "Critical" : "High",
      estimatedCost: Math.max(item.maxStock - item.currentStock, item.minStock) * item.unitPrice,
    }));

    return { success: true, data: suggestions };
  },
};

export const getInventoryItems = inventoryApi.getAllItems;
export const getInventoryAlerts = inventoryApi.getInventoryAlerts;
export const updateInventoryItem = inventoryApi.updateItem;
export const addInventoryItem = inventoryApi.addItem;
export const deleteInventoryItem = inventoryApi.deleteItem;
export const restockItem = inventoryApi.restockItem;
export const getSuppliers = inventoryApi.getSuppliers;
export const getReorderSuggestions = inventoryApi.getReorderSuggestions;

export default inventoryApi;
