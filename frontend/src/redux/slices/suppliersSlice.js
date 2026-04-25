import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchSuppliers as fetchSuppliersAPI } from "../../services/supplierService";

const initialState = {
  data: [],
  loading: false,
  error: null,
  selectedSupplier: null,
  lastUpdated: null,
  filters: {
    search: "",
    status: "all",
    sortBy: "name",
  },
};

export const fetchSuppliers = createAsyncThunk(
  "suppliers/fetchSuppliers",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetchSuppliersAPI();
      return response;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch suppliers");
    }
  }
);

const suppliersSlice = createSlice({
  name: "suppliers",
  initialState,
  reducers: {
    setSelectedSupplier: (state, action) => {
      state.selectedSupplier = action.payload;
    },
    setSearchFilter: (state, action) => {
      state.filters.search = action.payload;
    },
    setStatusFilter: (state, action) => {
      state.filters.status = action.payload;
    },
    setSortBy: (state, action) => {
      state.filters.sortBy = action.payload;
    },
    clearSuppliers: (state) => {
      state.data = [];
      state.selectedSupplier = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSuppliers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSuppliers.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchSuppliers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  setSelectedSupplier,
  setSearchFilter,
  setStatusFilter,
  setSortBy,
  clearSuppliers,
} = suppliersSlice.actions;

export default suppliersSlice.reducer;
