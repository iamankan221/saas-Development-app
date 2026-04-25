// Inventory Selectors
export const selectInventory = (state) => state.inventory.data;
export const selectInventoryLoading = (state) => state.inventory.loading;
export const selectInventoryError = (state) => state.inventory.error;
export const selectSelectedInventoryItem = (state) => state.inventory.selectedItem;
export const selectInventoryFilters = (state) => state.inventory.filters;

export const selectFilteredInventory = (state) => {
  const inventory = state.inventory.data;
  const { search, category, sortBy } = state.inventory.filters;

  let filtered = inventory;

  if (search) {
    filtered = filtered.filter((item) =>
      item.name?.toLowerCase().includes(search.toLowerCase())
    );
  }

  if (category !== "all") {
    filtered = filtered.filter((item) => item.category === category);
  }

  if (sortBy === "name") {
    filtered = [...filtered].sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }

  return filtered;
};

export const selectLowStockItems = (state) => {
  return state.inventory.data.filter((item) => item.quantity <= item.threshold);
};
