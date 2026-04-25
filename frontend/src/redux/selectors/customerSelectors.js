// Customers Selectors
export const selectCustomers = (state) => state.customers.data;
export const selectCustomersLoading = (state) => state.customers.loading;
export const selectCustomersError = (state) => state.customers.error;
export const selectSelectedCustomer = (state) => state.customers.selectedCustomer;
export const selectCustomerFilters = (state) => state.customers.filters;

export const selectFilteredCustomers = (state) => {
  const customers = state.customers.data;
  const { search, sortBy } = state.customers.filters;

  let filtered = customers;

  if (search) {
    filtered = filtered.filter((customer) =>
      customer.name?.toLowerCase().includes(search.toLowerCase())
    );
  }

  if (sortBy === "name") {
    filtered = [...filtered].sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }

  return filtered;
};
