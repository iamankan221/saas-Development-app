import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchCustomers as fetchCustomersAPI } from "../../services/customerService";

const initialState = {
  data: [],
  loading: false,
  error: null,
  selectedCustomer: null,
  lastUpdated: null,
  filters: {
    search: "",
    sortBy: "name",
  },
};

export const fetchCustomers = createAsyncThunk(
  "customers/fetchCustomers",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetchCustomersAPI();
      return response;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch customers");
    }
  }
);

const customersSlice = createSlice({
  name: "customers",
  initialState,
  reducers: {
    setSelectedCustomer: (state, action) => {
      state.selectedCustomer = action.payload;
    },
    setSearchFilter: (state, action) => {
      state.filters.search = action.payload;
    },
    setSortBy: (state, action) => {
      state.filters.sortBy = action.payload;
    },
    clearCustomers: (state) => {
      state.data = [];
      state.selectedCustomer = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCustomers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setSelectedCustomer, setSearchFilter, setSortBy, clearCustomers } =
  customersSlice.actions;

export default customersSlice.reducer;
