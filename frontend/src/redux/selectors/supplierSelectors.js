// Suppliers Selectors
export const selectSuppliers = (state) => state.suppliers.data;
export const selectSuppliersLoading = (state) => state.suppliers.loading;
export const selectSuppliersError = (state) => state.suppliers.error;
export const selectSelectedSupplier = (state) => state.suppliers.selectedSupplier;
export const selectSupplierFilters = (state) => state.suppliers.filters;

export const selectFilteredSuppliers = (state) => {
  const suppliers = state.suppliers.data;
  const { search, status, sortBy } = state.suppliers.filters;

  let filtered = suppliers;

  if (search) {
    filtered = filtered.filter((supplier) =>
      supplier.name?.toLowerCase().includes(search.toLowerCase())
    );
  }

  if (status !== "all") {
    filtered = filtered.filter((supplier) => supplier.status === status);
  }

  if (sortBy === "name") {
    filtered = [...filtered].sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }

  return filtered;
};

export const selectActiveSuppliers = (state) => {
  return state.suppliers.data.filter((supplier) => supplier.status === "active");
};
