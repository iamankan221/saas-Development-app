/**
 * EXAMPLE: Customers Component with Redux Integration
 * This file demonstrates best practices for using Redux in production
 */

import { useEffect } from "react";
import { useAppDispatch, useCustomers } from "../hooks/useRedux";
import { fetchCustomers, setSearchFilter } from "../redux/slices/customersSlice";
import { selectFilteredCustomers } from "../redux/selectors/customerSelectors";
import { useAppSelector } from "../hooks/useRedux";

// Simple loading skeleton
function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-12 bg-gray-200 rounded animate-pulse" />
      ))}
    </div>
  );
}

// Error display component
function ErrorDisplay({ error, onRetry }) {
  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded">
      <p className="text-red-700 mb-2">Error: {error}</p>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
      >
        Retry
      </button>
    </div>
  );
}

// Main component
export default function CustomersExample() {
  // 1. Get dispatch
  const dispatch = useAppDispatch();

  // 2. Get data from Redux using custom hook
  const { customers: allCustomers, loading, error } = useCustomers();

  // 3. Get filtered data using selector
  const filteredCustomers = useAppSelector(selectFilteredCustomers);

  // 4. Get search filter
  const searchFilter = useAppSelector((state) => state.customers.filters.search);

  // 5. Fetch data on component mount
  useEffect(() => {
    dispatch(fetchCustomers());
  }, [dispatch]);

  // 6. Handle search
  const handleSearch = (e) => {
    const value = e.target.value;
    dispatch(setSearchFilter(value));
  };

  // 7. Render states
  if (loading && allCustomers.length === 0) {
    return <LoadingSkeleton />;
  }

  if (error && allCustomers.length === 0) {
    return (
      <ErrorDisplay
        error={error}
        onRetry={() => dispatch(fetchCustomers())}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <input
        type="text"
        placeholder="Search customers..."
        value={searchFilter}
        onChange={handleSearch}
        className="w-full px-4 py-2 border rounded"
      />

      {/* Results Count */}
      <p className="text-sm text-gray-600">
        Showing {filteredCustomers.length} of {allCustomers.length} customers
      </p>

      {/* Empty State */}
      {filteredCustomers.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {allCustomers.length === 0 ? "No customers found" : "No results match your search"}
        </div>
      ) : (
        /* Customer List */
        <div className="space-y-2">
          {filteredCustomers.map((customer) => (
            <div
              key={customer.id}
              className="p-4 border rounded hover:bg-gray-50 cursor-pointer"
            >
              <h3 className="font-semibold">{customer.name}</h3>
              <p className="text-sm text-gray-600">{customer.email}</p>
              <p className="text-sm text-gray-600">{customer.phone}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * KEY PATTERNS TO FOLLOW:
 *
 * 1. USE CUSTOM HOOKS
 *    - useCustomers() provides data, loading, error
 *    - useAppDispatch() provides dispatch
 *    - useAppSelector() for direct selector access
 *
 * 2. FETCH DATA IN useEffect
 *    - Only fetch once on mount
 *    - Include dispatch in dependency array
 *
 * 3. USE SELECTORS FOR DERIVED STATE
 *    - selectFilteredCustomers already handles filtering logic
 *    - Prevents re-renders and keeps components clean
 *
 * 4. HANDLE LOADING/ERROR STATES
 *    - Check loading && data.length === 0 (initial load)
 *    - Check error && data.length === 0 (initial error)
 *    - Show retry button on error
 *
 * 5. DISPATCH ACTIONS FROM EVENT HANDLERS
 *    - dispatch(setSearchFilter(value))
 *    - dispatch(fetchCustomers())
 *
 * 6. DISPLAY EMPTY STATES
 *    - No results from search
 *    - No data from API
 */
