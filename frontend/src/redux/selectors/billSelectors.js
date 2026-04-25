// Bills Selectors
export const selectBills = (state) => state.bills.data;
export const selectBillsLoading = (state) => state.bills.loading;
export const selectBillsError = (state) => state.bills.error;
export const selectSelectedBill = (state) => state.bills.selectedBill;
export const selectBillFilters = (state) => state.bills.filters;

export const selectFilteredBills = (state) => {
  const bills = state.bills.data;
  const { search, status, sortBy } = state.bills.filters;

  let filtered = bills;

  if (search) {
    filtered = filtered.filter((bill) =>
      bill.billNo?.toLowerCase().includes(search.toLowerCase()) ||
      bill.customerName?.toLowerCase().includes(search.toLowerCase())
    );
  }

  if (status !== "all") {
    filtered = filtered.filter((bill) => bill.status === status);
  }

  if (sortBy === "date") {
    filtered = [...filtered].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );
  }

  return filtered;
};

export const selectBillsByCustomer = (state, customerId) => {
  return state.bills.data.filter((bill) => bill.customerId === customerId);
};
