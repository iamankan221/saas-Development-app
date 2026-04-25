// Common utility functions for Redux
export const createStatusObject = (status = "idle", error = null, data = null) => ({
  status,
  error,
  data,
});

export const handleAsyncThunk = (state, action, key = "data") => {
  state.loading = false;
  state.error = null;
};

export const handleAsyncThunkPending = (state) => {
  state.loading = true;
  state.error = null;
};

export const handleAsyncThunkFulfilled = (state, action, key = "data") => {
  state.loading = false;
  state[key] = action.payload;
  state.lastUpdated = new Date().toISOString();
};

export const handleAsyncThunkRejected = (state, action) => {
  state.loading = false;
  state.error = action.payload || "An error occurred";
};

// Normalize data by ID for more efficient lookups
export const normalizeData = (data, idKey = "id") => {
  const byId = {};
  const ids = [];

  data.forEach((item) => {
    byId[item[idKey]] = item;
    ids.push(item[idKey]);
  });

  return { byId, ids };
};

// Search utility
export const searchData = (data, query, searchFields = ["name"]) => {
  if (!query || query.trim() === "") return data;

  const lowerQuery = query.toLowerCase();
  return data.filter((item) =>
    searchFields.some((field) =>
      String(item[field]).toLowerCase().includes(lowerQuery)
    )
  );
};

// Sort utility
export const sortData = (data, sortBy, sortField = "name", ascending = true) => {
  if (!sortBy) return data;

  return [...data].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];

    if (typeof aVal === "string") {
      return ascending ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }

    return ascending ? aVal - bVal : bVal - aVal;
  });
};

// Debounce for async actions
export const debounce = (func, delay) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
};

// Check if data needs refresh
export const isDataStale = (lastUpdated, maxAge = 5 * 60 * 1000) => {
  if (!lastUpdated) return true;
  return Date.now() - new Date(lastUpdated).getTime() > maxAge;
};
